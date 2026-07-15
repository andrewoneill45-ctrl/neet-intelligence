import React, { useState, useEffect } from 'react';
import { COL } from './charts';

export default function PolicySolutions({ go }) {
  const [d, setD] = useState(null);
  const [phase, setPhase] = useState(0);
  useEffect(() => { fetch('/policy_solutions.json?v=' + Date.now()).then(r => r.json()).then(setD).catch(() => setD(false)); }, []);
  if (d === false) return <div className="nd-page-inner"><div className="nd-card">Could not load the policy proposals.</div></div>;
  if (!d) return <div className="nd-page-inner" style={{ color: '#64748b', paddingTop: 30 }}>Loading policy solutions…</div>;

  const ph = d.phases[phase];
  const sections = ph.sections || [{ heading: null, items: ph.items }];

  const Cost = ({ cost }) => cost ? (
    <span style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 800, background: cost.startsWith('saves') || cost.startsWith('-') ? '#dcfce7' : '#eef2f7', color: cost.startsWith('saves') || cost.startsWith('-') ? '#166534' : '#0f2440', borderRadius: 99, padding: '2px 10px', marginTop: 6 }}>{cost}</span>
  ) : null;

  return (
    <div className="nd-page-inner">
      <h1 className="nd-h1">Policy solutions</h1>
      <p className="nd-sub">{d.argument}</p>
      <div style={{ background: '#0f2440', color: '#dbe4ef', borderRadius: 12, padding: '12px 16px', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: 18 }}>
        <strong style={{ color: '#fff' }}>Source.</strong> {d.source} <span style={{ color: '#93b4dd' }}>Try these live in the Simulator tab.</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {d.phases.map((p, i) => (
          <button key={p.key} onClick={() => setPhase(i)} style={{
            cursor: 'pointer', border: phase === i ? '2px solid #0f2440' : '1px solid #e2e8f0',
            background: phase === i ? '#0f2440' : '#fff', color: phase === i ? '#fff' : '#0f172a',
            borderRadius: 12, padding: '10px 15px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.9rem',
          }}>{p.label}</button>
        ))}
      </div>

      {ph.problem && (
        <div className="nd-card" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 4 }}>Problem statement</div>
          <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.55, color: '#334155' }}>{ph.problem}</p>
        </div>
      )}

      {sections.map((sec, si) => (
        <div key={si} style={{ marginBottom: 8 }}>
          {sec.heading && <h2 className="nd-h2">{sec.heading}</h2>}
          <div className="nd-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {sec.items.map((it, ii) => (
              <div className="nd-card" key={ii}>
                <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#0f2440' }}>{it.title}</div>
                <p style={{ margin: '6px 0 0', fontSize: '0.86rem', lineHeight: 1.5, color: '#334155' }}>{it.text}</p>
                <Cost cost={it.cost} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <h2 className="nd-h2">Indicative costs (annual, fully rolled out)</h2>
      <div className="nd-card" style={{ padding: '6px 10px' }}>
        <table className="nd-table">
          <thead><tr><th>Proposal</th><th className="num">Estimate</th></tr></thead>
          <tbody>
            {d.costs.map((c, i) => <tr key={i}><td>{c.proposal}</td><td className="num">{c.estimate}</td></tr>)}
            <tr><td style={{ fontWeight: 800 }}>Total costs</td><td className="num" style={{ fontWeight: 800 }}>{d.total_costs}</td></tr>
            {d.revenue_raisers.map((c, i) => <tr key={'r' + i}><td style={{ color: '#166534' }}>{c.proposal} (revenue raiser)</td><td className="num" style={{ color: '#166534' }}>{c.estimate}</td></tr>)}
            <tr><td style={{ fontWeight: 800 }}>Total net costs</td><td className="num" style={{ fontWeight: 800, color: COL.crimson }}>{d.net_costs}</td></tr>
          </tbody>
        </table>
      </div>
      <p className="nd-note">{d.costs_note} Source: draft policy proposals annex. Model these against the 16-24 NEET target in the <span onClick={() => go && go('simulator')} style={{ color: '#1d5a9e', cursor: 'pointer', fontWeight: 700 }}>Simulator</span>.</p>
    </div>
  );
}
