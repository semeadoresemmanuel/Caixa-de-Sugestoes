import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyBkbpUNOq4GGhR9RRhEHu4tl1eK_QYbMa0", 
      authDomain: "cdss-ac372.firebaseapp.com",
      projectId: "cdss-ac372",
      storageBucket: "cdss-ac372.firebasestorage.app",
      messagingSenderId: "640125160487",
      appId: "1:640125160487:web:b6098521f4eeb4ac845202"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  enableIndexedDbPersistence(db).catch(() => {});
} catch (e) {}

export const appId = typeof __app_id !== 'undefined' ? __app_id : 'caixa-sugestoes-app'; 

export { auth, db };
