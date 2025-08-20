const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key);

admin.initializeApp();

// Creazione sessione di checkout per i pagamenti
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  try {
    // Verifica che l'utente sia autenticato
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to create checkout session.'
      );
    }

    const { planId, billingPeriod } = data;
    
    // Recupera i dettagli del piano dal database
    const planDoc = await admin.firestore()
      .collection('premiumPlans')
      .doc(planId)
      .get();
    
    if (!planDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Plan not found.'
      );
    }
    
    const plan = planDoc.data();
    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    
    // Crea la sessione di checkout Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Piano ${plan.name}`,
              description: `Accesso premium per ${billingPeriod === 'monthly' ? '1 mese' : '1 anno'}`,
            },
            unit_amount: Math.round(price * 100), // Stripe usa centesimi
            recurring: {
              interval: billingPeriod === 'monthly' ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${data.origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${data.origin}/premium`,
      customer_email: context.auth.token.email,
      metadata: {
        userId: context.auth.uid,
        planId: planId,
        billingPeriod: billingPeriod,
      },
    });

    return { sessionId: session.id };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Unable to create checkout session.'
    );
  }
});

// Webhook per gestire gli eventi Stripe
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = functions.config().stripe.webhook_secret;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gestisci gli eventi Stripe
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).send('OK');
});

// Gestione checkout completato
async function handleCheckoutSessionCompleted(session) {
  try {
    const { userId, planId, billingPeriod } = session.metadata;
    
    // Recupera i dettagli della subscription da Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    
    // Salva la subscription nel database
    await admin.firestore().collection('subscriptions').add({
      userId: userId,
      planId: planId,
      billingPeriod: billingPeriod,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer,
      status: 'active',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      createdAt: new Date(),
    });

    // Aggiorna il profilo utente con lo stato premium
    await admin.firestore().collection('users').doc(userId).update({
      isPremium: true,
      premiumPlan: planId,
      premiumActivatedAt: new Date(),
    });

    console.log(`Premium activated for user ${userId} with plan ${planId}`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

// Gestione aggiornamento subscription
async function handleSubscriptionUpdated(subscription) {
  try {
    const subscriptionDoc = await admin.firestore()
      .collection('subscriptions')
      .where('stripeSubscriptionId', '==', subscription.id)
      .get();
    
    if (!subscriptionDoc.empty) {
      const docRef = subscriptionDoc.docs[0].ref;
      await docRef.update({
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

// Gestione cancellazione subscription
async function handleSubscriptionDeleted(subscription) {
  try {
    const subscriptionDoc = await admin.firestore()
      .collection('subscriptions')
      .where('stripeSubscriptionId', '==', subscription.id)
      .get();
    
    if (!subscriptionDoc.empty) {
      const subscriptionData = subscriptionDoc.docs[0].data();
      const docRef = subscriptionDoc.docs[0].ref;
      
      // Aggiorna lo stato della subscription
      await docRef.update({
        status: 'cancelled',
        cancelledAt: new Date(),
      });

      // Rimuovi lo stato premium dall'utente
      await admin.firestore().collection('users').doc(subscriptionData.userId).update({
        isPremium: false,
        premiumPlan: null,
        premiumCancelledAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

// Gestione pagamento riuscito
async function handlePaymentSucceeded(invoice) {
  try {
    if (invoice.subscription) {
      const subscriptionDoc = await admin.firestore()
        .collection('subscriptions')
        .where('stripeSubscriptionId', '==', invoice.subscription)
        .get();
      
      if (!subscriptionDoc.empty) {
        const docRef = subscriptionDoc.docs[0].ref;
        await docRef.update({
          lastPaymentAt: new Date(),
          status: 'active',
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

// Gestione pagamento fallito
async function handlePaymentFailed(invoice) {
  try {
    if (invoice.subscription) {
      const subscriptionDoc = await admin.firestore()
        .collection('subscriptions')
        .where('stripeSubscriptionId', '==', invoice.subscription)
        .get();
      
      if (!subscriptionDoc.empty) {
        const subscriptionData = subscriptionDoc.docs[0].data();
        const docRef = subscriptionDoc.docs[0].ref;
        
        await docRef.update({
          lastPaymentFailedAt: new Date(),
          status: 'past_due',
        });

        // Opzionalmente, rimuovi temporaneamente l'accesso premium
        // await admin.firestore().collection('users').doc(subscriptionData.userId).update({
        //   isPremium: false,
        // });
      }
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Funzione per recuperare informazioni sulla subscription
exports.getSubscriptionInfo = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated.'
      );
    }

    const userId = context.auth.uid;
    const subscriptionDoc = await admin.firestore()
      .collection('subscriptions')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();
    
    if (subscriptionDoc.empty) {
      return { hasActiveSubscription: false };
    }

    const subscription = subscriptionDoc.docs[0].data();
    return {
      hasActiveSubscription: true,
      subscription: {
        planId: subscription.planId,
        billingPeriod: subscription.billingPeriod,
        currentPeriodEnd: subscription.currentPeriodEnd,
        status: subscription.status,
      }
    };
  } catch (error) {
    console.error('Error getting subscription info:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Unable to get subscription info.'
    );
  }
});

// Funzione per cancellare una subscription
exports.cancelSubscription = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated.'
      );
    }

    const userId = context.auth.uid;
    const subscriptionDoc = await admin.firestore()
      .collection('subscriptions')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();
    
    if (subscriptionDoc.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'No active subscription found.'
      );
    }

    const subscriptionData = subscriptionDoc.docs[0].data();
    
    // Cancella la subscription su Stripe
    await stripe.subscriptions.update(subscriptionData.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    return { success: true, message: 'Subscription will be cancelled at the end of the current period.' };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Unable to cancel subscription.'
    );
  }
});