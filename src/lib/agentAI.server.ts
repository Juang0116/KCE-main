// src/lib/agentAI.server.ts
// Shared Gemini-primary AI helper for KCE agent functions.
import 'server-only';

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY ?? '').trim();
const GEMINI_MODEL   = (process.env.GEMINI_MODEL   ?? 'gemini-2.0-flash').trim();
const GEMINI_API_URL = (process.env.GEMINI_API_URL  ?? 'https://generativelanguage.googleapis.com').trim();
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY  ?? '').trim();

/**
 * Call Gemini (primary) → OpenAI (fallback) for agent text generation.
 * Returns the generated text or the fallback string if both providers fail.
 */
export async function agentGenerate(opts: {
  systemPrompt: string;
  userMessage?: string;
  temperature?: number;
  maxTokens?: number;
  fallback: string;
}): Promise<string> {
  const { systemPrompt, userMessage = 'Genera el contenido.', temperature = 0.6, maxTokens = 600, fallback } = opts;

  // 1. Try Gemini
  if (GEMINI_API_KEY) {
    try {
      const url = `${GEMINI_API_URL}/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      });
      if (r.ok) {
        const d = await r.json() as any;
        const text = d?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('').trim();
        if (text) return text;
      }
    } catch { /* fall through */ }
  }

  // 2. Try OpenAI
  if (OPENAI_API_KEY) {
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      });
      if (r.ok) {
        const d = await r.json() as any;
        const text = d?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch { /* fall through */ }
  }

  return fallback;
}
