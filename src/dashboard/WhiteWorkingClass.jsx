import React, { useState, useEffect } from 'react';
import { StatCard, GroupedBars, Legend, COL, pct, fmt1 } from './charts';

export default function WhiteWorkingClass() {
  const [d, setD] = useState(null);
  useEffect(() => { fetch('/wwc_data.json?v=' + Date.now()).then(r => r.json()).then(setD).catch(() => setD(false)); }, []);
  if (d === false) return <div className="nd-page-inner"><div className="nd-card">Could not load the inquiry data.</div></div>;
  if (!d) return <div className="nd-page-inner" style={{ color: '#64748b', paddingTop: 30 }}>Loading…</div>;

  const h = d.headline;
  const gapGroups = d.attainment_gap.map(g => ({
    label: g.stage,
    bars: [{ v: g.nonfsm, color: COL.blue, name: 'Non-FSM' }, { v: g.wbfsm, color: COL.crimson, name: 'White British FSM' }],
  }));

  return (
    <div className="nd-page-inner">
      <h1 className="nd-h1">White working class educational outcomes</h1>
      <p className="nd-sub">Findings from the Independent Inquiry into White Working Class Educational Outcomes, published June 2026. The Inquiry traces a widening attainment gap and rising disengagement that it links explicitly to a higher risk of becoming NEET, the territory of this dashboard.</p>

      <div style={{ background: '#0f2440', color: '#dbe4ef', borderRadius: 12, padding: '12px 16px', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: 18 }}>
        <strong style={{ color: '#fff' }}>Source.</strong> {d.source}
      </div>

      <div className="nd-stats">
        <StatCard value="1.25m" label="White British FSM pupils" sub="about 15% of all pupils; over half of all FSM pupils" accent={COL.crimson} />
        <StatCard value={pct(h.ks4_basics_wbfsm)} label="Reach grade 4+ in English & maths" sub={`vs ${pct(h.ks4_basics_nonfsm)} of non-FSM pupils`} accent={COL.crimson} />
        <StatCard value={fmt1(h.progress8_wbfsm)} label="Average Progress 8 (2024-25)" sub="among the lowest in England" accent={COL.amber} />
        <StatCard value="2 in 3" label="Leave without the basics" sub="finish compulsory education below grade 4 in English & maths" accent={COL.navy} />
      </div>

      <div className="nd-card" style={{ marginTop: 18 }}>
        <div className="nd-card-title">The gap opens early and never closes</div>
        <div className="nd-card-desc">Share reaching the expected standard at each stage (2024-25): white British FSM pupils against non-FSM pupils. The gap is wide at phonics and stays wide to GCSE.</div>
        <GroupedBars groups={gapGroups} unit="%" width={620} height={260} maxV={100} />
        <Legend items={[{ label: 'Non-FSM pupils', color: COL.blue }, { label: 'White British FSM pupils', color: COL.crimson }]} />
      </div>

      <div className="nd-card" style={{ marginTop: 16 }}>
        <div className="nd-card-title">Disengagement and distant opportunity</div>
        <div className="nd-card-desc">From the Inquiry's polling of white working class pupils and parents.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 6 }}>
          {d.engagement.map((e, i) => (
            <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: e.frame === 'neg' ? COL.crimson : COL.blue }}>{e.frame === 'only' ? 'Only ' : ''}{pct(e.value)}</div>
              <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.35, marginTop: 2 }}>{e.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="nd-callout">
        <b>Why it sits here.</b> The Inquiry describes a sequence in which disadvantage, disengagement and distant opportunity compound through childhood, ending in a higher risk of becoming NEET. Several of its recommendations line up exactly with the Section 5 moves: high-quality vocational pathways at Key Stage 4, widening access to the best schools, a clear destination for every leaver, and expanding apprenticeships in these communities.
      </div>

      <h2 className="nd-h2">What the Inquiry recommends</h2>
      <div className="nd-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {Object.entries(d.recommendations).map(([theme, recs]) => (
          <div className="nd-card" key={theme}>
            <div className="nd-card-title">{theme}</div>
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: '0.86rem', color: '#334155', lineHeight: 1.5 }}>
              {recs.map((r, i) => <li key={i} style={{ marginBottom: 5 }}>{r}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <h2 className="nd-h2">In their words</h2>
      <div className="nd-card">
        {d.lines.map((l, i) => (
          <p key={i} style={{ margin: i ? '12px 0 0' : 0, fontSize: '0.98rem', fontStyle: 'italic', color: '#1e293b', lineHeight: 1.5, borderLeft: '3px solid #b91c4a', paddingLeft: 12 }}>{l}</p>
        ))}
      </div>

      <p className="nd-note">All figures and quotations are from the Independent Inquiry into White Working Class Educational Outcomes (June 2026). Attainment figures are 2024-25, comparing white British pupils eligible for free school meals with non-FSM pupils.</p>
    </div>
  );
}
