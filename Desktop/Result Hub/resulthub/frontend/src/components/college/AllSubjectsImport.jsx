import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../Layout.jsx';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext.jsx';
import { notifyDataChanged, useDataSync } from '../../lib/realtime';
import { Field, Spinner } from '../ui.jsx';
import SpreadsheetGrid from '../SpreadsheetGrid.jsx';

// ---- Client-side header matching (mirrors backend variants) ----

function normHeader(h) {
  return String(h ?? '')
    .replace(/^\uFEFF/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-./()#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const HALL = new Set(['hall ticket number', 'hall ticket no', 'hall ticket', 'hallticket', 'ht number', 'ht no', 'htno', 'hallticket number', 'ticket number', 'ticket no', 'hall no']);
const NAME = new Set(['student name', 'studentname', 'student', 'name', 'candidate name', 'full name']);
const SECTION = new Set(['section', 'sec', 'division', 'class', 'batch']);

function familyOf(col) {
  if (HALL.has(col)) return 'hall';
  if (NAME.has(col)) return 'name';
  if (SECTION.has(col)) return 'section';
  return null;
}

// Collapse a subject name/header to its core wording so decorated and short
// variants (roman numerals, digits) still compare equal. Mirrors the server's
// subjectCore so the grid aligns headers exactly like the backend maps marks.
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

// Common equivalent names for subject columns (mirrors backend SUBJECT_ALIASES).
// Without this, alias headers like "Maths"/"Math" fall out of the grid while
// the exact names for Physics/Chemistry align, making Mathematics look
// special-cased even though the server already maps every subject identically.
const SUBJECT_FAMILIES = {
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

const ALIAS_TO_FAMILY = {};
Object.entries(SUBJECT_FAMILIES).forEach(([family, aliases]) => {
  aliases.forEach((alias) => {
    ALIAS_TO_FAMILY[alias] = family;
  });
});

function subjectFamilyOf(name) {
  return ALIAS_TO_FAMILY[normHeader(name)] || null;
}

// True when a pasted/raw cell matches a canonical grid column, using the same
// tolerant matching as alignRawToGrid and the backend (exact, base-column
// family, subject alias family, core wording). Lets "Maths"/"Math" paste rows
// line up with the "Mathematics" grid column like Physics/Chemistry already do.
function cellMatchesColumn(cell, col) {
  const nh = normHeader(cell);
  const nk = normHeader(col);
  if (nh === nk) return true;
  const bf1 = familyOf(nh);
  const bf2 = familyOf(nk);
  if (bf1 && bf2 && bf1 === bf2) return true;
  const sf1 = subjectFamilyOf(nh);
  const sf2 = subjectFamilyOf(nk);
  if (sf1 && sf2 && sf1 === sf2) return true;
  return subjectCore(cell) === subjectCore(col);
}

// Align a raw matrix (header row + data rows from an uploaded file) to the
// canonical grid columns, so the unified spreadsheet always shows the same
// order. Subject columns respect the user's column mappings so a mapped column
// reappears under the right subject header.
function alignRawToGrid(raw, gridColumns, subjects, columnMappings) {
  if (!raw || raw.length === 0) return [];
  const headers = raw[0];
  const used = new Set();
  // rawIdx -> gridColIndex
  const map = {};
  const assign = (rawIdx, colIdx) => {
    if (rawIdx >= 0 && colIdx >= 0 && !map[rawIdx] && !used.has(colIdx)) {
      map[rawIdx] = colIdx;
      used.add(colIdx);
    }
  };
  headers.forEach((h, rawIdx) => {
    const nh = normHeader(h);
    const nf = familyOf(nh);
    gridColumns.forEach((col, ci) => {
      const nk = normHeader(col);
      if (ci < 3 && (nh === nk || (nf && familyOf(nk) === nf))) assign(rawIdx, ci);
    });
    subjects.forEach((s, si) => {
      const colIdx = 3 + si;
      const nk = normHeader(s.name);
      const mapped = columnMappings && columnMappings[h] === s.id;
      const nf = subjectFamilyOf(nh);
      const nkf = subjectFamilyOf(nk);
      const sameCore = subjectCore(s.name) === subjectCore(nh);
      if (mapped || nh === nk || sameCore || (nf && nkf && nf === nkf)) assign(rawIdx, colIdx);
    });
  });
  return raw.slice(1).map((row) =>
    gridColumns.map((_, ci) => {
      const rawIdx = Object.keys(map).find((k) => map[k] === ci);
      return rawIdx === undefined ? '' : row[rawIdx] ?? '';
    })
  );
}

// Convert server validation errors into a per-cell status lookup for the grid.
// error.row is the 1-based file row (header = row 1), so data row index = row - 2.
function errorsToCellStatus(errors, gridColumns) {
  const byCell = {};
  (errors || []).forEach((err) => {
    const r = err.row - 2;
    const c = gridColumns.findIndex((col) => normHeader(col) === normHeader(err.field));
    if (c >= 0 && r >= 0 && !byCell[`${r}-${c}`]) {
      byCell[`${r}-${c}`] = { tone: 'error', message: err.message };
    }
  });
  return (r, c) => byCell[`${r}-${c}`] || null;
}

function trimGrid(rows) {
  const copy = rows.map((row) => [...row]);
  while (copy.length && copy[copy.length - 1].every((c) => String(c ?? '').trim() === '')) copy.pop();
  return copy;
}

function MethodTabs({ method, onChange }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onChange('excel')}
        className={`rounded-xl border p-3 text-left transition ${method === 'excel'
          ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'}`}
      >
        <span className="text-sm font-bold">📁 Upload Excel</span>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Drag &amp; drop or pick a .xlsx / .xls file</p>
      </button>
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`rounded-xl border p-3 text-left transition ${method === 'grid'
          ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'}`}
      >
        <span className="text-sm font-bold">📋 Paste &amp; Edit</span>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Paste rows straight into the spreadsheet grid below</p>
      </button>
    </div>
  );
}

