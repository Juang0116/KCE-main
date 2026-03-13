// src/lib/events.server.ts
import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import type { Json, Database } from '@/types/supabase';

type EventInsert = Database['public']['Tables']['events']['Insert'];

function jsonSafe(value: unknown): Json {
  return JSON.parse(JSON.stringify(value, (_k, v) => (v === undefined ? null : v))) as Json;
}

/**
 * Best-effort event logging (never throws).
 *
 * Use this for:
 * - api.error
 * - stripe.webhook_received
 * - stripe.webhook_handler_error
 * - email.invoice_sent / email.invoice_send_error
 * - review_submitted
 */
export async function logEvent(
  type: string,
  payload: Record<string, unknown>,
  opts?: {
    userId?: string | null;
    source?: string | null;
    entityId?: string | null;
    dedupeKey?: string | null;
  },
): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    const row: EventInsert = {
      user_id: opts?.userId ?? null,
      type,
      payload: jsonSafe(payload),
      source: opts?.source ?? null,
      entity_id: opts?.entityId ?? null,
      dedupe_key: opts?.dedupeKey ?? null,
    };
    await admin.from('events').insert(row);
  } catch {
    // swallow
  }
}
