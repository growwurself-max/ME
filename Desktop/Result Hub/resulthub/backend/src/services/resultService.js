const { db, Timestamp } = require('../config/firebase');

async function recalculateCourse(collegeId, courseId) {
  const courseDoc = await db.collection('courses').doc(courseId).get();
  if (!courseDoc.exists || courseDoc.data().college_id !== collegeId) {
    return { updated: 0 };
  }

  const course = { id: courseDoc.id, ...courseDoc.data() };

  const subjectsSnapshot = await db.collection('subjects')
    .where('course_id', '==', courseId)
    .get();
  
  const subjects = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const maxTotal = subjects.reduce((sum, s) => sum + Number(s.max_marks), 0);

  const studentsSnapshot = await db.collection('students')
    .where('college_id', '==', collegeId)
    .where('course_id', '==', courseId)
    .get();

  const studentIds = studentsSnapshot.docs.map(doc => doc.id);

  const marksByStudentId = new Map();
  for (let i = 0; i < studentIds.length; i += 10) {
    const chunkIds = studentIds.slice(i, i + 10);
    const marksSnapshot = await db.collection('student_marks')
      .where('student_id', 'in', chunkIds)
      .get();
    marksSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!marksByStudentId.has(data.student_id)) {
        marksByStudentId.set(data.student_id, []);
      }
      marksByStudentId.get(data.student_id).push(data);
    });
  }

  const computed = studentsSnapshot.docs.map(studentDoc => {
    const student = studentDoc.data();
    const marks = marksByStudentId.get(studentDoc.id) || [];
    const total = marks.reduce((sum, m) => sum + Number(m.marks || 0), 0);
    const percentage =
      course.enable_percentage && maxTotal > 0 ? Number(((total / maxTotal) * 100).toFixed(2)) : null;

    let status = null;
    if (course.enable_pass_fail) {
      const allSubjectsPresent = marks.length === subjects.length;
      const passedEach = marks.every((m) => {
        const subject = subjectById.get(m.subject_id);
        if (!subject) return false;
        const passing = subject.passing_marks;
        if (passing === null || passing === undefined || passing === '') return true;
        return Number(m.marks || 0) >= Number(passing);
      });
      status = allSubjectsPresent && passedEach ? 'PASS' : 'FAIL';
    }

    const grade = course.enable_grade ? gradeFor(percentage, status) : null;

    return {
      student_id: studentDoc.id,
      section_id: student.section_id,
      total_marks: total,
      max_total_marks: maxTotal,
      percentage,
      status,
      grade,
    };
  });

  if (course.enable_ranking) {
    assignRanks(computed, () => 'ALL', 'course_rank');
    assignRanks(computed, (row) => row.section_id, 'section_rank');
  } else {
    computed.forEach((row) => {
      row.course_rank = null;
      row.section_rank = null;
    });
  }

  if (computed.length === 0) return { updated: 0 };

  const computedStudentIds = computed.map((r) => r.student_id);
  const publishedById = new Map();
  for (let i = 0; i < computedStudentIds.length; i += 10) {
    const chunkIds = computedStudentIds.slice(i, i + 10);
    const existingSnapshot = await db.collection('results')
      .where('student_id', 'in', chunkIds)
      .where('exam_id', '==', null)
      .get();
    existingSnapshot.docs.forEach(doc => {
      const data = doc.data();
      publishedById.set(data.student_id, { published: data.published, published_at: data.published_at });
    });
  }

  const batch = db.batch();
  computed.forEach((row) => {
    const resultRef = db.collection('results').doc(row.student_id);
    batch.set(resultRef, {
      student_id: row.student_id,
      college_id: collegeId,
      course_id: courseId,
      section_id: row.section_id,
      exam_id: null,
      total_marks: row.total_marks,
      max_total_marks: row.max_total_marks,
      percentage: row.percentage,
      status: row.status,
      grade: row.grade,
      section_rank: row.section_rank,
      course_rank: row.course_rank,
      published: publishedById.get(row.student_id)?.published ?? false,
      published_at: publishedById.get(row.student_id)?.published_at ?? null,
      calculated_at: Timestamp.now(),
    });
  });
  await batch.commit();

  return { updated: computed.length };
}

