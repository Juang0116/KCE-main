// src/app/api/admin/templates/test-send/route.ts
// Sends a test email rendering a CRM template with preview data.
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { serverEnv } from '@/lib/env';
import { renderTemplateText } from '@/lib/templates.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  templateId: z.string().uuid(),
  toEmail: z.string().email(),
  previewVars: z.record(z.string()).optional().default({}),
});

const DEFAULT_VARS: Record<string, string> = {
  name: 'Juancho (prueba)',
  city: 'Bogotá',
  tour: 'Bogotá Coffee Culture',
  budget: 'estándar',
  interests: 'cultura, café',
  tours_url: 'https://kce.travel/tours',
  contact_url: 'https://kce.travel/contact',
  plan_url: 'https://kce.travel/plan',
  whatsapp_url: 'https://wa.me/573001234567',
  checkout_url: 'https://kce.travel/checkout',
};

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const { templateId, toEmail, previewVars } = parsed.data;
  const vars = { ...DEFAULT_VARS, ...previewVars };

  // Fetch template from DB
  const admin = getSupabaseAdmin() as any;
  const { data: tpl, error } = await admin
    .from('crm_templates')
    .select('key, channel, subject, body, locale')
    .eq('id', templateId)
    .maybeSingle();

  if (error || !tpl) {
    return NextResponse.json(
      { ok: false, error: 'Template not found', requestId },
      { status: 404, headers: withRequestId(undefined, requestId) },
    );
  }

  const subject = renderTemplateText(tpl.subject || `[TEST] ${tpl.key}`, vars);
  const body = renderTemplateText(tpl.body || '', vars);

  // Send via Resend
  const apiKey = serverEnv.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'RESEND_API_KEY not configured', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) },
    );
  }

  const from = (serverEnv.EMAIL_FROM || 'KCE <hello@kce.travel>').trim();
  const resend = new Resend(apiKey);

  const html = `
    <div style="font-family:ui-sans-serif,system-ui;line-height:1.5;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:12px;">
        🧪 <strong>Email de prueba</strong> — template: <code>${tpl.key}</code> (${tpl.locale ?? 'es'})
      </div>
      <div style="white-space:pre-wrap;font-size:14px;">${body.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</div>
    </div>`.trim();

  const { error: sendErr } = await resend.emails.send({
    from,
    to: [toEmail],
    subject: `[TEST] ${subject}`,
    html,
    text: `[TEST EMAIL]\n\n${body}`,
  });

  if (sendErr) {
    return NextResponse.json(
      { ok: false, error: sendErr.message, requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { ok: true, requestId, sent: { to: toEmail, subject: `[TEST] ${subject}` } },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
