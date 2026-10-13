import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, indexedDBLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const FIREBASE_API_KEY =
  import.meta.env.VITE_FIREBASE_API_KEY ||
  "AIzaSyCuurKtdQSv0XhIc2jn-RE5VJCrJf-JCp4";

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "studyos-snowy.firebaseapp.com",
  projectId: "studyos-snowy",
  storageBucket: "studyos-snowy.firebasestorage.app",
  messagingSenderId: "745067130752",
  appId: "1:745067130752:web:eb93c3fd5a44f91216db65",
  measurementId: "G-BSCT616G4K"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Explicitly persist authentication session in localStorage (browserLocalPersistence) for Capacitor mobile webview
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[Firebase] browserLocalPersistence failed, attempting indexedDBLocalPersistence:', err);
  setPersistence(auth, indexedDBLocalPersistence).catch(console.error);
});

export const db = getFirestore(app);
export const storage = getStorage(app);
