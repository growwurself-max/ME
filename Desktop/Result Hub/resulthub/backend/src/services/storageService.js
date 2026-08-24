const { db } = require('../config/firebase');

// Firestore limits used throughout this service.
const BATCH_WRITES = 500; // max writes per batch commit
const IN_LIMIT = 10;      // max values per 'in' filter

// Return the refs of every document where field == value. Data is projected
// down to just the filter field so large collections transfer little payload.
async function refsWhere(collection, field, value) {
  const snapshot = await db.collection(collection).where(field, '==', value).select(field).get();
  return snapshot.docs.map((doc) => doc.ref);
}

// Return refs for a batch of ids using 'in', chunked to Firestore's 10-value cap.
async function refsWhereIn(collection, field, values) {
  const refs = [];
  for (let i = 0; i < values.length; i += IN_LIMIT) {
    const snapshot = await db.collection(collection)
      .where(field, 'in', values.slice(i, i + IN_LIMIT))
      .select(field)
      .get();
    snapshot.docs.forEach((doc) => refs.push(doc.ref));
  }
  return refs;
}

// Delete refs in commits of at most 500 writes each.
async function deleteRefs(refs) {
  for (let i = 0; i < refs.length; i += BATCH_WRITES) {
    const batch = db.batch();
    refs.slice(i, i + BATCH_WRITES).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
  return refs.length;
}

// Remove every document where field == value (returns how many were removed).
async function deleteWhere(collection, field, value) {
  const refs = await refsWhere(collection, field, value);
  return deleteRefs(refs);
}

// ---- Course cascade --------------------------------------------------------
// Course + its subjects, sections, students, their marks, results, exams and
// faculty uploads. Verifying ownership is the caller's responsibility.
async function purgeCourse(collegeId, courseId) {
  const courseRef = db.collection('courses').doc(courseId);
  const refs = [courseRef];

  refs.push(...await refsWhere('subjects', 'course_id', courseId));
  refs.push(...await refsWhere('sections', 'course_id', courseId));
  refs.push(...await refsWhere('results', 'course_id', courseId));
  refs.push(...await refsWhere('exams', 'course_id', courseId));
  refs.push(...await refsWhere('faculty_uploads', 'course_id', courseId));

  const studentSnapshot = await db.collection('students')
    .where('college_id', '==', collegeId)
    .where('course_id', '==', courseId)
    .select('course_id')
    .get();
  const studentRefs = studentSnapshot.docs.map((doc) => doc.ref);
  refs.push(...studentRefs);
  const studentIds = studentRefs.map((ref) => ref.id);
  if (studentIds.length > 0) {
    refs.push(...await refsWhereIn('student_marks', 'student_id', studentIds));
  }

  return deleteRefs(refs);
}

// ---- Section cascade -------------------------------------------------------
// Section + its students, their marks, results, exams and faculty uploads.
async function purgeSection(collegeId, sectionId) {
  const sectionRef = db.collection('sections').doc(sectionId);
  const refs = [sectionRef];

  const studentSnapshot = await db.collection('students')
    .where('college_id', '==', collegeId)
    .where('section_id', '==', sectionId)
    .select('section_id')
    .get();
  const studentRefs = studentSnapshot.docs.map((doc) => doc.ref);
  refs.push(...studentRefs);
  const studentIds = studentRefs.map((ref) => ref.id);
  if (studentIds.length > 0) {
    refs.push(...await refsWhereIn('student_marks', 'student_id', studentIds));
  }

  refs.push(...await refsWhere('results', 'section_id', sectionId));
  refs.push(...await refsWhere('exams', 'section_id', sectionId));
  refs.push(...await refsWhere('faculty_uploads', 'section_id', sectionId));

  return deleteRefs(refs);
}

// ---- Exam cascade ----------------------------------------------------------
// Exam + its generated results and faculty upload records.
async function purgeExam(examId) {
  const refs = [db.collection('exams').doc(examId)];
  refs.push(...await refsWhere('results', 'exam_id', examId));
  refs.push(...await refsWhere('faculty_uploads', 'exam_id', examId));
  return deleteRefs(refs);
}

// ---- Student cascade -------------------------------------------------------
// Student + their marks and every generated result row.
async function purgeStudent(studentId) {
  const refs = [db.collection('students').doc(studentId)];
  refs.push(...await refsWhere('student_marks', 'student_id', studentId));
  refs.push(...await refsWhere('results', 'student_id', studentId));
  return deleteRefs(refs);
}

// ---- Whole college cascade -------------------------------------------------
// Every content document owned by a college (courses, subjects, sections,
// students, marks, results, exams and faculty uploads). The college account,
// its Firebase Auth user and subscription/billing records are preserved.
async function purgeCollege(collegeId) {
  const refs = [];

  const courseRefs = await refsWhere('courses', 'college_id', collegeId);
  refs.push(...courseRefs);
  const courseIds = courseRefs.map((ref) => ref.id);
  if (courseIds.length > 0) {
    refs.push(...await refsWhereIn('subjects', 'course_id', courseIds));
  }

  const studentRefs = await refsWhere('students', 'college_id', collegeId);
  refs.push(...studentRefs);
  const studentIds = studentRefs.map((ref) => ref.id);
  if (studentIds.length > 0) {
    refs.push(...await refsWhereIn('student_marks', 'student_id', studentIds));
  }

  refs.push(...await refsWhere('sections', 'college_id', collegeId));
  refs.push(...await refsWhere('results', 'college_id', collegeId));
  refs.push(...await refsWhere('exams', 'college_id', collegeId));
  refs.push(...await refsWhere('faculty_uploads', 'college_id', collegeId));

  return deleteRefs(refs);
}

// ---- Storage usage ---------------------------------------------------------
// Document counts across a college's collections for visibility into how much
// data is held (useful on the free tier where quotas are tight).
async function collegeUsage(collegeId) {
  const scoped = await Promise.all(
    ['courses', 'sections', 'students', 'results', 'exams', 'faculty_uploads']
      .map(async (collection) => {
        const snapshot = await db.collection(collection)
          .where('college_id', '==', collegeId)
          .count()
          .get();
        return [collection, snapshot.data().count || 0];
      })
  );
  const counts = Object.fromEntries(scoped);

  const courseRefs = await refsWhere('courses', 'college_id', collegeId);
  const courseIds = courseRefs.map((ref) => ref.id);
  counts.subjects = courseIds.length > 0
    ? (await refsWhereIn('subjects', 'course_id', courseIds)).length
    : 0;

  const studentRefs = await refsWhere('students', 'college_id', collegeId);
  const studentIds = studentRefs.map((ref) => ref.id);
  counts.student_marks = studentIds.length > 0
    ? (await refsWhereIn('student_marks', 'student_id', studentIds)).length
    : 0;

  return counts;
}

module.exports = {
  purgeCourse,
  purgeSection,
  purgeExam,
  purgeStudent,
  purgeCollege,
  deleteWhere,
  collegeUsage,
};