// src/app/api/admin/ops/incidents/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function intParam(v: string | null, fallback: number, min = 1, max = 200) {
  const n = Number.parseInt((v ?? '').trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin() as any;

  const url = new URL(req.url);
  const status = (url.searchParams.get('status') || '').trim();
  const severity = (url.searchParams.get('severity') || '').trim();
  const kind = (url.searchParams.get('kind') || '').trim();
  const limit = intParam(url.searchParams.get('limit'), 50, 1, 200);

  let q = admin
    .from('ops_incidents')
    .select(
      'id,request_id,severity,kind,actor,path,method,ip,user_agent,message,fingerprint,meta,status,count,first_seen_at,last_seen_at,acknowledged_at,resolved_at,created_at,updated_at',
    )
    .order('last_seen_at', { ascending: false })
    .limit(limit);

  if (status) q = q.eq('status', status);
  if (severity) q = q.eq('severity', severity);
  if (kind) q = q.eq('kind', kind);

  const res = await q;
  if (res.error) {
    return NextResponse.json(
      { error: res.error.message, requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { items: res.data ?? [], requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
