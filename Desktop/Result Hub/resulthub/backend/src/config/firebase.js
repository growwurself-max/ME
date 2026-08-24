const admin = require('firebase-admin');
const env = require('./env');

// Point the Admin SDK at local emulators BEFORE initialization.
// The Firestore and Auth emulators accept connections from any service account.
if (env.emulator) {
  process.env.FIRESTORE_EMULATOR_HOST = env.firestoreEmulatorHost;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = env.authEmulatorHost;
  console.warn(
    `Using Firebase emulators (Firestore: ${env.firestoreEmulatorHost}, Auth: ${env.authEmulatorHost}).`,
  );
}

let db;
let FieldValue;
let Timestamp;

if (env.emulator) {
  admin.initializeApp({ projectId: env.firebaseProjectId });
} else if (env.firebaseProjectId === 'test-project') {
  // Mock for testing without real Firebase credentials
  console.warn('Using mock Firebase (test credentials). Set real FIREBASE_* env vars for production.');
  db = null;
  FieldValue = null;
  Timestamp = {
    now: () => new Date(),
  };
} else {
  const serviceAccount = {
    projectId: env.firebaseProjectId,
    clientEmail: env.firebaseClientEmail,
    privateKey: env.firebasePrivateKey.replace(/\\n/g, '\n'),
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

db = admin.firestore();
FieldValue = admin.firestore.FieldValue;
Timestamp = admin.firestore.Timestamp;

module.exports = { admin, db, FieldValue, Timestamp };