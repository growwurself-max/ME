const { db } = require('../config/firebase');

// Natural sort that handles both numeric (1, 2, 10) and alphanumeric
// (JEE250001, JEE250002, JEE250010) hall ticket numbers instead of plain
// lexicographic order.
function naturalCompare(a, b) {
  const ax = String(a ?? '');
  const bx = String(b ?? '');
  const re = /(\d+|\D+)/g;
  const aParts = ax.match(re) || [];
  const bParts = bx.match(re) || [];
  const len = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < len; i++) {
    const aChunk = aParts[i] ?? '';
    const bChunk = bParts[i] ?? '';
    const aIsNum = /^\d+$/.test(aChunk);
    const bIsNum = /^\d+$/.test(bChunk);

    let cmp;
    if (aIsNum && bIsNum) {
      const numCmp = parseInt(aChunk, 10) - parseInt(bChunk, 10);
      cmp = numCmp !== 0 ? numCmp : aChunk.length - bChunk.length;
    } else if (aIsNum) {
      cmp = -1; // numeric segment ranks before text segment
    } else if (bIsNum) {
      cmp = 1;
    } else {
      const al = aChunk.toLowerCase();
      const bl = bChunk.toLowerCase();
      cmp = al < bl ? -1 : al > bl ? 1 : 0;
    }
    if (cmp !== 0) return cmp;
  }
  return aParts.length - bParts.length;
}

async function listStudents(collegeId, { courseId, sectionId, examId, status, search, sortBy, sortOrder } = {}) {
  // Single-field filter only: ordering is applied in memory with a natural
  // sort so this endpoint never depends on a composite index (which would
  // 500 until the index is deployed to Firestore).
  let query = db.collection('students').where('college_id', '==', collegeId);

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
      switch (sortBy) {
        case 'hall_ticket_number':
          return naturalCompare(a.hall_ticket_number, b.hall_ticket_number) * order;
        case 'total_marks':
          return ((a.total_marks ?? 0) - (b.total_marks ?? 0)) * order;
        case 'percentage':
          return ((a.percentage ?? 0) - (b.percentage ?? 0)) * order;
        case 'rank':
          return ((a.course_rank ?? Infinity) - (b.course_rank ?? Infinity)) * order;
        case 'name':
          return (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0) * order;
        default:
          return 0;
      }
    });
  } else if (status === 'RANK') {
    students = students
      .filter((s) => s.course_rank !== null)
      .sort((a, b) => a.course_rank - b.course_rank);
  } else {
    // Default order: natural sort by hall ticket number.
    students.sort((a, b) => naturalCompare(a.hall_ticket_number, b.hall_ticket_number));
  }
  
  return students;
}

module.exports = { listStudents, naturalCompare };
