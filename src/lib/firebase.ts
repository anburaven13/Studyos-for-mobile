import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  initializeAuth, 
  browserLocalPersistence, 
  indexedDBLocalPersistence 
} from "firebase/auth";
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

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Explicit multi-tier local persistence:
// 1. IndexedDB (primary modern web storage)
// 2. localStorage (reliable cross-session fallback)
// Guarantees PC browsers remember the session across tab closures, browser restarts, and reboots.
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence]
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);
export const storage = getStorage(app);
