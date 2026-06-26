import React, { useState, useEffect, useCallback } from 'react';
import { StatCard, RankedBars, TrendLine, GroupedBars, COL, pct, fmt0, fmt1, rateColor } from './charts';

const STEPS = [
  {
    tag: 'The problem', title: 'The trend is going the wrong way',
    text: d => `Among 16 and 17 year olds, NEET or not known has risen every year since 2022, to ${pct(d.national.latest.neetnk)}. Milburn's wider 16 to 24 figure is 957,000 today, heading past 1.25 million within five years on current trends.`,
    chart: d => <TrendLine series={d.national.ts} color={COL.crimson} />,
  },
  {
    tag: 'A hidden problem', title: 'Much of the rate is not disengagement, it is blindness',
    text: d => `Nationally ${pct(d.national.latest.nk)} of young people are "activity not known", almost as many as the ${pct(d.national.latest.neet)} confirmed NEET. In the worst-tracked authorities the headline is largely a data gap.`,
    chart: d => <RankedBars labelWidth={150} data={[...d.las].sort((a, b) => b.nk - a.nk).slice(0, 6).map(l => ({ label: l.name, value: l.nk, color: COL.amber }))} max={Math.max(...d.las.map(l => l.nk)) * 1.05} />,
  },
  {
    tag: 'Geography', title: 'Risk concentrates in the North and on the coast',
    text: () => `An identical young person fares worse in Hartlepool than in Harrogate. Place is a multiplier, and it maps onto Mission North East and Mission Coastal almost line for line.`,
    chart: d => <RankedBars labelWidth={150} data={d.regions.map(r => ({ label: r.name, value: r.neetnk, color: rateColor(r.neetnk, 8), hl: r.name === 'North East' }))} max={8} />,
  },
  {
    tag: 'The defining shift', title: 'Health, disability and need now define who becomes NEET',
    text: d => { const s = d.national.breakdowns.SEND; return `Young people with an EHC plan are about twice as likely to be NEET or not known (${pct(s['SEN EHC/statement'])}) as those with no identified need (${pct(s['No SEN'])}). This is Milburn's central finding.`; },
    chart: d => { const s = d.national.breakdowns.SEND; return <RankedBars labelWidth={120} max={12} data={[{ label: 'No SEN', value: s['No SEN'], color: rateColor(s['No SEN'], 11) }, { label: 'SEN support', value: s['SEN support'], color: rateColor(s['SEN support'], 11) }, { label: 'EHC plan', value: s['SEN EHC/statement'], color: rateColor(s['SEN EHC/statement'], 11) }]} />; },
  },
  {
    tag: 'Our cut', title: 'The most selective schools carry almost none of the risk',
    text: d => { const a = d.admissions; return `Selective schools leave ${pct(a.selective_ns)} of pupils with no sustained destination, against ${pct(a.nonselective_ns)} in non-selective schools, and the gap widens to ${fmt1(a.nonselective_dis_ns / a.selective_dis_ns)} times for disadvantaged pupils. The system sorts risk away from the institutions best able to absorb it.`; },
    chart: d => { const a = d.admissions; return <RankedBars labelWidth={170} max={12} data={[{ label: 'Selective', value: a.selective_ns, color: COL.blue }, { label: 'Non-selective', value: a.nonselective_ns, color: COL.crimson }, { label: 'Selective (disadv.)', value: a.selective_dis_ns, color: COL.blue }, { label: 'Non-selective (disadv.)', value: a.nonselective_dis_ns, color: COL.crimson }]} />; },
  },
  {
    tag: 'The supply side', title: 'The first rung has hollowed out',
    text: (d, q) => { if (!q) return 'Apprenticeship starts are well below their peak and young people are now a minority of them.'; const t = q.apprenticeships.trend; const pk = t.reduce((a, b) => b.starts > a.starts ? b : a, t[0]); const lt = t[t.length - 1]; return `Apprenticeship starts have fallen from ${fmt0(pk.starts)} at their ${pk.label} peak to ${fmt0(lt.starts)}, and over-25s now take ${pct(q.apprenticeships.age_split.find(a => a.group === '25+').pct)} of them. Post-16, only ${pct(q.resit.English.improving)} improve their English resit.`; },
    chart: (d, q) => q ? <GroupedBars unit="k" width={560} height={220} groups={q.apprenticeships.trend.map(x => ({ label: x.label.slice(2), bars: [{ v: x.starts / 1000, color: x.label.startsWith('2011') ? COL.amber : COL.blue }] }))} /> : null,
  },
  {
    tag: 'So what', title: 'Where we go further',
    text: () => `Measure schools on destinations, screen for risk from Year 7, treat early years as the first rung, make inclusion about work, rebuild the bottom rung of skills, open up admissions, pause BTEC defunding, reform the resit. Education is the foundation of the Working State, and we started before Milburn reported.`,
    chart: () => (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {['Destinations, not just grades', 'Year 7 risk screening', 'Early years as first rung', 'Inclusion into work', 'Rebuild the skills ladder', 'Open up admissions', 'Pause BTEC defunding', 'Reform post-16 resits'].map((m, i) => (
          <div key={i} style={{ background: '#0f2440', color: '#e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', fontWeight: 600 }}>{m}</div>
        ))}
      </div>
    ),
  },
];

