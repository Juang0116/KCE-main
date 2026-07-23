'use client';

import { useMemo, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import {
  BellRing,
  Webhook,
  Mail,
  Send,
  Activity,
  CheckCircle2,
  XCircle,
  Terminal,
  Radio,
  ShieldCheck,
  Smartphone,
  Zap,
  ChevronRight,
  Hash,
  AlertTriangle,
  Info,
  Database,
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
  const [message, setMessage] = useState(
    'Alarma de prueba desde el nodo central de Knowing Cultures S.A.S.',
  );
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
          error: j.error || `Node Error: ${r.status}`,
        });
        return;
      }
      setResp(j);
    } catch (e: unknown) {
      setResp({
        ok: false,
        channels: { webhook: false, email: false, whatsapp: false },
        error: e instanceof Error ? e.message : 'Falla de Transmisión',
      });
    } finally {
      setBusy(false);
    }
  }, [severity, title, message]);

  const notificationSignals = useMemo(
    () => [
      {
        label: 'Relé Webhook',
        value: resp?.channels?.webhook ? 'ONLINE' : resp ? 'FAIL' : 'READY',
        note: 'Slack/Discord Core.',
      },
      {
        label: 'Dispatch Email',
        value: resp?.channels?.email ? 'ONLINE' : resp ? 'FAIL' : 'READY',
        note: 'Resend Infrastructure.',
      },
      {
        label: 'Push WhatsApp',
        value: resp?.channels?.whatsapp ? 'ONLINE' : resp ? 'FAIL' : 'READY',
        note: 'Canal crítico móvil.',
      },
    ],
    [resp],
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-32 duration-1000">
      {/* 01. CABECERA TÁCTICA */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 px-2 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Radio className="h-3.5 w-3.5" /> Broadcast Lane: /notification-sim-node
          </div>
          <h1 className="font-heading text-4xl leading-none tracking-tighter text-main md:text-6xl">
            Simulador <span className="font-light italic text-brand-yellow">de Alertas</span>
          </h1>
          <p className="mt-2 max-w-2xl text-base font-light italic leading-relaxed text-muted">
            Instrumento de validación de red para Knowing Cultures S.A.S. Garantiza que el puente de
            comunicación entre el Kernel y los operadores se mantenga íntegro.
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
          { href: '/admin/events', label: 'Visor de Trazas' },
        ]}
        signals={notificationSignals}
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        {/* 03. COMPOSER DE ALERTA (BÓVEDA) */}
        <section className="relative space-y-12 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5 md:p-12">
          <div className="pointer-events-none absolute right-0 top-0 p-10 opacity-[0.02]">
            <BellRing className="h-48 w-48 text-brand-blue" />
          </div>

          <header className="relative z-10 flex items-center gap-4 border-b border-brand-dark/5 pb-8 dark:border-white/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue shadow-inner">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading text-3xl uppercase tracking-tight text-main">
                Composer de Prueba
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">
                Manual Override Protocol
              </p>
            </div>
          </header>

          <div className="relative z-10 space-y-10">
            <div className="space-y-4">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                Nivel de Impacto (Severidad)
              </label>
              <div className="bg-surface-2/50 flex gap-3 rounded-2xl border border-brand-dark/10 p-2 shadow-inner dark:border-white/10">
                {(['info', 'warn', 'critical'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    disabled={busy}
                    className={`h-12 flex-1 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm transition-all ${
                      severity === s
                        ? s === 'info'
                          ? 'scale-105 bg-brand-blue text-white ring-4 ring-brand-blue/10'
                          : s === 'warn'
                            ? 'scale-105 bg-brand-yellow text-brand-dark ring-4 ring-brand-yellow/10'
                            : 'scale-105 bg-red-600 text-white ring-4 ring-red-600/10'
                        : 'text-muted hover:bg-surface hover:text-main'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                Título de la Transmisión
              </label>
              <div className="group relative">
                <Terminal className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-blue opacity-30 transition-opacity group-focus-within:opacity-100" />
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-brand-dark/10 bg-surface-2 pl-12 pr-6 text-sm font-bold text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
                  disabled={busy}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                Cuerpo del Mensaje Táctico
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="custom-scrollbar h-40 w-full resize-none rounded-[2rem] border border-brand-dark/10 bg-surface-2 p-6 text-sm font-light italic leading-relaxed text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
                disabled={busy}
              />
            </div>

            <div className="pt-4">
              <Button
                onClick={() => void send()}
                disabled={busy || !title || !message}
                className="group/btn relative h-16 w-full overflow-hidden rounded-[2rem] bg-brand-dark text-xs font-bold uppercase tracking-[0.2em] text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95 disabled:opacity-30"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <Send className={`h-5 w-5 ${busy ? 'animate-pulse' : ''}`} />
                  {busy ? 'Transmitiendo...' : 'Disparar Protocolo de Red'}
                </div>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover/btn:translate-x-full" />
              </Button>
            </div>
          </div>
        </section>

        {/* 04. DIAGNÓSTICO Y PREVIEW (LATERAL) */}
        <section className="space-y-8">
          <div className="relative flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5">
            <div className="pointer-events-none absolute -right-6 -top-6 opacity-[0.02]">
              <Activity className="h-48 w-48 text-brand-blue" />
            </div>

            <header className="relative z-10 mb-10 flex items-center gap-4 border-b border-brand-dark/5 pb-8 dark:border-white/5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue shadow-inner">
                <Activity className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-main">
                Estado de Entrega
              </h2>
            </header>

            <div className="relative z-10 mb-10 grid grid-cols-3 gap-6">
              {[
                { l: 'Webhook', i: Webhook, s: resp?.channels?.webhook },
                { l: 'Email', i: Mail, s: resp?.channels?.email },
                { l: 'WhatsApp', i: Smartphone, s: resp?.channels?.whatsapp },
              ].map((ch) => (
                <div
                  key={ch.l}
                  className="bg-surface-2/50 group rounded-2xl border border-brand-dark/5 p-8 text-center shadow-sm transition-all hover:border-brand-blue/20 dark:border-white/5"
                >
                  <ch.i
                    className={`mx-auto mb-5 h-10 w-10 transition-all ${ch.s ? 'scale-110 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'text-muted opacity-20'}`}
                  />
                  <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
                    {ch.l}
                  </div>
                  {resp ? (
                    ch.s ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-4 py-1 text-[9px] font-black uppercase tracking-tighter text-green-700 dark:text-green-400">
                        OK_NODE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-4 py-1 text-[9px] font-black uppercase tracking-tighter text-red-700 dark:text-red-400">
                        ERR_LINK
                      </span>
                    )
                  ) : (
                    <span className="font-mono text-[9px] uppercase tracking-widest opacity-20">
                      Awaiting...
                    </span>
                  )}
                </div>
              ))}
            </div>

            {resp && (
              <div
                className={`animate-in zoom-in-95 flex items-center gap-5 rounded-[2rem] border p-6 shadow-sm ${resp.ok ? 'border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400' : 'border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-400'}`}
              >
                {resp.ok ? (
                  <CheckCircle2 className="h-6 w-6 opacity-60" />
                ) : (
                  <XCircle className="h-6 w-6 opacity-60" />
                )}
                <div className="space-y-1">
                  <p className="text-sm font-bold tracking-tight">
                    {resp.ok
                      ? 'Protocolo completado con éxito.'
                      : `Transmisión interrumpida: ${resp.error}`}
                  </p>
                  {resp.requestId && (
                    <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">
                      Trace_ID: {resp.requestId}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* TERMINAL PREVIEW (LA CONSOLA) */}
          <div className="group relative overflow-hidden rounded-[3rem] border border-white/5 bg-[#0a0a0a] p-10 font-mono text-xs text-emerald-500 shadow-2xl ring-1 ring-white/10">
            <div className="absolute left-10 top-6 flex gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/40 transition-colors group-hover:bg-red-500"></div>
              <div className="h-3 w-3 rounded-full bg-amber-500/40 transition-colors group-hover:bg-amber-500"></div>
              <div className="h-3 w-3 rounded-full bg-green-500/40 transition-colors group-hover:bg-green-500"></div>
            </div>

            <div className="mt-12 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 opacity-30">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em]">
                  Broadcast_Output_Preview
                </span>
                <Terminal className="h-4 w-4" />
              </div>
              <div className="whitespace-pre-wrap rounded-2xl border border-white/5 bg-white/5 px-4 py-6 text-[13px] italic leading-relaxed selection:bg-brand-blue/30">
                {preview}
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-500/20">
                <div className="h-1 w-1 animate-ping rounded-full bg-current" />
                <span>awaiting_transmission_packet_...</span>
                <span className="animate-pulse">_</span>
              </div>
            </div>

            <div className="mt-10 border-t border-white/5 pt-6 text-center text-[9px] uppercase italic tracking-[0.6em] text-white/5">
              Knowing Cultures Strategic Comms · v5.1
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER DE INTEGRIDAD CORPORATIVA */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Confidence Network Validated
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Database className="h-4 w-4 opacity-50" /> Encryption Protocol KCE-P77
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-blue">
          <Smartphone className="h-4 w-4" /> Multi-Channel Broadcast Active
        </div>
      </footer>
    </div>
  );
}
