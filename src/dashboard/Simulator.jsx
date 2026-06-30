import React, { useState } from 'react';
import { COL, fmt0, fmt1, pct } from './charts';

// Illustrative levers. "red" = modelled relative reduction in NEET at full national rollout.
// "costM" = indicative annual cost at full rollout (£m). All adjustable via the rollout sliders.
const LEVERS = [
  { id: 'screen', name: 'Mandatory Year 7 risk screening + mentoring', red: 0.06, costM: 40, ev: 'Early identification with a sustained mentor. Milburn / Section 5.' },
  { id: 'workex', name: 'Work-experience entitlement (4+ employer contacts)', red: 0.12, costM: 90, ev: '4+ employer contacts: 5x less likely to be NEET (Education & Employers, 2014). Modelled conservatively.' },
  { id: 'apprent', name: 'Rebuild apprenticeships and the first rung', red: 0.10, costM: 280, ev: 'Apprenticeships: 10 extra in work per 100 supported (Youth Futures Foundation, 2026).' },
  { id: 'resit', name: 'Reform the post-16 maths and English resit', red: 0.04, costM: 35, ev: 'Only about a third improve on resit (DfE, 2024-25). Stepping-stone routes.' },
  { id: 'vocational', name: 'High-quality vocational pathways at KS4', red: 0.05, costM: 130, ev: 'Tech-award takers have 23% lower unauthorised absence (DfE/Ofqual).' },
  { id: 'admissions', name: 'Open up admissions to the best schools', red: 0.03, costM: 25, ev: 'Spread NEET risk away from the schools that carry most of it (KS4 destinations).' },
];

const RECOMMENDED = { screen: 100, workex: 80, apprent: 60, resit: 100, vocational: 50, admissions: 40 };

export default function Simulator({ data }) {
  const baseRate = data.national.latest.neetnk;
  const cohort = data.national.latest.cohort;
  const baseline = Math.round(cohort * baseRate / 100);
  const [intensity, setIntensity] = useState(Object.fromEntries(LEVERS.map(l => [l.id, 0])));
  const [benefit, setBenefit] = useState(56000);

  const factor = LEVERS.reduce((acc, l) => acc * (1 - l.red * (intensity[l.id] / 100)), 1);
  const modelled = Math.round(baseline * factor);
  const reduced = baseline - modelled;
  const newRate = baseRate * factor;
  const cost = LEVERS.reduce((a, l) => a + l.costM * (intensity[l.id] / 100), 0);
  const lifetimeValue = reduced * benefit;
  const anyOn = Object.values(intensity).some(v => v > 0);

  const set = (id, v) => setIntensity(s => ({ ...s, [id]: v }));
  const apply = (obj) => setIntensity({ ...Object.fromEntries(LEVERS.map(l => [l.id, 0])), ...obj });

  return (
    <div className="nd-page-inner">
      <h1 className="nd-h1">Intervention simulator</h1>
      <p className="nd-sub">Build a package of the Section 5 moves and see the modelled effect on NEET, cost and value. This is an illustrative model for structured discussion, not a forecast: every effect size is an assumption you can dial up or down with the rollout sliders.</p>

      <div className="nd-stats" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="nd-stat"><div className="accent" style={{ background: COL.crimson }} /><div className="v" style={{ color: COL.crimson }}>{fmt0(modelled)}</div><div className="l">Modelled NEET or not known (16-17)</div><div className="s">{pct(newRate)}, from {fmt0(baseline)} ({pct(baseRate)})</div></div>
        <div className="nd-stat"><div className="accent" style={{ background: COL.green }} /><div className="v" style={{ color: COL.green }}>{fmt0(reduced)}</div><div className="l">Young people kept engaged</div><div className="s">{baseline ? pct(reduced / baseline * 100) : '0%'} of the cohort</div></div>
        <div className="nd-stat"><div className="accent" style={{ background: COL.amber }} /><div className="v" style={{ color: COL.amber }}>£{fmt1(cost)}m</div><div className="l">Indicative annual cost</div><div className="s">at the chosen rollout</div></div>
        <div className="nd-stat"><div className="accent" style={{ background: COL.navy }} /><div className="v" style={{ color: COL.navy }}>£{fmt1(lifetimeValue / 1e9)}bn</div><div className="l">Lifetime value of reduction</div><div className="s">at £{fmt0(benefit / 1000)}k per young person</div></div>
      </div>

      <div className="nd-card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
          <span>Modelled NEET cohort</span><span>{fmt0(modelled)} of {fmt0(baseline)}</span>
        </div>
        <div style={{ height: 30, borderRadius: 8, overflow: 'hidden', display: 'flex', background: '#eef2f7' }}>
          <div style={{ width: `${(modelled / baseline) * 100}%`, background: COL.crimson, transition: 'width 0.4s' }} />
          <div style={{ width: `${(reduced / baseline) * 100}%`, background: COL.green, transition: 'width 0.4s', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>{reduced > baseline * 0.06 ? `−${fmt0(reduced)}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.74rem', color: '#475569' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: COL.crimson, borderRadius: 2, marginRight: 5 }} />Still NEET</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: COL.green, borderRadius: 2, marginRight: 5 }} />Moved out of NEET</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '16px 0', flexWrap: 'wrap' }}>
        <button className="nd-chip active" onClick={() => apply(RECOMMENDED)} style={{ cursor: 'pointer' }}>Apply a recommended package</button>
        <button className="nd-chip" onClick={() => apply({})} style={{ cursor: 'pointer' }}>Reset all</button>
      </div>

      <h2 className="nd-h2">The levers</h2>
      {LEVERS.map(l => (
        <div className="nd-card" key={l.id} style={{ marginBottom: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{l.name}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Rollout <b style={{ color: '#0f2440' }}>{intensity[l.id]}%</b> · up to <b style={{ color: COL.green }}>−{fmt0(Math.round(baseline * l.red))}</b> at full</div>
          </div>
          <input type="range" min="0" max="100" step="5" value={intensity[l.id]} onChange={e => set(l.id, parseInt(e.target.value))} style={{ width: '100%', accentColor: '#0f2440', marginTop: 8 }} />
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 4 }}>{l.ev} · indicative full-rollout cost £{l.costM}m/yr</div>
        </div>
      ))}

      <div className="nd-card" style={{ marginTop: 8 }}>
        <div className="nd-card-title">Assumptions</div>
        <div style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, marginBottom: 10 }}>Baseline is the 16-17 NEET or not-known cohort from this dashboard ({fmt0(baseline)}, {pct(baseRate)}, 2025). Effects are applied multiplicatively so overlapping levers do not double-count. Adjust the lifetime value of moving one young person out of NEET:</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>£{fmt0(benefit / 1000)}k per young person</span>
          <input type="range" min="20000" max="120000" step="2000" value={benefit} onChange={e => setBenefit(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#0f2440' }} />
        </div>
        <p className="nd-note">Illustrative only. Effect sizes are modelling assumptions informed by the evidence pack, not departmental estimates. The model is intended to structure the question "what would we have to believe for this to be worth it", not to predict outcomes.</p>
      </div>

      {!anyOn && <p className="nd-note">Move a slider, or apply a recommended package, to see the effect.</p>}
    </div>
  );
}
