// Script per esportare dati Firestore usando Firebase Admin SDK
// Questo script crea un backup JSON di tutte le collezioni

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query 
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurazione Firebase (usa le stesse credenziali dell'app)
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

// Directory per i backup
const BACKUP_DIR = path.join(process.env.HOME, 'Desktop', 'mentalita-app-backup-20250814_172941', 'firebase-export');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

// Collezioni da esportare
const collections = [
  'users',
  'exercises', 
  'articles',
  'videos',
  'audio',
  'news',
  'motivationalTips',
  'badges',
  'userBadges',
  'premiumPlans',
  'paymentSessions', 
  'premiumRequests',
  'podcastShows',
  'podcastEpisodes',
  'newsletters',
  'newsletterSubscribers',
  'questionnaireTemplates',
  'settings',
  'userProfiles',
  'userProgress',
  'questionnaires',
  'responses'
];

// Funzione per convertire Timestamp Firebase in stringa
function convertTimestamps(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (obj.toDate && typeof obj.toDate === 'function') {
    return obj.toDate().toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertTimestamps);
  }
  
  if (typeof obj === 'object') {
    const converted = {};
    for (const key in obj) {
      converted[key] = convertTimestamps(obj[key]);
    }
    return converted;
  }
  
  return obj;
}

// Funzione per esportare una collezione
async function exportCollection(collectionName) {
  try {
    console.log(`📦 Esportando collezione: ${collectionName}`);
    
    const collectionRef = collection(db, collectionName);
    const querySnapshot = await getDocs(collectionRef);
    
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        data: convertTimestamps(doc.data())
      });
    });
    
    // Salva i dati in un file JSON
    const fileName = `${collectionName}_${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
    
    console.log(`✅ ${collectionName}: ${documents.length} documenti esportati`);
    return {
      collection: collectionName,
      documents: documents.length,
      file: fileName
    };
    
  } catch (error) {
    console.log(`⚠️ Errore in ${collectionName}:`, error.message);
    return {
      collection: collectionName,
      documents: 0,
      file: null,
      error: error.message
    };
  }
}

// Funzione principale
async function exportAllData() {
  console.log('🔥 Avvio export Firestore...');
  console.log(`📁 Directory: ${BACKUP_DIR}`);
  
  // Crea directory se non esiste
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const results = [];
  let totalDocuments = 0;
  
  // Esporta tutte le collezioni
  for (const collectionName of collections) {
    const result = await exportCollection(collectionName);
    results.push(result);
    totalDocuments += result.documents;
  }
  
  // Crea un report completo
  const report = {
    timestamp: new Date().toISOString(),
    project: 'be-water-2eb26',
    totalCollections: collections.length,
    totalDocuments: totalDocuments,
    exportResults: results,
    exportDirectory: BACKUP_DIR
  };
  
  // Salva il report
  const reportPath = path.join(BACKUP_DIR, `export-report-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Crea anche un report testuale
  const textReport = `
FIREBASE FIRESTORE EXPORT REPORT
================================
Data: ${new Date().toLocaleString('it-IT')}
Progetto: be-water-2eb26
Directory: ${BACKUP_DIR}

RIEPILOGO:
- Collezioni processate: ${collections.length}
- Documenti totali esportati: ${totalDocuments}
- File creati: ${results.filter(r => r.file).length}

DETTAGLIO COLLEZIONI:
${results.map(r => 
  r.error 
    ? `❌ ${r.collection}: ERRORE (${r.error})`
    : `✅ ${r.collection}: ${r.documents} documenti → ${r.file}`
).join('\n')}

FILE GENERATI:
${results.filter(r => r.file).map(r => `- ${r.file}`).join('\n')}

UTILIZZO:
I file JSON possono essere importati manualmente o utilizzando:
- Firebase Admin SDK per importazione programmatica
- Firebase Console per importazione manuale
- Script personalizzati per migrazione dati

NOTA:
Tutti i timestamp Firebase sono stati convertiti in formato ISO string.
`;
  
  fs.writeFileSync(path.join(BACKUP_DIR, 'export-report.txt'), textReport);
  
  console.log('\n✅ Export completato!');
  console.log(`📊 Documenti totali: ${totalDocuments}`);
  console.log(`📁 File salvati in: ${BACKUP_DIR}`);
  console.log(`📋 Report: export-report.txt`);
  
  // Mostra riepilogo
  console.log('\n📈 Riepilogo collezioni:');
  results.forEach(r => {
    const status = r.error ? '❌' : '✅';
    const count = r.documents > 0 ? `(${r.documents} docs)` : '(vuota)';
    console.log(`${status} ${r.collection} ${count}`);
  });
  
  process.exit(0);
}

// Gestione errori
process.on('unhandledRejection', (error) => {
  console.error('❌ Errore non gestito:', error);
  process.exit(1);
});

// Avvia export
exportAllData().catch(console.error);