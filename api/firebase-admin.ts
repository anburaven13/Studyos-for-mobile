import admin from 'firebase-admin';

// Support both local JSON file and Vercel environment variables
let credential: any;
try {
  const serviceAccount = require('./service-account.json');
  credential = admin.credential.cert(serviceAccount);
} catch (_error) {
  try {
    if (process.env.FIREBASE_PROJECT_ID) {
      // Robustly clean up the private key
      let pk = process.env.FIREBASE_PRIVATE_KEY || '';
      if (pk.startsWith('"') && pk.endsWith('"')) {
        pk = pk.substring(1, pk.length - 1);
      }
      pk = pk.replace(/\\n/g, '\n');

      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: pk,
      } as any);
    }
  } catch (envError) {
    console.error("Firebase Admin initialization failed: Missing or invalid environment variables", envError);
  }
}

try {
  if (!admin.apps.length) {
    if (credential) {
      admin.initializeApp({ credential });
    } else {
      console.warn("WARNING: Firebase Admin initialized with DUMMY config. APIs will fail, but server will boot.");
      admin.initializeApp({ projectId: 'dummy-project' });
    }
  }
} catch (initError) {
  console.error("Firebase init fallback failed:", initError);
}

export const auth = admin.auth();
export const firestore = admin.firestore();
export const storage = admin.storage();
