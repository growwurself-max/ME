const bcrypt = require('bcryptjs');
const { admin: firebaseAdmin, db, FieldValue } = require('../config/firebase');
const { signToken } = require('../utils/jwt');
const { unauthorized, forbidden } = require('../utils/errors');
const { loginSchema } = require('../validation/schemas');

// Keeps the users/{uid} profile document in sync. Runs server-side with the
// Admin SDK so it is never subject to client-side Firestore security rules.
async function syncUserProfile(uid, profile) {
  const userDocRef = db.collection('users').doc(uid);
  const snapshot = await userDocRef.get();

  if (snapshot.exists) {
    await userDocRef.update({
      ...profile,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await userDocRef.set({
      ...profile,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

// Single login endpoint for both Super Admin and College Admin.
// There is deliberately no registration endpoint for either role.
async function login(req, res) {
  const { username, password } = loginSchema.parse(req.body);

  // Check super_admins collection
  const adminSnapshot = await db
    .collection('super_admins')
    .where('username', '==', username)
    .limit(1)
    .get();

  if (!adminSnapshot.empty) {
    const admin = adminSnapshot.docs[0].data();
    admin.id = adminSnapshot.docs[0].id;
    
    if (!(await bcrypt.compare(password, admin.password_hash))) throw unauthorized('Invalid credentials');
    
    // Ensure Firebase Auth user exists
    try {
      await firebaseAdmin.auth().createUser({
        uid: admin.id,
        email: admin.email,
        emailVerified: true,
        disabled: false,
      });
    } catch (error) {
      if (error.code !== 'auth/uid-already-exists') {
        console.error(`Error creating Firebase Auth user for Super Admin:`, error.message);
      }
    }
    
    // Set custom claims on the Firebase Auth user so they persist in ID tokens
    await firebaseAdmin.auth().setCustomUserClaims(admin.id, {
      role: 'super_admin',
    });

    await syncUserProfile(admin.id, {
      uid: admin.id,
      email: admin.email,
      displayName: admin.name,
      role: 'super_admin',
    });
    
    const firebaseToken = await firebaseAdmin.auth().createCustomToken(admin.id);
    return res.json({
      token: signToken({ sub: admin.id, role: 'super_admin' }),
      firebaseToken,
      user: { id: admin.id, role: 'super_admin', name: admin.name, username: admin.username },
    });
  }

  // Check colleges collection
  const collegeSnapshot = await db
    .collection('colleges')
    .where('username', '==', username)
    .limit(1)
    .get();

  if (collegeSnapshot.empty) throw unauthorized('Invalid credentials');

  const college = collegeSnapshot.docs[0].data();
  college.id = collegeSnapshot.docs[0].id;

  if (!(await bcrypt.compare(password, college.password_hash))) throw unauthorized('Invalid credentials');
  if (!college.is_active) throw forbidden('This college account is disabled. Contact the platform administrator.');
  if (college.subscription_status === 'expired') throw forbidden('Subscription expired. Contact the platform administrator.');

  // Ensure Firebase Auth user exists
  try {
    await firebaseAdmin.auth().createUser({
      uid: college.id,
      email: college.email,
      emailVerified: true,
      disabled: false,
    });
  } catch (error) {
    if (error.code !== 'auth/uid-already-exists') {
      console.error(`Error creating Firebase Auth user for College Admin:`, error.message);
    }
  }

  // Set custom claims on the Firebase Auth user so they persist in ID tokens
  await firebaseAdmin.auth().setCustomUserClaims(college.id, {
    role: 'college_admin',
    collegeId: college.id,
  });

  await syncUserProfile(college.id, {
    uid: college.id,
    email: college.email,
    displayName: college.name,
    role: 'college_admin',
    collegeId: college.id,
  });

  const firebaseToken = await firebaseAdmin.auth().createCustomToken(college.id);

  return res.json({
    token: signToken({ sub: college.id, role: 'college_admin', collegeId: college.id }),
    firebaseToken,
    user: {
      id: college.id,
      role: 'college_admin',
      name: college.name,
      username: college.username,
      email: college.email,
      subscription_status: college.subscription_status,
    },
  });
}

async function me(req, res) {
  if (req.user.role === 'super_admin') {
    const adminDoc = await db.collection('super_admins').doc(req.user.id).get();
    if (!adminDoc.exists) throw unauthorized('User not found');
    const admin = adminDoc.data();
    admin.id = adminDoc.id;
    return res.json({ user: { ...admin, role: 'super_admin' } });
  }
  
  const collegeDoc = await db.collection('colleges').doc(req.user.collegeId).get();
  if (!collegeDoc.exists) throw unauthorized('College not found');
  const college = collegeDoc.data();
  college.id = collegeDoc.id;
  return res.json({ user: { ...college, role: 'college_admin' } });
}

module.exports = { login, me };
