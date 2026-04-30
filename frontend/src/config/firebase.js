/**
 * Firebase Configuration for Frontend
 *
 * Replace these values with your Firebase project config.
 * You can find these in: Firebase Console → Project Settings → General → Your apps → Web app
 */
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDzLdDNaF2Jr8V1ghf0dGbiw89oOc4Lz-M",
  authDomain: "smoke-detection-2845e.firebaseapp.com",
  databaseURL: "https://smoke-detection-2845e-default-rtdb.firebaseio.com",
  projectId: "smoke-detection-2845e",
  storageBucket: "smoke-detection-2845e.firebasestorage.app",
  messagingSenderId: "861127149311",
  appId: "1:861127149311:web:dd7cb39538b3ab1724eeca",
  measurementId: "G-Y15RM1T2L1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


export const database = getDatabase(app);

export default app;
