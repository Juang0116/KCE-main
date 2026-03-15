'use client';

import { useMemo, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { BellRing, Webhook, Mail, MessageSquare, Send, ShieldAlert, Activity, CheckCircle2, XCircle } from 'lucide-react';

type Resp = {
  ok: boolean;
  channels: { webhook: boolean; email: boolean; whatsapp: boolean };
  requestId?: string;
  error?: string;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

export function AdminOpsNotificationsClient() {
  const [severity, setSeverity] = useState<'info' | 'warn' | 'critical'>('warn');
  const [title, setTitle] = useState('Test OPS Alert KCE');
  const [message, setMessage] = useState('Esta es una alarma de prueba enviada desde el Command Center de Knowing Cultures Enterprise.');
  const [busy, setBusy] = useState(false);
  const [resp, setResp] = useState<Resp | null>(null);

  const preview = useMemo(() => {
    return `[${severity.toUpperCase()}] ${title}\n\n${message}\n\n> System Env: Production / Command Center`;
  }, [severity, title, message]);

  async function send() {
    setBusy(true);
    setResp(null);
    try {
      const r = await adminFetch('/api/admin/ops/notify/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ severity, title, message }),
      });
      const j = (await r.json().catch(() => ({}))) as Resp;
      if (!r.ok) {
        setResp({ ok: false, channels: (j as any).channels || { webhook: false, email: false, whatsapp: false }, error: (j as any).error || 'Error' });
        return;
      }
      setResp(j);
    } catch (e: any) {
      setResp({ ok: false, channels: { webhook: false, email: false, whatsapp: false }, error: e?.message || 'Error' });
    } finally {
      setBusy(false);
    }
  }

  const notificationSignals = useMemo(() => [
    { label: 'Slack / Discord', value: resp?.channels?.webhook ? 'ONLINE' : 'OFF', note: 'Canal de Webhook principal.' },
    { label: 'Email Alerts', value: resp?.channels?.email ? 'ONLINE' : 'OFF', note: 'Alertas al administrador.' },
    { label: 'WhatsApp', value: resp?.channels?.whatsapp ? 'ONLINE' : 'OFF', note: 'Avisos urgentes al móvil (CallMeBot).' },
  ], [resp]);

  return (
    <div className="space-y-10 pb-20">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Simulador de Alertas (Ops)</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Prueba en vivo la conectividad hacia los canales de notificación del equipo.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Incident Response"
        title="Verifica tu red de alarmas"
        description="Si la base de datos se cae o hay una anomalía de revenue, KCE te buscará por Webhook, Email y WhatsApp. Usa este simulador para garantizar que el puente de comunicación está abierto."
        actions={[
          { href: '/admin/system', label: 'Sanidad del Servidor', tone: 'primary' },
          { href: '/admin/ops/incidents', label: 'Centro de Incidentes' }
        ]}
        signals={notificationSignals}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        
        {/* COLUMNA 1: COMPOSER */}
        <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8 border-b border-[var(--color-border)] pb-6">
            <BellRing className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-[var(--color-text)]">Crear Alerta de Prueba</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-3">Nivel de Severidad</label>
              <div className="flex gap-2 bg-[var(--color-surface-2)] p-1.5 rounded-2xl border border-[var(--color-border)]">
                {(['info', 'warn', 'critical'] as const).map((s) => {
                  const active = severity === s;
                  let activeColors = '';
                  if (active) {
                    if (s === 'info') activeColors = 'bg-brand-blue text-white shadow-sm';
                    if (s === 'warn') activeColors = 'bg-amber-500 text-white shadow-sm';
                    if (s === 'critical') activeColors = 'bg-rose-500 text-white shadow-sm';
                  } else {
                    activeColors = 'text-[var(--color-text)]/50 hover:bg-[var(--color-border)] hover:text-[var(--color-text)]';
                  }

                  return (
                    <button
                      key={s}
                      type="button"
                      className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${activeColors}`}
                      onClick={() => setSeverity(s)}
                      disabled={busy}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Asunto de la Alerta</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-semibold outline-none focus:border-brand-blue transition-colors"
                disabled={busy}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Mensaje del Sistema</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="h-32 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-light leading-relaxed outline-none focus:border-brand-blue transition-colors resize-none"
                disabled={busy}
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={send}
                disabled={busy || !title || !message}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 py-4 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-md disabled:opacity-50"
              >
                <Send className={`h-4 w-4 ${busy ? 'animate-pulse' : ''}`}/> 
                {busy ? 'Transmitiendo Alerta...' : 'Disparar Alerta de Prueba'}
              </button>
            </div>
          </div>
        </section>

        {/* COLUMNA 2: RESULTADOS Y PREVIEW */}
        <section className="flex flex-col gap-6">
          
          {/* Resultado de Entrega */}
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm flex-1">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="h-6 w-6 text-brand-blue" />
              <h2 className="font-heading text-2xl text-[var(--color-text)]">Estado de Entrega</h2>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-center">
                <Webhook className="h-6 w-6 mx-auto mb-2 text-[var(--color-text)]/40" />
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/60 mb-2">Webhook</div>
                {resp?.channels ? (
                  resp.channels.webhook ? <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700"><CheckCircle2 className="h-3 w-3"/> OK</span> : <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--color-text)]/40">OFF</span>
                ) : <span className="text-[10px] font-mono text-[var(--color-text)]/30">Esperando...</span>}
              </div>
              
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-center">
                <Mail className="h-6 w-6 mx-auto mb-2 text-[var(--color-text)]/40" />
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/60 mb-2">Email</div>
                {resp?.channels ? (
                  resp.channels.email ? <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700"><CheckCircle2 className="h-3 w-3"/> OK</span> : <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--color-text)]/40">OFF</span>
                ) : <span className="text-[10px] font-mono text-[var(--color-text)]/30">Esperando...</span>}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-center">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 text-[var(--color-text)]/40" />
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/60 mb-2">WhatsApp</div>
                {resp?.channels ? (
                  resp.channels.whatsapp ? <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700"><CheckCircle2 className="h-3 w-3"/> OK</span> : <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--color-text)]/40">OFF</span>
                ) : <span className="text-[10px] font-mono text-[var(--color-text)]/30">Esperando...</span>}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">Diagnóstico de Envío</div>
              {resp ? (
                <div>
                  <div className={`text-sm font-semibold flex items-center gap-2 ${resp.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {resp.ok ? <><CheckCircle2 className="h-4 w-4"/> Transmisión completada (Best-effort)</> : <><XCircle className="h-4 w-4"/> Error: {resp.error || 'Desconocido'}</>}
                  </div>
                  {resp.requestId && <div className="mt-2 text-[10px] font-mono text-[var(--color-text)]/40">Req ID: {resp.requestId}</div>}
                </div>
              ) : (
                <div className="text-xs text-[var(--color-text)]/40 italic">Presiona el botón para validar la configuración actual de tu .env.</div>
              )}
            </div>

            <div className="mt-6 border-t border-[var(--color-border)] pt-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-brand-blue mb-3 flex items-center gap-1.5"><ShieldAlert className="h-3 w-3"/> Guía de Solución</div>
              <ul className="space-y-2 text-[11px] leading-relaxed text-[var(--color-text)]/60 font-light">
                <li><span className="font-semibold text-[var(--color-text)]/80">Webhook OFF:</span> Revisa <code>OPS_SLACK_WEBHOOK_URL</code> (o Discord) en Vercel.</li>
                <li><span className="font-semibold text-[var(--color-text)]/80">Email OFF:</span> Verifica <code>OPS_NOTIFY_EMAIL_TO</code> y que Resend tenga permisos.</li>
                <li><span className="font-semibold text-[var(--color-text)]/80">WhatsApp OFF:</span> Faltan <code>OPS_CALLMEBOT_PHONE</code> y <code>APIKEY</code>.</li>
              </ul>
            </div>
          </div>

          {/* Terminal Preview */}
          <div className="rounded-[2.5rem] bg-gray-900 p-6 md:p-8 shadow-inner border border-gray-800 text-emerald-400 font-mono text-xs overflow-hidden relative">
            <div className="absolute top-4 left-6 flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-500"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
            </div>
            <div className="mt-6 whitespace-pre-wrap leading-relaxed opacity-90">
              {preview}
            </div>
            <div className="mt-4 flex items-center gap-2 opacity-50">
              <span className="animate-pulse">_</span>
            </div>
          </div>

        </section>

      </div>
    </div>
  );
}