import React, { useState, useEffect, useRef } from 'react';
import { RankedBars, TrendLine, COL, pct, fmt1, rateColor } from './charts';

const wmean = (arr, v) => { let n = 0, d = 0; arr.forEach(x => { if (x[v] != null && x.cohort) { n += x[v] * x.cohort; d += x.cohort; } }); return d ? n / d : null; };

// Preset structured answers — always correct, computed locally, work offline.
const PRESETS = [
  {
    label: 'Worst authorities overall',
    run: d => { const t = [...d.las].sort((a, b) => b.neetnk - a.neetnk).slice(0, 8);
      return { text: `The highest combined NEET or not-known rates are ${t[0].name} (${pct(t[0].neetnk)}) and ${t[1].name} (${pct(t[1].neetnk)}). Several are inflated by "not known" tracking gaps rather than confirmed NEET, so check the split before drawing conclusions.`,
        bars: t.map(l => ({ label: l.name, value: l.neetnk, color: rateColor(l.neetnk, 12), sub: l.region })) }; },
  },
  {
    label: 'Where tracking is worst',
    run: d => { const t = [...d.las].sort((a, b) => b.nk - a.nk).slice(0, 8);
      return { text: `Activity is least well tracked in ${t[0].name} (${pct(t[0].nk)} not known) and ${t[1].name} (${pct(t[1].nk)}). In these places the headline rate is largely a data gap, not measured disengagement.`,
        bars: t.map(l => ({ label: l.name, value: l.nk, color: COL.amber, sub: `NEET ${fmt1(l.neet)}%` })) }; },
  },
  {
    label: 'Selective vs non-selective',
    run: d => { const a = d.admissions;
      return { text: `Selective schools have ${pct(a.selective_ns)} of leavers with no sustained destination, against ${pct(a.nonselective_ns)} in non-selective schools, about ${fmt1(a.nonselective_ns / a.selective_ns)} times higher. For disadvantaged pupils the gap widens to ${fmt1(a.nonselective_dis_ns / a.selective_dis_ns)} times (${pct(a.selective_dis_ns)} vs ${pct(a.nonselective_dis_ns)}).`,
        bars: [{ label: 'Selective', value: a.selective_ns, color: COL.blue }, { label: 'Non-selective', value: a.nonselective_ns, color: COL.crimson }, { label: 'Selective (disadv.)', value: a.selective_dis_ns, color: COL.blue }, { label: 'Non-selective (disadv.)', value: a.nonselective_dis_ns, color: COL.crimson }] }; },
  },
  {
    label: 'SEND gradient',
    run: d => { const s = d.national.breakdowns.SEND;
      return { text: `NEET or not known rises sharply with need: ${pct(s['No SEN'])} for pupils with no identified need, ${pct(s['SEN support'])} on SEN support, and ${pct(s['SEN EHC/statement'])} with an EHC plan, roughly double.`,
        bars: [{ label: 'No SEN', value: s['No SEN'], color: rateColor(s['No SEN'], 11) }, { label: 'SEN support', value: s['SEN support'], color: rateColor(s['SEN support'], 11) }, { label: 'EHC plan', value: s['SEN EHC/statement'], color: rateColor(s['SEN EHC/statement'], 11) }] }; },
  },
  {
    label: 'How is the North East doing?',
    run: d => { const ne = d.regions.find(r => r.name === 'North East'); const las = d.las.filter(l => l.ne).sort((a, b) => b.neetnk - a.neetnk);
      return { text: `The North East sits at ${pct(ne.neetnk)} NEET or not known overall. Within it, ${las[0].name} is highest at ${pct(las[0].neetnk)} and ${las[las.length - 1].name} lowest at ${pct(las[las.length - 1].neetnk)}.`,
        bars: las.map(l => ({ label: l.name, value: l.neetnk, color: rateColor(l.neetnk, 12) })) }; },
  },
  {
    label: 'Coastal vs the rest',
    run: d => { const co = wmean(d.las.filter(l => l.coastal), 'neetnk'), rest = wmean(d.las.filter(l => !l.coastal), 'neetnk');
      return { text: `Across the indicative coastal authorities the combined rate averages ${pct(co)}, against ${pct(rest)} elsewhere. Coastal is an indicative grouping for discussion, not an official classification.`,
        bars: [{ label: 'Coastal', value: co, color: COL.crimson }, { label: 'Rest of England', value: rest, color: COL.blue }] }; },
  },
  {
    label: 'National trend',
    run: d => ({ text: `Nationally, NEET or not known among 16 to 17 year olds is ${pct(d.national.latest.neetnk)} in 2025, up from ${pct(d.national.ts[0].v)} in ${d.national.ts[0].y}, and rising every year since 2022.`, trend: d.national.ts }),
  },
  {
    label: 'Fastest-rising authorities',
    run: d => { const t = [...d.las].filter(l => l.annual_change != null).sort((a, b) => b.annual_change - a.annual_change).slice(0, 8);
      return { text: `The sharpest year-on-year rises are in ${t[0].name} (+${fmt1(t[0].annual_change)} ppts to ${pct(t[0].neetnk)}) and ${t[1].name} (+${fmt1(t[1].annual_change)} ppts).`,
        bars: t.map(l => ({ label: l.name, value: l.neetnk, color: rateColor(l.neetnk, 12), sub: `+${fmt1(l.annual_change)}ppts` })) }; },
  },
];

