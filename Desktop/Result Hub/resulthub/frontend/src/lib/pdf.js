import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Bulk export of a filtered result list.
export function exportResultsPdf({ college, course, students }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(16);
  doc.text(college || 'Results', 40, 40);
  doc.setFontSize(11);
  doc.text(`Course: ${course.name}   |   Students: ${students.length}`, 40, 60);

  const subjects = course.subjects || [];
  autoTable(doc, {
    startY: 78,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [35, 102, 86] },
    head: [[
      'Hall Ticket', 'Name', 'Section',
      ...subjects.map((s) => s.name),
      'Total', '%', 'Status', 'Sec Rank', 'Course Rank',
    ]],
    body: students.map((s) => [
      s.hall_ticket_number, s.name, s.section_name,
      ...subjects.map((sub) => (s.marks[sub.id] ?? '-')),
      s.total_marks ?? '-',
      s.percentage ?? '-',
      s.status ?? '-',
      s.section_rank ?? '-',
      s.course_rank ?? '-',
    ]),
  });
  doc.save(`${course.name.replace(/[^a-z0-9]+/gi, '_')}_results.pdf`);
}

// Single student marksheet used by the public portal.
export function exportMarksheetPdf(result) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const collegeName = result.college_name || result.college || 'Result';

  // Header band with college branding.
  doc.setFillColor(31, 84, 74);
  doc.rect(0, 0, pageWidth, 84, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(collegeName, pageWidth / 2, 36, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Statement of Marks', pageWidth / 2, 56, { align: 'center' });
  doc.setTextColor(30, 41, 59);

  const details = [
    ['Student Name', result.name],
    ...(result.hall_ticket_number ? [['Hall Ticket Number', result.hall_ticket_number]] : []),
    ['Course', result.course],
    ...(result.section ? [['Section', result.section]] : []),
    ...(result.exam_name && result.exam_name !== 'Result' ? [['Exam Name', result.exam_name]] : []),
    ...(result.exam_date ? [['Exam Date', result.exam_date]] : []),
  ];
  autoTable(doc, {
    startY: 102,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    body: details,
  });

  const subjectRows = (result.subjects || []).map((s) => [
    s.name, s.marks ?? '-', s.max_marks, s.passing_marks ?? '—',
    ...(result.status ? [s.status ?? '-'] : []),
  ]);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 16,
    styles: { fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: [31, 84, 74] },
    head: [[
      'Subject', 'Marks', 'Maximum', 'Passing',
      ...(result.status ? ['Result'] : []),
    ]],
    body: subjectRows,
  });

  const summary = [
    ['Total Marks', `${result.total_marks} / ${result.max_total_marks}`],
    ...(result.percentage !== null && result.percentage !== undefined ? [['Percentage', `${result.percentage}%`]] : []),
    ...(result.status ? [['Result', result.status]] : []),
    ...(result.grade ? [['Grade', result.grade]] : []),
    ...(result.section_rank ? [['Section Rank', String(result.section_rank)]] : []),
    ...(result.course_rank ? [['Course Rank', String(result.course_rank)]] : []),
  ];
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 16,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 5 },
    body: summary,
  });

  doc.save(`${result.hall_ticket_number || 'result'}_marksheet.pdf`);
}
