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
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' });
  let question = '';
  try { question = (JSON.parse(event.body || '{}').question || '').toString().slice(0, 600); } catch { /* ignore */ }
  if (!question.trim()) return json(400, { error: 'no_question' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json(200, { answer: null, error: 'no_key' });

  const model = process.env.ASK_MODEL || 'claude-3-5-haiku-latest';
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model, max_tokens: 700, system: SYSTEM,
        messages: [{ role: 'user', content: question }],
      }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      return json(200, { answer: null, error: 'api_error', detail: t.slice(0, 300) });
    }
    const data = await resp.json();
    const answer = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
    return json(200, { answer });
  } catch (e) {
    return json(200, { answer: null, error: 'exception', detail: String(e).slice(0, 200) });
  }
};

function json(statusCode, body) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}
