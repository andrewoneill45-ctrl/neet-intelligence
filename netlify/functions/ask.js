// Netlify Function: "Ask the data" — natural-language Q&A over the NEET brief.
// Requires env var ANTHROPIC_API_KEY (set in Netlify → Site configuration → Environment variables).
// Optional env var ASK_MODEL (defaults to a fast Claude model).
const brief = require('./neet-brief.json');

const DATA = `

DATASET (England; 16-17 NEET is 2025 unless a trend year is given):
` + JSON.stringify(brief);

const RULES = `
- Use ONLY the figures in the data. Never invent or estimate numbers that are not present. If something is not derivable from the data, say so.
- "NEET or not known" combines confirmed NEET with "activity not known" (a tracking gap); a high rate driven by "not known" is a tracking problem, not measured disengagement. "No sustained destination" is the school-level NEET proxy from KS4 destinations (2022/23).
- British English. No em dashes. Percentages to one decimal place. This is for senior policy officials: rigorous and neutral.
FORMATTING: keep prose tight and punchy, no markdown tables or "#" headings, use bold labels and short bullets. Lead with the direct answer.`;

const VISUAL = `
VISUAL OUTPUT (make answers vivid and impressive): you may embed fenced blocks the interface renders as graphics. Use them generously, but only with figures present in the dataset.
1) Lead most answers with a headline stat strip:
\`\`\`stats
[{"value":"21.5%","label":"Dudley: NEET or not known","color":"crimson"},{"value":"19.1%","label":"of which, not known","color":"amber"}]
\`\`\`
Use 2 to 4 stats. "value" is a short string (e.g. "337,140", "5x", "£15"). "color" is one of crimson, amber, blue, green, navy, purple.
2) Add one or more charts for any ranking, comparison or trend:
\`\`\`chart
{"type":"bar","title":"Confirmed NEET, weakest coastal authorities","unit":"%","data":[{"label":"Blackpool","value":7.6},{"label":"Medway","value":6.6}]}
\`\`\`
Use "type":"line" for a time trend (labels are years). At most 8 data points per chart; you may include more than one chart. Keep the prose between blocks to a sentence or two. A great answer reads like a mini infographic: a stat strip, a sharp sentence, a chart, a short interpretation. Never invent numbers.`;

const SYSTEM = `You are the analyst for an Education and Skills roundtable on the NEET (not in education, employment or training) crisis. Answer the user's question strictly from the dataset.` + RULES + VISUAL + DATA;

const IDEAS_SYSTEM = `You are a sharp policy adviser generating fresh ideas for an Education and Skills sprint on reducing 16-24 NEET, using the dataset as your evidence base. The user asks for ideas, often for a place (a region, authority or seat) or a theme. Propose three to five specific, actionable interventions, ranked by likely impact per pound on the 16-24 NEET rate.
Open with a stat strip of the key numbers for the place or theme, then for each idea a bold one-line title on its own line, two or three short lines (rationale citing specific figures and naming the place; the phase and Section 5 lever; a rough modelled impact and cost from policy_levers_with_modelled_impact), and add a chart where it sharpens the case. Favour non-obvious, well-evidenced moves over generic ones; be honest where evidence is thin. Finish with one line on the main risk to watch.` + RULES + VISUAL + DATA;

const IDEA_SYSTEM = `You are a sharp, candid policy analyst stress-testing an idea for an Education and Skills roundtable on the NEET crisis, using the dataset as your evidence base. The user describes a policy idea or "what if". Assess it against the data.
Structure your answer in four short labelled parts, using bold labels on their own line (not "#" headings):
**Verdict** — one line: Promising, Mixed, or Weak on the current evidence, with a one-clause reason.
**What the data says** — 2 to 4 sentences citing specific figures from the dataset that bear on the idea.
**Who it reaches and risks** — who would benefit, who it would miss, and the main risks or unintended effects.
**To make it work** — 1 to 2 concrete conditions for success.
Be honest, including when the data is silent or only partly relevant. Tie back to the real numbers wherever you can. You may open with a stat strip and add a chart where it helps.` + RULES + VISUAL + DATA;

exports.handler = async (event) => {
  const KEY = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_KEY || process.env.ANTHROPIC_KEY;
  const MODEL = process.env.ASK_MODEL || 'claude-sonnet-4-6';
  // Health check (GET): reports whether the function can see a key. Add ?test=1 to make a tiny live call.
  if (event.httpMethod === 'GET') {
    const src = process.env.ANTHROPIC_API_KEY ? 'ANTHROPIC_API_KEY' : process.env.VITE_ANTHROPIC_KEY ? 'VITE_ANTHROPIC_KEY' : process.env.ANTHROPIC_KEY ? 'ANTHROPIC_KEY' : null;
    const base = { status: 'ok', keyPresent: !!src, keySource: src, model: MODEL, briefLoaded: !!(brief && brief.national) };
    if (!(event.queryStringParameters && event.queryStringParameters.test) || !KEY) return json(200, base);
    const probe = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-8'];
    const results = [];
    for (const m of probe) {
      try {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: m, max_tokens: 8, messages: [{ role: 'user', content: 'ok' }] }),
        });
        let errType = '';
        if (!resp.ok) { try { errType = (JSON.parse(await resp.text()).error || {}).type || ''; } catch { /* */ } }
        results.push({ model: m, status: resp.status, ok: resp.ok, error: errType });
      } catch (e) { results.push({ model: m, error: String(e).slice(0, 120) }); }
    }
    return json(200, { ...base, probe: results });
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' });
  let question = '', mode = 'ask';
  try { const b = JSON.parse(event.body || '{}'); question = (b.question || '').toString().slice(0, 800); mode = ['idea', 'ideas'].includes(b.mode) ? b.mode : 'ask'; } catch { /* ignore */ }
  if (!question.trim()) return json(400, { error: 'no_question' });

  if (!KEY) return json(200, { answer: null, error: 'no_key' });
  const system = mode === 'idea' ? IDEA_SYSTEM : mode === 'ideas' ? IDEAS_SYSTEM : SYSTEM;
  const maxTokens = mode === 'ask' ? 600 : 1000;

  // Try the configured model, then fall back to widely-available models if it is not found for this key.
  const candidates = process.env.ASK_MODEL
    ? [process.env.ASK_MODEL]
    : ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-8'];
  let lastDetail = '';
  for (const m of candidates) {
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: m, max_tokens: maxTokens, system, messages: [{ role: 'user', content: question }] }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const answer = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
        return json(200, { answer, model: m });
      }
      lastDetail = (await resp.text()).slice(0, 300);
      if (resp.status !== 404) return json(200, { answer: null, error: 'api_error', detail: lastDetail });
      // 404 (model not found): try the next candidate
    } catch (e) {
      return json(200, { answer: null, error: 'exception', detail: String(e).slice(0, 200) });
    }
  }
  return json(200, { answer: null, error: 'no_available_model', detail: lastDetail });
};

function json(statusCode, body) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}
