import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'Supabase admin not configured', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) },
    );
  }

  const id = ctx.params.id;
  try {
    const res = await admin.from('crm_templates').delete().eq('id', id).select('id').single();
    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/templates/[id]', message: res.error.message },
        { source: 'api', dedupeKey: `api.error:/api/admin/templates/${id}:${requestId}` },
      );
      return NextResponse.json(
        { error: 'Delete failed', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    await logEvent('admin.template_delete', { requestId, id }, { source: 'admin', entityId: id });

    return NextResponse.json(
      { ok: true, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/templates/[id]', message: e instanceof Error ? e.message : 'unknown' },
      { source: 'api', dedupeKey: `api.error:/api/admin/templates/${id}:${requestId}` },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
