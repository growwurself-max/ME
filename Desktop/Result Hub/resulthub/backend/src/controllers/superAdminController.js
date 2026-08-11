const bcrypt = require('bcryptjs');
const { admin, db, FieldValue, Timestamp } = require('../config/firebase');
const { notFound } = require('../utils/errors');
const { collegeSchema, collegeUpdateSchema, passwordSchema } = require('../validation/schemas');

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
    plan: 'standard',
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
    
    await collegeRef.update({ is_active: active });
    
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
  await db.collection('colleges').doc(req.params.id).delete();
  res.json({ ok: true });
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
};
