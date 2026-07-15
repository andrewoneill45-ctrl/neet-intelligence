import React, { useState } from 'react';
import { COL, fmt0, fmt1, pct } from './charts';

// Baseline is the 16-24 NEET population (the target), ONS Q1 2026.
const BASELINE = 1012000;
const BASE_RATE = 13.5;

const money = (m) => { const a = Math.abs(m), s = m < 0 ? '-' : ''; return a >= 1000 ? s + '£' + (Math.round(a / 100) / 10) + 'bn' : s + '£' + Math.round(a) + 'm'; };

// Levers are the draft policy proposals. costMid = midpoint of the paper's range (£m/yr; negative = revenue raiser).
// costLabel = the paper's own estimate. red = modelled max relative reduction in the 16-24 NEET rate (a steady-state assumption).
const LEVERS = [
  { id: 'ks3', name: 'Statutory KS3 literacy & numeracy check + early identification', phase: 'Prepare (11-16)', red: 0.05, costMid: 11, costLabel: '£2m to £20m', ev: 'Pulls good teaching into KS3 where engagement falls, and flags risk early (cf. Blackpool RONI). Cheap and preventive.' },
  { id: 'tech14', name: 'A right to technical education at 14', phase: 'Prepare (11-16)', red: 0.06, costMid: 275, costLabel: '£150m to £400m (indicative)', indicative: true, ev: 'Tech awards in every school (16% offer none); tech-award takers have 23% lower unauthorised absence, a top NEET risk factor.' },
  { id: 'workex', name: 'Reinvent work experience (two-week entitlement)', phase: 'Prepare to Transition', red: 0.12, costMid: 100, costLabel: '£50m to £150m (indicative)', indicative: true, ev: 'Four or more employer contacts: five times less likely to be NEET.' },
  { id: 'accountability', name: 'A new "ready for work" school performance measure', phase: 'Prepare (11-16)', red: 0.03, costMid: 12, costLabel: 'indicative, low', indicative: true, ev: 'Holds schools to destinations, attendance, disadvantage gaps and off-rolling, not just exams.' },
  { id: 'fe', name: 'Strategic investments into FE for work readiness', phase: 'Transition (16-18)', red: 0.06, costMid: 420, costLabel: '£270m to £570m', ev: 'A work-readiness premium plus full mid-year reimbursement to re-engage the "bedroom generation".' },
  { id: 'traineeship', name: 'A pre-apprenticeship / traineeship tier', phase: 'Transition (16-18)', red: 0.05, costMid: 200, costLabel: '£150m to £250m', ev: 'A missing route for those who underachieved at 16; about 50,000 places, college-led.' },
  { id: 'feteacher', name: 'A high-status FE teacher route', phase: 'Transition (16-18)', red: 0.02, costMid: 30, costLabel: '£10m to £50m', ev: 'Teaching is the biggest in-college factor; brings craft and industry experience into FE.' },
  { id: 'resit', name: 'Reform the post-16 English and maths resit', phase: 'Transition (16-18)', red: 0.03, costMid: 30, costLabel: '£20m to £40m (indicative)', indicative: true, ev: 'Only about a third improve on resit; default against November resits plus stepping-stone qualifications.' },
  { id: 'apprent', name: 'Expand youth apprenticeships at scale', phase: 'Deliver (18-24)', red: 0.12, costMid: 3000, costLabel: '£2.5bn to £3.5bn', ev: 'Highest-impact youth intervention (10 in work per 100; about £15 back per £1). Toward 25%+ of the 16-24 group.' },
  { id: 'he', name: 'Rebalance HE and cut low-value subsidies', phase: 'Deliver (18-24)', red: 0.03, costMid: -750, costLabel: 'saves £0.5bn to £1bn', ev: 'Shift to the Level 4/5 "missing middle"; the saving is a revenue raiser that funds the tilt to work.' },
  { id: 'adultpot', name: 'New adult re-training pot (replaces over-25 apprenticeships)', phase: 'Deliver (18-24)', red: 0.01, costMid: 625, costLabel: '£500m to £750m', ev: 'Reallocates from over-25 apprenticeships to flexible, employer-led adult retraining.' },
];

const RECOMMENDED = { ks3: 100, tech14: 60, workex: 80, accountability: 100, fe: 70, traineeship: 80, feteacher: 100, resit: 100, apprent: 50, he: 100, adultpot: 60 };
const PHASE_COLOR = { 'Prepare (11-16)': COL.blue, 'Prepare to Transition': COL.blue, 'Transition (16-18)': '#7c3aed', 'Deliver (18-24)': COL.green };
const GROUP = { ks3: 'Prevention (flow)', tech14: 'Prevention (flow)', workex: 'Prevention (flow)', accountability: 'Prevention (flow)', fe: 'Transition', traineeship: 'Transition', feteacher: 'Transition', resit: 'Transition', apprent: 'Re-engagement (stock)', he: 'Re-engagement (stock)', adultpot: 'Re-engagement (stock)' };
// Evidence confidence in the modelled effect size (not the policy's merit): how well-evidenced is the link to NEET.
const CONF = { workex: 'High', apprent: 'High', ks3: 'Medium', tech14: 'Medium', fe: 'Medium', traineeship: 'Medium', resit: 'Medium', accountability: 'Low', feteacher: 'Low', he: 'Low', adultpot: 'Low' };
const CONF_SCORE = { High: 1, Medium: 0.6, Low: 0.3 };
const CONF_COLOR = { High: '#0d7a42', Medium: '#e8920e', Low: '#64748b' };

