import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext.jsx';
import { useDataSync } from '../../lib/realtime';
import { Loading, StatCard } from '../../components/ui.jsx';
import { HelpCard } from '../../components/HelpCenter.jsx';

const PLAN_LABELS = { free: 'Free', basic: 'Basic', premium: 'Premium' };

export default function CollegeDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);

  const loadStats = useCallback(() => {
    api.get('/api/college/dashboard')
      .then(setStats)
      .catch((e) => toast(e.message, 'error'));
  }, [toast]);

  useEffect(() => { loadStats(); }, [loadStats]);

  // The dashboard updates automatically when marks are uploaded, edited or
  // published anywhere (this tab, another tab, or a faculty upload).
  useDataSync(loadStats, { interval: 30000 });

  const sub = stats?.subscription || null;
  const planName = sub ? PLAN_LABELS[sub.plan] || sub.plan : null;
  const progress = sub && sub.limit > 0 ? Math.min(100, (sub.used / sub.limit) * 100) : 0;
  const atLimit = sub && sub.used >= sub.limit;

  return (
    <Layout
      title="Dashboard"
      subtitle="Your students, courses, sections and published results"
      actions={<Link className="btn-primary" to="/college/upload">Upload marks</Link>}
    >
      {!stats ? (
        <Loading />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Students" value={stats.students} tone="slate" />
            <StatCard label="Courses" value={stats.courses} />
            <StatCard label="Sections" value={stats.sections} tone="amber" />
            <StatCard label="Published Results" value={stats.published_results} tone="brand" />
          </div>

          {sub && (
            <div className="card mt-6 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold">Current Plan</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Each published exam or result set counts toward your plan limit.
                  </p>
                </div>
                <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                  {planName}
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight">{sub.used}</span>
                <span className="text-lg font-semibold text-slate-400 dark:text-slate-500">/ {sub.limit}</span>
                <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">published results</span>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${atLimit ? 'bg-amber-500' : 'bg-brand-600'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {atLimit && (
                <p className="mt-3 text-sm font-medium text-amber-600 dark:text-amber-400">
                  Plan limit reached. Publishing is paused — contact the Super Admin to upgrade.
                </p>
              )}
            </div>
          )}

          <div className="card mt-6 p-6">
            <h2 className="text-base font-bold">How ResultHub works</h2>
            <ol className="mt-3 grid gap-3 text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-2">
              <li><strong>1. Courses</strong> — configure subjects, maximum marks, passing marks and which calculations to run.</li>
              <li><strong>2. Sections</strong> — add as many sections per course as you need.</li>
              <li><strong>3. Upload Marks</strong> — upload the complete result for a class, or share subject-wise links so each faculty member submits their own subject's marks.</li>
              <li><strong>4. Results</strong> — review draft marks, correct them, then publish so students can look them up.</li>
            </ol>
          </div>

          <HelpCard
            className="mt-6"
            description="Watch the complete ResultHub walkthrough from start to finish."
            videoLabel="Watch Complete ResultHub Playlist"
          />
        </>
      )}
    </Layout>
  );
}
