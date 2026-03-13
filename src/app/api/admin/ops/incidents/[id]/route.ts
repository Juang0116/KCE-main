import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  // NOTE: Some Ops tables (like ops_incidents) might not be present in the generated
  // Supabase Database type yet. We cast to `any` here to avoid build breaks while
  // keeping runtime behavior identical.
  const admin = getSupabaseAdmin() as any;
  if (!admin) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Supabase admin no configurado.' },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  const { data: incident, error } = await admin.from('ops_incidents').select('*').eq('id', id).maybeSingle();
  if (error) {
    return NextResponse.json({ ok: false, requestId, error: error.message }, { status: 500, headers: withRequestId(undefined, requestId) });
  }
  if (!incident) {
    return NextResponse.json({ ok: false, requestId, error: 'Not found' }, { status: 404, headers: withRequestId(undefined, requestId) });
  }

  const { data: updates } = await admin
    .from('ops_incident_updates')
    .select('*')
    .eq('incident_id', id)
    .order('created_at', { ascending: false })
    .limit(200);

  const { data: postmortem } = await admin.from('ops_postmortems').select('*').eq('incident_id', id).maybeSingle();

  return NextResponse.json(
    { ok: true, requestId, incident, updates: updates ?? [], postmortem: postmortem ?? null },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
