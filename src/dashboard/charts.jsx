import React, { useState } from 'react';

export const COL = {
  navy: '#0f2440', blue: '#1d5a9e', blueLt: '#7fb0e0', crimson: '#b91c4a',
  green: '#0d7a42', amber: '#e8920e', slate: '#64748b', track: '#eef2f7', grid: '#e2e8f0',
};
export const fmt1 = (v) => v == null ? '–' : (Math.round(v * 10) / 10).toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const fmt0 = (v) => v == null ? '–' : Math.round(v).toLocaleString('en-GB');
export const pct = (v) => v == null ? '–' : fmt1(v) + '%';

// colour ramp for NEET/not-sustained rate (green -> amber -> red)
export function rateColor(v, max = 12) {
  if (v == null) return '#cbd5e1';
  const t = Math.max(0, Math.min(1, v / max));
  const stops = [[13, 122, 66], [232, 146, 14], [185, 28, 74]];
  const seg = t < 0.5 ? 0 : 1, lt = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
  const a = stops[seg], b = stops[seg + 1];
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * lt));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function StatCard({ value, label, sub, accent = COL.blue }) {
  return (
    <div className="nd-stat">
      <div className="accent" style={{ background: accent }} />
      <div className="v" style={{ color: accent }}>{value}</div>
      <div className="l">{label}</div>
      {sub && <div className="s">{sub}</div>}
    </div>
  );
}

