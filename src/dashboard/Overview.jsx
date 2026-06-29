import React from 'react';
import { StatCard, TrendLine, RankedBars, COL, pct, fmt1, rateColor } from './charts';

export default function Overview({ data, go }) {
  const n = data.national.latest;
  const regions = data.regions.map(r => ({ label: r.name, value: r.neetnk, color: rateColor(r.neetnk, 8), hl: r.name === 'North East', meta: r.ks4 }));
  return (
    <div className="nd-page-inner">
      <h1 className="nd-h1">The NEET picture, from an education lens</h1>
      <p className="nd-sub">Three data lenses on the same problem: where 16 to 17 year olds are NEET today, where school leavers end up, and what Milburn found across the wider 16 to 24 group. Use the tabs to go deeper by place, school, admissions and need.</p>

      <h2 className="nd-h2">16 to 17 year olds today (2025)</h2>
      <div className="nd-stats">
        <StatCard value={pct(n.neetnk)} label="NEET or not known" sub="England, Dec 2024 to Feb 2025" accent={COL.crimson} />
        <StatCard value={pct(n.neet)} label="Confirmed NEET" sub="excludes those not tracked" accent={COL.amber} />
        <StatCard value={pct(n.nk)} label="Activity not known" sub="a tracking gap, not confirmed NEET" accent={COL.slate} />
        <StatCard value={pct(data.ks4_national.ns)} label="School leavers with no sustained destination" sub="KS4 destinations, 2022/23 cohort" accent={COL.blue} />
      </div>

      <h2 className="nd-h2">Key Stage 4 attainment (England, 2023/24)</h2>
      <div className="nd-stats">
        <StatCard value={fmt1(data.national.ks4.att8)} label="Average Attainment 8" accent={COL.blue} />
        <StatCard value={(data.national.ks4.p8 > 0 ? '+' : '') + fmt1(data.national.ks4.p8)} label="Progress 8 (2024)" accent={COL.blue} />
        <StatCard value={pct(data.national.ks4.basics5)} label="5+ in English & maths" accent={COL.navy} />
        <StatCard value={pct(data.national.ks4.basics4)} label="4+ in English & maths" accent={COL.navy} />
      </div>
      <p className="nd-note">Pupil-weighted across state-funded secondaries. Hover any region bar below to see the same measures for that region.</p>

      <h2 className="nd-h2">Milburn's national picture (16 to 24)</h2>
      <div className="nd-stats">
        <StatCard value="957,000" label="Young people NEET (16-24)" sub="Milburn interim review, May 2026" accent={COL.crimson} />
        <StatCard value="1.25m+" label="Projected within 5 years" sub="over 16% on current trajectory" accent={COL.crimson} />
        <StatCard value="£125bn" label="Estimated annual cost" sub="more than the schools budget" accent={COL.navy} />
        <StatCard value="314,000" label="Out of work and out of sight" sub="not reached by any service" accent={COL.amber} />
      </div>
      <p className="nd-note">The first row is DfE management information for 16 to 17 year olds by local authority. The Milburn figures cover the wider 16 to 24 group and come from the interim review. They are not directly comparable, which is itself part of the story: the system measures different ages in different ways.</p>

      <div className="nd-grid" style={{ gridTemplateColumns: '1.3fr 1fr', marginTop: 22 }}>
        <div className="nd-card">
          <div className="nd-card-title">The trajectory is the wrong way</div>
          <div className="nd-card-desc">NEET or not known among 16 to 17 year olds, England, 2019 to 2025. After a pandemic dip it has climbed every year since 2022.</div>
          <TrendLine series={data.national.ts} color={COL.crimson} />
        </div>
        <div className="nd-card">
          <div className="nd-card-title">Region matters</div>
          <div className="nd-card-desc">NEET or not known by region, 2025. But read with care: a high rate can reflect poor tracking as much as real disengagement (see the Geography tab).</div>
          <RankedBars data={regions} labelWidth={130} max={8} />
        </div>
      </div>

      <div onClick={() => go('wwc')} style={{ cursor: 'pointer', marginTop: 22, background: '#0f2440', color: '#fff', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 auto' }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>36%<span style={{ color: '#93b4dd', fontSize: '1.2rem' }}> vs 72%</span></div>
          <div style={{ fontSize: '0.74rem', color: '#aebfd4', marginTop: 4 }}>grade 4+ English &amp; maths</div>
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ef6b8a', marginBottom: 4 }}>New: Independent Inquiry, June 2026</div>
          <div style={{ fontSize: '0.95rem', lineHeight: 1.5, color: '#dbe4ef' }}>White British FSM pupils have some of the weakest outcomes in the country, and a higher risk of becoming NEET. Open the White Working Class findings →</div>
        </div>
      </div>

      <div className="nd-callout" onClick={() => go('geography')} style={{ cursor: 'pointer' }}>
        <b>Start with the "not known" problem.</b> Nationally, {pct(n.nk)} of 16 to 17 year olds are not even tracked, almost as many as the {pct(n.neet)} confirmed NEET. In some authorities the not-known rate is far larger than the NEET rate, which distorts every league table. Open the Geography tab to see it by authority.
      </div>
    </div>
  );
}
