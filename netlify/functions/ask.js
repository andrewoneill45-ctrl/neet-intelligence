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
FORMATTING (important): Keep it short, roughly 120 to 180 words. Write in plain prose. Do NOT use markdown tables or "#" headings. If you must list places, use at most five bullet points, each one short line ("Blackpool: 8.9%"). Lead with the direct answer.`;

const CHART = `
CHART: If the answer involves a ranking, comparison, or a trend over time, append exactly ONE chart at the very end, as a fenced code block labelled chart containing compact JSON:
\`\`\`chart
{"type":"bar","title":"Confirmed NEET, weakest coastal authorities","unit":"%","data":[{"label":"Blackpool","value":7.6},{"label":"Medway","value":6.6}]}
\`\`\`
Use "line" for a time trend (labels are years). Use only figures from the dataset, at most 8 data points, ordered most to least. Put nothing after the chart block. If a chart would not help, omit it entirely.`;

const SYSTEM = `You are the analyst for an Education and Skills roundtable on the NEET (not in education, employment or training) crisis. Answer the user's question strictly from the dataset.` + RULES + CHART + DATA;

const IDEA_SYSTEM = `You are a sharp, candid policy analyst stress-testing an idea for an Education and Skills roundtable on the NEET crisis, using the dataset as your evidence base. The user describes a policy idea or "what if". Assess it against the data.
Structure your answer in four short labelled parts, using bold labels on their own line (not "#" headings):
**Verdict** — one line: Promising, Mixed, or Weak on the current evidence, with a one-clause reason.
**What the data says** — 2 to 4 sentences citing specific figures from the dataset that bear on the idea.
**Who it reaches and risks** — who would benefit, who it would miss, and the main risks or unintended effects.
**To make it work** — 1 to 2 concrete conditions for success.
Be honest, including when the data is silent or only partly relevant. Tie back to the real numbers wherever you can.` + RULES + DATA;

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
  try { const b = JSON.parse(event.body || '{}'); question = (b.question || '').toString().slice(0, 800); mode = b.mode === 'idea' ? 'idea' : 'ask'; } catch { /* ignore */ }
  if (!question.trim()) return json(400, { error: 'no_question' });

  if (!KEY) return json(200, { answer: null, error: 'no_key' });
  const system = mode === 'idea' ? IDEA_SYSTEM : SYSTEM;
  const maxTokens = mode === 'idea' ? 900 : 600;

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
