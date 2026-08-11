require('dotenv').config();
const env = require('./src/config/env');
const admin = require('firebase-admin');

console.log({
  projectId: env.firebaseProjectId,
  clientEmail: env.firebaseClientEmail,
  privateKeyLength: env.firebasePrivateKey ? env.firebasePrivateKey.length : null,
  privateKeyStarts: env.firebasePrivateKey ? env.firebasePrivateKey.slice(0, 20) : null,
  privateKeyEnds: env.firebasePrivateKey ? env.firebasePrivateKey.slice(-20) : null,
});

try {
  const serviceAccount = {
    projectId: env.firebaseProjectId,
    clientEmail: env.firebaseClientEmail,
    privateKey: env.firebasePrivateKey.replace(/\\n/g, '\n'),
  };
  const app = admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
  console.log({initialized: true, appOptions: app.options});
  app.delete().catch(() => {});
} catch (err) {
  console.error({initError: err.message});
  console.error(err.stack);
}

(async () => {
  try {
    const db = admin.firestore();
    const snap = await db.collection('super_admins').limit(1).get();
    console.log('query ok size=', snap.size);
  } catch (err) {
    console.error('firestore error code=', err.code || err.status);
    console.error('firestore error message=', err.message);
    if (err.details) console.error('firestore details=', err.details);
    if (err.metadata) console.error('firestore metadata=', err.metadata);
    console.error(err.stack);
  }
})();
