const { db } = require('../config/firebase');

async function listStudents(collegeId, { courseId, sectionId, examId, status, search, sortBy, sortOrder } = {}) {
  let query = db.collection('students')
    .where('college_id', '==', collegeId)
    .orderBy('roll_number');

  if (courseId) query = query.where('course_id', '==', courseId);
  if (sectionId) query = query.where('section_id', '==', sectionId);

  const snapshot = await query.get();
  
  let students = await Promise.all(
    snapshot.docs.map(async doc => {
      const student = { id: doc.id, ...doc.data() };
      
      const sectionDoc = await db.collection('sections').doc(student.section_id).get();
      student.section_name = sectionDoc.exists ? sectionDoc.data().name : '';
      
      const courseDoc = await db.collection('courses').doc(student.course_id).get();
      student.course_name = courseDoc.exists ? courseDoc.data().name : '';
      
      const marksSnapshot = await db.collection('student_marks')
        .where('student_id', '==', student.id)
        .get();
      
      const marks = {};
      marksSnapshot.docs.forEach(markDoc => {
        marks[markDoc.data().subject_id] = Number(markDoc.data().marks);
      });
      student.marks = marks;
      
      let resultDoc;
      if (examId) {
        resultDoc = await db.collection('results').doc(`${examId}_${student.id}`).get();
      } else {
        resultDoc = await db.collection('results').doc(student.id).get();
      }
      
      if (resultDoc.exists) {
        const result = resultDoc.data();
        student.total_marks = result.total_marks;
        student.max_total_marks = result.max_total_marks;
        student.percentage = result.percentage;
        student.status = result.status;
        student.grade = result.grade;
        student.section_rank = result.section_rank;
        student.course_rank = result.course_rank;
        student.published = result.published;
        student.published_at = result.published_at?.toDate?.() || result.published_at;
        student.exam_id = result.exam_id;
      } else {
        student.total_marks = null;
        student.max_total_marks = null;
        student.percentage = null;
        student.status = null;
        student.grade = null;
        student.section_rank = null;
        student.course_rank = null;
        student.published = false;
        student.published_at = null;
        student.exam_id = null;
      }
      
      return student;
    })
  );

  if (search) {
    const term = search.toLowerCase();
    students = students.filter(s => 
      s.roll_number.toLowerCase().includes(term) ||
      s.hall_ticket_number.toLowerCase().includes(term) ||
      s.name.toLowerCase().includes(term)
    );
  }

  if (status === 'PASS' || status === 'FAIL') {
    students = students.filter((s) => s.status === status);
  }

  if (sortBy) {
    const order = sortOrder === 'desc' ? -1 : 1;
    students.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'roll_number':
          aVal = a.roll_number.toLowerCase();
          bVal = b.roll_number.toLowerCase();
          break;
        case 'total_marks':
          aVal = a.total_marks ?? 0;
          bVal = b.total_marks ?? 0;
          break;
        case 'percentage':
          aVal = a.percentage ?? 0;
          bVal = b.percentage ?? 0;
          break;
        case 'rank':
          aVal = a.course_rank ?? Infinity;
          bVal = b.course_rank ?? Infinity;
          break;
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return -1 * order;
      if (aVal > bVal) return 1 * order;
      return 0;
    });
  } else if (status === 'RANK') {
    students = students
      .filter((s) => s.course_rank !== null)
      .sort((a, b) => a.course_rank - b.course_rank);
  }
  
  return students;
}

module.exports = { listStudents };
