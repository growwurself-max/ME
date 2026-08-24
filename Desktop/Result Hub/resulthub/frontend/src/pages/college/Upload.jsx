import { useState } from 'react';
import Layout from '../../components/Layout.jsx';
import AllSubjectsImport from '../../components/college/AllSubjectsImport.jsx';
import SubjectWiseSetup from '../../components/college/SubjectWiseSetup.jsx';
import { HelpCard } from '../../components/HelpCenter.jsx';

function ChoiceCard({ icon, title, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col rounded-2xl border p-6 text-left transition ${active
        ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'}`}
    >
      <span className="text-3xl">{icon}</span>
      <span className="mt-3 text-lg font-bold">{title}</span>
      <span className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</span>
      <span className={`mt-4 inline-flex w-fit items-center gap-1 text-sm font-semibold ${active
        ? 'text-brand-700 dark:text-brand-200'
        : 'text-brand-600'}`}>
        {active ? '● Continue' : 'Choose'}
      </span>
    </button>
  );
}

export default function Upload() {
  const [mode, setMode] = useState(null);

  if (mode === 'all') return <AllSubjectsImport onBack={() => setMode(null)} />;
  if (mode === 'subject') return <SubjectWiseSetup onBack={() => setMode(null)} />;

  return (
    <Layout
      title="Upload Marks"
      subtitle="Choose how you want to upload marks"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-1 text-base font-bold">Choose Upload Type</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Upload the complete result for a class, or let each subject teacher submit their own subject's marks.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <ChoiceCard
            icon="📄"
            title="Upload All Subjects"
            description="Import the complete student result for a course, section and exam in one Excel file or paste."
            active={mode === 'all'}
            onClick={() => setMode('all')}
          />
          <ChoiceCard
            icon="📚"
            title="Upload Subject-wise"
            description="Share links so each faculty member uploads marks for one subject only. Review everything before publishing."
            active={mode === 'subject'}
            onClick={() => setMode('subject')}
          />
        </div>
        <HelpCard
          className="mt-6"
          description="Follow a short walkthrough of uploading and importing marks."
          videoLabel="Watch Upload Marks Tutorial"
        />
      </div>
    </Layout>
  );
}