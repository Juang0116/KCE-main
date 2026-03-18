'use client';

import Link from 'next/link';
import { useMemo, useState, useCallback } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  ShieldCheck, Activity, RefreshCw, CheckCircle2, 
  XCircle, AlertTriangle, Zap, Server, Target, 
  Clock, Rocket, Terminal, ShieldAlert, Layers,
  Search, Smartphone, Check as CheckIcon // ✅ Renombrado para evitar conflicto TS2693
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
      label: blended >= 90 ? 'Ship Ready' : blended >= 75 ? 'Harden Required' : 'Critical Failure',
      color: blended >= 90 ? 'text-emerald-500' : blended >= 75 ? 'text-amber-500' : 'text-rose-600'
    };
  }, [data, rcData]);

  const signals = [
    { label: 'Release Integrity', value: `${gateScore.score}%`, note: gateScore.label },
    { label: 'Revenue Path', value: rcData?.ok ? 'VERIFIED' : 'PENDING', note: 'E2E Transaction Flow' }
  ];

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE INGENIERÍA */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10 px-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Rocket className="h-3.5 w-3.5" /> Deployment Lane: /release-gate
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            QA & <span className="text-brand-yellow italic font-light">Release Gates</span>
          </h1>
          <p className="mt-4 text-base text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Nodo de validación pre-vuelo. Audita la infraestructura, el flujo de revenue y las 
            dependencias críticas antes de inyectar tráfico real a producción.
          </p>
        </div>
      </header>

      <AdminOperatorWorkbench
        eyebrow="Stability Protocol"
        title="Sanidad antes del Go-Live"
        description="Primero ejecuta el QA de red profunda. Luego, inyecta un Session ID de Stripe real para confirmar que el ciclo de 'Webhook -> Booking -> Email' es impecable."
        actions={[
          { href: '/admin/system', label: 'Monitor de Infra', tone: 'primary' },
          { href: '/admin/ops', label: 'Centro Operativo' }
        ]}
        signals={signals}
      />

      {/* 02. DASHBOARDS DE PUNTUACIÓN */}
      <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        
        {/* SCORE DE INTEGRIDAD */}
        <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-10 shadow-2xl space-y-10 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 opacity-[0.03] rotate-12"><ShieldCheck className="h-64 w-64" /></div>
          
          <header className="space-y-2 relative z-10">
             <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text)]/30">Release Readiness score</p>
             <div className="flex items-baseline gap-4">
                <span className={`text-7xl font-heading tracking-tighter ${gateScore.color}`}>{gateScore.score}%</span>
                <span className="text-sm font-mono uppercase tracking-widest opacity-40 italic">{gateScore.label}</span>
             </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 relative z-10">
            {[
              { t: 'QA Base', ok: !!data?.ok, s: data ? 'done' : 'todo' },
              { t: 'Revenue Flow', ok: !!rcData?.ok, s: rcData ? (rcData.ok ? 'done' : 'partial') : 'todo' },
              { t: 'Signed Links', ok: !!rcCheckMap.get('links.token')?.ok, s: rcData ? (rcCheckMap.get('links.token')?.ok ? 'done' : 'partial') : 'todo' },
              { t: 'Mobile UX', ok: false, s: 'manual' }
            ].map((gate) => (
              <div key={gate.t} className={`p-5 rounded-3xl border transition-all ${
                gate.s === 'done' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700' :
                gate.s === 'partial' ? 'bg-amber-500/5 border-amber-500/20 text-amber-700' :
                gate.s === 'manual' ? 'bg-brand-blue/5 border-brand-blue/20 text-brand-blue' :
                'bg-white border-[var(--color-border)] opacity-40'
              }`}>
                <div className="flex items-center justify-between mb-3">
                   <p className="text-[10px] font-bold uppercase tracking-widest">{gate.t}</p>
                   {gate.s === 'done' ? <CheckCircle2 className="h-4 w-4" /> : gate.s === 'manual' ? <Smartphone className="h-4 w-4" /> : <Clock className="h-4 w-4 opacity-30" />}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* E2E REVENUE DESK */}
        <section className="rounded-[3.5rem] bg-brand-dark p-8 md:p-12 shadow-2xl text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 to-transparent opacity-50" />
          
          <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-12 relative z-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 text-brand-yellow text-[9px] font-bold uppercase tracking-widest">
                <Zap className="h-3 w-3" /> Revenue E2E Protocol
              </div>
              <h3 className="font-heading text-3xl">Cobro & Entrega Forense</h3>
              <p className="max-w-sm text-sm font-light text-white/50 italic">Valida si KCE puede procesar el pago y emitir tickets sin intervención manual.</p>
            </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 relative z-10">
             {[
               { l: 'Checkout & Paid', ids: ['stripe.session', 'stripe.paid'] },
               { l: 'Webhook Trail', ids: ['events.checkout_paid', 'events.stripe_webhook_received'] },
               { l: 'Booking Lock', ids: ['supabase.booking_exists'] },
               { l: 'Delivery Node', ids: ['events.email_sent', 'links.token'] }
             ].map((block) => {
               const checks = block.ids.map(id => rcCheckMap.get(id)).filter(Boolean);
               const allOk = checks.length > 0 && checks.every(c => c?.ok);
               return (
                 <div key={block.l} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group/block hover:bg-white/10 transition-all">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">{block.l}</p>
                    {allOk ? <CheckIcon className="h-5 w-5 text-emerald-400" /> : <div className="h-1.5 w-8 rounded-full bg-white/10" />}
                 </div>
               );
             })}
          </div>
        </section>
      </div>

      {/* 03. CONTROLES TÁCTICOS */}
      <div className="grid gap-8 lg:grid-cols-2">
        
        {/* EJECUTOR QA */}
        <section className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-10 shadow-2xl space-y-8">
          <header className="flex items-center gap-4 border-b border-[var(--color-border)] pb-6">
            <Terminal className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-brand-blue">Instrumentación Base</h2>
          </header>

          <div className="flex flex-wrap gap-4">
             <label className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-[var(--color-border)] bg-white cursor-pointer hover:border-brand-blue/30 transition-all shadow-sm">
                <input type="checkbox" checked={deep} onChange={(e) => setDeep(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-blue" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-dark">Red Profunda (APIs)</span>
             </label>
             <label className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-[var(--color-border)] bg-white cursor-pointer hover:border-brand-blue/30 transition-all shadow-sm">
                <input type="checkbox" checked={prodMode} onChange={(e) => setProdMode(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-blue" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-dark">Modo Producción</span>
             </label>
          </div>

          <Button onClick={runQa} disabled={loading} variant="primary" className="w-full h-14 rounded-2xl text-brand-yellow font-bold uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] transition-transform bg-brand-dark">
             <Activity className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Auditoría en Curso...' : 'Lanzar Verificación de Sistema'}
          </Button>

          {data && (
            <div className="space-y-6">
              {Object.entries(groupedQa).map(([group, checks]) => (
                <div key={group} className="space-y-3">
                  <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--color-text)]/30 ml-2">{group}_trace</div>
                  <div className="grid gap-2">
                    {checks.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-white border border-[var(--color-border)]">
                        <div className="flex items-center gap-3">
                          {c.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-rose-500 animate-pulse" />}
                          <span className="text-xs font-bold text-brand-dark">{c.label}</span>
                        </div>
                        <span className="text-[9px] font-mono text-[var(--color-text)]/30">{c.ms}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* REVENUE DEBUGGER */}
        <section className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-10 shadow-2xl space-y-8">
            <header className="flex items-center gap-4 border-b border-[var(--color-border)] pb-6">
              <Layers className="h-6 w-6 text-brand-blue" />
              <h2 className="font-heading text-2xl text-brand-blue">Revenue Debugger</h2>
            </header>

            <div className="space-y-4">
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                  <input value={rcSessionId} onChange={(e) => setRcSessionId(e.target.value)} placeholder="Stripe Session ID (cs_...)" className="w-full h-14 pl-12 pr-4 rounded-2xl border border-[var(--color-border)] bg-white text-sm font-mono font-bold text-brand-blue outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all" />
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => runRcVerify()} disabled={!rcSessionId || rcLoading} variant="outline" className="h-12 rounded-xl text-[9px] font-bold uppercase tracking-widest border-[var(--color-border)]">Verificar E2E</Button>
                  <Button onClick={() => runRcVerify({ healBooking: true })} disabled={!rcSessionId || rcLoading} variant="primary" className="h-12 rounded-xl bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-widest shadow-lg">Heal + Verify</Button>
               </div>
            </div>

            {rcData && (
              <div className="space-y-3">
                 {rcData.checks.map(c => (
                   <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-white border border-[var(--color-border)]">
                      <div className="flex items-center gap-3">
                         {c.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <ShieldAlert className="h-4 w-4 text-rose-500" />}
                         <span className="text-xs font-semibold text-brand-dark">{c.label}</span>
                      </div>
                      {c.detail && <span className="text-[9px] font-mono opacity-30 truncate max-w-[180px]">{c.detail}</span>}
                   </div>
                 ))}
              </div>
            )}
        </section>
      </div>

      <footer className="pt-12 flex items-center justify-center gap-12 border-t border-[var(--color-border)] opacity-20 hover:opacity-50 transition-opacity">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Release Integrity Verified
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> Pipeline v4.4
        </div>
      </footer>
    </div>
  );
}