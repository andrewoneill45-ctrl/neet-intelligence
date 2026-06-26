// Netlify Function: "Ask the data" — natural-language Q&A over the NEET brief.
// Requires env var ANTHROPIC_API_KEY (set in Netlify → Site configuration → Environment variables).
// Optional env var ASK_MODEL (defaults to a fast Claude model).
const brief = require('./neet-brief.json');

const SYSTEM = `You are the analyst for an Education and Skills roundtable on the NEET (not in education, employment or training) crisis. You answer strictly from the JSON dataset provided below. Rules:
- Use ONLY the figures in the data. Never invent or estimate numbers that are not present.
- If the answer is not derivable from the data, say so plainly and suggest what is available.
- Be concise and direct: lead with the answer and the key figure, then at most two sentences of context.
- Use British English. No em dashes. Percentages to one decimal place.
- "NEET or not known" combines confirmed NEET with "activity not known" (a tracking gap). Distinguish them when it matters; a high rate driven by "not known" is a tracking problem, not measured disengagement.
- "No sustained destination" is the school-level proxy for NEET, from KS4 destination measures (2022/23 cohort).
- When ranking or comparing places, name them and give their figures.
- This is for senior policy officials; be rigorous and neutral.

DATASET (England; 16-17 NEET is 2025 unless a trend year is given):
` + JSON.stringify(brief);

exports.handler = async (event) => {
  const KEY = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_KEY || process.env.ANTHROPIC_KEY;
  const MODEL = process.env.ASK_MODEL || 'claude-3-5-sonnet-latest';
  // Health check (GET): reports whether the function can see a key. Add ?test=1 to make a tiny live call.
  if (event.httpMethod === 'GET') {
    const src = process.env.ANTHROPIC_API_KEY ? 'ANTHROPIC_API_KEY' : process.env.VITE_ANTHROPIC_KEY ? 'VITE_ANTHROPIC_KEY' : process.env.ANTHROPIC_KEY ? 'ANTHROPIC_KEY' : null;
    const base = { status: 'ok', keyPresent: !!src, keySource: src, model: MODEL, briefLoaded: !!(brief && brief.national) };
    if (!(event.queryStringParameters && event.queryStringParameters.test) || !KEY) return json(200, base);
    const probe = ['claude-3-5-sonnet-latest', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-latest', 'claude-3-5-haiku-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229', 'claude-sonnet-4-20250514'];
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
  let question = '';
  try { question = (JSON.parse(event.body || '{}').question || '').toString().slice(0, 600); } catch { /* ignore */ }
  if (!question.trim()) return json(400, { error: 'no_question' });

  if (!KEY) return json(200, { answer: null, error: 'no_key' });

  // Try the configured model, then fall back to widely-available models if it is not found for this key.
  const candidates = process.env.ASK_MODEL
    ? [process.env.ASK_MODEL]
    : ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-haiku-20240307'];
  let lastDetail = '';
  for (const m of candidates) {
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: m, max_tokens: 700, system: SYSTEM, messages: [{ role: 'user', content: question }] }),
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
