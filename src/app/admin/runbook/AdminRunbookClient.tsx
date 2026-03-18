'use client';

import Link from 'next/link'; // ✅ Importación añadida
import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  BookOpen, CheckCircle2, XCircle, Clock, 
  RefreshCw, AlertCircle, Play, Save, 
  ChevronRight, Terminal, ShieldCheck, 
  Layers, Zap, Rocket, History, ExternalLink,
  Target // ✅ Importación añadida
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE PROTOCOLO ---
type StepStatus = 'todo' | 'pass' | 'fail';
type Step = { id: string; title: string; goal: string; how: string[]; links?: Array<{ label: string; href: string }>; };
type StepState = { status: StepStatus; notes: string; at: string };
type RunbookState = { version: 1; runId: string; startedAt: string; steps: Record<string, StepState>; };

const STORAGE_KEY = 'kce.runbook.v1';
const nowIso = () => new Date().toISOString();
const newRunId = () => `RUN_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const STEPS: Step[] = [
  {
    id: 'tours.list',
    title: 'Integridad de Catálogo',
    goal: 'El catálogo renderiza tours reales desde Supabase sin errores de hidratación.',
    how: ['Abrir /tours', 'Verificar renderizado de tarjetas', 'Validar ausencia de errores en consola'],
    links: [{ label: 'Ir al Catálogo', href: '/tours' }],
  },
  {
    id: 'utm.capture',
    title: 'Captura de Señal UTM',
    goal: 'UTM se persiste en cookies (kce_utm) y registra marketing.utm_capture.',
    how: ['Abrir /tours?utm_source=test', 'Verificar cookie kce_utm en Application', 'Confirmar evento en Metrics'],
    links: [{ label: 'Ver Métricas', href: '/admin/metrics' }],
  },
  {
    id: 'checkout.start',
    title: 'Ciclo de Checkout: Inicio',
    goal: 'POST /api/checkout crea sesión Stripe (EUR) y vincula utm_key.',
    how: ['Iniciar compra en un tour', 'Verificar redirección a Stripe', 'Confirmar evento checkout.started'],
  },
  {
    id: 'checkout.paid.webhook',
    title: 'Liquidación & Webhooks',
    goal: 'Webhook marca booking como paid y dispara invoice una sola vez.',
    how: ['Completar pago (test mode)', 'Confirmar estado PAID en admin', 'Verificar recepción de email'],
  },
  {
    id: 'bot.ticket',
    title: 'Handoff de Agente IA',
    goal: 'Casos complejos crean tickets operativos para resolución humana.',
    how: ['Enviar mensaje "necesito reembolso" al Bot', 'Verificar creación de ticketId', 'Ver ticket en Admin'],
    links: [{ label: 'Tickets Hub', href: '/admin/tickets' }],
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
      if (parsed?.version === 1) { setState(parsed); return; }
    }
    const fresh: RunbookState = { version: 1, runId: newRunId(), startedAt: nowIso(), steps: {} };
    setState(fresh);
  }, []);

  const progress = useMemo(() => {
    if (!state) return { pass: 0, fail: 0, todo: STEPS.length };
    const pass = Object.values(state.steps).filter(s => s.status === 'pass').length;
    const fail = Object.values(state.steps).filter(s => s.status === 'fail').length;
    return { pass, fail, todo: STEPS.length - pass - fail };
  }, [state]);

  const logToServer = async (stepId: string, status: StepStatus, notes: string) => {
    if (!logEnabled || !state) return;
    try {
      setLoggingError(null);
      await adminFetch('/api/admin/runbook/log', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ runId: state.runId, stepId, status, notes }),
      });
    } catch (e: any) { setLoggingError(e.message); }
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

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER DE PROTOCOLO DE LANZAMIENTO */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10 px-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Protocol Lane: /runbook-vault
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            Runbook <span className="text-brand-yellow italic font-light">de Lanzamiento</span>
          </h1>
          <p className="mt-4 text-base text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Instrumento de validación manual extrema para el núcleo de KCE.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={resetRun} variant="outline" className="h-12 px-6 rounded-2xl border-brand-dark/10 font-bold uppercase tracking-widest text-[10px] shadow-sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Reiniciar Sesión
          </Button>
          <Link href="/admin/qa">
             <Button variant="primary" className="h-12 px-8 rounded-2xl bg-brand-dark text-brand-yellow font-bold uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-transform">
               <Zap className="mr-2 h-4 w-4" /> Abrir QA Core
             </Button>
          </Link>
        </div>
      </header>

      <AdminOperatorWorkbench
        eyebrow="Release Execution"
        title="Validación E2E del Ecosistema"
        description="Sigue los pasos y documenta cualquier anomalía técnica."
        signals={[
          { label: 'Exitosos', value: String(progress.pass), note: 'Flujos PASS.' },
          { label: 'Pendientes', value: String(progress.todo), note: 'Tests TODO.' },
          { label: 'Blockers', value: String(progress.fail), note: 'Fallas FAIL.' }
        ]}
      />

      {/* SESSION MONITOR */}
      <section className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-10 -top-10 opacity-[0.03] group-hover:scale-110 transition-transform"><BookOpen className="h-64 w-64" /></div>
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-8 mb-10 relative z-10">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-brand-dark text-brand-yellow flex items-center justify-center shadow-lg">
                 <Rocket className="h-6 w-6" />
              </div>
              <div>
                 <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/30">Trace_ID Activo</p>
                 <p className="font-mono text-lg font-bold text-brand-blue">{state.runId}</p>
              </div>
           </div>
           <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={logEnabled} onChange={(e) => setLogEnabled(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-blue" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Audit Server Sync</span>
           </label>
        </header>

        {/* PROGRESS BAR */}
        <div className="mb-12 space-y-3">
           <div className="flex justify-between items-end px-2">
              <div className="flex gap-4">
                 <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">{progress.pass} PASS</span>
                 <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-600">{progress.fail} FAIL</span>
              </div>
              <span className="text-[10px] font-mono text-brand-blue/40">{Math.round((progress.pass / STEPS.length) * 100)}% COMPLETADO</span>
           </div>
           <div className="h-2.5 w-full bg-black/5 rounded-full overflow-hidden flex shadow-inner">
              <div style={{ width: `${(progress.pass / STEPS.length) * 100}%` }} className="bg-emerald-500 h-full transition-all duration-1000" />
              <div style={{ width: `${(progress.fail / STEPS.length) * 100}%` }} className="bg-rose-500 h-full transition-all duration-1000" />
           </div>
        </div>

        {/* STEPS GRID */}
        <div className="grid gap-6">
          {STEPS.map((step, idx) => {
            const st = state.steps[step.id] ?? { status: 'todo', notes: '', at: state.startedAt };
            return (
              <div key={step.id} className={`group relative rounded-[2.5rem] border p-8 transition-all ${
                st.status === 'pass' ? 'bg-emerald-500/[0.02] border-emerald-500/20 shadow-emerald-500/5' :
                st.status === 'fail' ? 'bg-rose-500/[0.02] border-rose-500/20 shadow-rose-500/5 animate-in shake-1' :
                'bg-white border-[var(--color-border)] hover:border-brand-blue/20'
              }`}>
                <div className="flex flex-col xl:flex-row gap-10">
                  <div className="flex-1 space-y-6">
                    <header className="flex items-center gap-4">
                      <div className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center font-heading text-lg ${
                        st.status === 'pass' ? 'bg-emerald-500 text-white shadow-lg' :
                        st.status === 'fail' ? 'bg-rose-500 text-white shadow-lg' :
                        'bg-brand-dark text-brand-yellow shadow-md'
                      }`}>
                        {idx + 1}
                      </div>
                      <h3 className="font-heading text-2xl text-brand-dark uppercase tracking-tighter">{step.title}</h3>
                    </header>

                    <div className="pl-1 space-y-4">
                       <p className="text-sm font-bold text-brand-blue flex items-center gap-2">
                         <Target className="h-4 w-4" /> Objetivo: {step.goal}
                       </p>
                       <ul className="grid gap-2">
                         {step.how.map((h, i) => (
                           <li key={i} className="flex items-start gap-3 text-xs font-light text-[var(--color-text)]/50 italic leading-relaxed">
                              <ChevronRight className="h-3 w-3 mt-1 text-brand-blue opacity-40" /> {h}
                           </li>
                         ))}
                       </ul>
                       {step.links && (
                         <div className="flex flex-wrap gap-2 pt-2">
                            {step.links.map(l => (
                              <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[9px] font-bold uppercase tracking-widest text-brand-dark hover:bg-white hover:text-brand-blue transition-all">
                                {l.label} <ExternalLink className="h-3 w-3" />
                              </a>
                            ))}
                         </div>
                       )}
                    </div>
                  </div>

                  {/* ACTION LANE */}
                  <div className="xl:w-96 shrink-0 space-y-4">
                    <div className="flex p-1 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-inner">
                      {[
                        { id: 'pass', l: 'Pass', i: CheckCircle2, c: 'bg-emerald-500' },
                        { id: 'fail', l: 'Fail', i: XCircle, c: 'bg-rose-500' },
                        { id: 'todo', l: 'Reset', i: Clock, c: 'bg-brand-dark' }
                      ].map(btn => (
                        <button
                          key={btn.id}
                          onClick={() => updateStep(step.id, { status: btn.id as StepStatus })}
                          className={`flex-1 flex flex-col items-center justify-center py-4 rounded-xl transition-all ${
                            st.status === btn.id ? `${btn.c} text-white shadow-lg scale-105` : 'text-[var(--color-text)]/30 hover:bg-white'
                          }`}
                        >
                          <btn.i className="h-5 w-5 mb-1" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">{btn.l}</span>
                        </button>
                      ))}
                    </div>

                    <div className="relative group">
                       <Terminal className="absolute left-4 top-4 h-4 w-4 text-[var(--color-text)]/20 group-focus-within:text-brand-blue transition-colors" />
                       <textarea
                         value={st.notes}
                         onChange={(e) => updateStep(step.id, { notes: e.target.value })}
                         className="w-full h-32 pl-12 pr-4 py-4 rounded-2xl bg-white border border-[var(--color-border)] text-xs font-mono outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all resize-none italic"
                         placeholder="Evidencia técnica (Session_IDs, logs)..."
                       />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="mt-12 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Manual Integrity Verified
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <History className="h-3.5 w-3.5" /> Persistent Session Trace
        </div>
      </footer>
    </div>
  );
}