const { db } = require('../config/firebase');
const { notFound } = require('../utils/errors');
const { studentLookupSchema } = require('../validation/schemas');

async function findResult(req, res) {
  const parsed = studentLookupSchema.parse({
    identifier: req.query.identifier ?? req.body?.identifier,
    name: req.query.name ?? req.body?.name,
    exam_name: req.query.exam_name ?? req.body?.exam_name,
    exam_date: req.query.exam_date ?? req.body?.exam_date,
  });

  let studentsSnapshot = await db.collection('students')
    .where('hall_ticket_number', '==', parsed.identifier)
    .limit(5)
    .get();

  if (studentsSnapshot.empty) {
    throw notFound('No published result found for this Hall Ticket Number.');
  }

  let student = null;
  for (const doc of studentsSnapshot.docs) {
    student = { id: doc.id, ...doc.data() };
    break;
  }

  if (!student) throw notFound('No published result found for this Hall Ticket Number.');

  // Optional name verification: if a name is supplied it must match the
  // matched student, otherwise we refuse to return the result.
  if (parsed.name) {
    const nameTerm = parsed.name.trim().toLowerCase();
    const matches = studentsSnapshot.docs.some(
      (doc) => String(doc.data().name || '').trim().toLowerCase() === nameTerm
    );
    if (!matches) {
      throw notFound('No published result found for this name and Hall Ticket Number.');
    }
  }

  let resultsSnapshot = await db.collection('results')
    .where('student_id', '==', student.id)
    .where('published', '==', true)
    .get();

  if (resultsSnapshot.empty) {
    resultsSnapshot = await db.collection('results')
      .where('student_id', '==', student.id)
      .where('published', '==', true)
      .where('exam_id', '==', null)
      .get();
  }

  if (resultsSnapshot.empty) throw notFound('No published result found for this Hall Ticket Number.');

  const results = [];
  for (const resultDoc of resultsSnapshot.docs) {
    const result = { id: resultDoc.id, ...resultDoc.data() };
    let exam = null;
    if (result.exam_id) {
      const examDoc = await db.collection('exams').doc(result.exam_id).get();
      if (examDoc.exists) {
        exam = { id: examDoc.id, ...examDoc.data() };
      }
    }
    results.push({ ...result, exam });
  }

  results.sort((a, b) => {
    const dateA = a.exam?.exam_date || '1970-01-01';
    const dateB = b.exam?.exam_date || '1970-01-01';
    return dateB.localeCompare(dateA);
  });

  // Optional exam filters applied after sorting (latest published stays first).
  const filtered = results.filter((r) => {
    if (parsed.exam_name && !(r.exam?.name || '').toLowerCase().includes(parsed.exam_name.toLowerCase())) {
      return false;
    }
    if (parsed.exam_date && (r.exam?.exam_date || '') !== parsed.exam_date) {
      return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    throw notFound('No published result matches the selected filters.');
  }

  const collegeDoc = await db.collection('colleges').doc(student.college_id).get();
  const college = collegeDoc.exists ? collegeDoc.data() : {};
  const collegeData = {
    name: college.name || '',
    principal_name: college.principal_name || '',
    email: college.email || '',
    phone: college.phone || '',
  };

  const courseDoc = await db.collection('courses').doc(student.course_id).get();
  const course = courseDoc.exists ? { id: courseDoc.id, ...courseDoc.data() } : {};

  const sectionDoc = await db.collection('sections').doc(student.section_id).get();
  const section = sectionDoc.exists ? sectionDoc.data().name : '';

  const subjectsSnapshot = await db.collection('subjects')
    .where('course_id', '==', student.course_id)
    .orderBy('position')
    .get();

  const marksSnapshot = await db.collection('student_marks')
    .where('student_id', '==', student.id)
    .get();

  const marksById = new Map(marksSnapshot.docs.map(doc => [doc.data().subject_id, Number(doc.data().marks)]));

  // Pass/fail visibility follows the selected result's exam toggle, falling
  // back to the course rule for legacy results.
  const passFailEnabledFor = (result) => {
    const exam = result?.exam || null;
    if (exam && exam.enable_pass_fail !== undefined) return Boolean(exam.enable_pass_fail);
    return Boolean(course.enable_pass_fail);
  };

  const latestResult = filtered[0];
  const enablePassFail = passFailEnabledFor(latestResult);

  const subjects = subjectsSnapshot.docs.map(doc => {
    const s = doc.data();
    const passing = s.passing_marks == null || s.passing_marks === '' ? null : Number(s.passing_marks);
    const mark = marksById.get(doc.id) ?? null;
    return {
      name: s.name,
      max_marks: Number(s.max_marks),
      passing_marks: passing,
      marks: mark,
      status: enablePassFail
        ? passing == null
          ? null
          : (mark ?? -1) >= passing
            ? 'PASS'
            : 'FAIL'
        : null,
    };
  });

  const previousResults = filtered.slice(1);

  const formatResult = (r) => ({
    exam_name: r.exam?.name || 'Result',
    exam_type: r.exam?.type || null,
    exam_date: r.exam?.exam_date || null,
    total_marks: r.total_marks,
    max_total_marks: r.max_total_marks,
    percentage: course.enable_percentage ? r.percentage : null,
    status: passFailEnabledFor(r) ? r.status : null,
    grade: course.enable_grade ? r.grade : null,
    section_rank: course.enable_ranking ? r.section_rank : null,
    course_rank: course.enable_ranking ? r.course_rank : null,
    published_at: r.published_at?.toDate?.() || r.published_at,
  });

  res.json({
    college: collegeData,
    student: {
      name: student.name,
      hall_ticket_number: student.hall_ticket_number,
      college: collegeData.name,
      course: course.name,
      section,
    },
    subjects,
    latest_result: latestResult ? formatResult(latestResult) : null,
    previous_results: previousResults.map(formatResult),
  });
}

module.exports = { findResult };
