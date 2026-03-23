'use client';

import Link from 'next/link';
import { useMemo, useState, useCallback } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  ShieldCheck, Activity, RefreshCw, CheckCircle2, 
  XCircle, AlertTriangle, Zap, Server, Target, 
  Clock, Rocket, Terminal, ShieldAlert, Layers,
  Search, Smartphone, Check as CheckIcon,
  ChevronRight, Hash, Database, Cpu, Globe,
  Layout, Info, Gauge
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE QA & RELEASE ---
type CheckData = { id: string; label: string; ok: boolean; ms: number; detail?: string; };
type QaResponse = { ok: boolean; deep: boolean; mode?: 'dev' | 'prod'; requestId: string; summary: { passed: number; failed: number }; checks: CheckData[]; };
type RcCheck = { id: string; label: string; ok: boolean; detail?: string; meta?: Record<string, unknown>; };
type RcVerifyResult = { ok: boolean; requestId: string; session_id: string; booking_id: string | null; checks: RcCheck[]; next_actions?: string[]; };

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
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/qa/run?deep=${deep ? '1' : '0'}&mode=${prodMode ? 'prod' : 'dev'}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'QA_Node_Failure');
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }, [deep, prodMode]);

  // Verificar Revenue Flow (E2E)
  const runRcVerify = async (opts?: { healBooking?: boolean; healEmail?: boolean }) => {
    const sid = rcSessionId.trim();
    if (!sid) return;
    setRcLoading(true); setRcError(null);
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
    } finally { setRcLoading(false); }
  };

  const groupedQa = useMemo(() => {
    const groups: Record<string, CheckData[]> = {};
    (data?.checks ?? []).forEach(c => {
      const key = c.id.split('.')[0] || 'core';
      groups[key] = [...(groups[key] || []), c];
    });
    return groups;
  }, [data]);

  const rcCheckMap = useMemo(() => new Map((rcData?.checks ?? []).map(c => [c.id, c])), [rcData]);

  // Score de Salida (Blended QA + Revenue)
  const gateScore = useMemo(() => {
    const qaTotal = (data?.summary.passed ?? 0) + (data?.summary.failed ?? 0) || 1;
    const qaScore = Math.round(((data?.summary.passed ?? 0) / qaTotal) * 100);
    
    const rcChecks = rcData?.checks ?? [];
    const rcPassed = rcChecks.filter(c => c.ok).length;
    const rcScore = rcChecks.length > 0 ? Math.round((rcPassed / rcChecks.length) * 100) : null;
    
    const blended = rcScore === null ? qaScore : Math.round((qaScore * 0.4) + (rcScore * 0.6));
    
    return {
      score: blended,
      label: blended >= 90 ? 'SHIP READY' : blended >= 75 ? 'HARDEN REQUIRED' : 'CRITICAL FAILURE',
      color: blended >= 90 ? 'text-green-500' : blended >= 75 ? 'text-brand-yellow' : 'text-red-600'
    };
  }, [data, rcData]);

  const signals = [
    { label: 'Release Integrity', value: `${gateScore.score}%`, note: gateScore.label },
    { label: 'Revenue Path', value: rcData?.ok ? 'VERIFIED' : 'PENDING', note: 'E2E Transaction Flow' },
    { label: 'System Mode', value: prodMode ? 'PRODUCTION' : 'STAGING', note: 'Deployment Environment' }
  ];

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA DE INGENIERÍA (MISSION CONTROL) */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Rocket className="h-4 w-4" /> Deployment Lane: /release-gate-node
          </div>
          <h1 className="font-heading text-4xl md:text-7xl text-main tracking-tighter leading-none">
            QA & <span className="text-brand-yellow italic font-light">Release Gates</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed mt-2 italic">
            Nodo de validación pre-vuelo para Knowing Cultures S.A.S. Audita la infraestructura, el flujo de revenue y las dependencias críticas antes del Go-Live.
          </p>
        </div>
      </header>

      {/* 02. WORKBENCH OPERATIVO */}
      <AdminOperatorWorkbench
        eyebrow="Stability Protocol"
        title="Sanidad antes del Go-Live"
        description="Primero ejecuta la auditoría de sistema profunda. Luego, inyecta un ID de sesión de Stripe para confirmar que el ciclo de 'Webhook -> Booking -> Email' es impecable."
        actions={[
          { href: '/admin/ops/metrics', label: 'Monitor de SLA', tone: 'primary' },
          { href: '/admin/events', label: 'Visor de Trazas' }
        ]}
        signals={signals}
      />

      {/* 03. DASHBOARDS DE PUNTUACIÓN */}
      <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        
        {/* SCORE DE INTEGRIDAD (LA BÓVEDA) */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 md:p-12 shadow-pop space-y-10 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 opacity-[0.02] pointer-events-none rotate-12"><ShieldCheck className="h-[25rem] w-[25rem] text-brand-blue" /></div>
          
          <header className="space-y-4 relative z-10 border-b border-brand-dark/5 dark:border-white/5 pb-8">
             <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
                <Gauge className="h-4 w-4" /> Integrity Gauge
             </div>
             <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <span className={`text-8xl font-heading tracking-tighter leading-none ${gateScore.color}`}>{gateScore.score}%</span>
                <div className="pb-2">
                   <p className={`text-xs font-mono font-bold uppercase tracking-widest ${gateScore.color} opacity-80`}>{gateScore.label}</p>
                   <p className="text-[10px] text-muted font-light mt-1 italic">Blended Health Metric v4.4</p>
                </div>
             </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 relative z-10">
            {[
              { t: 'QA Base Auditor', s: data ? 'done' : 'todo', ic: Terminal },
              { t: 'Revenue Path', s: rcData ? (rcData.ok ? 'done' : 'partial') : 'todo', ic: Zap },
              { t: 'Signed Link Token', s: rcData ? (rcCheckMap.get('links.token')?.ok ? 'done' : 'partial') : 'todo', ic: Database },
              { t: 'Mobile UX Sync', s: 'manual', ic: Smartphone }
            ].map((gate) => (
              <div key={gate.t} className={`p-6 rounded-[2rem] border transition-all shadow-sm flex items-center justify-between ${
                gate.s === 'done' ? 'bg-green-500/5 border-green-500/20 text-green-700 dark:text-green-400' :
                gate.s === 'partial' ? 'bg-brand-yellow/5 border-brand-yellow/20 text-brand-yellow' :
                gate.s === 'manual' ? 'bg-brand-blue/5 border-brand-blue/20 text-brand-blue' :
                'bg-surface-2 border-brand-dark/5 opacity-40'
              }`}>
                <div className="flex items-center gap-4">
                   <gate.ic className="h-5 w-5 opacity-40" />
                   <p className="text-[11px] font-bold uppercase tracking-[0.15em]">{gate.t}</p>
                </div>
                {gate.s === 'done' ? <CheckCircle2 className="h-5 w-5" /> : gate.s === 'manual' ? <Info className="h-5 w-5 animate-pulse" /> : <Clock className="h-5 w-5 opacity-30" />}
              </div>
            ))}
          </div>
        </section>

        {/* E2E REVENUE DESK (EL BÚNKER OSCURO) */}
        <section className="rounded-[var(--radius-3xl)] bg-brand-dark p-10 md:p-14 shadow-2xl text-white relative overflow-hidden group border border-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/30 via-transparent to-transparent opacity-40 pointer-events-none" />
          
          <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-8 mb-14 relative z-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 text-brand-yellow text-[10px] font-bold uppercase tracking-[0.4em] backdrop-blur-xl">
                <Zap className="h-4 w-4 fill-current" /> Revenue E2E Protocol
              </div>
              <h3 className="font-heading text-4xl tracking-tight leading-none">Cobro & Entrega <span className="text-brand-blue italic font-light">Forense</span></h3>
              <p className="max-w-md text-base font-light text-white/50 italic border-l border-white/10 pl-6">
                Valida si el Kernel de KCE puede procesar el pago masivo y emitir tickets sin intervención humana.
              </p>
            </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 relative z-10">
              {[
                { l: 'Checkout & Liquidez', ids: ['stripe.session', 'stripe.paid'] },
                { l: 'Webhook Integrity', ids: ['events.checkout_paid', 'events.stripe_webhook_received'] },
                { l: 'Booking Registry', ids: ['supabase.booking_exists'] },
                { l: 'Dispatch Node', ids: ['events.email_sent', 'links.token'] }
              ].map((block) => {
                const checks = block.ids.map(id => rcCheckMap.get(id)).filter(Boolean);
                const allOk = checks.length > 0 && checks.every(c => c?.ok);
                return (
                  <div key={block.l} className={`p-6 rounded-[1.8rem] border transition-all flex items-center justify-between group/block ${allOk ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                     <div className="space-y-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">{block.l}</p>
                        <div className="flex gap-1">
                           {block.ids.map(id => (
                              <div key={id} className={`h-1 w-4 rounded-full ${rcCheckMap.get(id)?.ok ? 'bg-green-500' : 'bg-white/10'}`} />
                           ))}
                        </div>
                     </div>
                     {allOk ? <CheckIcon className="h-6 w-6 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" /> : <Database className="h-6 w-6 text-white/10" />}
                  </div>
                );
              })}
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 relative z-10 flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.5em] text-white/10">
             <Globe className="h-3 w-3" /> Trans-Atlantic Secure Node Verified
          </div>
        </section>
      </div>

      {/* 04. CONTROLES TÁCTICOS */}
      <div className="grid gap-8 lg:grid-cols-2">
        
        {/* EJECUTOR QA (BÓVEDA DE INSTRUMENTACIÓN) */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 md:p-12 shadow-pop space-y-10 relative overflow-hidden">
          <header className="flex items-center justify-between border-b border-brand-dark/5 dark:border-white/5 pb-8">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner">
                  <Terminal className="h-6 w-6" />
               </div>
               <h2 className="font-heading text-3xl text-main tracking-tight uppercase leading-none">Instrumentación Base</h2>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest ${data ? 'bg-green-500/10 text-green-700' : 'bg-surface-2 text-muted opacity-40'}`}>
               {data ? 'Audit_Registry_Ready' : 'Waiting_Sequence'}
            </div>
          </header>

          <div className="flex flex-wrap gap-4">
             <button 
                onClick={() => setDeep(!deep)}
                className={`flex items-center gap-4 px-8 py-5 rounded-[1.8rem] border transition-all shadow-sm grow sm:grow-0 ${deep ? 'bg-brand-blue text-white border-brand-blue ring-4 ring-brand-blue/10' : 'bg-surface border-brand-dark/10 text-muted hover:border-brand-blue/30'}`}
             >
                <div className={`h-2.5 w-2.5 rounded-full ${deep ? 'bg-white animate-pulse' : 'bg-muted opacity-30'}`} />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Red Profunda (APIs)</span>
             </button>
             <button 
                onClick={() => setProdMode(!prodMode)}
                className={`flex items-center gap-4 px-8 py-5 rounded-[1.8rem] border transition-all shadow-sm grow sm:grow-0 ${prodMode ? 'bg-red-600 text-white border-red-600 ring-4 ring-red-600/10' : 'bg-surface border-brand-dark/10 text-muted hover:border-red-600/30'}`}
             >
                <Globe className={`h-4 w-4 ${prodMode ? 'animate-spin-slow' : 'opacity-30'}`} />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Modo Producción</span>
             </button>
          </div>

          <Button 
            onClick={() => void runQa()} 
            disabled={loading} 
            className="w-full h-16 rounded-[2rem] bg-brand-dark text-brand-yellow font-bold uppercase tracking-[0.2em] text-xs shadow-pop hover:bg-brand-blue hover:text-white transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-4"
          >
             <Activity className={`h-5 w-5 ${loading ? 'animate-spin' : 'animate-pulse text-brand-blue'}`} /> 
             {loading ? 'AUDITORÍA EN CURSO...' : 'LANZAR VERIFICACIÓN DE SISTEMA'}
          </Button>

          {data && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              {Object.entries(groupedQa).map(([group, checks]) => (
                <div key={group} className="space-y-4">
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40 ml-2">
                     <Hash className="h-3 w-3" /> {group}_trace_node
                  </div>
                  <div className="grid gap-3">
                    {checks.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-5 rounded-2xl bg-surface-2/50 border border-brand-dark/5 shadow-inner hover:bg-surface-2 transition-colors">
                        <div className="flex items-center gap-4">
                          {c.ok ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-600 animate-pulse" />}
                          <span className="text-xs font-bold text-main tracking-tight uppercase">{c.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="h-px w-8 bg-brand-dark/10" />
                           <span className="text-[10px] font-mono text-muted opacity-60">{c.ms}ms</span>
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
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 md:p-12 shadow-pop space-y-10 relative overflow-hidden">
            <header className="flex items-center justify-between border-b border-brand-dark/5 dark:border-white/5 pb-8">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-brand-yellow/10 flex items-center justify-center text-brand-yellow shadow-inner">
                    <Layers className="h-6 w-6" />
                 </div>
                 <h2 className="font-heading text-3xl text-main tracking-tight uppercase leading-none">Revenue Debugger</h2>
              </div>
              <div className="px-3 py-1 rounded-lg bg-surface-2 border border-brand-dark/5 text-[9px] font-mono font-bold text-muted uppercase tracking-widest">E2E_Logic</div>
            </header>

            <div className="space-y-6">
               <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Stripe Session Identity</label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue opacity-30 group-focus-within:opacity-100 transition-opacity" />
                    <input 
                      value={rcSessionId} 
                      onChange={(e) => setRcSessionId(e.target.value)} 
                      placeholder="cs_live_..." 
                      className="w-full h-16 pl-12 pr-6 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-sm font-mono font-bold text-brand-blue outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner placeholder:text-muted/30" 
                    />
                  </div>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => void runRcVerify()} 
                    disabled={!rcSessionId || rcLoading} 
                    className="h-14 rounded-2xl bg-brand-dark text-brand-yellow font-bold uppercase tracking-widest text-[10px] shadow-soft hover:bg-brand-blue hover:text-white transition-all active:scale-95 disabled:opacity-20"
                  >
                     {rcLoading ? 'Analyzing...' : 'Verificar E2E Flow'}
                  </Button>
                  <Button 
                    onClick={() => void runRcVerify({ healBooking: true })} 
                    disabled={!rcSessionId || rcLoading} 
                    className="h-14 rounded-2xl bg-green-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-pop hover:bg-green-700 transition-all active:scale-95 disabled:opacity-20"
                  >
                     Heal + Re-dispatch
                  </Button>
               </div>
            </div>

            {rcData && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40 ml-2">Forensic_Output</div>
                 <div className="grid gap-3">
                   {rcData.checks.map(c => (
                     <div key={c.id} className="flex flex-col gap-2 p-5 rounded-2xl bg-surface border border-brand-dark/5 shadow-soft">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              {c.ok ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <ShieldAlert className="h-5 w-5 text-red-600" />}
                              <span className="text-xs font-black text-main tracking-tight uppercase">{c.label}</span>
                           </div>
                           <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${c.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                              {c.ok ? 'OK' : 'FAIL'}
                           </span>
                        </div>
                        {c.detail && (
                          <div className="mt-2 text-[11px] font-mono text-muted bg-surface-2 p-3 rounded-xl border border-brand-dark/5 leading-relaxed break-all">
                             <ChevronRight className="h-3 w-3 inline mr-1 opacity-30" />
                             {c.detail}
                          </div>
                        )}
                     </div>
                   ))}
                 </div>
              </div>
            )}

            {rcError && (
               <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-700 text-xs font-bold flex items-center gap-3 animate-in shake-in">
                  <AlertTriangle className="h-5 w-5" /> NODE_ERROR: {rcError}
               </div>
            )}
        </section>
      </div>

      {/* 05. FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> Release Integrity Verified
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Cpu className="h-4 w-4 opacity-50" /> Pipeline Control v4.4
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Zap className="h-4 w-4 animate-pulse" /> Live Deployment Gate Active
        </div>
      </footer>

    </div>
  );
}