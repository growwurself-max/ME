import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext.jsx';
import { ConfirmDialog, Loading, Spinner, StatCard, Toggle } from '../../components/ui.jsx';

const COLLECTION_LABELS = {
  courses: 'Courses',
  sections: 'Sections',
  students: 'Students',
  subjects: 'Subjects',
  student_marks: 'Marks',
  exams: 'Exams',
  results: 'Results',
  faculty_uploads: 'Faculty uploads',
};

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [usage, setUsage] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/api/college/storage')
      .then((d) => setUsage(d.usage))
      .catch(() => setUsage(null));
  }, []);

  const clearAllData = async () => {
    setBusy(true);
    try {
      const result = await api.del('/api/college/data');
      toast(`All data cleared — ${result.removed} records removed`);
      setConfirmClear(false);
      setUsage(null);
      api.get('/api/college/storage').then((d) => setUsage(d.usage)).catch(() => {});
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!user) return <Layout title="Settings"><Loading /></Layout>;

  const rows = [
    ['College name', user.name],
    ['Principal', user.principal_name || '—'],
    ['Email', user.email],
    ['Phone', user.phone || '—'],
    ['Username', user.username],
    ['Subscription', user.subscription_status],
    ['Account status', user.is_active ? 'Active' : 'Disabled'],
  ];

  const totalRecords = usage
    ? Object.values(usage).reduce((sum, n) => sum + (n || 0), 0)
    : null;

  return (
    <Layout title="Settings" subtitle="Your institution profile and preferences">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-base font-bold">Institution profile</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Profile details and passwords are managed by the platform administrator.
          </p>
          <dl className="row-divider mt-4">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-2 text-sm">
                <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="font-semibold capitalize">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="text-base font-bold">Appearance</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Choose the mode that is easiest on your eyes. The setting is remembered on this device.
          </p>
          <div className="mt-4">
            <Toggle label="Dark mode" checked={theme === 'dark'} onChange={toggleTheme} />
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">Storage &amp; data</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Keep an eye on how much data your college holds on the free plan. Deleting a course,
                section, exam or student now also removes everything attached to it — no leftover records.
              </p>
            </div>
            {usage && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.entries(usage).map(([key, count]) => (
                  <StatCard key={key} label={COLLECTION_LABELS[key] || key} value={count} tone="slate" />
                ))}
              </div>
            )}
          </div>

          {totalRecords !== null && (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Total records: <span className="font-semibold text-slate-700 dark:text-slate-200">{totalRecords}</span>
            </p>
          )}

          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-900/20">
            <h3 className="text-sm font-bold text-rose-700 dark:text-rose-200">Danger zone</h3>
            <p className="mt-1 text-xs text-rose-600/90 dark:text-rose-300/80">
              Permanently delete all courses, sections, students, marks, results and exams for this college.
              Your account and subscription are kept — you just start with a clean slate.
            </p>
            <button className="btn-danger mt-3" disabled={busy} onClick={() => setConfirmClear(true)}>
              {busy && <Spinner />} Delete all college data
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Delete all college data?"
        message="Every course, section, student, mark, result and exam for this college will be permanently removed. Your account and login stay intact. This cannot be undone."
        confirmLabel="Delete all data"
        busy={busy}
        onCancel={() => setConfirmClear(false)}
        onConfirm={clearAllData}
      />
    </Layout>
  );
}