export default function AllSubjectsImport({ onBack }) {
  const toast = useToast();
  const [courses, setCourses] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [exams, setExams] = useState(null);
  const [examChoice, setExamChoice] = useState('none');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [method, setMethod] = useState('grid');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [gridRows, setGridRows] = useState([]);
  const [preview, setPreview] = useState(null);
  const [columnMappings, setColumnMappings] = useState({});
  const [imported, setImported] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);
  const [newExam, setNewExam] = useState({ name: '', type: 'Weekly Test', exam_date: '' });

  useEffect(() => {
    api.get('/api/college/courses')
      .then((d) => {
        setCourses(d.courses);
        if (d.courses.length) setCourseId(d.courses[0].id);
      })
      .catch((e) => toast(e.message, 'error'));
  }, [toast]);

  // Keep the course/section/exam pickers fresh when a course, section or exam
  // is added or edited in another tab.
  const reloadCourses = useCallback(() => {
    api.get('/api/college/courses')
      .then((d) => setCourses(d.courses))
      .catch((e) => toast(e.message, 'error'));
  }, [toast]);

  const reloadExams = useCallback(() => {
    if (!courseId || !sectionId) { setExams([]); return; }
    api.get(`/api/college/exams?course_id=${courseId}&section_id=${sectionId}`)
      .then((d) => setExams(d.exams))
      .catch((e) => toast(e.message, 'error'));
  }, [courseId, sectionId, toast]);
  useDataSync(() => {
    reloadCourses();
    reloadExams();
  }, { interval: 0 });

  const course = useMemo(() => (courses || []).find((c) => c.id === courseId) || null, [courses, courseId]);

  const gridColumns = useMemo(() => {
    const base = ['Hall Ticket Number', 'Student Name', 'Section'];
    return [...base, ...(course?.subjects || []).map((s) => s.name)];
  }, [course]);

  const subjectLabel = useMemo(() => {
    const names = (course?.subjects || []).map((s) => s.name.toUpperCase());
    return names.length > 0 ? names.join(', ') : 'no subjects configured';
  }, [course]);

  // The reset effect must only fire when the ADMIN changes the selected
  // course, never when the course data is re-fetched by the realtime sync.
  // `course` is a freshly-parsed object on every fetch (new identity even for
  // identical data), so keying on it wipes the in-progress upload whenever the
  // window regains focus (e.g. right after choosing an Excel file). `courseId`
  // is the stable user selection.
  useEffect(() => {
    setSectionId(course?.sections?.[0]?.id || '');
    setExamChoice('none');
    setSelectedExamId('');
    setPreview(null);
    setFile(null);
    setGridRows([]);
    setImported(null);
  }, [courseId]);

  useEffect(() => { reloadExams(); }, [reloadExams]);

  const mappableColumns = useMemo(() => {
    if (!preview) return [];
    const cols = [];
    (preview.suggestions || []).forEach((s) => cols.push({ column: s.column, suggestion: s }));
    (preview.unrecognised || []).forEach((c) => {
      if (!cols.some((x) => x.column === c)) cols.push({ column: c, suggestion: null });
    });
    return cols;
  }, [preview]);

  const selectedExam = (exams || []).find((e) => e.id === selectedExamId) || null;

  const downloadTemplate = async () => {
    try {
      await api.download(`/api/college/upload/template?course_id=${courseId}`, 'template.xlsx');
      toast('Template downloaded');
    } catch (error) { toast(error.message, 'error'); }
  };

  // Send the current grid (rebuilt as tab-separated text) to the server for
  // validation. Used for re-validation after edits and for the paste flow.
  const validateGrid = useCallback(async (overrides) => {
    const cleanRows = trimGrid(gridRows);
    if (cleanRows.length === 0) return toast('Paste or type at least one row first', 'error');
    const headerLine = gridColumns.join('\t');
    const data = `${headerLine}\n${cleanRows.map((row) => row.join('\t')).join('\n')}`;
    setBusy(true);
    try {
      const result = await api.post('/api/college/upload/preview-paste', {
        course_id: courseId,
        section_id: sectionId,
        data,
        column_overrides: overrides,
      });
      applyPreview(result, overrides);
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  }, [gridRows, gridColumns, courseId, sectionId, toast]);

  // Upload a real Excel file: the server parses it and returns the raw grid
  // plus validation results, which populate the unified spreadsheet.
  const validateFile = useCallback(async (overrides) => {
    if (!file) return toast('Choose an Excel file first', 'error');
    if (file.size > 10 * 1024 * 1024) return toast('File is too large (max 10 MB)', 'error');
    setBusy(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('course_id', courseId);
      data.append('section_id', sectionId);
      if (Object.keys(overrides).length) data.append('column_overrides', JSON.stringify(overrides));
      const result = await api.upload('/api/college/upload/preview', data);
      applyPreview(result, overrides);
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  }, [file, courseId, sectionId, gridColumns, toast]);

  const applyPreview = (result, overrides) => {
    setPreview(result);
    if (result.raw && result.raw.length > 0) {
      setGridRows(alignRawToGrid(result.raw, gridColumns, course?.subjects || [], overrides || {}));
    }
    setColumnMappings((prev) => {
      const next = { ...prev };
      (result.suggestions || []).forEach((s) => { if (!(s.column in next)) next[s.column] = s.subject_id; });
      (result.unrecognised || []).forEach((c) => { if (!(c in next)) next[c] = ''; });
      return next;
    });
    toast(
      `${result.summary.valid} valid rows, ${result.summary.invalid} issues`,
      result.summary.invalid || result.warnings?.length ? 'info' : 'success'
    );
  };

  const runValidate = (event) => {
    if (event) event.preventDefault();
    if (!courseId) return toast('Select a course first', 'error');
    if (!course || course.subjects.length === 0) return toast('This course has no subjects — add subjects on the Courses page first', 'error');
    if (!sectionId) return toast('Select a section first', 'error');
    setImported(null);
    // A freshly picked Excel file (grid not populated yet) is parsed via the
    // file upload. Once the grid is populated it becomes the source of truth,
    // so any later validate (including after edits) uses the grid text.
    if (method === 'excel' && file && gridRows.length === 0) validateFile(columnMappings);
    else validateGrid(columnMappings);
  };

  const commit = async () => {
    if (!course || course.subjects.length === 0) return toast('This course has no subjects — add subjects on the Courses page first', 'error');
    if (!preview || preview.rows.length === 0) return toast('Nothing valid to import', 'error');
    setBusy(true);
    try {
      const payload = {
        course_id: courseId,
        section_id: sectionId,
        rows: preview.rows,
      };
      if (examChoice === 'existing') {
        if (!selectedExamId) { toast('Select an exam to continue', 'error'); setBusy(false); return; }
        payload.exam_id = selectedExamId;
      } else if (examChoice === 'new') {
        payload.exam_name = newExam.name;
        payload.exam_type = newExam.type;
        payload.exam_date = newExam.exam_date;
      }
      const result = await api.post('/api/college/upload/commit', payload);
      setImported({ count: result.imported });
      setPreview(null);
      setFile(null);
      setGridRows([]);
      notifyDataChanged({ type: 'college-data' });
      toast(`${result.imported} students imported and results calculated`);
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  };

  const onFileDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const dropped = event.dataTransfer?.files?.[0];
    if (dropped) {
      setFile(dropped);
      setGridRows([]);
      setPreview(null);
      setImported(null);
    }
  };

  const cellStatus = useMemo(() => errorsToCellStatus(preview?.errors, gridColumns), [preview, gridColumns]);
  const summary = preview?.summary;

  if (!courses) {
    return (
      <Layout title="Upload Marks" subtitle="Import student marks" actions={<button className="btn-secondary" onClick={onBack}>Back</button>}>
        <div className="card p-5 text-sm text-slate-500 dark:text-slate-400">Loading…</div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Upload All Subjects"
      subtitle="Import the complete result for a course, section and exam"
      actions={<button className="btn-secondary" onClick={onBack}>← Back</button>}
    >
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-200">
        Fill in the spreadsheet below or upload an Excel file. Hall Ticket Number and Student Name are required;
        every subject needs a numeric mark within its allowed range. Invalid cells are highlighted before import.
      </div>

      {course && course.subjects.length === 0 && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <strong>{course.name}</strong> has no subjects configured, so marks cannot be imported for it yet.
          Add the course's subjects (with maximum marks) on the <strong>Courses</strong> page first, then come back here.
        </div>
      )}

      <div className="card mt-4 p-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Course">
            <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Section">
            <select className="input" value={sectionId} onChange={(e) => setSectionId(e.target.value)} required>
              <option value="">Select a section</option>
              {(course?.sections || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Exam">
            <select className="input" value={examChoice}
              onChange={(e) => {
                const value = e.target.value;
                setExamChoice(value);
                setSelectedExamId(value.startsWith('exam:') ? value.slice(5) : '');
                setPreview(null);
              }}>
              <option value="none">General result (no exam)</option>
              {(exams || []).map((e) => (
                <option key={e.id} value={`exam:${e.id}`}>{e.name} · {e.exam_date}</option>
              ))}
              <option value="new">＋ Create new exam</option>
            </select>
          </Field>
        </div>

        {examChoice === 'new' && (
          <div className="mt-4 grid gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 lg:grid-cols-3">
            <Field label="Exam name">
              <input className="input" placeholder="e.g. Weekly Test 01" value={newExam.name}
                onChange={(e) => setNewExam({ ...newExam, name: e.target.value })} />
            </Field>
            <Field label="Exam type">
              <select className="input" value={newExam.type}
                onChange={(e) => setNewExam({ ...newExam, type: e.target.value })}>
                <option value="Weekly Test">Weekly Test</option>
                <option value="Unit Test">Unit Test</option>
              </select>
            </Field>
            <Field label="Exam date">
              <input className="input" type="date" value={newExam.exam_date}
                onChange={(e) => setNewExam({ ...newExam, exam_date: e.target.value })} />
            </Field>
          </div>
        )}
      </div>

      <div className="card mt-4 p-5">
        <div className="mb-4">
          <MethodTabs
            method={method}
            onChange={(m) => { setMethod(m); setPreview(null); setFile(null); setImported(null); }}
          />
        </div>

        {method === 'excel' ? (
          <div className="space-y-3">
            <button
              type="button"
              className={`input flex min-h-[9rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-center transition ${
                dragOver
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onFileDrop}
            >
              <span className="text-3xl">📥</span>
              <span className="font-semibold">{file ? file.name : 'Drag & drop your Excel file here, or click to choose'}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">.xlsx or .xls · max 10 MB</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => { setFile(e.target.files?.[0] || null); setGridRows([]); setPreview(null); setImported(null); }}
              />
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn-secondary" onClick={downloadTemplate} disabled={!courseId}>
                Download Sample Template
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Columns: Hall Ticket Number, Student Name, Section, {subjectLabel}
              </p>
            </div>
          </div>
        ) : (
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            Click a cell and type, or copy rows from Excel / Google Sheets and press Ctrl+V. Rows are created
            automatically. Use <kbd>Tab</kbd>, arrows or <kbd>Enter</kbd> to move between cells.
          </p>
        )}

        <div className="mt-3">
          <SpreadsheetGrid
            columns={gridColumns}
            rows={gridRows}
            onChange={(next) => { setGridRows(next); setPreview(null); setImported(null); }}
            cellStatus={cellStatus}
            matchHeaderRow={(first, cols) => cols.length > 0 && first.length >= cols.length && first.every((cell, i) => cellMatchesColumn(cell, cols[i]))}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {summary
              ? `${summary.total} row${summary.total === 1 ? '' : 's'} loaded · ${summary.valid} ready to import · ${summary.skipped} skipped`
              : `${gridRows.length} row${gridRows.length === 1 ? '' : 's'} in the grid`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setPreview(null); setGridRows([]); setFile(null); setImported(null); }}
            >
              Clear
            </button>
            <button className="btn-primary" onClick={runValidate}
              disabled={busy || !(method === 'excel' && file ? true : gridRows.length > 0)}>
              {busy && <Spinner />} {method === 'excel' && file && gridRows.length === 0 ? 'Load & Validate' : 'Validate & Preview'}
            </button>
          </div>
        </div>
      </div>

      {preview && (
        <>
          <div className="card mt-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-lg">Import summary</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {preview.course.name} · {preview.section.name}
                  {examChoice === 'existing' ? ` · ${selectedExam?.name || ''}` : ''}
                  {examChoice === 'new' ? ` · ${newExam.name || 'New exam'}` : ''}
                </p>
              </div>
              <button className="btn-primary" onClick={commit} disabled={busy || preview.rows.length === 0}>
                {busy && <Spinner />} Confirm Upload
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryCard label="Rows loaded" value={summary?.total ?? 0} />
              <SummaryCard label="Ready to import" value={summary?.valid ?? 0} tone="emerald" />
              <SummaryCard label="Skipped" value={summary?.skipped ?? 0} tone={summary?.skipped ? 'rose' : 'slate'} />
              <SummaryCard label="Duplicates" value={summary?.duplicates ?? 0} tone={summary?.duplicates ? 'amber' : 'slate'} />
            </div>
          </div>

          {preview.errors.length > 0 && (
            <div className="card mt-4 overflow-hidden">
              <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                <h2 className="font-bold text-rose-600">{preview.errors.length} validation issues</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Problem cells are highlighted in red in the spreadsheet above. Fix them and validate again.
                </p>
              </div>
              <div className="max-h-72 overflow-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/60">
                    <tr><th className="th">Row</th><th className="th">Column</th><th className="th">Problem</th></tr>
                  </thead>
                  <tbody className="row-divider">
                    {preview.errors.map((error, index) => (
                      <tr key={index}>
                        <td className="td">{error.row}</td>
                        <td className="td">{error.field === '-' ? '—' : error.field}</td>
                        <td className="td text-rose-600">{error.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mappableColumns.length > 0 && (
            <div className="card mt-4 overflow-hidden">
              <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                <h2 className="font-bold text-brand-600">{mappableColumns.length} column{ mappableColumns.length === 1 ? ' needs' : 's need'} mapping</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  These columns could not be matched to a course subject. Map one to a subject to
                  import its marks, otherwise it will be ignored. Closest matches are pre-selected.
                </p>
              </div>
              <div className="p-4">
                <div className="grid gap-2">
                  {mappableColumns.map(({ column, suggestion }) => (
                    <div key={column} className="flex flex-wrap items-center gap-2">
                      <span className="min-w-[10rem] font-mono text-sm font-semibold">{column}</span>
                      <select
                        className="input flex-1 sm:max-w-xs"
                        value={columnMappings[column] || ''}
                        onChange={(e) => setColumnMappings((prev) => ({ ...prev, [column]: e.target.value }))}
                      >
                        <option value="">Ignore column</option>
                        {(preview.subjects || []).map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {suggestion && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          closest: {suggestion.subject_name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn-primary mt-3"
                  onClick={runValidate}
                  disabled={busy}
                >
                  {busy && <Spinner />} Apply mappings &amp; re-validate
                </button>
              </div>
            </div>
          )}

          {preview.warnings?.length > 0 && (
            <div className="card mt-4 overflow-hidden">
              <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                <h2 className="font-bold text-amber-600">{preview.warnings.length} warnings</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  These rows are still imported — no action needed unless you want to change the data.
                </p>
              </div>
              <div className="max-h-40 overflow-auto">
                <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
                  {preview.warnings.map((warning, index) => (
                    <li key={index} className="px-4 py-2 text-slate-600 dark:text-slate-300">{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {imported && (
        <div className="card mt-4 p-5">
          <h2 className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">Upload successful</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {imported.count} student{imported.count === 1 ? '' : 's'} imported and results calculated.
          </p>
          <button className="btn-secondary mt-4" onClick={() => { setImported(null); setGridRows([]); }}>
            Start another upload
          </button>
        </div>
      )}
    </Layout>
  );
}

function SummaryCard({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
  };
  return (
    <div className={`rounded-xl p-3 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}