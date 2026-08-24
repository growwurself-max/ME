import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from './Layout.jsx';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext.jsx';
import { exportResultsPdf } from '../lib/pdf';
import { notifyDataChanged, useDataSync } from '../lib/realtime';
import { ConfirmDialog, EmptyState, Field, Loading, Modal, Spinner, StatusBadge } from './ui.jsx';

const PLAN_LABELS = { free: 'Free', basic: 'Basic', premium: 'Premium' };

/**
 * Shared student/result table used by both the Students and Results pages.
 * Every edit, add or delete triggers a server-side recalculation of totals,
 * percentage, pass/fail and ranks.
 */
export default function StudentsManager({ mode, help }) {
  const toast = useToast();
  const isResults = mode === 'results';

  const [courses, setCourses] = useState(null);
  const [exams, setExams] = useState(null);
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const [filters, setFilters] = useState({
    course_id: urlParams.get('course_id') || '',
    section_id: '',
    exam_id: urlParams.get('exam_id') || '',
    status: '',
    search: '',
    sort_by: 'rank',
    sort_order: 'desc',
  });
  const [students, setStudents] = useState(null);
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [planLimitOpen, setPlanLimitOpen] = useState(false);
  const [planInfo, setPlanInfo] = useState(null);

  useEffect(() => {
    api.get('/api/college/courses')
      .then((d) => {
        setCourses(d.courses);
        if (d.courses.length) setFilters((f) => ({ ...f, course_id: f.course_id || d.courses[0].id }));
      })
      .catch((e) => toast(e.message, 'error'));
  }, [toast]);

  useEffect(() => {
    if (filters.course_id) {
      api.get(`/api/college/exams?course_id=${filters.course_id}`)
        .then((d) => setExams(d.exams))
        .catch((e) => toast(e.message, 'error'));
    } else {
      setExams([]);
    }
  }, [filters.course_id, toast]);

  const course = useMemo(
    () => (courses || []).find((c) => c.id === filters.course_id) || null,
    [courses, filters.course_id]
  );

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.course_id) params.set('course_id', filters.course_id);
    if (filters.section_id) params.set('section_id', filters.section_id);
    if (filters.exam_id) params.set('exam_id', filters.exam_id);
    if (filters.status) params.set('status', filters.status);
    if (filters.search.trim()) params.set('search', filters.search.trim());
    if (filters.sort_by) params.set('sort_by', filters.sort_by);
    if (filters.sort_order) params.set('sort_order', filters.sort_order);
    return params.toString();
  }, [filters]);

  const load = useCallback((silent = false) => {
    if (!filters.course_id) return;
    if (!silent) setStudents(null);
    api.get(`/api/college/students?${query}`)
      .then((d) => setStudents(d.students))
      .catch((e) => toast(e.message, 'error'));
  }, [filters.course_id, query, toast]);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  // Refresh automatically when marks are edited/published in this tab, in
  // another tab, or by a faculty upload that landed while the page was open.
  useDataSync(() => {
    load(true);
    if (isResults) loadSubscription();
  }, { interval: isResults ? 30000 : 0 });

  const loadSubscription = useCallback(() => {
    if (!isResults) return;
    api.get('/api/college/subscription')
      .then((d) => setSubscription(d))
      .catch(() => {});
  }, [isResults]);

  useEffect(() => {
    if (isResults) loadSubscription();
  }, [isResults, loadSubscription]);

  const atLimit = Boolean(subscription && subscription.used >= subscription.limit);

  const openAdd = () => {
    if (!course || course.sections.length === 0) {
      toast('Add a section to this course first', 'error');
      return;
    }
    setForm({
      course_id: course.id,
      section_id: filters.section_id || course.sections[0].id,
      hall_ticket_number: '', name: '',
      marks: Object.fromEntries(course.subjects.map((s) => [s.id, ''])),
    });
    setEditor({ mode: 'create' });
  };

  const openEdit = (student) => {
    setForm({
      course_id: student.course_id,
      section_id: student.section_id,
      hall_ticket_number: student.hall_ticket_number,
      name: student.name,
      marks: Object.fromEntries((course?.subjects || []).map((s) => [s.id, student.marks[s.id] ?? ''])),
    });
    setEditor({ mode: 'edit', student });
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        marks: Object.fromEntries(Object.entries(form.marks).map(([k, v]) => [k, Number(v)])),
      };
      if (editor.mode === 'create') await api.post('/api/college/students', payload);
      else await api.put(`/api/college/students/${editor.student.id}`, payload);
      toast('Saved — totals, percentage and ranks recalculated');
      setEditor(null);
      notifyDataChanged({ type: 'college-data' });
      load();
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.del(`/api/college/students/${confirm.id}`);
      toast('Student deleted — ranks recalculated');
      setConfirm(null);
      notifyDataChanged({ type: 'college-data' });
      load();
    } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
  };

  const recalculate = async () => {
    try {
      await api.post('/api/college/results/recalculate', { course_id: filters.course_id });
      toast('Recalculated');
      notifyDataChanged({ type: 'college-data' });
      load();
    } catch (error) { toast(error.message, 'error'); }
  };

  const setPublished = async (published) => {
    if (published && atLimit && subscription) {
      setPlanInfo({ plan: subscription.plan, limit: subscription.limit, used: subscription.used });
      setPlanLimitOpen(true);
      return;
    }
    try {
      if (filters.exam_id) {
        await api.post('/api/college/exams/publish', {
          exam_id: filters.exam_id,
          published,
        });
      } else {
        await api.post('/api/college/results/publish', {
          course_id: filters.course_id,
          section_id: filters.section_id || null,
          published,
        });
      }
      toast(published ? 'Results published' : 'Results unpublished');
      notifyDataChanged({ type: published ? 'published' : 'college-data' });
      load();
      loadSubscription();
    } catch (error) {
      if (error.code === 'PLAN_LIMIT_REACHED') {
        setPlanInfo(error.details || { plan: subscription?.plan, limit: subscription?.limit, used: subscription?.used });
        setPlanLimitOpen(true);
      } else {
        toast(error.message, 'error');
      }
    }
  };

  const exportExcel = async () => {
    try { await api.download(`/api/college/results/export/excel?${query}`, 'results.xlsx'); }
    catch (error) { toast(error.message, 'error'); }
  };

  const exportPdf = async () => {
    try {
      const data = await api.get(`/api/college/results/export/data?${query}`);
      exportResultsPdf(data);
    } catch (error) { toast(error.message, 'error'); }
  };

  const subjects = course?.subjects || [];

  // For exams the pass/fail display follows the exam's own toggle, falling
  // back to the course rule for legacy exams.
  const selectedExam = isResults && filters.exam_id
    ? (exams || []).find((e) => e.id === filters.exam_id)
    : null;
  const enablePassFail = selectedExam
    ? (selectedExam.enable_pass_fail !== undefined ? Boolean(selectedExam.enable_pass_fail) : Boolean(course?.enable_pass_fail))
    : Boolean(course?.enable_pass_fail);

  return (
    <Layout
      title={isResults ? 'Results' : 'Students'}
      subtitle={isResults
        ? 'Review, correct and publish calculated results'
        : 'Add, edit or remove students and their marks'}
      actions={<button className="btn-primary" onClick={openAdd}>Add student</button>}
    >
      {help}
      <div className="card mb-4 grid gap-3 p-4 lg:grid-cols-6">
        <Field label="Course">
          <select className="input" value={filters.course_id}
            onChange={(e) => setFilters({ ...filters, course_id: e.target.value, section_id: '', exam_id: '' })}>
            {(courses || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Section">
          <select className="input" value={filters.section_id}
            onChange={(e) => setFilters({ ...filters, section_id: e.target.value, exam_id: '' })}>
            <option value="">All sections</option>
            {(course?.sections || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        {isResults && (
          <Field label="Exam">
            <select className="input" value={filters.exam_id}
              onChange={(e) => setFilters({ ...filters, exam_id: e.target.value })}>
              <option value="">All results</option>
              {(exams || []).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Sort By">
          <select className="input" value={filters.sort_by}
            onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}>
            <option value="rank">Rank</option>
            <option value="hall_ticket_number">Hall Ticket Number</option>
            <option value="total_marks">Total Marks</option>
            <option value="percentage">Percentage</option>
            <option value="name">Student Name</option>
          </select>
        </Field>
        <Field label="Order">
          <select className="input" value={filters.sort_order}
            onChange={(e) => setFilters({ ...filters, sort_order: e.target.value })}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </Field>
        <Field label="Search">
          <input className="input" placeholder="Hall ticket number or name"
            value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        </Field>
      </div>

      {isResults && (
        <div className="card mb-4 flex flex-wrap gap-2 p-4">
          {subscription && (
            <span className={`badge self-center ${atLimit
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
              {PLAN_LABELS[subscription.plan] || 'Free'} plan · {subscription.used}/{subscription.limit} published
            </span>
          )}
          <button className="btn-secondary" onClick={recalculate}>Recalculate</button>
          <button className="btn-primary" disabled={atLimit} title={atLimit ? 'Plan limit reached — contact the Super Admin to publish more' : undefined}
            onClick={() => setPublished(true)}>Publish results</button>
          <button className="btn-secondary" onClick={() => setPublished(false)}>Unpublish</button>
          <span className="flex-1" />
          <button className="btn-secondary" onClick={exportExcel}>Export Excel</button>
          <button className="btn-secondary" onClick={exportPdf}>Export PDF</button>
        </div>
      )}

      <div className="card overflow-hidden">
        {!students ? (
          <Loading />
        ) : students.length === 0 ? (
          <EmptyState title="No students match these filters"
            description="Upload an Excel sheet for this course and section, or add a student manually." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="th">Hall Ticket</th>
                  <th className="th">Name</th>
                  <th className="th">Section</th>
                  {subjects.map((s) => <th key={s.id} className="th">{s.name}</th>)}
                  <th className="th">Total</th>
                  {course?.enable_percentage && <th className="th">%</th>}
                  {enablePassFail && <th className="th">Result</th>}
                  {course?.enable_grade && <th className="th">Grade</th>}
                  {course?.enable_ranking && <th className="th">Sec Rank</th>}
                  {course?.enable_ranking && <th className="th">Course Rank</th>}
                  <th className="th">Published</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="row-divider">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="td font-mono text-xs">{student.hall_ticket_number}</td>
                    <td className="td font-semibold">{student.name}</td>
                    <td className="td">{student.section_name}</td>
                    {subjects.map((s) => <td key={s.id} className="td">{student.marks[s.id] ?? '—'}</td>)}
                    <td className="td font-semibold">{student.total_marks ?? '—'}</td>
                    {course?.enable_percentage && <td className="td">{student.percentage ?? '—'}</td>}
                    {enablePassFail && <td className="td"><StatusBadge status={student.status} /></td>}
                    {course?.enable_grade && <td className="td">{student.grade ?? '—'}</td>}
                    {course?.enable_ranking && <td className="td">{student.section_rank ?? '—'}</td>}
                    {course?.enable_ranking && <td className="td">{student.course_rank ?? '—'}</td>}
                    <td className="td">
                      <span className={`badge ${student.published
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {student.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost" onClick={() => openEdit(student)}>Edit</button>
                        <button className="btn-ghost text-slate-600" onClick={() => setConfirm(student)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={Boolean(editor)} wide
        title={editor?.mode === 'create' ? 'Add student' : `Edit ${editor?.student?.name || 'student'}`}
        description="Saving recalculates total, percentage, pass/fail and ranks immediately."
        onClose={() => setEditor(null)}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Hall ticket number">
                <input className="input" required value={form.hall_ticket_number}
                  onChange={(e) => setForm({ ...form, hall_ticket_number: e.target.value })} />
              </Field>
              <Field label="Student name">
                <input className="input" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Section">
                <select className="input" required value={form.section_id}
                  onChange={(e) => setForm({ ...form, section_id: e.target.value })}>
                  {(course?.sections || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
            </div>
            <div>
              <p className="label">Subject marks</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {subjects.map((subject) => (
                  <Field key={subject.id} label={`${subject.name} (max ${Number(subject.max_marks)})`}>
                    <input className="input" type="number" min="0" max={Number(subject.max_marks)} required
                      value={form.marks[subject.id] ?? ''}
                      onChange={(e) => setForm({ ...form, marks: { ...form.marks, [subject.id]: e.target.value } })} />
                  </Field>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setEditor(null)}>Cancel</button>
              <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Save &amp; recalculate</button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog open={Boolean(confirm)} title="Delete this student?"
        message={`"${confirm?.name}" and their marks will be removed, and ranks recalculated.`}
        confirmLabel="Delete student" busy={busy}
        onCancel={() => setConfirm(null)} onConfirm={remove} />

      <Modal
        open={planLimitOpen}
        title="Plan Limit Reached"
        description="You have reached the maximum number of published results allowed under your current plan."
        onClose={() => setPlanLimitOpen(false)}
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <div className="flex justify-between py-1">
              <span className="font-medium">Current Plan</span>
              <span className="font-bold capitalize">{PLAN_LABELS[planInfo?.plan] || 'Free'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-medium">Published</span>
              <span className="font-bold">{planInfo?.used ?? 0} / {planInfo?.limit ?? 0}</span>
            </div>
          </div>
          <p>Your data is safe. You can continue creating exams, uploading marks, editing drafts and reviewing results.</p>
          <p>To publish more results, please upgrade your subscription or contact the Super Admin.</p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-primary" onClick={() => setPlanLimitOpen(false)}>Contact Super Admin</button>
        </div>
      </Modal>
    </Layout>
  );
}
