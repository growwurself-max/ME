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
  const { course_id: courseId, section_id: sectionId, column_overrides } = req.body;
  if (!req.file) throw badRequest('Excel file is required');
  if (!courseId || !sectionId) throw badRequest('course_id and section_id are required');

  const course = await loadCourse(cid, courseId);
  const section = (course.sections || []).find((s) => s.id === sectionId);
  if (!section) throw badRequest('Selected section does not belong to this course');

  const existingSnapshot = await db.collection('students')
    .where('college_id', '==', cid)
    .where('course_id', '==', courseId)
    .select('hall_ticket_number')
    .get();
  
  const existing = existingSnapshot.docs.map(doc => doc.data());
  const existingHallTickets = new Set(existing.map((s) => s.hall_ticket_number.toLowerCase()));

  const raw = excel.readWorkbook(req.file.buffer);
  let overrides = column_overrides;
  if (typeof overrides === 'string' && overrides) {
    try { overrides = JSON.parse(overrides); } catch (_) { overrides = undefined; }
  }
  const { rows, errors, warnings, suggestions, unrecognised } = excel.validateRows(raw, {
    subjects: course.subjects,
    sections: course.sections || [],
    expectedSectionName: section.name,
    existingHallTickets,
    columnOverrides: overrides,
  });

  res.json({
    course: { id: course.id, name: course.name },
    section,
    subjects: course.subjects,
    rows,
    errors,
    warnings,
    suggestions,
    unrecognised,
    raw: excel.readMatrix(req.file.buffer),
    summary: {
      total: raw.length,
      valid: rows.length,
      invalid: errors.length,
      skipped: new Set(errors.map((e) => e.row)).size,
      duplicates: errors.filter((e) => /duplicate/i.test(e.message)).length,
    },
  });
}

async function previewPaste(req, res) {
  const cid = collegeId(req);
  const { course_id: courseId, section_id: sectionId, data, column_overrides } = req.body;
  if (!data || typeof data !== 'string' || !data.trim()) throw badRequest('Pasted data is required');
  if (!courseId || !sectionId) throw badRequest('course_id and section_id are required');

  const course = await loadCourse(cid, courseId);
  const section = (course.sections || []).find((s) => s.id === sectionId);
  if (!section) throw badRequest('Selected section does not belong to this course');

  const existingSnapshot = await db.collection('students')
    .where('college_id', '==', cid)
    .where('course_id', '==', courseId)
    .select('hall_ticket_number')
    .get();
  
  const existing = existingSnapshot.docs.map(doc => doc.data());
  const existingHallTickets = new Set(existing.map((s) => s.hall_ticket_number.toLowerCase()));

  const raw = excel.readPastedData(data, course.subjects);
  const { rows, errors, warnings, suggestions, unrecognised } = excel.validateRows(raw, {
    subjects: course.subjects,
    sections: course.sections || [],
    expectedSectionName: section.name,
    existingHallTickets,
    columnOverrides: column_overrides,
  });

  res.json({
    course: { id: course.id, name: course.name },
    section,
    subjects: course.subjects,
    rows,
    errors,
    warnings,
    suggestions,
    unrecognised,
    raw: excel.parseDelimited(data),
    summary: {
      total: raw.length,
      valid: rows.length,
      invalid: errors.length,
      skipped: new Set(errors.map((e) => e.row)).size,
      duplicates: errors.filter((e) => /duplicate/i.test(e.message)).length,
    },
  });
}

