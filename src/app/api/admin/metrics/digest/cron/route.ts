import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { sendOpsDigestEmail } from '@/services/opsDigestEmail';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { requireInternalHmac } from '@/lib/internalHmac.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function unauthorized(requestId: string) {
  return NextResponse.json({ ok: false, error: 'Unauthorized', requestId }, { status: 401, headers: withRequestId(undefined, requestId) });
}

export async function GET(req: NextRequest) {
  const hmacErr = await requireInternalHmac(req);
  if (hmacErr) return hmacErr;
  const requestId = getRequestId(req);

  const secret = (process.env.CRON_SECRET || '').trim();
  const auth = (req.headers.get('authorization') || '').trim();
  if (secret && auth !== `Bearer ${secret}`) return unauthorized(requestId);

  const to = (process.env.OPS_DIGEST_EMAIL_TO || '').trim();
  if (!to) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'OPS_DIGEST_EMAIL_TO not set', requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
  }

  const days = 1;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    // NOTE: Algunas tablas (p.ej. crm_alerts, crm_mitigation_actions) pueden no estar
    // presentes en los tipos generados de Supabase en este repo. Para evitar que
    // el build falle por overloads de `.from()`,... usamos un cast a `any`.
    // Esto NO cambia el runtime; solo evita TypeScript errors mientras regeneras tipos.
    const admin = getSupabaseAdmin() as any;
    const [alertsRes, mitigRes, paidRes] = await Promise.all([
      admin.from('crm_alerts').select('type,severity,created_at,message').gte('created_at', since).order('created_at', { ascending: false }).limit(50),
      admin.from('crm_mitigation_actions').select('action,created_at,details').gte('created_at', since).order('created_at', { ascending: false }).limit(50),
      admin.from('events').select('payload,created_at').eq('type', 'checkout.paid').gte('created_at', since),
    ]);

    const alerts = alertsRes.data || [];
    const mitigations = mitigRes.data || [];
    const paid = paidRes.data || [];

    let revenueMinor = 0;
    let currency = 'EUR';
    for (const e of paid as any[]) {
      const p = (e.payload || {}) as any;
      if (typeof p.amount_total_minor === 'number') revenueMinor += p.amount_total_minor;
      if (p.currency) currency = String(p.currency).toUpperCase();
    }

    const html = `
      <div style="font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial;line-height:1.4">
        <h2 style="margin:0 0 10px;">KCE Ops Digest (últimas 24h)</h2>
        <p style="margin:0 0 16px;color:#334155;">Ingresos: <b>${(revenueMinor / 100).toFixed(2)} ${currency}</b> · Paid: <b>${paid.length}</b></p>

        <h3 style="margin:18px 0 8px;">Alertas</h3>
        ${alerts.length ? `<ul>${alerts.map((a:any)=>`<li><b>${a.type}</b> (${a.severity}) — ${a.message || ''}</li>`).join('')}</ul>` : `<p style="color:#64748b;">Sin alertas.</p>`}

        <h3 style="margin:18px 0 8px;">Mitigations</h3>
        ${mitigations.length ? `<ul>${mitigations.map((m:any)=>`<li><b>${m.action}</b> — ${new Date(m.created_at).toLocaleString()}</li>`).join('')}</ul>` : `<p style="color:#64748b;">Sin mitigations.</p>`}

        <p style="margin-top:18px;color:#64748b;font-size:12px;">RequestId: ${requestId}</p>
      </div>
    `;

    await sendOpsDigestEmail({ to, subject: 'KCE Ops Digest (24h)', html });

    return NextResponse.json({ ok: true, sent: true, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e), requestId }, { status: 500, headers: withRequestId(undefined, requestId) });
  }
}
