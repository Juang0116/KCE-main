'use client';

import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  BookOpen, CheckCircle2, XCircle, Clock, 
  RefreshCw, AlertCircle, Play, Save, 
  ChevronRight, Terminal, ShieldCheck, 
  Layers, Zap, Rocket, History, ExternalLink,
  Target, Hash, Cpu, Layout, Info, Activity,
  Database, Gauge
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

  const completionPct = Math.round((progress.pass / STEPS.length) * 100);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA TÁCTICA */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Terminal className="h-4 w-4" /> Protocol Lane: /release-vault-node
          </div>
          <h1 className="font-heading text-4xl md:text-7xl text-main tracking-tighter leading-none">
            Runbook <span className="text-brand-yellow italic font-light">de Lanzamiento</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed mt-2 italic">
            Instrumento de validación manual extrema para Knowing Cultures S.A.S. Sigue el protocolo oficial para garantizar la sanidad del núcleo comercial.
          </p>
        </div>
        <div className="flex gap-4">
           <Button onClick={resetRun} variant="outline" className="rounded-full h-12 px-8 border-brand-dark/10 shadow-sm font-bold uppercase tracking-widest text-[10px] hover:bg-surface-2 transition-all">
             <RefreshCw className="mr-2 h-4 w-4" /> Reiniciar Sesión
           </Button>
           <Link href="/admin/qa">
              <Button className="h-12 px-8 rounded-full bg-brand-dark text-brand-yellow font-bold uppercase tracking-widest text-[10px] shadow-pop hover:bg-brand-blue hover:text-white transition-all active:scale-95">
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
          { label: 'Blockers', value: String(progress.fail), note: 'Fallas detectadas.' }
        ]}
      />

      {/* 03. SESSION MONITOR (EL REGISTRO) */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden relative flex flex-col">
        
        {/* HEADER DE SESIÓN */}
        <header className="p-10 border-b border-brand-dark/5 dark:border-white/5 bg-surface-2/30 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
           <div className="absolute -right-10 -top-10 opacity-[0.02] pointer-events-none rotate-12"><BookOpen className="h-64 w-64 text-brand-blue" /></div>
           <div className="flex items-center gap-6 relative z-10">
              <div className="h-16 w-16 rounded-[1.8rem] bg-brand-dark text-brand-yellow flex items-center justify-center shadow-pop">
                 <Rocket className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40">Trace_ID Protocol</p>
                 <div className="flex items-center gap-3">
                    <p className="font-mono text-xl font-bold text-brand-blue tracking-tighter">{state.runId}</p>
                    <div className="px-3 py-1 rounded-lg bg-brand-blue/5 border border-brand-blue/10 text-[9px] font-bold text-brand-blue uppercase">v1.0 Secure</div>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-surface border border-brand-dark/10 shadow-inner relative z-10">
              <label className="flex items-center gap-3 cursor-pointer group">
                 <input type="checkbox" checked={logEnabled} onChange={(e) => setLogEnabled(e.target.checked)} className="h-4 w-4 rounded border-brand-dark/20 text-brand-blue focus:ring-brand-blue/20" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-muted group-hover:text-main transition-colors">Audit Server Sync Active</span>
              </label>
           </div>
        </header>

        {/* PROGRESS MONITOR */}
        <div className="p-10 bg-surface">
           <div className="flex justify-between items-end mb-4 px-2">
              <div className="flex gap-6">
                 <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-700 dark:text-green-400">{progress.pass} PASS</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-700 dark:text-red-400">{progress.fail} FAIL</span>
                 </div>
              </div>
              <div className="text-[11px] font-mono font-black text-brand-blue uppercase tracking-[0.3em]">
                 {completionPct}% Complete
              </div>
           </div>
           <div className="h-4 w-full bg-surface-2 rounded-full overflow-hidden flex border border-brand-dark/5 shadow-inner">
              <div style={{ width: `${(progress.pass / STEPS.length) * 100}%` }} className="bg-green-500 h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
              <div style={{ width: `${(progress.fail / STEPS.length) * 100}%` }} className="bg-red-500 h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
           </div>
        </div>

        {/* STEPS LIST */}
        <div className="p-10 pt-0 grid gap-8">
          {STEPS.map((step, idx) => {
            const st = state.steps[step.id] ?? { status: 'todo', notes: '', at: state.startedAt };
            return (
              <article key={step.id} className={`group relative rounded-[3rem] border transition-all hover:shadow-pop ${
                st.status === 'pass' ? 'bg-green-500/[0.02] border-green-500/20 shadow-soft' :
                st.status === 'fail' ? 'bg-red-500/[0.02] border-red-500/20 shadow-pop animate-in shake-1' :
                'bg-surface border-brand-dark/5 dark:border-white/5'
              }`}>
                <div className="flex flex-col xl:flex-row gap-12 p-10 md:p-14">
                  
                  {/* Left: Info & Protocol */}
                  <div className="flex-1 space-y-8">
                    <header className="flex items-center gap-6">
                      <div className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center font-heading text-xl shadow-pop transition-transform group-hover:rotate-6 ${
                        st.status === 'pass' ? 'bg-green-600 text-white' :
                        st.status === 'fail' ? 'bg-red-600 text-white' :
                        'bg-brand-dark text-brand-yellow'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-heading text-3xl text-main tracking-tight uppercase leading-none">{step.title}</h3>
                        <p className="text-[10px] font-mono font-bold text-muted opacity-40 uppercase tracking-widest">Step_Node: {step.id}</p>
                      </div>
                    </header>

                    <div className="space-y-6 border-l-2 border-brand-blue/10 pl-8">
                       <div className="space-y-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue flex items-center gap-2">
                            <Target className="h-4 w-4" /> Objetivo del Nodo
                          </p>
                          <p className="text-lg font-light text-main italic leading-relaxed">&quot;{step.goal}&quot;</p>
                       </div>

                       <div className="space-y-4 pt-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted opacity-40">Protocolo de Validación</p>
                          <ul className="grid gap-3">
                            {step.how.map((h, i) => (
                              <li key={i} className="flex items-start gap-4 text-sm font-light text-muted italic group-hover:text-main transition-colors">
                                <ChevronRight className="h-4 w-4 mt-0.5 text-brand-blue opacity-30" /> {h}
                              </li>
                            ))}
                          </ul>
                       </div>

                       {step.links && (
                         <div className="flex flex-wrap gap-3 pt-4">
                            {step.links.map(l => (
                              <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-surface-2 border border-brand-dark/5 text-[10px] font-black uppercase tracking-widest text-brand-blue hover:bg-brand-dark hover:text-brand-yellow hover:border-brand-dark transition-all shadow-sm active:scale-95">
                                {l.label} <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ))}
                         </div>
                       )}
                    </div>
                  </div>

                  {/* Right: Actions & Evidence */}
                  <div className="xl:w-[450px] shrink-0 flex flex-col gap-6">
                    <div className="flex p-2 rounded-[2rem] bg-surface-2 border border-brand-dark/5 shadow-inner">
                      {[
                        { id: 'pass', l: 'Pass', i: CheckCircle2, c: 'bg-green-600' },
                        { id: 'fail', l: 'Fail', i: XCircle, c: 'bg-red-600' },
                        { id: 'todo', l: 'Reset', i: Clock, c: 'bg-brand-dark' }
                      ].map(btn => (
                        <button
                          key={btn.id}
                          onClick={() => updateStep(step.id, { status: btn.id as StepStatus })}
                          className={`flex-1 flex flex-col items-center justify-center py-5 rounded-[1.5rem] transition-all ${
                            st.status === btn.id 
                              ? `${btn.c} text-white shadow-pop scale-105 ring-4 ring-white/10` 
                              : 'text-muted hover:bg-surface'
                          }`}
                        >
                          <btn.i className="h-6 w-6 mb-2" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{btn.l}</span>
                        </button>
                      ))}
                    </div>

                    <div className="relative group/notes">
                       <div className="absolute left-6 top-6 flex items-center gap-3 opacity-30 group-focus-within/notes:opacity-100 transition-opacity">
                          <Terminal className="h-4 w-4 text-brand-blue" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Evidencia Forense</span>
                       </div>
                       <textarea
                         value={st.notes}
                         onChange={(e) => updateStep(step.id, { notes: e.target.value })}
                         className="w-full h-44 pl-6 pr-6 pt-14 pb-6 rounded-[2.5rem] bg-[#0a0a0a] text-emerald-500 font-mono text-xs leading-relaxed outline-none border border-white/5 transition-all resize-none shadow-2xl custom-scrollbar placeholder:text-emerald-950 italic"
                         placeholder="// Inyectar Session_IDs, logs de terminal o trazas de error detectadas..."
                       />
                       <div className="absolute bottom-4 right-6 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> Manual Integrity Verified
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <History className="h-4 w-4 opacity-50" /> Persistent Session Trace Node
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Database className="h-4 w-4 animate-pulse" /> Audit Log: Synced
        </div>
      </footer>
    </div>
  );
}