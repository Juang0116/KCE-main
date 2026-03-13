import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { autoMarkRepliedFromEmail } from '@/lib/outboundReplies.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

function requireWebhookAuth(req: NextRequest): { ok: true } | { ok: false; res: NextResponse } {
  const expected = String(process.env.RESEND_INBOUND_TOKEN || process.env.INBOUND_WEBHOOK_TOKEN || '').trim();
  if (!expected) {
    // If not configured, deny by default.
    return { ok: false, res: NextResponse.json({ error: 'Webhook not configured' }, { status: 401 }) };
  }

  const tok = bearerToken(req);
  if (!tok || tok != expected) {
    return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { ok: true };
}

function extractEmailFields(payload: any): {
  from: string | null;
  subject: string | null;
  text: string | null;
  to: string | null;
} {
  // Resend inbound payloads can vary; we parse defensively.
  const data = payload?.data ?? payload;

  const from =
    (typeof data?.from === 'string' ? data.from : null) ||
    (typeof data?.sender === 'string' ? data.sender : null) ||
    (typeof data?.email?.from === 'string' ? data.email.from : null) ||
    null;

  const to =
    (typeof data?.to === 'string' ? data.to : null) ||
    (Array.isArray(data?.to) && typeof data.to[0] === 'string' ? data.to[0] : null) ||
    (typeof data?.email?.to === 'string' ? data.email.to : null) ||
    null;

  const subject =
    (typeof data?.subject === 'string' ? data.subject : null) ||
    (typeof data?.email?.subject === 'string' ? data.email.subject : null) ||
    null;

  const text =
    (typeof data?.text === 'string' ? data.text : null) ||
    (typeof data?.textPlain === 'string' ? data.textPlain : null) ||
    (typeof data?.email?.text === 'string' ? data.email.text : null) ||
    null;

  // Extract address from formats like "Name <a@b.com>"
  const addr = (from || '').match(/<([^>]+)>/);
  const fromEmail = addr?.[1] || (from || '').trim();

  return { from: fromEmail || null, subject, text, to };
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const auth = requireWebhookAuth(req);
  if (!auth.ok) {
    return new NextResponse(auth.res.body, {
      status: auth.res.status,
      headers: withRequestId(auth.res.headers as any, requestId),
    });
  }

  try {
    const payload = await req.json().catch(() => null);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid JSON', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const { from, subject, text, to } = extractEmailFields(payload);

    await logEvent(
      'crm.inbound.email',
      {
        requestId,
        from,
        to,
        subject,
        textPreview: text ? String(text).slice(0, 400) : null,
      },
      {
        source: 'crm',
        dedupeKey: null,
        ...(from ? { entityId: from } : {}),
      },
    );

    if (from) {
      const note = `Auto: respuesta recibida por email. Subject: ${subject || ''}`.trim();
      await autoMarkRepliedFromEmail({ fromEmail: from, note, requestId });
    }

    return NextResponse.json(
      { ok: true, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: any) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/webhooks/resend/inbound', message: String(e?.message || 'unknown') },
      { source: 'api' },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