function matchPreset(q) {
  const s = q.toLowerCase();
  if (/track|not known|unknown|sight/.test(s)) return 1;
  if (/select|grammar|admis/.test(s)) return 2;
  if (/send|disab|ehc|special|need/.test(s)) return 3;
  if (/north east|\bne\b/.test(s)) return 4;
  if (/coast/.test(s)) return 5;
  if (/trend|rising|over time|year|trajector/.test(s)) return 6;
  if (/fast|increas|worse|rising/.test(s)) return 7;
  return 0;
}

const IDEA_EXAMPLES = ['Mandate Risk-of-NEET screening from Year 7', 'Pause the defunding of BTECs', 'Reform the post-16 maths and English resit rule', 'Make selective sixth-form admissions more inclusive'];
const IDEAGEN_EXAMPLES = ['Five moves for coastal authorities', 'Highest-return ideas for the North East', 'What would most help where tracking is worst?', 'Ideas to lift the lowest-attainment seats'];

function renderInline(text) {
  // split on **bold** and render strong
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>);
}

function MD({ text }) {
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }
    // table block
    if (line.trim().startsWith('|')) {
      const tbl = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { tbl.push(lines[i]); i++; }
      const rows = tbl.map(r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
      const body = rows.filter(r => !r.every(c => /^[-:]*$/.test(c)));
      const head = body[0] || [];
      blocks.push(
        <table className="nd-table" key={'t' + i} style={{ margin: '8px 0' }}>
          <thead><tr>{head.map((c, j) => <th key={j}>{renderInline(c)}</th>)}</tr></thead>
          <tbody>{body.slice(1).map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci}>{renderInline(c)}</td>)}</tr>)}</tbody>
        </table>
      );
      continue;
    }
    // heading
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) { blocks.push(<div key={'h' + i} style={{ fontWeight: 800, fontSize: '1rem', margin: '12px 0 4px' }}>{renderInline(h[2])}</div>); i++; continue; }
    // bullet list
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++; }
      blocks.push(<ul key={'u' + i} style={{ margin: '6px 0', paddingLeft: 20 }}>{items.map((it, j) => <li key={j} style={{ marginBottom: 3 }}>{renderInline(it)}</li>)}</ul>);
      continue;
    }
    blocks.push(<p key={'p' + i} style={{ margin: '0 0 8px', lineHeight: 1.55 }}>{renderInline(line)}</p>);
    i++;
  }
  return <div style={{ fontSize: '0.95rem', color: '#1e293b' }}>{blocks}</div>;
}

const CMAP = { crimson: '#b91c4a', amber: '#e8920e', blue: '#1d5a9e', green: '#0d7a42', navy: '#0f2440', slate: '#64748b', purple: '#7c3aed' };

