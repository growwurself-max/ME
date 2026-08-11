const { db } = require('../config/firebase');
const { notFound } = require('../utils/errors');
const { studentLookupSchema } = require('../validation/schemas');

async function findResult(req, res) {
  const { identifier } = studentLookupSchema.parse({
    identifier: req.query.identifier ?? req.body?.identifier,
  });

  let studentsSnapshot = await db.collection('students')
    .where('roll_number', '==', identifier)
    .limit(5)
    .get();

  if (studentsSnapshot.empty) {
    const hallTicketSnapshot = await db.collection('students')
      .where('hall_ticket_number', '==', identifier)
      .limit(5)
      .get();
    
    if (hallTicketSnapshot.empty) {
      throw notFound('No published result found for this Hall Ticket / Roll Number.');
    }
    
    studentsSnapshot = hallTicketSnapshot;
  }

  let student = null;
  for (const doc of studentsSnapshot.docs) {
    student = { id: doc.id, ...doc.data() };
    break;
  }

  if (!student) throw notFound('No published result found for this Hall Ticket / Roll Number.');

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

  if (resultsSnapshot.empty) throw notFound('No published result found for this Hall Ticket / Roll Number.');

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

  const collegeDoc = await db.collection('colleges').doc(student.college_id).get();
  const college = collegeDoc.exists ? collegeDoc.data().name : '';

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

  const subjects = subjectsSnapshot.docs.map(doc => {
    const s = doc.data();
    return {
      name: s.name,
      max_marks: Number(s.max_marks),
      passing_marks: Number(s.passing_marks),
      marks: marksById.get(doc.id) ?? null,
      status: course.enable_pass_fail
        ? (marksById.get(doc.id) ?? -1) >= Number(s.passing_marks)
          ? 'PASS'
          : 'FAIL'
        : null,
    };
  });

  const latestResult = results[0];
  const previousResults = results.slice(1);

  const formatResult = (r) => ({
    exam_name: r.exam?.name || 'Result',
    exam_type: r.exam?.type || null,
    exam_date: r.exam?.exam_date || null,
    total_marks: r.total_marks,
    max_total_marks: r.max_total_marks,
    percentage: course.enable_percentage ? r.percentage : null,
    status: course.enable_pass_fail ? r.status : null,
    grade: course.enable_grade ? r.grade : null,
    section_rank: course.enable_ranking ? r.section_rank : null,
    course_rank: course.enable_ranking ? r.course_rank : null,
    published_at: r.published_at?.toDate?.() || r.published_at,
  });

  res.json({
    student: {
      name: student.name,
      roll_number: student.roll_number,
      hall_ticket_number: student.hall_ticket_number,
      college,
      course: course.name,
      section,
    },
    subjects,
    latest_result: latestResult ? formatResult(latestResult) : null,
    previous_results: previousResults.map(formatResult),
  });
}

module.exports = { findResult };
