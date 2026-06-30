import React, { useState, useMemo } from 'react';
import { GroupedBars, RankedBars, Scatter, Legend, COL, pct, fmt1, fmt0 } from './charts';

export default function Admissions({ data }) {
  const a = data.admissions;
  const [admFilter, setAdmFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  const regions = useMemo(() => Array.from(new Set(a.scatter.map(s => s.region).filter(Boolean))).sort(), [a.scatter]);
  const scatterPts = useMemo(() => a.scatter
    .filter(s => s.ns != null && s.nsd != null)
    .filter(s => admFilter === 'all' ? true : admFilter === 'sel' ? s.adm === 'Selective' : s.adm === 'Non selective')
    .filter(s => regionFilter === 'all' ? true : s.region === regionFilter)
    .map(s => ({ x: s.ns, y: s.nsd, c: s.adm === 'Selective' ? COL.blue : COL.crimson, name: s.name, extra: `${s.region || ''} · all ${fmt1(s.ns)}% · disadv ${fmt1(s.nsd)}%` })),
    [a.scatter, admFilter, regionFilter]);
  const totalShown = a.scatter.filter(s => s.ns != null && s.nsd != null).length;
  const mult = a.selective_ns ? (a.nonselective_ns / a.selective_ns) : null;
  const disMult = a.selective_dis_ns ? (a.nonselective_dis_ns / a.selective_dis_ns) : null;

  const grouped = [
    { label: 'All pupils', bars: [
      { v: a.selective_ns, color: COL.blue, name: 'Selective' },
      { v: a.nonselective_ns, color: COL.crimson, name: 'Non-selective' },
    ] },
    { label: 'Disadvantaged pupils', bars: [
      { v: a.selective_dis_ns, color: COL.blue, name: 'Selective' },
      { v: a.nonselective_dis_ns, color: COL.crimson, name: 'Non-selective' },
    ] },
  ];

  const byType = a.byType.filter(t => t.n >= 5).map(t => ({
    label: t.type.replace('Academy - ', '').replace(' Mainstream', '').replace('Free School - ', 'Free: '),
    value: t.ns, sub: `${fmt0(t.n)}`,
    color: /Special|Alternative|Hospital/.test(t.type) ? COL.amber : /Selective|Grammar/.test(t.type) ? COL.green : COL.blue,
  }));

  return (
    <div className="nd-page-inner">
      <h1 className="nd-h1">The admissions cut</h1>
      <p className="nd-sub">A participation system cannot let its best institutions screen out the pupils most at risk. Using the school-level destinations data, this is what selective and non-selective schools actually carry, measured by the share of leavers with no sustained destination (the school-level NEET proxy).</p>

      <div className="nd-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="nd-card">
          <div className="nd-card-title">All pupils</div>
          <div className="nd-contrast" style={{ marginTop: 16 }}>
            <div className="side" style={{ background: '#eaf2fb' }}><div className="v" style={{ color: COL.blue }}>{pct(a.selective_ns)}</div><div className="l">Selective schools</div></div>
            <div className="vs">vs</div>
            <div className="side" style={{ background: '#fdeaf1' }}><div className="v" style={{ color: COL.crimson }}>{pct(a.nonselective_ns)}</div><div className="l">Non-selective schools</div></div>
          </div>
          <div className="nd-mult">Non-selective schools carry <b>{fmt1(mult)}× the NEET risk</b> of selective schools.</div>
        </div>
        <div className="nd-card">
          <div className="nd-card-title">Disadvantaged pupils only</div>
          <div className="nd-contrast" style={{ marginTop: 16 }}>
            <div className="side" style={{ background: '#eaf2fb' }}><div className="v" style={{ color: COL.blue }}>{pct(a.selective_dis_ns)}</div><div className="l">Selective schools</div></div>
            <div className="vs">vs</div>
            <div className="side" style={{ background: '#fdeaf1' }}><div className="v" style={{ color: COL.crimson }}>{pct(a.nonselective_dis_ns)}</div><div className="l">Non-selective schools</div></div>
          </div>
          <div className="nd-mult">For disadvantaged pupils the gap widens to <b>{fmt1(disMult)}×</b>.</div>
        </div>
      </div>

      <div className="nd-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 16 }}>
        <div className="nd-card">
          <div className="nd-card-title">Selective vs non-selective</div>
          <div className="nd-card-desc">No sustained destination, cohort-weighted. Based on {fmt0(a.selective_n)} selective and {fmt0(a.nonselective_n)} non-selective mainstream schools.</div>
          <GroupedBars groups={grouped} maxV={13} />
        </div>
        <div className="nd-card">
          <div className="nd-card-title">By type of institution</div>
          <div className="nd-card-desc">No sustained destination by institution type (number of schools shown). Alternative provision and special schools carry the most, selective and converter academies the least.</div>
          <RankedBars data={byType} labelWidth={150} max={Math.max(...byType.map(b => b.value)) * 1.05} />
        </div>
      </div>

      <div className="nd-card" style={{ marginTop: 16 }}>
        <div className="nd-card-title">School by school: do disadvantaged pupils fare worse?</div>
        <div className="nd-card-desc">
          Each dot is one mainstream state secondary. Its horizontal position is the share of <b>all</b> its leavers with no sustained destination; its vertical position is the same figure for <b>disadvantaged</b> pupils alone. The dashed line is parity (equal outcomes): a school above the line is failing its disadvantaged pupils more than its intake as a whole, and almost every school sits above it. Selective schools (blue) cluster tightly in the bottom-left, near zero on both axes. Hover any dot for the school.
        </div>
        <div className="nd-chips">
          <button className={'nd-chip' + (admFilter === 'all' ? ' active' : '')} onClick={() => setAdmFilter('all')}>All schools</button>
          <button className={'nd-chip' + (admFilter === 'sel' ? ' active' : '')} onClick={() => setAdmFilter('sel')}>Selective only</button>
          <button className={'nd-chip' + (admFilter === 'non' ? ' active' : '')} onClick={() => setAdmFilter('non')}>Non-selective only</button>
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="nd-chip" style={{ appearance: 'auto', paddingRight: 8 }}>
            <option value="all">All regions</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <span style={{ alignSelf: 'center', fontSize: '0.78rem', color: '#94a3b8' }}>Showing {fmt0(scatterPts.length)} of {fmt0(totalShown)} schools</span>
        </div>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Scatter points={scatterPts}
            xLabel="No sustained destination, all pupils (%)" yLabel="Disadvantaged pupils (%)"
            xMax={25} yMax={35} refLine />
          <Legend items={[{ label: 'Selective', color: COL.blue }, { label: 'Non-selective', color: COL.crimson }]} />
        </div>
        <p className="nd-note">Covers {fmt0(totalShown)} mainstream state secondaries with a recorded admission policy and a publishable disadvantaged figure. It is not every school: special schools, alternative provision, "admission policy not collected" schools, and those where disadvantaged pupil numbers are too small to report are excluded.</p>
      </div>

      {(() => {
        const bands = [[0, 2], [2, 4], [4, 6], [6, 8], [8, 10], [10, 15], [15, 100]];
        const labels = ['0-2', '2-4', '4-6', '6-8', '8-10', '10-15', '15%+'];
        const counts = bands.map(() => 0);
        a.scatter.forEach(s => { if (s.ns == null) return; const i = bands.findIndex(([lo, hi]) => s.ns >= lo && s.ns < hi); if (i >= 0) counts[i]++; });
        const total = counts.reduce((x, y) => x + y, 0);
        const tail = counts[5] + counts[6];
        const groups = labels.map((l, i) => ({ label: l, bars: [{ v: counts[i], color: i >= 5 ? COL.crimson : COL.blue }] }));
        return (
          <div className="nd-card" style={{ marginTop: 16 }}>
            <div className="nd-card-title">The long tail of providers</div>
            <div className="nd-card-desc">Distribution of mainstream secondaries by their share of leavers with no sustained destination. Most cluster low, but a long tail (red) carries much higher rates: {fmt0(tail)} schools are above 10%. This tail is where targeted support and the destinations measure should bite.</div>
            <GroupedBars groups={groups} unit="" width={620} height={230} />
            <p className="nd-note">{fmt0(total)} mainstream state secondaries with a recorded figure. FE colleges and 16-18 providers will be added when the 16-18 destination measures are loaded.</p>
          </div>
        );
      })()}

      <div className="nd-callout">
        <b>Policy read.</b> This is the evidence base for the "open up admissions" move in the Section 5 paper. The most selective institutions sit almost entirely outside the NEET risk, and the gap is widest for exactly the disadvantaged pupils a participation system most needs to reach. The question for the room: should the strongest sixth forms and schools be able to admit so few of the young people most likely to disengage?
      </div>
      <p className="nd-note">Source: DfE, KS4 destination measures, 2022/23 cohort. "No sustained destination" means not in sustained education, apprenticeship or employment in the year after Year 11. Admission policy is as recorded in the destinations data; "not collected" schools (largely special schools, alternative provision and some others) are excluded from the selective vs non-selective comparison but shown by type.</p>
    </div>
  );
}
