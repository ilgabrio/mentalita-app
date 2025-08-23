import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51MitiEHzDfbjshJt8mgvYDWl4ThGswqtYXL4NmSeNKgo9GWc2psHXmMXErby9K00Tfdpb8qC0xAM8MLyr7gLISkx00P9JfLs6d';

// Cache per Stripe
let stripePromise = null;

// Inizializza Stripe
const getStripePromise = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
    console.log('✅ Stripe inizializzato');
  }
  return stripePromise;
};

// Funzione per creare una sessione di checkout direttamente con Stripe
export const createCheckoutSession = async (planId, billingPeriod) => {
  try {
    console.log('💳 Creating direct Stripe checkout for:', { planId, billingPeriod });
    
    // Per ora facciamo un redirect semplice a Stripe con payment links
    // Determina l'URL basato sul periodo di fatturazione
    let checkoutUrl;
    
    if (billingPeriod === 'monthly') {
      // Payment link per €19/mese
      checkoutUrl = 'https://buy.stripe.com/00wcN5bxJ5u43eM49A7Vm00';
    } else {
      // Payment link per €149/anno  
      checkoutUrl = 'https://buy.stripe.com/cNifZhcBN4q002A8pQ7Vm01';
    }
    
    // Redirect diretto al payment link
    console.log('🔗 Redirecting to Stripe payment link:', checkoutUrl);
    window.location.href = checkoutUrl;
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Export della funzione principale
export default {
  createCheckoutSession
};