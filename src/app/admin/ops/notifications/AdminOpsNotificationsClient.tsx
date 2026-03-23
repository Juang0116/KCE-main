'use client';

import { useMemo, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  BellRing, Webhook, Mail, 
  Send, Activity, CheckCircle2, 
  XCircle, Terminal, Radio, ShieldCheck, 
  Smartphone, Zap, ChevronRight, Hash,
  AlertTriangle, Info, Database
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Resp = {
  ok: boolean;
  channels: { webhook: boolean; email: boolean; whatsapp: boolean };
  requestId?: string;
  error?: string;
};

export function AdminOpsNotificationsClient() {
  const [severity, setSeverity] = useState<'info' | 'warn' | 'critical'>('warn');
  const [title, setTitle] = useState('Test OPS Alert KCE');
  const [message, setMessage] = useState('Alarma de prueba desde el nodo central de Knowing Cultures S.A.S.');
  const [busy, setBusy] = useState(false);
  const [resp, setResp] = useState<Resp | null>(null);

  const preview = useMemo(() => {
    return `[${severity.toUpperCase()}] ${title}\n\n${message}\n\n> Node: Production_Admin\n> Protocol: KCE-P77\n> Status: Verification_Step`;
  }, [severity, title, message]);

  const send = useCallback(async () => {
    setBusy(true);
    setResp(null);
    try {
      const r = await adminFetch('/api/admin/ops/notify/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ severity, title, message }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setResp({ 
          ok: false, 
          channels: j.channels || { webhook: false, email: false, whatsapp: false }, 
          error: j.error || `Node Error: ${r.status}` 
        });
        return;
      }
      setResp(j);
    } catch (e: unknown) {
      setResp({ ok: false, channels: { webhook: false, email: false, whatsapp: false }, error: e instanceof Error ? e.message : 'Falla de Transmisión' });
    } finally {
      setBusy(false);
    }
  }, [severity, title, message]);

  const notificationSignals = useMemo(() => [
    { label: 'Relé Webhook', value: resp?.channels?.webhook ? 'ONLINE' : (resp ? 'FAIL' : 'READY'), note: 'Slack/Discord Core.' },
    { label: 'Dispatch Email', value: resp?.channels?.email ? 'ONLINE' : (resp ? 'FAIL' : 'READY'), note: 'Resend Infrastructure.' },
    { label: 'Push WhatsApp', value: resp?.channels?.whatsapp ? 'ONLINE' : (resp ? 'FAIL' : 'READY'), note: 'Canal crítico móvil.' },
  ], [resp]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA TÁCTICA */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Radio className="h-3.5 w-3.5" /> Broadcast Lane: /notification-sim-node
          </div>
          <h1 className="font-heading text-4xl md:text-6xl text-main tracking-tighter leading-none">
            Simulador <span className="text-brand-yellow italic font-light">de Alertas</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed mt-2 italic">
            Instrumento de validación de red para Knowing Cultures S.A.S. Garantiza que el puente de comunicación entre el Kernel y los operadores se mantenga íntegro.
          </p>
        </div>
      </header>

      {/* 02. WORKBENCH OPERATIVO */}
      <AdminOperatorWorkbench
        eyebrow="Emergency Protocols"
        title="Validación de Red de Alarmas"
        description="Si el sistema detecta una anomalía estructural o de revenue, activará estos carriles. El protocolo exige una prueba de integridad semanal."
        actions={[
          { href: '/admin/ops/incidents', label: 'Ver Incidencias', tone: 'primary' },
          { href: '/admin/events', label: 'Visor de Trazas' }
        ]}
        signals={notificationSignals}
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        
        {/* 03. COMPOSER DE ALERTA (BÓVEDA) */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 md:p-12 shadow-pop space-y-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
             <BellRing className="h-48 w-48 text-brand-blue" />
          </div>
          
          <header className="flex items-center gap-4 border-b border-brand-dark/5 dark:border-white/5 pb-8 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner">
               <Zap className="h-6 w-6" />
            </div>
            <div>
               <h2 className="font-heading text-3xl text-main tracking-tight uppercase">Composer de Prueba</h2>
               <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">Manual Override Protocol</p>
            </div>
          </header>

          <div className="space-y-10 relative z-10">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Nivel de Impacto (Severidad)</label>
              <div className="flex gap-3 p-2 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface-2/50 shadow-inner">
                {(['info', 'warn', 'critical'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    disabled={busy}
                    className={`flex-1 h-12 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-sm ${
                      severity === s 
                        ? (s === 'info' ? 'bg-brand-blue text-white ring-4 ring-brand-blue/10 scale-105' : s === 'warn' ? 'bg-brand-yellow text-brand-dark ring-4 ring-brand-yellow/10 scale-105' : 'bg-red-600 text-white ring-4 ring-red-600/10 scale-105')
                        : 'text-muted hover:bg-surface hover:text-main'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Título de la Transmisión</label>
              <div className="relative group">
                 <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue opacity-30 group-focus-within:opacity-100 transition-opacity" />
                 <input
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   className="w-full h-14 pl-12 pr-6 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-sm font-bold text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner"
                   disabled={busy}
                 />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Cuerpo del Mensaje Táctico</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-40 p-6 rounded-[2rem] border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-sm font-light leading-relaxed text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all resize-none italic shadow-inner custom-scrollbar"
                disabled={busy}
              />
            </div>

            <div className="pt-4">
              <Button
                onClick={() => void send()}
                disabled={busy || !title || !message}
                className="w-full h-16 rounded-[2rem] bg-brand-dark text-brand-yellow font-bold uppercase tracking-[0.2em] text-xs shadow-pop hover:bg-brand-blue hover:text-white transition-all active:scale-95 disabled:opacity-30 relative group/btn overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                   <Send className={`h-5 w-5 ${busy ? 'animate-pulse' : ''}`}/> 
                   {busy ? 'Transmitiendo...' : 'Disparar Protocolo de Red'}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              </Button>
            </div>
          </div>
        </section>

        {/* 04. DIAGNÓSTICO Y PREVIEW (LATERAL) */}
        <section className="space-y-8">
          
          <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 shadow-pop flex flex-col relative overflow-hidden">
            <div className="absolute -right-6 -top-6 opacity-[0.02] pointer-events-none">
               <Activity className="h-48 w-48 text-brand-blue" />
            </div>
            
            <header className="flex items-center gap-4 border-b border-brand-dark/5 dark:border-white/5 pb-8 mb-10 relative z-10">
               <div className="h-10 w-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner">
                  <Activity className="h-5 w-5" />
               </div>
               <h2 className="font-heading text-2xl text-main tracking-tight uppercase">Estado de Entrega</h2>
            </header>

            <div className="grid grid-cols-3 gap-6 mb-10 relative z-10">
              {[
                { l: 'Webhook', i: Webhook, s: resp?.channels?.webhook },
                { l: 'Email', i: Mail, s: resp?.channels?.email },
                { l: 'WhatsApp', i: Smartphone, s: resp?.channels?.whatsapp }
              ].map((ch) => (
                <div key={ch.l} className="rounded-2xl border border-brand-dark/5 dark:border-white/5 bg-surface-2/50 p-8 text-center group hover:border-brand-blue/20 transition-all shadow-sm">
                  <ch.i className={`h-10 w-10 mx-auto mb-5 transition-all ${ch.s ? 'text-green-500 scale-110 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'text-muted opacity-20'}`} />
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-4 opacity-60">{ch.l}</div>
                  {resp ? (
                    ch.s 
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-4 py-1 text-[9px] font-black text-green-700 dark:text-green-400 uppercase tracking-tighter">OK_NODE</span> 
                      : <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-4 py-1 text-[9px] font-black text-red-700 dark:text-red-400 uppercase tracking-tighter">ERR_LINK</span>
                  ) : <span className="text-[9px] font-mono opacity-20 uppercase tracking-widest">Awaiting...</span>}
                </div>
              ))}
            </div>

            {resp && (
              <div className={`rounded-[2rem] border p-6 flex items-center gap-5 animate-in zoom-in-95 shadow-sm ${resp.ok ? 'border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400' : 'border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-400'}`}>
                {resp.ok ? <CheckCircle2 className="h-6 w-6 opacity-60" /> : <XCircle className="h-6 w-6 opacity-60" />}
                <div className="space-y-1">
                   <p className="text-sm font-bold tracking-tight">{resp.ok ? 'Protocolo completado con éxito.' : `Transmisión interrumpida: ${resp.error}`}</p>
                   {resp.requestId && <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Trace_ID: {resp.requestId}</p>}
                </div>
              </div>
            )}
          </div>

          {/* TERMINAL PREVIEW (LA CONSOLA) */}
          <div className="rounded-[3rem] bg-[#0a0a0a] p-10 shadow-2xl border border-white/5 text-emerald-500 font-mono text-xs overflow-hidden relative group ring-1 ring-white/10">
            <div className="absolute top-6 left-10 flex gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/40 group-hover:bg-red-500 transition-colors"></div>
              <div className="h-3 w-3 rounded-full bg-amber-500/40 group-hover:bg-amber-500 transition-colors"></div>
              <div className="h-3 w-3 rounded-full bg-green-500/40 group-hover:bg-green-500 transition-colors"></div>
            </div>
            
            <div className="mt-12 space-y-6">
               <div className="opacity-30 flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Broadcast_Output_Preview</span>
                  <Terminal className="h-4 w-4" />
               </div>
               <div className="leading-relaxed whitespace-pre-wrap py-6 px-4 bg-white/5 rounded-2xl italic text-[13px] border border-white/5 selection:bg-brand-blue/30">
                  {preview}
               </div>
               <div className="flex items-center gap-3 text-emerald-500/20 text-[10px] font-bold uppercase tracking-[0.3em]">
                  <div className="h-1 w-1 rounded-full bg-current animate-ping" />
                  <span>awaiting_transmission_packet_...</span>
                  <span className="animate-pulse">_</span>
               </div>
            </div>
            
            <div className="mt-10 pt-6 border-t border-white/5 text-center text-[9px] uppercase tracking-[0.6em] text-white/5 italic">
               Knowing Cultures Strategic Comms · v5.1
            </div>
          </div>

        </section>
      </div>

      {/* FOOTER DE INTEGRIDAD CORPORATIVA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Confidence Network Validated
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Database className="h-4 w-4 opacity-50" /> Encryption Protocol KCE-P77
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-blue">
          <Smartphone className="h-4 w-4" /> Multi-Channel Broadcast Active
        </div>
      </footer>

    </div>
  );
}