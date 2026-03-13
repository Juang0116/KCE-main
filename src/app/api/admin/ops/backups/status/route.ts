import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminCapability } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'ops.read');
  if (!auth.ok) return auth.response;

  // NOTE: Esta ruta consulta tablas Ops que a veces no están incluidas en los
  // tipos generados (Database) de Supabase. En build/CI, `.from('ops_backups_log')`
  // puede fallar por overload (relation: never). Para no bloquear el build,
  // hacemos un cast local y seguimos usando el cliente admin real.
  const sb = getSupabaseAdmin() as any;
  const { data, error } = await sb
    .from('ops_backups_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, requestId, error: error.message }, { status: 500, headers: withRequestId(undefined, requestId) });
  }

  return NextResponse.json({ ok: true, requestId, items: data ?? [] }, { status: 200, headers: withRequestId(undefined, requestId) });
}
