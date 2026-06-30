import React, { useState } from 'react';
import { COL, fmt0, fmt1, pct } from './charts';

// Baseline is the 16-24 NEET population (the ultimate target), ONS Q1 2026.
const BASELINE = 1012000;
const BASE_RATE = 13.5;

// "red" = modelled relative reduction in the 16-24 NEET rate at full national rollout (a steady-state assumption).
// phase = where the lever mainly bites. ev = the evidence chain to NEET. costBasis = what the cost is.
const LEVERS = [
  { id: 'tracking', name: 'Improve tracking and ownership (no young person unknown)', phase: 'Across 16-24', red: 0.05, costM: 35,
    ev: 'About 314,000 16-24s are out of work and out of sight. You cannot re-engage who you cannot see, so a shared record plus a named owner moves part of the "not known" group back into support and education. Modelled conservatively. (Moved here from the Geography tab.)',
    costBasis: 'Data-sharing infrastructure and local caseworker capacity; mostly a running cost.' },
  { id: 'attendance', name: 'Tackle persistent absence (attendance support and mentors)', phase: '11-16 flow', red: 0.09, costM: 110,
    ev: 'Persistent absence in KS4 is the second-strongest NEET risk factor (+10ppt; DfE linked-data analysis). Cutting it should feed through to lower NEET via sustained engagement. Upper-bound assumption, since reducing absence is not the same as removing the association.',
    costBasis: 'Attendance mentors, family engagement and catch-up; permanent running cost.' },
  { id: 'screen', name: 'Mandatory Year 7 risk screening + mentoring', phase: '11-16 flow', red: 0.06, costM: 40,
    ev: 'Targets the two strongest early risk factors (an EHC plan is worth +16 to +20ppt, persistent absence +10ppt). Early identification plus a sustained mentor turns "seen late" into "supported early".',
    costBasis: 'Near-zero data cost; the spend is mentor and keyworker time.' },
  { id: 'workex', name: 'Work-experience entitlement (4+ employer contacts)', phase: '11-16 to 16-18', red: 0.12, costM: 90,
    ev: 'Young people with four or more employer contacts are five times less likely to be NEET (Education & Employers, 2014), via confidence, networks and relevance. Modelled conservatively, a placement costs about £60 for roughly £150 of benefit.',
    costBasis: 'Employer brokerage capacity and placement coordination; low unit cost.' },
  { id: 'apprent', name: 'Tilt apprenticeships to young people and rebuild the first rung', phase: '16-18 and 18-24', red: 0.10, costM: 280,
    ev: 'Apprenticeships are the most effective youth employment route (10 extra in work per 100 supported; about £15 back per £1 for a Level 2 at 19-23). Tilting the levy to the young directly converts NEET risk into earning and learning.',
    costBasis: 'Higher youth funding bands plus hiring incentives; about £11k per start.' },
  { id: 'resit', name: 'Reform the post-16 maths and English resit', phase: '16-18', red: 0.04, costM: 35,
    ev: 'Only about a third improve on the resit (38.8% English, 33.3% maths). Repeated failure corrodes motivation and is a known NEET pathway; stepping-stone routes keep progress without the cliff.',
    costBasis: 'Qualification redesign and delivery; modest.' },
  { id: 'vocational', name: 'High-quality vocational pathways at KS4', phase: '11-16 to 16-18', red: 0.05, costM: 130,
    ev: 'Tech-award takers have 23% lower unauthorised absence (DfE/Ofqual), and absence is the second-strongest NEET predictor (+10ppt). So a real, high-quality vocational route at KS4 should lower NEET through engagement, not dilution.',
    costBasis: 'Qualification development and co-delivery with FE colleges (capital and revenue).' },
  { id: 'admissions', name: 'Open up admissions to the best schools', phase: '16-18', red: 0.03, costM: 25,
    ev: 'Selective schools carry almost no NEET risk (0.85% with no sustained destination vs 5.54% in non-selective). Opening access spreads risk towards institutions best able to absorb it.',
    costBasis: 'Admissions reform; low direct cost.' },
];

const RECOMMENDED = { tracking: 80, attendance: 70, screen: 100, workex: 80, apprent: 60, resit: 100, vocational: 50, admissions: 40 };
const PHASE_COLOR = { 'Across 16-24': COL.navy, '11-16 flow': COL.blue, '11-16 to 16-18': COL.blue, '16-18': '#7c3aed', '16-18 and 18-24': COL.green, '18-24': COL.green };

