import { loadStripe } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Inizializza Stripe (sostituisci con la tua publishable key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdef');

// Inizializza Firebase Functions
const functions = getFunctions();

// Funzione per creare una sessione di checkout
export const createCheckoutSession = async (planId, billingPeriod) => {
  try {
    const createCheckout = httpsCallable(functions, 'createCheckoutSession');
    
    const result = await createCheckout({
      planId,
      billingPeriod,
      origin: window.location.origin
    });

    const { sessionId } = result.data;
    const stripe = await stripePromise;
    
    // Reindirizza a Stripe Checkout
    const { error } = await stripe.redirectToCheckout({
      sessionId: sessionId
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Funzione per ottenere informazioni sulla subscription
export const getSubscriptionInfo = async () => {
  try {
    const getSubInfo = httpsCallable(functions, 'getSubscriptionInfo');
    const result = await getSubInfo();
    return result.data;
  } catch (error) {
    console.error('Error getting subscription info:', error);
    throw error;
  }
};

// Funzione per cancellare una subscription
export const cancelSubscription = async () => {
  try {
    const cancelSub = httpsCallable(functions, 'cancelSubscription');
    const result = await cancelSub();
    return result.data;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

export default {
  createCheckoutSession,
  getSubscriptionInfo,
  cancelSubscription
};