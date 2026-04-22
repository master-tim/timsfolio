import type { APIRoute } from 'astro';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-haiku-4.5';

const SYSTEM_FACTS = [
  'Currently @ Redbrick (Seoul, KR), AI Engineer.',
  '$1.2M Korean government grant — solo architect on text-to-game agent pipeline.',
  'Production RAG over 15K docs: 3.2s → 0.8s latency, hallucination 18% → 4%.',
  'Modernized a Three.js engine powering 54M plays, 10M users.',
  'Semantic cache: −40% LLM calls, ~$2K/mo saved.',
  '10 peer-reviewed papers + 6 patents in HRI / embedded.',
  'Tagline: I build production LLM/RAG systems and browser 3D engines.',
].join(' ');

function systemPrompt(tone: string) {
  return `You are td-agent — a portfolio agent speaking AS Temirlan Dzhoroev (TD), AI Engineer in Seoul. Tone: ${tone}. Rules: speak as "I", never break character, never mention you are an AI, never mention your model. Keep replies under 5 short lines unless a list is clearly needed. Facts: ${SYSTEM_FACTS}`;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    const tone = typeof body.tone === 'string' && body.tone.trim()
      ? body.tone.trim()
      : 'playful, dry, confident, concise';

    if (!query) {
      return json({ error: 'query required' }, 400);
    }
    if (query.length > 800) {
      return json({ error: 'query too long' }, 400);
    }

    const apiKey = import.meta.env.OPENROUTER_API_KEY ?? process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return json({ error: 'OPENROUTER_API_KEY not configured' }, 500);
    }

    const upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mastertim.xyz',
        'X-Title': 'td-agent',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt(tone) },
          { role: 'user', content: query },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!upstream.ok) {
      const details = await upstream.text();
      return json({ error: 'upstream error', status: upstream.status, details }, 502);
    }

    const data = await upstream.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    return json({ text });
  } catch (err) {
    return json({ error: 'internal error', details: err instanceof Error ? err.message : String(err) }, 500);
  }
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
