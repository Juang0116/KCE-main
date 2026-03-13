import 'server-only';

import { logEvent } from '@/lib/events.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { pauseChannel } from '@/lib/channelPause.server';
import { setRuntimeFlag } from '@/lib/runtimeFlags.server';
import type { FiredAlert } from '@/lib/alerting.server';

type MitigationResult = {
  alertId?: string | null;
  alertType: string;
  actions: Array<{ action: string; status: 'applied' | 'skipped' | 'failed'; details?: Record<string, unknown> }>;
};

async function ledger(
  alert: FiredAlert,
  action: string,
  status: 'applied' | 'skipped' | 'failed',
  details: Record<string, unknown>,
) {
  const admin = getSupabaseAdmin();
  await (admin as any).from('crm_mitigation_actions').insert({
    alert_id: alert.id ?? null,
    alert_type: alert.type,
    action,
    status,
    details,
  });
}

async function createInternalTicket(subject: string, summary: string) {
  const admin = getSupabaseAdmin();

  // Create a conversation (channel constrained) then ticket.
  const conv = await (admin as any)
    .from('conversations')
    .insert({ channel: 'web', locale: 'es', status: 'open' })
    .select('id')
    .single();

  if (conv.error) throw new Error(`conversation insert failed: ${conv.error.message}`);

  const t = await (admin as any)
    .from('tickets')
    .insert({
      conversation_id: conv.data.id,
      subject,
      summary,
      status: 'open',
      priority: 'high',
      channel: 'web',
    })
    .select('id')
    .single();

  if (t.error) throw new Error(`ticket insert failed: ${t.error.message}`);

  return { conversationId: conv.data.id as string, ticketId: t.data.id as string };
}

export async function runMitigations(alerts: FiredAlert[], opts: { requestId?: string; dryRun?: boolean } = {}): Promise<MitigationResult[]> {
  const results: MitigationResult[] = [];
  for (const alert of alerts) {
    const r: MitigationResult = { alertId: alert.id ?? null, alertType: alert.type, actions: [] };

    try {
      if (alert.type === 'failed_rate_spike') {
        const offenders = (alert.meta?.offenders as any[]) || [];
        const channels = offenders.map((o) => String(o.channel)).slice(0, 3);

        // 1) Pause channel(s) for 60 minutes (best default; configurable later)
        for (const ch of channels) {
          if (opts.dryRun) {
            r.actions.push({ action: 'pause_channel', status: 'skipped', details: { channel: ch, minutes: 60, reason: alert.message } });
            continue;
          }
          // Only email sending exists today; keep others for future.
          const normalized = ch === 'email' ? 'email' : ch;
          await pauseChannel(normalized, 60, `P25 auto-mitigation: ${alert.message}`);
          await ledger(alert, 'pause_channel', 'applied', { channel: normalized, minutes: 60 });
          r.actions.push({ action: 'pause_channel', status: 'applied', details: { channel: normalized, minutes: 60 } });
        }

        // 2) Create internal ticket
        if (!opts.dryRun) {
          const created = await createInternalTicket('Outbound failures spike', `${alert.message}

Auto-action: channels paused for 60 minutes.`);
          await ledger(alert, 'create_ticket', 'applied', created);
          r.actions.push({ action: 'create_ticket', status: 'applied', details: created });
        } else {
          r.actions.push({ action: 'create_ticket', status: 'skipped', details: { subject: 'Outbound failures spike' } });
        }
      }

      if (alert.type === 'paid_rate_drop') {
        // Disable auto-promote weights (DB flag overrides env defaults)
        if (!opts.dryRun) {
          await setRuntimeFlag('crm_auto_promote_weights', 'false');
          await ledger(alert, 'disable_auto_promote', 'applied', { key: 'crm_auto_promote_weights', value: 'false' });
          r.actions.push({ action: 'disable_auto_promote', status: 'applied', details: { key: 'crm_auto_promote_weights', value: 'false' } });
        } else {
          r.actions.push({ action: 'disable_auto_promote', status: 'skipped', details: { key: 'crm_auto_promote_weights', value: 'false' } });
        }

        // Create internal ticket for review
        if (!opts.dryRun) {
          const created = await createInternalTicket('Paid-rate drop detected', `${alert.message}

Auto-action: auto-promote weights disabled (runtime flag). Review checkout UX and templates.`);
          await ledger(alert, 'create_ticket', 'applied', created);
          r.actions.push({ action: 'create_ticket', status: 'applied', details: created });
        } else {
          r.actions.push({ action: 'create_ticket', status: 'skipped', details: { subject: 'Paid-rate drop detected' } });
        }
      }
    } catch (e) {
      await logEvent('api.error', { requestId: opts.requestId ?? null, where: 'runMitigations', alertType: alert.type, error: String(e) });
      // Ledger failure best-effort
      try {
        if (!opts.dryRun) await ledger(alert, 'mitigation_error', 'failed', { error: String(e) });
      } catch {}
      r.actions.push({ action: 'mitigation_error', status: 'failed', details: { error: String(e) } });
    }

    results.push(r);
  }
  return results;
}
