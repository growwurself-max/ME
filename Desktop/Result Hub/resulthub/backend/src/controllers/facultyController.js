const { db, Timestamp } = require('../config/firebase');
const { notFound, forbidden, badRequest } = require('../utils/errors');
const { collegeId } = require('../middleware/auth');
const { recalculateExam } = require('../services/resultService');
const { facultyVerifySchema, facultyPreviewSchema, facultySubmitSchema } = require('../validation/schemas');
const excel = require('../services/excelService');

// ---- Share link helpers ---------------------------------------------------
// The share link carries only the context ids (course/section/subject/exam).
// Access is gated by the section's 4-digit faculty code, which is never
// embedded in the link itself.

function toBase64Url(raw) {
  return Buffer.from(raw).toString('base64url');
}

function fromBase64Url(token) {
  let t = String(token).replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) t += '=';
  return Buffer.from(t, 'base64').toString('utf8');
}

// Encode the four context ids into the share-link payload.
function buildFacultyLink(courseId, sectionId, subjectId, examId) {
  return toBase64Url(JSON.stringify({ c: courseId, s: sectionId, sub: subjectId, e: examId }));
}

function decodeFacultyLink(link) {
  try {
    const url = new URL(link);
    const token = url.searchParams.get('l');
    if (!token) return null;
    const payload = JSON.parse(fromBase64Url(token));
    if (!payload || typeof payload !== 'object') return null;
    const { c: courseId, s: sectionId, sub: subjectId, e: examId } = payload;
    if (![courseId, sectionId, subjectId, examId].every((x) => typeof x === 'string' && x.length > 0)) {
      return null;
    }
    return { courseId, sectionId, subjectId, examId };
  } catch (_) {
    return null;
  }
}

// Load and fully validate the context a faculty link points at. Every relation
// is cross-checked so a tampered link can never reach data it does not name.
async function loadContext(link) {
  const ctx = decodeFacultyLink(link);
  if (!ctx) throw badRequest('Invalid upload link');

  const examDoc = await db.collection('exams').doc(ctx.examId).get();
  if (!examDoc.exists) throw notFound('Exam not found');
  const exam = { id: examDoc.id, ...examDoc.data() };

  if (exam.course_id !== ctx.courseId || exam.section_id !== ctx.sectionId) {
    throw badRequest('Upload link does not match this exam');
  }

  const collegeDoc = await db.collection('colleges').doc(exam.college_id).get();
  if (!collegeDoc.exists) throw notFound('College not found');
  const collegeName = collegeDoc.data().name || '';

  const courseDoc = await db.collection('courses').doc(ctx.courseId).get();
  if (!courseDoc.exists || courseDoc.data().college_id !== exam.college_id) {
    throw notFound('Course not found');
  }
  const course = { id: courseDoc.id, name: courseDoc.data().name };

  const sectionDoc = await db.collection('sections').doc(ctx.sectionId).get();
  if (
    !sectionDoc.exists ||
    sectionDoc.data().course_id !== ctx.courseId ||
    sectionDoc.data().college_id !== exam.college_id
  ) {
    throw notFound('Section not found');
  }
  const section = { id: sectionDoc.id, ...sectionDoc.data() };

  const subjectDoc = await db.collection('subjects').doc(ctx.subjectId).get();
  if (!subjectDoc.exists || subjectDoc.data().course_id !== ctx.courseId) {
    throw notFound('Subject not found');
  }
  const subject = { id: subjectDoc.id, ...subjectDoc.data() };

  return { ctx, exam, course, section, subject, collegeName };
}

async function assertFacultyCode(section, code) {
  if (!section.faculty_code) {
    throw badRequest('Faculty upload code has not been configured for this section yet');
  }
  if (String(section.faculty_code) !== String(code)) {
    throw forbidden('Incorrect faculty upload code');
  }
}

