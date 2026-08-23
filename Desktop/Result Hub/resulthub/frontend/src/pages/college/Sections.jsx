import { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext.jsx';
import { notifyDataChanged } from '../../lib/realtime';
import { ConfirmDialog, EmptyState, Field, Loading, Modal, Spinner } from '../../components/ui.jsx';

export default function Sections() {
  const toast = useToast();
  const [courses, setCourses] = useState(null);
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState({ course_id: '', name: '' });
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get('/api/college/courses').then((d) => setCourses(d.courses)).catch((e) => toast(e.message, 'error'));
  }, [toast]);
  useEffect(load, [load]);

  const openCreate = (courseId = '') => {
    setForm({ course_id: courseId || courses?.[0]?.id || '', name: '' });
    setEditor({ mode: 'create' });
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (editor.mode === 'create') await api.post('/api/college/sections', form);
      else await api.put(`/api/college/sections/${editor.section.id}`, form);
      toast('Section saved');
      setEditor(null);
      notifyDataChanged({ type: 'college-data' });
      load();
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.del(`/api/college/sections/${confirm.id}`);
      toast('Section deleted');
      setConfirm(null);
      notifyDataChanged({ type: 'college-data' });
      load();
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  };

  const regenerateCode = async (section) => {
    setBusy(true);
    try {
      const result = await api.post(`/api/college/sections/${section.id}/faculty-code`);
      setCourses((prev) => prev.map((course) =>
        course.sections?.some((s) => s.id === section.id)
          ? { ...course, sections: course.sections.map((s) => s.id === section.id ? { ...s, faculty_code: result.faculty_code } : s) }
          : course
      ));
      notifyDataChanged({ type: 'college-data' });
      toast(`Faculty upload code regenerated: ${result.faculty_code}`);
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <Layout
      title="Sections"
      subtitle="Each course can have any number of sections"
      actions={
        <button className="btn-primary" onClick={() => openCreate()} disabled={!courses || courses.length === 0}>
          Add section
        </button>
      }
    >
      {!courses ? (
        <Loading />
      ) : courses.length === 0 ? (
        <div className="card">
          <EmptyState title="Add a course first" description="Sections belong to a course, so configure a course before adding sections." />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {courses.map((course) => (
            <div key={course.id} className="card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{course.name}</h2>
                <button className="btn-secondary" onClick={() => openCreate(course.id)}>Add section</button>
              </div>
              {course.sections.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No sections yet.</p>
              ) : (
                <ul className="row-divider mt-3">
                  {course.sections.map((section) => (
                    <li key={section.id} className="flex items-center justify-between gap-2 py-2">
                      <div>
                        <span className="font-medium">{section.name}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          Faculty upload code:{' '}
                          <span className="font-mono font-semibold tracking-widest">{section.faculty_code || '—'}</span>
                        </span>
                      </div>
                      <span className="flex shrink-0 items-center gap-1">
                        <button className="btn-ghost" disabled={busy} onClick={() => regenerateCode(section)}>Regenerate code</button>
                        <button className="btn-ghost" onClick={() => {
                          setForm({ course_id: course.id, name: section.name });
                          setEditor({ mode: 'edit', section });
                        }}>Rename</button>
                        <button className="btn-ghost text-rose-600" onClick={() => setConfirm(section)}>Delete</button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={Boolean(editor)} title={editor?.mode === 'create' ? 'Add section' : 'Rename section'}
        onClose={() => setEditor(null)}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Course">
            <select className="input" required value={form.course_id}
              onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
              <option value="">Select a course</option>
              {(courses || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Section name">
            <input className="input" required placeholder="Section A" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setEditor(null)}>Cancel</button>
            <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Save section</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(confirm)} title="Delete this section?"
        message={`Students in "${confirm?.name}" and their results will be removed.`}
        confirmLabel="Delete section" busy={busy}
        onCancel={() => setConfirm(null)} onConfirm={remove} />
    </Layout>
  );
}
