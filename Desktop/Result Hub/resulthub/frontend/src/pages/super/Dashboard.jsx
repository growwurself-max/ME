import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext.jsx';
import { Loading, StatCard } from '../../components/ui.jsx';

export default function SuperDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/api/super-admin/stats').then(setStats).catch((e) => toast(e.message, 'error'));
  }, [toast]);

  return (
    <Layout
      title="Platform overview"
      subtitle="Colleges, students and published results across ResultHub"
      actions={<Link to="/admin/colleges" className="btn-primary">Manage colleges</Link>}
    >
      {!stats ? (
        <Loading />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total Colleges" value={stats.total_colleges} />
          <StatCard label="Active Colleges" value={stats.active_colleges} tone="brand" />
          <StatCard label="Disabled Colleges" value={stats.disabled_colleges} tone="rose" />
          <StatCard label="Total Students" value={stats.total_students} tone="slate" />
          <StatCard label="Published Results" value={stats.published_results} tone="amber" />
        </div>
      )}
    </Layout>
  );
}