export default function Simulator() {
  const [intensity, setIntensity] = useState(Object.fromEntries(LEVERS.map(l => [l.id, 0])));
  const [benefit, setBenefit] = useState(56000);

  const factor = LEVERS.reduce((acc, l) => acc * (1 - l.red * (intensity[l.id] / 100)), 1);
  const modelled = Math.round(BASELINE * factor);
  const reduced = BASELINE - modelled;
  const newRate = BASE_RATE * factor;
  const cost = LEVERS.reduce((a, l) => a + l.costM * (intensity[l.id] / 100), 0);
  const lifetimeValue = reduced * benefit;
  const anyOn = Object.values(intensity).some(v => v > 0);

  const set = (id, v) => setIntensity(s => ({ ...s, [id]: v }));
  const apply = (obj) => setIntensity({ ...Object.fromEntries(LEVERS.map(l => [l.id, 0])), ...obj });

  return (
    <div className="nd-page-inner">
      <h1 className="nd-h1">Intervention simulator</h1>
      <p className="nd-sub">Build a package of the Section 5 moves and see the modelled effect on the headline target, the 16-24 NEET rate, plus cost and value. This is an illustrative, steady-state model for structured discussion, not a forecast: every effect size is an assumption you can dial with the rollout sliders, and the phase tag shows where each lever mainly bites.</p>

      <div className="nd-stats" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="nd-stat"><div className="accent" style={{ background: COL.crimson }} /><div className="v" style={{ color: COL.crimson }}>{fmt0(modelled)}</div><div className="l">Modelled 16-24 NEET</div><div className="s">{pct(newRate)}, from {fmt0(BASELINE)} ({pct(BASE_RATE)})</div></div>
        <div className="nd-stat"><div className="accent" style={{ background: COL.green }} /><div className="v" style={{ color: COL.green }}>{fmt0(reduced)}</div><div className="l">Young people kept engaged</div><div className="s">{pct(reduced / BASELINE * 100)} of the NEET total</div></div>
        <div className="nd-stat"><div className="accent" style={{ background: COL.amber }} /><div className="v" style={{ color: COL.amber }}>£{fmt1(cost)}m</div><div className="l">Indicative annual cost</div><div className="s">at the chosen rollout</div></div>
        <div className="nd-stat"><div className="accent" style={{ background: COL.navy }} /><div className="v" style={{ color: COL.navy }}>£{fmt1(lifetimeValue / 1e9)}bn</div><div className="l">Lifetime value of reduction</div><div className="s">at £{fmt0(benefit / 1000)}k per young person</div></div>
      </div>

      <div className="nd-card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
          <span>Modelled 16-24 NEET</span><span>{fmt0(modelled)} of {fmt0(BASELINE)}</span>
        </div>
        <div style={{ height: 30, borderRadius: 8, overflow: 'hidden', display: 'flex', background: '#eef2f7' }}>
          <div style={{ width: `${(modelled / BASELINE) * 100}%`, background: COL.crimson, transition: 'width 0.4s' }} />
          <div style={{ width: `${(reduced / BASELINE) * 100}%`, background: COL.green, transition: 'width 0.4s', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>{reduced > BASELINE * 0.05 ? `−${fmt0(reduced)}` : ''}</div>
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
            <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#fff', background: PHASE_COLOR[l.phase] || COL.slate, borderRadius: 99, padding: '2px 8px', whiteSpace: 'nowrap' }}>{l.phase}</span>
              {l.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Rollout <b style={{ color: '#0f2440' }}>{intensity[l.id]}%</b> · up to <b style={{ color: COL.green }}>−{fmt0(Math.round(BASELINE * l.red))}</b> at full</div>
          </div>
          <input type="range" min="0" max="100" step="5" value={intensity[l.id]} onChange={e => set(l.id, parseInt(e.target.value))} style={{ width: '100%', accentColor: '#0f2440', marginTop: 8 }} />
          <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: 4, lineHeight: 1.45 }}><b>Evidence chain:</b> {l.ev}</div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 3, lineHeight: 1.4 }}><b>Cost basis:</b> {l.costBasis} Indicative full rollout £{l.costM}m/yr. Max modelled effect −{fmt1(l.red * 100)}% of the 16-24 NEET rate.</div>
        </div>
      ))}

      <div className="nd-card" style={{ marginTop: 8 }}>
        <div className="nd-card-title">Assumptions</div>
        <div style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, marginBottom: 10 }}>Baseline is the 16-24 NEET population, {fmt0(BASELINE)} ({pct(BASE_RATE)}), ONS Q1 2026, the rate this whole agenda is trying to move. Effects are applied multiplicatively so overlapping levers do not double-count, and they represent the steady state once changes have fed through, the phase tags show where each lever lands first. Adjust the lifetime value of moving one young person out of NEET:</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>£{fmt0(benefit / 1000)}k per young person</span>
          <input type="range" min="20000" max="120000" step="2000" value={benefit} onChange={e => setBenefit(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#0f2440' }} />
        </div>
        <p className="nd-note">Illustrative only. Effect sizes are modelling assumptions informed by the evidence pack, not departmental estimates. Several levers act on the 11-16 flow, so their effect on the 16-24 rate builds over years rather than immediately. The model is intended to structure the question "what would we have to believe for this to be worth it", not to predict outcomes.</p>
      </div>

      {!anyOn && <p className="nd-note">Move a slider, or apply a recommended package, to see the effect.</p>}
    </div>
  );
}
