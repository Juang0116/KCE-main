'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import {
  ShieldCheck,
  Activity,
  Clock,
  Lock,
  AlertCircle,
  Zap,
  RefreshCw,
  Settings,
  CheckCircle2,
  XCircle,
  Terminal,
  Radio,
  ShieldAlert,
  Fingerprint,
  Layers,
  Key,
  Hash,
  Cpu,
  ChevronRight,
  Database,
  ArrowRight,
  Smartphone,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE OPERACIONES ---
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
  tickets: { open: number; pending: number; in_progress: number; urgent: number };
  tasks: { open: number; overdue: number; due_today: number; urgent: number };
  deals: Record<string, number>;
  controls?: {
    auto_promote?: { enabled: boolean; override?: 'runtime' | 'env'; updated_at?: string | null };
    channel_pauses?: {
      email?: { channel: string; paused_until: string; reason?: string | null } | null;
    };
  };
  lists: {
    urgent_tickets: Array<{
      id: string;
      subject: string | null;
      updated_at: string | null;
      priority: string | null;
    }>;
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

export function AdminOpsClient() {
  const [data, setData] = useState<OpsResp | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [approverToken, setApproverToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [approvalsErr, setApprovalsErr] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await adminFetch('/api/admin/ops', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || `Node Fail: ${r.status}`);
      setData(j as OpsResp);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadApprovals = useCallback(async () => {
    setApprovalsLoading(true);
    setApprovalsErr('');
    try {
      const res = await adminFetch('/api/admin/ops/approvals?status=pending', {
        cache: 'no-store',
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Auth node unreachable');
      setApprovals(j?.approvals || []);
    } catch (e: any) {
      setApprovalsErr(e.message);
    } finally {
      setApprovalsLoading(false);
    }
  }, []);

  const executeApproval = async (id: string) => {
    setApprovalsErr('');
    try {
      const res = await adminFetch(`/api/admin/ops/approvals/${encodeURIComponent(id)}/execute`, {
        method: 'POST',
        headers: { 'x-ops-approver-token': approverToken || '' },
      });
      if (!res.ok) throw new Error('Authorization denied');
      setApproverToken('');
      await Promise.all([loadApprovals(), load()]);
    } catch (e: any) {
      setApprovalsErr(e.message);
    }
  };

  const callControl = async (payload: unknown) => {
    try {
      const r = await adminFetch('/api/admin/ops/control', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error('Control rejected');
      await load();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    void load();
    void loadApprovals();
  }, [load, loadApprovals]);

  const signals = useMemo(
    () => [
      {
        label: 'Urgencia CRM',
        value: String(data?.tickets?.urgent ?? 0),
        note: 'Tickets bajo alerta roja.',
      },
      {
        label: 'Deuda Operativa',
        value: String(data?.tasks?.overdue ?? 0),
        note: 'Tareas vencidas hoy.',
      },
      { label: 'Pending Auth', value: String(approvals.length), note: 'Two-Man Rule activa.' },
    ],
    [data, approvals],
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-32 duration-1000">
      {/* 01. CABECERA DE MANDO CENTRAL */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 px-2 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Terminal className="h-3.5 w-3.5" /> Command Lane: /ops-center-node
          </div>
          <h1 className="font-heading text-4xl leading-none tracking-tighter text-main md:text-6xl">
            Operations <span className="font-light italic text-brand-yellow">Center</span>
          </h1>
          <p className="mt-2 max-w-2xl text-base font-light leading-relaxed text-muted">
            Nodo de soberanía administrativa para Knowing Cultures S.A.S. Supervisa el estado de
            integridad global, audita la deuda operativa y gestiona protocolos de seguridad.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/ops/notifications"
            className="flex h-12 items-center gap-2 rounded-full border border-brand-dark/10 bg-surface px-6 text-[10px] font-bold uppercase tracking-widest text-muted shadow-sm transition-all hover:bg-surface-2 hover:text-main"
          >
            <Bell className="h-3.5 w-3.5" /> Alertas
          </Link>
          <Link
            href="/admin/ops/runbooks"
            className="flex h-12 items-center gap-2 rounded-full border border-brand-dark/10 bg-surface px-6 text-[10px] font-bold uppercase tracking-widest text-muted shadow-sm transition-all hover:bg-surface-2 hover:text-main"
          >
            <Database className="h-3.5 w-3.5" /> Protocolos
          </Link>
          <Button
            onClick={() => void load()}
            disabled={loading}
            className="h-12 rounded-full bg-brand-dark px-8 text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
          </Button>
        </div>
      </header>

      {/* 02. WORKBENCH DE GOBERNANZA */}
      <AdminOperatorWorkbench
        eyebrow="Stability & Governance"
        title="Sanidad Operativa del Núcleo"
        description="Gestiona la sanidad estructural del sistema. El retraso en tareas críticas o tickets urgentes degrada la promesa de servicio premium de la marca."
        actions={[
          { href: '/admin/ops/incidents', label: 'Analizar Fallas', tone: 'primary' },
          { href: '/admin/events', label: 'Visor Forense' },
        ]}
        signals={signals}
      />

      {err && (
        <div className="animate-in slide-in-from-top-2 mx-2 flex items-center gap-4 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 p-6 font-bold text-red-700 shadow-sm dark:bg-red-950/10 dark:text-red-400">
          <ShieldAlert className="h-6 w-6 opacity-60" /> Protocolo de Error:{' '}
          <span className="font-light">{err}</span>
        </div>
      )}

      {/* 03. GRID DE CONTROLES Y SEGURIDAD */}
      <div className="grid gap-10 lg:grid-cols-2">
        {/* PANEL DE CONTROL DINÁMICO (OVERRIDE) */}
        <section className="relative space-y-12 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5 md:p-12">
          <div className="pointer-events-none absolute -right-10 -top-10 opacity-[0.02]">
            <Settings className="h-64 w-64" />
          </div>
          <header className="relative z-10 flex items-center gap-4 border-b border-brand-dark/5 pb-8 dark:border-white/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue shadow-inner">
              <Radio className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading text-3xl uppercase tracking-tight text-main">
                Override del Sistema
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">
                Manual Control Protocol
              </p>
            </div>
          </header>

          <div className="relative z-10 space-y-8">
            {/* Control Auto-Promote */}
            <div className="bg-surface-2/30 group rounded-[2.2rem] border border-brand-dark/5 p-8 shadow-inner">
              <div className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <p className="text-base font-bold uppercase tracking-tight text-main">
                    Auto-Promote Engine
                  </p>
                  <p className="text-sm font-light italic text-muted">
                    Avanza deals según pesos algorítmicos automáticos.
                  </p>
                </div>
                <div
                  className={`rounded-full border px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${data?.controls?.auto_promote?.enabled ? 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400' : 'animate-pulse border-red-500/20 bg-red-500/10 text-red-700'}`}
                >
                  {data?.controls?.auto_promote?.enabled ? 'Nominal_Active' : 'Override_Active'}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    void callControl({
                      action: 'set_flag',
                      key: 'crm_auto_promote_weights',
                      value: data?.controls?.auto_promote?.enabled ? 'false' : 'true',
                    })
                  }
                  className={`h-12 flex-1 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-soft transition-all active:scale-95 ${data?.controls?.auto_promote?.enabled ? 'bg-brand-dark text-brand-yellow hover:bg-red-600 hover:text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  {data?.controls?.auto_promote?.enabled ? 'Pausar Nodo' : 'Activar Nodo'}
                </button>
                <button
                  onClick={() =>
                    void callControl({ action: 'clear_flag', key: 'crm_auto_promote_weights' })
                  }
                  className="h-12 rounded-xl border border-brand-dark/10 bg-surface px-6 text-muted shadow-sm transition-all hover:border-brand-blue/30 hover:text-brand-blue"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Control Email */}
            <div className="bg-surface-2/30 rounded-[2.2rem] border border-brand-dark/5 p-8 shadow-inner">
              <div className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <p className="text-base font-bold uppercase tracking-tight text-main">
                    Comunicaciones Globales
                  </p>
                  <p className="flex items-center gap-2 text-sm font-light italic text-muted">
                    <Smartphone className="h-3.5 w-3.5 opacity-40" />
                    {data?.controls?.channel_pauses?.email?.reason || 'Protocolo de salida activo.'}
                  </p>
                </div>
                <div
                  className={`rounded-full border px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${data?.controls?.channel_pauses?.email ? 'border-red-500/20 bg-red-500/10 text-red-700' : 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400'}`}
                >
                  {data?.controls?.channel_pauses?.email ? 'Channel_Locked' : 'Transmitting'}
                </div>
              </div>
              <Button
                onClick={() =>
                  void callControl({
                    action: data?.controls?.channel_pauses?.email
                      ? 'resume_channel'
                      : 'pause_channel',
                    channel: 'email',
                    minutes: 60,
                    reason: 'Manual Ops Pause',
                  })
                }
                className={`h-14 w-full rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-pop transition-all active:scale-95 ${data?.controls?.channel_pauses?.email ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-brand-dark text-brand-yellow hover:bg-red-600 hover:text-white'}`}
              >
                {data?.controls?.channel_pauses?.email
                  ? 'Reanudar Transmisión'
                  : 'Lock Email Channel (1h)'}
              </Button>
            </div>
          </div>
        </section>

        {/* GOBERNANZA RBAC (EL BÚNKER OSCURO) */}
        <section className="group relative space-y-10 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/20 bg-brand-dark p-10 text-white shadow-2xl md:p-12">
          <div className="pointer-events-none absolute -bottom-20 -right-20 opacity-[0.03] transition-transform duration-1000 group-hover:scale-110">
            <Lock className="h-[30rem] w-[30rem]" />
          </div>

          <header className="relative z-10 flex items-center justify-between border-b border-white/5 pb-8">
            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-yellow/10 text-brand-yellow shadow-inner ring-1 ring-brand-yellow/20">
                <Key className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading text-3xl tracking-tight">Gobernanza RBAC</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">
                  Auth Session Integrity
                </p>
              </div>
            </div>
            {data?.access?.breakglassActive && (
              <div className="animate-pulse rounded-full bg-red-600 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                Emergency Breakglass Active
              </div>
            )}
          </header>

          <div className="relative z-10 space-y-8">
            <div className="group/sig rounded-[1.8rem] border border-white/10 bg-white/5 p-6 shadow-inner">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">
                Active Node Signature
              </p>
              <div className="flex items-center gap-3 font-mono text-base text-brand-yellow transition-transform group-hover/sig:translate-x-1">
                <Fingerprint className="h-5 w-5 opacity-50" />
                <span className="tracking-tight">
                  {data?.access?.actor || 'ROOT_SESSION_STABLE'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 shadow-inner">
                <p className="mb-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">
                  <ShieldCheck className="h-3 w-3" /> Active Roles
                </p>
                <div className="flex flex-wrap gap-2">
                  {data?.access?.roles.map((r) => (
                    <span
                      key={r}
                      className="rounded-md border border-brand-blue/20 bg-brand-blue/20 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-tighter text-brand-blue"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-[1.8rem] border border-white/10 bg-white/5 p-6 shadow-inner">
                <p className="mb-4 text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">
                  Auth Mode
                </p>
                <div className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-widest text-green-400">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  {data?.access?.mode || 'READ_WRITE_SECURE'}
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-4 border-t border-white/5 pt-8 text-[9px] font-bold uppercase italic tracking-[0.5em] text-white/10">
            <Terminal className="h-3 w-3" /> Knowing Cultures Security MMXXVI
          </div>
        </section>
      </div>

      {/* 04. TWO-MAN RULE (LA BÓVEDA DE AUTORIZACIÓN) */}
      <section className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
        <header className="bg-surface-2/30 flex flex-col justify-between gap-10 border-b border-brand-dark/5 p-10 dark:border-white/5 md:p-12 lg:flex-row lg:items-center">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-green-500/10 text-green-600 shadow-inner ring-1 ring-green-500/20">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-heading text-4xl leading-none tracking-tight text-main">
                Two-Man Rule <span className="font-light italic text-brand-blue">Vault</span>
              </h2>
              <p className="text-base font-light italic text-muted">
                Protocolo de autorización obligatoria para maniobras críticas de alto nivel.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
              Master Approver Token
            </label>
            <div className="group relative">
              <Key className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-blue opacity-30 transition-opacity group-focus-within:opacity-100" />
              <input
                type="password"
                className="placeholder:text-muted/30 h-14 w-full rounded-2xl border border-brand-dark/10 bg-surface pl-12 pr-6 font-mono text-sm text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10 lg:w-96"
                placeholder="Insert Key Token..."
                value={approverToken}
                onChange={(e) => setApproverToken(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="p-8 md:p-10">
          <div className="custom-scrollbar overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-3 text-left text-sm">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted opacity-50">
                  <th className="px-8 py-4">Misión & Expiración</th>
                  <th className="px-8 py-4">Protocolo de Acción</th>
                  <th className="px-8 py-4 text-center">Status</th>
                  <th className="px-8 py-4 text-right">Mando</th>
                </tr>
              </thead>
              <tbody>
                {approvals.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="bg-surface-2/20 rounded-[2rem] border border-dashed border-brand-dark/10 px-8 py-32 text-center"
                    >
                      <ShieldAlert className="mx-auto mb-6 h-16 w-16 text-brand-blue opacity-10" />
                      <p className="font-heading text-xl tracking-tight text-main opacity-30">
                        Vigilancia Total
                      </p>
                      <p className="mt-2 text-sm font-light italic text-muted">
                        No se han detectado protocolos de autorización pendientes.
                      </p>
                    </td>
                  </tr>
                ) : (
                  approvals.map((a) => (
                    <tr
                      key={a.id}
                      className="group"
                    >
                      <td className="rounded-l-[2rem] border-y border-l border-brand-dark/5 bg-surface px-8 py-8 shadow-sm dark:border-white/5">
                        <div className="flex items-center gap-3 text-base font-bold text-main">
                          <Clock className="h-4 w-4 text-brand-blue opacity-40" />
                          {new Date(a.created_at).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </div>
                        <div className="mt-2 flex w-fit items-center gap-2 rounded-md bg-red-500/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-red-600">
                          <Zap className="h-3 w-3" /> Exp:{' '}
                          {new Date(a.expires_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="border-y border-brand-dark/5 bg-surface px-8 py-8 dark:border-white/5">
                        <div className="font-heading text-2xl tracking-tight text-brand-blue transition-transform group-hover:translate-x-1">
                          {a.action.toUpperCase()}
                        </div>
                        <div className="mt-2 font-mono text-[9px] text-muted opacity-40">
                          OBJECT_ID: {a.id.slice(0, 16)}
                        </div>
                      </td>
                      <td className="border-y border-brand-dark/5 bg-surface px-8 py-8 text-center dark:border-white/5">
                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-amber-700 shadow-inner ring-4 ring-amber-500/5">
                          {a.status}
                        </span>
                      </td>
                      <td className="rounded-r-[2rem] border-y border-r border-brand-dark/5 bg-surface px-8 py-8 text-right shadow-sm dark:border-white/5">
                        <Button
                          onClick={() => void executeApproval(a.id)}
                          disabled={!approverToken}
                          className="h-12 rounded-xl bg-green-600 px-8 text-[10px] font-bold uppercase tracking-widest text-white shadow-pop transition-all hover:bg-green-700 active:scale-95 disabled:opacity-20"
                        >
                          Ejecutar Autorización
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {approvalsErr && (
            <div className="animate-in slide-in-from-bottom-2 mt-8 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-xs font-bold text-red-700">
              <AlertCircle className="h-4 w-4" /> Error de Autorización: {approvalsErr}
            </div>
          )}
        </div>
      </section>

      {/* 05. FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Confidence Operations Active
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Layers className="h-4 w-4 opacity-50" /> Command Center v4.8
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Zap className="h-4 w-4 animate-pulse" /> Core Signal Monitoring
        </div>
      </footer>
    </div>
  );
}
