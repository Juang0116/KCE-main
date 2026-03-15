// src/app/api/admin/debug-ai/route.ts
// Safe AI debug endpoint — checks keys and makes a minimal test call to Gemini.
// Protected by ADMIN_TOKEN. Remove after debugging.
import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

export async function GET(req: NextRequest) {
  // Auth check
  const token = (req.cookies.get('admin_token')?.value || '').trim();
  const expected = (process.env.ADMIN_TOKEN || '').trim();
  if (!expected || token !== expected) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  const geminiModel = (process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim();

  const info: Record<string, unknown> = {
    geminiKeySet: Boolean(geminiKey),
    geminiKeyLength: geminiKey.length,
    geminiKeyPrefix: geminiKey.slice(0, 8) + '...',
    openaiKeySet: Boolean(openaiKey),
    geminiModel,
    aiPrimary: process.env.AI_PRIMARY || '(not set, defaults to gemini)',
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || '(not set)',
  };

  // Try a minimal Gemini call
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Say "ok" in one word.' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });
      const data = await r.json() as any;
      info.geminiTestStatus = r.status;
      info.geminiTestOk = r.ok;
      info.geminiTestResponse = r.ok
        ? data?.candidates?.[0]?.content?.parts?.[0]?.text || 'empty'
        : data?.error?.message || JSON.stringify(data);
    } catch (e: any) {
      info.geminiTestError = e?.message || String(e);
    }
  } else {
    info.geminiTest = 'skipped — key not set';
  }

  return NextResponse.json({ ok: true, ...info });
}
