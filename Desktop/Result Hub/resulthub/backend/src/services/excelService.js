const XLSX = require('xlsx');

const BASE_COLUMNS = ['Hall Ticket Number', 'Student Name', 'Section'];

function normaliseHeaderKey(text) {
  return String(text ?? '')
    .replace(/^\uFEFF/, '')
    // Split camelCase boundaries so "HallTicketNumber" -> "Hall Ticket Number".
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-./()#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Collapse a subject name/header to its core wording so decorated and short
// variants (roman numerals, leading numbers) still compare equal. E.g.
// "Mathematics II", "MATHEMATICS", "maths", "Math" all core to "mathematics"
// when combined with the alias families below.
function subjectCore(text) {
  return String(text ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-./()#&]+/g, ' ')
    .replace(/\b(i{1,3}|iv|v|vi{1,3})\b/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordsList(text) {
  return String(text).trim().split(/\s+/).filter(Boolean);
}

// True when one name is a whole-word prefix of the other, e.g.
// "history" => "history & civics", "computer science" => "computer science i".
function isWordPrefix(a, b) {
  const x = wordsList(a);
  const y = wordsList(b);
  if (x.length === 0 || y.length === 0) return false;
  const [prefix, full] = x.length <= y.length ? [x, y] : [y, x];
  return prefix.every((w, i) => full[i] === w);
}

const HALL_VARIANTS = new Set([
  'hall ticket number', 'hall ticket no', 'hall ticket no ', 'hall ticket',
  'hallticket', 'ht number', 'ht no', 'htno', 'hallticket number',
  'hall ticket num', 'hall no', 'hallno', 'ticket number', 'ticket no',
]);
const NAME_VARIANTS = new Set(['student name', 'studentname', 'student', 'name', 'candidate name', 'full name']);
const SECTION_VARIANTS = new Set(['section', 'sec', 'division', 'class', 'batch']);
const MARKS_VARIANTS = new Set([
  'marks', 'marks obtained', 'marks scored', 'marks secured', 'obtained marks',
  'score', 'scored', 'secured', 'total marks', 'total',
]);

// Common equivalent names for subject columns. Each entry maps a canonical
// subject family to its recognised header spellings (already normalised).
// A header matches a configured course subject only when both share a family,
// so unknown columns still produce warnings.
const SUBJECT_ALIASES = {
  mathematics: new Set(['mathematics', 'math', 'maths', 'mathematics i', 'maths i']),
  physics: new Set(['physics', 'phy', 'physics i']),
  chemistry: new Set(['chemistry', 'chem', 'chemistry i']),
  biology: new Set(['biology', 'bio', 'biological science']),
  english: new Set(['english', 'eng']),
  telugu: new Set(['telugu']),
  hindi: new Set(['hindi']),
  sanskrit: new Set(['sanskrit']),
  economics: new Set(['economics', 'econ', 'economics i']),
  commerce: new Set(['commerce', 'com', 'commerce i']),
  accountancy: new Set(['accountancy', 'accounts', 'accounting']),
  'computer science': new Set(['computer science', 'computer science i', 'computers', 'computer', 'cs']),
  'social studies': new Set(['social studies', 'social', 'social science', 'sst']),
  'physical education': new Set(['physical education', 'physical', 'pe']),
};

// Reverse lookup: alias (normalised) -> canonical family name.
const ALIAS_TO_FAMILY = {};
for (const [family, aliases] of Object.entries(SUBJECT_ALIASES)) {
  aliases.forEach((alias) => {
    ALIAS_TO_FAMILY[alias] = family;
  });
}

/**
 * Return the canonical family a normalised subject name belongs to, or null.
 */
function subjectFamily(subjectKey) {
  return ALIAS_TO_FAMILY[subjectKey] || null;
}

// Levenshtein distance for typo-tolerant header matching.
function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/**
 * Suggest the closest configured subject for an unmatched header.
 * Returns { subject_id, subject_name, distance, auto } or null.
 * - distance === 1  -> confident typo, safe to auto-apply.
 * - distance === 2  -> likely typo, offered as a suggestion for confirmation.
 * Ambiguous matches (a tie) return null so columns are never mis-mapped.
 */
function suggestSubjectMatch(key, subjects) {
  if (!key || subjects.length === 0) return null;
  const candidates = subjects
    .map((s) => ({ subject: s, distance: editDistance(key, normaliseHeaderKey(s.name)) }))
    .filter((c) => c.distance > 0)
    .sort((a, b) => a.distance - b.distance || a.subject.name.localeCompare(b.subject.name));

  if (candidates.length === 0) return null;
  const best = candidates[0];
  const next = candidates[1];

  // Reject ties so we never guess between two subjects.
  if (next && next.distance === best.distance) return null;
  // Only act on close spellings; anything further away stays a plain warning.
  if (best.distance > 2) return null;

  return {
    subject_id: best.subject.id,
    subject_name: best.subject.name,
    distance: best.distance,
    auto: best.distance === 1,
  };
}

/**
 * Resolve a raw spreadsheet column header to a canonical key:
 *   'hall_ticket_number' | 'student_name' | 'section' | `subject:<id>` | null
 *
 * `overrides` optionally maps an original header to a specific subject id (or a
 * base column key) chosen by the user in the confirmation step.
 */
function resolveColumn(rawKey, subjects, overrides) {
  const key = normaliseHeaderKey(rawKey);
  if (!key) return null;

  if (overrides && Object.prototype.hasOwnProperty.call(overrides, rawKey)) {
    const target = overrides[rawKey];
    if (target === 'hall_ticket_number' || target === 'student_name' || target === 'section') {
      return target;
    }
    if (subjects.some((s) => s.id === target)) return `subject:${target}`;
  }

  if (HALL_VARIANTS.has(key)) return 'hall_ticket_number';
  if (NAME_VARIANTS.has(key)) return 'student_name';
  if (SECTION_VARIANTS.has(key)) return 'section';

  // Exact (case/space-insensitive) column name match.
  for (const subject of subjects) {
    if (normaliseHeaderKey(subject.name) === key) return `subject:${subject.id}`;
  }

  // Tolerant matching bound to the course's own configured subjects so a valid
  // subject column is never dropped as unrecognised:
  //   1. core wording equality   ("Zoology" == "ZOO.", "Mathematics" == "MATHS")
  //   2. same alias family       (course subject family matches the header)
  //   3. whole-word prefix       ("history" -> "History & Civics")
  //   4. close spelling          (edit distance <= 2, ties rejected)
  const headerCore = subjectCore(key);
  for (const subject of subjects) {
    if (subjectCore(subject.name) === headerCore) return `subject:${subject.id}`;
  }

  const headerFamily = subjectFamily(key);
  if (headerFamily) {
    for (const subject of subjects) {
      const subjectKey = normaliseHeaderKey(subject.name);
      if (subjectFamily(subjectKey) === headerFamily) return `subject:${subject.id}`;
    }
  }

  for (const subject of subjects) {
    if (subjectCore(subject.name).length >= 3 && headerCore.length >= 3 &&
        isWordPrefix(subjectCore(subject.name), headerCore)) {
      return `subject:${subject.id}`;
    }
  }

  // Initials abbreviations such as "P.E.", "C.S." map to the subject whose
  // words start with those initials ("P.E." -> Physical Education).
  const headerTokens = wordsList(headerCore);
  if (headerTokens.length >= 2 && headerTokens.every((t) => t.length === 1)) {
    for (const subject of subjects) {
      const subjectTokens = wordsList(subjectCore(subject.name));
      if (subjectTokens.length === headerTokens.length &&
          subjectTokens.every((w, i) => w[0] === headerTokens[i])) {
        return `subject:${subject.id}`;
      }
    }
  }

  const suggestion = suggestSubjectMatch(key, subjects);
  if (suggestion && suggestion.distance <= 2) {
    return `subject:${suggestion.subject_id}`;
  }

  return null;
}

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
    ...subjects.map((s) => [
      s.name,
      Number(s.max_marks),
      s.passing_marks == null || s.passing_marks === '' ? '—' : Number(s.passing_marks),
    ]),
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

// Raw 2D matrix (including the header row) of the uploaded workbook, used by
// the frontend to render the full grid with cell-level highlighting.
function readMatrix(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames.includes('Students')
    ? 'Students'
    : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils
    .sheet_to_json(sheet, { defval: '', raw: true, header: 1 })
    .map((row) => row.map((cell) => (cell === null || cell === undefined ? '' : cell)));
}

// Detect the field separator used in pasted spreadsheet text. Supports
// tab (Excel/Sheets copy), comma, semicolon and pipe separated data.
function detectDelimiter(text) {
  const cleaned = String(text ?? '').replace(/^\uFEFF/, '');
  const firstLine = cleaned.split(/\r?\n/).find((line) => line.trim() !== '');
  if (!firstLine) return '\t';
  const candidates = ['\t', ',', ';', '|'];
  let best = '\t';
  let bestCount = 0;
  for (const delimiter of candidates) {
    const count = firstLine.split(delimiter).length - 1;
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }
  return best;
}

function splitDelimitedLine(line, delimiter) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

/**
 * Parse pasted spreadsheet text (tab/comma/semicolon/pipe separated) into a
 * raw 2D matrix, stripping the BOM and skipping fully blank rows.
 */
function parseDelimited(text) {
  const cleaned = String(text ?? '').replace(/^\uFEFF/, '');
  const delimiter = detectDelimiter(cleaned);
  return cleaned
    .split(/\r?\n/)
    .map((line) => splitDelimitedLine(line, delimiter))
    .map((row) => row.map((cell) => String(cell ?? '').trim()))
    .filter((row) => !row.every((cell) => cell === ''));
}

/**
 * Subject-wise Excel template: fixed official columns with the section's
 * students pre-filled so faculty only type marks. The subject is implied by
 * the upload context, so no subject column is needed.
 */
function buildSubjectTemplate(subject, students) {
  const header = ['Hall Ticket Number', 'Student Name', 'Marks'];
  const body = students.map((s) => [
    s.hall_ticket_number,
    s.name,
    '',
  ]);
  const sheet = XLSX.utils.aoa_to_sheet([header, ...body]);
  sheet['!cols'] = header.map((h) => ({ wch: Math.max(16, h.length + 6) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Students');

  const info = [
    ['Subject', subject.name],
    ['Maximum Marks', Number(subject.max_marks)],
    ['Passing Marks', subject.passing_marks == null || subject.passing_marks === '' ? '—' : Number(subject.passing_marks)],
    [],
    ['Only fill in the Marks column.', 'Do not edit the Hall Ticket Number or Student Name columns.'],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(info), 'Instructions');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Parse subject-wise pasted data. Supports rows copied straight from a
 * spreadsheet without a header (template order: Hall Ticket, Name, Marks) as
 * well as data pasted together with its own header row.
 */
function readSubjectData(text, subject) {
  const aoa = parseDelimited(text);
  if (aoa.length === 0) return [];

  const firstRow = aoa[0];
  const hasHeaders = firstRow.some((cell) => {
    const key = normaliseHeaderKey(cell);
    return key !== '' && (resolveColumn(cell, [subject]) !== null || MARKS_VARIANTS.has(key));
  });

  if (hasHeaders) {
    return aoa.slice(1).map((row) => {
      const out = {};
      firstRow.forEach((header, i) => {
        out[String(header ?? '')] = row[i] ?? '';
      });
      return out;
    });
  }

  const columnKeys = ['Hall Ticket Number', 'Student Name', 'Marks'];
  return aoa.map((row) => {
    const out = {};
    columnKeys.forEach((key, i) => {
      out[key] = row[i] ?? '';
    });
    return out;
  });
}

/**
 * Row-by-row validation for a single subject upload against the section's
 * existing students. Returns { rows, errors, warnings } where `rows` are the
 * valid records ready to submit and `errors` describe exactly what is wrong
 * with the rejected rows (empty hall ticket, out-of-range marks, duplicates,
 * missing name for a new student, …).
 *
 * The Hall Ticket Number is treated as a plain unique string chosen by the
 * college. It is NEVER required to already exist on file: new numbers are
 * accepted with a warning and the student record is created during import.
 */
function parseSubjectRows(rawRows, { students, subject }) {
  const errors = [];
  const warnings = [];
  const rows = [];
  const seen = new Set();
  const max = Number(subject.max_marks);

  const byHallTicket = new Map();
  students.forEach((s) => {
    byHallTicket.set(String(s.hall_ticket_number).trim().toLowerCase(), s);
  });

  // Resolve headers once and reuse for every row.
  const headerCache = new Map();
  const resolveHeader = (key) => {
    if (headerCache.has(key)) return headerCache.get(key);
    let resolved = null;
    const resolvedColumn = resolveColumn(key, [subject], undefined);
    if (resolvedColumn === `subject:${subject.id}` || resolveMarksColumn(key)) {
      resolved = 'marks';
    } else if (resolvedColumn) {
      resolved = resolvedColumn;
    }
    headerCache.set(key, resolved);
    return resolved;
  };

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2; // +1 header, +1 to 1-based

    const canonical = {};
    Object.keys(raw).forEach((key) => {
      const resolved = resolveHeader(key);
      if (resolved) canonical[resolved] = raw[key];
    });

    const isEmpty = Object.values(canonical).every((v) => String(v ?? '').trim() === '');
    if (isEmpty) return;

    const hall = String(canonical.hall_ticket_number ?? '').trim();
    const name = String(canonical.student_name ?? '').trim();
    const marksRaw = String(canonical.marks ?? '').trim();

    // The database lookup is only used to decide whether to warn about a new
    // student — it never rejects a row. Only required + unique-in-file rules
    // are enforced here.
    const student = hall ? byHallTicket.get(hall.toLowerCase()) : null;

    let error = null;
    let errorField = null;
    if (!hall) { error = 'Hall Ticket Number is empty'; errorField = 'Hall Ticket Number'; }
    else if (seen.has(hall.toLowerCase())) { error = 'Duplicate Hall Ticket Number in uploaded file'; errorField = 'Hall Ticket Number'; }

    let value = null;
    if (!error) {
      if (marksRaw === '') { error = 'Marks must be numeric'; errorField = 'Marks'; }
      else {
        value = Number(marksRaw);
        if (!Number.isFinite(value)) { error = 'Marks must be numeric'; errorField = 'Marks'; }
        else if (value < 0) { error = 'Marks cannot be negative'; errorField = 'Marks'; }
        else if (value > max) { error = `Marks must be between 0 and ${max}`; errorField = 'Marks'; }
      }
    }

    // A brand-new student record needs a name so it can be created on import.
    if (!error && !student && !name) {
      error = 'Student Name is missing (required for a new Hall Ticket Number)';
      errorField = 'Student Name';
    }

    if (error) {
      errors.push({ row: rowNumber, field: errorField, message: error });
      return;
    }

    if (!student) {
      warnings.push(
        `Row ${rowNumber}: Hall Ticket Number "${hall}" is new and will be added to the section during import.`
      );
    }

    seen.add(hall.toLowerCase());
    rows.push({
      row: rowNumber,
      hall_ticket_number: student ? student.hall_ticket_number : hall,
      name: student ? student.name : name,
      marks: value,
      valid: true,
    });
  });

  return { rows, errors, warnings };
}

function resolveMarksColumn(rawKey) {
  const key = normaliseHeaderKey(rawKey);
  return MARKS_VARIANTS.has(key) ? 'marks' : null;
}

/**
 * Decide which submitted marks are accepted, which students are brand-new,
 * and which rows are skipped (with reasons). This is the pure decision logic
 * behind the faculty submit endpoint, extracted so the full workflow
 * (paste -> preview -> validate -> submit) can be tested end to end without a
 * database.
 *
 * Returns { accepted, updated, created, skipped, skippedReasons } where
 * `accepted` are the rows to persist: { hall_ticket_number, name, marks, isNew }.
 * Rows are only rejected for: empty hall ticket, duplicate hall ticket within
 * the upload, non-numeric/out-of-range marks, or a missing name for a brand-new
 * student. Hall Ticket Numbers are never required to pre-exist.
 */
function planMarksSubmission(marks, { knownHallKeys, maxMarks }) {
  const accepted = [];
  const seen = new Set();
  const skippedReasons = [];
  const max = Number(maxMarks);

  for (const row of marks || []) {
    const hall = String(row.hall_ticket_number ?? '').trim();
    const key = hall.toLowerCase();
    const value = Number(row.marks);

    if (!hall) {
      skippedReasons.push('row with an empty Hall Ticket Number');
      continue;
    }

    if (seen.has(key)) {
      skippedReasons.push(`${hall}: duplicate Hall Ticket Number in the uploaded data`);
      continue;
    }
    seen.add(key);

    const isNew = !knownHallKeys.has(key);
    if (isNew && !String(row.name ?? '').trim()) {
      skippedReasons.push(`${hall}: student name missing for a new record`);
      continue;
    }

    if (!Number.isFinite(value) || value < 0 || value > max) {
      skippedReasons.push(`${hall}: marks must be between 0 and ${max}`);
      continue;
    }

    accepted.push({
      hall_ticket_number: hall,
      name: String(row.name ?? '').trim(),
      marks: value,
      isNew,
    });
  }

  return {
    accepted,
    updated: accepted.length,
    created: accepted.filter((r) => r.isNew).length,
    skipped: skippedReasons.length,
    skippedReasons,
  };
}

/**
 * Parse pasted tab/comma/semicolon/pipe separated text (copied from Excel,
 * Google Sheets, etc.) into raw header-keyed rows. Columns are auto-detected:
 * if the first row contains recognised headers it is used as-is; otherwise the
 * data is assumed to follow the template layout (Hall Ticket, Name, Section,
 * subjects...).
 */
function readPastedData(text, subjects) {
  const aoa = parseDelimited(text);
  if (aoa.length === 0) return [];

  const firstRow = aoa[0];
  const hasHeaders = firstRow.some((cell) => resolveColumn(cell, subjects) !== null);

  if (hasHeaders) {
    const headers = firstRow;
    return aoa.slice(1).map((row) => {
      const out = {};
      headers.forEach((header, i) => {
        out[String(header ?? '')] = row[i] ?? '';
      });
      return out;
    });
  }

  // Headerless layout: assume template order.
  const columnKeys = [
    'Hall Ticket Number',
    'Student Name',
    'Section',
    ...subjects.map((s) => s.name),
  ];
  return aoa.map((row) => {
    const out = {};
    columnKeys.forEach((key, i) => {
      out[key] = row[i] ?? '';
    });
    return out;
  });
}

/**
 * Row-by-row validation against the course configuration.
 * Returns { rows, errors, warnings } where rows are the accepted, normalised
 * records. Invalid rows are skipped so the valid subset can still be imported.
 *
 * The Hall Ticket Number is a plain unique string: only required + unique
 * within the file are enforced. Numbers already on file for the course produce
 * a non-blocking warning (the record is updated on import), never an error.
 */
function validateRows(rawRows, { subjects, sections, expectedSectionName, existingHallTickets, columnOverrides }) {
  const errors = [];
  const warnings = [];
  const suggestions = [];
  const unrecognised = [];
  const rows = [];
  const seenHallTickets = new Set();
  const sectionByName = new Map(sections.map((s) => [s.name.trim().toLowerCase(), s]));

  // Resolve each distinct header once and reuse the result for every row.
  const headerCache = new Map();
  const resolveHeader = (key) => {
    if (headerCache.has(key)) return headerCache.get(key);

    const resolved = resolveColumn(key, subjects, columnOverrides);
    if (resolved) {
      headerCache.set(key, { resolved });
      return { resolved };
    }

    if (key.startsWith('__') || String(key ?? '').trim() === '') {
      headerCache.set(key, { skip: true });
      return { skip: true };
    }

    const suggestion = suggestSubjectMatch(normaliseHeaderKey(key), subjects);
    if (suggestion) {
      headerCache.set(key, { suggestion });
      return { suggestion };
    }

    headerCache.set(key, { unrecognised: String(key) });
    return { unrecognised: String(key) };
  };

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2; // +1 header, +1 to 1-based

    // Map raw keys to canonical values (tolerant of whitespace/case via resolveColumn).
    const canonical = {};
    const rowUnknown = [];
    Object.keys(raw).forEach((key) => {
      const info = resolveHeader(key);
      if (info.skip) return;
      if (info.resolved) canonical[info.resolved] = raw[key];
      else if (info.unrecognised) rowUnknown.push(info.unrecognised);
    });

    const isEmpty = Object.values(canonical).every((v) => String(v ?? '').trim() === '');
    if (isEmpty) return; // fully blank rows are skipped silently

    if (Object.keys(canonical).length === 0) {
      errors.push({
        row: rowNumber,
        field: '-',
        message: 'No recognised columns found in this row',
      });
      return;
    }

    const hallTicket = String(canonical.hall_ticket_number ?? '').trim();
    const name = String(canonical.student_name ?? '').trim();
    const sectionName = String(canonical.section ?? '').trim() || expectedSectionName;

    const rowErrors = [];
    if (!hallTicket)
      rowErrors.push({ field: 'Hall Ticket Number', message: 'Hall Ticket Number is required' });
    if (!name) rowErrors.push({ field: 'Student Name', message: 'Student Name is missing' });

    if (hallTicket && seenHallTickets.has(hallTicket.toLowerCase())) {
      rowErrors.push({ field: 'Hall Ticket Number', message: 'Duplicate Hall Ticket Number in uploaded file' });
    }
    if (hallTicket && existingHallTickets.has(hallTicket.toLowerCase())) {
      warnings.push(
        `Row ${rowNumber}: Hall Ticket Number "${hallTicket}" already exists for this course — the existing record will be updated.`
      );
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

    // Unrecognised extra columns are treated as warnings, not hard failures.
    if (rowUnknown.length > 0) {
      const joined = rowUnknown.map((c) => `"${c}"`).join(', ');
      warnings.push(
        `Row ${rowNumber}: ${joined} ${rowUnknown.length === 1 ? 'is not recognised and was ignored' : 'are not recognised and were ignored'}.`
      );
    }

    const marks = {};
    subjects.forEach((subject) => {
      const cell = canonical[`subject:${subject.id}`];
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

    seenHallTickets.add(hallTicket.toLowerCase());
    rows.push({
      row: rowNumber,
      hall_ticket_number: hallTicket,
      name,
      section_id: section.id,
      section_name: section.name,
      marks,
    });
  });

  // One entry per unmatched header: either a subject suggestion or a plain
  // unrecognised column.
  headerCache.forEach((info, key) => {
    if (info.skip || info.resolved) return;
    if (info.suggestion) {
      suggestions.push({
        column: String(key),
        subject_id: info.suggestion.subject_id,
        subject_name: info.suggestion.subject_name,
        distance: info.suggestion.distance,
        auto_applied: false,
      });
    } else if (info.unrecognised && !info.suggestion) {
      unrecognised.push(String(info.unrecognised));
    }
  });

  return { rows, errors, warnings, suggestions, unrecognised };
}

// Export any result listing as an .xlsx buffer.
function buildResultsExport(subjects, results) {
  const header = [
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

module.exports = {
  BASE_COLUMNS,
  buildTemplate,
  buildSubjectTemplate,
  readWorkbook,
  readMatrix,
  parseDelimited,
  readPastedData,
  readSubjectData,
  validateRows,
  parseSubjectRows,
  planMarksSubmission,
  buildResultsExport,
};