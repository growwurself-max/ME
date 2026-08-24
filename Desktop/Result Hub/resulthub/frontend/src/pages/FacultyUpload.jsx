import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useTheme } from '../context/ThemeContext.jsx';
import { notifyDataChanged } from '../lib/realtime';
import { Spinner } from '../components/ui.jsx';
import SpreadsheetGrid from '../components/SpreadsheetGrid.jsx';

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
const MARKS = new Set(['marks', 'marks obtained', 'marks scored', 'marks secured', 'obtained marks', 'score', 'scored', 'secured', 'total marks', 'total']);

function familyOf(col) {
  if (HALL.has(col)) return 'hall';
  if (NAME.has(col)) return 'name';
  if (MARKS.has(col)) return 'marks';
  return null;
}

const GRID_COLUMNS = ['Hall Ticket Number', 'Student Name', 'Marks'];

function alignRawToGrid(raw, gridColumns) {
  if (!raw || raw.length === 0) return [];
  const headers = raw[0];
  const indexOf = (colKey) => {
    const nk = normHeader(colKey);
    const nf = familyOf(nk);
    let found = -1;
    headers.forEach((h, i) => {
      const nh = normHeader(h);
      if (nh === nk || (nf && familyOf(nh) === nf)) found = i;
    });
    return found;
  };
  return raw.slice(1).map((row) => gridColumns.map((col) => row[indexOf(col)] ?? ''));
}

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
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Upload a .xlsx or .xls file</p>
      </button>
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`rounded-xl border p-3 text-left transition ${method === 'grid'
          ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'}`}
      >
        <span className="text-sm font-bold">📋 Paste &amp; Edit</span>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Type or copy &amp; paste rows from a spreadsheet</p>
      </button>
    </div>
  );
}

