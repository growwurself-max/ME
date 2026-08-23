import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { Field, PasswordInput, Spinner } from '../components/ui.jsx';

export default function Login() {
  const { user, login, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [busy, setBusy] = useState(false);
  const sessionExpired = new URLSearchParams(window.location.search).get('reason') === 'session-expired';

  if (!loading && user) {
    return <Navigate to={user.role === 'super_admin' ? '/admin' : '/college'} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const account = await login(form.username.trim(), form.password);
      toast(`Welcome back, ${account.name}`);
      navigate(account.role === 'super_admin' ? '/admin' : '/college', { replace: true });
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-brand-700 p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 font-black">R</span>
          <span className="text-xl font-extrabold">ResultHub</span>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold leading-tight">
            Upload marks. Review them.<br />Publish results with confidence.
          </h2>
          <p className="mt-4 max-w-md text-brand-100">
            Configure your own courses, subjects, maximum and passing marks. ResultHub calculates
            totals, percentages, pass/fail and ranks exactly the way you configured them.
          </p>
        </div>
        <p className="text-sm text-brand-200">
          College accounts are created by the platform administrator. There is no public sign-up.
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="card w-full max-w-md p-7">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold">Sign in</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Super Admin and College Admin use this form.
              </p>
              {sessionExpired && (
                <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                  Your session has expired. Please sign in again to continue.
                </p>
              )}
            </div>
            <button type="button" className="btn-ghost" onClick={toggleTheme} aria-label="Toggle colour mode">
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>

          <div className="space-y-4">
            <Field label="Username">
              <input
                className="input"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </Field>
            <Field label="Password">
              <PasswordInput
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </Field>
          </div>

          <button className="btn-primary mt-6 w-full" disabled={busy}>
            {busy && <Spinner />} Sign in
          </button>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Looking for your marks? <Link className="font-semibold text-brand-600" to="/">Student result portal</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
