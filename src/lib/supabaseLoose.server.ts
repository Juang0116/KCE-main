import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Escape hatch for runtime tables that exist in Supabase but are not yet modeled in src/types/supabase.ts.
 * Keeps build moving while we finish the full generated Database alignment.
 */
export function fromLooseTable(sb: SupabaseClient<any>, table: string) {
  return (sb as any).from(table);
}
