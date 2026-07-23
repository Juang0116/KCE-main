'use client';

import Link from 'next/link';
import { useMemo, useState, useCallback } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import {
  ShieldCheck,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Server,
  Target,
  Clock,
  Rocket,
  Terminal,
  ShieldAlert,
  Layers,
  Search,
  Smartphone,
  Check as CheckIcon,
  ChevronRight,
  Hash,
  Database,
  Cpu,
  Globe,
  Layout,
  Info,
  Gauge,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE QA & RELEASE ---
type CheckData = { id: string; label: string; ok: boolean; ms: number; detail?: string };
type QaResponse = {
  ok: boolean;
  deep: boolean;
  mode?: 'dev' | 'prod';
  requestId: string;
  summary: { passed: number; failed: number };
  checks: CheckData[];
};
type RcCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
  meta?: Record<string, unknown>;
};
type RcVerifyResult = {
  ok: boolean;
  requestId: string;
  session_id: string;
  booking_id: string | null;
  checks: RcCheck[];
  next_actions?: string[];
};

export default function AdminQaClient() {
  const [loading, setLoading] = useState(false);
  const [deep, setDeep] = useState(false);
  const [prodMode, setProdMode] = useState(false);
  const [data, setData] = useState<QaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [rcSessionId, setRcSessionId] = useState('');
  const [rcLoading, setRcLoading] = useState(false);
  const [rcData, setRcData] = useState<RcVerifyResult | null>(null);
  const [rcError, setRcError] = useState<string | null>(null);

  // Ejecutar QA Base
  const runQa = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/qa/run?deep=${deep ? '1' : '0'}&mode=${prodMode ? 'prod' : 'dev'}`,
        { cache: 'no-store' },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'QA_Node_Failure');
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [deep, prodMode]);

  // Verificar Revenue Flow (E2E)
  const runRcVerify = async (opts?: { healBooking?: boolean; healEmail?: boolean }) => {
    const sid = rcSessionId.trim();
    if (!sid) return;
    setRcLoading(true);
    setRcError(null);
    try {
      const p = new URLSearchParams({ session_id: sid });
      if (opts?.healBooking) p.set('heal_booking', '1');
      if (opts?.healEmail) p.set('heal_email', '1');
      const res = await fetch(`/api/admin/qa/rc-verify?${p.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `RC_Verify_Error: ${res.status}`);
      setRcData(json);
    } catch (e: any) {
      setRcError(e.message);
    } finally {
      setRcLoading(false);
    }
  };

  const groupedQa = useMemo(() => {
    const groups: Record<string, CheckData[]> = {};
    (data?.checks ?? []).forEach((c) => {
      const key = c.id.split('.')[0] || 'core';
      groups[key] = [...(groups[key] || []), c];
    });
    return groups;
  }, [data]);

  const rcCheckMap = useMemo(() => new Map((rcData?.checks ?? []).map((c) => [c.id, c])), [rcData]);

  // Score de Salida (Blended QA + Revenue)
  const gateScore = useMemo(() => {
    const qaTotal = (data?.summary.passed ?? 0) + (data?.summary.failed ?? 0) || 1;
    const qaScore = Math.round(((data?.summary.passed ?? 0) / qaTotal) * 100);

    const rcChecks = rcData?.checks ?? [];
    const rcPassed = rcChecks.filter((c) => c.ok).length;
    const rcScore = rcChecks.length > 0 ? Math.round((rcPassed / rcChecks.length) * 100) : null;

    const blended = rcScore === null ? qaScore : Math.round(qaScore * 0.4 + rcScore * 0.6);

    return {
      score: blended,
      label: blended >= 90 ? 'SHIP READY' : blended >= 75 ? 'HARDEN REQUIRED' : 'CRITICAL FAILURE',
      color:
        blended >= 90 ? 'text-green-500' : blended >= 75 ? 'text-brand-yellow' : 'text-red-600',
    };
  }, [data, rcData]);

  const signals = [
    { label: 'Release Integrity', value: `${gateScore.score}%`, note: gateScore.label },
    {
      label: 'Revenue Path',
      value: rcData?.ok ? 'VERIFIED' : 'PENDING',
      note: 'E2E Transaction Flow',
    },
    {
      label: 'System Mode',
      value: prodMode ? 'PRODUCTION' : 'STAGING',
      note: 'Deployment Environment',
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-32 duration-1000">
      {/* 01. CABECERA DE INGENIERÍA (MISSION CONTROL) */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 px-2 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Rocket className="h-4 w-4" /> Deployment Lane: /release-gate-node
          </div>
          <h1 className="font-heading text-4xl leading-none tracking-tighter text-main md:text-7xl">
            QA & <span className="font-light italic text-brand-yellow">Release Gates</span>
          </h1>
          <p className="mt-2 max-w-2xl text-base font-light italic leading-relaxed text-muted">
            Nodo de validación pre-vuelo para Knowing Cultures S.A.S. Audita la infraestructura, el
            flujo de revenue y las dependencias críticas antes del Go-Live.
          </p>
        </div>
      </header>

      {/* 02. WORKBENCH OPERATIVO */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>QA failed:</strong> {error}
        </div>
      )}
      <AdminOperatorWorkbench
        eyebrow="Stability Protocol"
        title="Sanidad antes del Go-Live"
        description="Primero ejecuta la auditoría de sistema profunda. Luego, inyecta un ID de sesión de Stripe para confirmar que el ciclo de 'Webhook -> Booking -> Email' es impecable."
        actions={[
          { href: '/admin/ops/metrics', label: 'Monitor de SLA', tone: 'primary' },
          { href: '/admin/events', label: 'Visor de Trazas' },
        ]}
        signals={signals}
      />

      {/* 03. DASHBOARDS DE PUNTUACIÓN */}
      <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        {/* SCORE DE INTEGRIDAD (LA BÓVEDA) */}
        <section className="relative space-y-10 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5 md:p-12">
          <div className="pointer-events-none absolute -right-10 -top-10 rotate-12 opacity-[0.02]">
            <ShieldCheck className="h-[25rem] w-[25rem] text-brand-blue" />
          </div>

          <header className="relative z-10 space-y-4 border-b border-brand-dark/5 pb-8 dark:border-white/5">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
              <Gauge className="h-4 w-4" /> Integrity Gauge
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <span
                className={`font-heading text-8xl leading-none tracking-tighter ${gateScore.color}`}
              >
                {gateScore.score}%
              </span>
              <div className="pb-2">
                <p
                  className={`font-mono text-xs font-bold uppercase tracking-widest ${gateScore.color} opacity-80`}
                >
                  {gateScore.label}
                </p>
                <p className="mt-1 text-[10px] font-light italic text-muted">
                  Blended Health Metric v4.4
                </p>
              </div>
            </div>
          </header>

          <div className="relative z-10 grid gap-4 sm:grid-cols-2">
            {[
              { t: 'QA Base Auditor', s: data ? 'done' : 'todo', ic: Terminal },
              { t: 'Revenue Path', s: rcData ? (rcData.ok ? 'done' : 'partial') : 'todo', ic: Zap },
              {
                t: 'Signed Link Token',
                s: rcData ? (rcCheckMap.get('links.token')?.ok ? 'done' : 'partial') : 'todo',
                ic: Database,
              },
              { t: 'Mobile UX Sync', s: 'manual', ic: Smartphone },
            ].map((gate) => (
              <div
                key={gate.t}
                className={`flex items-center justify-between rounded-[2rem] border p-6 shadow-sm transition-all ${
                  gate.s === 'done'
                    ? 'border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400'
                    : gate.s === 'partial'
                      ? 'border-brand-yellow/20 bg-brand-yellow/5 text-brand-yellow'
                      : gate.s === 'manual'
                        ? 'border-brand-blue/20 bg-brand-blue/5 text-brand-blue'
                        : 'border-brand-dark/5 bg-surface-2 opacity-40'
                }`}
              >
                <div className="flex items-center gap-4">
                  <gate.ic className="h-5 w-5 opacity-40" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em]">{gate.t}</p>
                </div>
                {gate.s === 'done' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : gate.s === 'manual' ? (
                  <Info className="h-5 w-5 animate-pulse" />
                ) : (
                  <Clock className="h-5 w-5 opacity-30" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* E2E REVENUE DESK (EL BÚNKER OSCURO) */}
        <section className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-white/5 bg-brand-dark p-10 text-white shadow-2xl md:p-14">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-blue/30 via-transparent to-transparent opacity-40" />

          <header className="relative z-10 mb-14 flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-brand-yellow/20 bg-brand-yellow/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-yellow backdrop-blur-xl">
                <Zap className="h-4 w-4 fill-current" /> Revenue E2E Protocol
              </div>
              <h3 className="font-heading text-4xl leading-none tracking-tight">
                Cobro & Entrega <span className="font-light italic text-brand-blue">Forense</span>
              </h3>
              <p className="max-w-md border-l border-white/10 pl-6 text-base font-light italic text-white/50">
                Valida si el Kernel de KCE puede procesar el pago masivo y emitir tickets sin
                intervención humana.
              </p>
            </div>
          </header>

          <div className="relative z-10 grid gap-4 sm:grid-cols-2">
            {[
              { l: 'Checkout & Liquidez', ids: ['stripe.session', 'stripe.paid'] },
              {
                l: 'Webhook Integrity',
                ids: ['events.checkout_paid', 'events.stripe_webhook_received'],
              },
              { l: 'Booking Registry', ids: ['supabase.booking_exists'] },
              { l: 'Dispatch Node', ids: ['events.email_sent', 'links.token'] },
            ].map((block) => {
              const checks = block.ids.map((id) => rcCheckMap.get(id)).filter(Boolean);
              const allOk = checks.length > 0 && checks.every((c) => c?.ok);
              return (
                <div
                  key={block.l}
                  className={`group/block flex items-center justify-between rounded-[1.8rem] border p-6 transition-all ${allOk ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                >
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
                      {block.l}
                    </p>
                    <div className="flex gap-1">
                      {block.ids.map((id) => (
                        <div
                          key={id}
                          className={`h-1 w-4 rounded-full ${rcCheckMap.get(id)?.ok ? 'bg-green-500' : 'bg-white/10'}`}
                        />
                      ))}
                    </div>
                  </div>
                  {allOk ? (
                    <CheckIcon className="h-6 w-6 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                  ) : (
                    <Database className="h-6 w-6 text-white/10" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="relative z-10 mt-12 flex items-center gap-4 border-t border-white/5 pt-8 text-[9px] font-bold uppercase tracking-[0.5em] text-white/10">
            <Globe className="h-3 w-3" /> Trans-Atlantic Secure Node Verified
          </div>
        </section>
      </div>

      {/* 04. CONTROLES TÁCTICOS */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* EJECUTOR QA (BÓVEDA DE INSTRUMENTACIÓN) */}
        <section className="relative space-y-10 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5 md:p-12">
          <header className="flex items-center justify-between border-b border-brand-dark/5 pb-8 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue shadow-inner">
                <Terminal className="h-6 w-6" />
              </div>
              <h2 className="font-heading text-3xl uppercase leading-none tracking-tight text-main">
                Instrumentación Base
              </h2>
            </div>
            <div
              className={`rounded-full px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest ${data ? 'bg-green-500/10 text-green-700' : 'bg-surface-2 text-muted opacity-40'}`}
            >
              {data ? 'Audit_Registry_Ready' : 'Waiting_Sequence'}
            </div>
          </header>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setDeep(!deep)}
              className={`flex grow items-center gap-4 rounded-[1.8rem] border px-8 py-5 shadow-sm transition-all sm:grow-0 ${deep ? 'border-brand-blue bg-brand-blue text-white ring-4 ring-brand-blue/10' : 'border-brand-dark/10 bg-surface text-muted hover:border-brand-blue/30'}`}
            >
              <div
                className={`h-2.5 w-2.5 rounded-full ${deep ? 'animate-pulse bg-white' : 'bg-muted opacity-30'}`}
              />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                Red Profunda (APIs)
              </span>
            </button>
            <button
              onClick={() => setProdMode(!prodMode)}
              className={`flex grow items-center gap-4 rounded-[1.8rem] border px-8 py-5 shadow-sm transition-all sm:grow-0 ${prodMode ? 'border-red-600 bg-red-600 text-white ring-4 ring-red-600/10' : 'border-brand-dark/10 bg-surface text-muted hover:border-red-600/30'}`}
            >
              <Globe className={`h-4 w-4 ${prodMode ? 'animate-spin-slow' : 'opacity-30'}`} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                Modo Producción
              </span>
            </button>
          </div>

          <Button
            onClick={() => void runQa()}
            disabled={loading}
            className="flex h-16 w-full items-center justify-center gap-4 rounded-[2rem] bg-brand-dark text-xs font-bold uppercase tracking-[0.2em] text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95 disabled:opacity-30"
          >
            <Activity
              className={`h-5 w-5 ${loading ? 'animate-spin' : 'animate-pulse text-brand-blue'}`}
            />
            {loading ? 'AUDITORÍA EN CURSO...' : 'LANZAR VERIFICACIÓN DE SISTEMA'}
          </Button>

          {data && (
            <div className="animate-in fade-in slide-in-from-top-4 space-y-8 duration-500">
              {Object.entries(groupedQa).map(([group, checks]) => (
                <div
                  key={group}
                  className="space-y-4"
                >
                  <div className="ml-2 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40">
                    <Hash className="h-3 w-3" /> {group}_trace_node
                  </div>
                  <div className="grid gap-3">
                    {checks.map((c) => (
                      <div
                        key={c.id}
                        className="bg-surface-2/50 flex items-center justify-between rounded-2xl border border-brand-dark/5 p-5 shadow-inner transition-colors hover:bg-surface-2"
                      >
                        <div className="flex items-center gap-4">
                          {c.ok ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 animate-pulse text-red-600" />
                          )}
                          <span className="text-xs font-bold uppercase tracking-tight text-main">
                            {c.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-px w-8 bg-brand-dark/10" />
                          <span className="font-mono text-[10px] text-muted opacity-60">
                            {c.ms}ms
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* REVENUE DEBUGGER (BÓVEDA DE TRAZABILIDAD) */}
        <section className="relative space-y-10 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5 md:p-12">
          <header className="flex items-center justify-between border-b border-brand-dark/5 pb-8 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-yellow/10 text-brand-yellow shadow-inner">
                <Layers className="h-6 w-6" />
              </div>
              <h2 className="font-heading text-3xl uppercase leading-none tracking-tight text-main">
                Revenue Debugger
              </h2>
            </div>
            <div className="rounded-lg border border-brand-dark/5 bg-surface-2 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-muted">
              E2E_Logic
            </div>
          </header>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                Stripe Session Identity
              </label>
              <div className="group relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-blue opacity-30 transition-opacity group-focus-within:opacity-100" />
                <input
                  value={rcSessionId}
                  onChange={(e) => setRcSessionId(e.target.value)}
                  placeholder="cs_live_..."
                  className="placeholder:text-muted/30 h-16 w-full rounded-2xl border border-brand-dark/10 bg-surface-2 pl-12 pr-6 font-mono text-sm font-bold text-brand-blue shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Button
                onClick={() => void runRcVerify()}
                disabled={!rcSessionId || rcLoading}
                className="h-14 rounded-2xl bg-brand-dark text-[10px] font-bold uppercase tracking-widest text-brand-yellow shadow-soft transition-all hover:bg-brand-blue hover:text-white active:scale-95 disabled:opacity-20"
              >
                {rcLoading ? 'Analyzing...' : 'Verificar E2E Flow'}
              </Button>
              <Button
                onClick={() => void runRcVerify({ healBooking: true })}
                disabled={!rcSessionId || rcLoading}
                className="h-14 rounded-2xl bg-green-600 text-[10px] font-bold uppercase tracking-widest text-white shadow-pop transition-all hover:bg-green-700 active:scale-95 disabled:opacity-20"
              >
                Heal + Re-dispatch
              </Button>
            </div>
          </div>

          {rcData && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-500">
              <div className="ml-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40">
                Forensic_Output
              </div>
              <div className="grid gap-3">
                {rcData.checks.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col gap-2 rounded-2xl border border-brand-dark/5 bg-surface p-5 shadow-soft"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {c.ok ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <ShieldAlert className="h-5 w-5 text-red-600" />
                        )}
                        <span className="text-xs font-black uppercase tracking-tight text-main">
                          {c.label}
                        </span>
                      </div>
                      <span
                        className={`rounded border px-2 py-0.5 font-mono text-[9px] ${c.ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}
                      >
                        {c.ok ? 'OK' : 'FAIL'}
                      </span>
                    </div>
                    {c.detail && (
                      <div className="mt-2 break-all rounded-xl border border-brand-dark/5 bg-surface-2 p-3 font-mono text-[11px] leading-relaxed text-muted">
                        <ChevronRight className="mr-1 inline h-3 w-3 opacity-30" />
                        {c.detail}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {rcError && (
            <div className="animate-in shake-in flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-xs font-bold text-red-700">
              <AlertTriangle className="h-5 w-5" /> NODE_ERROR: {rcError}
            </div>
          )}
        </section>
      </div>

      {/* 05. FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> Release Integrity Verified
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Cpu className="h-4 w-4 opacity-50" /> Pipeline Control v4.4
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Zap className="h-4 w-4 animate-pulse" /> Live Deployment Gate Active
        </div>
      </footer>
    </div>
  );
}
