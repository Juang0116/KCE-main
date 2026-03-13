import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ensureRequestId(req: NextRequest): string {
  const rid = (getRequestId(req.headers) || '').trim();
  if (rid) return rid;
  // fallback ultra seguro
  const uuid = (globalThis as any)?.crypto?.randomUUID?.();
  return uuid ? `req_${uuid}` : `req_${Date.now().toString(36)}`;
}

function json(status: number, body: any, requestId: string) {
  return NextResponse.json(body, {
    status,
    headers: withRequestId({}, requestId), // ✅ nunca undefined
  });
}

export async function GET(req: NextRequest) {
  const requestId = ensureRequestId(req);

  const auth = await requireAdminScope(req, 'system_view');
  if (!auth.ok) return auth.response;

  const sb = getSupabaseAdmin();
  if (!sb) return json(500, { ok: false, requestId, error: 'Supabase admin no configurado.' }, requestId);

  // ✅ FIX: la tabla no existe en Database types → cast local, acotado a este endpoint
  const sba = sb as any;

  const { data, error } = await sba
    .from('privacy_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return json(500, { ok: false, requestId, error: error.message }, requestId);
  }

  return json(200, { ok: true, requestId, items: data ?? [] }, requestId);
}
