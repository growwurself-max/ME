const admin = require('firebase-admin');
require('dotenv').config();
const { firebaseProjectId, firebaseClientEmail, firebasePrivateKey } = require('./src/config/env');

const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: firebaseProjectId,
    clientEmail: firebaseClientEmail,
    privateKey: firebasePrivateKey.replace(/\\n/g, '\n'),
  }),
});

(async () => {
  try {
    const token = await app.options.credential.getAccessToken();
    const headers = { Authorization: `Bearer ${token.access_token}` };
    const base = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}`;

    const listDbs = await fetch(`${base}/databases`, { headers });
    console.log('GET /databases ->', listDbs.status, (await listDbs.text()).slice(0, 500));

    const defDoc = await fetch(`${base}/databases/(default)/documents`, { headers });
    console.log('GET /databases/(default)/documents ->', defDoc.status, (await defDoc.text()).slice(0, 500));

    const idp = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${firebaseProjectId}`, { headers });
    console.log('GET identitytoolkit project ->', idp.status, (await idp.text()).slice(0, 500));
  } catch (err) {
    console.error('err', err.message);
  }
  process.exit(0);
})();