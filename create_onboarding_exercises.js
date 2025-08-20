// Script per creare gli esercizi di onboarding
// Esegui con: node create_onboarding_exercises.js

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccount.json'); // Metti qui il tuo service account JSON

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const onboardingExercises = [
  {
    position: 1,
    title: 'Il risveglio del campione',
    description: 'Inizia la giornata con la mentalità giusta. Questo esercizio ti aiuta a impostare il tuo mindset vincente fin dal risveglio.',
    category: 'MATTINA',
    categoryEmoji: '🌅',
    duration: '5-10 min',
    difficulty: 'Principiante',
    isOnboarding: true,
    isActive: true,
    elements: [
      {
        id: 'morning_feeling',
        type: 'radio',
        title: 'Come ti senti al risveglio?',
        description: 'Scegli la risposta che descrive meglio il tuo stato d\'animo mattutino',
        options: ['Energico e motivato', 'Tranquillo ma determinato', 'Un po\' stanco ma pronto', 'Ho bisogno di tempo per carircarmi']
      },
      {
        id: 'morning_intention',
        type: 'textarea',
        title: 'Qual è la tua intenzione per oggi?',
        description: 'Scrivi cosa vuoi ottenere oggi, sia nello sport che nella vita'
      }
    ]
  },
  {
    position: 2,
    title: 'Preparazione mentale',
    description: 'La preparazione mentale è fondamentale prima di ogni performance. Impara a entrare nella zona giusta.',
    category: 'PRE-GARA',
    categoryEmoji: '🎯',
    duration: '10-15 min',
    difficulty: 'Principiante',
    isOnboarding: true,
    isActive: true,
    elements: [
      {
        id: 'pre_game_visualization',
        type: 'textarea',
        title: 'Visualizza la tua performance perfetta',
        description: 'Descrivi nei dettagli come vedi te stesso performare al meglio'
      },
      {
        id: 'pre_game_confidence',
        type: 'radio',
        title: 'Quanto ti senti sicuro delle tue capacità?',
        options: ['Molto sicuro', 'Abbastanza sicuro', 'Un po\' insicuro', 'Devo lavorare sulla fiducia']
      }
    ]
  },
  {
    position: 3,
    title: 'Trova la tua forza',
    description: 'Scopri le tue fonti di motivazione più profonde e impara ad attingervi nei momenti difficili.',
    category: 'MOTIVAZIONE',
    categoryEmoji: '💪',
    duration: '8-12 min',
    difficulty: 'Principiante',
    isOnboarding: true,
    isActive: true,
    elements: [
      {
        id: 'motivation_source',
        type: 'textarea',
        title: 'Cosa ti motiva di più?',
        description: 'Descrivi la tua fonte di motivazione più potente'
      },
      {
        id: 'difficult_moments',
        type: 'textarea',
        title: 'Come affronti i momenti difficili?',
        description: 'Racconta una strategia che usi quando tutto sembra andare male'
      }
    ]
  },
  {
    position: 4,
    title: 'Focus assoluto',
    description: 'La concentrazione è l\'arma segreta di ogni campione. Allenala con questo esercizio.',
    category: 'CONCENTRAZIONE',
    categoryEmoji: '🧠',
    duration: '10-15 min',
    difficulty: 'Intermedio',
    isOnboarding: true,
    isActive: true,
    elements: [
      {
        id: 'focus_technique',
        type: 'radio',
        title: 'Quale tecnica di concentrazione preferisci?',
        options: ['Respirazione profonda', 'Visualizzazione', 'Ripetizione di mantra', 'Focus su un punto specifico']
      },
      {
        id: 'distraction_management',
        type: 'textarea',
        title: 'Come gestisci le distrazioni?',
        description: 'Descrivi la tua strategia per mantenere il focus quando ci sono distrazioni'
      }
    ]
  },
  {
    position: 5,
    title: 'Credi in te stesso',
    description: 'La fiducia in se stessi è la base di ogni successo. Costruisci la tua autostima con questo esercizio.',
    category: 'FIDUCIA',
    categoryEmoji: '🏆',
    duration: '7-10 min',
    difficulty: 'Principiante',
    isOnboarding: true,
    isActive: true,
    elements: [
      {
        id: 'past_success',
        type: 'textarea',
        title: 'Racconta un tuo successo di cui sei fiero',
        description: 'Descrivi nei dettagli un momento in cui hai raggiunto un obiettivo importante'
      },
      {
        id: 'self_confidence',
        type: 'radio',
        title: 'Come valuti la tua fiducia in te stesso?',
        options: ['Molto alta', 'Buona', 'Altalenante', 'Da migliorare']
      }
    ]
  },
  {
    position: 6,
    title: 'Carica la batteria',
    description: 'Impara a gestire e ottimizzare i tuoi livelli di energia per performance costanti.',
    category: 'ENERGIA',
    categoryEmoji: '⚡',
    duration: '5-8 min',
    difficulty: 'Principiante',
    isOnboarding: true,
    isActive: true,
    elements: [
      {
        id: 'energy_level',
        type: 'radio',
        title: 'Come sono i tuoi livelli di energia di solito?',
        options: ['Sempre alti', 'Buoni la mattina, calano la sera', 'Altalenanti', 'Spesso bassi']
      },
      {
        id: 'energy_boost',
        type: 'textarea',
        title: 'Cosa ti dà più energia?',
        description: 'Descrivi attività, pensieri o rituali che ti ricaricano'
      }
    ]
  },
  {
    position: 7,
    title: 'Onora i tuoi successi',
    description: 'Imparare a celebrare i propri successi è fondamentale per costruire una mentalità vincente.',
    category: 'CELEBRAZIONE',
    categoryEmoji: '🎉',
    duration: '8-10 min',
    difficulty: 'Principiante',
    isOnboarding: true,
    isActive: true,
    elements: [
      {
        id: 'celebration_style',
        type: 'radio',
        title: 'Come celebri i tuoi successi?',
        options: ['Con entusiasmo e orgoglio', 'In modo riservato', 'Penso subito al prossimo obiettivo', 'Non li celebro molto']
      },
      {
        id: 'success_reflection',
        type: 'textarea',
        title: 'Rifletti su questo percorso',
        description: 'Cosa hai imparato completando questi 7 esercizi fondamentali?'
      }
    ]
  }
];

async function createOnboardingExercises() {
  console.log('🚀 Creazione esercizi di onboarding...');
  
  try {
    for (const exercise of onboardingExercises) {
      const docRef = await db.collection('exercises').add({
        ...exercise,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Creato esercizio: "${exercise.title}" con ID: ${docRef.id}`);
    }
    
    console.log('🎉 Tutti gli esercizi di onboarding sono stati creati con successo!');
    
  } catch (error) {
    console.error('❌ Errore nella creazione degli esercizi:', error);
  }
}

// Esegui lo script
createOnboardingExercises()
  .then(() => {
    console.log('Script completato!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Errore script:', error);
    process.exit(1);
  });