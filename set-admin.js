// Script per impostare un utente come admin in Firebase
// Questo script deve essere eseguito solo una volta per impostare l'admin

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc
} from 'firebase/firestore';

// Configurazione Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC8lYcVdHnLLnGwLKGkM6oVfmtGXhcVhNM",
  authDomain: "be-water-2eb26.firebaseapp.com",
  projectId: "be-water-2eb26",
  storageBucket: "be-water-2eb26.firebasestorage.app",
  messagingSenderId: "1050602067928",
  appId: "1:1050602067928:web:eed6f7c0bb1d9d96d325d3"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setAdmin(email) {
  try {
    console.log(`🔍 Cercando utente con email: ${email}`);
    
    // Trova l'utente per email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`❌ Nessun utente trovato con email: ${email}`);
      console.log('Crea prima un account con questa email e poi riesegui lo script.');
      return;
    }
    
    // Aggiorna l'utente con isAdmin = true
    for (const userDoc of querySnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      console.log(`✅ Utente trovato: ${userData.email} (ID: ${userId})`);
      console.log(`📝 Stato admin attuale: ${userData.isAdmin || false}`);
      
      // Aggiorna il campo isAdmin
      await updateDoc(doc(db, 'users', userId), {
        isAdmin: true,
        updatedAt: new Date(),
        adminSetAt: new Date(),
        adminSetBy: 'script'
      });
      
      console.log(`✅ Utente ${email} è ora ADMIN!`);
      console.log(`🎯 Campo isAdmin impostato a true nel database Firebase`);
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
  
  process.exit(0);
}

// CAMBIA QUESTA EMAIL CON LA TUA EMAIL ADMIN
const ADMIN_EMAIL = 'ilgabrio@abitareleidee.com';

console.log('🚀 Script per impostare admin');
console.log('================================');
setAdmin(ADMIN_EMAIL);