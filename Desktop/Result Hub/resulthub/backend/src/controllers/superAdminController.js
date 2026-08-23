const bcrypt = require('bcryptjs');
const { admin, db, FieldValue, Timestamp } = require('../config/firebase');
const { notFound } = require('../utils/errors');
const { collegeSchema, collegeUpdateSchema, passwordSchema, subscriptionSchema } = require('../validation/schemas');
const { purgeCollege, deleteWhere } = require('../services/storageService');
const { DEFAULT_LIMITS, resolveLimit, countPublished } = require('../services/subscriptionService');

async function stats(_req, res) {
  const collegesSnapshot = await db.collection('colleges').select('id', 'is_active').get();
  const colleges = collegesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  const studentsSnapshot = await db.collection('students').count().get();
  const studentCount = studentsSnapshot.data().count;
  
  const resultsSnapshot = await db.collection('results').where('published', '==', true).count().get();
  const publishedCount = resultsSnapshot.data().count;

  res.json({
    total_colleges: colleges.length,
    active_colleges: colleges.filter((c) => c.is_active).length,
    disabled_colleges: colleges.filter((c) => !c.is_active).length,
    total_students: studentCount || 0,
    published_results: publishedCount || 0,
  });
}

async function listColleges(_req, res) {
  const snapshot = await db.collection('colleges')
    .orderBy('created_at', 'desc')
    .get();
  const colleges = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      principal_name: data.principal_name,
      email: data.email,
      phone: data.phone,
      username: data.username,
      subscription_status: data.subscription_status,
      plan: data.plan || 'free',
      plan_limit: data.plan_limit,
      is_active: data.is_active,
      created_at: data.created_at?.toDate?.() || data.created_at,
    };
  });
  res.json({ colleges });
}

async function createCollege(req, res) {
  const payload = collegeSchema.parse(req.body);
  const { password, ...rest } = payload;
  
  const collegeRef = await db.collection('colleges').add({
    ...rest,
    plan: 'free',
    plan_limit: DEFAULT_LIMITS.free,
    password_hash: await bcrypt.hash(password, 10),
    is_active: true,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });
  
  // Create Firebase Auth user for the new college
  try {
    await admin.auth().createUser({
      uid: collegeRef.id,
      email: payload.email,
      emailVerified: true,
      disabled: false,
    });
  } catch (error) {
    if (error.code !== 'auth/uid-already-exists') {
      console.error(`Error creating Firebase Auth user for college:`, error.message);
    }
  }

  // Set custom claims for the new college admin
  await admin.auth().setCustomUserClaims(collegeRef.id, {
    role: 'college_admin',
    collegeId: collegeRef.id,
  });
  
  await db.collection('subscriptions').add({
    college_id: collegeRef.id,
    status: payload.subscription_status,
    plan: 'free',
    limit: DEFAULT_LIMITS.free,
    created_at: Timestamp.now(),
  });
  
  const collegeDoc = await collegeRef.get();
  const college = { id: collegeDoc.id, ...collegeDoc.data() };
  res.status(201).json({ college });
}

async function updateCollege(req, res) {
  const payload = collegeUpdateSchema.parse(req.body);
  const collegeRef = db.collection('colleges').doc(req.params.id);
  const collegeDoc = await collegeRef.get();
  
  if (!collegeDoc.exists) throw notFound('College not found');
  
  const updateData = { ...payload, updated_at: Timestamp.now() };
  await collegeRef.update(updateData);
  
  if (payload.subscription_status) {
    const subSnapshot = await db.collection('subscriptions')
      .where('college_id', '==', req.params.id)
      .limit(1)
      .get();
    
    if (!subSnapshot.empty) {
      await subSnapshot.docs[0].ref.update({ status: payload.subscription_status });
    }
  }
  
  const updatedDoc = await collegeRef.get();
  const college = { id: updatedDoc.id, ...updatedDoc.data() };
  res.json({ college });
}

