// src/lib/ai/providers.ts
import { serverEnv } from '@/lib/env';

export type Role = 'user' | 'assistant' | 'system';
export type ChatMessage = { role: Role; content: string };

export type GenArgs = {
  system?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
};

export type AIProvider = 'gemini' | 'openai';

const primary: AIProvider = (serverEnv.AI_PRIMARY as AIProvider) || 'gemini';
const secondary: AIProvider = (serverEnv.AI_SECONDARY as AIProvider) || 'openai';

const AI_TIMEOUT_MS = (() => {
  const raw =
    (serverEnv as Record<string, unknown>)['AI_HTTP_TIMEOUT_MS'] ?? process.env.AI_HTTP_TIMEOUT_MS;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 15_000;
})();

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const CLEAN_FALLBACK =
  'Estoy aquí para ayudarte. ¿Qué experiencia en Colombia te gustaría explorar?';

/* ========================== Guards ========================== */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/* ========================== Utils ========================== */

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = AI_TIMEOUT_MS,
): Promise<unknown> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });

    if (!res.ok) {
      let errText = `${res.status} ${res.statusText}`;
      try {
        const e = (await res.json()) as unknown;
        if (isRecord(e)) {
          const msg =
            (isRecord(e.error) ? asString(e.error.message) : '') || asString(e.message) || errText;
          errText = msg || errText;
        }
      } catch {
        /* noop */
      }
      throw new Error(errText);
    }

    try {
      return (await res.json()) as unknown;
    } catch {
      const text = await res.text();
      try {
        return JSON.parse(text) as unknown;
      } catch {
        throw new Error('Respuesta no válida del proveedor');
      }
    }
  } finally {
    clearTimeout(id);
  }
}

function normalizeOut(s: unknown): string {
  if (typeof s !== 'string') return CLEAN_FALLBACK;
  const t = s.replace(/\u0000/g, '').trim();
  return t.length > 0 ? t : CLEAN_FALLBACK;
}

function sanitizeMessages(msgs: ChatMessage[]): ChatMessage[] {
  return msgs
    .map((m) => ({
      role: m.role,
      content: String(m.content ?? '').slice(0, 16_000),
    }))
    .filter((m) => m.content.trim().length > 0);
}

function providerEnabled(p: AIProvider): boolean {
  if (p === 'openai') return Boolean(serverEnv.OPENAI_API_KEY);
  if (p === 'gemini') return Boolean(serverEnv.GEMINI_API_KEY);
  return false;
}

function flattenConversation(system: string | undefined, messages: ChatMessage[]): string {
  const parts: string[] = [];
  if (system) parts.push(`SYSTEM:\n${system}`);
  for (const m of sanitizeMessages(messages)) {
    parts.push(`${m.role.toUpperCase()}:\n${m.content}`);
  }
  return parts.join('\n\n').trim();
}

/* ========================== OpenAI (Responses API) ========================== */

function extractOpenAIText(payload: unknown): string {
  if (!isRecord(payload)) return '';

  // prefer output_text if present
  const outputText = asString(payload.output_text);
  if (outputText.trim()) return outputText.trim();

  const out = asArray(payload.output);
  const chunks: string[] = [];

  for (const item of out) {
    if (!isRecord(item)) continue;
    if (asString(item.type) !== 'message') continue;

    const content = asArray(item.content);
    for (const c of content) {
      if (!isRecord(c)) continue;
      if (asString(c.type) === 'output_text') {
        const t = asString(c.text);
        if (t) chunks.push(t);
      }
    }
  }

  return chunks.join('').trim();
}

async function callOpenAI({
  system,
  messages,
  maxTokens = 800,
  temperature = 0.5,
}: GenArgs): Promise<string> {
  const key = serverEnv.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY missing');

  const base = (serverEnv.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = serverEnv.OPENAI_MODEL || 'gpt-4o-mini';

  const input = flattenConversation(undefined, messages);

  const body = {
    model,
    input,
    instructions: system || undefined,
    temperature,
    max_output_tokens: clamp(Math.floor(maxTokens), 1, 8192),
  };

  const json = await fetchJsonWithTimeout(`${base}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  const out = normalizeOut(extractOpenAIText(json));
  if (!out || out === CLEAN_FALLBACK) throw new Error('OpenAI devolvió contenido vacío');
  return out;
}

/* ========================== Gemini ========================== */

function extractGeminiText(payload: unknown): string {
  if (!isRecord(payload)) return '';

  const candidates = asArray(payload.candidates);
  const first = candidates.length ? candidates[0] : null;
  if (!isRecord(first)) return '';

  const content = first.content;
  if (!isRecord(content)) return '';

  const parts = asArray(content.parts);
  const joined = parts
    .map((p) => (isRecord(p) ? asString(p.text) : ''))
    .filter(Boolean)
    .join('');

  return joined.trim();
}

async function callGemini({
  system,
  messages,
  maxTokens = 800,
  temperature = 0.5,
}: GenArgs): Promise<string> {
  const key = serverEnv.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY missing');

  const base = (serverEnv.GEMINI_API_URL || 'https://generativelanguage.googleapis.com').replace(
    /\/+$/,
    '',
  );
  const model = serverEnv.GEMINI_MODEL || 'gemini-1.5-flash-latest';

  const text = flattenConversation(system, messages);

  const body = {
    contents: [{ role: 'user', parts: [{ text }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: clamp(Math.floor(maxTokens), 1, 8192),
    },
  };

  const json = await fetchJsonWithTimeout(
    `${base}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(
      key,
    )}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    },
  );

  const out = normalizeOut(extractGeminiText(json));
  if (!out || out === CLEAN_FALLBACK) throw new Error('Gemini devolvió contenido vacío');
  return out;
}

/* ========================== Orquestador ========================== */

export async function generate(args: GenArgs): Promise<string> {
  const order: AIProvider[] = [primary, secondary].filter((p, idx, arr) => arr.indexOf(p) === idx);

  let lastErr: unknown;

  for (const provider of order) {
    if (!providerEnabled(provider)) {
      lastErr = new Error(`${provider} API key missing`);
      continue;
    }

    try {
      const out = provider === 'gemini' ? await callGemini(args) : await callOpenAI(args);
      if (out && out !== CLEAN_FALLBACK) return out;
      lastErr = new Error(`${provider} devolvió contenido vacío`);
    } catch (e) {
      lastErr = e;
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[AI.generate] error en proveedor ${provider}:`, e);
      }
    }
  }

  if (process.env.NODE_ENV !== 'production' && lastErr) {
    console.warn('[AI.generate] failover agotado, usando fallback:', lastErr);
  }

  return CLEAN_FALLBACK;
}
