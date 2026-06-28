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

      <div className="nd-callout" onClick={() => go('geography')} style={{ cursor: 'pointer' }}>
        <b>Start with the "not known" problem.</b> Nationally, {pct(n.nk)} of 16 to 17 year olds are not even tracked, almost as many as the {pct(n.neet)} confirmed NEET. In some authorities the not-known rate is far larger than the NEET rate, which distorts every league table. Open the Geography tab to see it by authority.
      </div>
    </div>
  );
}
