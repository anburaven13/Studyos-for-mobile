import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "studyos-snowy.firebaseapp.com",
  projectId: "studyos-snowy",
  storageBucket: "studyos-snowy.firebasestorage.app",
  messagingSenderId: "745067130752",
  appId: "1:745067130752:web:eb93c3fd5a44f91216db65",
  measurementId: "G-BSCT616G4K"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
