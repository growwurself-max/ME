import { useState, useEffect } from 'react';
import StudentsManager from '../../components/StudentsManager.jsx';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext.jsx';
import { Field, Modal, Spinner } from '../../components/ui.jsx';

export default function Results() {
  const toast = useToast();
  const [courses, setCourses] = useState(null);
  const [exams, setExams] = useState(null);
  const [examModal, setExamModal] = useState(null);
  const [examForm, setExamForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/api/college/courses')
      .then((d) => setCourses(d.courses))
      .catch((e) => toast(e.message, 'error'));
  }, [toast]);

  const loadExams = async () => {
    try {
      const data = await api.get('/api/college/exams');
      setExams(data.exams);
    } catch (error) { toast(error.message, 'error'); }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const openCreateExam = () => {
    setExamForm({ name: '', type: 'Weekly Test', exam_date: '', course_id: '', section_id: '' });
    setExamModal({ mode: 'create' });
  };

  const openEditExam = (exam) => {
    setExamForm({ name: exam.name, type: exam.type, exam_date: exam.exam_date, course_id: exam.course_id, section_id: exam.section_id });
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
      loadExams();
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  };

  const deleteExam = async (examId) => {
    if (!confirm('Delete this exam? This cannot be undone.')) return;
    setBusy(true);
    try {
      await api.del(`/api/college/exams/${examId}`);
      toast('Exam deleted');
      loadExams();
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  };

  const publishExam = async (examId, published) => {
    setBusy(true);
    try {
      await api.post('/api/college/exams/publish', { exam_id: examId, published });
      toast(published ? 'Exam published' : 'Exam unpublished');
      loadExams();
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Exams</h2>
          <button className="btn-primary" onClick={openCreateExam}>Create Exam</button>
        </div>
        {exams === null ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading...</p>
        ) : exams.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No exams created yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {exams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
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
                    <button className="btn-ghost text-rose-600" onClick={() => deleteExam(exam.id)}>Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <StudentsManager mode="results" />

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
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setExamModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Save</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
