import { useEffect, useRef, useState } from 'react';

// Groww Tech — ResultHub video tutorial playlist.
export const RESULTHUB_PLAYLIST_URL = 'https://youtu.be/tU0FvNMcOIs';

function PlayIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.89l11-6.86a1.05 1.05 0 0 0 0-1.78l-11-6.86A1.05 1.05 0 0 0 8 5.14Z" />
    </svg>
  );
}

function MailIcon({ className = 'h-5 w-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function BookIcon({ className = 'h-5 w-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function QuestionIcon({ className = 'h-5 w-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
    </svg>
  );
}

// Small (?) button in the top navigation. Opens a dropdown with the Help Center
// items: video tutorials, contact support (placeholder) and user guide (placeholder).
export function HelpCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openPlaylist = () => {
    window.open(RESULTHUB_PLAYLIST_URL, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  return (
    <div className="relative no-print" ref={ref}>
      <button
        type="button"
        className="btn-ghost h-9 w-9 rounded-full !px-0 text-base font-bold"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open Help Center"
        aria-expanded={open}
        title="Help Center"
      >
        ?
      </button>

      {open && (
        <div className="card absolute right-0 z-40 mt-2 w-72 overflow-hidden p-2">
          <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Help Center
          </p>
          <button
            type="button"
            onClick={openPlaylist}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-200">
              <PlayIcon />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">Watch Video Tutorials</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Groww Tech ResultHub playlist</span>
            </span>
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-left opacity-60"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <MailIcon />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">Contact Support</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Coming soon</span>
            </span>
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-left opacity-60"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <BookIcon />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">User Guide</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Coming soon</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// Context-aware "Need Help?" card shown on relevant pages.
export function HelpCard({ description, videoLabel = 'Watch Video Tutorials', videoUrl = RESULTHUB_PLAYLIST_URL, className = '' }) {
  return (
    <section className={`card no-print flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center ${className}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-200">
          <QuestionIcon />
        </span>
        <div>
          <h3 className="text-base font-bold">Need Help?</h3>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <a
        className="btn-primary shrink-0"
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <PlayIcon />
        {videoLabel}
      </a>
    </section>
  );
}