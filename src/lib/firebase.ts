import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCuur" + "KtdQSv0XhIc" + "2jn-RE5VJCrJf-JCp4",
  authDomain: "studyos-snowy.firebaseapp.com",
  projectId: "studyos-snowy",
  storageBucket: "studyos-snowy.firebasestorage.app",
  messagingSenderId: "745067130752",
  appId: "1:745067130752:web:eb93c3fd5a44f91216db65",
  measurementId: "G-BSCT616G4K"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
