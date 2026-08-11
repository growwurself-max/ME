/**
 * Creates (or updates) a default College Admin account.
 * Colleges are normally created by the Super Admin, but this script
 * provides a convenient way to bootstrap a demo college for local development.
 *
 *   cd backend && npm run seed:college
 *
 * Credentials come from SEED_COLLEGE_* variables in .env
 */
const bcrypt = require('bcryptjs');
const { admin, db, Timestamp } = require('../config/firebase');

async function main() {
  const name = process.env.SEED_COLLEGE_NAME || 'Example College';
  const principal_name = process.env.SEED_COLLEGE_PRINCIPAL || 'Dr. John Doe';
  const email = process.env.SEED_COLLEGE_EMAIL || 'college@resulthub.com';
  const phone = process.env.SEED_COLLEGE_PHONE || '+1-555-0100';
  const username = process.env.SEED_COLLEGE_USERNAME || 'collegeadmin';
  const password = process.env.SEED_COLLEGE_PASSWORD;

  if (!password || password.length < 6) {
    console.error('Set SEED_COLLEGE_PASSWORD (min 6 chars) in backend/.env first.');
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 10);
  
  const collegeSnapshot = await db
    .collection('colleges')
    .where('username', '==', username)
    .limit(1)
    .get();

  let collegeId;
  if (!collegeSnapshot.empty) {
    const collegeRef = collegeSnapshot.docs[0].ref;
    collegeId = collegeSnapshot.docs[0].id;
    await collegeRef.update({
      name,
      principal_name,
      email,
      phone,
      password_hash,
      is_active: true,
      subscription_status: 'active',
      updated_at: Timestamp.now(),
    });
    console.log(`Updated existing College Admin "${username}".`);
  } else {
    const collegeRef = await db.collection('colleges').add({
      name,
      principal_name,
      email,
      phone,
      username,
      password_hash,
      is_active: true,
      subscription_status: 'active',
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });
    collegeId = collegeRef.id;
    console.log(`Created College Admin "${username}".`);
  }

  // Create or update Firebase Auth user
  try {
    await admin.auth().createUser({
      uid: collegeId,
      email: email,
      emailVerified: true,
      disabled: false,
    });
    console.log(`Created Firebase Auth user for College Admin.`);
  } catch (error) {
    if (error.code === 'auth/uid-already-exists') {
      console.log(`Firebase Auth user already exists for College Admin.`);
    } else {
      console.error(`Error creating Firebase Auth user:`, error.message);
    }
  }

  // Set custom claims
  await admin.auth().setCustomUserClaims(collegeId, { 
    role: 'college_admin',
    collegeId: collegeId,
  });
  console.log(`Set custom claims for College Admin.`);

  // Ensure a subscription record exists
  const subSnapshot = await db.collection('subscriptions')
    .where('college_id', '==', collegeId)
    .limit(1)
    .get();

  if (subSnapshot.empty) {
    await db.collection('subscriptions').add({
      college_id: collegeId,
      status: 'active',
      plan: 'standard',
      created_at: Timestamp.now(),
    });
    console.log('Created subscription record.');
  }

  console.log('Log in at the frontend /login page with this username and password.');
}

main().catch((error) => {
  console.error('Seed failed:', error.message || error);
  process.exit(1);
});