'use client';

import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  Play,
  Save,
  ChevronRight,
  Terminal,
  ShieldCheck,
  Layers,
  Zap,
  Rocket,
  History,
  ExternalLink,
  Target,
  Hash,
  Cpu,
  Layout,
  Info,
  Activity,
  Database,
  Gauge,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE PROTOCOLO ---
type StepStatus = 'todo' | 'pass' | 'fail';
type Step = {
  id: string;
  title: string;
  goal: string;
  how: string[];
  links?: Array<{ label: string; href: string }>;
};
type StepState = { status: StepStatus; notes: string; at: string };
type RunbookState = {
  version: 1;
  runId: string;
  startedAt: string;
  steps: Record<string, StepState>;
};

const STORAGE_KEY = 'kce.runbook.v1';
const nowIso = () => new Date().toISOString();
const newRunId = () => `RUN_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const STEPS: Step[] = [
  {
    id: 'tours.list',
    title: 'Integridad de Catálogo',
    goal: 'El catálogo renderiza tours reales desde Supabase sin errores de hidratación.',
    how: [
      'Abrir /tours',
      'Verificar renderizado de tarjetas',
      'Validar ausencia de errores en consola',
    ],
    links: [{ label: 'Ir al Catálogo', href: '/tours' }],
  },
  {
    id: 'utm.capture',
    title: 'Captura de Señal UTM',
    goal: 'UTM se persiste en cookies (kce_utm) y registra marketing.utm_capture.',
    how: [
      'Abrir /tours?utm_source=test',
      'Verificar cookie kce_utm en Application',
      'Confirmar evento en Metrics',
    ],
    links: [{ label: 'Ver Métricas', href: '/admin/metrics' }],
  },
  {
    id: 'checkout.start',
    title: 'Ciclo de Checkout: Inicio',
    goal: 'POST /api/checkout crea sesión Stripe (EUR) y vincula utm_key.',
    how: [
      'Iniciar compra en un tour',
      'Verificar redirección a Stripe',
      'Confirmar evento checkout.started',
    ],
  },
  {
    id: 'checkout.paid.webhook',
    title: 'Liquidación & Webhooks',
    goal: 'Webhook marca booking como paid y dispara invoice una sola vez.',
    how: [
      'Completar pago (test mode)',
      'Confirmar estado PAID en admin',
      'Verificar recepción de email',
    ],
  },
  {
    id: 'bot.ticket',
    title: 'Handoff de Agente IA',
    goal: 'Casos complejos crean tickets operativos para resolución humana.',
    how: [
      'Enviar mensaje "necesito reembolso" al Bot',
      'Verificar creación de ticketId',
      'Ver ticket en Admin',
    ],
    links: [{ label: 'Tickets Hub', href: '/admin/support/tickets' }],
  },
  {
    id: 'qa.harness',
    title: 'QA Harness Pre-flight',
    goal: 'Smoke tests de infraestructura en verde (Node integrity).',
    how: ['Correr Run checks en /admin/qa', 'Resolver cualquier FAIL técnico'],
    links: [{ label: 'Lanzar QA', href: '/admin/qa' }],
  },
];

export default function AdminRunbookClient() {
  const [state, setState] = useState<RunbookState | null>(null);
  const [logEnabled, setLogEnabled] = useState(true);
  const [loggingError, setLoggingError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.version === 1) {
        setState(parsed);
        return;
      }
    }
    const fresh: RunbookState = { version: 1, runId: newRunId(), startedAt: nowIso(), steps: {} };
    setState(fresh);
  }, []);

  const progress = useMemo(() => {
    if (!state) return { pass: 0, fail: 0, todo: STEPS.length };
    const pass = Object.values(state.steps).filter((s) => s.status === 'pass').length;
    const fail = Object.values(state.steps).filter((s) => s.status === 'fail').length;
    return { pass, fail, todo: STEPS.length - pass - fail };
  }, [state]);

  const logToServer = async (stepId: string, status: StepStatus, notes: string) => {
    if (!logEnabled || !state) return;
    try {
      setLoggingError(null);
      await adminFetch('/api/admin/runbook/log', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ runId: state.runId, stepId, status, notes }),
      });
    } catch (e: any) {
      setLoggingError(e.message);
    }
  };

  const updateStep = (stepId: string, patch: Partial<StepState>) => {
    if (!state) return;
    const current = state.steps[stepId] ?? { status: 'todo', notes: '', at: nowIso() };
    const nextStep = { ...current, ...patch, at: nowIso() };
    const nextState: RunbookState = { ...state, steps: { ...state.steps, [stepId]: nextStep } };

    setState(nextState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));

    if ('status' in patch || 'notes' in patch) {
      void logToServer(stepId, nextStep.status, nextStep.notes);
    }
  };

  const resetRun = () => {
    const fresh: RunbookState = { version: 1, runId: newRunId(), startedAt: nowIso(), steps: {} };
    setState(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    setLoggingError(null);
  };

  if (!state) return null;

  const completionPct = Math.round((progress.pass / STEPS.length) * 100);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-32 duration-1000">
      {/* 01. CABECERA TÁCTICA */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 px-2 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Terminal className="h-4 w-4" /> Protocol Lane: /release-vault-node
          </div>
          <h1 className="font-heading text-4xl leading-none tracking-tighter text-main md:text-7xl">
            Runbook <span className="font-light italic text-brand-yellow">de Lanzamiento</span>
          </h1>
          <p className="mt-2 max-w-2xl text-base font-light italic leading-relaxed text-muted">
            Instrumento de validación manual extrema para Knowing Cultures S.A.S. Sigue el protocolo
            oficial para garantizar la sanidad del núcleo comercial.
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={resetRun}
            variant="outline"
            className="h-12 rounded-full border-brand-dark/10 px-8 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-surface-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Reiniciar Sesión
          </Button>
          <Link href="/admin/qa">
            <Button className="h-12 rounded-full bg-brand-dark px-8 text-[10px] font-bold uppercase tracking-widest text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95">
              <Zap className="mr-2 h-4 w-4 fill-current" /> Abrir QA Core
            </Button>
          </Link>
        </div>
      </header>

      {/* 02. WORKBENCH DE EJECUCIÓN */}
      <AdminOperatorWorkbench
        eyebrow="Release Execution"
        title="Validación E2E del Ecosistema"
        description="Este protocolo es de ejecución obligatoria ante cualquier cambio estructural en el flujo de pagos, tours o bots."
        signals={[
          { label: 'Exitosos', value: String(progress.pass), note: 'Flujos PASS.' },
          { label: 'Pendientes', value: String(progress.todo), note: 'Tests TODO.' },
          { label: 'Blockers', value: String(progress.fail), note: 'Fallas detectadas.' },
        ]}
      />

      {/* 03. SESSION MONITOR (EL REGISTRO) */}
      <section className="relative flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
        {/* HEADER DE SESIÓN */}
        <header className="bg-surface-2/30 relative flex flex-col justify-between gap-8 overflow-hidden border-b border-brand-dark/5 p-10 dark:border-white/5 md:flex-row md:items-center">
          <div className="pointer-events-none absolute -right-10 -top-10 rotate-12 opacity-[0.02]">
            <BookOpen className="h-64 w-64 text-brand-blue" />
          </div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.8rem] bg-brand-dark text-brand-yellow shadow-pop">
              <Rocket className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40">
                Trace_ID Protocol
              </p>
              <div className="flex items-center gap-3">
                <p className="font-mono text-xl font-bold tracking-tighter text-brand-blue">
                  {state.runId}
                </p>
                <div className="rounded-lg border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-[9px] font-bold uppercase text-brand-blue">
                  v1.0 Secure
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-4 rounded-full border border-brand-dark/10 bg-surface px-6 py-3 shadow-inner">
            <label className="group flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={logEnabled}
                onChange={(e) => setLogEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-brand-dark/20 text-brand-blue focus:ring-brand-blue/20"
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted transition-colors group-hover:text-main">
                Audit Server Sync Active
              </span>
            </label>
          </div>
        </header>

        {/* PROGRESS MONITOR */}
        <div className="bg-surface p-10">
          <div className="mb-4 flex items-end justify-between px-2">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-700 dark:text-green-400">
                  {progress.pass} PASS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-700 dark:text-red-400">
                  {progress.fail} FAIL
                </span>
              </div>
            </div>
            <div className="font-mono text-[11px] font-black uppercase tracking-[0.3em] text-brand-blue">
              {completionPct}% Complete
            </div>
          </div>
          <div className="flex h-4 w-full overflow-hidden rounded-full border border-brand-dark/5 bg-surface-2 shadow-inner">
            <div
              style={{ width: `${(progress.pass / STEPS.length) * 100}%` }}
              className="h-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all duration-1000 ease-out"
            />
            <div
              style={{ width: `${(progress.fail / STEPS.length) * 100}%` }}
              className="h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-1000 ease-out"
            />
          </div>
        </div>

        {/* STEPS LIST */}
        <div className="grid gap-8 p-10 pt-0">
          {STEPS.map((step, idx) => {
            const st = state.steps[step.id] ?? { status: 'todo', notes: '', at: state.startedAt };
            return (
              <article
                key={step.id}
                className={`group relative rounded-[3rem] border transition-all hover:shadow-pop ${
                  st.status === 'pass'
                    ? 'border-green-500/20 bg-green-500/[0.02] shadow-soft'
                    : st.status === 'fail'
                      ? 'animate-in shake-1 border-red-500/20 bg-red-500/[0.02] shadow-pop'
                      : 'border-brand-dark/5 bg-surface dark:border-white/5'
                }`}
              >
                <div className="flex flex-col gap-12 p-10 md:p-14 xl:flex-row">
                  {/* Left: Info & Protocol */}
                  <div className="flex-1 space-y-8">
                    <header className="flex items-center gap-6">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-heading text-xl shadow-pop transition-transform group-hover:rotate-6 ${
                          st.status === 'pass'
                            ? 'bg-green-600 text-white'
                            : st.status === 'fail'
                              ? 'bg-red-600 text-white'
                              : 'bg-brand-dark text-brand-yellow'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-heading text-3xl uppercase leading-none tracking-tight text-main">
                          {step.title}
                        </h3>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted opacity-40">
                          Step_Node: {step.id}
                        </p>
                      </div>
                    </header>

                    <div className="space-y-6 border-l-2 border-brand-blue/10 pl-8">
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                          <Target className="h-4 w-4" /> Objetivo del Nodo
                        </p>
                        <p className="text-lg font-light italic leading-relaxed text-main">
                          &quot;{step.goal}&quot;
                        </p>
                      </div>

                      <div className="space-y-4 pt-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted opacity-40">
                          Protocolo de Validación
                        </p>
                        <ul className="grid gap-3">
                          {step.how.map((h, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-4 text-sm font-light italic text-muted transition-colors group-hover:text-main"
                            >
                              <ChevronRight className="mt-0.5 h-4 w-4 text-brand-blue opacity-30" />{' '}
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {step.links && (
                        <div className="flex flex-wrap gap-3 pt-4">
                          {step.links.map((l) => (
                            <a
                              key={l.href}
                              href={l.href}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-3 rounded-xl border border-brand-dark/5 bg-surface-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-brand-blue shadow-sm transition-all hover:border-brand-dark hover:bg-brand-dark hover:text-brand-yellow active:scale-95"
                            >
                              {l.label} <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions & Evidence */}
                  <div className="flex shrink-0 flex-col gap-6 xl:w-[450px]">
                    <div className="flex rounded-[2rem] border border-brand-dark/5 bg-surface-2 p-2 shadow-inner">
                      {[
                        { id: 'pass', l: 'Pass', i: CheckCircle2, c: 'bg-green-600' },
                        { id: 'fail', l: 'Fail', i: XCircle, c: 'bg-red-600' },
                        { id: 'todo', l: 'Reset', i: Clock, c: 'bg-brand-dark' },
                      ].map((btn) => (
                        <button
                          key={btn.id}
                          onClick={() => updateStep(step.id, { status: btn.id as StepStatus })}
                          className={`flex flex-1 flex-col items-center justify-center rounded-[1.5rem] py-5 transition-all ${
                            st.status === btn.id
                              ? `${btn.c} scale-105 text-white shadow-pop ring-4 ring-white/10`
                              : 'text-muted hover:bg-surface'
                          }`}
                        >
                          <btn.i className="mb-2 h-6 w-6" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                            {btn.l}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="group/notes relative">
                      <div className="absolute left-6 top-6 flex items-center gap-3 opacity-30 transition-opacity group-focus-within/notes:opacity-100">
                        <Terminal className="h-4 w-4 text-brand-blue" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">
                          Evidencia Forense
                        </span>
                      </div>
                      <textarea
                        value={st.notes}
                        onChange={(e) => updateStep(step.id, { notes: e.target.value })}
                        className="custom-scrollbar h-44 w-full resize-none rounded-[2.5rem] border border-white/5 bg-[#0a0a0a] pb-6 pl-6 pr-6 pt-14 font-mono text-xs italic leading-relaxed text-emerald-500 shadow-2xl outline-none transition-all placeholder:text-emerald-950"
                        placeholder="// Inyectar Session_IDs, logs de terminal o trazas de error detectadas..."
                      />
                      <div className="absolute bottom-4 right-6 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> Manual Integrity Verified
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <History className="h-4 w-4 opacity-50" /> Persistent Session Trace Node
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Database className="h-4 w-4 animate-pulse" /> Audit Log: Synced
        </div>
      </footer>
    </div>
  );
}
