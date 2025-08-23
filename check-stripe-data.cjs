const admin = require('firebase-admin');

// Inizializza Firebase Admin
admin.initializeApp({
  projectId: 'be-water-2eb26'
});

const db = admin.firestore();

async function checkStripeData() {
  console.log('🔍 Controllo dati Stripe...\n');
  
  try {
    // Controlla configurazione Stripe
    console.log('📝 Configurazione Stripe:');
    const stripeConfigDoc = await db.collection('siteSettings').doc('stripeConfig').get();
    if (stripeConfigDoc.exists) {
      const config = stripeConfigDoc.data();
      console.log('✅ Trovata configurazione Stripe');
      console.log(`   - publishableKey: ${config.publishableKey ? 'Presente' : 'Mancante'}`);
      console.log(`   - secretKey: ${config.secretKey ? 'Presente' : 'Mancante'}`);
      console.log(`   - webhookSecret: ${config.webhookSecret ? 'Presente' : 'Mancante'}`);
    } else {
      console.log('❌ Configurazione Stripe non trovata');
    }
    
    console.log('\n📋 Piani Premium:');
    const plansSnapshot = await db.collection('premiumPlans').get();
    if (plansSnapshot.empty) {
      console.log('❌ Nessun piano Premium trovato');
    } else {
      console.log(`✅ Trovati ${plansSnapshot.size} piani Premium:`);
      plansSnapshot.docs.forEach((doc, index) => {
        const plan = doc.data();
        console.log(`   ${index + 1}. ${plan.name || 'Senza nome'} - €${plan.monthlyPrice || 0}/mese`);
      });
    }
    
    console.log('\n💳 Subscriptions attive:');
    const subsSnapshot = await db.collection('subscriptions')
      .where('status', '==', 'active')
      .get();
    console.log(`Trovate ${subsSnapshot.size} subscription attive`);
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
  
  process.exit(0);
}

checkStripeData();