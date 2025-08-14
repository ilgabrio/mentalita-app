// Script per aggiungere i campi mancanti agli esercizi
// Esegui con: node scripts/fix-exercises.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Configurazione Firebase (usa la stessa del tuo progetto)
const firebaseConfig = {
  apiKey: "AIzaSyBmhh2BhJ5LbV5F3p0Tt9HDNLM9gUBj8ag",
  authDomain: "be-water-2eb26.firebaseapp.com",
  projectId: "be-water-2eb26",
  storageBucket: "be-water-2eb26.appspot.com",
  messagingSenderId: "649404712717",
  appId: "1:649404712717:web:b8e5a6e0b4c8d9a1f2e3d4"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// STEP 1 - VERIFICA STRUTTURA ATTUALE
const verificaEsercizi = async () => {
  console.log('🔍 === VERIFICA STRUTTURA ESERCIZI ===\n');
  
  const snapshot = await getDocs(collection(db, 'exercises'));
  console.log(`📊 Totale esercizi nel database: ${snapshot.size}\n`);
  
  let contatoreSenzaFields = 0;
  
  snapshot.docs.forEach((docSnap, index) => {
    const data = docSnap.data();
    const hasPublished = 'isPublished' in data;
    const hasOrder = 'order' in data;
    const hasCreatedAt = 'createdAt' in data;
    
    if (!hasPublished || !hasOrder) contatoreSenzaFields++;
    
    console.log(`📋 Esercizio ${index + 1}: ${docSnap.id}`);
    console.log(`   Titolo: "${data.title || data.name || 'NESSUN TITOLO'}"`);
    console.log(`   📅 createdAt: ${hasCreatedAt ? '✅' : '❌'}`);
    console.log(`   📤 isPublished: ${hasPublished ? '✅' + (data.isPublished ? ' (true)' : ' (false)') : '❌ MANCA'}`);
    console.log(`   📊 order: ${hasOrder ? '✅ (' + data.order + ')' : '❌ MANCA'}`);
    console.log(`   🏷️ category: ${data.category || 'nessuna'}`);
    console.log(`   ⚡ elements: ${Array.isArray(data.elements) ? data.elements.length + ' elementi' : 'nessuno'}`);
    console.log('---');
  });
  
  console.log(`\n⚠️ Esercizi che necessitano aggiornamento: ${contatoreSenzaFields}/${snapshot.size}`);
  return snapshot;
};

// STEP 2 - AGGIORNA TUTTI GLI ESERCIZI
const aggiornaEsercizi = async () => {
  console.log('\n🔧 === AGGIORNAMENTO ESERCIZI ===\n');
  
  const snapshot = await getDocs(collection(db, 'exercises'));
  let contatore = 0;
  let aggiornati = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const aggiornamenti = {};
    const id = docSnap.id;
    
    console.log(`🔨 Elaborando esercizio ${contatore + 1}: ${id}`);
    console.log(`   Titolo: "${data.title || data.name || 'SENZA TITOLO'}"`);
    
    // Aggiungi isPublished se manca (default: true per esercizi esistenti)
    if (!('isPublished' in data)) {
      aggiornamenti.isPublished = true;
      console.log(`   ✅ Aggiungo isPublished = true`);
    }
    
    // Aggiungi order se manca (ordine sequenziale)
    if (!('order' in data)) {
      aggiornamenti.order = contatore * 10; // 0, 10, 20, 30...
      console.log(`   ✅ Aggiungo order = ${contatore * 10}`);
    }
    
    // Aggiungi createdAt se manca
    if (!('createdAt' in data)) {
      aggiornamenti.createdAt = new Date();
      console.log(`   ✅ Aggiungo createdAt = ${new Date().toISOString()}`);
    }
    
    // Aggiungi updatedAt
    aggiornamenti.updatedAt = new Date();
    
    // Normalizza il campo title se manca ma c'è name
    if (!data.title && data.name) {
      aggiornamenti.title = data.name;
      console.log(`   ✅ Copio name → title`);
    }
    
    // Esegui l'aggiornamento
    if (Object.keys(aggiornamenti).length > 1) { // Più di solo updatedAt
      try {
        await updateDoc(doc(db, 'exercises', id), aggiornamenti);
        console.log(`   ✅ AGGIORNATO con successo!`);
        aggiornati++;
      } catch (error) {
        console.log(`   ❌ ERRORE nell'aggiornamento:`, error.message);
      }
    } else {
      console.log(`   ⏭️ Già completo, solo updatedAt aggiornato`);
      await updateDoc(doc(db, 'exercises', id), { updatedAt: new Date() });
    }
    
    console.log('   ---');
    contatore++;
  }
  
  console.log(`\n🎉 COMPLETATO!`);
  console.log(`   📊 Esercizi elaborati: ${contatore}`);
  console.log(`   ✅ Esercizi aggiornati: ${aggiornati}`);
  return { totale: contatore, aggiornati };
};

