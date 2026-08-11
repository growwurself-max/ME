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

async function main() {
  const token = await app.options.credential.getAccessToken();
  const headers = { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' };
  const base = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}`;

  const resp = await fetch(`${base}/databases?databaseId=%28default%29`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'FIRESTORE_NATIVE',
      locationId: 'us-central1',
    }),
  });
  const text = await resp.text();
  console.log('create db status=', resp.status, 'body=', text.slice(0, 1000));
}

main().catch((e) => console.error('err', e.message));