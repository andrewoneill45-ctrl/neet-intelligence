import React, { useState } from 'react';
import App from './App';
import Dashboard from './dashboard/Dashboard';
import './dashboard/dashboard.css';

const TABS = [
  { k: 'map', label: 'Map Explorer' },
  { k: 'overview', label: 'Overview' },
  { k: 'geography', label: 'Geography' },
  { k: 'admissions', label: 'Admissions' },
  { k: 'send', label: 'SEND & Disadvantage' },
  { k: 'milburn', label: 'Milburn Lens' },
];

export default function Root() {
  const [view, setView] = useState('overview');
  return (
    <div className="nd-root">
      <div className="nd-nav">
        <span className="nd-brand"><span className="dot" />NEET Intelligence</span>
        <div className="nd-tabs">
          {TABS.map(t => (
            <button key={t.k} className={'nd-tab' + (view === t.k ? ' active' : '')} onClick={() => setView(t.k)}>{t.label}</button>
          ))}
        </div>
        <span className="nd-tag">Education &amp; Skills Sprint</span>
      </div>
      <div className="nd-content">
        {view === 'map' ? <App /> : <Dashboard view={view} go={setView} />}
      </div>
    </div>
  );
}
