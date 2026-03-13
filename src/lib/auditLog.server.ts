// src/lib/auditLog.server.ts
import 'server-only';

import { getSupabaseAdminAny } from '@/lib/supabaseAdminAny.server';

function jsonSafe(value: unknown): any {
  return JSON.parse(JSON.stringify(value, (_k, v) => (v === undefined ? null : v)));
}

export type AuditLogInput = {
  actor?: string | null;
  action: string;
  requestId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload?: unknown;
};

/**
 * Best-effort audit logging for privileged ops.
 * Never throws.
 */
export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    const admin = getSupabaseAdminAny();
    await admin.from('crm_audit_log').insert({
      actor: input.actor ?? null,
      action: input.action,
      request_id: input.requestId ?? null,
      ip: input.ip ?? null,
      user_agent: input.userAgent ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      payload: jsonSafe(input.payload ?? {}),
    });
  } catch {
    // swallow
  }
}
