import React, { useState } from 'react';
import App from './App';
import Dashboard from './dashboard/Dashboard';
import Ask from './dashboard/Ask';
import Story from './dashboard/Story';
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
  const [showStory, setShowStory] = useState(false);
  const [mapQuery, setMapQuery] = useState(null);
  const jumpToMap = (query) => { setMapQuery({ q: query, t: Date.now() }); setView('map'); };
  return (
    <div className="nd-root">
      <div className="nd-nav">
        <span className="nd-brand"><span className="dot" />NEET Intelligence</span>
        <div className="nd-tabs">
          {TABS.map(t => (
            <button key={t.k} className={'nd-tab' + (view === t.k ? ' active' : '')} onClick={() => setView(t.k)}>{t.label}</button>
          ))}
        </div>
        <button className="nd-present-btn" onClick={() => setShowStory(true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          Present
        </button>
        <button className="nd-ask-btn" onClick={() => setShowAsk(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          Ask the data
        </button>
        <span className="nd-tag">Education &amp; Skills Sprint</span>
      </div>
      <div className="nd-content">
        {view === 'map' ? <App initialQuery={mapQuery} /> : <Dashboard view={view} go={setView} jumpToMap={jumpToMap} />}
      </div>
      {showAsk && <Ask onClose={() => setShowAsk(false)} />}
      {showStory && <Story onClose={() => setShowStory(false)} />}
    </div>
  );
}
