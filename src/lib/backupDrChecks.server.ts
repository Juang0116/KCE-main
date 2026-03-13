// src/lib/backupDrChecks.server.ts
import 'server-only';

import type { NextRequest } from 'next/server';

import { getSupabaseAdminAny } from '@/lib/supabaseAdminAny.server';
import { logOpsIncident } from '@/lib/opsIncidents.server';
import { getRequestId } from '@/lib/requestId';

function num(v: string | undefined, def: number) {
  const n = Number(String(v ?? '').trim());
  return Number.isFinite(n) ? n : def;
}

export type BackupDrStatus = {
  backups: { ok: boolean; maxAgeHours: number; lastAt?: string | null; hoursSince?: number | null };
  dr: { ok: boolean; maxAgeDays: number; lastAt?: string | null; daysSince?: number | null };
};

export async function checkBackupAndDr(req: NextRequest): Promise<BackupDrStatus> {
  const sb = getSupabaseAdminAny();

  const maxAgeHours = num(process.env.OPS_BACKUP_MAX_AGE_HOURS, 24);
  const maxAgeDays = num(process.env.OPS_DR_DRILL_MAX_AGE_DAYS, 30);

  // Backups
  const { data: b, error: be } = await sb
    .from('ops_backups_log')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  const lastBackupAt = !be && b?.[0]?.created_at ? String(b[0].created_at) : null;
  const hoursSinceBackup = lastBackupAt
    ? (Date.now() - new Date(lastBackupAt).getTime()) / 3_600_000
    : null;
  const backupsOk = hoursSinceBackup == null ? true : hoursSinceBackup <= maxAgeHours;

  if (!backupsOk) {
    await logOpsIncident(req, {
      severity: 'critical',
      kind: 'backup_stale',
      message: `Backup stale: last backup is older than ${maxAgeHours}h`,
      fingerprint: `backup_stale_${maxAgeHours}h`,
      meta: { requestId: getRequestId(req), lastBackupAt, hoursSinceBackup, maxAgeHours },
    });
  }

  // DR drills
  const { data: d, error: de } = await sb
    .from('ops_dr_drills')
    .select('performed_at,kind,status')
    .order('performed_at', { ascending: false })
    .limit(1);

  const lastDrAt = !de && d?.[0]?.performed_at ? String(d[0].performed_at) : null;
  const daysSinceDr = lastDrAt
    ? (Date.now() - new Date(lastDrAt).getTime()) / 86_400_000
    : null;
  const drOk = daysSinceDr == null ? true : daysSinceDr <= maxAgeDays;

  const drEnabled = (process.env.OPS_DR_DRILL_ENABLED || '').trim();
  const checkDr = drEnabled === '1' || (drEnabled === '' && process.env.NODE_ENV === 'production');

  if (checkDr && !drOk) {
    await logOpsIncident(req, {
      severity: 'warn',
      kind: 'dr_drill_due',
      message: `DR drill due: last drill older than ${maxAgeDays}d`,
      fingerprint: `dr_drill_due_${maxAgeDays}d`,
      meta: { requestId: getRequestId(req), lastDrAt, daysSinceDr, maxAgeDays },
    });
  }

  return {
    backups: { ok: backupsOk, maxAgeHours, lastAt: lastBackupAt, hoursSince: hoursSinceBackup },
    dr: { ok: !checkDr || drOk, maxAgeDays, lastAt: lastDrAt, daysSince: daysSinceDr },
  };
}
