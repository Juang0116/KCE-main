/* src/app/admin/ops/AdminOpsClient.tsx */
'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type OpsResp = {
  actor?: string;
  access?: {
    mode: string;
    actor: string;
    roles: string[];
    permissions: string[];
    hasAll: boolean;
    breakglassActive?: boolean;
  };
  requestId: string;
  range: { tz: string; from: string; to: string };
  tickets: {
    open: number;
    pending: number;
    in_progress: number;
    urgent: number;
  };
  tasks: {
    open: number;
    overdue: number;
    due_today: number;
    urgent: number;
  };
  deals: Record<string, number>;
  controls?: {
    auto_promote?: { enabled: boolean; override?: 'runtime' | 'env'; updated_at?: string | null };
    channel_pauses?: { email?: { channel: string; paused_until: string; reason?: string | null } | null };
  };
  lists: {
    urgent_tickets: Array<{ id: string; subject: string | null; updated_at: string | null; priority: string | null }>;
    overdue_tasks: Array<{
      id: string;
      title: string;
      due_at: string | null;
      priority: string | null;
      ticket_id: string | null;
      deal_id: string | null;
    }>;
  };
};

type Approval = {
  id: string;
  action: string;
  payload: unknown;
  status: 'pending' | 'approved' | 'executed' | 'rejected' | 'expired' | string;
  created_at: string;
  expires_at: string;
};

function kpiCard(title: string, value: number | string, hint?: string) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4">
      <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/60">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-[color:var(--color-text)]">{value}</div>
      {hint ? <div className="mt-1 text-xs text-[color:var(--color-text)]/60">{hint}</div> : null}
    </div>
  );
}