export default function FacultyUpload() {
  const { theme, toggleTheme } = useTheme();
  const link = useMemo(() => window.location.href, []);
  const token = useMemo(() => new URLSearchParams(window.location.search).get('l'), []);

  const [context, setContext] = useState(null);
  const [code, setCode] = useState('');
  const [sheet, setSheet] = useState(null);
  const [method, setMethod] = useState('grid');
  const [file, setFile] = useState(null);
  const [gridRows, setGridRows] = useState([]);
  const [preview, setPreview] = useState(null);
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const marksRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadContext = () => {
    setError('');
    return api.post('/api/public/faculty-upload/context', { link })
      .then((d) => { setContext(d); setCode(''); })
      .catch((e) => { setError(e.message); setContext(null); });
  };

  useEffect(() => {
    if (token) loadContext();
  }, [link, token]);

  const verify = async (event) => {
    event.preventDefault();
    if (code.length !== 4) { setError('Enter the 4-digit faculty upload code'); return; }
    setBusy(true);
    setError('');
    try {
      const result = await api.post('/api/public/faculty-upload/verify', { link, code });
      setSheet(result);
      setGridRows([]);
      setPreview(null);
      setDone(null);
      setMethod('grid');
      setFile(null);
      setTimeout(() => marksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const downloadTemplate = async () => {
    try {
      await api.download(`/api/public/faculty-upload/template?link=${encodeURIComponent(link)}&code=${encodeURIComponent(code)}`, 'marks_template.xlsx');
    } catch (err) { setError(err.message); }
  };

  const runPreview = async (event) => {
    if (event) event.preventDefault();
    if (!sheet) return;
    setBusy(true);
    setError('');
    setDone(null);
    try {
      let result;
      if (method === 'excel') {
        if (!file) { setError('Choose an Excel file first'); setBusy(false); return; }
        if (file.size > 10 * 1024 * 1024) { setError('File is too large (max 10 MB)'); setBusy(false); return; }
        const data = new FormData();
        data.append('file', file);
        data.append('link', link);
        data.append('code', code);
        result = await api.upload('/api/public/faculty-upload/preview', data);
        if (result.raw && result.raw.length > 0) {
          setGridRows(alignRawToGrid(result.raw, GRID_COLUMNS));
        }
      } else {
        const cleanRows = trimGrid(gridRows);
        if (cleanRows.length === 0) { setError('Paste or type at least one row first'); setBusy(false); return; }
        const data = `${GRID_COLUMNS.join('\t')}\n${cleanRows.map((row) => row.join('\t')).join('\n')}`;
        result = await api.post('/api/public/faculty-upload/preview', { link, code, data });
      }
      setPreview(result);
      setError('');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const confirmUpload = async () => {
    if (!sheet || !preview) return;
    const validRows = preview.rows.map((row) => ({
      hall_ticket_number: row.hall_ticket_number,
      name: row.name,
      marks: row.marks,
    }));
    if (validRows.length === 0) { setError('No valid records to upload — fix the rows above or cancel.'); return; }

    setBusy(true);
    setError('');
    try {
      const result = await api.post('/api/public/faculty-upload/submit', { link, code, marks: validRows });
      setDone({ updated: result.updated, skipped: result.skipped, was_update: result.was_update, created: result.created || 0 });
      setSheet(null);
      setPreview(null);
      setFile(null);
      setGridRows([]);
      notifyDataChanged({ type: 'faculty' });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const goBack = () => {
    setPreview(null);
    setError('');
  };

  const resetAll = () => {
    setDone(null);
    setSheet(null);
    setPreview(null);
    setFile(null);
    setGridRows([]);
    loadContext();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const invalidCount = (preview?.errors || []).length;
  const validCount = (preview?.rows || []).length;
  const cellStatus = useMemo(() => errorsToCellStatus(preview?.errors, GRID_COLUMNS), [preview]);
  const summary = preview?.summary;

  return (
    <div className="min-h-screen">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:px-10">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-black text-white">R</span>
          <span className="text-lg font-extrabold tracking-tight">ResultHub</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={toggleTheme} aria-label="Toggle colour mode">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <Link className="btn-secondary" to="/login">Institution login</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {!token && (
          <div className="card p-5 text-sm text-slate-600 dark:text-slate-300">
            This upload link is invalid or incomplete. Ask the college administrator for a fresh link.
          </div>
        )}

        {token && context && !sheet && !done && (
          <div className="card p-5">
            <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{context.college}</p>
              <h1 className="mt-1 text-xl font-extrabold">{context.subject.name} — Marks Upload</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {context.course} · {context.section} · {context.exam.name} · {formatDate(context.exam.exam_date)}
              </p>
            </div>

            <form onSubmit={verify} className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:w-40">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Faculty upload code
                </label>
                <input
                  className="input mt-1 text-center font-mono text-lg tracking-[0.5em]"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="— — — —"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </div>
              <button className="btn-primary w-full sm:w-40" disabled={busy}>
                {busy && <Spinner />} Verify
              </button>
            </form>
            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
          </div>
        )}

        {token && error && !sheet && !context && (
          <div className="card p-5 text-sm text-rose-600">{error}</div>
        )}

        {token && sheet && !done && (
          <div ref={marksRef} className="card mt-0 overflow-hidden">
            <div className="border-b border-slate-200 bg-gradient-to-r from-brand-700 to-brand-600 p-4 text-white dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{sheet.college}</p>
              <h1 className="mt-1 text-lg font-extrabold">{sheet.subject.name} — Marks</h1>
              <p className="mt-0.5 text-xs text-white/80">
                {sheet.course} · {sheet.section} · {sheet.exam.name} · {formatDate(sheet.exam.exam_date)} · Max {sheet.subject.max_marks}
              </p>
            </div>

            <div className="border-b border-slate-200 p-4 dark:border-slate-800">
              <p className="text-sm">
                Fill in the <span className="font-bold">Marks</span> column for {sheet.subject.name} (max{' '}
                {sheet.subject.max_marks}). The headers are fixed — copy the data rows from Excel and paste
                into any cell. The header row is ignored automatically.
              </p>
            </div>

            <div className="space-y-4 p-4">
              <MethodTabs method={method} onChange={(m) => { setMethod(m); setError(''); setPreview(null); }} />

              {method === 'excel' ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    className="input flex min-h-[7rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-center"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="text-2xl">📥</span>
                    <span className="font-semibold">{file ? file.name : 'Drag & drop your Excel file here, or click to choose'}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">.xlsx or .xls · max 10 MB</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => { setFile(e.target.files?.[0] || null); setPreview(null); }}
                    />
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className="btn-secondary" onClick={downloadTemplate}>
                      Download Subject Template
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      The template lists your students — just fill in the Marks column.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click a cell and type, or copy data rows from Excel / Google Sheets and press Ctrl+V. Rows
                  are created automatically. Use <kbd>Tab</kbd>, arrows or <kbd>Enter</kbd> to move between cells.
                </p>
              )}

              <SpreadsheetGrid
                columns={GRID_COLUMNS}
                rows={gridRows}
                onChange={(next) => { setGridRows(next); setPreview(null); }}
                cellStatus={cellStatus}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {summary
                    ? `${summary.total} row${summary.total === 1 ? '' : 's'} pasted · ${summary.valid} validated · ${summary.valid} ready to submit${summary.skipped ? ` · ${summary.skipped} skipped` : ''}`
                    : `${gridRows.length} row${gridRows.length === 1 ? '' : 's'} in the grid · only ${sheet.subject.name} marks are updated`}
                </p>
                <div className="flex items-center gap-2">
                  {error && <span className="text-sm text-rose-600">{error}</span>}
                  <button type="button" className="btn-secondary" onClick={resetAll}>Cancel</button>
                  <button className="btn-primary" onClick={runPreview} disabled={busy}>
                    {busy && <Spinner />} Validate &amp; Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {token && sheet && !done && preview && (
          <div className="card mt-4 overflow-hidden">
            <div className="border-b border-slate-200 bg-gradient-to-r from-brand-700 to-brand-600 p-4 text-white dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{preview.college}</p>
              <h1 className="mt-1 text-lg font-extrabold">Preview — {preview.subject.name} Marks</h1>
              <p className="mt-0.5 text-xs text-white/80">
                {preview.course} · {preview.section} · {preview.exam.name} · Max {preview.subject.max_marks}
              </p>
            </div>

            <div className="border-b border-slate-200 p-4 dark:border-slate-800">
              <p className="text-sm font-semibold">
                {invalidCount > 0
                  ? `${invalidCount} issue${invalidCount === 1 ? '' : 's'} found — problem cells are highlighted red above.`
                  : 'All rows are valid and ready to upload.'}
              </p>
            </div>

            {invalidCount > 0 && (
              <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                <h2 className="font-bold text-rose-600">Validation issues</h2>
                <ul className="mt-2 space-y-1 text-sm text-rose-600">
                  {preview.errors.map((err, i) => (
                    <li key={i}>Row {err.row} — {err.message}.</li>
                  ))}
                </ul>
              </div>
            )}

            {preview.warnings?.length > 0 && (
              <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                <h2 className="font-bold text-amber-600">New students</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  These Hall Ticket Numbers are not on file yet and will be added during import.
                </p>
                <ul className="mt-2 space-y-1 text-sm text-amber-600">
                  {preview.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {validCount} mark{validCount === 1 ? '' : 's'} ready to submit. Marks are saved as draft and stay
                hidden from students until the college publishes the result.
              </p>
              <div className="flex items-center gap-2">
                {error && <span className="text-sm text-rose-600">{error}</span>}
                <button type="button" className="btn-secondary" onClick={goBack} disabled={busy}>Cancel</button>
                <button className="btn-primary" onClick={confirmUpload} disabled={busy || validCount === 0}>
                  {busy && <Spinner />} Confirm Upload
                </button>
              </div>
            </div>
          </div>
        )}

        {done && (
          <div className="card p-5">
            <h1 className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
              {done.was_update ? 'Marks Updated' : 'Upload Successful'}
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {done.updated} mark{done.updated === 1 ? '' : 's'} uploaded successfully for {context?.subject?.name || 'the subject'}.
            </p>
            {done.created > 0 && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {done.created} new student{done.created === 1 ? '' : 's'} record{done.created === 1 ? '' : 's'} created automatically.
              </p>
            )}
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Your upload has been saved. The college will review and publish the final result.
            </p>
            {done.skipped > 0 && (
              <p className="mt-1 text-sm text-amber-600">
                {done.skipped} row{done.skipped === 1 ? '' : 's'} skipped — the server could not match or validate them.
              </p>
            )}
            <button
              type="button"
              className="btn-primary mt-4"
              disabled={busy}
              onClick={resetAll}
            >
              Upload again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}