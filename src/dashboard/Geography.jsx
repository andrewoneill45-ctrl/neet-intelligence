import React, { useState, useMemo } from 'react';
import { BubbleMap, StackedBars, SortTable, RankedBars, TrendLine, COL, pct, fmt0, fmt1, rateColor } from './charts';

function LaDrawer({ la, onClose }) {
  if (!la) return null;
  const send = la.send || {};
  const sendBars = [['No SEN', send.noSEN], ['SEN support', send.senSupport], ['EHC plan', send.ehcp]].filter(x => x[1] != null);
  const sendMax = Math.max(8, ...sendBars.map(x => x[1])) * 1.05;
  return (
    <div style={{ position: 'fixed', top: 54, right: 0, bottom: 0, width: 360, maxWidth: '92vw', background: '#fff', boxShadow: '-8px 0 30px rgba(15,23,42,0.18)', zIndex: 50, overflowY: 'auto', padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{la.name}</div>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{la.region}{la.ne ? ' · North East' : ''}{la.coastal ? ' · Coastal' : ''}</div>
        </div>
        <button onClick={onClose} style={{ border: 0, background: '#f1f5f9', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: '1rem', color: '#475569' }}>✕</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, margin: '16px 0' }}>
        {[['NEET / NK', la.neetnk, COL.crimson], ['NEET', la.neet, COL.amber], ['Not known', la.nk, COL.slate]].map(([l, v, c]) => (
          <div key={l} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: c }}>{pct(v)}</div>
            <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 600 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: 6 }}>Cohort ~{fmt0(la.cohort)}. {la.annual_change != null && <span>Year change {la.annual_change > 0 ? '+' : ''}{fmt1(la.annual_change)} ppts.</span>}</div>
      {la.nk > la.neet && <div style={{ fontSize: '0.78rem', color: '#9a3412', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '8px 10px', margin: '4px 0 14px' }}>More of this rate is "not known" ({pct(la.nk)}) than confirmed NEET ({pct(la.neet)}). The headline is largely a tracking gap.</div>}
      {la.ts && la.ts.length >= 2 && (<>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, margin: '12px 0 6px' }}>Trend, 2019 to 2025</div>
        <TrendLine series={la.ts} color={COL.crimson} height={150} />
      </>)}
      {sendBars.length > 0 && (<>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, margin: '16px 0 6px' }}>NEET / not known by need</div>
        <RankedBars data={sendBars.map(([l, v]) => ({ label: l, value: v, color: rateColor(v, 14) }))} labelWidth={110} max={sendMax} />
      </>)}
    </div>
  );
}

const FILTERS = [
  { k: 'all', label: 'All authorities' },
  { k: 'ne', label: 'North East' },
  { k: 'coastal', label: 'Coastal (indicative)' },
  { k: 'milburn', label: 'Milburn named' },
];

