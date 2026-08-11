const { db, Timestamp } = require('../config/firebase');
const { notFound, badRequest } = require('../utils/errors');
const { collegeId } = require('../middleware/auth');
const excel = require('../services/excelService');
const { recalculateCourse, recalculateExam } = require('../services/resultService');

async function loadCourse(cid, courseId) {
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
  
  const sectionsSnapshot = await db.collection('sections')
    .where('course_id', '==', courseId)
    .orderBy('name')
    .get();
  course.sections = sectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  return course;
}

async function template(req, res) {
  const cid = collegeId(req);
  if (!req.query.course_id) throw badRequest('course_id is required');
  const course = await loadCourse(cid, req.query.course_id);
  if (course.subjects.length === 0) throw badRequest('Configure subjects for this course first');

  const buffer = excel.buildTemplate(course, course.subjects, course.sections || []);
  const fileName = `${course.name.replace(/[^a-z0-9]+/gi, '_')}_template.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(buffer);
}

async function preview(req, res) {
  const cid = collegeId(req);
  const { course_id: courseId, section_id: sectionId } = req.body;
  if (!req.file) throw badRequest('Excel file is required');
  if (!courseId || !sectionId) throw badRequest('course_id and section_id are required');

  const course = await loadCourse(cid, courseId);
  const section = (course.sections || []).find((s) => s.id === sectionId);
  if (!section) throw badRequest('Selected section does not belong to this course');

  const existingSnapshot = await db.collection('students')
    .where('college_id', '==', cid)
    .where('course_id', '==', courseId)
    .select('roll_number')
    .get();
  
  const existing = existingSnapshot.docs.map(doc => doc.data());
  const existingRolls = new Set(existing.map((s) => s.roll_number.toLowerCase()));

  const raw = excel.readWorkbook(req.file.buffer);
  const { rows, errors } = excel.validateRows(raw, {
    subjects: course.subjects,
    sections: course.sections || [],
    expectedSectionName: section.name,
    existingRolls,
  });

  res.json({
    course: { id: course.id, name: course.name },
    section,
    subjects: course.subjects,
    rows,
    errors,
    summary: { total: raw.length, valid: rows.length, invalid: errors.length },
  });
}

async function commit(req, res) {
  const cid = collegeId(req);
  const { course_id: courseId, section_id: sectionId, rows, exam_name, exam_type, exam_date } = req.body;
  if (!courseId || !sectionId || !Array.isArray(rows) || rows.length === 0) {
    throw badRequest('course_id, section_id and at least one row are required');
  }
  const course = await loadCourse(cid, courseId);
  const validSubjects = new Set(course.subjects.map((s) => s.id));
  const section = (course.sections || []).find((s) => s.id === sectionId);
  if (!section) throw badRequest('Selected section does not belong to this course');

  let examId = null;
  if (exam_name && exam_type && exam_date) {
    const examRef = await db.collection('exams').add({
      college_id: cid,
      name: exam_name,
      type: exam_type,
      exam_date: exam_date,
      course_id: courseId,
      section_id: sectionId,
      published: false,
      published_at: null,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });
    examId = examRef.id;
  }

  const batch = db.batch();
  const studentRefs = [];
  
  rows.forEach((row) => {
    const studentRef = db.collection('students').doc();
    batch.set(studentRef, {
      college_id: cid,
      course_id: courseId,
      section_id: sectionId,
      roll_number: String(row.roll_number).trim(),
      hall_ticket_number: String(row.hall_ticket_number).trim(),
      name: String(row.name).trim(),
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });
    studentRefs.push({ ref: studentRef, roll_number: String(row.roll_number).trim() });
  });
  
  await batch.commit();
  
  const markBatch = db.batch();
  studentRefs.forEach(({ ref, roll_number }) => {
    const source = rows.find(
      (r) => String(r.roll_number).trim().toLowerCase() === roll_number.toLowerCase()
    );
    Object.entries(source?.marks || {}).forEach(([subjectId, value]) => {
      if (validSubjects.has(subjectId)) {
        const markRef = db.collection('student_marks').doc();
        markBatch.set(markRef, {
          student_id: ref.id,
          subject_id: subjectId,
          marks: Number(value),
        });
      }
    });
  });
  await markBatch.commit();

  if (examId) {
    await recalculateExam(cid, examId);
  } else {
    await recalculateCourse(cid, courseId);
  }
  
  res.status(201).json({ imported: studentRefs.length, exam_id: examId });
}

module.exports = { template, preview, commit };
