/**
 * Creates (or updates) the first Super Admin.
 * There is no Super Admin registration page by design.
 *
 *   cd backend && npm run seed
 *
 * Credentials come from SEED_SUPER_ADMIN_* variables in .env
 */
const bcrypt = require('bcryptjs');
const { admin, db, Timestamp } = require('../config/firebase');

async function main() {
  const username = process.env.SEED_SUPER_ADMIN_USERNAME || 'superadmin';
  const email = process.env.SEED_SUPER_ADMIN_EMAIL || 'admin@resulthub.local';
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;

  if (!password || password.length < 8) {
    console.error('Set SEED_SUPER_ADMIN_PASSWORD (min 8 chars) in backend/.env first.');
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 10);
  
  const adminSnapshot = await db
    .collection('super_admins')
    .where('username', '==', username)
    .limit(1)
    .get();

  let adminId;
  if (!adminSnapshot.empty) {
    const adminRef = adminSnapshot.docs[0].ref;
    adminId = adminSnapshot.docs[0].id;
    await adminRef.update({ email, password_hash });
    console.log(`Updated existing Super Admin "${username}".`);
  } else {
    const adminRef = await db.collection('super_admins').add({
      name: 'Super Admin',
      username,
      email,
      password_hash,
      created_at: Timestamp.now(),
    });
    adminId = adminRef.id;
    console.log(`Created Super Admin "${username}".`);
  }

  // Create or update Firebase Auth user
  try {
    await admin.auth().createUser({
      uid: adminId,
      email: email,
      emailVerified: true,
      disabled: false,
    });
    console.log(`Created Firebase Auth user for Super Admin.`);
  } catch (error) {
    if (error.code === 'auth/uid-already-exists') {
      console.log(`Firebase Auth user already exists for Super Admin.`);
    } else {
      console.error(`Error creating Firebase Auth user:`, error.message);
    }
  }

  // Set custom claims
  await admin.auth().setCustomUserClaims(adminId, { role: 'super_admin' });
  console.log(`Set custom claims for Super Admin.`);

  console.log('Log in at the frontend /login page with this username and password.');
}

main().catch((error) => {
  console.error('Seed failed:', error.message || error);
  process.exit(1);
});
