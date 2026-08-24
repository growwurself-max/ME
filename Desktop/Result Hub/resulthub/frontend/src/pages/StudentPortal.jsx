import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useTheme } from '../context/ThemeContext.jsx';
import { exportMarksheetPdf } from '../lib/pdf';
import { subscribeDataChanged } from '../lib/realtime';
import { Field, Spinner, StatusBadge } from '../components/ui.jsx';
import { HelpCard, HelpCenter } from '../components/HelpCenter.jsx';

export default function StudentPortal() {
  const { theme, toggleTheme } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [data, setData] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const search = async (event) => {
    event.preventDefault();
    await runSearch();
  };

  // Re-run the last search silently when a result is published elsewhere, so a
  // student staring at the page sees their result appear without refreshing.
  const hasDataRef = useRef(false);
  useEffect(() => { hasDataRef.current = Boolean(data); }, [data]);

  useEffect(() => {
    const unsubscribe = subscribeDataChanged((event) => {
      if (event.type === 'published' && hasDataRef.current) runSearch(true);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = async (silent = false) => {
    setBusy(true);
    setError('');
    if (!silent) { setData(null); setSelectedResult(null); }
    try {
      const params = new URLSearchParams();
      params.set('identifier', identifier.trim());
      if (name.trim()) params.set('name', name.trim());
      if (examName.trim()) params.set('exam_name', examName.trim());
      if (examDate) params.set('exam_date', examDate);
      const response = await api.get(`/api/public/results?${params.toString()}`);
      setData(response);
      setSelectedResult(response.latest_result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const currentResult = selectedResult || data?.latest_result;

  return (
    <div className="min-h-screen">
      <header className="no-print flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800 lg:px-10">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-black text-white">R</span>
          <span className="text-lg font-extrabold tracking-tight">ResultHub</span>
        </div>
        <div className="flex items-center gap-2">
          <HelpCenter />
          <button className="btn-ghost" onClick={toggleTheme} aria-label="Toggle colour mode">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <Link className="btn-secondary" to="/login">Institution login</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10 lg:py-14">
        <section className="no-print text-center">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">Check your result</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            Enter your Hall Ticket Number. Only results published by your institution
            are available here.
          </p>
        </section>

        <form onSubmit={search} className="no-print card mx-auto mt-6 flex flex-col gap-3 p-4 sm:mt-8 sm:p-5">
          <Field label="Hall Ticket Number">
            <input
              className="input"
              placeholder="e.g. JEE250018"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Student Name (optional)">
              <input
                className="input"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Exam Name (optional)">
              <input
                className="input"
                placeholder="e.g. Weekly Test 01"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
              />
            </Field>
            <Field label="Exam Date (optional)">
              <input
                className="input"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </Field>
          </div>
          <button className="btn-primary w-full sm:w-40 sm:self-end" disabled={busy}>
            {busy && <Spinner />} Search
          </button>
        </form>

        <HelpCard
          className="mt-6"
          description="Learn how to search for your result and download your marksheet."
          videoLabel="Watch Student Portal Tutorial"
        />

        {error && (
          <p className="no-print mx-auto mt-4 rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {error}
          </p>
        )}

        {data && (
          <>
            {data.previous_results && data.previous_results.length > 0 && (
              <div className="no-print card mt-6 p-4 sm:mt-8">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {examName || examDate ? 'Other Published Results' : 'Previous Results'}
                </h3>
                <div className="space-y-2">
                  {data.previous_results.map((r, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedResult(r);
                        setExamName(r.exam_name && r.exam_name !== 'Result' ? r.exam_name : '');
                        setExamDate(r.exam_date || '');
                      }}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selectedResult === r
                          ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                      }`}
                    >
                      <p className="font-semibold">{r.exam_name}</p>
                      {r.exam_date && <p className="text-sm text-slate-500 dark:text-slate-400">Exam Date: {formatDate(r.exam_date)}</p>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentResult && (
              <article className="card mt-6 overflow-hidden sm:mt-8">
                <div className="border-b border-slate-200 bg-gradient-to-r from-brand-700 to-brand-600 p-4 text-white dark:border-slate-800 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Result Statement</p>
                  <h2 className="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">{data.college?.name || data.student.college || 'Result'}</h2>
                  {data.college?.principal_name && (
                    <p className="mt-1 hidden text-sm text-white/80 sm:block">Principal: {data.college.principal_name}</p>
                  )}
                </div>

                <div className="border-b border-slate-200 p-4 dark:border-slate-800 sm:p-6">
                  <h3 className="text-lg font-extrabold sm:text-2xl">{data.student.name}</h3>
                  <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <Detail label="Hall Ticket Number" value={data.student.hall_ticket_number} />
                    <Detail label="Course" value={data.student.course} />
                    <Detail label="Section" value={data.student.section} />
                  </dl>
                </div>

                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60 sm:px-6">
                  <p className="font-semibold">{currentResult.exam_name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(currentResult.exam_date)}{currentResult.exam_type ? ` · ${currentResult.exam_type}` : ''}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/60">
                      <tr>
                        <th className="th">Subject</th>
                        <th className="th">Marks</th>
                        <th className="th">Maximum</th>
                        <th className="th">Passing</th>
                        {currentResult.status && <th className="th">Result</th>}
                      </tr>
                    </thead>
                    <tbody className="row-divider">
                      {data.subjects.map((subject) => (
                        <tr key={subject.name}>
                          <td className="td font-medium">{subject.name}</td>
                          <td className="td">{subject.marks ?? '—'}</td>
                          <td className="td">{subject.max_marks}</td>
                          <td className="td">{subject.passing_marks ?? '—'}</td>
                          {currentResult.status && <td className="td"><StatusBadge status={subject.status} /></td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-slate-200 p-4 dark:border-slate-800 sm:grid-cols-3 sm:p-6">
                  <Summary label="Total Marks" value={`${currentResult.total_marks} / ${currentResult.max_total_marks}`} />
                  {currentResult.percentage !== null && currentResult.percentage !== undefined && <Summary label="Percentage" value={`${currentResult.percentage}%`} />}
                  {currentResult.status && <Summary label="Result" value={currentResult.status} />}
                  {currentResult.grade && <Summary label="Grade" value={currentResult.grade} />}
                  {currentResult.section_rank && <Summary label="Section Rank" value={`#${currentResult.section_rank}`} />}
                  {currentResult.course_rank && <Summary label="Course Rank" value={`#${currentResult.course_rank}`} />}
                </div>

                <div className="no-print flex flex-wrap gap-2 border-t border-slate-200 p-4 dark:border-slate-800 sm:p-6">
                  <button
                    className="btn-secondary flex-1 sm:flex-none"
                    onClick={() => exportMarksheetPdf({
                      ...data.student,
                      ...currentResult,
                      college_name: data.college?.name || data.student.college,
                      subjects: data.subjects,
                    })}
                  >
                    Download Result PDF
                  </button>
                  <button className="btn-primary flex-1 sm:flex-none" onClick={() => window.print()}>Print</button>
                </div>
              </article>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex gap-2">
      <dt className="text-slate-500 dark:text-slate-400">{label}:</dt>
      <dd className="font-semibold">{value || '—'}</dd>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 sm:p-4 dark:bg-slate-800/60">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-extrabold sm:text-xl">{value}</p>
    </div>
  );
}