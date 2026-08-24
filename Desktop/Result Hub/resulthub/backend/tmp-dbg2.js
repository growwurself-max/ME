require('dotenv').config();
const { db } = require('./src/config/firebase');

(async () => {
  try {
    const snap = await db.collection('super_admins').limit(1).get();
    console.log('OK size=', snap.size, 'empty=', snap.empty);
  } catch (err) {
    console.error('code=', err.code);
    console.error('status=', err.status);
    console.error('message=', err.message);
    console.error('details=', err.details);
    console.error('stack=', err.stack);
  }
})();