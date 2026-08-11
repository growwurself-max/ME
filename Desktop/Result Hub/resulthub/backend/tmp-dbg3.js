require('dotenv').config();
const { db } = require('./src/config/firebase');

(async () => {
  try {
    const dbs = await db.listDatabases();
    console.log('databases:', JSON.stringify(dbs, null, 2));
  } catch (err) {
    console.error('listDatabases code=', err.code, 'message=', err.message, 'details=', err.details);
  }
  const { admin } = require('./src/config/firebase');
  try {
    const res = await admin.auth().listUsers(1);
    console.log('auth OK nextPageToken=', res.pageToken || null, 'users=', res.users.length);
  } catch (err) {
    console.error('auth code=', err.code, 'message=', err.message);
  }
})();