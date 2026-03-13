'use client';


import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';

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
  // Fallback (non-crypto) — acceptable for client-side run IDs
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
  } catch {
    // ignore
  }
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

  useEffect(() => {
    setState(loadState());
  }, []);

  const progress = useMemo(() => {
    const s = state;
    if (!s) return { pass: 0, fail: 0, todo: STEPS.length };
    let pass = 0;
    let fail = 0;
    for (const step of STEPS) {
      const st = s.steps[step.id]?.status ?? 'todo';
      if (st === 'pass') pass++;
      else if (st === 'fail') fail++;
    }
    return { pass, fail, todo: STEPS.length - pass - fail };
  }, [state]);

  async function logToServer(stepId: string, status: StepStatus, notes: string) {
    if (!logEnabled) return;
    setLoggingError(null);
    try {
      const res = await adminFetch('/api/admin/runbook/log', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
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
        // Notes logging is intentionally opt-in (see textarea handlers) to avoid spamming events.
        void logToServer(stepId, next.status, next.notes);
      }
      return nextState;
    });
  }

  function resetRun() {
    const runId = newRunId();
    const fresh: RunbookState = { version: 1, runId, startedAt: nowIso(), steps: {} };
    saveState(fresh);
    setState(fresh);
    setLoggingError(null);
  }

  if (!state) return null;

  return (
    <div className="rounded-2xl border border-black/10 bg-black/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[color:var(--color-text)]">Run ID</div>
          <div className="text-[color:var(--color-text)]/70 mt-1 text-xs">{state.runId}</div>
          <div className="text-[color:var(--color-text)]/70 mt-1 text-xs">
            Started: {new Date(state.startedAt).toLocaleString()}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[color:var(--color-text)]/80 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={logEnabled}
              onChange={(e) => setLogEnabled(e.target.checked)}
              className="size-4 rounded border-black/20"
            />
            Log a events
          </label>
          <Button
            onClick={resetRun}
            variant="secondary"
          >
            Nuevo run
          </Button>
        </div>
      </div>

      <div className="text-[color:var(--color-text)]/70 mt-4 flex flex-wrap items-center gap-3 text-xs">
        <div>
          <span className="font-semibold text-emerald-700">PASS</span>: {progress.pass}
        </div>
        <div>
          <span className="font-semibold text-red-700">FAIL</span>: {progress.fail}
        </div>
        <div>
          <span className="font-semibold">TODO</span>: {progress.todo}
        </div>
      </div>

      {loggingError ? (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">
          Log error: {loggingError}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        {STEPS.map((step) => {
          const st = state.steps[step.id] ?? { status: 'todo', notes: '', at: state.startedAt };
          return (
            <section
              key={step.id}
              className="rounded-2xl border border-black/10 bg-white/40 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--color-text)]">
                    {step.title}
                  </div>
                  <div className="text-[color:var(--color-text)]/70 mt-1 text-xs">{step.goal}</div>
                  <div className="text-[color:var(--color-text)]/70 mt-2 space-y-1 text-xs">
                    {step.how.map((h) => (
                      <div key={h}>• {h}</div>
                    ))}
                  </div>
                  {step.links?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {step.links.map((l) => (
                        <a
                          key={l.href}
                          href={l.href}
                          className="rounded-full border border-black/10 bg-white/50 px-3 py-1 text-xs text-[color:var(--color-text)] hover:bg-white/70"
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div>
                    <span
                      className={
                        st.status === 'pass'
                          ? 'font-semibold text-emerald-700'
                          : st.status === 'fail'
                            ? 'font-semibold text-red-700'
                            : 'text-[color:var(--color-text)]/60 font-semibold'
                      }
                    >
                      {st.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateStep(step.id, { status: 'pass' })}
                      size="sm"
                    >
                      PASS
                    </Button>
                    <Button
                      onClick={() => updateStep(step.id, { status: 'fail' })}
                      size="sm"
                      variant="accent"
                    >
                      FAIL
                    </Button>
                    <Button
                      onClick={() => updateStep(step.id, { status: 'todo' })}
                      size="sm"
                      variant="secondary"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-[color:var(--color-text)]/70 text-xs font-semibold">
                  Notas
                </label>
                <textarea
                  value={st.notes}
                  onChange={(e) => updateStep(step.id, { notes: e.target.value }, { log: false })}
                  onBlur={() =>
                    void logToServer(
                      step.id,
                      (state.steps[step.id]?.status ?? 'todo') as StepStatus,
                      state.steps[step.id]?.notes ?? '',
                    )
                  }
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white/50 px-3 py-2 text-sm text-[color:var(--color-text)]"
                  placeholder="Qué validaste, qué falló, links, session_id, requestId, etc."
                />
                <div className="text-[color:var(--color-text)]/60 mt-1 text-xs">
                  Última actualización: {new Date(st.at).toLocaleString()}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
