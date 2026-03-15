'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { ShieldCheck, Activity, Clock, Lock, AlertCircle, Zap, RefreshCw, Settings, CheckCircle2, XCircle } from 'lucide-react';

type OpsResp = {
  actor?: string;
  access?: { mode: string; actor: string; roles: string[]; permissions: string[]; hasAll: boolean; breakglassActive?: boolean; };
  requestId: string;
  range: { tz: string; from: string; to: string };
  tickets: { open: number; pending: number; in_progress: number; urgent: number; };
  tasks: { open: number; overdue: number; due_today: number; urgent: number; };
  deals: Record<string, number>;
  controls?: {
    auto_promote?: { enabled: boolean; override?: 'runtime' | 'env'; updated_at?: string | null };
    channel_pauses?: { email?: { channel: string; paused_until: string; reason?: string | null } | null };
  };
  lists: {
    urgent_tickets: Array<{ id: string; subject: string | null; updated_at: string | null; priority: string | null }>;
    overdue_tasks: Array<{ id: string; title: string; due_at: string | null; priority: string | null; ticket_id: string | null; deal_id: string | null; }>;
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

export function AdminOpsClient() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [approvalsErr, setApprovalsErr] = useState<string>('');
  const [approverToken, setApproverToken] = useState<string>('');
  const [approvalsLoading, setApprovalsLoading] = useState(false);

  const loadApprovals = async () => {
    try {
      setApprovalsLoading(true); setApprovalsErr('');
      const res = await adminFetch('/api/admin/ops/approvals?status=pending', { cache: 'no-store', credentials: 'include' });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || 'Failed to load approvals');
      setApprovals((j?.approvals || []) as Approval[]);
    } catch (e: unknown) {
      setApprovalsErr(e instanceof Error ? e.message : String(e));
    } finally { setApprovalsLoading(false); }
  };

  const executeApproval = async (id: string) => {
    try {
      setApprovalsErr('');
      const res = await adminFetch(`/api/admin/ops/approvals/${encodeURIComponent(id)}/execute`, { method: 'POST', headers: { 'x-ops-approver-token': approverToken || '' }, credentials: 'include' });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || 'Execute failed');
      await Promise.all([loadApprovals(), load()]);
    } catch (e: unknown) {
      setApprovalsErr(e instanceof Error ? e.message : String(e));
    }
  };

  const [data, setData] = useState<OpsResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true); setErr(null);
      const r = await adminFetch('/api/admin/ops', { cache: 'no-store' });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setData(j as OpsResp);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error'); setData(null);
    } finally { setLoading(false); }
  };

  const callControl = async (payload: unknown) => {
    try {
      const r = await adminFetch('/api/admin/ops/control', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    }
  };

  useEffect(() => { void load(); void loadApprovals(); }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  const stagePairs = useMemo(() => {
    const m = data?.deals || {};
    const keys = Object.keys(m);
    keys.sort((a, b) => (m[b] ?? 0) - (m[a] ?? 0));
    return keys.map((k) => [k, m[k] ?? 0] as const);
  }, [data?.deals]);

  const signals = useMemo(() => [
    { label: 'Tickets Críticos', value: String(data?.tickets?.urgent ?? 0), note: 'Tickets en estado de urgencia.' },
    { label: 'Tareas Vencidas', value: String(data?.tasks?.overdue ?? 0), note: 'Tareas operativas atrasadas.' },
    { label: 'Aprobaciones', value: String(approvals.length), note: 'Requieren autorización Two-Man Rule.' }
  ], [data, approvals]);

  return (
    <section className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Operations Center</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Supervisa el estado del sistema, SLAs, accesos de seguridad y controles manuales.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/ops/notifications" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition hover:bg-[var(--color-surface)]">
            Alertas
          </Link>
          <Link href="/admin/ops/runbooks" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition hover:bg-[var(--color-surface)]">
            Runbooks
          </Link>
          <button onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-xl bg-brand-dark px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 disabled:opacity-50 shadow-md">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sync
          </button>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="System Health"
        title="Sanidad Operativa del Sistema"
        description="Si hay tareas atrasadas o tickets urgentes, la experiencia de usuario y el revenue están en riesgo. Aborda la higiene del sistema aquí."
        actions={[
          { href: '/admin/ops/incidents', label: 'Ver Incidentes', tone: 'primary' },
          { href: '/admin/system', label: 'Monitor' }
        ]}
        signals={signals}
      />

      {err && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{err}</div>}

      {data?.range && (
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 text-right">
          Ventana: {new Date(data.range.from).toLocaleString()} → {new Date(data.range.to).toLocaleString()} ({data.range.tz})
        </div>
      )}

      {/* Grid Superior */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Controles Ejecutivos */}
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-[var(--color-text)]">Controles del Sistema</h2>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-[var(--color-text)]">Auto-Promote CRM</div>
                  <div className="text-xs text-[var(--color-text)]/60 mt-1">El sistema avanza deals automáticamente.</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${data?.controls?.auto_promote?.enabled ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-700 border border-rose-500/20'}`}>
                  {data?.controls?.auto_promote?.enabled ? 'ACTIVO' : 'PAUSADO'}
                </div>
              </div>
              <div className="flex gap-2">
                <button disabled={loading} onClick={() => void callControl({ action: 'set_flag', key: 'crm_auto_promote_weights', value: data?.controls?.auto_promote?.enabled ? 'false' : 'true' })} className="flex-1 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 disabled:opacity-50">
                  {data?.controls?.auto_promote?.enabled ? 'Pausar' : 'Activar'}
                </button>
                <button disabled={loading} onClick={() => void callControl({ action: 'clear_flag', key: 'crm_auto_promote_weights' })} className="flex-1 rounded-xl border border-[var(--color-border)] bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)] disabled:opacity-50">
                  Reset
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-[var(--color-text)]">Comunicaciones (Email)</div>
                  <div className="text-xs text-[var(--color-text)]/60 mt-1 line-clamp-1">{data?.controls?.channel_pauses?.email?.reason || 'Salida de correos transaccionales.'}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${data?.controls?.channel_pauses?.email ? 'bg-rose-500/10 text-rose-700 border border-rose-500/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'}`}>
                  {data?.controls?.channel_pauses?.email ? 'PAUSADO' : 'OPERATIVO'}
                </div>
              </div>
              <div className="flex gap-2">
                {data?.controls?.channel_pauses?.email ? (
                  <button disabled={loading} onClick={() => void callControl({ action: 'resume_channel', channel: 'email' })} className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-600 disabled:opacity-50">
                    Reanudar Envíos
                  </button>
                ) : (
                  <button disabled={loading} onClick={() => void callControl({ action: 'pause_channel', channel: 'email', minutes: 60, reason: 'Pausa manual preventiva' })} className="flex-1 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-rose-600 disabled:opacity-50">
                    Pausar (1 Hora)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Seguridad y RBAC */}
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-brand-blue" />
              <h2 className="font-heading text-2xl text-[var(--color-text)]">Seguridad (RBAC)</h2>
            </div>
            {data?.access?.breakglassActive && <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700 border border-amber-500/30 animate-pulse">Breakglass</span>}
          </div>
          
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Actor Activo</div>
              <div className="mt-1 font-mono text-sm text-[var(--color-text)] truncate">{data?.actor || data?.access?.actor || 'N/A'}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Roles</div>
                <div className="mt-1 font-mono text-sm text-brand-blue">{(data?.access?.roles || []).join(', ') || '—'}</div>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Modo</div>
                <div className="mt-1 font-mono text-sm text-emerald-600">{data?.access?.mode || '—'}</div>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">Permisos Asignados</div>
              <div className="flex flex-wrap gap-2">
                {(data?.access?.permissions || []).map(p => (
                  <span key={p} className="rounded-lg bg-[var(--color-surface)] px-2 py-1 text-[10px] font-mono text-[var(--color-text)] border border-[var(--color-border)]">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Man Rule */}
      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="h-6 w-6 text-brand-blue" />
          <h2 className="font-heading text-2xl text-[var(--color-text)]">Aprobaciones Críticas (Two-Man Rule)</h2>
        </div>
        <p className="text-sm text-[var(--color-text)]/60 font-light mb-6">Autoriza acciones bloqueadas temporalmente. Ingresa tu token de aprobación para proceder.</p>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none focus:border-brand-blue transition-colors font-mono placeholder:font-sans" placeholder="Ingresa el Approver Token (x-ops-approver-token)" value={approverToken} onChange={(e) => setApproverToken(e.target.value)} />
          <button onClick={() => void loadApprovals()} disabled={approvalsLoading} className="shrink-0 rounded-xl bg-brand-dark px-6 py-3 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 disabled:opacity-50">
            {approvalsLoading ? 'Verificando...' : 'Verificar Pendientes'}
          </button>
        </div>

        {approvalsErr && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{approvalsErr}</div>}

        <div className="overflow-x-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)]">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-6 py-5">Fecha / Expira</th>
                <th className="px-6 py-5">Acción & Payload</th>
                <th className="px-6 py-5 text-center">Estado</th>
                <th className="px-6 py-5 text-right">Ejecución</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {approvals.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-[var(--color-text)]/40 font-medium">Bandeja de aprobaciones limpia.</td></tr>
              ) : (
                approvals.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                    <td className="px-6 py-5 align-top">
                      <div className="font-semibold text-[var(--color-text)]">{new Date(a.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</div>
                      <div className="mt-1 text-[10px] uppercase text-rose-600 font-bold">Exp: {new Date(a.expires_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="font-bold text-brand-blue uppercase tracking-widest text-[10px] mb-1">{a.action}</div>
                      <div className="font-mono text-xs text-[var(--color-text)]/60 line-clamp-2 max-w-[400px] bg-[var(--color-surface-2)] p-2 rounded-xl border border-[var(--color-border)]">{JSON.stringify(a.payload)}</div>
                    </td>
                    <td className="px-6 py-5 align-top text-center">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${a.status === 'pending' ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20' : 'bg-[var(--color-surface-2)] text-[var(--color-text)]/50 border border-[var(--color-border)]'}`}>{a.status}</span>
                    </td>
                    <td className="px-6 py-5 align-top text-right">
                      <button onClick={() => void executeApproval(a.id)} disabled={a.status !== 'pending' || !approverToken} title={!approverToken ? 'Requiere token' : ''} className="rounded-xl bg-emerald-500 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-emerald-600 disabled:opacity-50 shadow-sm">
                        Autorizar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid de Urgencias (Tickets, Tasks y Pipeline) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Urgent Tickets */}
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="h-6 w-6 text-rose-500" />
            <h2 className="font-heading text-2xl text-[var(--color-text)]">Tickets Urgentes</h2>
          </div>
          <div className="space-y-3">
            {(data?.lists?.urgent_tickets ?? []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm font-medium text-[var(--color-text)]/40">Sin emergencias.</div>
            ) : (
              (data?.lists?.urgent_tickets ?? []).map((t) => (
                <Link key={t.id} href={`/admin/tickets/${t.id}`} className="block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 transition hover:border-rose-500/30 hover:shadow-sm">
                  <div className="font-semibold text-[var(--color-text)] line-clamp-1">{t.subject || 'Sin asunto'}</div>
                  <div className="mt-2 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                    <span className="text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full">{t.priority || 'URGENT'}</span>
                    <span>{t.updated_at ? new Date(t.updated_at).toLocaleDateString() : '—'}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link href="/admin/tickets" className="mt-6 block text-center text-[10px] font-bold uppercase tracking-widest text-brand-blue hover:underline">Ver Bandeja de Soporte →</Link>
        </div>

        {/* Overdue Tasks */}
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-6 w-6 text-amber-500" />
            <h2 className="font-heading text-2xl text-[var(--color-text)]">Tareas Vencidas</h2>
          </div>
          <div className="space-y-3">
            {(data?.lists?.overdue_tasks ?? []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm font-medium text-[var(--color-text)]/40">Agenda al día.</div>
            ) : (
              (data?.lists?.overdue_tasks ?? []).map((t) => (
                <div key={t.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 transition hover:border-amber-500/30">
                  <div className="font-semibold text-[var(--color-text)] line-clamp-1">{t.title}</div>
                  <div className="mt-3 flex gap-2">
                    {t.deal_id && <Link href={`/admin/deals?q=${encodeURIComponent(t.deal_id)}`} className="text-[10px] font-bold uppercase tracking-widest text-brand-blue bg-brand-blue/10 px-2 py-1 rounded-lg hover:bg-brand-blue/20">Ir al Deal</Link>}
                    {t.ticket_id && <Link href={`/admin/tickets/${t.ticket_id}`} className="text-[10px] font-bold uppercase tracking-widest text-brand-blue bg-brand-blue/10 px-2 py-1 rounded-lg hover:bg-brand-blue/20">Ir al Ticket</Link>}
                  </div>
                </div>
              ))
            )}
          </div>
          <Link href="/admin/tasks" className="mt-6 block text-center text-[10px] font-bold uppercase tracking-widest text-brand-blue hover:underline">Ir a Tareas →</Link>
        </div>

        {/* Pipeline Distribution */}
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-6 w-6 text-emerald-500" />
            <h2 className="font-heading text-2xl text-[var(--color-text)]">Flujo CRM</h2>
          </div>
          <div className="space-y-2">
            {stagePairs.length === 0 ? <div className="text-center text-sm text-[var(--color-text)]/40 py-6">Sin datos del pipeline.</div> : null}
            {stagePairs.map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text)]/70">{stage}</span>
                <span className="text-sm font-semibold text-brand-blue bg-brand-blue/10 px-3 py-1 rounded-full">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}