export default function Story({ onClose }) {
  const [i, setI] = useState(0);
  const [d, setD] = useState(null);
  const [q, setQ] = useState(null);
  useEffect(() => {
    fetch('/neet_dashboard.json?v=' + Date.now()).then(r => r.json()).then(setD);
    fetch('/qual_dashboard.json?v=' + Date.now()).then(r => r.json()).then(setQ).catch(() => setQ(null));
  }, []);
  const next = useCallback(() => setI(v => Math.min(STEPS.length - 1, v + 1)), []);
  const prev = useCallback(() => setI(v => Math.max(0, v - 1)), []);
  useEffect(() => {
    const h = e => { if (e.key === 'ArrowRight') next(); else if (e.key === 'ArrowLeft') prev(); else if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [next, prev, onClose]);

  const s = STEPS[i];
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a1626', zIndex: 1200, display: 'flex', flexDirection: 'column', fontFamily: "'Source Sans 3', sans-serif", color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 26px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <span style={{ fontWeight: 800 }}><span style={{ color: '#ef4444' }}>●</span> NEET Intelligence — present mode</span>
        <span style={{ marginLeft: 14, fontSize: '0.8rem', color: '#93b4dd' }}>{i + 1} of {STEPS.length}</span>
        <button onClick={onClose} style={{ marginLeft: 'auto', border: 0, background: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}>Exit</button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 40px', overflow: 'auto' }}>
        <div style={{ maxWidth: 1000, width: '100%' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ef6b8a' }}>{s.tag}</div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '6px 0 18px', lineHeight: 1.12 }}>{s.title}</h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 28, alignItems: 'center' }}>
            <p style={{ fontSize: '1.12rem', lineHeight: 1.6, color: '#dbe4ef' }}>{d ? s.text(d, q) : 'Loading…'}</p>
            <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', color: '#0f172a' }}>{d ? s.chart(d, q) : null}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={prev} disabled={i === 0} style={navBtn(i === 0)}>← Back</button>
        <div style={{ display: 'flex', gap: 7 }}>{STEPS.map((_, j) => <span key={j} onClick={() => setI(j)} style={{ width: 9, height: 9, borderRadius: '50%', background: j === i ? '#ef4444' : 'rgba(255,255,255,0.3)', cursor: 'pointer' }} />)}</div>
        <button onClick={i === STEPS.length - 1 ? onClose : next} style={navBtn(false, true)}>{i === STEPS.length - 1 ? 'Finish' : 'Next →'}</button>
      </div>
    </div>
  );
}

const navBtn = (disabled, primary) => ({ border: 0, borderRadius: 9, padding: '10px 22px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.95rem', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1, background: primary ? '#ef4444' : 'rgba(255,255,255,0.14)', color: '#fff' });