async function loadSectionStudents(context) {
  const studentsSnapshot = await db.collection('students')
    .where('college_id', '==', context.exam.college_id)
    .where('course_id', '==', context.ctx.courseId)
    .where('section_id', '==', context.ctx.sectionId)
    .get();
  const students = studentsSnapshot.docs.map((d) => ({
    id: d.id,
    hall_ticket_number: d.data().hall_ticket_number,
    name: d.data().name,
  }));
  students.sort((a, b) =>
    String(a.hall_ticket_number).localeCompare(String(b.hall_ticket_number), undefined, { numeric: true })
  );
  return students;
}

// ---- College admin: per-exam subject upload status ------------------------
async function status(req, res) {
  const cid = collegeId(req);
  const { exam_id: examId } = req.query;
  if (!examId) throw badRequest('exam_id is required');

  const examDoc = await db.collection('exams').doc(examId).get();
  if (!examDoc.exists || examDoc.data().college_id !== cid) throw notFound('Exam not found');
  const exam = { id: examDoc.id, ...examDoc.data() };

  const collegeDoc = await db.collection('colleges').doc(cid).get();
  const collegeName = collegeDoc.exists ? collegeDoc.data().name : '';

  const courseDoc = await db.collection('courses').doc(exam.course_id).get();
  const course = courseDoc.exists
    ? { id: courseDoc.id, name: courseDoc.data().name }
    : null;

  const sectionDoc = await db.collection('sections').doc(exam.section_id).get();
  const section = sectionDoc.exists
    ? { id: sectionDoc.id, name: sectionDoc.data().name, faculty_code: sectionDoc.data().faculty_code || null }
    : null;

  const subjectsSnapshot = await db.collection('subjects')
    .where('course_id', '==', exam.course_id)
    .orderBy('position')
    .get();
  const subjects = subjectsSnapshot.docs.map((d) => ({ id: d.id, name: d.data().name }));

  const uploadsSnapshot = await db.collection('faculty_uploads')
    .where('exam_id', '==', examId)
    .get();
  const uploads = new Map(uploadsSnapshot.docs.map((d) => [d.data().subject_id, d.data()]));

  const subjectStatuses = subjects.map((s) => {
    const upload = uploads.get(s.id);
    return {
      id: s.id,
      name: s.name,
      status: upload ? 'Uploaded' : 'Pending',
      method: upload?.method || null,
      uploaded_at: upload?.uploaded_at?.toDate?.() || upload?.uploaded_at || null,
    };
  });

  res.json({
    college: { name: collegeName },
    exam: { id: exam.id, name: exam.name, type: exam.type, exam_date: exam.exam_date },
    course,
    section,
    subjects: subjectStatuses,
  });
}

// ---- Public faculty flow ---------------------------------------------------
// Step 0: show the faculty which course/section/exam/subject the link points
// at. Only names are returned here; no student data leaves the server until
// the 4-digit code has been verified.
async function contextInfo(req, res) {
  const link = typeof req.body?.link === 'string' ? req.body.link : null;
  if (!link) throw badRequest('link is required');
  const context = await loadContext(link);

  res.json({
    college: context.collegeName,
    course: context.course.name,
    section: context.section.name,
    exam: {
      name: context.exam.name,
      type: context.exam.type,
      exam_date: context.exam.exam_date,
    },
    subject: {
      name: context.subject.name,
      max_marks: Number(context.subject.max_marks),
      passing_marks: context.subject.passing_marks == null || context.subject.passing_marks === ''
        ? null
        : Number(context.subject.passing_marks),
    },
  });
}

