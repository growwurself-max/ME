const { db, Timestamp } = require('../config/firebase');
const { notFound } = require('../utils/errors');
const { collegeId } = require('../middleware/auth');
const { courseSchema } = require('../validation/schemas');
const { recalculateCourse } = require('../services/resultService');
const { purgeCourse } = require('../services/storageService');

const sortCourse = (course) => ({
  ...course,
  subjects: (course.subjects || []).slice().sort((a, b) => a.position - b.position),
  sections: (course.sections || []).slice().sort((a, b) => a.name.localeCompare(b.name)),
});

async function loadCourseWithDetails(courseId) {
  const courseDoc = await db.collection('courses').doc(courseId).get();
  if (!courseDoc.exists) return null;
  
  const course = { id: courseDoc.id, ...courseDoc.data() };
  
  const subjectsSnapshot = await db.collection('subjects')
    .where('course_id', '==', courseId)
    .orderBy('position')
    .get();
  course.subjects = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  const sectionsSnapshot = await db.collection('sections')
    .where('course_id', '==', courseId)
    .orderBy('name')
    .get();
  course.sections = sectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  return course;
}

async function list(req, res) {
  const cid = collegeId(req);
  const snapshot = await db.collection('courses')
    .where('college_id', '==', cid)
    .orderBy('name')
    .get();
  
  const courses = await Promise.all(
    snapshot.docs.map(doc => loadCourseWithDetails(doc.id))
  );
  
  res.json({ courses: courses.filter(Boolean).map(sortCourse) });
}

async function create(req, res) {
  const cid = collegeId(req);
  const payload = courseSchema.parse(req.body);
  
  const courseRef = await db.collection('courses').add({
    college_id: cid,
    name: payload.name,
    enable_percentage: payload.enable_percentage,
    enable_ranking: payload.enable_ranking,
    enable_pass_fail: payload.enable_pass_fail,
    enable_grade: payload.enable_grade,
    created_at: Timestamp.now(),
  });
  
  const batch = db.batch();
  payload.subjects.forEach((s, index) => {
    const ref = db.collection('subjects').doc();
    batch.set(ref, {
      course_id: courseRef.id,
      name: s.name,
      max_marks: s.max_marks,
      passing_marks: s.passing_marks,
      position: index,
    });
  });
  await batch.commit();
  
  const created = await loadCourseWithDetails(courseRef.id);
  res.status(201).json({ course: sortCourse(created) });
}

async function update(req, res) {
  const cid = collegeId(req);
  const payload = courseSchema.parse(req.body);
  
  const courseRef = db.collection('courses').doc(req.params.id);
  const courseDoc = await courseRef.get();
  
  if (!courseDoc.exists || courseDoc.data().college_id !== cid) {
    throw notFound('Course not found');
  }

  await courseRef.update({
    name: payload.name,
    enable_percentage: payload.enable_percentage,
    enable_ranking: payload.enable_ranking,
    enable_pass_fail: payload.enable_pass_fail,
    enable_grade: payload.enable_grade,
  });

  const currentSubjectsSnapshot = await db.collection('subjects')
    .where('course_id', '==', req.params.id)
    .get();
  
  const keptIds = payload.subjects.map((s) => s.id).filter(Boolean);
  const batch = db.batch();
  
  currentSubjectsSnapshot.forEach(doc => {
    if (!keptIds.includes(doc.id)) {
      batch.delete(doc.ref);
    }
  });

  for (const [index, subject] of payload.subjects.entries()) {
    const row = {
      course_id: req.params.id,
      name: subject.name,
      max_marks: subject.max_marks,
      passing_marks: subject.passing_marks,
      position: index,
    };
    if (subject.id) {
      batch.update(db.collection('subjects').doc(subject.id), row);
    } else {
      batch.set(db.collection('subjects').doc(), row);
    }
  }
  await batch.commit();

  await recalculateCourse(cid, req.params.id);
  const updated = await loadCourseWithDetails(req.params.id);
  res.json({ course: sortCourse(updated) });
}

async function remove(req, res) {
  const cid = collegeId(req);
  const courseRef = db.collection('courses').doc(req.params.id);
  const courseDoc = await courseRef.get();
  
  if (!courseDoc.exists || courseDoc.data().college_id !== cid) {
    throw notFound('Course not found');
  }
  
  const removed = await purgeCourse(cid, req.params.id);
  res.json({ ok: true, removed });
}

module.exports = { list, create, update, remove };
