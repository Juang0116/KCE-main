import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

type CacheEntry = { value: string; expiresAt: number };
const cache = new Map<string, CacheEntry>();

async function readFlagRaw(key: string): Promise<string | null> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;

  const admin = getSupabaseAdmin();
  const res = await (admin as any).from('crm_runtime_flags').select('value').eq('key', key).maybeSingle();
  if (res.error) return null;

  const val = res.data?.value ?? null;
  if (val != null) cache.set(key, { value: val, expiresAt: now + 60_000 }); // 60s cache
  return val;
}

export async function getRuntimeFlagBoolean(
  key: string,
  fallback: boolean,
): Promise<boolean> {
  const raw = await readFlagRaw(key);
  if (raw == null) return fallback;
  const v = String(raw).trim().toLowerCase();
  if (['1','true','yes','y','on'].includes(v)) return true;
  if (['0','false','no','n','off'].includes(v)) return false;
  return fallback;
}

export async function setRuntimeFlag(
  key: string,
  value: string,
): Promise<void> {
  const admin = getSupabaseAdmin();
  await (admin as any)
    .from('crm_runtime_flags')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  cache.delete(key);
}

export async function clearRuntimeFlag(key: string): Promise<void> {
  const admin = getSupabaseAdmin();
  await (admin as any).from('crm_runtime_flags').delete().eq('key', key);
  cache.delete(key);
}