async function commit(req, res) {
  const cid = collegeId(req);
  const { course_id: courseId, section_id: sectionId, rows, exam_id, exam_name, exam_type, exam_date } = req.body;
  if (!courseId || !sectionId || !Array.isArray(rows) || rows.length === 0) {
    throw badRequest('course_id, section_id and at least one row are required');
  }
  const course = await loadCourse(cid, courseId);
  const validSubjects = new Set(course.subjects.map((s) => s.id));
  const section = (course.sections || []).find((s) => s.id === sectionId);
  if (!section) throw badRequest('Selected section does not belong to this course');

  let examId = null;
  if (exam_id) {
    const examDoc = await db.collection('exams').doc(exam_id).get();
    if (!examDoc.exists || examDoc.data().college_id !== cid) throw notFound('Exam not found');
    if (examDoc.data().course_id !== courseId || examDoc.data().section_id !== sectionId) {
      throw badRequest('Exam does not match the selected course and section');
    }
    examId = exam_id;
  } else if (exam_name && exam_type && exam_date) {
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

  // Hall Ticket Numbers are treated as plain unique strings. Students that
  // already exist for this course are updated (never duplicated); brand-new
  // numbers create a fresh student record automatically.
  const existingSnapshot = await db.collection('students')
    .where('college_id', '==', cid)
    .where('course_id', '==', courseId)
    .select('hall_ticket_number')
    .get();
  const studentByHall = new Map();
  existingSnapshot.docs.forEach((doc) => {
    studentByHall.set(String(doc.data().hall_ticket_number).trim().toLowerCase(), doc.id);
  });

  const imported = [];
  const studentRefs = new Map(); // studentId -> { hall_ticket_number, name }
  const markRows = [];           // { studentId, marks }

  for (const row of rows) {
    const hall = String(row.hall_ticket_number).trim();
    const hallKey = hall.toLowerCase();
    const name = String(row.name).trim();
    const subjects = Object.keys(row.marks || {}).filter((sid) => validSubjects.has(sid));

    let studentId = studentByHall.get(hallKey);
    if (studentId) {
      studentRefs.set(studentId, { hall_ticket_number: hall, name });
    } else {
      const studentRef = db.collection('students').doc();
      studentId = studentRef.id;
      studentByHall.set(hallKey, studentId);
      studentRefs.set(studentId, { hall_ticket_number: hall, name, isNew: true });
    }
    if (subjects.length > 0) markRows.push({ studentId, marks: row.marks });
    imported.push(studentId);
  }

  // Write student records in chunks (create new, update existing name/section).
  const studentOps = [];
  studentRefs.forEach((info, studentId) => {
    const ref = db.collection('students').doc(studentId);
    if (info.isNew) {
      studentOps.push({
        type: 'set',
        ref,
        data: {
          college_id: cid,
          course_id: courseId,
          section_id: sectionId,
          hall_ticket_number: info.hall_ticket_number,
          name: info.name,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        },
      });
    } else {
      studentOps.push({
        type: 'update',
        ref,
        data: { name: info.name, section_id: sectionId, updated_at: Timestamp.now() },
      });
    }
  });
  for (let i = 0; i < studentOps.length; i += 400) {
    const batch = db.batch();
    studentOps.slice(i, i + 400).forEach((op) => {
      if (op.type === 'update') batch.update(op.ref, op.data);
      else batch.set(op.ref, op.data);
    });
    await batch.commit();
  }

  // Replace the imported students' marks so re-imports never double-count.
  if (markRows.length > 0) {
    const allStudentIds = [...new Set(markRows.map((m) => m.studentId))];
    for (let i = 0; i < allStudentIds.length; i += 10) {
      const chunkIds = allStudentIds.slice(i, i + 10);
      const existingMarks = await db.collection('student_marks')
        .where('student_id', 'in', chunkIds)
        .get();
      if (!existingMarks.empty) {
        const deleteBatch = db.batch();
        existingMarks.forEach((doc) => deleteBatch.delete(doc.ref));
        await deleteBatch.commit();
      }
    }

    for (let i = 0; i < markRows.length; i += 400) {
      const markBatch = db.batch();
      markRows.slice(i, i + 400).forEach(({ studentId, marks }) => {
        Object.entries(marks).forEach(([subjectId, value]) => {
          if (validSubjects.has(subjectId)) {
            const markRef = db.collection('student_marks').doc(`${studentId}_${subjectId}`);
            markBatch.set(markRef, {
              student_id: studentId,
              subject_id: subjectId,
              marks: Number(value),
            });
          }
        });
      });
      await markBatch.commit();
    }
  }

  if (examId) {
    // When an exam is populated through the complete Excel import, mark every
    // subject it covers as Uploaded so the faculty status view stays accurate.
    const coveredSubjects = new Set();
    markRows.forEach(({ marks }) => {
      Object.keys(marks).forEach((subjectId) => {
        if (validSubjects.has(subjectId)) coveredSubjects.add(subjectId);
      });
    });
    if (coveredSubjects.size > 0) {
      const facultyBatch = db.batch();
      coveredSubjects.forEach((subjectId) => {
        facultyBatch.set(
          db.collection('faculty_uploads').doc(`${examId}_${subjectId}`),
          {
            college_id: cid,
            course_id: courseId,
            section_id: sectionId,
            exam_id: examId,
            subject_id: subjectId,
            method: 'import',
            uploaded_at: Timestamp.now(),
            updated_at: Timestamp.now(),
          }
        );
      });
      await facultyBatch.commit();
    }
    await recalculateExam(cid, examId);
  } else {
    await recalculateCourse(cid, courseId);
  }

  res.status(201).json({ imported: imported.length, exam_id: examId });
}

module.exports = { template, preview, previewPaste, commit };
