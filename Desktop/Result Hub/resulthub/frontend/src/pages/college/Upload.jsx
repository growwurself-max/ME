import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext.jsx';
import { Field, Loading, Spinner } from '../../components/ui.jsx';

export default function Upload() {
  const toast = useToast();
  const [courses, setCourses] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [examName, setExamName] = useState('');
  const [examType, setExamType] = useState('Weekly Test');
  const [examDate, setExamDate] = useState('');

  useEffect(() => {
    api.get('/api/college/courses')
      .then((d) => {
        setCourses(d.courses);
        if (d.courses.length) setCourseId(d.courses[0].id);
      })
      .catch((e) => toast(e.message, 'error'));
  }, [toast]);

  const course = useMemo(() => (courses || []).find((c) => c.id === courseId) || null, [courses, courseId]);

  useEffect(() => {
    setSectionId(course?.sections?.[0]?.id || '');
    setPreview(null);
  }, [course]);

  const downloadTemplate = async () => {
    try {
      await api.download(`/api/college/upload/template?course_id=${courseId}`, 'template.xlsx');
      toast('Template downloaded');
    } catch (error) { toast(error.message, 'error'); }
  };

  const runPreview = async (event) => {
    event.preventDefault();
    if (!file) return toast('Choose an Excel file first', 'error');
    setBusy(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('course_id', courseId);
      data.append('section_id', sectionId);
      const result = await api.upload('/api/college/upload/preview', data);
      setPreview(result);
      toast(`${result.summary.valid} valid rows, ${result.summary.invalid} issues`, result.summary.invalid ? 'info' : 'success');
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  };

  const commit = async () => {
    setBusy(true);
    try {
      const payload = {
        course_id: courseId,
        section_id: sectionId,
        rows: preview.rows,
      };
      if (examName && examType && examDate) {
        payload.exam_name = examName;
        payload.exam_type = examType;
        payload.exam_date = examDate;
      }
      const result = await api.post('/api/college/upload/commit', payload);
      toast(`${result.imported} students imported and results calculated`);
      setPreview(null);
      setFile(null);
      setExamName('');
      setExamType('Weekly Test');
      setExamDate('');
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  };

  if (!courses) return <Layout title="Upload"><Loading /></Layout>;

  return (
    <Layout title="Upload marks" subtitle="Download the course template, fill it, then validate before importing">
      <div className="card p-5">
        <form onSubmit={runPreview} className="grid gap-4 lg:grid-cols-4">
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
          <Field label="Excel file (.xlsx)">
            <input className="input" type="file" accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </Field>
          <div className="flex items-end gap-2">
            <button type="button" className="btn-secondary" onClick={downloadTemplate} disabled={!courseId}>
              Download template
            </button>
            <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Validate</button>
          </div>
        </form>
        
        <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 dark:border-slate-800 lg:grid-cols-3">
          <Field label="Exam Name (optional)">
            <input className="input" placeholder="e.g. Weekly Test 01"
              value={examName} onChange={(e) => setExamName(e.target.value)} />
          </Field>
          <Field label="Exam Type (optional)">
            <select className="input" value={examType} onChange={(e) => setExamType(e.target.value)}>
              <option value="Weekly Test">Weekly Test</option>
              <option value="Unit Test">Unit Test</option>
            </select>
          </Field>
          <Field label="Exam Date (optional)">
            <input className="input" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </Field>
        </div>
        {course && (
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Template columns: Roll Number, Hall Ticket Number, Student Name, Section,
            {' '}{course.subjects.map((s) => s.name).join(', ')}
          </p>
        )}
      </div>

      {preview && (
        <>
          {preview.errors.length > 0 && (
            <div className="card mt-4 overflow-hidden">
              <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                <h2 className="font-bold text-rose-600">{preview.errors.length} validation issues</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  These rows will not be imported. Fix the file and validate again to include them.
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
                        <td className="td">{error.field}</td>
                        <td className="td text-rose-600">{error.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card mt-4 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
              <div>
                <h2 className="font-bold">Preview — {preview.rows.length} valid rows</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {preview.course.name} · {preview.section.name}
                </p>
              </div>
              <button className="btn-primary" onClick={commit} disabled={busy || preview.rows.length === 0}>
                {busy && <Spinner />} Confirm import
              </button>
            </div>
            <div className="max-h-96 overflow-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/60">
                  <tr>
                    <th className="th">Row</th><th className="th">Roll No</th><th className="th">Hall Ticket</th>
                    <th className="th">Name</th><th className="th">Section</th>
                    {preview.subjects.map((s) => <th key={s.id} className="th">{s.name}</th>)}
                  </tr>
                </thead>
                <tbody className="row-divider">
                  {preview.rows.map((row) => (
                    <tr key={row.row}>
                      <td className="td">{row.row}</td>
                      <td className="td font-mono text-xs">{row.roll_number}</td>
                      <td className="td font-mono text-xs">{row.hall_ticket_number}</td>
                      <td className="td font-semibold">{row.name}</td>
                      <td className="td">{row.section_name}</td>
                      {preview.subjects.map((s) => <td key={s.id} className="td">{row.marks[s.id]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
