const { db, Timestamp } = require('../config/firebase');
const { notFound, badRequest } = require('../utils/errors');
const { collegeId } = require('../middleware/auth');
const { studentSchema, studentUpdateSchema } = require('../validation/schemas');
const { recalculateCourse, recalculateExam } = require('../services/resultService');
const { listStudents } = require('../services/studentQueryService');
const { purgeStudent } = require('../services/storageService');

async function list(req, res) {
  const students = await listStudents(collegeId(req), {
    courseId: req.query.course_id || null,
    sectionId: req.query.section_id || null,
    examId: req.query.exam_id || null,
    status: req.query.status || null,
    search: (req.query.search || '').trim() || null,
    sortBy: req.query.sort_by || null,
    sortOrder: req.query.sort_order || 'desc',
  });
  res.json({ students });
}

async function assertScope(cid, courseId, sectionId) {
  const sectionDoc = await db.collection('sections').doc(sectionId).get();
  if (!sectionDoc.exists || sectionDoc.data().college_id !== cid) {
    throw notFound('Section not found');
  }
  if (sectionDoc.data().course_id !== courseId) {
    throw badRequest('Section does not belong to the selected course');
  }
}

async function saveMarks(studentId, marks) {
  const marksSnapshot = await db.collection('student_marks')
    .where('student_id', '==', studentId)
    .get();
  
  const batch = db.batch();
  marksSnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  Object.entries(marks || {}).forEach(([subjectId, value]) => {
    const ref = db.collection('student_marks').doc();
    batch.set(ref, {
      student_id: studentId,
      subject_id: subjectId,
      marks: value,
    });
  });
  
  await batch.commit();
}

async function create(req, res) {
  const cid = collegeId(req);
  const payload = studentSchema.parse(req.body);
  await assertScope(cid, payload.course_id, payload.section_id);

  const studentRef = await db.collection('students').add({
    college_id: cid,
    course_id: payload.course_id,
    section_id: payload.section_id,
    hall_ticket_number: payload.hall_ticket_number,
    name: payload.name,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });
  
  await saveMarks(studentRef.id, payload.marks);
  
  if (payload.exam_id) {
    await recalculateExam(cid, payload.exam_id);
  } else {
    await recalculateCourse(cid, payload.course_id);
  }
  
  res.status(201).json({ id: studentRef.id });
}

async function update(req, res) {
  const cid = collegeId(req);
  const payload = studentUpdateSchema.parse(req.body);
  
  const studentRef = db.collection('students').doc(req.params.id);
  const studentDoc = await studentRef.get();
  
  if (!studentDoc.exists || studentDoc.data().college_id !== cid) {
    throw notFound('Student not found');
  }

  const courseId = payload.course_id || studentDoc.data().course_id;
  const sectionId = payload.section_id || studentDoc.data().section_id;
  await assertScope(cid, courseId, sectionId);

  const updateData = {
    course_id: courseId,
    section_id: sectionId,
    updated_at: Timestamp.now(),
  };
  
  if (payload.hall_ticket_number !== undefined) updateData.hall_ticket_number = payload.hall_ticket_number;
  if (payload.name !== undefined) updateData.name = payload.name;
  
  await studentRef.update(updateData);

  if (payload.marks) await saveMarks(req.params.id, payload.marks);

  if (payload.exam_id) {
    await recalculateExam(cid, payload.exam_id);
  } else {
    await recalculateCourse(cid, courseId);
    if (courseId !== studentDoc.data().course_id) {
      await recalculateCourse(cid, studentDoc.data().course_id);
    }
  }
  res.json({ ok: true });
}

async function remove(req, res) {
  const cid = collegeId(req);
  const studentRef = db.collection('students').doc(req.params.id);
  const studentDoc = await studentRef.get();
  
  if (!studentDoc.exists || studentDoc.data().college_id !== cid) {
    throw notFound('Student not found');
  }
  
  const courseId = studentDoc.data().course_id;
  await purgeStudent(req.params.id);
  await recalculateCourse(cid, courseId);
  res.json({ ok: true });
}

module.exports = { list, create, update, remove, saveMarks };
