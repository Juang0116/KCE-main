// src/lib/adminAudit.server.ts
import 'server-only';

import type { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId } from '@/lib/requestId';

export type AdminAuditEvent = {
  actor: string;
  action: string;
  method: string;
  path: string;
  capability?: string;
  meta?: Record<string, unknown>;
};

function pickIp(req: NextRequest): string {
  const xf = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim();
  const xr = (req.headers.get('x-real-ip') || '').trim();
  return xf || xr || '';
}

/**
 * Best-effort admin audit logging.
 * - Inserts into public.admin_audit_events when available.
 * - Never throws (logging must not break the app).
 */
export async function logAdminAuditEvent(req: NextRequest, ev: AdminAuditEvent): Promise<void> {
  try {
    // ✅ FIX: tabla no está en src/types/supabase.ts → evitamos el typing estricto aquí.
    const admin = getSupabaseAdmin() as any;

    const requestId = getRequestId(req.headers);
    const ip = pickIp(req);
    const ua = (req.headers.get('user-agent') || '').slice(0, 400);

    await admin.from('admin_audit_events').insert({
      request_id: requestId,
      actor: ev.actor,
      action: ev.action,
      method: ev.method,
      path: ev.path,
      capability: ev.capability ?? null,
      ip: ip || null,
      user_agent: ua || null,
      meta: ev.meta ?? {},
    });
  } catch {
    // swallow
  }
}
