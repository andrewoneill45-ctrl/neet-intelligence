import React, { useState } from 'react';
import App from './App';
import Dashboard from './dashboard/Dashboard';
import Ask from './dashboard/Ask';
import './dashboard/dashboard.css';

const TABS = [
  { k: 'map', label: 'Map Explorer' },
  { k: 'overview', label: 'Overview' },
  { k: 'geography', label: 'Geography' },
  { k: 'admissions', label: 'Admissions' },
  { k: 'send', label: 'SEND & Disadvantage' },
  { k: 'qualifications', label: 'Qualifications' },
  { k: 'milburn', label: 'Milburn Lens' },
];

export default function Root() {
  const [view, setView] = useState('overview');
  const [showAsk, setShowAsk] = useState(false);
  return (
    <div className="nd-root">
      <div className="nd-nav">
        <span className="nd-brand"><span className="dot" />NEET Intelligence</span>
        <div className="nd-tabs">
          {TABS.map(t => (
            <button key={t.k} className={'nd-tab' + (view === t.k ? ' active' : '')} onClick={() => setView(t.k)}>{t.label}</button>
          ))}
        </div>
        <button className="nd-ask-btn" onClick={() => setShowAsk(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          Ask the data
        </button>
        <span className="nd-tag">Education &amp; Skills Sprint</span>
      </div>
      <div className="nd-content">
        {view === 'map' ? <App /> : <Dashboard view={view} go={setView} />}
      </div>
      {showAsk && <Ask onClose={() => setShowAsk(false)} />}
    </div>
  );
}
