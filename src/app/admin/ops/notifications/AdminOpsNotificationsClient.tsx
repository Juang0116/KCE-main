'use client';

import { useMemo, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  BellRing, Webhook, Mail, 
  Send, Activity, CheckCircle2, 
  XCircle, Terminal, Radio, ShieldCheck, 
  Smartphone
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
  const [message, setMessage] = useState('Alarma de prueba desde el nodo central de Knowing Cultures Enterprise.');
  const [busy, setBusy] = useState(false);
  const [resp, setResp] = useState<Resp | null>(null);

  const preview = useMemo(() => {
    return `[${severity.toUpperCase()}] ${title}\n\n${message}\n\n> Node: Production_Admin\n> Status: Verification_Step`;
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
      setResp({ ok: false, channels: { webhook: false, email: false, whatsapp: false }, error: e instanceof Error ? e.message : 'Error' });
    } finally {
      setBusy(false);
    }
  }, [severity, title, message]);

  const notificationSignals = useMemo(() => [
    { label: 'Relé Webhook', value: resp?.channels?.webhook ? 'NOMINAL' : 'OFFLINE', note: 'Integración Slack/Discord.' },
    { label: 'Dispatch Email', value: resp?.channels?.email ? 'NOMINAL' : 'OFFLINE', note: 'Alertas vía Resend/SMTP.' },
    { label: 'Push WhatsApp', value: resp?.channels?.whatsapp ? 'NOMINAL' : 'OFFLINE', note: 'Canal crítico móvil.' },
  ], [resp]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10 px-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Radio className="h-3.5 w-3.5" /> Broadcast Lane: /notification-sim
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            Simulador <span className="text-brand-yellow italic font-light">de Alertas</span>
          </h1>
          <p className="mt-4 text-base text-[var(--color-text)]/50 font-light max-w-2xl italic">
            Instrumento de validación de red. Garantiza que el puente de comunicación entre el núcleo de KCE y los operadores se mantenga íntegro.
          </p>
        </div>
      </header>

      <AdminOperatorWorkbench
        eyebrow="Emergency Protocols"
        title="Validación de Red de Alarmas"
        description="Si el sistema detecta una anomalía crítica de revenue o infraestructura, activará estos carriles. Realiza una prueba semanal."
        actions={[
          { href: '/admin/ops/incidents', label: 'Centro de Incidentes', tone: 'primary' },
          { href: '/admin/system/logs', label: 'Monitor de Logs' }
        ]}
        signals={notificationSignals}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        
        {/* COMPOSER DE ALERTA */}
        <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-10 shadow-2xl space-y-10">
          <header className="flex items-center gap-4 border-b border-[var(--color-border)] pb-6">
            <div className="h-10 w-10 rounded-2xl bg-brand-blue/5 text-brand-blue flex items-center justify-center shadow-inner">
               <BellRing className="h-5 w-5" />
            </div>
            <h2 className="font-heading text-2xl text-brand-blue">Composer de Prueba</h2>
          </header>

          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1">Nivel de Impacto (Severidad)</label>
              <div className="flex gap-2 p-1.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                {(['info', 'warn', 'critical'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    disabled={busy}
                    className={`flex-1 h-11 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                      severity === s 
                        ? (s === 'info' ? 'bg-brand-blue text-white shadow-lg scale-105' : s === 'warn' ? 'bg-brand-yellow text-brand-dark shadow-lg scale-105' : 'bg-rose-600 text-white shadow-lg scale-105')
                        : 'text-[var(--color-text)]/40 hover:bg-white hover:text-brand-blue'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1">Título de la Transmisión</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-14 px-5 rounded-2xl border border-[var(--color-border)] bg-white text-sm font-bold text-brand-blue outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all"
                disabled={busy}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1">Cuerpo del Mensaje</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-32 p-5 rounded-2xl border border-[var(--color-border)] bg-white text-sm font-light leading-relaxed outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all resize-none italic"
                disabled={busy}
              />
            </div>

            <Button
              onClick={() => void send()}
              disabled={busy || !title || !message}
              className="w-full h-14 rounded-2xl bg-brand-dark text-brand-yellow font-bold uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50"
            >
              <Send className={`mr-2 h-4 w-4 ${busy ? 'animate-pulse' : ''}`}/> 
              {busy ? 'Transmitiendo...' : 'Disparar Protocolo'}
            </Button>
          </div>
        </section>

        {/* DIAGNÓSTICO Y PREVIEW */}
        <section className="space-y-8">
          
          <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-10 shadow-2xl">
            <header className="flex items-center gap-4 border-b border-[var(--color-border)] pb-6 mb-8">
               <Activity className="h-5 w-5 text-brand-blue" />
               <h2 className="font-heading text-2xl text-brand-blue">Estado de Entrega</h2>
            </header>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { l: 'Webhook', i: Webhook, s: resp?.channels?.webhook },
                { l: 'Email', i: Mail, s: resp?.channels?.email },
                { l: 'WhatsApp', i: Smartphone, s: resp?.channels?.whatsapp }
              ].map((ch) => (
                <div key={ch.l} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 text-center group hover:border-brand-blue/20 transition-all">
                  <ch.i className={`h-8 w-8 mx-auto mb-4 transition-colors ${ch.s ? 'text-emerald-500' : 'text-[var(--color-text)]/20'}`} />
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-3">{ch.l}</div>
                  {resp ? (
                    ch.s 
                      ? <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-700 uppercase">OK</span> 
                      : <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-1 text-[9px] font-bold text-rose-700 uppercase">ERR</span>
                  ) : <span className="text-[8px] font-mono opacity-20">PENDING</span>}
                </div>
              ))}
            </div>

            {resp && (
              <div className={`rounded-2xl border p-5 flex items-center gap-4 animate-in zoom-in-95 ${resp.ok ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700' : 'border-rose-500/20 bg-rose-500/5 text-rose-700'}`}>
                {resp.ok ? <CheckCircle2 className="h-5 w-5 opacity-60" /> : <XCircle className="h-5 w-5 opacity-60" />}
                <div className="space-y-1">
                   <p className="text-sm font-bold">{resp.ok ? 'Protocolo completado con éxito.' : `Falla en el nodo: ${resp.error}`}</p>
                   {resp.requestId && <p className="text-[10px] font-mono opacity-40">Trace_ID: {resp.requestId}</p>}
                </div>
              </div>
            )}
          </div>

          {/* TERMINAL PREVIEW */}
          <div className="rounded-[3rem] bg-gray-950 p-8 md:p-10 shadow-2xl border border-gray-800 text-emerald-500 font-mono text-xs overflow-hidden relative group">
            <div className="absolute top-6 left-8 flex gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-500/50 group-hover:bg-rose-500 transition-colors"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500/50 group-hover:bg-amber-500 transition-colors"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-500 transition-colors"></div>
            </div>
            <div className="mt-8 space-y-4">
               <div className="opacity-30 flex justify-between">
                 <span>// OUTPUT_PREVIEW</span>
                 <Terminal className="h-3 w-3" />
               </div>
               <div className="leading-relaxed whitespace-pre-wrap py-4 border-y border-white/5">
                 {preview}
               </div>
               <div className="flex items-center gap-2 text-emerald-500/30">
                 <span>awaiting_transmission_...</span>
                 <span className="animate-pulse">_</span>
               </div>
            </div>
          </div>

        </section>
      </div>

      <footer className="pt-12 flex items-center justify-center gap-12 border-t border-[var(--color-border)] opacity-20 hover:opacity-50 transition-opacity">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Confidence Network
        </div>
      </footer>
    </div>
  );
}