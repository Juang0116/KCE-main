import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';

/**
 * Typed helper for Supabase `.from()` calls.
 *
 * For tables present in `Database['public']['Tables']`, this preserves full Row/Insert/Update inference.
 * For runtime tables that may exist in SQL before generated types are refreshed, it gracefully falls back
 * to the untyped client instead of blocking the build on a narrow string-literal union.
 */
export function fromTable<T extends keyof Database['public']['Tables']>(
  sb: SupabaseClient<Database>,
  table: T,
): ReturnType<SupabaseClient<Database>['from']>;
export function fromTable(
  sb: SupabaseClient<Database>,
  table: string,
): ReturnType<SupabaseClient<Database>['from']>;
export function fromTable(
  sb: SupabaseClient<Database>,
  table: string,
) {
  return (sb as any).from(table as any);
}
