// src/lib/postmortemActionItems.server.ts
import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';
import { maybeNotifyOpsAlert } from '@/lib/opsAlerts.server';

export type ActionItemOverdue = {
  incidentId: string;
  title: string;
  owner?: string | null;
  due_at: string;
  daysOverdue: number;
  severity: 'info' | 'warn' | 'critical';
  task_id?: string | null;
};

type RawActionItem = {
  title?: string;
  owner?: string;
  due_at?: string;
  status?: string;
  task_id?: string;
};

export async function checkOverdueActionItems(opts: { requestId: string; dryRun: boolean; daysLookback?: number }) {
  const requestId = opts.requestId;
  const dryRun = opts.dryRun;
  const daysLookback = opts.daysLookback ?? 90;

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false as const, overdue: [] as ActionItemOverdue[] };

  const now = Date.now();
  const fromISO = new Date(now - daysLookback * 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await (admin as any)
    .from('ops_postmortems')
    .select('incident_id, action_items, updated_at')
    .gte('updated_at', fromISO)
    .limit(2000);

  if (error) {
    await logEvent('api.error', { requestId, where: 'checkOverdueActionItems', error: error.message });
    return { ok: false as const, overdue: [] as ActionItemOverdue[] };
  }

  const overdue: ActionItemOverdue[] = [];

  for (const r of rows ?? []) {
    const incidentId = String(r.incident_id || '').trim();
    if (!incidentId) continue;

    const items: RawActionItem[] = Array.isArray(r.action_items) ? (r.action_items as any[]) : [];
    for (const it of items) {
      const title = String(it?.title || '').trim();
      const due = String(it?.due_at || '').trim();
      const status = String(it?.status || 'open').trim();
      if (!title || !due) continue;
      if (status === 'done' || status === 'closed') continue;

      const dueMs = new Date(due).getTime();
      if (!Number.isFinite(dueMs)) continue;

      if (dueMs < now) {
        const daysOver = Math.floor((now - dueMs) / (24 * 60 * 60 * 1000));
        const sev: ActionItemOverdue['severity'] = daysOver >= 7 ? 'critical' : daysOver >= 1 ? 'warn' : 'info';
        overdue.push({
          incidentId,
          title,
          owner: it.owner ? String(it.owner) : null,
          due_at: due,
          daysOverdue: daysOver,
          severity: sev,
          task_id: it.task_id ? String(it.task_id) : null,
        });
      }
    }
  }

  for (const o of overdue) {
    if (!dryRun) {
      await maybeNotifyOpsAlert({
        requestId,
        severity: o.severity,
        kind: 'postmortem_action_item_overdue',
        message: `Overdue action item (${o.daysOverdue}d): ${o.title} (incident ${o.incidentId})`,
        meta: { incidentId: o.incidentId, task_id: o.task_id ?? null, due_at: o.due_at, owner: o.owner ?? null },
      });
    }
  }

  return { ok: true as const, overdue };
}
