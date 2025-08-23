import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyAithgtbd5trXl6dLvpO0WWN_ESoQGoy9c",
  authDomain: "be-water-2eb26.firebaseapp.com",
  projectId: "be-water-2eb26",
  storageBucket: "be-water-2eb26.firebasestorage.app",
  messagingSenderId: "358939922854",
  appId: "1:358939922854:web:98a7347221b8cc6871ff67",
  measurementId: "G-TJB1Z0NDHV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with settings for mobile
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

// Initialize Functions
export const functions = getFunctions(app);

// Error handling for mobile networks
window.addEventListener('online', () => {
  console.log('📱 Network online');
});

window.addEventListener('offline', () => {
  console.log('📱 Network offline');
});

// Debug Firebase connection
console.log('🔥 Firebase initialized for:', firebaseConfig.projectId);

export default app;