import React, { useState, useEffect } from 'react';
import { StatCard, RankedBars, GroupedBars, MultiLine, Legend, COL, pct, fmt0, fmt1 } from './charts';

export default function Qualifications() {
  const [d, setD] = useState(null);
  const [mon, setMon] = useState(null);
  useEffect(() => { fetch('/qual_dashboard.json?v=' + Date.now()).then(r => r.json()).then(setD).catch(() => setD(false)); }, []);
  useEffect(() => { fetch('/apprentice_monthly.json?v=' + Date.now()).then(r => r.json()).then(setMon).catch(() => setMon(null)); }, []);
  if (d === false) return <div className="nd-page-inner"><div className="nd-card">Could not load qualification data.</div></div>;
  if (!d) return <div className="nd-page-inner" style={{ color: '#64748b', paddingTop: 30 }}>Loading qualification data…</div>;

  const t = d.apprenticeships.trend;
  const peak = t.reduce((a, b) => b.starts > a.starts ? b : a, t[0]);
  const latest = t[t.length - 1];
  const downPct = Math.round((peak.starts - latest.starts) / peak.starts * 100);
  const trendGroups = t.map(x => ({ label: x.label.slice(2), bars: [{ v: x.starts / 1000, color: x.label === peak.label ? COL.amber : x.label === latest.label ? COL.crimson : COL.blue }] }));
  const ageBars = d.apprenticeships.age_split.map(a => ({ label: a.group, value: a.pct, color: a.group === '25+' ? COL.slate : COL.blue, sub: fmt0(a.starts) + ' starts' }));
  const regionBars = d.apprenticeships.regions.map(r => ({ label: r.name, value: r.rate_u25, color: COL.blue }));

  const en = d.resit.English, ma = d.resit.Maths, dis = d.resit.by_disadvantage;
  const disBars = [
    { label: 'English (disadvantaged)', value: dis.English['Disadvantaged'], color: COL.crimson },
    { label: 'English (others)', value: dis.English['Not disadvantaged'], color: COL.blue },
    { label: 'Maths (disadvantaged)', value: dis.Maths['Disadvantaged'], color: COL.crimson },
    { label: 'Maths (others)', value: dis.Maths['Not disadvantaged'], color: COL.blue },
  ];

  const VOCAL = new Set(['Applied general', 'Tech level', 'Technical certificate']);
  const mixBars = d.route_mix.map(m => ({ label: m.cohort, value: m.entries / 1000, color: VOCAL.has(m.cohort) ? COL.crimson : COL.blue, sub: fmt0(m.entries) }));

  return (
    <div className="nd-page-inner">
      <h1 className="nd-h1">Qualifications and routes</h1>
      <p className="nd-sub">The supply side of the participation problem: the entry routes a young person can actually take after school, and how well they work. Each cut speaks to a move in the Section 5 paper, from rebuilding the first rung to reforming the post-16 resit.</p>

      <h2 className="nd-h2">The collapsing first rung: apprenticeships</h2>
      <div className="nd-stats">
        <StatCard value={fmt0(peak.starts)} label={`Starts at the peak (${peak.label})`} accent={COL.amber} />
        <StatCard value={fmt0(latest.starts)} label={`Starts now (${latest.label})`} accent={COL.crimson} />
        <StatCard value={downPct + '%'} label="Down from the peak" accent={COL.crimson} />
        <StatCard value={pct(d.apprenticeships.age_split.find(a => a.group === '25+').pct)} label="Now taken by over-25s" sub="young people are a minority" accent={COL.navy} />
      </div>
      <div className="nd-grid" style={{ gridTemplateColumns: '1.4fr 1fr', marginTop: 16 }}>
        <div className="nd-card">
          <div className="nd-card-title">Apprenticeship starts, all ages, England</div>
          <div className="nd-card-desc">Starts (thousands) by year. Peak in {peak.label} (amber), latest in {latest.label} (red). The total masks the bigger fall in young and entry-level starts.</div>
          <GroupedBars groups={trendGroups} unit="k" width={640} height={250} />
        </div>
        <div className="nd-card">
          <div className="nd-card-title">Who gets them now ({d.meta.app_year})</div>
          <div className="nd-card-desc">Share of starts by age. Over-25s now take nearly half.</div>
          <RankedBars data={ageBars} labelWidth={90} max={55} />
        </div>
      </div>
      <div className="nd-card" style={{ marginTop: 16 }}>
        <div className="nd-card-title">Under-25 starts per 100,000 population, by region</div>
        <div className="nd-card-desc">Where the first rung is most and least available to young people.</div>
        <RankedBars data={regionBars} labelWidth={150} unit="" max={Math.max(...regionBars.map(b => b.value)) * 1.05} />
      </div>
      <div className="nd-callout">Section 5 link: rebuild the bottom rung of the skills ladder. Young people are now a minority of a programme that is well below its early-2010s peak, exactly the hollowing-out Milburn describes.</div>

      {mon && mon.series && mon.series.length > 0 && (() => {
        const s = mon.series;
        const labels = s.map(x => x.label.startsWith('Aug') ? x.label.replace('Aug ', '') : '');
        const lines = [
          { name: 'Under-19 starts', color: COL.crimson, values: s.map(x => x.under19) },
          { name: 'Level 2 (Intermediate) starts', color: COL.amber, values: s.map(x => x.level2) },
          { name: 'All ages', color: COL.blue, values: s.map(x => x.total) },
        ];
        const first = s[0], last = s[s.length - 1];
        const dropU = Math.round((1 - last.under19 / first.under19) * 100);
        const dropL2 = Math.round((1 - last.level2 / first.level2) * 100);
        return (
          <div className="nd-card" style={{ marginTop: 16 }}>
            <div className="nd-card-title">Apprenticeships as a leading indicator</div>
            <div className="nd-card-desc">Monthly apprenticeship starts, which arrive with almost no lag, can act as an early-warning signal for NEET: under-19 and Level 2 starts are the entry rungs young people use. Over this window under-19 starts fell about {dropU}% and Level 2 about {dropL2}%, a leading sign of a thinning first rung.</div>
            <MultiLine lines={lines} labels={labels} />
            <p className="nd-note">Source: DfE apprenticeship monthly/quarterly starts ({first.label} to {last.label}). National, by academic year. The monthly feed updates with low lag, so this view can be refreshed far sooner than the annual NEET statistics; the relationship is indicative, with many other factors at play.</p>
          </div>
        );
      })()}

      <h2 className="nd-h2">The resit trap: post-16 English and maths</h2>
      <div className="nd-stats">
        <StatCard value={pct(en.improving)} label="Improve their English grade" sub={`of ${fmt0(en.count)} resitting`} accent={COL.crimson} />
        <StatCard value={pct(ma.improving)} label="Improve their maths grade" sub={`of ${fmt0(ma.count)} resitting`} accent={COL.crimson} />
        <StatCard value={pct(en.g4plus)} label="Reach grade 4 in English" accent={COL.amber} />
        <StatCard value={pct(ma.g4plus)} label="Reach grade 4 in maths" accent={COL.amber} />
      </div>
      <div className="nd-card" style={{ marginTop: 16 }}>
        <div className="nd-card-title">Who improves, by disadvantage</div>
        <div className="nd-card-desc">Share improving their grade among post-16 students who did not reach grade 4 at KS4. Disadvantaged students improve least, the group most at risk of disengaging.</div>
        <RankedBars data={disBars} labelWidth={180} max={50} />
      </div>
      <div className="nd-callout">Section 5 link: reform the post-16 English and maths resit requirement. Only about a third improve and most are recycled through the same exam, which corrodes motivation and feeds disengagement.</div>

      <h2 className="nd-h2">Academic versus vocational routes at 16-18</h2>
      <div className="nd-card">
        <div className="nd-card-title">Level 3 entries by route ({d.meta.results_year})</div>
        <div className="nd-card-desc">Entries by qualification type (thousands). A level dominates; tech levels remain tiny, which is the gap the "build high-quality vocational qualifications" idea aims at.</div>
        <RankedBars data={mixBars} labelWidth={160} unit="k" max={Math.max(...mixBars.map(b => b.value)) * 1.05} />
        <Legend items={[{ label: 'Academic', color: COL.blue }, { label: 'Vocational / technical', color: COL.crimson }]} />
      </div>

      <h2 className="nd-h2">KS4 context ({d.meta.ks4_year})</h2>
      <div className="nd-stats">
        <StatCard value={fmt1(d.ks4.att8)} label="Average Attainment 8" accent={COL.blue} />
        <StatCard value={pct(d.ks4.basics4)} label="Grade 4+ in English & maths" accent={COL.blue} />
        <StatCard value={pct(d.ks4.ebacc_entry)} label="Entered the full EBacc" accent={COL.navy} />
      </div>

      <p className="nd-note">Sources: DfE Apprenticeships and traineeships 2022/23; A level and other 16 to 18 results 2024/25 (including the English and maths progress measure); Key stage 4 performance 2023/24. Resit figures cover post-16 students who had not achieved grade 4 at KS4.</p>
    </div>
  );
}