// Step 1: faculty opens the link and enters the 4-digit code. On success the
// context and the section's student list (hall ticket numbers only, for that
// subject) are returned so marks can be filled or pasted.
async function verify(req, res) {
  const { link, code } = facultyVerifySchema.parse(req.body);
  const context = await loadContext(link);
  await assertFacultyCode(context.section, code);

  const students = await loadSectionStudents(context);

  const studentIds = students.map((s) => s.id);
  const existingMarks = new Map();
  for (let i = 0; i < studentIds.length; i += 10) {
    const chunkIds = studentIds.slice(i, i + 10);
    const marksSnapshot = await db.collection('student_marks')
      .where('student_id', 'in', chunkIds)
      .get();
    marksSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.subject_id === context.ctx.subjectId) {
        existingMarks.set(data.student_id, Number(data.marks));
      }
    });
  }

  // Whether this subject already has a faculty/import upload for this exam,
  // so the faculty page can show "Update Marks" instead of a first upload.
  const uploadRef = db.collection('faculty_uploads').doc(`${context.exam.id}_${context.ctx.subjectId}`);
  const uploadDoc = await uploadRef.get();

  res.json({
    college: context.collegeName,
    course: context.course.name,
    section: context.section.name,
    exam: {
      name: context.exam.name,
      type: context.exam.type,
      exam_date: context.exam.exam_date,
    },
    subject: {
      id: context.subject.id,
      name: context.subject.name,
      max_marks: Number(context.subject.max_marks),
      passing_marks: context.subject.passing_marks == null || context.subject.passing_marks === ''
        ? null
        : Number(context.subject.passing_marks),
    },
    uploaded: uploadDoc.exists,
    students: students.map((s) => ({
      hall_ticket_number: s.hall_ticket_number,
      name: s.name,
      marks: existingMarks.get(s.id) ?? '',
    })),
  });
}