// STEP 3 - TESTA LE QUERY CON GLI INDICI
const testaIndici = async () => {
  console.log('\n🧪 === TEST QUERY CON INDICI ===\n');
  
  // Test 1: Query con isPublished + order (dovrebbe funzionare con l'indice)
  try {
    console.log('🔍 Test 1: Query isPublished=true + orderBy(order)...');
    const { query, where, orderBy } = await import('firebase/firestore');
    
    const q1 = query(
      collection(db, 'exercises'),
      where('isPublished', '==', true),
      orderBy('order')
    );
    const snapshot1 = await getDocs(q1);
    console.log(`   ✅ Successo! Trovati ${snapshot1.size} esercizi pubblicati`);
    
    snapshot1.docs.slice(0, 3).forEach((docSnap, i) => {
      const data = docSnap.data();
      console.log(`   ${i + 1}. "${data.title}" (order: ${data.order})`);
    });
  } catch (error) {
    console.log(`   ❌ ERRORE:`, error.message);
    if (error.message.includes('index')) {
      console.log('      💡 L\'indice potrebbe non essere ancora disponibile. Riprova tra qualche minuto.');
    }
  }
  
  // Test 2: Query solo con isPublished
  try {
    console.log('\n🔍 Test 2: Query solo isPublished=true...');
    const { query, where } = await import('firebase/firestore');
    
    const q2 = query(
      collection(db, 'exercises'),
      where('isPublished', '==', true)
    );
    const snapshot2 = await getDocs(q2);
    console.log(`   ✅ Esercizi pubblicati: ${snapshot2.size}`);
  } catch (error) {
    console.log(`   ❌ ERRORE:`, error.message);
  }
  
  // Test 3: Query tutti gli esercizi (senza filtri)
  try {
    console.log('\n🔍 Test 3: Query tutti gli esercizi...');
    const snapshot3 = await getDocs(collection(db, 'exercises'));
    console.log(`   ✅ Esercizi totali: ${snapshot3.size}`);
    
    // Mostra i primi 3
    snapshot3.docs.slice(0, 3).forEach((docSnap, i) => {
      const data = docSnap.data();
      console.log(`   ${i + 1}. "${data.title}" (published: ${data.isPublished}, order: ${data.order})`);
    });
  } catch (error) {
    console.log(`   ❌ ERRORE:`, error.message);
  }
};

// STEP 4 - ESEGUI TUTTO
const main = async () => {
  console.log('🚀 === INIZIO SCRIPT FIX ESERCIZI ===\n');
  
  try {
    // Step 1: Verifica struttura attuale
    await verificaEsercizi();
    
    // Chiedi conferma prima di procedere
    console.log('\n⚠️  ATTENZIONE: Stai per aggiornare tutti gli esercizi nel database!');
    console.log('   Continua solo se sei sicuro. Premi Ctrl+C per annullare.\n');
    
    // Aspetta 3 secondi
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 2: Aggiorna gli esercizi
    const risultato = await aggiornaEsercizi();
    
    // Step 3: Testa le query
    await testaIndici();
    
    console.log('\n✅ === SCRIPT COMPLETATO CON SUCCESSO ===');
    console.log(`   Totale esercizi: ${risultato.totale}`);
    console.log(`   Aggiornati: ${risultato.aggiornati}`);
    console.log('\n💡 Ora le query con isPublished e order dovrebbero funzionare!');
    console.log('   Ricarica l\'app e controlla che gli esercizi vengano visualizzati.');
    
  } catch (error) {
    console.error('❌ ERRORE GENERALE:', error);
  } finally {
    console.log('\n🏁 Script terminato.');
    process.exit(0);
  }
};

// Esegui lo script
main();