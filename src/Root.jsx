import React, { useState, useRef, useEffect } from 'react';
import App from './App';
import Dashboard from './dashboard/Dashboard';
import Ask from './dashboard/Ask';
import Story from './dashboard/Story';
import './dashboard/dashboard.css';

const NAV = [
  { type: 'tab', k: 'overview', label: 'Overview' },
  { type: 'tab', k: 'readytowork', label: 'Ready to Work' },
  { type: 'tab', k: 'solutions', label: 'Policy solutions' },
  { type: 'tab', k: 'simulator', label: 'Simulator' },
  { type: 'group', label: 'Explore', items: [
    { k: 'map', label: 'Map Explorer' },
    { k: 'geography', label: 'Geography' },
  ] },
  { type: 'group', label: 'Analysis', items: [
    { k: 'admissions', label: 'Admissions' },
    { k: 'send', label: 'SEND & Disadvantage' },
    { k: 'qualifications', label: 'Qualifications' },
    { k: 'wwc', label: 'White Working Class' },
    { k: 'international', label: 'International' },
    { k: 'milburn', label: 'Milburn Lens' },
  ] },
];

function NavDropdown({ label, items, view, onPick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const active = items.some(i => i.k === view);
  return (
    <div className="nd-dd" ref={ref}>
      <button className={'nd-tab' + (active ? ' active' : '')} onClick={() => setOpen(o => !o)}>{label}<span style={{ marginLeft: 5, fontSize: '0.7em' }}>▾</span></button>
      {open && (
        <div className="nd-dd-menu">
          {items.map(i => <button key={i.k} className={'nd-dd-item' + (i.k === view ? ' active' : '')} onClick={() => { onPick(i.k); setOpen(false); }}>{i.label}</button>)}
        </div>
      )}
    </div>
  );
}

export default function Root() {
  const [view, setView] = useState('overview');
  const [showAsk, setShowAsk] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mapQuery, setMapQuery] = useState(null);
  const jumpToMap = (query) => { setMapQuery({ q: query, t: Date.now() }); setView('map'); };
  const pick = (k) => { setView(k); setMenuOpen(false); };
  return (
    <div className="nd-root">
      <div className="nd-nav">
        <span className="nd-brand"><span className="dot" />NEET Intelligence</span>
        <div className="nd-tabs nd-tabs-desktop">
          {NAV.map((n, i) => n.type === 'tab'
            ? <button key={i} className={'nd-tab' + (view === n.k ? ' active' : '')} onClick={() => setView(n.k)}>{n.label}</button>
            : <NavDropdown key={i} label={n.label} items={n.items} view={view} onPick={setView} />)}
        </div>
        <button className="nd-present-btn" onClick={() => setShowStory(true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          Present
        </button>
        <button className="nd-ask-btn" onClick={() => setShowAsk(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          Ask the data
        </button>
        <div className="nd-cred">
          <span className="nd-tag" style={{ margin: 0 }}>Education &amp; Skills Sprint</span>
          <span className="nd-cred-by">{"Built by Andrew O'Neill"}</span>
        </div>
        <button className="nd-menu-btn" aria-label="Menu" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 6l12 12M18 6L6 18" /></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>}
        </button>
      </div>
      {menuOpen && (
        <div className="nd-mobile-menu">
          {NAV.map((n, i) => n.type === 'tab'
            ? <button key={i} className={'nd-mob-item' + (view === n.k ? ' active' : '')} onClick={() => pick(n.k)}>{n.label}</button>
            : <React.Fragment key={i}>
                <div className="nd-mob-group">{n.label}</div>
                {n.items.map(it => <button key={it.k} className={'nd-mob-item nd-mob-sub' + (view === it.k ? ' active' : '')} onClick={() => pick(it.k)}>{it.label}</button>)}
              </React.Fragment>)}
          <div className="nd-mob-sep" />
          <button className="nd-mob-item" onClick={() => { setShowStory(true); setMenuOpen(false); }}>▶ Present mode</button>
          <button className="nd-mob-item" onClick={() => { setShowAsk(true); setMenuOpen(false); }}>Ask the data</button>
          <div className="nd-mob-cred">{"Built by Andrew O'Neill"}</div>
        </div>
      )}
      <div className="nd-content">
        {view === 'map' ? <App initialQuery={mapQuery} /> : <Dashboard view={view} go={setView} jumpToMap={jumpToMap} />}
      </div>
      {showAsk && <Ask onClose={() => setShowAsk(false)} />}
      {showStory && <Story onClose={() => setShowStory(false)} />}
    </div>
  );
}
