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

  const checker = async (name, url, init) => {
    try {
      const r = await fetch(url, { ...init, headers });
      const t = await r.text();
      console.log(`--- ${name} -> ${r.status}`, t.slice(0, 600).replace(/\n/g, ' '));
    } catch (e) {
      console.log(`--- ${name} ERR`, e.message);
    }
  };

  await checker('get project', `https://firebase.googleapis.com/v1beta1/projects/${firebaseProjectId}`, { method: 'GET' });
  await checker('serviceusage firestore', `https://serviceusage.googleapis.com/v1/projects/${firebaseProjectId}/services/firestore.googleapis.com`, { method: 'GET' });
  await checker('serviceusage identitytoolkit', `https://serviceusage.googleapis.com/v1/projects/${firebaseProjectId}/services/identitytoolkit.googleapis.com`, { method: 'GET' });
  await checker('enable identitytoolkit', `https://serviceusage.googleapis.com/v1/projects/${firebaseProjectId}/services/identitytoolkit.googleapis.com:enable`, { method: 'POST', body: '{}' });
  await checker('get iam policy', `https://cloudresourcemanager.googleapis.com/v1/projects/${firebaseProjectId}:getIamPolicy`, { method: 'GET' });
}

main().catch((e) => console.error('err', e.message));