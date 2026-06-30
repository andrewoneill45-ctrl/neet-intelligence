import React, { useState, useEffect } from 'react';
import { RankedBars, StatCard, COL, rateColor } from './charts';

export default function ReadyToWork({ go }) {
  const [d, setD] = useState(null);
  const [band, setBand] = useState('17-19');
  const [phase, setPhase] = useState('prepare');
  useEffect(() => { fetch('/evidence_data.json?v=' + Date.now()).then(r => r.json()).then(setD).catch(() => setD(false)); }, []);
  if (d === false) return <div className="nd-page-inner"><div className="nd-card">Could not load the evidence pack.</div></div>;
  if (!d) return <div className="nd-page-inner" style={{ color: '#64748b', paddingTop: 30 }}>Loading evidence pack…</div>;

  const riskBars = d.risk_factors[band].map(r => ({ label: r.f, value: r.ppt, color: rateColor(r.ppt, 20), sub: '+ppt' }));
  const ph = d.phases.find(p => p.key === phase);
  const PHASES = d.phases.map(p => ({ key: p.key, title: p.title, ages: p.ages }));

  return (
    <div className="nd-page-inner">
      <h1 className="nd-h1">Ready to Work: the journey</h1>
      <p className="nd-sub">The sprint evidence pack, organised as the journey it describes: Prepare (11-16), Transition (16-18), Deliver (18-24). Of {d.intro.neet_16_24} NEET young people aged 16-24, {d.intro.without_l3_pct}% ({d.intro.without_l3_count}) have no Level 3 qualification. Start with what drives the risk, then move through the three stages.</p>

      <h2 className="nd-h2">What drives the risk of becoming NEET</h2>
      <div className="nd-card">
        <div className="nd-card-desc">Percentage-point increase in the NEET rate associated with each factor, holding all others constant. Having an EHC plan and persistent absence dominate, which points squarely at the "Prepare" stage.</div>
        <div className="nd-chips">
          <button className={'nd-chip' + (band === '17-19' ? ' active' : '')} onClick={() => setBand('17-19')}>Age 17-19</button>
          <button className={'nd-chip' + (band === '20-24' ? ' active' : '')} onClick={() => setBand('20-24')}>Age 20-24</button>
        </div>
        <RankedBars data={riskBars} unit="" labelWidth={200} max={22} />
        <p className="nd-note">Source: DfE, Risk factors for becoming NEET: a statistical analysis using linked data (2026). Only factors with a statistically significant link are shown.</p>
      </div>

      <h2 className="nd-h2">The three stages</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {PHASES.map((p, i) => (
          <button key={p.key} onClick={() => setPhase(p.key)} style={{
            flex: 1, minWidth: 150, textAlign: 'left', cursor: 'pointer', border: phase === p.key ? '2px solid #0f2440' : '1px solid #e2e8f0',
            background: phase === p.key ? '#0f2440' : '#fff', color: phase === p.key ? '#fff' : '#0f172a', borderRadius: 12, padding: '12px 16px',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: phase === p.key ? '#93b4dd' : '#94a3b8' }}>{i + 1}. Ages {p.ages}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{p.title}</div>
          </button>
        ))}
      </div>

      <div className="nd-card" style={{ marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.55, color: '#1e293b' }}>{ph.blurb}</p>
        {ph.link && <button onClick={() => go(ph.link.view)} style={{ marginTop: 12, background: '#eef2f7', border: 0, borderRadius: 9, padding: '8px 14px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem', color: '#0f2440', cursor: 'pointer' }}>{ph.link.label} →</button>}
      </div>

      <div className="nd-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {ph.cards.map((c, i) => (
          <div className="nd-card" key={i}>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.02em', color: COL.crimson, lineHeight: 1.05 }}>{c.stat}</div>
            <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, margin: '6px 0 8px' }}>{c.label}</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{c.source}</div>
          </div>
        ))}
      </div>

      <p className="nd-note">All figures are from the Ready to Work sprint evidence pack (July 2026); original sources are shown on each card. Use this page as the spine for the discussion and jump to the live data via the links on each stage.</p>
    </div>
  );
}
