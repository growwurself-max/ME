import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useTheme } from '../context/ThemeContext.jsx';
import { exportMarksheetPdf } from '../lib/pdf';
import { Field, Spinner, StatusBadge } from '../components/ui.jsx';

export default function StudentPortal() {
  const { theme, toggleTheme } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [data, setData] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const search = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setData(null);
    setSelectedResult(null);
    try {
      const response = await api.get(`/api/public/results?identifier=${encodeURIComponent(identifier.trim())}`);
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
          <button className="btn-ghost" onClick={toggleTheme} aria-label="Toggle colour mode">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <Link className="btn-secondary" to="/login">Institution login</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 lg:py-14">
        <section className="no-print text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Check your result</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-400">
            Enter your Hall Ticket Number or Roll Number. Only results published by your institution
            are available here.
          </p>
        </section>

        <form onSubmit={search} className="no-print card mx-auto mt-8 flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Hall Ticket Number or Roll Number">
              <input
                className="input"
                placeholder="e.g. 2451023 or 21MPC005"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </Field>
          </div>
          <button className="btn-primary sm:w-40" disabled={busy}>
            {busy && <Spinner />} Search
          </button>
        </form>

        {error && (
          <p className="no-print mx-auto mt-4 rounded-xl bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
            {error}
          </p>
        )}

        {data && (
          <>
            {data.previous_results && data.previous_results.length > 0 && (
              <div className="no-print card mt-8 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Previous Results</h3>
                <div className="space-y-2">
                  {data.previous_results.map((r, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedResult(r)}
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
              <article className="card mt-8 overflow-hidden">
                <div className="border-b border-slate-200 p-6 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{data.student.college}</p>
                  <h2 className="mt-1 text-2xl font-extrabold">{data.student.name}</h2>
                  <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <Detail label="Roll Number" value={data.student.roll_number} />
                    <Detail label="Hall Ticket Number" value={data.student.hall_ticket_number} />
                    <Detail label="Course" value={data.student.course} />
                    <Detail label="Section" value={data.student.section} />
                  </dl>
                </div>

                <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-800/60">
                  <p className="font-semibold">{currentResult.exam_name}</p>
                  {currentResult.exam_date && <p className="text-sm text-slate-500 dark:text-slate-400">Exam Date: {formatDate(currentResult.exam_date)}</p>}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
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
                          <td className="td">{subject.passing_marks}</td>
                          {currentResult.status && <td className="td"><StatusBadge status={subject.status} /></td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-4 border-t border-slate-200 p-6 dark:border-slate-800 sm:grid-cols-3">
                  <Summary label="Total Marks" value={`${currentResult.total_marks} / ${currentResult.max_total_marks}`} />
                  {currentResult.percentage !== null && <Summary label="Percentage" value={`${currentResult.percentage}%`} />}
                  {currentResult.status && <Summary label="Result" value={currentResult.status} />}
                  {currentResult.grade && <Summary label="Grade" value={currentResult.grade} />}
                  {currentResult.section_rank && <Summary label="Section Rank" value={`#${currentResult.section_rank}`} />}
                  {currentResult.course_rank && <Summary label="Course Rank" value={`#${currentResult.course_rank}`} />}
                </div>

                <div className="no-print flex flex-wrap gap-2 border-t border-slate-200 p-6 dark:border-slate-800">
                  <button className="btn-secondary" onClick={() => window.print()}>Print</button>
                  <button className="btn-primary" onClick={() => exportMarksheetPdf({ ...data.student, ...currentResult, subjects: data.subjects })}>Download PDF</button>
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
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
    </div>
  );
}
