import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminCapability } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const auth = await requireAdminCapability(req, 'alerts_ack');
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  const admin = getSupabaseAdmin() as any;
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Supabase admin not configured', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  try {
    const nowIso = new Date().toISOString();
    const res = await admin
      .from('crm_alerts')
      .update({ acknowledged_at: nowIso, acknowledged_by: auth.mode })
      .eq('id', id)
      .select('id,acknowledged_at,acknowledged_by')
      .single();

    if (res.error) {
      await logEvent('api.error', { requestId, route: 'alerts.ack', supabase: { message: res.error.message, code: res.error.code } });
      return NextResponse.json(
        { ok: false, error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    return NextResponse.json(
      { ok: true, requestId, item: res.data },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e) {
    await logEvent('api.error', { requestId, route: 'alerts.ack', error: String(e) });
    return NextResponse.json(
      { ok: false, error: 'Failed', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
