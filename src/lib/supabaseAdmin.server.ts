// src/lib/supabaseAdmin.server.ts
import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';

function must(v: string | undefined, name: string): string {
  const s = (v || '').trim();
  if (!s) throw new Error(`[supabaseAdmin] Missing env: ${name}`);
  return s;
}

function assertNodeRuntime(): void {
  if (process.env.NEXT_RUNTIME === 'edge') {
    throw new Error('[supabaseAdmin] Requires Node.js runtime (not Edge).');
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __kce_supabase_admin__: SupabaseClient<Database> | undefined;
}

export function getSupabaseAdmin(): SupabaseClient<Database> {
  assertNodeRuntime();

  if (globalThis.__kce_supabase_admin__) return globalThis.__kce_supabase_admin__;

  // Recomendado: preferir SUPABASE_URL en server; fallback al NEXT_PUBLIC_* si así lo manejas hoy.
  const url =
    (process.env.SUPABASE_URL && process.env.SUPABASE_URL.trim()) ||
    must(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL');

  const serviceRole = must(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');

  const admin = createClient<Database>(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'kce-admin' } },
  });

  globalThis.__kce_supabase_admin__ = admin;
  return admin;
}
