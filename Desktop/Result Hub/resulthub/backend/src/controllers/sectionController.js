const { db, Timestamp } = require('../config/firebase');
const { notFound } = require('../utils/errors');
const { collegeId } = require('../middleware/auth');
const { sectionSchema } = require('../validation/schemas');
const crypto = require('crypto');
const { purgeSection } = require('../services/storageService');

// 4-digit numeric code used by faculty to unlock subject-wise uploads for a
// section. One code covers every subject of the section.
function randomFacultyCode() {
  return crypto.randomInt(0, 10000).toString().padStart(4, '0');
}

async function assertCourse(cid, courseId) {
  const courseDoc = await db.collection('courses').doc(courseId).get();
  if (!courseDoc.exists || courseDoc.data().college_id !== cid) {
    throw notFound('Course not found');
  }
}

async function list(req, res) {
  const cid = collegeId(req);
  const snapshot = await db.collection('sections')
    .where('college_id', '==', cid)
    .orderBy('name')
    .get();
  
  const sections = await Promise.all(
    snapshot.docs.map(async doc => {
      const section = { id: doc.id, ...doc.data() };
      const courseDoc = await db.collection('courses').doc(section.course_id).get();
      section.course_name = courseDoc.exists ? courseDoc.data().name : '';
      return section;
    })
  );
  
  res.json({ sections });
}

async function create(req, res) {
  const cid = collegeId(req);
  const payload = sectionSchema.parse(req.body);
  await assertCourse(cid, payload.course_id);
  
  const sectionRef = await db.collection('sections').add({
    college_id: cid,
    course_id: payload.course_id,
    name: payload.name,
    faculty_code: randomFacultyCode(),
    faculty_code_updated_at: Timestamp.now(),
    created_at: Timestamp.now(),
  });
  
  const sectionDoc = await sectionRef.get();
  const section = { id: sectionDoc.id, ...sectionDoc.data() };
  res.status(201).json({ section });
}

async function update(req, res) {
  const cid = collegeId(req);
  const payload = sectionSchema.parse(req.body);
  await assertCourse(cid, payload.course_id);
  
  const sectionRef = db.collection('sections').doc(req.params.id);
  const sectionDoc = await sectionRef.get();
  
  if (!sectionDoc.exists || sectionDoc.data().college_id !== cid) {
    throw notFound('Section not found');
  }
  
  await sectionRef.update({
    name: payload.name,
    course_id: payload.course_id,
  });
  
  const updatedDoc = await sectionRef.get();
  const section = { id: updatedDoc.id, ...updatedDoc.data() };
  res.json({ section });
}

async function remove(req, res) {
  const cid = collegeId(req);
  const sectionRef = db.collection('sections').doc(req.params.id);
  const sectionDoc = await sectionRef.get();
  
  if (!sectionDoc.exists || sectionDoc.data().college_id !== cid) {
    throw notFound('Section not found');
  }
  
  const removed = await purgeSection(cid, req.params.id);
  res.json({ ok: true, removed });
}

// Generate a fresh faculty upload code for a section. Existing shared links
// keep working (the code is the gate), but the old code stops being valid.
async function regenerateFacultyCode(req, res) {
  const cid = collegeId(req);
  const sectionRef = db.collection('sections').doc(req.params.id);
  const sectionDoc = await sectionRef.get();

  if (!sectionDoc.exists || sectionDoc.data().college_id !== cid) {
    throw notFound('Section not found');
  }

  const code = randomFacultyCode();
  await sectionRef.update({
    faculty_code: code,
    faculty_code_updated_at: Timestamp.now(),
  });

  res.json({ faculty_code: code });
}

module.exports = { list, create, update, remove, regenerateFacultyCode, randomFacultyCode };
