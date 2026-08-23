// Verify the new importer handles the sample data without errors.
const excel = require('./src/services/excelService');

const subject = { id: 'math', name: 'Mathematics', max_marks: 100, passing_marks: 35 };

// 5 students pre-existing in the section (by hall ticket number)
const students = [
  { id: 's1', hall_ticket_number: 'JEE250018', name: 'Nikhil' },
  { id: 's2', hall_ticket_number: 'JEE250005', name: 'Aisha' },
  { id: 's3', hall_ticket_number: 'JEE250027', name: 'Rohit' },
  { id: 's4', hall_ticket_number: 'JEE250011', name: 'Meera' },
  { id: 's5', hall_ticket_number: 'JEE250032', name: 'Arjun' },
];

// --- Pipe-separated sample data (subject-wise import) ---
const pipeSample = [
  'Hall Ticket Number | Student Name | Marks',
  'JEE250018 | Nikhil | 91',
  'JEE250005 | Aisha | 36',
  'JEE250027 | Rohit | 69',
  'JEE250011 | Meera | 48',
  'JEE250032 | Arjun | 87',
].join('\n');

// The exact data reported as failing: mixed hall-ticket formats must all pass.
const userSample = [
  'Hall Ticket Number | Student Name | Marks',
  '250018 | Nikhil | 91',
  '250005 | Aisha | 36',
  '250027 | Rohit | 69',
  '250011 | Meera | 48',
  'JEE250032 | Arjun | 87',
  'JEE250002 | Sana | 74',
  'JEE250021 | Rahul | 55',
  'JEE250009 | Priya | 62',
].join('\n');

