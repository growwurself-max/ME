const XLSX = require('xlsx');

const BASE_COLUMNS = ['Roll Number', 'Hall Ticket Number', 'Student Name', 'Section'];

// Template columns are derived from the course's configured subjects only.
function buildTemplate(course, subjects, sections) {
  const header = [...BASE_COLUMNS, ...subjects.map((s) => s.name)];
  const sheet = XLSX.utils.aoa_to_sheet([header]);
  sheet['!cols'] = header.map((h) => ({ wch: Math.max(14, h.length + 4) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Students');

  const info = [
    ['Course', course.name],
    ['Sections', sections.map((s) => s.name).join(', ') || '—'],
    [],
    ['Subject', 'Maximum Marks', 'Passing Marks'],
    ...subjects.map((s) => [s.name, Number(s.max_marks), Number(s.passing_marks)]),
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(info), 'Instructions');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function readWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames.includes('Students')
    ? 'Students'
    : workbook.SheetNames[0];
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '', raw: true });
}

/**
 * Row-by-row validation against the course configuration.
 * Returns { rows, errors } where rows are the accepted, normalised records.
 */
function validateRows(rawRows, { subjects, sections, expectedSectionName, existingRolls }) {
  const errors = [];
  const rows = [];
  const seenRolls = new Set();
  const sectionByName = new Map(sections.map((s) => [s.name.trim().toLowerCase(), s]));
  const subjectByName = new Map(subjects.map((s) => [s.name.trim().toLowerCase(), s]));

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2; // +1 header, +1 to 1-based
    const values = {};
    Object.keys(raw).forEach((key) => {
      values[String(key).trim().toLowerCase()] = raw[key];
    });

    const isEmpty = Object.values(values).every((v) => String(v ?? '').trim() === '');
    if (isEmpty) {
      errors.push({ row: rowNumber, field: '-', message: 'Empty row skipped' });
      return;
    }

    const rollNumber = String(values['roll number'] ?? '').trim();
    const hallTicket = String(values['hall ticket number'] ?? '').trim();
    const name = String(values['student name'] ?? '').trim();
    const sectionName = String(values['section'] ?? '').trim() || expectedSectionName;

    const rowErrors = [];
    if (!rollNumber) rowErrors.push({ field: 'Roll Number', message: 'Roll Number is required' });
    if (!hallTicket)
      rowErrors.push({ field: 'Hall Ticket Number', message: 'Hall Ticket Number is missing' });
    if (!name) rowErrors.push({ field: 'Student Name', message: 'Student Name is missing' });

    if (rollNumber && seenRolls.has(rollNumber.toLowerCase())) {
      rowErrors.push({ field: 'Roll Number', message: 'Duplicate Roll Number in this file' });
    }
    if (rollNumber && existingRolls.has(rollNumber.toLowerCase())) {
      rowErrors.push({ field: 'Roll Number', message: 'Roll Number already exists for this course' });
    }

    const section = sectionByName.get(sectionName.toLowerCase());
    if (!section) {
      rowErrors.push({ field: 'Section', message: `Unknown section "${sectionName || '(blank)'}"` });
    } else if (expectedSectionName && section.name.toLowerCase() !== expectedSectionName.toLowerCase()) {
      rowErrors.push({
        field: 'Section',
        message: `Section "${section.name}" does not match selected section "${expectedSectionName}"`,
      });
    }

    // Unknown subject columns
    const knownColumns = new Set([
      ...BASE_COLUMNS.map((c) => c.toLowerCase()),
      ...subjects.map((s) => s.name.trim().toLowerCase()),
    ]);
    Object.keys(values).forEach((key) => {
      if (!knownColumns.has(key) && !key.startsWith('__')) {
        rowErrors.push({ field: key, message: `Unknown subject/column "${key}"` });
      }
    });

    const marks = {};
    subjects.forEach((subject) => {
      const cell = values[subject.name.trim().toLowerCase()];
      const text = String(cell ?? '').trim();
      if (text === '') {
        rowErrors.push({ field: subject.name, message: 'Marks are missing' });
        return;
      }
      const value = Number(text);
      if (!Number.isFinite(value) || value < 0) {
        rowErrors.push({ field: subject.name, message: `Invalid marks "${text}"` });
        return;
      }
      if (value > Number(subject.max_marks)) {
        rowErrors.push({
          field: subject.name,
          message: `Marks ${value} exceed maximum ${subject.max_marks}`,
        });
        return;
      }
      marks[subject.id] = value;
    });

    if (rowErrors.length > 0) {
      rowErrors.forEach((e) => errors.push({ row: rowNumber, ...e }));
      return;
    }

    seenRolls.add(rollNumber.toLowerCase());
    rows.push({
      row: rowNumber,
      roll_number: rollNumber,
      hall_ticket_number: hallTicket,
      name,
      section_id: section.id,
      section_name: section.name,
      marks,
    });
  });

  return { rows, errors };
}

// Export any result listing as an .xlsx buffer.
function buildResultsExport(subjects, results) {
  const header = [
    'Roll Number',
    'Hall Ticket Number',
    'Student Name',
    'Section',
    ...subjects.map((s) => s.name),
    'Total',
    'Percentage',
    'Status',
    'Grade',
    'Section Rank',
    'Course Rank',
    'Published',
  ];
  const body = results.map((r) => [
    r.roll_number,
    r.hall_ticket_number,
    r.name,
    r.section_name,
    ...subjects.map((s) => (r.marks[s.id] ?? '')),
    r.total_marks ?? '',
    r.percentage ?? '',
    r.status ?? '',
    r.grade ?? '',
    r.section_rank ?? '',
    r.course_rank ?? '',
    r.published ? 'Yes' : 'No',
  ]);
  const sheet = XLSX.utils.aoa_to_sheet([header, ...body]);
  sheet['!cols'] = header.map((h) => ({ wch: Math.max(12, h.length + 3) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Results');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { BASE_COLUMNS, buildTemplate, readWorkbook, validateRows, buildResultsExport };
