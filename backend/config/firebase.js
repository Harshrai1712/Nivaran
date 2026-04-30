const admin = require('firebase-admin');
const path = require('path');

let db;

function initializeFirebase() {
  try {
    // Try to use service account JSON file first
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (serviceAccountPath) {
      const serviceAccount = require(path.resolve(serviceAccountPath));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || serviceAccount.databaseURL,
      });
    } else {
      // Fall back to individual environment variables
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }

    db = admin.database();
    console.log('✅ Firebase initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    console.log('⚠️  Running in offline/demo mode with mock data');
    return null;
  }
}

function getDatabase() {
  if (!db) {
    initializeFirebase();
  }
  return db;
}

module.exports = { initializeFirebase, getDatabase, admin };