let pass = 0;
let fail = 0;
const check = (name, cond, extra) => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${extra || ''}`); }
};

console.log('== Subject-wise pipe import ==');
const rawPipe = excel.readSubjectData(pipeSample, subject);
check('parsed 5 data rows', rawPipe.length === 5, `got ${rawPipe.length}`);
const { rows, errors, warnings } = excel.parseSubjectRows(rawPipe, { students, subject });
check('all 5 rows valid', rows.length === 5, `got ${rows.length}`);
check('no errors', errors.length === 0, JSON.stringify(errors));
check('no new-student warnings (all 5 already on file)', warnings.length === 0, JSON.stringify(warnings));
check('no "not found" anywhere', !JSON.stringify(errors + warnings).includes('not found'));

// --- The reported failing sample: 8 rows, mixed formats ---
console.log('== Reported sample: mixed hall-ticket formats ==');
const rawUser = excel.readSubjectData(userSample, subject);
check('parsed 8 data rows', rawUser.length === 8, `got ${rawUser.length}`);
const rUser = excel.parseSubjectRows(rawUser, { students, subject });
check('8 valid', rUser.rows.length === 8, `got ${rUser.rows.length}`);
check('0 errors', rUser.errors.length === 0, JSON.stringify(rUser.errors));
check('7 new-student warnings (JEE250032 already on file)', rUser.warnings.length === 7, JSON.stringify(rUser.warnings));
check('every hall ticket preserved', rUser.rows.every((r, i) => r.hall_ticket_number === ['250018', '250005', '250027', '250011', 'JEE250032', 'JEE250002', 'JEE250021', 'JEE250009'][i]), JSON.stringify(rUser.rows.map((r) => r.hall_ticket_number)));

// --- Tab-separated (Excel copy) with headers ---
console.log('== Subject-wise tab import (with header) ==');
const tabSample = ['Hall Ticket Number\tStudent Name\tMarks', 'JEE250018\tNikhil\t91', 'JEE250032\tArjun\t87'].join('\n');
const rawTab = excel.readSubjectData(tabSample, subject);
const r2 = excel.parseSubjectRows(rawTab, { students, subject });
check('parsed 2 rows', rawTab.length === 2, `got ${rawTab.length}`);
check('2 rows valid', r2.rows.length === 2, `got ${r2.rows.length}`);
check('marks correct', r2.rows[0].marks === 91);

// --- Headerless tab paste (template order: Hall Ticket, Name, Marks) ---
console.log('== Subject-wise headerless paste ==');
const rawNoHeader = excel.readSubjectData('JEE250018\tNikhil\t88\nJEE250005\tAisha\t44', subject);
check('headerless parsed 2 rows', rawNoHeader.length === 2, `got ${rawNoHeader.length}`);
const r3 = excel.parseSubjectRows(rawNoHeader, { students, subject });
check('headerless 2 rows valid', r3.rows.length === 2, JSON.stringify(r3.errors));

// --- Error cases ---
console.log('== Subject-wise error cases ==');
const badRaw = excel.readSubjectData('JEE250018\tNikhil\t150\nJEE250005\tAisha\t-5\nJEE250027\tRohit\t45', subject);
const r4 = excel.parseSubjectRows(badRaw, { students, subject });
check('out-of-range marks rejected', r4.errors.some((e) => e.message.includes('between 0 and 100')), JSON.stringify(r4.errors));
check('negative marks rejected', r4.errors.some((e) => e.message.includes('cannot be negative')), JSON.stringify(r4.errors));
check('valid row still accepted', r4.rows.length === 1, `got ${r4.rows.length}`);

const unknownRaw = excel.readSubjectData('JEE259999\tGhost\t45', subject);
const r5 = excel.parseSubjectRows(unknownRaw, { students, subject });
check('new hall ticket accepted (not blocked)', r5.rows.length === 1 && r5.errors.length === 0, JSON.stringify(r5.errors));
check('new hall ticket warned, not errored', r5.warnings.length === 1 && r5.warnings[0].includes('new'), JSON.stringify(r5.warnings));

// Empty / duplicate hall tickets produce clear, specific messages.
const dupRaw = excel.readSubjectData('JEE250018\tNikhil\t91\nJEE250018\tNikhil\t92', subject);
const rDup = excel.parseSubjectRows(dupRaw, { students, subject });
check('duplicate hall ticket flagged', rDup.errors.some((e) => e.message.includes('Duplicate Hall Ticket Number')), JSON.stringify(rDup.errors));
const emptyRaw = excel.readSubjectData('\tNikhil\t91\nJEE250018\tNikhil\t91', subject);
const rEmpty = excel.parseSubjectRows(emptyRaw, { students, subject });
check('empty hall ticket flagged', rEmpty.errors.some((e) => e.message === 'Hall Ticket Number is empty'), JSON.stringify(rEmpty.errors));
const nonNumRaw = excel.readSubjectData('JEE250018\tNikhil\tabc', subject);
const rNonNum = excel.parseSubjectRows(nonNumRaw, { students, subject });
check('non-numeric marks flagged', rNonNum.errors.some((e) => e.message === 'Marks must be numeric'), JSON.stringify(rNonNum.errors));
const noNameRaw = excel.readSubjectData('NEW999\t\t91', subject);
const rNoName = excel.parseSubjectRows(noNameRaw, { students, subject });
check('new student without name flagged', rNoName.errors.some((e) => e.message.includes('Student Name is missing')), JSON.stringify(rNoName.errors));

// --- All-subjects validateRows ---
console.log('== All-subjects validateRows ==');
const subjects = [{ id: 'm', name: 'Mathematics', max_marks: 100 }, { id: 'p', name: 'Physics', max_marks: 100 }];
const sections = [{ id: 'sec1', name: 'A' }];
const existingHallTickets = new Set([]);
const rawAll = excel.readPastedData('Hall Ticket Number\tStudent Name\tSection\tMathematics\tPhysics\nJEE250018\tNikhil\tA\t91\t72\nJEE250005\tAisha\tA\t36\t45', subjects);
check('all-subjects parsed 2 rows', rawAll.length === 2, `got ${rawAll.length}`);
const r6 = excel.validateRows(rawAll, { subjects, sections, expectedSectionName: 'A', existingHallTickets });
check('all-subjects 2 rows valid', r6.rows.length === 2, JSON.stringify(r6.errors));

// Existing hall tickets for the course are a warning, not an error.
const r6b = excel.validateRows(rawAll, { subjects, sections, expectedSectionName: 'A', existingHallTickets: new Set(['jee250018', 'jee250005']) });
check('existing tickets: rows still valid', r6b.rows.length === 2, JSON.stringify(r6b.errors));
check('existing tickets: warning emitted', r6b.warnings.some((w) => w.includes('already exists')), JSON.stringify(r6b.warnings));
check('existing tickets: no error emitted', r6b.errors.length === 0, JSON.stringify(r6b.errors));

// Duplicate hall tickets within an all-subjects file are still an error.
const dupAll = excel.readPastedData('Hall Ticket Number\tStudent Name\tSection\tMathematics\tPhysics\nJEE250018\tNikhil\tA\t91\t72\nJEE250018\tNikhil\tA\t92\t73', subjects);
const r6c = excel.validateRows(dupAll, { subjects, sections, expectedSectionName: 'A', existingHallTickets });
check('duplicate in all-subjects flagged', r6c.errors.some((e) => e.message.includes('Duplicate Hall Ticket Number')), JSON.stringify(r6c.errors));

// --- CSV with comma and quoted names ---
console.log('== CSV parsing ==');
const csv = 'Hall Ticket Number,Student Name,Marks\nJEE250018,Nikhil,91\nJEE250027,"Rohit, K.",69';
const rawCsv = excel.readSubjectData(csv, subject);
check('csv parsed 2 rows', rawCsv.length === 2, `got ${rawCsv.length}`);
const r7 = excel.parseSubjectRows(rawCsv, { students, subject });
check('csv 2 rows valid', r7.rows.length === 2, JSON.stringify(r7.errors));

// --- BOM handling ---
console.log('== BOM handling ==');
const bomSample = '\uFEFFHall Ticket Number | Student Name | Marks\nJEE250018 | Nikhil | 91';
const rawBom = excel.readSubjectData(bomSample, subject);
check('BOM stripped, 1 row', rawBom.length === 1, `got ${rawBom.length}`);

// --- Header variants ---
console.log('== Flexible header detection ==');
for (const header of ['Hall Ticket Number', 'Hall Ticket', 'HallTicketNumber', 'hall ticket number', 'HALL TICKET NUMBER', 'HT No']) {
  const raw = excel.readSubjectData(`${header}\tStudent Name\tMarks\nJEE250018\tNikhil\t91`, subject);
  const res = excel.parseSubjectRows(raw, { students, subject });
  check(`header "${header}" recognised`, res.rows.length === 1, JSON.stringify(res.errors));
}

// --- Template/export format (Hall Ticket only) ---
console.log('== Template/export format ==');
const template = excel.buildSubjectTemplate(subject, students);
const workbook = require('xlsx').read(template, { type: 'buffer' });
const sheet = workbook.Sheets['Students'];
const aoa = require('xlsx').utils.sheet_to_json(sheet, { header: 1 });
check('subject template header = Hall Ticket, Name, Marks', JSON.stringify(aoa[0]) === JSON.stringify(['Hall Ticket Number', 'Student Name', 'Marks']), JSON.stringify(aoa[0]));

// --- Full workflow: Paste -> Preview -> Validate -> Submit decision ---
console.log('== Full workflow: Paste -> Preview -> Submit ==');
const knownKeys = new Set(students.map((s) => String(s.hall_ticket_number).toLowerCase()));
const previewRows = rUser.rows; // from parseSubjectRows above
const submitPayload = previewRows.map((r) => ({ hall_ticket_number: r.hall_ticket_number, name: r.name, marks: r.marks }));
const plan = excel.planMarksSubmission(submitPayload, { knownHallKeys: knownKeys, maxMarks: 100 });
check('submit: 8 marks accepted', plan.updated === 8, JSON.stringify(plan));
check('submit: 0 skipped', plan.skipped === 0, JSON.stringify(plan.skippedReasons));
check('submit: 7 new students created (JEE250032 already on file)', plan.created === 7, `got ${plan.created}`);
check('submit: existing hall ticket flagged as update (not new)', plan.accepted.find((r) => r.hall_ticket_number === 'JEE250032').isNew === false);

// Submit-level rejections give precise reasons.
const badSubmit = [
  { hall_ticket_number: 'JEE250018', name: 'Nikhil', marks: 91 },
  { hall_ticket_number: 'JEE250018', name: 'Nikhil', marks: 92 },   // duplicate
  { hall_ticket_number: 'NEW101', name: '', marks: 50 },            // new without name
  { hall_ticket_number: 'JEE250005', name: 'Aisha', marks: 250 },   // out of range
  { hall_ticket_number: 'NEW102', name: 'Sam', marks: 70 },         // valid new
];
const planBad = excel.planMarksSubmission(badSubmit, { knownHallKeys: knownKeys, maxMarks: 100 });
check('reject: duplicate flagged with reason', planBad.skippedReasons.some((r) => r.includes('duplicate')), JSON.stringify(planBad.skippedReasons));
check('reject: new-without-name flagged', planBad.skippedReasons.some((r) => r.includes('student name missing')), JSON.stringify(planBad.skippedReasons));
check('reject: out-of-range flagged', planBad.skippedReasons.some((r) => r.includes('between 0 and 100')), JSON.stringify(planBad.skippedReasons));
check('reject: valid rows still accepted', planBad.updated === 2, JSON.stringify(planBad));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);