// Parse an answer into ordered segments: prose, stat strips, and charts, so it renders like an infographic.
function parseAnswer(text) {
  const re = /```(chart|stats|json)\s*([\s\S]*?)```/gi;
  const segs = []; let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    const before = text.slice(last, m.index).trim();
    if (before) segs.push({ type: 'prose', text: before });
    let data = null; try { data = JSON.parse(m[2].trim()); } catch { /* ignore */ }
    if (data) {
      if (m[1].toLowerCase() === 'stats' && Array.isArray(data)) segs.push({ type: 'stats', items: data });
      else segs.push({ type: 'chart', spec: data });
    }
    last = re.lastIndex;
  }
  const tail = text.slice(last).trim();
  if (tail) segs.push({ type: 'prose', text: tail });
  return segs.length ? segs : [{ type: 'prose', text }];
}

function StatStrip({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, margin: '6px 0 14px' }}>
      {items.slice(0, 4).map((s, i) => {
        const c = CMAP[s.color] || COL.blue;
        return (
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '13px 15px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: c }} />
            <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: c, lineHeight: 1.05 }}>{s.value}</div>
            <div style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function AnswerChart({ chart }) {
  if (!chart || !Array.isArray(chart.data) || !chart.data.length) return null;
  const data = chart.data.map(d => ({ label: String(d.label), value: Number(d.value) })).filter(d => !isNaN(d.value));
  if (!data.length) return null;
  return (
    <div style={{ marginTop: 14, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
      {chart.title && <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>{chart.title}</div>}
      {chart.type === 'line'
        ? <div style={{ maxWidth: 520 }}><TrendLine series={data.map(d => ({ y: parseInt(d.label.slice(0, 4)) || d.label, v: d.value }))} color={COL.crimson} /></div>
        : <RankedBars data={data.map(d => ({ label: d.label, value: d.value, color: rateColor(d.value, Math.max(...data.map(x => x.value)) || 1) }))} unit={chart.unit || ''} labelWidth={150} max={Math.max(...data.map(d => d.value)) * 1.08} />}
    </div>
  );
}

export default function Ask({ onClose }) {
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [mode, setMode] = useState('ask');
  const inputRef = useRef();

  useEffect(() => { fetch('/neet_dashboard.json?v=' + Date.now()).then(r => r.json()).then(setData); }, []);
  useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  const runPreset = (i) => { setNote(''); setQ(PRESETS[i].label); setResult(PRESETS[i].run(data)); };

  const askFree = async (question) => {
    if (!question.trim() || !data) return;
    setLoading(true); setNote(''); setResult(null);
    try {
      const r = await fetch('/.netlify/functions/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question, mode }) });
      const j = await r.json();
      if (j && j.answer) { setResult({ segments: parseAnswer(j.answer) }); }
      else if (mode !== 'ask') {
        setNote(j && j.error === 'no_key' ? 'This mode needs the AI layer, which is not configured yet (no API key in Netlify).' : 'The AI layer could not be reached (' + ((j && (j.detail || j.error)) || 'no response') + ').');
      } else {
        const p = PRESETS[matchPreset(question)]; setResult(p.run(data));
        setNote(j && j.error === 'no_key' ? 'The AI layer is not configured yet, so here is the closest ready-made answer.' : 'AI layer error (' + ((j && (j.detail || j.error)) || 'no response') + '). Showing the closest ready-made answer.');
      }
    } catch (e) {
      if (mode === 'idea') setNote('Offline: testing an idea needs the AI layer.');
      else { const p = PRESETS[matchPreset(question)]; setResult(p.run(data)); setNote('Offline: showing the closest ready-made answer.'); }
    }
    setLoading(false);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '6vh 16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: 1040, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', fontFamily: "'Source Sans 3', sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 22px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Ask the data</span>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>NEET, destinations, admissions and need</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', border: 0, background: '#f1f5f9', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: '#475569' }}>✕</button>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 10, padding: 3, marginBottom: 14 }}>
            {[['ask', 'Ask a question'], ['ideas', 'Generate ideas'], ['idea', 'Test an idea']].map(([k, l]) => (
              <button key={k} onClick={() => { setMode(k); setResult(null); setNote(''); }} style={{ border: 0, background: mode === k ? '#0f2440' : 'transparent', color: mode === k ? '#fff' : '#475569', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem', padding: '6px 13px', borderRadius: 8, cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
          <form onSubmit={e => { e.preventDefault(); askFree(q); }} style={{ display: 'flex', gap: 8 }}>
            <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
              placeholder={mode === 'idea' ? 'Describe an idea, e.g. mandate Risk-of-NEET screening from Year 7' : mode === 'ideas' ? 'Ask for ideas, e.g. five moves for coastal authorities' : 'e.g. which coastal authorities track young people worst?'}
              style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.92rem', fontFamily: 'inherit' }} />
            <button type="submit" disabled={loading} style={{ padding: '0 18px', borderRadius: 10, border: 0, background: '#0f2440', color: '#fff', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>{loading ? '…' : mode === 'idea' ? 'Test' : mode === 'ideas' ? 'Ideas' : 'Ask'}</button>
          </form>

          {mode === 'idea' && <p style={{ margin: '12px 0 4px', fontSize: '0.82rem', color: '#64748b' }}>Describe a policy idea or "what if". It returns a verdict, what the data says, who it reaches and the risks, and what it would take to work.</p>}
          {mode === 'ideas' && <p style={{ margin: '12px 0 4px', fontSize: '0.82rem', color: '#64748b' }}>Ask for ideas for a place or theme. It proposes ranked, data-grounded interventions tied to the evidence and a rough modelled impact.</p>}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: mode === 'ask' ? 14 : 6 }}>
            {mode === 'idea'
              ? IDEA_EXAMPLES.map((ex, i) => <button key={i} onClick={() => { setQ(ex); askFree(ex); }} className="nd-chip" style={{ cursor: 'pointer' }}>{ex}</button>)
              : mode === 'ideas'
                ? IDEAGEN_EXAMPLES.map((ex, i) => <button key={i} onClick={() => { setQ(ex); askFree(ex); }} className="nd-chip" style={{ cursor: 'pointer' }}>{ex}</button>)
                : PRESETS.map((p, i) => <button key={i} onClick={() => runPreset(i)} className="nd-chip" style={{ cursor: 'pointer' }}>{p.label}</button>)}
          </div>

          {note && <div style={{ marginTop: 16, fontSize: '0.8rem', color: '#9a3412', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '8px 12px' }}>{note}</div>}
          {loading && (
            <div className="nd-thinking">
              <span className="nd-spinner" />
              <span className="nd-pulse">{mode === 'idea' ? 'Testing the idea against the data…' : mode === 'ideas' ? 'Generating ideas from the data…' : 'Reading the data and writing an answer…'}</span>
            </div>
          )}

          {result && !loading && (
            <div style={{ marginTop: 18, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e8edf3', borderRadius: 12, padding: '16px 18px' }}>
                {result.segments
                  ? result.segments.map((seg, i) => (
                    seg.type === 'stats' ? <StatStrip key={i} items={seg.items} />
                      : seg.type === 'chart' ? <AnswerChart key={i} chart={seg.spec} />
                        : <MD key={i} text={seg.text} />
                  ))
                  : <>
                    <MD text={result.text} />
                    {result.bars && <div style={{ marginTop: 12 }}><RankedBars data={result.bars} labelWidth={170} max={Math.max(...result.bars.map(b => b.value)) * 1.05} /></div>}
                    {result.trend && <div style={{ marginTop: 12, maxWidth: 520 }}><TrendLine series={result.trend} color={COL.crimson} /></div>}
                  </>}
              </div>
              <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#94a3b8' }}>Generated from the published DfE figures in this dashboard. Check key numbers before quoting.</div>
            </div>
          )}

          {!result && !loading && !note && (
            <p style={{ marginTop: 18, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>{mode === 'idea' ? 'Pick an example above or describe your own idea to stress-test it against the data.' : 'Pick a question above for an instant, sourced answer, or type your own.'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