export default function Geography({ data }) {
  const [filter, setFilter] = useState('all');
  const [metric, setMetric] = useState('neetnk');
  const [selectedLa, setSelectedLa] = useState(null);
  const byName = useMemo(() => Object.fromEntries(data.las.map(l => [l.name, l])), [data.las]);

  const las = useMemo(() => data.las.filter(l =>
    filter === 'all' ? true : filter === 'ne' ? l.ne : filter === 'coastal' ? l.coastal : l.milburn
  ), [data.las, filter]);

  const bubbles = las.map(l => ({ c: l.c, v: l[metric], size: l.cohort, name: l.name, hl: l.milburn }));
  const regionBars = data.regions.map(r => ({ label: r.name, value: r.neetnk, color: rateColor(r.neetnk, 8), hl: r.name === 'North East' }));
  const topSplit = [...las].sort((a, b) => b.neetnk - a.neetnk).slice(0, 16)
    .map(l => ({ label: l.name, a: l.neet, b: l.nk, hl: l.milburn }));

  const cols = [
    { key: 'name', label: 'Local authority', render: r => (<span>{r.name}{r.ne && <span className="pill nd-pill-ne" style={{ marginLeft: 6 }}>NE</span>}{r.coastal && <span className="pill nd-pill-co" style={{ marginLeft: 4 }}>Coast</span>}</span>) },
    { key: 'region', label: 'Region' },
    { key: 'neetnk', label: 'NEET / not known', num: true, render: r => <b>{pct(r.neetnk)}</b> },
    { key: 'neet', label: 'NEET', num: true, render: r => pct(r.neet) },
    { key: 'nk', label: 'Not known', num: true, render: r => pct(r.nk) },
    { key: 'annual_change', label: 'Yr change', num: true, render: r => (r.annual_change == null ? '–' : (r.annual_change > 0 ? '+' : '') + fmt1(r.annual_change)) },
    { key: 'cohort', label: 'Cohort', num: true, render: r => fmt0(r.cohort) },
  ];

  return (
    <div className="nd-page-inner">
      <h1 className="nd-h1">Geography of risk</h1>
      <p className="nd-sub">Milburn's map of risk runs through the North and the coast. This view lets you rank every authority, and separates confirmed NEET from "activity not known" so you can see how much of a high rate is real disengagement and how much is a tracking gap.</p>

      <div className="nd-grid" style={{ gridTemplateColumns: '460px 1fr', alignItems: 'start' }}>
        <div className="nd-card">
          <div className="nd-card-title">England by local authority</div>
          <div className="nd-card-desc">Bubble size = cohort; colour = rate. Hover for figures.</div>
          <div className="nd-chips">
            <button className={'nd-chip' + (metric === 'neetnk' ? ' active' : '')} onClick={() => setMetric('neetnk')}>NEET + not known</button>
            <button className={'nd-chip' + (metric === 'neet' ? ' active' : '')} onClick={() => setMetric('neet')}>NEET only</button>
            <button className={'nd-chip' + (metric === 'nk' ? ' active' : '')} onClick={() => setMetric('nk')}>Not known only</button>
          </div>
          <BubbleMap points={bubbles} max={metric === 'neet' ? 6 : 12} onHover={(p) => setSelectedLa(byName[p.name])} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: '0.74rem', color: '#64748b' }}>
            <span>Low</span>
            <span style={{ flex: 1, height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${rateColor(0)}, ${rateColor(6)}, ${rateColor(12)})` }} />
            <span>High</span>
          </div>
        </div>

        <div>
          <div className="nd-card" style={{ marginBottom: 16 }}>
            <div className="nd-card-title">By region</div>
            <div className="nd-card-desc">NEET or not known, 2025. North East flagged.</div>
            <RankedBars data={regionBars} labelWidth={150} max={8} />
          </div>
          <div className="nd-card">
            <div className="nd-card-title">The "not known" problem</div>
            <div className="nd-card-desc">Highest-rate authorities, split into confirmed NEET and activity not known. Where the amber dominates, the headline is largely a tracking failure, not measured disengagement.</div>
            <StackedBars data={topSplit} labelWidth={150} />
          </div>
        </div>
      </div>

      <h2 className="nd-h2">Every authority</h2>
      <div className="nd-chips">
        {FILTERS.map(f => <button key={f.k} className={'nd-chip' + (filter === f.k ? ' active' : '')} onClick={() => setFilter(f.k)}>{f.label}</button>)}
        <span style={{ alignSelf: 'center', fontSize: '0.78rem', color: '#94a3b8' }}>{las.length} authorities · click a column to sort, click a row for detail</span>
      </div>
      <div className="nd-card" style={{ padding: '6px 10px', maxHeight: 460, overflowY: 'auto' }}>
        <SortTable cols={cols} rows={las} initialSort="neetnk" onRowClick={setSelectedLa} />
      </div>

      <LaDrawer la={selectedLa} onClose={() => setSelectedLa(null)} />
      <p className="nd-note">Source: DfE, Participation and NEET age 16 to 17 by local authority, 2024/25 (figures are an average of Dec 2024 to Feb 2025). Coastal is an indicative list of coastal upper-tier authorities for discussion, not an official classification. Tendring/Clacton sit within Essex and Rhyl within Wales, so are not separately shown.</p>
    </div>
  );
}