function Ks4HoverCard({ name, meta, x, y }) {
  const rows = [['Attainment 8', meta.att8 == null ? '–' : fmt1(meta.att8)], ['Progress 8 (2024)', meta.p8 == null ? '–' : (meta.p8 > 0 ? '+' : '') + fmt1(meta.p8)], ['5+ in English & maths', meta.basics5 == null ? '–' : fmt1(meta.basics5) + '%'], ['4+ in English & maths', meta.basics4 == null ? '–' : fmt1(meta.basics4) + '%']];
  return (
    <div style={{ position: 'fixed', left: Math.min(x + 14, window.innerWidth - 230), top: y + 12, background: '#0f172a', color: '#fff', borderRadius: 10, padding: '10px 12px', zIndex: 60, pointerEvents: 'none', width: 210, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
      <div style={{ fontWeight: 800, fontSize: '0.82rem', marginBottom: 6 }}>{name}</div>
      <div style={{ fontSize: '0.66rem', color: '#93b4dd', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Attainment, this region</div>
      {rows.map(([l, v], i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '2px 0' }}>
          <span style={{ color: '#cbd5e1' }}>{l}</span><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

// Horizontal ranked bars. data: [{label, value, color?, hl?, sub?, meta?}]
export function RankedBars({ data, max, unit = '%', labelWidth = 150 }) {
  const [hover, setHover] = useState(null);
  const mx = max || Math.max(...data.map(d => d.value || 0)) * 1.05 || 1;
  return (
    <div>
      {data.map((d, i) => (
        <div className={'nd-bar-row' + (d.hl ? ' hl' : '')} key={i} style={{ gridTemplateColumns: `${labelWidth}px 1fr 56px`, cursor: d.meta ? 'pointer' : 'default' }}
          onMouseEnter={d.meta ? e => setHover({ i, x: e.clientX, y: e.clientY }) : undefined}
          onMouseMove={d.meta ? e => setHover({ i, x: e.clientX, y: e.clientY }) : undefined}
          onMouseLeave={d.meta ? () => setHover(null) : undefined}>
          <span className="lab" title={d.label}>{d.label}{d.sub ? <span style={{ color: '#94a3b8', fontWeight: 400 }}> · {d.sub}</span> : null}{d.meta ? <span style={{ color: '#cbd5e1', fontWeight: 700 }}> ⓘ</span> : null}</span>
          <span className="nd-bar-track"><span className="nd-bar-fill" style={{ width: `${Math.max(1, (d.value / mx) * 100)}%`, background: d.color || COL.blue }} /></span>
          <span className="val">{d.value == null ? '–' : fmt1(d.value)}{unit}</span>
        </div>
      ))}
      {hover && data[hover.i] && data[hover.i].meta && <Ks4HoverCard name={data[hover.i].label} meta={data[hover.i].meta} x={hover.x} y={hover.y} />}
    </div>
  );
}

// Stacked horizontal bars showing two parts (e.g., NEET + not known). data:[{label, a, b, hl}]
export function StackedBars({ data, max, aLabel = 'NEET', bLabel = 'Not known', aColor = COL.crimson, bColor = COL.amber, labelWidth = 150 }) {
  const mx = max || Math.max(...data.map(d => (d.a || 0) + (d.b || 0))) * 1.05 || 1;
  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: aColor, borderRadius: 2, marginRight: 5 }} />{aLabel}</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: bColor, borderRadius: 2, marginRight: 5 }} />{bLabel}</span>
      </div>
      {data.map((d, i) => (
        <div className={'nd-bar-row' + (d.hl ? ' hl' : '')} key={i} style={{ gridTemplateColumns: `${labelWidth}px 1fr 56px` }}>
          <span className="lab" title={d.label}>{d.label}</span>
          <span className="nd-bar-track">
            <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(d.a / mx) * 100}%`, background: aColor }} />
            <span style={{ position: 'absolute', left: `${(d.a / mx) * 100}%`, top: 0, bottom: 0, width: `${(d.b / mx) * 100}%`, background: bColor }} />
          </span>
          <span className="val">{fmt1((d.a || 0) + (d.b || 0))}%</span>
        </div>
      ))}
    </div>
  );
}

// Trend line. series:[{y,v}]. highlightFrom optional year to shade.
export function TrendLine({ series, width = 560, height = 220, color = COL.crimson, yLabel = '%', yMin, yMax }) {
  const pad = { l: 38, r: 16, t: 14, b: 26 };
  const xs = series.map(d => d.y), vs = series.map(d => d.v);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const lo = yMin != null ? yMin : Math.min(...vs) - 0.5, hi = yMax != null ? yMax : Math.max(...vs) + 0.5;
  const px = y => pad.l + (x1 === x0 ? 0 : (y - x0) / (x1 - x0)) * (width - pad.l - pad.r);
  const py = v => pad.t + (1 - (v - lo) / (hi - lo)) * (height - pad.t - pad.b);
  const path = series.map((d, i) => `${i ? 'L' : 'M'}${px(d.y).toFixed(1)},${py(d.v).toFixed(1)}`).join(' ');
  const ticks = []; for (let g = Math.ceil(lo); g <= hi; g++) ticks.push(g);
  return (
    <svg className="nd-chart" viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
      {ticks.map(t => (
        <g key={t}>
          <line x1={pad.l} x2={width - pad.r} y1={py(t)} y2={py(t)} stroke={COL.grid} strokeWidth="1" />
          <text x={pad.l - 6} y={py(t) + 3} textAnchor="end" fontSize="10" fill="#94a3b8">{t}{yLabel}</text>
        </g>
      ))}
      {series.map(d => <text key={d.y} x={px(d.y)} y={height - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.y}</text>)}
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {series.map(d => <circle key={d.y} cx={px(d.y)} cy={py(d.v)} r="3.5" fill="#fff" stroke={color} strokeWidth="2" />)}
      {series.map(d => <text key={'t' + d.y} x={px(d.y)} y={py(d.v) - 9} textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>{fmt1(d.v)}</text>)}
    </svg>
  );
}

// Grouped vertical bars. groups:[{label, bars:[{v,color,name}]}]
export function GroupedBars({ groups, width = 520, height = 240, unit = '%', maxV }) {
  const pad = { l: 36, r: 12, t: 18, b: 40 };
  const mx = maxV || Math.max(...groups.flatMap(g => g.bars.map(b => b.v || 0))) * 1.15 || 1;
  const gw = (width - pad.l - pad.r) / groups.length;
  const py = v => pad.t + (1 - v / mx) * (height - pad.t - pad.b);
  return (
    <svg className="nd-chart" viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
      {[0, 0.25, 0.5, 0.75, 1].map(f => { const v = mx * f; return (
        <g key={f}><line x1={pad.l} x2={width - pad.r} y1={py(v)} y2={py(v)} stroke={COL.grid} /><text x={pad.l - 5} y={py(v) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{fmt1(v)}</text></g>); })}
      {groups.map((g, gi) => {
        const n = g.bars.length, bw = Math.min(46, (gw - 14) / n), x0 = pad.l + gi * gw + (gw - bw * n) / 2;
        return (
          <g key={gi}>
            {g.bars.map((b, bi) => {
              const x = x0 + bi * bw, h = (height - pad.t - pad.b) - (py(b.v) - pad.t);
              return (<g key={bi}>
                <rect x={x + 2} y={py(b.v)} width={bw - 4} height={Math.max(0, h)} rx="3" fill={b.color} />
                <text x={x + bw / 2} y={py(b.v) - 4} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={b.color}>{fmt1(b.v)}{unit}</text>
              </g>);
            })}
            <text x={pad.l + gi * gw + gw / 2} y={height - 24} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#334155">{g.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Legend({ items }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.76rem', color: '#475569', fontWeight: 600, marginTop: 4 }}>
      {items.map((it, i) => <span key={i}><span style={{ display: 'inline-block', width: 11, height: 11, background: it.color, borderRadius: 3, marginRight: 5, verticalAlign: 'middle' }} />{it.label}</span>)}
    </div>
  );
}

// England bubble map from [lng,lat] centroids. points:[{c:[lng,lat], v, size, name, hl}]
export function BubbleMap({ points, width = 460, height = 580, max = 12, onHover }) {
  const [hover, setHover] = useState(null);
  const pts = points.filter(p => p.c);
  const lngs = pts.map(p => p.c[0]), lats = pts.map(p => p.c[1]);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs), minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const cosLat = Math.cos((53) * Math.PI / 180);
  const pad = 28;
  const spanX = (maxLng - minLng) * cosLat, spanY = (maxLat - minLat);
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);
  const offX = (width - spanX * scale) / 2, offY = (height - spanY * scale) / 2;
  const X = lng => offX + (lng - minLng) * cosLat * scale;
  const Y = lat => offY + (maxLat - lat) * scale;
  const maxSize = Math.max(...pts.map(p => p.size || 1));
  const r = s => 4 + Math.sqrt((s || 1) / maxSize) * 16;
  const sorted = [...pts].sort((a, b) => (b.size || 0) - (a.size || 0));
  return (
    <div style={{ position: 'relative' }}>
      <svg className="nd-chart" viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxHeight: 580 }}>
        {sorted.map((p, i) => (
          <circle key={i} cx={X(p.c[0])} cy={Y(p.c[1])} r={r(p.size)}
            fill={rateColor(p.v, max)} fillOpacity={0.78} stroke={p.hl ? '#0f172a' : '#fff'} strokeWidth={p.hl ? 1.6 : 0.6}
            onMouseEnter={() => setHover({ ...p, x: X(p.c[0]), y: Y(p.c[1]) })} onMouseLeave={() => setHover(null)}
            onClick={() => onHover && onHover(p)}
            style={{ cursor: 'pointer' }} />
        ))}
      </svg>
      {hover && (
        <div style={{ position: 'absolute', left: `${(hover.x / width) * 100}%`, top: `${(hover.y / height) * 100}%`, transform: 'translate(-50%,-130%)', background: '#0f172a', color: '#fff', padding: '6px 10px', borderRadius: 8, fontSize: '0.76rem', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 5, fontWeight: 600 }}>
          {hover.name}: {pct(hover.v)}
        </div>
      )}
    </div>
  );
}

// Multi-line trend over an index axis. lines:[{name,color,values:[]}], labels aligned to values; tick text shown where labels[i] is non-empty.
export function MultiLine({ lines, labels, width = 660, height = 250, yLabel = '' }) {
  const pad = { l: 46, r: 12, t: 14, b: 28 };
  const n = labels.length;
  const allV = lines.flatMap(l => l.values).filter(v => v != null);
  const max = Math.max(...allV) * 1.08 || 1;
  const X = i => pad.l + (n <= 1 ? 0 : i / (n - 1)) * (width - pad.l - pad.r);
  const Y = v => pad.t + (1 - v / max) * (height - pad.t - pad.b);
  const path = vals => vals.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => max * f);
  return (
    <div>
      <svg className="nd-chart" viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        {ticks.map((t, i) => <g key={i}><line x1={pad.l} x2={width - pad.r} y1={Y(t)} y2={Y(t)} stroke={COL.grid} /><text x={pad.l - 5} y={Y(t) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{fmt0(t)}</text></g>)}
        {labels.map((lab, i) => lab ? <g key={i}><line x1={X(i)} x2={X(i)} y1={pad.t} y2={height - pad.b} stroke="#f1f5f9" /><text x={X(i)} y={height - 8} textAnchor="middle" fontSize="9" fill="#94a3b8">{lab}</text></g> : null)}
        {lines.map((l, li) => <path key={li} d={path(l.values)} fill="none" stroke={l.color} strokeWidth="2.2" strokeLinejoin="round" />)}
      </svg>
      <Legend items={lines.map(l => ({ label: l.name, color: l.color }))} />
    </div>
  );
}

// Interactive scatter. points:[{x,y,c,name,extra}]. refLine draws y=x.
export function Scatter({ points, width = 520, height = 380, xLabel, yLabel, xMax, yMax, refLine = false, fit = false }) {
  const [hover, setHover] = useState(null);
  const pad = { l: 44, r: 14, t: 14, b: 38 };
  const mx = xMax || Math.max(...points.map(p => p.x)) * 1.05 || 1;
  const my = yMax || Math.max(...points.map(p => p.y)) * 1.05 || 1;
  const X = v => pad.l + (v / mx) * (width - pad.l - pad.r);
  const Y = v => pad.t + (1 - v / my) * (height - pad.t - pad.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  // Least-squares fit and Pearson correlation
  let line = null, rTxt = null;
  if (fit && points.length > 2) {
    const n = points.length;
    const sx = points.reduce((a, p) => a + p.x, 0), sy = points.reduce((a, p) => a + p.y, 0);
    const mxv = sx / n, myv = sy / n;
    let cov = 0, vx = 0, vy = 0;
    points.forEach(p => { cov += (p.x - mxv) * (p.y - myv); vx += (p.x - mxv) ** 2; vy += (p.y - myv) ** 2; });
    if (vx > 0 && vy > 0) {
      const slope = cov / vx, intc = myv - slope * mxv, r = cov / Math.sqrt(vx * vy);
      const x0 = 0, x1 = mx, y0 = intc, y1 = intc + slope * mx;
      line = { x0, y0: Math.max(0, Math.min(my, y0)), x1, y1: Math.max(0, Math.min(my, y1)) };
      rTxt = `r = ${(Math.round(r * 100) / 100).toFixed(2)}`;
    }
  }
  return (
    <div style={{ position: 'relative' }}>
      <svg className="nd-chart" viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        {ticks.map(f => (<g key={'x' + f}>
          <line x1={X(mx * f)} x2={X(mx * f)} y1={pad.t} y2={height - pad.b} stroke={COL.grid} />
          <text x={X(mx * f)} y={height - pad.b + 14} textAnchor="middle" fontSize="9" fill="#94a3b8">{fmt1(mx * f)}</text>
        </g>))}
        {ticks.map(f => (<g key={'y' + f}>
          <line x1={pad.l} x2={width - pad.r} y1={Y(my * f)} y2={Y(my * f)} stroke={COL.grid} />
          <text x={pad.l - 5} y={Y(my * f) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{fmt1(my * f)}</text>
        </g>))}
        {refLine && <line x1={X(0)} y1={Y(0)} x2={X(Math.min(mx, my))} y2={Y(Math.min(mx, my))} stroke="#cbd5e1" strokeDasharray="4 4" />}
        {line && <line x1={X(line.x0)} y1={Y(line.y0)} x2={X(line.x1)} y2={Y(line.y1)} stroke={COL.navy} strokeWidth="2" strokeDasharray="6 3" />}
        {rTxt && <text x={width - pad.r - 4} y={pad.t + 12} textAnchor="end" fontSize="11" fontWeight="700" fill={COL.navy}>{rTxt}</text>}
        {points.map((p, i) => (
          <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={hover === i ? 5 : 2.8} fill={p.c} fillOpacity={hover === i ? 1 : 0.5}
            stroke={hover === i ? '#0f172a' : 'none'} strokeWidth="1"
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }} />
        ))}
        <text x={(width) / 2} y={height - 2} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#475569">{xLabel}</text>
        <text x={-(height / 2)} y={12} transform="rotate(-90)" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#475569">{yLabel}</text>
      </svg>
      {hover != null && (
        <div style={{ position: 'absolute', left: `${(X(points[hover].x) / width) * 100}%`, top: `${(Y(points[hover].y) / height) * 100}%`, transform: 'translate(-50%,-120%)', background: '#0f172a', color: '#fff', padding: '6px 10px', borderRadius: 8, fontSize: '0.74rem', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 5, fontWeight: 600, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {points[hover].name}{points[hover].extra ? ` · ${points[hover].extra}` : ''}
        </div>
      )}
    </div>
  );
}

// Sortable table. cols:[{key,label,num,render}], rows:[]
export function SortTable({ cols, rows, initialSort, initialDir = 'desc', onRowClick }) {
  const [sort, setSort] = useState(initialSort || cols[0].key);
  const [dir, setDir] = useState(initialDir);
  const sorted = [...rows].sort((a, b) => {
    const av = a[sort], bv = b[sort];
    if (av == null) return 1; if (bv == null) return -1;
    if (typeof av === 'number') return dir === 'desc' ? bv - av : av - bv;
    return dir === 'desc' ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
  });
  const click = k => { if (k === sort) setDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSort(k); setDir('desc'); } };
  return (
    <table className="nd-table">
      <thead><tr>{cols.map(c => <th key={c.key} className={c.num ? 'num' : ''} onClick={() => click(c.key)}>{c.label}{sort === c.key ? (dir === 'desc' ? ' ▾' : ' ▴') : ''}</th>)}</tr></thead>
      <tbody>{sorted.map((row, i) => <tr key={i} onClick={() => onRowClick && onRowClick(row)} style={onRowClick ? { cursor: 'pointer' } : undefined}>{cols.map(c => <td key={c.key} className={c.num ? 'num' : ''}>{c.render ? c.render(row) : row[c.key]}</td>)}</tr>)}</tbody>
    </table>
  );
}
