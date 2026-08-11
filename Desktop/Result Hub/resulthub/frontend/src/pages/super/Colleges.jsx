import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext.jsx';
import { ConfirmDialog, EmptyState, Field, Loading, Modal, Spinner } from '../../components/ui.jsx';

const EMPTY_FORM = {
  name: '',
  principal_name: '',
  email: '',
  phone: '',
  username: '',
  password: '',
  subscription_status: 'active',
  is_active: true,
};

export default function Colleges() {
  const toast = useToast();
  const [colleges, setColleges] = useState(null);
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState(null); // { mode, college }
  const [form, setForm] = useState(EMPTY_FORM);
  const [passwordFor, setPasswordFor] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api
      .get('/api/super-admin/colleges')
      .then((data) => setColleges(data.colleges))
      .catch((e) => toast(e.message, 'error'));
  }, [toast]);

  useEffect(load, [load]);

  const filtered = useMemo(() => {
    if (!colleges) return null;
    const term = search.trim().toLowerCase();
    if (!term) return colleges;
    return colleges.filter((c) =>
      [c.name, c.email, c.username, c.principal_name].some((v) => (v || '').toLowerCase().includes(term))
    );
  }, [colleges, search]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditor({ mode: 'create' });
  };

  const openEdit = (college) => {
    setForm({ ...EMPTY_FORM, ...college, password: '' });
    setEditor({ mode: 'edit', college });
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (editor.mode === 'create') {
        await api.post('/api/super-admin/colleges', form);
        toast('College created');
      } else {
        const { password, id, created_at, ...payload } = form;
        await api.put(`/api/super-admin/colleges/${editor.college.id}`, payload);
        toast('College updated');
      }
      setEditor(null);
      load();
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (college) => {
    try {
      const action = college.is_active ? 'deactivate' : 'activate';
      await api.patch(`/api/super-admin/colleges/${college.id}/${action}`);
      toast(college.is_active ? 'College deactivated' : 'College activated');
      load();
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.patch(`/api/super-admin/colleges/${passwordFor.id}/password`, { password: newPassword });
      toast('Password reset');
      setPasswordFor(null);
      setNewPassword('');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.del(`/api/super-admin/colleges/${confirm.id}`);
      toast('College deleted');
      setConfirm(null);
      load();
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout
      title="College management"
      subtitle="Create accounts, reset passwords, enable or disable access"
      actions={<button className="btn-primary" onClick={openCreate}>Add college</button>}
    >
      <div className="card mb-4 p-4">
        <input
          className="input sm:max-w-sm"
          placeholder="Search by name, email or username"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        {!filtered ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No colleges yet"
            description="Create the first college account to get started. Colleges cannot register themselves."
            action={<button className="btn-primary" onClick={openCreate}>Add college</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="th">College</th>
                  <th className="th">Principal</th>
                  <th className="th">Contact</th>
                  <th className="th">Username</th>
                  <th className="th">Subscription</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="row-divider">
                {filtered.map((college) => (
                  <tr key={college.id}>
                    <td className="td font-semibold">{college.name}</td>
                    <td className="td">{college.principal_name || '—'}</td>
                    <td className="td">
                      <div>{college.email}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{college.phone || '—'}</div>
                    </td>
                    <td className="td font-mono text-xs">{college.username}</td>
                    <td className="td capitalize">{college.subscription_status}</td>
                    <td className="td">
                      <span className={`badge ${college.is_active
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200'}`}>
                        {college.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost" onClick={() => openEdit(college)}>Edit</button>
                        <button className="btn-ghost" onClick={() => setPasswordFor(college)}>Reset password</button>
                        <button className="btn-ghost" onClick={() => toggleActive(college)}>
                          {college.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="btn-ghost text-rose-600" onClick={() => setConfirm(college)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(editor)}
        title={editor?.mode === 'create' ? 'Add college' : 'Edit college'}
        description="These credentials are handed to the college. Colleges have no sign-up page."
        onClose={() => setEditor(null)}
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="College name">
              <input className="input" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Principal name">
              <input className="input" value={form.principal_name || ''}
                onChange={(e) => setForm({ ...form, principal_name: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className="input" type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className="input" value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Username">
              <input className="input" required value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </Field>
            {editor?.mode === 'create' && (
              <Field label="Password" hint="Minimum 6 characters">
                <input className="input" type="text" required minLength={6} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>
            )}
            <Field label="Subscription status">
              <select className="input" value={form.subscription_status}
                onChange={(e) => setForm({ ...form, subscription_status: e.target.value })}>
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </Field>
            <Field label="Account access">
              <select className="input" value={form.is_active ? 'yes' : 'no'}
                onChange={(e) => setForm({ ...form, is_active: e.target.value === 'yes' })}>
                <option value="yes">Active</option>
                <option value="no">Disabled</option>
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setEditor(null)}>Cancel</button>
            <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Save college</button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(passwordFor)}
        title={`Reset password — ${passwordFor?.name || ''}`}
        description="The college will use this new password at the next login."
        onClose={() => setPasswordFor(null)}
      >
        <form onSubmit={resetPassword} className="space-y-4">
          <Field label="New password" hint="Minimum 6 characters">
            <input className="input" required minLength={6} value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setPasswordFor(null)}>Cancel</button>
            <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Reset password</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete this college?"
        message={`All courses, students, marks and results for "${confirm?.name}" will be permanently removed.`}
        confirmLabel="Delete college"
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={remove}
      />
    </Layout>
  );
}
