import React, { useState, useMemo, useRef } from 'react';
import Map, { Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { StackedBars, SortTable, RankedBars, TrendLine, Scatter, COL, pct, fmt0, fmt1, rateColor } from './charts';

const DRIVERS = { pa: { label: 'Persistent absence', unit: '%', max: 40 }, susp: { label: 'Suspension rate', unit: ' /100', max: 14 }, ehcp: { label: 'EHC plans /1,000', unit: '', max: 160 } };

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const MAP_MAX = { neetnk: 12, neet: 6, nk: 12, pa: 40, susp: 14, ehcp: 160 };
const MAP_UNIT = { neetnk: '%', neet: '%', nk: '%', pa: '%', susp: ' /100', ehcp: ' /1,000' };
function GeoMap({ las, metric, onSelect }) {
  const [hover, setHover] = useState(null);
  const isDriver = metric === 'pa' || metric === 'susp' || metric === 'ehcp';
  const max = MAP_MAX[metric] || 12;
  const unit = MAP_UNIT[metric] || '%';
  const geojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: las.filter(l => l.c).map(l => {
      const raw = isDriver ? (l.drivers && l.drivers[metric]) : l[metric];
      return { type: 'Feature', geometry: { type: 'Point', coordinates: l.c },
        properties: { name: l.name, v: raw == null ? 0 : raw, size: l.cohort || 0 } };
    }),
  }), [las, metric, isDriver]);
  const paint = {
    'circle-radius': ['interpolate', ['linear'], ['zoom'],
      5, ['interpolate', ['linear'], ['get', 'size'], 0, 3, 3000, 6, 10000, 12, 22000, 18],
      9, ['interpolate', ['linear'], ['get', 'size'], 0, 6, 3000, 13, 10000, 24, 22000, 36]],
    'circle-color': ['interpolate', ['linear'], ['get', 'v'], 0, 'rgb(13,122,66)', max / 2, 'rgb(232,146,14)', max, 'rgb(185,28,74)'],
    'circle-opacity': 0.82, 'circle-stroke-width': 0.7, 'circle-stroke-color': '#ffffff',
  };
  if (!MAPBOX_TOKEN) return <div style={{ height: 560, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', background: '#f1f5f9', borderRadius: 12, padding: 20 }}>Add your Mapbox token (VITE_MAPBOX_TOKEN) to show the basemap.</div>;
  return (
    <div style={{ height: 560, borderRadius: 12, overflow: 'hidden', position: 'relative', border: '1px solid #e2e8f0' }}>
      <Map mapboxAccessToken={MAPBOX_TOKEN} initialViewState={{ longitude: -1.9, latitude: 53.0, zoom: 5.1 }}
        style={{ width: '100%', height: '100%' }} mapStyle="mapbox://styles/mapbox/light-v11"
        interactiveLayerIds={['la-bubbles']}
        onMouseMove={e => { const f = e.features && e.features[0]; if (f) { setHover({ name: f.properties.name, v: f.properties.v, x: e.point.x, y: e.point.y }); e.target.getCanvas().style.cursor = 'pointer'; } else { setHover(null); e.target.getCanvas().style.cursor = ''; } }}
        onClick={e => { const f = e.features && e.features[0]; if (f) onSelect(f.properties.name); }}>
        <Source id="la-src" type="geojson" data={geojson}>
          <Layer id="la-bubbles" type="circle" paint={paint} />
        </Source>
      </Map>
      {hover && (
        <div style={{ position: 'absolute', left: Math.min(hover.x + 12, 320), top: Math.max(hover.y - 6, 6), background: '#0f172a', color: '#fff', padding: '5px 9px', borderRadius: 7, fontSize: '0.74rem', pointerEvents: 'none', fontWeight: 600, zIndex: 5, whiteSpace: 'nowrap' }}>{hover.name}: {fmt1(hover.v)}{unit}</div>
      )}
    </div>
  );
}

const drawerBtn = { flex: 1, border: '1px solid #cbd5e1', background: '#fff', borderRadius: 9, padding: '8px 10px', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 700, color: '#0f2440', cursor: 'pointer' };

function LaDrawer({ la, onClose, onPin, jumpToMap, pinned }) {
  if (!la) return null;
  const isPinned = pinned && pinned.find(p => p.name === la.name);
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
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button style={drawerBtn} onClick={() => jumpToMap && jumpToMap(la.name)}>View schools on map</button>
        <button style={{ ...drawerBtn, opacity: isPinned ? 0.5 : 1 }} disabled={isPinned} onClick={() => onPin && onPin(la)}>{isPinned ? 'Pinned' : 'Add to compare'}</button>
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
      {la.drivers && (la.drivers.pa != null || la.drivers.susp != null) && (<>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, margin: '18px 0 6px' }}>Drivers of NEET risk</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[['Persistent absence', la.drivers.pa, '%'], ['Overall absence', la.drivers.abs, '%'], ['Suspension rate', la.drivers.susp, ' /100'], ['EHC plans', la.drivers.ehcp, ' /1,000']].map(([l, v, u]) => (
            <div key={l} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, padding: '8px 10px' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f2440' }}>{v == null ? '–' : fmt1(v) + u}</div>
              <div style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 6 }}>Persistent absence and EHC plans are the two strongest predictors of becoming NEET.</div>
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

function WhatIf({ las }) {
  const [target, setTarget] = useState(5);
  const total = las.reduce((s, l) => s + (l.cohort || 0), 0);
  const curNK = las.reduce((s, l) => s + (l.nk / 100) * (l.cohort || 0), 0);
  const curNEET = las.reduce((s, l) => s + (l.neet / 100) * (l.cohort || 0), 0);
  const newNK = las.reduce((s, l) => s + (Math.min(l.nk, target) / 100) * (l.cohort || 0), 0);
  const recovered = Math.round(curNK - newNK);
  const above = las.filter(l => l.nk > target).length;
  const curC = (curNK + curNEET) / total * 100, newC = (newNK + curNEET) / total * 100;
  return (
    <div className="nd-card" style={{ marginTop: 16 }}>
      <div className="nd-card-title">What if every authority tracked young people well?</div>
      <div className="nd-card-desc">Drag to cap each authority's "activity not known" rate. This is the lever the data most clearly supports: better tracking, not just lower true NEET.</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '8px 0 14px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Cap not-known at</span>
        <input type="range" min="0" max="15" step="0.5" value={target} onChange={e => setTarget(parseFloat(e.target.value))} style={{ flex: 1, minWidth: 180, accentColor: '#b91c4a' }} />
        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#b91c4a', minWidth: 54 }}>{fmt1(target)}%</span>
      </div>
      <div className="nd-stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="nd-stat"><div className="accent" style={{ background: COL.green }} /><div className="v" style={{ color: COL.green }}>{recovered.toLocaleString('en-GB')}</div><div className="l">young people brought into view</div><div className="s">{above} authorities currently above the cap</div></div>
        <div className="nd-stat"><div className="accent" style={{ background: COL.amber }} /><div className="v" style={{ color: COL.amber }}>{pct((newNK / total) * 100)}</div><div className="l">national not-known</div><div className="s">down from {pct((curNK / total) * 100)}</div></div>
        <div className="nd-stat"><div className="accent" style={{ background: COL.crimson }} /><div className="v" style={{ color: COL.crimson }}>{pct(newC)}</div><div className="l">national NEET or not known</div><div className="s">down from {pct(curC)}</div></div>
      </div>
      <p className="nd-note">Illustrative: it assumes capping does not change confirmed NEET, only the tracking gap. It shows how much of the headline is a data problem we could fix.</p>
    </div>
  );
}

function CompareStrip({ items, onRemove }) {
  if (!items.length) return null;
  const rows = [['NEET or not known', l => pct(l.neetnk)], ['Confirmed NEET', l => pct(l.neet)], ['Not known', l => pct(l.nk)], ['Cohort', l => fmt0(l.cohort)], ['Year change (ppts)', l => l.annual_change == null ? '–' : (l.annual_change > 0 ? '+' : '') + fmt1(l.annual_change)], ['EHC plan NEET/NK', l => l.send && l.send.ehcp != null ? pct(l.send.ehcp) : '–']];
  return (
    <div className="nd-card" style={{ marginTop: 16 }}>
      <div className="nd-card-title">Comparing {items.length} {items.length === 1 ? 'authority' : 'authorities'}</div>
      <table className="nd-table" style={{ marginTop: 8 }}>
        <thead><tr><th></th>{items.map(l => <th key={l.name} className="num">{l.name} <span onClick={() => onRemove(l.name)} style={{ cursor: 'pointer', color: '#cbd5e1' }}>✕</span></th>)}</tr></thead>
        <tbody>{rows.map(([label, fn]) => <tr key={label}><td style={{ fontWeight: 600 }}>{label}</td>{items.map(l => <td key={l.name} className="num">{fn(l)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export default function Geography({ data, jumpToMap }) {
  const [filter, setFilter] = useState('all');
  const [metric, setMetric] = useState('neetnk');
  const [selectedLa, setSelectedLa] = useState(null);
  const [xDriver, setXDriver] = useState('pa');
  const [pinned, setPinned] = useState([]);
  const pin = (la) => setPinned(p => (p.find(x => x.name === la.name) || p.length >= 3) ? p : [...p, la]);
  const unpin = (name) => setPinned(p => p.filter(x => x.name !== name));
  const byName = useMemo(() => Object.fromEntries(data.las.map(l => [l.name, l])), [data.las]);

  const las = useMemo(() => data.las.filter(l =>
    filter === 'all' ? true : filter === 'ne' ? l.ne : filter === 'coastal' ? l.coastal : l.milburn
  ), [data.las, filter]);

  const regionBars = data.regions.map(r => ({ label: r.name, value: r.neetnk, color: rateColor(r.neetnk, 8), hl: r.name === 'North East', meta: r.ks4 }));
  const topSplit = [...las].sort((a, b) => b.neetnk - a.neetnk).slice(0, 16)
    .map(l => ({ label: l.name, a: l.neet, b: l.nk, hl: l.milburn }));

  const cols = [
    { key: 'name', label: 'Local authority', render: r => (<span>{r.name}{r.ne && <span className="pill nd-pill-ne" style={{ marginLeft: 6 }}>NE</span>}{r.coastal && <span className="pill nd-pill-co" style={{ marginLeft: 4 }}>Coast</span>}</span>) },
    { key: 'region', label: 'Region' },
    { key: 'neetnk', label: 'NEET / not known', num: true, render: r => <b>{pct(r.neetnk)}</b> },
    { key: 'neet', label: 'NEET', num: true, render: r => pct(r.neet) },
    { key: 'nk', label: 'Not known', num: true, render: r => pct(r.nk) },
    { key: 'pa', label: 'Persist. absence', num: true, render: r => r.pa == null ? '–' : fmt1(r.pa) + '%' },
    { key: 'ehcp', label: 'EHCP /1k', num: true, render: r => r.ehcp == null ? '–' : fmt1(r.ehcp) },
    { key: 'annual_change', label: 'Yr change', num: true, render: r => (r.annual_change == null ? '–' : (r.annual_change > 0 ? '+' : '') + fmt1(r.annual_change)) },
    { key: 'cohort', label: 'Cohort', num: true, render: r => fmt0(r.cohort) },
  ];
  const tableRows = las.map(l => ({ ...l, pa: l.drivers && l.drivers.pa, ehcp: l.drivers && l.drivers.ehcp }));

  return (
    <div className="nd-page-inner">
      <h1 className="nd-h1">Geography of risk</h1>
      <p className="nd-sub">Milburn's map of risk runs through the North and the coast. This view lets you rank every authority, and separates confirmed NEET from "activity not known" so you can see how much of a high rate is real disengagement and how much is a tracking gap.</p>

      <div className="nd-grid" style={{ gridTemplateColumns: '460px 1fr', alignItems: 'start' }}>
        <div className="nd-card">
          <div className="nd-card-title">England by local authority</div>
          <div className="nd-card-desc">Bubbles sit on each authority; size = cohort, colour = rate. Hover for figures, click for full detail. Zoom and pan like any map.</div>
          <div className="nd-chips">
            <button className={'nd-chip' + (metric === 'neetnk' ? ' active' : '')} onClick={() => setMetric('neetnk')}>NEET + not known</button>
            <button className={'nd-chip' + (metric === 'neet' ? ' active' : '')} onClick={() => setMetric('neet')}>NEET only</button>
            <button className={'nd-chip' + (metric === 'nk' ? ' active' : '')} onClick={() => setMetric('nk')}>Not known</button>
            <button className={'nd-chip' + (metric === 'pa' ? ' active' : '')} onClick={() => setMetric('pa')}>Persistent absence</button>
            <button className={'nd-chip' + (metric === 'susp' ? ' active' : '')} onClick={() => setMetric('susp')}>Suspensions</button>
            <button className={'nd-chip' + (metric === 'ehcp' ? ' active' : '')} onClick={() => setMetric('ehcp')}>EHC plans</button>
          </div>
          <GeoMap las={las} metric={metric} onSelect={(name) => setSelectedLa(byName[name])} />
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

      <div className="nd-card" style={{ marginTop: 16 }}>
        <div className="nd-card-title">What sits behind the risk</div>
        <div className="nd-card-desc">Each dot is an authority. Vertical axis: NEET or not known. Horizontal axis: the chosen driver. The upward drift is the risk-factor analysis playing out across places, persistent absence and EHC plans are the two strongest predictors of becoming NEET.</div>
        <div className="nd-chips">
          {Object.entries(DRIVERS).map(([k, v]) => <button key={k} className={'nd-chip' + (xDriver === k ? ' active' : '')} onClick={() => setXDriver(k)}>{v.label}</button>)}
        </div>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Scatter
            points={data.las.filter(l => l.drivers && l.drivers[xDriver] != null && l.neetnk != null).map(l => ({
              x: l.drivers[xDriver], y: l.neetnk, c: rateColor(l.neetnk, 12), name: l.name,
              extra: `${DRIVERS[xDriver].label} ${fmt1(l.drivers[xDriver])}${DRIVERS[xDriver].unit} · NEET/NK ${fmt1(l.neetnk)}%`,
            }))}
            xLabel={DRIVERS[xDriver].label} yLabel="NEET or not known (%)" xMax={DRIVERS[xDriver].max} yMax={24} />
        </div>
        <p className="nd-note">Drivers: persistent and overall absence are state-funded secondary 2024/25; suspension rate per 100 pupils 2024/25; EHC plans per 1,000 school pupils. Sources: DfE absence, suspensions and EHCP releases.</p>
      </div>

      <WhatIf las={data.las} />
      <CompareStrip items={pinned} onRemove={unpin} />

      <h2 className="nd-h2">Every authority</h2>
      <div className="nd-chips">
        {FILTERS.map(f => <button key={f.k} className={'nd-chip' + (filter === f.k ? ' active' : '')} onClick={() => setFilter(f.k)}>{f.label}</button>)}
        <span style={{ alignSelf: 'center', fontSize: '0.78rem', color: '#94a3b8' }}>{las.length} authorities · click a column to sort, click a row for detail</span>
      </div>
      <div className="nd-card" style={{ padding: '6px 10px', maxHeight: 460, overflowY: 'auto' }}>
        <SortTable cols={cols} rows={tableRows} initialSort="neetnk" onRowClick={setSelectedLa} />
      </div>

      <LaDrawer la={selectedLa} onClose={() => setSelectedLa(null)} onPin={pin} jumpToMap={jumpToMap} pinned={pinned} />
      <p className="nd-note">Source: DfE, Participation and NEET age 16 to 17 by local authority, 2024/25 (figures are an average of Dec 2024 to Feb 2025). Coastal is an indicative list of coastal upper-tier authorities for discussion, not an official classification. Tendring/Clacton sit within Essex and Rhyl within Wales, so are not separately shown.</p>
    </div>
  );
}
