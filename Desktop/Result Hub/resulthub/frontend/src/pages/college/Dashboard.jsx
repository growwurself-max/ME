import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext.jsx';
import { Loading, StatCard } from '../../components/ui.jsx';

export default function CollegeDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/api/college/dashboard').then(setStats).catch((e) => toast(e.message, 'error'));
  }, [toast]);

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
          <div className="card mt-6 p-6">
            <h2 className="text-base font-bold">How ResultHub works</h2>
            <ol className="mt-3 grid gap-3 text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-2">
              <li><strong>1. Courses</strong> — configure subjects, maximum marks, passing marks and which calculations to run.</li>
              <li><strong>2. Sections</strong> — add as many sections per course as you need.</li>
              <li><strong>3. Upload</strong> — download the course template, fill it, upload and review validation errors before importing.</li>
              <li><strong>4. Results</strong> — edit marks, recalculate, then publish so students can look them up.</li>
            </ol>
          </div>
        </>
      )}
    </Layout>
  );
}
