import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAithgtbd5trXl6dLvpO0WWN_ESoQGoy9c",
  authDomain: "be-water-2eb26.firebaseapp.com",
  projectId: "be-water-2eb26",
  storageBucket: "be-water-2eb26.firebasestorage.app",
  messagingSenderId: "358939922854",
  appId: "1:358939922854:web:98a7347221b8cc6871ff67",
  measurementId: "G-TJB1Z0NDHV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;