export function AdminOpsClient() {
  // --- Two-man rule approvals ---
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [approvalsErr, setApprovalsErr] = useState<string>('');
  const [approverToken, setApproverToken] = useState<string>('');
  const [approvalsLoading, setApprovalsLoading] = useState(false);

  const loadApprovals = async () => {
    try {
      setApprovalsLoading(true);
      setApprovalsErr('');
      const res = await adminFetch('/api/admin/ops/approvals?status=pending', {
        cache: 'no-store',
        credentials: 'include',
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || 'Failed to load approvals');
      setApprovals((j?.approvals || []) as Approval[]);
    } catch (e: unknown) {
      setApprovalsErr(e instanceof Error ? e.message : String(e));
    } finally {
      setApprovalsLoading(false);
    }
  };

  const executeApproval = async (id: string) => {
    try {
      setApprovalsErr('');
      const res = await adminFetch(`/api/admin/ops/approvals/${encodeURIComponent(id)}/execute`, {
        method: 'POST',
        headers: { 'x-ops-approver-token': approverToken || '' },
        credentials: 'include',
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || 'Execute failed');

      // recargar todo
      await Promise.all([loadApprovals(), load()]);
    } catch (e: unknown) {
      setApprovalsErr(e instanceof Error ? e.message : String(e));
    }
  };

  // --- Ops snapshot ---
  const [data, setData] = useState<OpsResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const r = await adminFetch('/api/admin/ops', { cache: 'no-store' });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setData(j as OpsResp);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const callControl = async (payload: unknown) => {
    try {
      const r = await adminFetch('/api/admin/ops/control', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    }
  };

  useEffect(() => {
    void load();
    void loadApprovals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stagePairs = useMemo(() => {
    const m = data?.deals || {};
    const keys = Object.keys(m);
    keys.sort((a, b) => (m[b] ?? 0) - (m[a] ?? 0));
    return keys.map((k) => [k, m[k] ?? 0] as const);
  }, [data?.deals]);

  return (
    <section className="space-y-6">
      {err ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200">
          {err}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-[color:var(--color-text)]/60">
          {data?.range ? (
            <span>
              TZ: {data.range.tz} • hoy: {new Date(data.range.from).toLocaleString()} →{' '}
              {new Date(data.range.to).toLocaleString()}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/ops/notifications"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm hover:bg-black/5"
          >
            Notificaciones
          </Link>
          <Link
            href="/admin/ops/runbooks"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm hover:bg-black/5"
          >
            Runbooks
          </Link>
          <button
            onClick={() => void load()}
            className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm hover:bg-black/10"
            type="button"
            disabled={loading}
          >
            {loading ? 'Cargando…' : 'Refrescar'}
          </button>
        </div>
      </div>

      {/* Two-man rule approvals */}
      <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4">
        <h2 className="text-lg font-semibold text-[color:var(--color-text)]">
          Aprobaciones pendientes (Two-man rule)
        </h2>
        <p className="mt-1 text-sm text-[color:var(--color-text)]/70">
          Si <span className="font-mono">OPS_TWO_MAN_RULE</span> está activo, las acciones críticas quedan en estado
          pendiente hasta aprobación.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className="w-full max-w-xl rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:bg-black/20"
            placeholder="Approver token (x-ops-approver-token)"
            value={approverToken}
            onChange={(e) => setApproverToken(e.target.value)}
          />
          <button
            className="rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-sm hover:bg-black/10"
            onClick={() => void loadApprovals()}
            type="button"
            disabled={approvalsLoading}
          >
            {approvalsLoading ? 'Cargando…' : 'Recargar'}
          </button>
        </div>

        {approvalsErr ? (
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-200">{approvalsErr}</p>
        ) : null}

        <div className="mt-4 overflow-auto rounded-xl border border-black/10">
          <table className="min-w-[860px] w-full text-sm">
            <thead className="bg-black/5 text-left">
              <tr>
                <th className="p-3 font-semibold">Creada</th>
                <th className="p-3 font-semibold">Acción</th>
                <th className="p-3 font-semibold">Expira</th>
                <th className="p-3 font-semibold">Estado</th>
                <th className="p-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((a: Approval) => (
                <tr key={a.id} className="border-t border-black/10">
                  <td className="p-3 whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    <div className="font-medium">{a.action}</div>
                    <div className="mt-1 text-xs text-[color:var(--color-text)]/60 truncate max-w-[520px]">
                      {JSON.stringify(a.payload)}
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">{new Date(a.expires_at).toLocaleString()}</td>
                  <td className="p-3">{a.status}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      onClick={() => void executeApproval(a.id)}
                      type="button"
                      disabled={a.status !== 'pending'}
                      title={!approverToken ? 'Necesitas el approver token' : ''}
                    >
                      Aprobar & Ejecutar
                    </button>
                  </td>
                </tr>
              ))}

              {approvals.length === 0 ? (
                <tr>
                  <td className="p-3 text-[color:var(--color-text)]/60" colSpan={5}>
                    No hay aprobaciones pendientes.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Controles */}
      <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-[color:var(--color-text)]">Controles</div>
            <div className="mt-1 text-xs text-[color:var(--color-text)]/60">
              Operación segura: pausar canal email y activar/desactivar auto-promote.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                void callControl({
                  action: 'set_flag',
                  key: 'crm_auto_promote_weights',
                  value: data?.controls?.auto_promote?.enabled ? 'false' : 'true',
                })
              }
              className="rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-sm hover:bg-black/10"
              disabled={loading}
            >
              Auto-promote weights: {data?.controls?.auto_promote?.enabled ? 'ON' : 'OFF'}
            </button>

            <button
              type="button"
              onClick={() => void callControl({ action: 'clear_flag', key: 'crm_auto_promote_weights' })}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/5"
              disabled={loading}
            >
              Reset override
            </button>

            {data?.controls?.channel_pauses?.email ? (
              <button
                type="button"
                onClick={() => void callControl({ action: 'resume_channel', channel: 'email' })}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/5"
                disabled={loading}
              >
                Reanudar email
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  void callControl({
                    action: 'pause_channel',
                    channel: 'email',
                    minutes: 60,
                    reason: 'Pausa manual desde Ops',
                  })
                }
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/5"
                disabled={loading}
              >
                Pausar email (60m)
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-black/10 bg-black/5 p-3 text-xs text-[color:var(--color-text)]/70">
            <div className="font-semibold text-[color:var(--color-text)]">Auto-promote</div>
            <div className="mt-1">
              Estado: <span className="font-medium">{data?.controls?.auto_promote?.enabled ? 'ON' : 'OFF'}</span>{' '}
              <span className="text-[color:var(--color-text)]/50">({data?.controls?.auto_promote?.override || 'env'})</span>
            </div>
            {data?.controls?.auto_promote?.updated_at ? (
              <div className="mt-1 text-[color:var(--color-text)]/50">
                updated {new Date(data.controls.auto_promote.updated_at).toLocaleString()}
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-black/10 bg-black/5 p-3 text-xs text-[color:var(--color-text)]/70">
            <div className="font-semibold text-[color:var(--color-text)]">Canal email</div>
            {data?.controls?.channel_pauses?.email ? (
              <>
                <div className="mt-1">
                  Pausado hasta{' '}
                  <span className="font-medium">
                    {new Date(data.controls.channel_pauses.email.paused_until).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 text-[color:var(--color-text)]/50">
                  {data.controls.channel_pauses.email.reason || '—'}
                </div>
              </>
            ) : (
              <div className="mt-1">Activo (no pausado)</div>
            )}
          </div>
        </div>
      </div>

      {/* RBAC */}
      {data?.access ? (
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4">
          <div className="text-sm font-semibold">Acceso efectivo (RBAC)</div>
          <div className="mt-2 text-sm text-[color:var(--color-text)]/70">
            Actor: <span className="font-mono">{data.actor || data.access.actor}</span> • Mode:{' '}
            <span className="font-mono">{data.access.mode}</span>{' '}
            {data.access.breakglassActive ? (
              <span className="ml-2 rounded-md bg-amber-500/20 px-2 py-1 text-xs">BREAKGLASS</span>
            ) : null}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/60">Roles</div>
              <div className="mt-1 text-sm font-mono">{(data.access.roles || []).join(', ') || '—'}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/60">Permissions</div>
              <div className="mt-1 text-sm font-mono break-words">{(data.access.permissions || []).join(', ') || '—'}</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-[color:var(--color-text)]/60">
            Tip: para una acción puntual, puedes usar header <span className="font-mono">x-breakglass-token</span> (si tienes un token emitido).
          </div>
        </div>
      ) : null}

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-4">
        {kpiCard('Tickets open', data?.tickets?.open ?? (loading ? '…' : 0), 'Backlog activo')}
        {kpiCard('Tickets urgent', data?.tickets?.urgent ?? (loading ? '…' : 0), 'Prioridad urgent')}
        {kpiCard('Tareas overdue', data?.tasks?.overdue ?? (loading ? '…' : 0), 'SLA roto')}
        {kpiCard('Tareas due hoy', data?.tasks?.due_today ?? (loading ? '…' : 0), 'Para cerrar hoy')}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Urgentes */}
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[color:var(--color-text)]">Urgentes</div>
              <div className="mt-1 text-xs text-[color:var(--color-text)]/60">
                Tickets y tareas que requieren atención inmediata.
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Link href="/admin/tickets" className="text-brand-blue underline underline-offset-2">
                Ver tickets
              </Link>
              <span className="text-[color:var(--color-text)]/50">•</span>
              <Link href="/admin/tasks" className="text-brand-blue underline underline-offset-2">
                Ver tareas
              </Link>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="text-xs font-semibold text-[color:var(--color-text)]/70">Tickets urgent</div>
              <div className="mt-2 space-y-2">
                {(data?.lists?.urgent_tickets ?? []).length === 0 ? (
                  <div className="text-sm text-[color:var(--color-text)]/60">No hay tickets urgent.</div>
                ) : null}
                {(data?.lists?.urgent_tickets ?? []).map((t) => (
                  <Link
                    key={t.id}
                    href={`/admin/tickets/${t.id}`}
                    className="block rounded-xl border border-black/10 bg-black/5 p-3 hover:bg-black/10"
                  >
                    <div className="text-sm font-medium text-[color:var(--color-text)]">{t.subject || 'Sin asunto'}</div>
                    <div className="mt-1 text-xs text-[color:var(--color-text)]/60">
                      {t.priority || '—'} • actualizado {t.updated_at ? new Date(t.updated_at).toLocaleString() : '—'}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-[color:var(--color-text)]/70">Tareas overdue</div>
              <div className="mt-2 space-y-2">
                {(data?.lists?.overdue_tasks ?? []).length === 0 ? (
                  <div className="text-sm text-[color:var(--color-text)]/60">No hay tareas vencidas.</div>
                ) : null}
                {(data?.lists?.overdue_tasks ?? []).map((t) => (
                  <div key={t.id} className="rounded-xl border border-black/10 bg-black/5 p-3">
                    <div className="text-sm font-medium text-[color:var(--color-text)]">{t.title}</div>
                    <div className="mt-1 text-xs text-[color:var(--color-text)]/60">
                      due {t.due_at ? new Date(t.due_at).toLocaleString() : '—'} • {t.priority || '—'}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      {t.ticket_id ? (
                        <Link href={`/admin/tickets/${t.ticket_id}`} className="text-brand-blue underline underline-offset-2">
                          Abrir ticket
                        </Link>
                      ) : null}
                      {t.deal_id ? (
                        <Link
                          href={`/admin/deals?q=${encodeURIComponent(t.deal_id)}`}
                          className="text-brand-blue underline underline-offset-2"
                        >
                          Ver deal
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline */}
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[color:var(--color-text)]">Pipeline</div>
              <div className="mt-1 text-xs text-[color:var(--color-text)]/60">Conteo por stage (deals).</div>
            </div>
            <Link href="/admin/deals" className="text-brand-blue underline underline-offset-2">
              Abrir deals
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {stagePairs.length === 0 ? <div className="text-sm text-[color:var(--color-text)]/60">Sin datos.</div> : null}
            {stagePairs.map(([stage, count]) => (
              <div
                key={stage}
                className="flex items-center justify-between rounded-xl border border-black/10 bg-black/5 px-3 py-2"
              >
                <span className="text-sm text-[color:var(--color-text)]">{stage}</span>
                <span className="text-sm font-semibold text-[color:var(--color-text)]">{count}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 text-xs text-[color:var(--color-text)]/60">
            Tip: si los stages no coinciden con tu DB (constraints), aplica el patch SQL y mantén el enum en backend.
          </div>
        </div>
      </div>
    </section>
  );
}
