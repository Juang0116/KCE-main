import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export type PauseInfo = { channel: string; paused_until: string; reason?: string | null };

export async function getChannelPause(channel: string): Promise<PauseInfo | null> {
  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();
  const res = await (admin as any)
    .from('crm_channel_pauses')
    .select('channel,paused_until,reason')
    .eq('channel', channel)
    .gt('paused_until', nowIso)
    .maybeSingle();
  if (res.error) return null;
  return res.data ?? null;
}

export async function pauseChannel(channel: string, minutes: number, reason: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const untilIso = new Date(Date.now() + minutes * 60_000).toISOString();
  await (admin as any)
    .from('crm_channel_pauses')
    .upsert({ channel, paused_until: untilIso, reason, updated_at: new Date().toISOString() }, { onConflict: 'channel' });
}

export async function pauseChannelSeconds(channel: string, seconds: number, reason: string): Promise<void> {
  const mins = Math.max(1, Math.ceil(seconds / 60));
  await pauseChannel(channel, mins, reason);
}

export async function clearChannelPause(channel: string): Promise<void> {
  const admin = getSupabaseAdmin();
  await (admin as any).from('crm_channel_pauses').delete().eq('channel', channel);
}

/**
 * Best-effort cleanup: remove pauses that have already expired.
 * Returns number of rows deleted.
 */
export async function pruneExpiredChannelPauses(): Promise<number> {
  try {
    const admin = getSupabaseAdmin();
    const nowIso = new Date().toISOString();
    const res = await (admin as any)
      .from('crm_channel_pauses')
      .delete({ count: 'exact' })
      .lte('paused_until', nowIso);
    return Number(res?.count ?? 0) || 0;
  } catch {
    return 0;
  }
}