export default function Simulator() {
  const [intensity, setIntensity] = useState(Object.fromEntries(LEVERS.map(l => [l.id, 0])));
  const [benefit, setBenefit] = useState(56000);

  const factor = LEVERS.reduce((acc, l) => acc * (1 - l.red * (intensity[l.id] / 100)), 1);
  const modelled = Math.round(BASELINE * factor);
  const reduced = BASELINE - modelled;
  const newRate = BASE_RATE * factor;
  const cost = LEVERS.reduce((a, l) => a + l.costMid * (intensity[l.id] / 100), 0);
  const lifetimeValue = reduced * benefit;
  const anyOn = Object.values(intensity).some(v => v > 0);
  // Weighted evidence confidence of the current package (by each lever's contribution to the reduction)
  let cw = 0, ct = 0; LEVERS.forEach(l => { const wt = l.red * intensity[l.id] / 100; cw += wt * CONF_SCORE[CONF[l.id]]; ct += wt; });
  const confGrade = ct === 0 ? '–' : cw / ct >= 0.8 ? 'High' : cw / ct >= 0.5 ? 'Medium' : 'Low';

  const set = (id, v) => setIntensity(s => ({ ...s, [id]: v }));
  const apply = (obj) => setIntensity({ ...Object.fromEntries(LEVERS.map(l => [l.id, 0])), ...obj });

  return (
    <div className="nd-page-inner">
      <h1 className="nd-h1">Intervention simulator</h1>
      <p className="nd-sub">Build a package from the draft policy proposals and see the modelled effect on the target, the 16-24 NEET rate, with costs taken from the proposals paper. An illustrative, steady-state model for discussion, not a forecast: effect sizes are assumptions you can dial, and the phase tag shows where each lever bites. See the full proposals on the Policy solutions tab.</p>

      <div style={{ position: 'sticky', top: 0, zIndex: 6, background: '#f1f5f9', padding: '8px 0 12px', marginBottom: 4, borderBottom: '1px solid #dbe2ea', boxShadow: '0 6px 10px -8px rgba(15,23,42,0.25)' }}>
      <div className="nd-stats" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="nd-stat"><div className="accent" style={{ background: COL.crimson }} /><div className="v" style={{ color: COL.crimson }}>{fmt0(modelled)}</div><div className="l">Modelled 16-24 NEET</div><div className="s">{pct(newRate)}, from {fmt0(BASELINE)} ({pct(BASE_RATE)})</div></div>
        <div className="nd-stat"><div className="accent" style={{ background: COL.green }} /><div className="v" style={{ color: COL.green }}>{fmt0(reduced)}</div><div className="l">Young people kept engaged</div><div className="s">{pct(reduced / BASELINE * 100)} of the NEET total</div></div>
        <div className="nd-stat"><div className="accent" style={{ background: COL.amber }} /><div className="v" style={{ color: COL.amber }}>{money(cost)}</div><div className="l">Indicative annual cost</div><div className="s">net of revenue raisers</div></div>
        <div className="nd-stat"><div className="accent" style={{ background: COL.navy }} /><div className="v" style={{ color: COL.navy }}>£{fmt1(lifetimeValue / 1e9)}bn</div><div className="l">Lifetime value of reduction</div><div className="s">at £{fmt0(benefit / 1000)}k per young person</div></div>
      </div>

        <div style={{ height: 16, borderRadius: 8, overflow: 'hidden', display: 'flex', background: '#eef2f7', marginTop: 10 }}>
          <div style={{ width: `${(modelled / BASELINE) * 100}%`, background: COL.crimson, transition: 'width 0.4s' }} />
          <div style={{ width: `${(reduced / BASELINE) * 100}%`, background: COL.green, transition: 'width 0.4s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: '0.72rem', color: '#475569', flexWrap: 'wrap', gap: 6 }}>
          <span><span style={{ display: 'inline-block', width: 9, height: 9, background: COL.crimson, borderRadius: 2, marginRight: 4 }} />Still NEET<span style={{ display: 'inline-block', width: 9, height: 9, background: COL.green, borderRadius: 2, margin: '0 4px 0 12px' }} />Moved out</span>
          <span>Evidence confidence in this package: <b style={{ color: CONF_COLOR[confGrade] || '#64748b' }}>{confGrade}</b></span>
        </div>
      </div>

      {reduced > 0 && (() => {
        const COLG = { 'Prevention (flow)': COL.blue, 'Transition': '#7c3aed', 'Re-engagement (stock)': COL.green };
        const w = {}; LEVERS.forEach(l => { const wt = l.red * intensity[l.id] / 100; if (wt > 0) w[GROUP[l.id]] = (w[GROUP[l.id]] || 0) + wt; });
        const tot = Object.values(w).reduce((a, b) => a + b, 0);
        const order = ['Prevention (flow)', 'Transition', 'Re-engagement (stock)'].filter(g => w[g]);
        return (
          <div className="nd-card" style={{ marginTop: 14 }}>
            <div className="nd-card-title">Where the reduction comes from: stock vs flow</div>
            <div className="nd-card-desc">Prevention stops the next cohort becoming NEET (the flow); re-engagement reaches those already NEET (the stock).</div>
            <div style={{ height: 26, borderRadius: 8, overflow: 'hidden', display: 'flex', background: '#eef2f7' }}>
              {order.map(g => <div key={g} style={{ width: `${w[g] / tot * 100}%`, background: COLG[g], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>{w[g] / tot > 0.12 ? `${Math.round(w[g] / tot * 100)}%` : ''}</div>)}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: '0.74rem', color: '#475569', flexWrap: 'wrap' }}>
              {order.map(g => <span key={g}><span style={{ display: 'inline-block', width: 10, height: 10, background: COLG[g], borderRadius: 2, marginRight: 5 }} />{g} {Math.round(w[g] / tot * 100)}%</span>)}
            </div>
          </div>
        );
      })()}

      <div style={{ display: 'flex', gap: 8, margin: '16px 0', flexWrap: 'wrap' }}>
        <button className="nd-chip active" onClick={() => apply(RECOMMENDED)} style={{ cursor: 'pointer' }}>Apply a recommended package</button>
        <button className="nd-chip" onClick={() => apply({})} style={{ cursor: 'pointer' }}>Reset all</button>
      </div>

      <div className="nd-card" style={{ marginTop: 16 }}>
        <div className="nd-card-title">How the numbers are modelled</div>
        <div style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.55 }}>
          <p style={{ margin: '4px 0 8px' }}><b>Baseline.</b> The 16-24 NEET population, {fmt0(BASELINE)} ({pct(BASE_RATE)}), ONS Q1 2026, the figure the whole agenda is trying to move.</p>
          <p style={{ margin: '0 0 8px' }}><b>Each lever's effect.</b> Every proposal has a modelled maximum effect: an assumed relative reduction in the NEET rate at full national rollout. These are judgement-based, anchored on the evidence pack (four or more employer contacts are linked to being five times less likely to be NEET; apprenticeships add about ten in work per hundred supported; persistent absence and EHC plans are the strongest risk factors). They are not departmental estimates.</p>
          <p style={{ margin: '0 0 8px' }}><b>The rollout slider</b> scales that effect linearly: 50% rollout delivers half the maximum. <b>Levers combine multiplicatively</b> (each acts on what is left), so overlapping moves never double-count and the total cannot exceed the baseline.</p>
          <p style={{ margin: '0 0 8px' }}><b>Costs</b> are the proposals paper's own indicative annual figures (midpoints of its ranges), with the HE saving netted off. <b>Lifetime value</b> is the number moved out of NEET times an adjustable per-person value.</p>
          <p style={{ margin: 0 }}><b>Confidence grade.</b> Each lever carries a High, Medium or Low grade for how well-evidenced its effect size is, not the policy's merit. The package grade is that confidence weighted by each lever's contribution to the reduction.</p>
        </div>
        <div className="nd-callout" style={{ marginTop: 12 }}>This is a transparent thinking tool, not a forecast. Its job is to structure the question "what would we have to believe for this package to be worth it". The paper itself notes that costings and projected NEET impact need more work.</div>
      </div>

      <h2 className="nd-h2">The proposals as levers</h2>
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
          <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: 4, lineHeight: 1.45 }}><b>Evidence:</b> {l.ev}</div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 3 }}><b>Cost (from the paper):</b> {l.costLabel} · max modelled effect −{fmt1(l.red * 100)}% · <b style={{ color: CONF_COLOR[CONF[l.id]] }}>{CONF[l.id]} confidence</b></div>
        </div>
      ))}

      <div className="nd-card" style={{ marginTop: 8 }}>
        <div className="nd-card-title">Assumptions</div>
        <div style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, marginBottom: 10 }}>Baseline is the 16-24 NEET population, {fmt0(BASELINE)} ({pct(BASE_RATE)}), ONS Q1 2026. Costs are the proposals paper's own indicative annual estimates (midpoints; the full package nets to £2.9bn-£4.1bn). Effects are applied multiplicatively so overlapping levers do not double-count, and represent the steady state once changes feed through. Adjust the lifetime value of moving one young person out of NEET:</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>£{fmt0(benefit / 1000)}k per young person</span>
          <input type="range" min="20000" max="120000" step="2000" value={benefit} onChange={e => setBenefit(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#0f2440' }} />
        </div>
        <p className="nd-note">Illustrative only. The paper notes there is more work to do on costings and projected NEET impact; the effect sizes here are modelling assumptions, not departmental estimates, and several levers act on the 11-16 flow so build over years. The cost figures are the paper's own.</p>
      </div>

      {!anyOn && <p className="nd-note">Move a slider, or apply a recommended package, to see the effect.</p>}
    </div>
  );
}
