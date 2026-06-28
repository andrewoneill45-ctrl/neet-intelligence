import React, { useState, useEffect } from 'react';
import { Scatter, RankedBars, StatCard, Legend, COL, pct, fmt1, fmt0 } from './charts';

const UK = 'United Kingdom';

export default function International() {
  const [d, setD] = useState(null);
  useEffect(() => { fetch('/qual_dashboard.json?v=' + Date.now()).then(r => r.json()).then(setD).catch(() => setD(false)); }, []);
  if (d === false) return <div className="nd-page-inner"><div className="nd-card">Could not load international data.</div></div>;
  if (!d) return <div className="nd-page-inner" style={{ color: '#64748b', paddingTop: 30 }}>Loading international data…</div>;

  const rows = (d.international || []).filter(c => c.neet != null);
  const uk = rows.find(c => c.country === UK);
  const sorted = [...rows].sort((a, b) => a.neet - b.neet);
  const rank = uk ? sorted.findIndex(c => c.country === UK) + 1 : null;
  const neets = rows.map(c => c.neet).sort((a, b) => a - b);
  const median = neets.length ? neets[Math.floor(neets.length / 2)] : null;

  const scatterPts = rows.filter(c => c.vocational != null).map(c => ({
    x: c.vocational, y: c.neet, c: c.country === UK ? COL.crimson : COL.blue, name: c.country,
    extra: `vocational ${fmt1(c.vocational)}% · NEET ${fmt1(c.neet)}%`,
  }));
  const neetBars = [...rows].sort((a, b) => b.neet - a.neet).map(c => ({ label: c.country, value: c.neet, color: c.country === UK ? COL.crimson : COL.blue, hl: c.country === UK }));

  return (
    <div className="nd-page-inner">
      <h1 className="nd-h1">How the UK compares internationally</h1>
      <p className="nd-sub">OECD countries on youth disengagement and the shape of their upper-secondary systems. The question for the room: do countries with stronger vocational routes keep more young people engaged? The UK is highlighted throughout.</p>

      <div className="nd-stats">
        <StatCard value={uk ? pct(uk.neet) : '–'} label="UK 18-24 NEET rate" sub="OECD definition, 18-24" accent={COL.crimson} />
        <StatCard value={rank ? `${rank} of ${rows.length}` : '–'} label="UK rank (1 = lowest NEET)" sub="higher rank is worse" accent={COL.amber} />
        <StatCard value={median ? pct(median) : '–'} label="OECD median NEET" sub={`across ${rows.length} countries`} accent={COL.navy} />
        <StatCard value={uk ? pct(uk.vocational) : '–'} label="UK upper-secondary in vocational" sub="share of the cohort" accent={COL.blue} />
      </div>

      <div className="nd-card" style={{ marginTop: 18 }}>
        <div className="nd-card-title">Vocational training versus youth NEET</div>
        <div className="nd-card-desc">Each dot is a country. Horizontal: share of upper-secondary students in vocational training. Vertical: 18-24 NEET rate. Countries with stronger vocational routes tend to sit lower. The UK (red) combines a middling vocational share with a high NEET rate. Hover any dot for the country.</div>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Scatter points={scatterPts} xLabel="Upper secondary in vocational training (%)" yLabel="18-24 NEET rate (%)" xMax={80} yMax={50} />
          <Legend items={[{ label: 'United Kingdom', color: COL.crimson }, { label: 'Other OECD country', color: COL.blue }]} />
        </div>
      </div>

      <div className="nd-card" style={{ marginTop: 16 }}>
        <div className="nd-card-title">18-24 NEET rate, by country</div>
        <div className="nd-card-desc">Ranked highest to lowest. The UK is flagged.</div>
        <div style={{ maxHeight: 460, overflowY: 'auto' }}>
          <RankedBars data={neetBars} labelWidth={160} max={Math.max(...neetBars.map(b => b.value)) * 1.05} />
        </div>
      </div>

      <div className="nd-callout">Section 5 link: build high-quality vocational qualifications and rebuild the first rung. Internationally, the countries that keep young people engaged tend to be those with serious, respected vocational routes, which is the gap our own A-level-dominated route mix exposes.</div>
      <p className="nd-note">Source: OECD cross-country indicators supplied for this analysis (18-24 NEET, share of upper secondary in vocational training, upper-secondary completion, 25+ unemployment). Definitions differ from the 16-17 domestic NEET series, so treat as international context rather than a like-for-like comparison.</p>
    </div>
  );
}