async function setActive(active) {
  return async function handler(req, res) {
    const collegeRef = db.collection('colleges').doc(req.params.id);
    const collegeDoc = await collegeRef.get();
    
    if (!collegeDoc.exists) throw notFound('College not found');
    
    await collegeRef.update({ is_active: active, updated_at: Timestamp.now() });

    // Mirror the toggle in Firebase Auth so an existing session also stops
    // working the moment the account is deactivated (and resumes on reactivation).
    try {
      await admin.auth().updateUser(req.params.id, { disabled: !active });
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        console.error(`Error updating Firebase Auth status for college:`, error.message);
      }
    }
    
    const updatedDoc = await collegeRef.get();
    const college = { id: updatedDoc.id, ...updatedDoc.data() };
    res.json({ college });
  };
}

async function resetPassword(req, res) {
  const { password } = passwordSchema.parse(req.body);
  const collegeRef = db.collection('colleges').doc(req.params.id);
  const collegeDoc = await collegeRef.get();
  
  if (!collegeDoc.exists) throw notFound('College not found');
  
  await collegeRef.update({ password_hash: await bcrypt.hash(password, 10) });
  res.json({ ok: true });
}

async function deleteCollege(req, res) {
  const collegeId = req.params.id;
  const collegeRef = db.collection('colleges').doc(collegeId);
  const collegeDoc = await collegeRef.get();
  if (!collegeDoc.exists) throw notFound('College not found');

  // Remove every course, section, student, mark, result, exam, faculty upload
  // and subscription owned by the college before dropping the account.
  const removed = await purgeCollege(collegeId);
  await deleteWhere('subscriptions', 'college_id', collegeId);
  await collegeRef.delete();

  // Revoke the Firebase Auth account so the credentials stop working.
  try {
    await admin.auth().deleteUser(collegeId);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      console.error('Error deleting Firebase Auth user:', error.message);
    }
  }

  res.json({ ok: true, removed });
}

// Wipe the college's data but keep the account, credentials and subscription
// record so the college can start fresh without re-provisioning.
async function resetCollegeData(req, res) {
  const collegeRef = db.collection('colleges').doc(req.params.id);
  const collegeDoc = await collegeRef.get();
  if (!collegeDoc.exists) throw notFound('College not found');

  const removed = await purgeCollege(req.params.id);
  res.json({ ok: true, removed });
}

// Current subscription configuration and live usage for a college.
async function getSubscription(req, res) {
  const collegeRef = db.collection('colleges').doc(req.params.id);
  const collegeDoc = await collegeRef.get();
  if (!collegeDoc.exists) throw notFound('College not found');

  const data = collegeDoc.data();
  const plan = data.plan || 'free';
  const limit = resolveLimit(plan, data.plan_limit);
  const used = await countPublished(req.params.id);

  res.json({ plan, limit, used, remaining: Math.max(0, limit - used) });
}

// Configure a college's plan and/or its maximum published results limit.
// The Super Admin can change either value at any time; the system always uses
// the stored limit instead of a hardcoded number.
async function updateSubscription(req, res) {
  const payload = subscriptionSchema.parse(req.body);
  const collegeRef = db.collection('colleges').doc(req.params.id);
  const collegeDoc = await collegeRef.get();
  if (!collegeDoc.exists) throw notFound('College not found');

  const current = collegeDoc.data();
  const plan = payload.plan || current.plan || 'free';

  let planLimit = payload.limit;
  if (planLimit === undefined) {
    // Changing the plan snaps the limit to that plan's default; leaving both
    // unchanged keeps whatever is already configured.
    planLimit = payload.plan && payload.plan !== (current.plan || 'free')
      ? DEFAULT_LIMITS[payload.plan]
      : resolveLimit(plan, current.plan_limit);
  }

  await collegeRef.update({
    plan,
    plan_limit: planLimit,
    updated_at: Timestamp.now(),
  });

  // Keep the legacy subscription record in sync when one exists.
  const subSnapshot = await db.collection('subscriptions')
    .where('college_id', '==', req.params.id)
    .limit(1)
    .get();
  if (!subSnapshot.empty) {
    await subSnapshot.docs[0].ref.update({
      plan,
      limit: planLimit,
      status: 'active',
      updated_at: Timestamp.now(),
    });
  }

  const used = await countPublished(req.params.id);
  res.json({ plan, limit: planLimit, used, remaining: Math.max(0, planLimit - used) });
}

module.exports = {
  stats,
  listColleges,
  createCollege,
  updateCollege,
  activate: setActive(true),
  deactivate: setActive(false),
  resetPassword,
  deleteCollege,
  resetCollegeData,
  getSubscription,
  updateSubscription,
};
