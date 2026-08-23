const { db, Timestamp } = require('../config/firebase');
const { badRequest, notFound } = require('../utils/errors');
const { collegeId } = require('../middleware/auth');
const { publishSchema } = require('../validation/schemas');
const { recalculateCourse } = require('../services/resultService');
const { listStudents } = require('../services/studentQueryService');
const { getSubscription, assertCanPublish, recordPublication } = require('../services/subscriptionService');
const excel = require('../services/excelService');

async function dashboard(req, res) {
  const cid = collegeId(req);
  
  const [studentsSnapshot, coursesSnapshot, sectionsSnapshot, resultsSnapshot] = await Promise.all([
    db.collection('students').where('college_id', '==', cid).count().get(),
    db.collection('courses').where('college_id', '==', cid).count().get(),
    db.collection('sections').where('college_id', '==', cid).count().get(),
    db.collection('results').where('college_id', '==', cid).where('published', '==', true).count().get(),
  ]);
  
  const subscription = await getSubscription(cid);

  res.json({
    students: studentsSnapshot.data().count || 0,
    courses: coursesSnapshot.data().count || 0,
    sections: sectionsSnapshot.data().count || 0,
    published_results: resultsSnapshot.data().count || 0,
    subscription,
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

  if (payload.published) {
    // Only a genuine new publication consumes quota. Re-publishing an
    // already-published result is a harmless no-op and stays allowed.
    let unpublishedQuery = db.collection('results')
      .where('college_id', '==', cid)
      .where('course_id', '==', payload.course_id)
      .where('published', '==', false);
    if (payload.section_id) {
      unpublishedQuery = unpublishedQuery.where('section_id', '==', payload.section_id);
    }
    const unpublishedSnapshot = await unpublishedQuery.limit(1).get();
    if (!unpublishedSnapshot.empty) {
      await assertCanPublish(cid);
    }
  }

  const snapshot = await query.get();
  const batch = db.batch();

  const updateData = {
    published: payload.published,
    published_at: payload.published ? Timestamp.now() : null,
  };

  // Count distinct (course, section) groups that are genuinely new to this
  // publish, so the lifetime counter matches the group-based unit definition.
  const newGroups = new Set();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (payload.published && !data.published && data.exam_id == null) {
      newGroups.add(`${data.course_id}|${data.section_id || ''}`);
    }
    batch.update(doc.ref, updateData);
  });

  await batch.commit();

  // A genuine new publication consumes one lifetime slot per group for the
  // college. Record it only after the write succeeded so a failed publish never
  // burns quota. The counter is never decremented by clearing data.
  if (newGroups.size > 0) {
    await recordPublication(cid, newGroups.size);
  }

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
    sortBy: req.query.sort_by || null,
    sortOrder: req.query.sort_order || 'desc',
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
    sortBy: req.query.sort_by || null,
    sortOrder: req.query.sort_order || 'desc',
  });
  res.json({ college, course, students });
}

module.exports = { dashboard, recalculate, publish, exportExcel, exportData };
