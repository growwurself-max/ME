import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { HelpCenter } from './HelpCenter.jsx';

const SUPER_ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/colleges', label: 'Colleges' },
];

const COLLEGE_NAV = [
  { to: '/college', label: 'Dashboard' },
  { to: '/college/courses', label: 'Courses' },
  { to: '/college/sections', label: 'Sections' },
  { to: '/college/students', label: 'Students' },
  { to: '/college/upload', label: 'Upload Marks' },
  { to: '/college/results', label: 'Results' },
  { to: '/college/settings', label: 'Settings' },
];

export default function Layout({ children, title, subtitle, actions }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const nav = user?.role === 'super_admin' ? SUPER_ADMIN_NAV : COLLEGE_NAV;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen lg:flex">
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-800">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-black text-white">R</span>
          <span className="text-lg font-extrabold tracking-tight">ResultHub</span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/college'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-slate-200 p-3 dark:border-slate-800">
          <p className="truncate px-2 text-sm font-semibold">{user?.name}</p>
          <p className="mb-2 truncate px-2 text-xs text-slate-500 dark:text-slate-400">
            {user?.role === 'super_admin' ? 'Super Admin' : 'College Admin'}
          </p>
          <button className="btn-secondary w-full" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {open && (
        <div className="no-print fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="min-w-0 flex-1">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 lg:px-8">
          <button className="btn-ghost lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">☰</button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold sm:text-lg">{title}</h1>
            {subtitle && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <HelpCenter />
            <button className="btn-ghost" onClick={toggleTheme} aria-label="Toggle colour mode">
              {theme === 'dark' ? '☀' : '☾'}
            </button>
            <Link to="/" className="btn-ghost hidden sm:inline-flex">Student Portal</Link>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
