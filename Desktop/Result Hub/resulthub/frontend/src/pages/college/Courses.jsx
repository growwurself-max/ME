import { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext.jsx';
import { notifyDataChanged } from '../../lib/realtime';
import { ConfirmDialog, EmptyState, Field, Loading, Modal, Spinner, Toggle } from '../../components/ui.jsx';

const EMPTY = {
  name: '',
  enable_percentage: true,
  enable_ranking: true,
  enable_pass_fail: true,
  enable_grade: false,
  subjects: [{ name: '', max_marks: 100, passing_marks: '' }],
};

export default function Courses() {
  const toast = useToast();
  const [courses, setCourses] = useState(null);
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get('/api/college/courses').then((d) => setCourses(d.courses)).catch((e) => toast(e.message, 'error'));
  }, [toast]);
  useEffect(load, [load]);

  const openCreate = () => { setForm(EMPTY); setEditor({ mode: 'create' }); };
  const openEdit = (course) => {
    setForm({
      name: course.name,
      enable_percentage: course.enable_percentage,
      enable_ranking: course.enable_ranking,
      enable_pass_fail: course.enable_pass_fail,
      enable_grade: course.enable_grade,
      subjects: course.subjects.map((s) => ({
        id: s.id, name: s.name, max_marks: Number(s.max_marks),
        passing_marks: s.passing_marks == null || s.passing_marks === '' ? '' : Number(s.passing_marks),
      })),
    });
    setEditor({ mode: 'edit', course });
  };

  const setSubject = (index, patch) =>
    setForm((f) => ({ ...f, subjects: f.subjects.map((s, i) => (i === index ? { ...s, ...patch } : s)) }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        subjects: form.subjects.map((s, i) => ({ ...s, position: i })),
      };
      if (editor.mode === 'create') await api.post('/api/college/courses', payload);
      else await api.put(`/api/college/courses/${editor.course.id}`, payload);
      toast(editor.mode === 'create' ? 'Course created' : 'Course updated — results recalculated');
      setEditor(null);
      notifyDataChanged({ type: 'college-data' });
      load();
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.del(`/api/college/courses/${confirm.id}`);
      toast('Course deleted');
      setConfirm(null);
      notifyDataChanged({ type: 'college-data' });
      load();
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <Layout
      title="Courses"
      subtitle="Every course defines its own subjects, marks and calculation rules"
      actions={<button className="btn-primary" onClick={openCreate}>Add course</button>}
    >
      {!courses ? (
        <Loading />
      ) : courses.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No courses configured"
            description="Create a course such as MPC or BiPC, then list its subjects with maximum and passing marks."
            action={<button className="btn-primary" onClick={openCreate}>Add course</button>}
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {courses.map((course) => (
            <div key={course.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{course.name}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {course.subjects.length} subjects · {course.sections.length} sections
                  </p>
                </div>
                <div className="flex gap-1">
                  <button className="btn-ghost" onClick={() => openEdit(course)}>Edit</button>
                  <button className="btn-ghost text-rose-600" onClick={() => setConfirm(course)}>Delete</button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {[
                  ['Percentage', course.enable_percentage],
                  ['Ranking', course.enable_ranking],
                  ['Pass / Fail', course.enable_pass_fail],
                  ['Grade', course.enable_grade],
                ].map(([label, on]) => (
                  <span key={label} className={`badge ${on
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {label}: {on ? 'On' : 'Off'}
                  </span>
                ))}
              </div>

              <table className="mt-4 w-full">
                <thead>
                  <tr>
                    <th className="th px-0">Subject</th>
                    <th className="th">Max</th>
                    <th className="th">Pass</th>
                  </tr>
                </thead>
                <tbody className="row-divider">
                  {course.subjects.map((s) => (
                    <tr key={s.id}>
                      <td className="td px-0 font-medium">{s.name}</td>
                      <td className="td">{Number(s.max_marks)}</td>
                      <td className="td">{s.passing_marks == null || s.passing_marks === '' ? '—' : Number(s.passing_marks)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editor)}
        wide
        title={editor?.mode === 'create' ? 'Add course' : `Edit ${editor?.course?.name || 'course'}`}
        description="Nothing is hardcoded — these settings drive every calculation for this course."
        onClose={() => setEditor(null)}
      >
        <form onSubmit={save} className="space-y-5">
          <Field label="Course name">
            <input className="input" required placeholder="MPC" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>

          <div>
            <p className="label">Subjects</p>
            <div className="space-y-2">
              {form.subjects.map((subject, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr,7rem,7rem,auto]">
                  <input className="input" required placeholder="Subject name" value={subject.name}
                    onChange={(e) => setSubject(index, { name: e.target.value })} />
                  <input className="input" required type="number" min="1" placeholder="Max"
                    value={subject.max_marks} onChange={(e) => setSubject(index, { max_marks: e.target.value })} />
                  <input className="input" type="number" min="0" placeholder="Optional"
                    value={subject.passing_marks} onChange={(e) => setSubject(index, { passing_marks: e.target.value })} />
                  <button type="button" className="btn-ghost text-rose-600"
                    onClick={() => setForm({ ...form, subjects: form.subjects.filter((_, i) => i !== index) })}
                    disabled={form.subjects.length === 1}>Remove</button>
                </div>
              ))}
            </div>
            <button type="button" className="btn-secondary mt-2"
              onClick={() => setForm({ ...form, subjects: [...form.subjects, { name: '', max_marks: 100, passing_marks: '' }] })}>
              Add subject
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle label="Enable percentage" checked={form.enable_percentage}
              onChange={(v) => setForm({ ...form, enable_percentage: v })} />
            <Toggle label="Enable ranking" checked={form.enable_ranking}
              onChange={(v) => setForm({ ...form, enable_ranking: v })} />
            <Toggle label="Enable pass / fail" checked={form.enable_pass_fail}
              onChange={(v) => setForm({ ...form, enable_pass_fail: v })} />
            <Toggle label="Enable grade" checked={form.enable_grade}
              onChange={(v) => setForm({ ...form, enable_grade: v })} />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setEditor(null)}>Cancel</button>
            <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Save course</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete this course?"
        message={`Sections, students, marks and results for "${confirm?.name}" will be removed.`}
        confirmLabel="Delete course"
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={remove}
      />
    </Layout>
  );
}
