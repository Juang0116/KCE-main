'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { BookOpen, CheckCircle2, XCircle, Clock, RefreshCw, AlertCircle, Play, Save, ChevronRight } from 'lucide-react';

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

function nowIso() {
  return new Date().toISOString();
}

function newRunId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return (crypto as any).randomUUID();
  return `run_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

const STEPS: Step[] = [
  {
    id: 'tours.list',
    title: 'Catálogo: /tours lista',
    goal: 'El catálogo renderiza tours reales (DB), sin “unknown” ni errores de consola.',
    how: [
      'Abrir /tours',
      'Verificar que hay tarjetas y que no hay errores en consola.',
      'Probar filtro/búsqueda si aplica.',
    ],
    links: [{ label: '/tours', href: '/tours' }],
  },
  {
    id: 'tours.detail',
    title: 'Detalle: /tours/[slug]',
    goal: 'Un tour renderiza detalle completo + OG image route responde.',
    how: [
      'Abrir un tour desde /tours',
      'Confirmar que la página carga imágenes y CTA.',
      'Abrir /tours/[slug]/opengraph-image en una pestaña.',
    ],
  },
  {
    id: 'utm.capture',
    title: 'UTM capture',
    goal: 'UTM se captura en cookies (kce_utm, kce_vid) y se registra marketing.utm_capture en events.',
    how: [
      'Abrir /tours?utm_source=ig&utm_medium=social&utm_campaign=test',
      'Recargar una vez.',
      'Verificar en /admin/metrics el bloque UTM o revisar events (marketing.utm_capture).',
    ],
    links: [{ label: '/admin/metrics', href: '/admin/metrics' }],
  },
  {
    id: 'checkout.start',
    title: 'Checkout: iniciar (started)',
    goal: 'POST /api/checkout crea sesión Stripe (EUR) y registra checkout.started con utm_key.',
    how: [
      'En el tour, iniciar checkout.',
      'Verificar redirección a Stripe Checkout.',
      'Revisar events para checkout.started/checkout.session_created.',
    ],
  },
  {
    id: 'checkout.paid.webhook',
    title: 'Pago + Webhook (paid)',
    goal: 'Webhook marca booking como paid, envía invoice (1 sola vez) y registra checkout.paid con utm/tour_slug.',
    how: [
      'Completar pago en Stripe (test).',
      'Confirmar booking en DB o /booking/[session_id].',
      'Verificar que email invoice llegó una sola vez.',
    ],
  },
  {
    id: 'booking.page',
    title: 'Booking: /booking/[session_id]',
    goal: 'Página de reserva muestra estado, total, fecha, pax y link/QR.',
    how: [
      'Abrir /booking/[session_id] desde success o pegar session_id.',
      'Validar datos consistentes con Stripe.',
    ],
  },
  {
    id: 'reviews.moderation',
    title: 'Reviews: pending → approve',
    goal: 'Review se crea pending, se aprueba desde admin y se publica (status=approved).',
    how: [
      'Enviar una reseña (con avatar opcional).',
      'Entrar a /admin/reviews y aprobar.',
      'Ver review pública en el tour.',
    ],
    links: [{ label: '/admin/reviews', href: '/admin/reviews' }],
  },
  {
    id: 'crm.lead',
    title: 'CRM: lead + customer',
    goal: 'Lead aparece en /admin/leads; post-pago se crea/actualiza customer (o convertir lead).',
    how: [
      'Crear lead por newsletter/quiz o /api/leads.',
      'Verlo en /admin/leads.',
      'Convertir a customer o verificar upsert post-pago.',
    ],
    links: [
      { label: '/admin/leads', href: '/admin/leads' },
      { label: '/admin/customers', href: '/admin/customers' },
    ],
  },
  {
    id: 'bot.ticket',
    title: 'Bot + Ticket handoff',
    goal: 'Caso complejo crea ticket y se opera desde /admin/tickets.',
    how: [
      'Enviar mensaje a /api/ai (o widget) con “reembolso/problema de pago”.',
      'Con consent + email/whatsapp debe retornar ticketId.',
      'Ver ticket en /admin/tickets y responder como agente.',
    ],
    links: [{ label: '/admin/tickets', href: '/admin/tickets' }],
  },
  {
    id: 'qa.harness',
    title: 'QA Harness: /admin/qa',
    goal: 'Smoke tests OK (Supabase read/write, tours, buckets, Stripe).',
    how: ['Abrir /admin/qa y correr Run checks.', 'Resolver FAILs antes de producción.'],
    links: [{ label: '/admin/qa', href: '/admin/qa' }],
  },
];

function loadState(): RunbookState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RunbookState;
      if (parsed?.version === 1 && parsed.runId) return parsed;
    }
  } catch {}
  const runId = newRunId();
  return { version: 1, runId, startedAt: nowIso(), steps: {} };
}

function saveState(s: RunbookState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export default function AdminRunbookClient() {
  const [state, setState] = useState<RunbookState | null>(null);
  const [logEnabled, setLogEnabled] = useState(true);
  const [loggingError, setLoggingError] = useState<string | null>(null);

  useEffect(() => { setState(loadState()); }, []);

  const progress = useMemo(() => {
    const s = state;
    if (!s) return { pass: 0, fail: 0, todo: STEPS.length };
    let pass = 0; let fail = 0;
    for (const step of STEPS) {
      const st = s.steps[step.id]?.status ?? 'todo';
      if (st === 'pass') pass++; else if (st === 'fail') fail++;
    }
    return { pass, fail, todo: STEPS.length - pass - fail };
  }, [state]);

  async function logToServer(stepId: string, status: StepStatus, notes: string) {
    if (!logEnabled) return;
    setLoggingError(null);
    try {
      const res = await adminFetch('/api/admin/runbook/log', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ runId: state?.runId, stepId, status, notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to log');
    } catch (e) {
      setLoggingError(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  function updateStep(stepId: string, patch: Partial<StepState>, opts?: { log?: boolean }) {
    const shouldLog = opts?.log !== false;
    setState((prev) => {
      if (!prev) return prev;
      const current: StepState = prev.steps[stepId] ?? { status: 'todo', notes: '', at: nowIso() };
      const next: StepState = { ...current, ...patch, at: nowIso() };
      const nextState: RunbookState = { ...prev, steps: { ...prev.steps, [stepId]: next } };
      saveState(nextState);
      if (shouldLog && ('status' in patch || 'notes' in patch)) {
        void logToServer(stepId, next.status, next.notes);
      }
      return nextState;
    });
  }

  function resetRun() {
    const runId = newRunId();
    const fresh: RunbookState = { version: 1, runId, startedAt: nowIso(), steps: {} };
    saveState(fresh); setState(fresh); setLoggingError(null);
  }

  if (!state) return null;

  const runbookSignals = [
    { label: 'Exitosos (PASS)', value: String(progress.pass), note: 'Flujos operativos validados correctamente.' },
    { label: 'Pendientes (TODO)', value: String(progress.todo), note: 'Pruebas críticas restantes antes del release.' },
    { label: 'Fallidos (FAIL)', value: String(progress.fail), note: 'Bloqueos (Blockers) que impiden el lanzamiento.' },
  ];

  return (
    <div className="space-y-10 pb-20">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Runbook de Lanzamiento</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Checklist interactivo de validación E2E previo a cualquier despliegue a producción.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Release Execution"
        title="Validación Manual Extrema"
        description="El QA automático no reemplaza la sanidad comercial. Ejecuta este runbook completo paso a paso antes de abrir tráfico real. Tu progreso se guarda localmente."
        actions={[{ href: '/admin/qa', label: 'Ejecutar QA Automático', tone: 'primary' }]}
        signals={runbookSignals}
      />

      {/* Panel de Control de Sesión */}
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-brand-dark text-brand-yellow shadow-md">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Run ID Vigente</div>
              <div className="font-mono text-brand-blue font-bold text-sm mt-1">{state.runId}</div>
              <div className="text-[10px] uppercase tracking-widest text-[var(--color-text)]/40 mt-1">Iniciado: {new Date(state.startedAt).toLocaleString('es-ES')}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text)]/60 cursor-pointer bg-[var(--color-surface-2)] px-4 py-3 rounded-xl border border-[var(--color-border)]">
              <input type="checkbox" checked={logEnabled} onChange={(e) => setLogEnabled(e.target.checked)} className="h-4 w-4 accent-brand-blue" />
              Guardar logs en BD
            </label>
            <button onClick={resetRun} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-dark px-5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-md">
              <RefreshCw className="h-3 w-3" /> Nuevo Run
            </button>
          </div>
        </div>

        {loggingError && (
          <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4"/> Error guardando log: {loggingError}
          </div>
        )}

        {/* Progreso Visual */}
        <div className="mb-8">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
            <span className="text-emerald-600">{progress.pass} PASS</span>
            <span className="text-amber-500">{progress.todo} TODO</span>
            <span className="text-rose-600">{progress.fail} FAIL</span>
          </div>
          <div className="h-2 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden flex">
            <div style={{ width: `${(progress.pass / STEPS.length) * 100}%` }} className="bg-emerald-500 h-full transition-all"></div>
            <div style={{ width: `${(progress.fail / STEPS.length) * 100}%` }} className="bg-rose-500 h-full transition-all"></div>
          </div>
        </div>

        {/* Lista de Pasos (Checklist) */}
        <div className="space-y-6">
          {STEPS.map((step, idx) => {
            const st = state.steps[step.id] ?? { status: 'todo', notes: '', at: state.startedAt };
            const isPass = st.status === 'pass';
            const isFail = st.status === 'fail';
            const isTodo = st.status === 'todo';

            return (
              <section key={step.id} className={`relative rounded-[2rem] border p-6 md:p-8 transition-all duration-300 ${isPass ? 'border-emerald-500/30 bg-emerald-50' : isFail ? 'border-rose-500/30 bg-rose-50' : 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-brand-blue/30'}`}>
                
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                  
                  {/* Izquierda: Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${isPass ? 'bg-emerald-500' : isFail ? 'bg-rose-500' : 'bg-brand-dark'}`}>
                        {idx + 1}
                      </div>
                      <h3 className={`font-heading text-xl ${isPass ? 'text-emerald-800' : isFail ? 'text-rose-800' : 'text-[var(--color-text)]'}`}>{step.title}</h3>
                    </div>
                    
                    <div className="pl-11 space-y-4">
                      <div className={`text-sm font-semibold ${isPass ? 'text-emerald-700/80' : isFail ? 'text-rose-700/80' : 'text-brand-blue'}`}>
                        Meta: {step.goal}
                      </div>
                      <ul className="space-y-1.5 text-xs font-light text-[var(--color-text)]/70">
                        {step.how.map((h, i) => (
                          <li key={i} className="flex gap-2"><ChevronRight className="h-3 w-3 shrink-0 opacity-50 mt-0.5"/> {h}</li>
                        ))}
                      </ul>
                      {step.links?.length ? (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {step.links.map((l) => (
                            <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors">
                              Abrir {l.label}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Derecha: Acciones y Notas */}
                  <div className="xl:w-80 shrink-0 flex flex-col gap-4">
                    <div className="flex rounded-xl overflow-hidden shadow-sm border border-[var(--color-border)]">
                      <button onClick={() => updateStep(step.id, { status: 'pass' })} className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${isPass ? 'bg-emerald-500 text-white' : 'bg-[var(--color-surface)] text-[var(--color-text)]/50 hover:bg-emerald-50'}`}>
                        <CheckCircle2 className="h-5 w-5 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Pass</span>
                      </button>
                      <button onClick={() => updateStep(step.id, { status: 'fail' })} className={`flex-1 flex flex-col items-center justify-center py-3 border-x border-[var(--color-border)] transition-colors ${isFail ? 'bg-rose-500 text-white' : 'bg-[var(--color-surface)] text-[var(--color-text)]/50 hover:bg-rose-50'}`}>
                        <XCircle className="h-5 w-5 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Fail</span>
                      </button>
                      <button onClick={() => updateStep(step.id, { status: 'todo' })} className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${isTodo ? 'bg-brand-blue/10 text-brand-blue' : 'bg-[var(--color-surface)] text-[var(--color-text)]/50 hover:bg-[var(--color-surface-2)]'}`}>
                        <Clock className="h-5 w-5 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Reset</span>
                      </button>
                    </div>

                    <div>
                      <textarea
                        value={st.notes}
                        onChange={(e) => updateStep(step.id, { notes: e.target.value }, { log: false })}
                        onBlur={() => void logToServer(step.id, (state.steps[step.id]?.status ?? 'todo') as StepStatus, state.steps[step.id]?.notes ?? '')}
                        rows={3}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-xs outline-none focus:border-brand-blue transition-colors font-light leading-relaxed placeholder:text-[var(--color-text)]/30"
                        placeholder="Evidencia (Session_ID, links, qué falló)..."
                      />
                      <div className="text-[9px] uppercase font-bold tracking-widest text-[var(--color-text)]/30 mt-1 flex items-center justify-end gap-1">
                        <Save className="h-3 w-3"/> Autoguardado: {new Date(st.at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  </div>

                </div>
              </section>
            );
          })}
        </div>

      </div>
    </div>
  );
}