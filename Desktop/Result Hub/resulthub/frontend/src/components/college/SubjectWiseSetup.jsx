import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../Layout.jsx';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext.jsx';
import { notifyDataChanged, useDataSync } from '../../lib/realtime';
import { EmptyState, Field, Modal, Spinner, Toggle } from '../ui.jsx';

// Encode the course/section/subject/exam ids into the public share link.
function buildLink(courseId, sectionId, subjectId, examId) {
  const token = btoa(JSON.stringify({ c: courseId, s: sectionId, sub: subjectId, e: examId }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${window.location.origin}/faculty-upload?l=${encodeURIComponent(token)}`;
}

function shareMessage({ exam, course, section, subject, code, link }) {
  return [
    'Subject Marks Upload',
    '',
    `The marks for ${exam.name} have been uploaded for ${course} – ${section}.`,
    '',
    `Please complete the ${subject.name} marks upload using the link below.`,
    '',
    'Upload Link:',
    link,
    '',
    'Faculty Upload Code:',
    code,
    '',
    'Thank you.',
  ].join('\n');
}

export default function SubjectWiseSetup({ onBack }) {
  const toast = useToast();
  const [courses, setCourses] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [exams, setExams] = useState(null);
  const [status, setStatus] = useState(null);
  const [share, setShare] = useState(null);
  const [busy, setBusy] = useState(false);
  const [examModal, setExamModal] = useState(null);
  const [examForm, setExamForm] = useState(null);

  useEffect(() => {
    api.get('/api/college/courses')
      .then((d) => setCourses(d.courses))
      .catch((e) => toast(e.message, 'error'));
  }, [toast]);

  const course = useMemo(
    () => (courses || []).find((c) => c.id === courseId) || null,
    [courses, courseId]
  );
  const sections = course?.sections || [];
  const subjects = course?.subjects || [];

  useEffect(() => {
    if (!courseId) { setExams([]); return; }
    const params = new URLSearchParams();
    params.set('course_id', courseId);
    if (sectionId) params.set('section_id', sectionId);
    api.get(`/api/college/exams?${params.toString()}`)
      .then((d) => setExams(d.exams))
      .catch((e) => toast(e.message, 'error'));
  }, [courseId, sectionId, toast]);

  const loadStatus = async (id, silent = false) => {
    if (!silent) setBusy(true);
    try {
      const data = await api.get(`/api/college/faculty-upload/status?exam_id=${id}`);
      setStatus(data);
    } catch (error) { if (!silent) toast(error.message, 'error'); } finally { if (!silent) setBusy(false); }
  };

  // Poll lightly so uploads arriving from a faculty member on another device
  // appear in the status list without the admin having to refresh.
  const syncStatus = useCallback(() => {
    if (examId) loadStatus(examId, true);
  }, [examId]);
  useDataSync(syncStatus, { interval: 15000 });

  const onSelectCourse = (id) => {
    setCourseId(id);
    setSectionId('');
    setExamId('');
    setSubjectId('');
    setStatus(null);
  };

  const onSelectSection = (id) => {
    setSectionId(id);
    setExamId('');
    setSubjectId('');
    setStatus(null);
  };

  const onSelectExam = (id) => {
    setExamId(id);
    setSubjectId('');
    setStatus(null);
    if (id) loadStatus(id);
  };

  const regenerateCode = async () => {
    if (!status?.section?.id) return;
    setBusy(true);
    try {
      const result = await api.post(`/api/college/sections/${status.section.id}/faculty-code`);
      await loadStatus(examId);
      notifyDataChanged({ type: 'college-data' });
      toast(`Faculty upload code regenerated: ${result.faculty_code}`);
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  };

  const openShare = () => {
    if (!courseId || !sectionId || !examId || !subjectId || !status?.section?.faculty_code) return;
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    setShare({
      subject,
      link: buildLink(courseId, sectionId, subjectId, examId),
      code: status.section.faculty_code,
    });
  };

  // ---- Exam management (Create / Edit / Delete / Publish) -----------------
  const openCreateExam = () => {
    setExamForm({
      name: '',
      type: 'Weekly Test',
      exam_date: '',
      course_id: courseId,
      section_id: sectionId,
      enable_pass_fail: false,
    });
    setExamModal({ mode: 'create' });
  };

  const openEditExam = (exam) => {
    setExamForm({
      name: exam.name,
      type: exam.type,
      exam_date: exam.exam_date,
      course_id: exam.course_id,
      section_id: exam.section_id,
      enable_pass_fail: exam.enable_pass_fail ?? false,
    });
    setExamModal({ mode: 'edit', exam });
  };

  const saveExam = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (examModal.mode === 'create') {
        await api.post('/api/college/exams', examForm);
        toast('Exam created');
      } else {
        await api.put(`/api/college/exams/${examModal.exam.id}`, examForm);
        toast('Exam updated');
      }
      setExamModal(null);
      setCourseId(examForm.course_id);
      setSectionId(examForm.section_id);
      setExamId('');
      setSubjectId('');
      setStatus(null);
      const params = new URLSearchParams();
      params.set('course_id', examForm.course_id);
      if (examForm.section_id) params.set('section_id', examForm.section_id);
      const data = await api.get(`/api/college/exams?${params.toString()}`);
      setExams(data.exams);
      notifyDataChanged({ type: 'college-data' });
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  };

  const deleteExam = async (examIdToDelete) => {
    if (!confirm('Delete this exam? This cannot be undone.')) return;
    setBusy(true);
    try {
      await api.del(`/api/college/exams/${examIdToDelete}`);
      toast('Exam deleted');
      if (examId === examIdToDelete) { setExamId(''); setSubjectId(''); setStatus(null); }
      const params = new URLSearchParams();
      params.set('course_id', courseId);
      if (sectionId) params.set('section_id', sectionId);
      const data = await api.get(`/api/college/exams?${params.toString()}`);
      setExams(data.exams);
      notifyDataChanged({ type: 'college-data' });
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  };

  const publishExam = async (examToPublish, published) => {
    setBusy(true);
    try {
      await api.post('/api/college/exams/publish', { exam_id: examToPublish, published });
      toast(published ? 'Exam published' : 'Exam unpublished');
      notifyDataChanged({ type: published ? 'published' : 'college-data' });
      const params = new URLSearchParams();
      params.set('course_id', courseId);
      if (sectionId) params.set('section_id', sectionId);
      const data = await api.get(`/api/college/exams?${params.toString()}`);
      setExams(data.exams);
      if (examId === examToPublish) loadStatus(examId);
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  };

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label} copied`);
    } catch (error) { toast('Could not copy to clipboard', 'error'); }
  };

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const canShare = Boolean(courseId && sectionId && examId && subjectId && status?.section?.faculty_code);
  const allUploaded = status?.subjects?.length > 0 && status.subjects.every((s) => s.status === 'Uploaded');

  return (
    <Layout
      title="Upload Subject-wise"
      subtitle="Share subject-wise upload links so faculty can submit their own marks"
      actions={<button className="btn-secondary" onClick={onBack}>← Back</button>}
    >
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-200">
        Choose the course, section, exam and subject, then share the link with the faculty member. Faculty can only upload marks for the subject, course, section and exam on their link.
      </div>

      <div className="card mt-4 p-5">
        <div className="grid gap-4 lg:grid-cols-4">
          <Field label="Course">
            <select className="input" value={courseId} onChange={(e) => onSelectCourse(e.target.value)}>
              <option value="">Select a course</option>
              {(courses || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Section">
            <select className="input" value={sectionId} onChange={(e) => onSelectSection(e.target.value)}>
              <option value="">Select a section</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Exam">
            <select className="input" value={examId} onChange={(e) => onSelectExam(e.target.value)}>
              <option value="">Select an exam</option>
              {(exams || []).map((e) => <option key={e.id} value={e.id}>{e.name} · {e.type} · {e.exam_date}</option>)}
            </select>
          </Field>
          <Field label="Subject">
            <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">Select a subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <button className="btn-primary" disabled={!canShare} onClick={openShare}>
            Generate / Share faculty upload link
          </button>
          {subjectId && !status?.section?.faculty_code && (
            <p className="mt-2 text-xs text-amber-600">
              Generate the section's faculty upload code below before sharing links.
            </p>
          )}
        </div>
      </div>

      {status && (
        <div className="mt-4 space-y-4">
          <div className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{status.exam.name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {status.course?.name} · {status.section?.name} · {status.exam.type} · {formatDate(status.exam.exam_date)}
                </p>
                <p className="mt-2 text-sm">
                  Faculty upload code:{' '}
                  <span className="font-mono text-base font-bold tracking-[0.25em]">
                    {status.section?.faculty_code || '—'}
                  </span>
                  <button className="btn-ghost ml-2" disabled={busy} onClick={regenerateCode}>Regenerate</button>
                  {status.section?.faculty_code && (
                    <button className="btn-ghost ml-1" onClick={() => copy(status.section.faculty_code, 'Faculty code')}>Copy</button>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
              <div>
                <h2 className="font-bold">Subject upload status</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Marks are saved as draft until the college reviews and publishes the result.
                </p>
              </div>
              {examId && (
                <Link className="btn-primary" to={`/college/results?course_id=${status.course?.id}&exam_id=${examId}`}>
                  Review Results
                </Link>
              )}
            </div>
            <ul className="row-divider">
              {status.subjects.map((subject) => (
                <li key={subject.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{subject.name}</span>
                    <span className={`badge ${subject.status === 'Uploaded'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {subject.status === 'Uploaded' ? '✓ Uploaded' : 'Pending'}
                    </span>
                    {subject.uploaded_at && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(subject.uploaded_at)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {allUploaded && (
              <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                  <span>All subject marks have been received. Review and publish the final result.</span>
                  <Link className="btn-primary" to={`/college/results?course_id=${status.course?.id}&exam_id=${examId}`}>
                    Review &amp; Publish
                  </Link>
                </div>
              </div>
            )}
            {!status.section?.faculty_code && (
              <div className="p-4">
                <button className="btn-primary" disabled={busy} onClick={regenerateCode}>
                  {busy && <Spinner />} Generate faculty code
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
          <div>
            <h2 className="font-bold">Exams</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {course ? `${course.name}${sectionId ? ` · ${sections.find((s) => s.id === sectionId)?.name}` : ''}` : 'Select a course to filter exams'}
            </p>
          </div>
          <button className="btn-primary" onClick={openCreateExam}>Create Exam</button>
        </div>
        {exams === null ? (
          <p className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading...</p>
        ) : exams.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No exams match this selection"
              description="Create an exam for this course and section, or widen the filters."
            />
          </div>
        ) : (
          <ul className="row-divider">
            {exams.map((exam) => (
              <li key={exam.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div>
                  <p className="font-semibold">{exam.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {exam.type} · {exam.exam_date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${exam.published
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {exam.published ? 'Published' : 'Draft'}
                  </span>
                  <button className="btn-ghost" onClick={() => openEditExam(exam)}>Edit</button>
                  {exam.published ? (
                    <button className="btn-ghost" onClick={() => publishExam(exam.id, false)}>Unpublish</button>
                  ) : (
                    <button className="btn-ghost" onClick={() => publishExam(exam.id, true)}>Publish</button>
                  )}
                  {!exam.published && (
                    <button className="btn-ghost text-slate-600" onClick={() => deleteExam(exam.id)}>Delete</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={Boolean(share)} title="Share subject upload"
        onClose={() => setShare(null)}>
        {share && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/60">
              <p className="font-semibold">{share.subject.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {status?.exam.name} · {status?.course?.name} – {status?.section?.name}
              </p>
              <div className="mt-2 grid gap-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Upload Link</span>
                  <span className="flex items-center gap-2">
                    <span className="max-w-[16rem] truncate font-mono">{share.link}</span>
                    <button className="btn-ghost" onClick={() => copy(share.link, 'Upload link')}>Copy</button>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Faculty Upload Code</span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono font-bold tracking-[0.25em]">{share.code}</span>
                    <button className="btn-ghost" onClick={() => copy(share.code, 'Faculty code')}>Copy</button>
                  </span>
                </div>
              </div>
            </div>

            <Field label="Sharing message" hint="Copy and send this to the faculty member">
              <textarea className="input min-h-[16rem] font-mono text-xs" readOnly
                value={shareMessage({
                  exam: status?.exam,
                  course: status?.course?.name,
                  section: status?.section?.name,
                  subject: share.subject,
                  code: share.code,
                  link: share.link,
                })}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShare(null)}>Close</button>
              <button className="btn-primary" onClick={() => copy(shareMessage({
                exam: status?.exam,
                course: status?.course?.name,
                section: status?.section?.name,
                subject: share.subject,
                code: share.code,
                link: share.link,
              }), 'Message')}>
                Copy message
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(examModal)} title={examModal?.mode === 'create' ? 'Create Exam' : 'Edit Exam'}
        onClose={() => setExamModal(null)}>
        {examForm && (
          <form onSubmit={saveExam} className="space-y-4">
            <Field label="Exam Name">
              <input className="input" required value={examForm.name}
                onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} />
            </Field>
            <Field label="Exam Type">
              <select className="input" required value={examForm.type}
                onChange={(e) => setExamForm({ ...examForm, type: e.target.value })}>
                <option value="Weekly Test">Weekly Test</option>
                <option value="Unit Test">Unit Test</option>
              </select>
            </Field>
            <Field label="Exam Date">
              <input className="input" type="date" required value={examForm.exam_date}
                onChange={(e) => setExamForm({ ...examForm, exam_date: e.target.value })} />
            </Field>
            <Field label="Course">
              <select className="input" required value={examForm.course_id}
                onChange={(e) => setExamForm({ ...examForm, course_id: e.target.value, section_id: '' })}>
                <option value="">Select a course</option>
                {(courses || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Section">
              <select className="input" required value={examForm.section_id}
                onChange={(e) => setExamForm({ ...examForm, section_id: e.target.value })}>
                <option value="">Select a section</option>
                {examForm.course_id && courses?.find(c => c.id === examForm.course_id)?.sections?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Toggle
              label="Enable Pass/Fail Calculation"
              checked={examForm.enable_pass_fail}
              onChange={(v) => setExamForm({ ...examForm, enable_pass_fail: v })}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Turn off for competitive exams (NEET, JEE, EAMCET, CUET, mock tests) where subject-wise pass/fail is not required.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setExamModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Save</button>
            </div>
          </form>
        )}
      </Modal>
    </Layout>
  );
}
