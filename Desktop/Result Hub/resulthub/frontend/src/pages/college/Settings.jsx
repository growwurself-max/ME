import Layout from '../../components/Layout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Loading, Toggle } from '../../components/ui.jsx';

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
      </div>
    </Layout>
  );
}