// Step 1b: download the subject template for the verified upload context. The
// template always uses the official fixed columns (Hall Ticket Number, Student
// Name, Marks) and is pre-filled with the section's students.
async function subjectTemplate(req, res) {
  const link = typeof req.query.link === 'string' ? req.query.link : null;
  const code = typeof req.query.code === 'string' ? req.query.code : null;
  if (!link || !code) throw badRequest('link and code are required');

  const context = await loadContext(link);
  await assertFacultyCode(context.section, code);

  const students = await loadSectionStudents(context);

  const buffer = excel.buildSubjectTemplate(context.subject, students);
  const fileName = `${context.subject.name.replace(/[^a-z0-9]+/gi, '_')}_marks_template.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(buffer);
}

// Step 1c: preview subject marks from an Excel file or pasted rows before
// anything is saved. Validation is done server-side so errors are precise
// ("Row 12 — Marks must be numeric", "Row 7 — Duplicate Hall Ticket Number in uploaded file").
async function preview(req, res) {
  let link;
  let code;
  let data = null;

  if (req.file) {
    link = typeof req.body?.link === 'string' ? req.body.link : null;
    code = typeof req.body?.code === 'string' ? req.body.code : null;
  } else {
    const parsed = facultyPreviewSchema.parse(req.body);
    link = parsed.link;
    code = parsed.code;
    data = parsed.data || null;
  }

  if (!link || !code) throw badRequest('link and code are required');
  const context = await loadContext(link);
  await assertFacultyCode(context.section, code);

  const students = await loadSectionStudents(context);

  const rawRows = req.file
    ? excel.readWorkbook(req.file.buffer)
    : excel.readSubjectData(data, context.subject);

  const { rows, errors, warnings } = excel.parseSubjectRows(rawRows, {
    students,
    subject: context.subject,
  });

  res.json({
    college: context.collegeName,
    course: context.course.name,
    section: context.section.name,
    exam: {
      name: context.exam.name,
      type: context.exam.type,
      exam_date: context.exam.exam_date,
    },
    subject: {
      name: context.subject.name,
      max_marks: Number(context.subject.max_marks),
    },
    rows,
    errors,
    warnings,
    raw: req.file ? excel.readMatrix(req.file.buffer) : excel.parseDelimited(data),
    summary: {
      total: rawRows.length,
      valid: rows.length,
      invalid: errors.length,
      skipped: new Set(errors.map((e) => e.row)).size,
      duplicates: errors.filter((e) => /duplicate/i.test(e.message)).length,
    },
  });
}

// Step 2: write the submitted marks for the single subject of the link. Only
// that subject's marks are touched; everything else (other subjects, ranking,
// pass/fail, publishing) flows through the existing recalculate logic.
async function submit(req, res) {
  const { link, code, marks } = facultySubmitSchema.parse(req.body);
  const context = await loadContext(link);
  await assertFacultyCode(context.section, code);

  const subjectId = context.ctx.subjectId;
  const maxMarks = Number(context.subject.max_marks);

  const studentsSnapshot = await db.collection('students')
    .where('college_id', '==', context.exam.college_id)
    .where('course_id', '==', context.ctx.courseId)
    .where('section_id', '==', context.ctx.sectionId)
    .get();
  const byHallTicket = new Map();
  studentsSnapshot.docs.forEach((doc) => {
    byHallTicket.set(String(doc.data().hall_ticket_number).trim().toLowerCase(), doc.id);
  });

  const ops = [];

  // Pure decision logic: which rows are accepted, which students are new, and
  // which rows are skipped (with reasons). Hall Ticket Numbers never need to
  // pre-exist — new ones create a student record automatically.
  const plan = excel.planMarksSubmission(marks, {
    knownHallKeys: new Set(byHallTicket.keys()),
    maxMarks,
  });

  if (plan.updated === 0) {
    const detail = plan.skippedReasons.length
      ? ` Reasons: ${plan.skippedReasons.join('; ')}.`
      : ' No rows were recognised as valid marks.';
    throw badRequest(`No valid marks could be submitted.${detail}`);
  }

  for (const row of plan.accepted) {
    const key = row.hall_ticket_number.toLowerCase();
    let studentId = byHallTicket.get(key);

    if (row.isNew) {
      const newRef = db.collection('students').doc();
      ops.push({
        type: 'student-set',
        ref: newRef,
        data: {
          college_id: context.exam.college_id,
          course_id: context.ctx.courseId,
          section_id: context.ctx.sectionId,
          hall_ticket_number: row.hall_ticket_number,
          name: row.name,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        },
      });
      studentId = newRef.id;
      byHallTicket.set(key, studentId);
    }

    const existing = await db.collection('student_marks')
      .where('student_id', '==', studentId)
      .where('subject_id', '==', subjectId)
      .limit(1)
      .get();

    const markData = {
      student_id: studentId,
      subject_id: subjectId,
      marks: row.marks,
      updated_at: Timestamp.now(),
    };
    if (!existing.empty) {
      ops.push({ type: 'update', ref: existing.docs[0].ref, data: markData });
    } else {
      ops.push({ type: 'set', ref: db.collection('student_marks').doc(`${studentId}_${subjectId}`), data: markData });
    }
  }

  // Chunked so we stay under the 500-operation Firestore batch limit.
  for (let i = 0; i < ops.length; i += 450) {
    const batch = db.batch();
    ops.slice(i, i + 450).forEach((op) => {
      if (op.type === 'update') batch.update(op.ref, op.data);
      else if (op.type === 'student-set') batch.set(op.ref, op.data);
      else batch.set(op.ref, op.data);
    });
    await batch.commit();
  }

  // Record completion so the college admin sees this subject as Uploaded.
  const uploadRef = db.collection('faculty_uploads').doc(`${context.exam.id}_${subjectId}`);
  const wasUpdate = (await uploadRef.get()).exists;
  await uploadRef.set({
    college_id: context.exam.college_id,
    course_id: context.ctx.courseId,
    section_id: context.ctx.sectionId,
    exam_id: context.exam.id,
    subject_id: subjectId,
    method: 'faculty',
    uploaded_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });

  // Recompute this exam's stored results using the existing calculation logic.
  await recalculateExam(context.exam.college_id, context.exam.id);

  // Faculty uploads are saved for college review only — they never publish.
  // New/updated marks stay hidden from students until the college admin
  // reviews and publishes the final result.
  await db.collection('exams').doc(context.exam.id).update({
    published: false,
    published_at: null,
    updated_at: Timestamp.now(),
  });
  const examResultsSnapshot = await db.collection('results')
    .where('exam_id', '==', context.exam.id)
    .get();
  if (!examResultsSnapshot.empty) {
    const draftBatch = db.batch();
    examResultsSnapshot.forEach((doc) => {
      draftBatch.update(doc.ref, { published: false, published_at: null });
    });
    await draftBatch.commit();
  }

  res.json({ updated: plan.updated, skipped: plan.skipped, was_update: wasUpdate, created: plan.created });
}

module.exports = {
  buildFacultyLink,
  decodeFacultyLink,
  status,
  contextInfo,
  verify,
  subjectTemplate,
  preview,
  submit,
};
