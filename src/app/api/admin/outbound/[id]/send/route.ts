import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { buildWhatsAppLink, processOutboundQueue, updateOutboundStatus } from '@/lib/outbound.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  mode: z.enum(['send_now','preview']).optional().default('send_now'),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const { id } = await ctx.params;

  let json: unknown = {};
  try {
    json = await req.json().catch(() => ({}));
  } catch {
    // ignore
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase admin not configured', requestId }, { status: 500, headers: withRequestId(undefined, requestId) });
  }

  const r = await admin.from('crm_outbound_messages').select('*').eq('id', id).maybeSingle();
  if (r.error || !r.data) {
    return NextResponse.json({ error: 'Message not found', requestId }, { status: 404, headers: withRequestId(undefined, requestId) });
  }
  const msg = r.data as any;

  if (msg.channel === 'whatsapp') {
    const link = buildWhatsAppLink(msg.to_phone || '', msg.body || '');
    // We don't auto-send WhatsApp (manual). Keep status queued, let user mark sent.
    return NextResponse.json({ id, channel: 'whatsapp', waLink: link, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
  }

  // email: process single by setting queued and then calling queue processor with limit 1
  if (parsed.data.mode === 'preview') {
    return NextResponse.json({ id, channel: 'email', preview: { to: msg.to_email, subject: msg.subject, body: msg.body }, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
  }

  try {
    // mark queued if it wasn't
    if (msg.status !== 'queued') await updateOutboundStatus(id, { status: 'queued', error: null });
    const out = await processOutboundQueue({ limit: 1, dryRun: false, requestId });
    return NextResponse.json({ ok: true, processed: out.processed, sent: out.sent, failed: out.failed, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || 'Send failed'), requestId }, { status: 500, headers: withRequestId(undefined, requestId) });
  }
}
