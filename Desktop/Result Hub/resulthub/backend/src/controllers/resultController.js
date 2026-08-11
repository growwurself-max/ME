const { db, Timestamp } = require('../config/firebase');
const { badRequest, notFound } = require('../utils/errors');
const { collegeId } = require('../middleware/auth');
const { publishSchema } = require('../validation/schemas');
const { recalculateCourse } = require('../services/resultService');
const { listStudents } = require('../services/studentQueryService');
const excel = require('../services/excelService');

async function dashboard(req, res) {
  const cid = collegeId(req);
  
  const [studentsSnapshot, coursesSnapshot, sectionsSnapshot, resultsSnapshot] = await Promise.all([
    db.collection('students').where('college_id', '==', cid).count().get(),
    db.collection('courses').where('college_id', '==', cid).count().get(),
    db.collection('sections').where('college_id', '==', cid).count().get(),
    db.collection('results').where('college_id', '==', cid).where('published', '==', true).count().get(),
  ]);
  
  res.json({
    students: studentsSnapshot.data().count || 0,
    courses: coursesSnapshot.data().count || 0,
    sections: sectionsSnapshot.data().count || 0,
    published_results: resultsSnapshot.data().count || 0,
  });
}

async function recalculate(req, res) {
  const cid = collegeId(req);
  const courseId = req.body.course_id;
  if (!courseId) throw badRequest('course_id is required');
  const result = await recalculateCourse(cid, courseId);
  res.json(result);
}

async function publish(req, res) {
  const cid = collegeId(req);
  const payload = publishSchema.parse(req.body);
  
  let query = db.collection('results')
    .where('college_id', '==', cid)
    .where('course_id', '==', payload.course_id);
  
  if (payload.section_id) {
    query = query.where('section_id', '==', payload.section_id);
  }
  
  const snapshot = await query.get();
  const batch = db.batch();
  
  const updateData = {
    published: payload.published,
    published_at: payload.published ? Timestamp.now() : null,
  };
  
  snapshot.forEach(doc => {
    batch.update(doc.ref, updateData);
  });
  
  await batch.commit();
  res.json({ ok: true, published: payload.published });
}

async function loadSubjects(cid, courseId) {
  const courseDoc = await db.collection('courses').doc(courseId).get();
  if (!courseDoc.exists || courseDoc.data().college_id !== cid) {
    throw notFound('Course not found');
  }
  
  const course = { id: courseDoc.id, ...courseDoc.data() };
  
  const subjectsSnapshot = await db.collection('subjects')
    .where('course_id', '==', courseId)
    .orderBy('position')
    .get();
  course.subjects = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  return course;
}

async function exportExcel(req, res) {
  const cid = collegeId(req);
  if (!req.query.course_id) throw badRequest('course_id is required');
  const course = await loadSubjects(cid, req.query.course_id);
  const students = await listStudents(cid, {
    courseId: req.query.course_id,
    sectionId: req.query.section_id || null,
    status: req.query.status || null,
    search: (req.query.search || '').trim() || null,
  });
  const buffer = excel.buildResultsExport(course.subjects, students);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${course.name.replace(/[^a-z0-9]+/gi, '_')}_results.xlsx"`
  );
  res.send(buffer);
}

async function exportData(req, res) {
  const cid = collegeId(req);
  if (!req.query.course_id) throw badRequest('course_id is required');
  const course = await loadSubjects(cid, req.query.course_id);
  const collegeDoc = await db.collection('colleges').doc(cid).get();
  const college = collegeDoc.exists ? collegeDoc.data().name : '';
  const students = await listStudents(cid, {
    courseId: req.query.course_id,
    sectionId: req.query.section_id || null,
    status: req.query.status || null,
    search: (req.query.search || '').trim() || null,
  });
  res.json({ college, course, students });
}

module.exports = { dashboard, recalculate, publish, exportExcel, exportData };