async function recalculateExam(collegeId, examId) {
  const examDoc = await db.collection('exams').doc(examId).get();
  if (!examDoc.exists || examDoc.data().college_id !== collegeId) {
    return { updated: 0 };
  }

  const exam = { id: examDoc.id, ...examDoc.data() };

  const courseDoc = await db.collection('courses').doc(exam.course_id).get();
  if (!courseDoc.exists || courseDoc.data().college_id !== collegeId) {
    return { updated: 0 };
  }

  const course = { id: courseDoc.id, ...courseDoc.data() };

  // Per-exam pass/fail toggle. When unset (legacy exams), fall back to the
  // course-level rule so existing workflows keep working.
  const enablePassFail =
    exam.enable_pass_fail !== undefined ? Boolean(exam.enable_pass_fail) : Boolean(course.enable_pass_fail);

  const subjectsSnapshot = await db.collection('subjects')
    .where('course_id', '==', exam.course_id)
    .get();
  
  const subjects = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const maxTotal = subjects.reduce((sum, s) => sum + Number(s.max_marks), 0);

  const studentsSnapshot = await db.collection('students')
    .where('college_id', '==', collegeId)
    .where('course_id', '==', exam.course_id)
    .where('section_id', '==', exam.section_id)
    .get();

  const studentIds = studentsSnapshot.docs.map(doc => doc.id);

  const marksByStudentId = new Map();
  for (let i = 0; i < studentIds.length; i += 10) {
    const chunkIds = studentIds.slice(i, i + 10);
    const marksSnapshot = await db.collection('student_marks')
      .where('student_id', 'in', chunkIds)
      .get();
    marksSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!marksByStudentId.has(data.student_id)) {
        marksByStudentId.set(data.student_id, []);
      }
      marksByStudentId.get(data.student_id).push(data);
    });
  }

  const computed = studentsSnapshot.docs.map(studentDoc => {
    const student = studentDoc.data();
    const marks = marksByStudentId.get(studentDoc.id) || [];
    const total = marks.reduce((sum, m) => sum + Number(m.marks || 0), 0);
    const percentage =
      course.enable_percentage && maxTotal > 0 ? Number(((total / maxTotal) * 100).toFixed(2)) : null;

    let status = null;
    if (enablePassFail) {
      const allSubjectsPresent = marks.length === subjects.length;
      const passedEach = marks.every((m) => {
        const subject = subjectById.get(m.subject_id);
        if (!subject) return false;
        const passing = subject.passing_marks;
        if (passing === null || passing === undefined || passing === '') return true;
        return Number(m.marks || 0) >= Number(passing);
      });
      status = allSubjectsPresent && passedEach ? 'PASS' : 'FAIL';
    }

    const grade = course.enable_grade ? gradeFor(percentage, status) : null;

    return {
      student_id: studentDoc.id,
      section_id: student.section_id,
      total_marks: total,
      max_total_marks: maxTotal,
      percentage,
      status,
      grade,
    };
  });

  if (course.enable_ranking) {
    assignRanks(computed, () => 'ALL', 'course_rank');
    assignRanks(computed, (row) => row.section_id, 'section_rank');
  } else {
    computed.forEach((row) => {
      row.course_rank = null;
      row.section_rank = null;
    });
  }

  if (computed.length === 0) return { updated: 0 };

  const existingSnapshot = await db.collection('results')
    .where('exam_id', '==', examId)
    .get();
  
  const publishedById = new Map();
  existingSnapshot.docs.forEach(doc => {
    const data = doc.data();
    publishedById.set(data.student_id, { published: data.published, published_at: data.published_at });
  });

  const batch = db.batch();
  computed.forEach((row) => {
    const resultRef = db.collection('results').doc(`${examId}_${row.student_id}`);
    batch.set(resultRef, {
      student_id: row.student_id,
      college_id: collegeId,
      course_id: exam.course_id,
      section_id: row.section_id,
      exam_id: examId,
      total_marks: row.total_marks,
      max_total_marks: row.max_total_marks,
      percentage: row.percentage,
      status: row.status,
      grade: row.grade,
      section_rank: row.section_rank,
      course_rank: row.course_rank,
      published: publishedById.get(row.student_id)?.published ?? false,
      published_at: publishedById.get(row.student_id)?.published_at ?? null,
      calculated_at: Timestamp.now(),
    });
  });
  await batch.commit();

  return { updated: computed.length };
}

function assignRanks(rows, groupKey, field) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = groupKey(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  groups.forEach((group) => {
    group.sort((a, b) => b.total_marks - a.total_marks);
    let rank = 0;
    let previousTotal = null;
    group.forEach((row, index) => {
      if (row.total_marks !== previousTotal) {
        rank = index + 1;
        previousTotal = row.total_marks;
      }
      row[field] = rank;
    });
  });
}

function gradeFor(percentage, status) {
  if (status === 'FAIL') return 'F';
  if (percentage === null || percentage === undefined) return null;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  if (percentage >= 35) return 'E';
  return 'F';
}

module.exports = { recalculateCourse, recalculateExam };
