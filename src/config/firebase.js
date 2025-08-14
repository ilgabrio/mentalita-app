import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBT6FX2xPNhiWFT-RK1u-vTvHbUKOhUmUE",
  authDomain: "be-water-2eb26.firebaseapp.com",
  projectId: "be-water-2eb26",
  storageBucket: "be-water-2eb26.appspot.com",
  messagingSenderId: "358939922854",
  appId: "1:358939922854:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;