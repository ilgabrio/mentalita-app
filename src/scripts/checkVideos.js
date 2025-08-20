import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBT6FX2xPNhiWFT-RK1u-vTvHbUKOhUmUE",
  authDomain: "be-water-2eb26.firebaseapp.com",
  projectId: "be-water-2eb26",
  storageBucket: "be-water-2eb26.appspot.com",
  messagingSenderId: "358939922854",
  appId: "1:358939922854:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkVideos() {
  console.log('🔍 Controllo video nel database...\n');
  
  // Controlla appVideos
  try {
    const appVideosSnap = await getDocs(collection(db, 'appVideos'));
    console.log(`📺 Collezione 'appVideos': ${appVideosSnap.size} documenti\n`);
    
    appVideosSnap.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Video ${index + 1} (ID: ${doc.id}):`);
      console.log('  Titolo:', data.title);
      console.log('  Campi disponibili:', Object.keys(data).join(', '));
      
      // Cerca campi YouTube
      const youtubeFields = ['youtubeUrl', 'youtubeId', 'youtubeID', 'url', 'videoUrl', 'link'];
      console.log('  Campi YouTube:');
      youtubeFields.forEach(field => {
        if (data[field]) {
          console.log(`    ✅ ${field}: ${data[field]}`);
        }
      });
      console.log('---');
    });
  } catch (error) {
    console.log('❌ Errore con appVideos:', error.message);
  }
  
  // Controlla videos
  try {
    const videosSnap = await getDocs(collection(db, 'videos'));
    console.log(`\n📺 Collezione 'videos': ${videosSnap.size} documenti\n`);
    
    videosSnap.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Video ${index + 1} (ID: ${doc.id}):`);
      console.log('  Titolo:', data.title);
      console.log('  Campi disponibili:', Object.keys(data).join(', '));
      
      // Cerca campi YouTube
      const youtubeFields = ['youtubeUrl', 'youtubeId', 'youtubeID', 'url', 'videoUrl', 'link'];
      console.log('  Campi YouTube:');
      youtubeFields.forEach(field => {
        if (data[field]) {
          console.log(`    ✅ ${field}: ${data[field]}`);
        }
      });
      console.log('---');
    });
  } catch (error) {
    console.log('❌ Errore con videos:', error.message);
  }
}

checkVideos();