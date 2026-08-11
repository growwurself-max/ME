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
      'Roll No', 'Hall Ticket', 'Name', 'Section',
      ...subjects.map((s) => s.name),
      'Total', '%', 'Status', 'Sec Rank', 'Course Rank',
    ]],
    body: students.map((s) => [
      s.roll_number, s.hall_ticket_number, s.name, s.section_name,
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
  doc.setFontSize(16);
  doc.text(result.college || 'Result', 40, 48);
  doc.setFontSize(12);
  doc.text('Statement of Marks', 40, 68);

  const details = [
    ['Student Name', result.name],
    ['Roll Number', result.roll_number],
    ['Hall Ticket Number', result.hall_ticket_number],
    ['Course', result.course],
    ['Section', result.section],
  ];
  autoTable(doc, {
    startY: 86,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    body: details,
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 16,
    styles: { fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: [35, 102, 86] },
    head: [['Subject', 'Marks', 'Maximum', 'Passing', 'Result']],
    body: result.subjects.map((s) => [
      s.name, s.marks ?? '-', s.max_marks, s.passing_marks, s.status ?? '-',
    ]),
  });

  const summary = [
    ['Total Marks', `${result.total_marks} / ${result.max_total_marks}`],
    ...(result.percentage !== null ? [['Percentage', `${result.percentage}%`]] : []),
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

  doc.save(`${result.hall_ticket_number}_marksheet.pdf`);
}
