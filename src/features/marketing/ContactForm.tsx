'use client';

import * as React from 'react';

import { Button } from '@/components/ui/Button';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]!) : null;
}

function readUtm(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem('kce.utm');
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function normalizePhoneLite(v: string): string {
  return v.replace(/[\s\-().]/g, '').trim();
}

type ContactFormProps = {
  initialName?: string;
  initialEmail?: string;
  initialWhatsapp?: string;
  initialMessage?: string;
  source?: string;
  topic?: string;
  salesContext?: {
    city?: string;
    tour?: string;
    slug?: string;
    budget?: string;
    pace?: string;
    pax?: string;
    interests?: string[];
    start?: string;
    end?: string;
    query?: string;
  };
  continueLinks?: Array<{ href: string; label: string; copy: string }>;
};

export default function ContactForm({
  initialName = '',
  initialEmail = '',
  initialWhatsapp = '',
  initialMessage = '',
  source = 'contact_page',
  topic = '',
  salesContext,
  continueLinks = [],
}: ContactFormProps) {
  const [name, setName] = React.useState(initialName);
  const [email, setEmail] = React.useState(initialEmail);
  const [whatsapp, setWhatsapp] = React.useState(initialWhatsapp);
  const [message, setMessage] = React.useState(initialMessage);
  const [consent, setConsent] = React.useState(true);

  const [status, setStatus] = React.useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = React.useState<string>('');
  const [ticketId, setTicketId] = React.useState<string>('');
  const [dealId, setDealId] = React.useState<string>('');
  const [taskId, setTaskId] = React.useState<string>('');

  const canSubmit =
    Boolean(consent) && Boolean(email.trim() || whatsapp.trim()) && Boolean(message.trim());

  const responseLane = React.useMemo(() => {
    if (dealId) return '≤12h';
    if ((topic || '').toLowerCase().includes('reserva') || source === 'chat') return '≤2h';
    return 'mismo día';
  }, [dealId, topic, source]);

  const nextStepLabel = React.useMemo(() => {
    const low = `${topic} ${source}`.toLowerCase();
    if (dealId) return 'KCE ya puede seguir con propuesta o contacto humano sin perder el contexto.';
    if (low.includes('reserva') || low.includes('booking')) return 'Mantén este ticket a mano para soporte, cambios o seguimiento post-compra.';
    if (low.includes('plan')) return 'Si quieres comparar opciones con más calma, puedes volver a Plan personalizado o a Tours.';
    return 'Ya puedes seguir explorando tours o esperar nuestra respuesta con este mismo contexto.';
  }, [dealId, topic, source]);

  const contextSummary = React.useMemo(() => {
    const rows = [
      salesContext?.city ? `Ciudad: ${salesContext.city}` : null,
      salesContext?.tour ? `Tour: ${salesContext.tour}` : null,
      salesContext?.budget ? `Presupuesto: ${salesContext.budget}` : null,
      salesContext?.pace ? `Ritmo: ${salesContext.pace}` : null,
      salesContext?.pax ? `Viajeros: ${salesContext.pax}` : null,
      salesContext?.start || salesContext?.end ? `Fechas: ${salesContext?.start || '—'} → ${salesContext?.end || '—'}` : null,
    ].filter(Boolean);
    return rows.slice(0, 4);
  }, [salesContext]);

  React.useEffect(() => {
    setName(initialName);
  }, [initialName]);

  React.useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  React.useEffect(() => {
    setWhatsapp(initialWhatsapp);
  }, [initialWhatsapp]);

  React.useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setStatus('error');
      setMsg('Completa el mensaje y al menos un contacto (email o WhatsApp).');
      return;
    }

    setStatus('loading');
    setMsg('');
    setTicketId('');
    setDealId('');
    setTaskId('');

    try {
      const language = (navigator.language || '').slice(0, 5);
      // Crear ticket conectado a conversación (soporte + CRM). El backend garantiza lead + conversación.
      const channel = email.trim() ? 'email' : 'whatsapp';
      const summary = [
        'Contacto web',
        topic.trim() || undefined,
        name.trim() || undefined,
      ]
        .filter(Boolean)
        .join(' — ');

      // Captura UTM (si existe en localStorage) y setea cookie kce_utm para analítica.
      const hasUtmCookie = Boolean(getCookie('kce_utm'));
      const utm = readUtm();
      if (!hasUtmCookie && utm) {
        void fetch('/api/events/utm-capture', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ path: `${location.pathname}${location.search}`, ...utm }),
        }).catch(() => {});
      }

      const res = await fetch('/api/bot/create-ticket', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          channel,
          locale: (language || 'es').slice(0, 2),
          consent: true,
          lead: {
            email: email.trim() || undefined,
            whatsapp: normalizePhoneLite(whatsapp) || undefined,
            source: source.trim() || 'contact_page',
          },
          topic: topic.trim().toLowerCase().includes('plan')
            ? 'plan'
            : topic.trim().toLowerCase().includes('tour')
              ? 'tour'
              : topic.trim().toLowerCase().includes('catálogo')
                ? 'catalog'
                : topic.trim().toLowerCase().includes('reserva')
                  ? 'booking'
                  : 'chat',
          salesContext: salesContext
            ? {
                city: salesContext.city || undefined,
                tour: salesContext.tour || undefined,
                slug: salesContext.slug || undefined,
                budget: salesContext.budget || undefined,
                pace: salesContext.pace || undefined,
                pax: salesContext.pax ? Number.parseInt(salesContext.pax, 10) || undefined : undefined,
                interests: salesContext.interests?.length ? salesContext.interests : undefined,
                start: salesContext.start || undefined,
                end: salesContext.end || undefined,
                query: salesContext.query || undefined,
              }
            : undefined,
          summary,
          priority: 'normal',
          lastUserMessage: message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error('request_failed');

      const nextTicketId = String(data.ticketId || '');
      const nextDealId = String(data.dealId || '');
      const nextTaskId = String(data.taskId || '');
      setStatus('ok');
      setTicketId(nextTicketId);
      setDealId(nextDealId);
      setTaskId(nextTaskId);
      setMsg(nextDealId
        ? 'Listo. Recibimos tu mensaje y ya quedó en continuidad comercial para seguimiento.'
        : 'Listo. Recibimos tu mensaje. Te responderemos lo antes posible.');

      setName(initialName);
      setEmail(initialEmail);
      setWhatsapp(initialWhatsapp);
      setMessage(initialMessage);
      setConsent(true);
    } catch {
      setStatus('error');
      setMsg('No se pudo enviar por un problema temporal. Intenta de nuevo en un minuto.');
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 space-y-4"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label
            htmlFor="contactName"
            className="text-sm font-semibold"
          >
            Nombre (opcional)
          </label>
          <input
            id="contactName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className="mt-1 w-full"
          />
        </div>
        <div>
          <label
            htmlFor="contactEmail"
            className="text-sm font-semibold"
          >
            Email
          </label>
          <input
            id="contactEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="mt-1 w-full"
          />
        </div>
        <div className="md:col-span-2">
          <label
            htmlFor="contactWhatsapp"
            className="text-sm font-semibold"
          >
            WhatsApp
          </label>
          <input
            id="contactWhatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+57 3xx xxx xxxx"
            className="mt-1 w-full"
          />
          <p className="text-[color:var(--color-text)]/70 mt-1 text-xs">
            Deja email o WhatsApp (al menos uno). Si pones ambos, mejor.
          </p>
        </div>
      </div>

      <div>
        <label
          htmlFor="contactMessage"
          className="text-sm font-semibold"
        >
          Mensaje
        </label>
        <textarea
          id="contactMessage"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Cuéntanos tu plan (ciudad, fechas, número de personas) o tu problema con la cuenta."
          className="mt-1 min-h-[140px] w-full"
          required
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
        />
        <span className="text-[color:var(--color-text)]/80">
          Acepto que KCE me contacte para responder mi solicitud (y entiendo la política de
          privacidad).
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={status === 'loading' || !canSubmit}
          isLoading={status === 'loading'}
        >
          Enviar
        </Button>

        {ticketId ? (
          <span className="text-[color:var(--color-text)]/70 text-xs">Ticket: {ticketId}</span>
        ) : null}
        {dealId ? (
          <span className="text-[color:var(--color-text)]/70 text-xs">Deal: {dealId}</span>
        ) : null}
        {taskId ? (
          <span className="text-[color:var(--color-text)]/70 text-xs">Task: {taskId}</span>
        ) : null}
      </div>

      {msg ? (
        <div className="space-y-3">
          <p
            className={`text-sm ${status === 'error' ? 'text-red-600 dark:text-red-200' : 'text-[color:var(--color-text)]/80'}`}
          >
            {msg}
          </p>

          {status === 'ok' ? (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-4">
                {[
                  ['Ticket', ticketId || 'pendiente', 'Caso base para continuidad.'],
                  ['Deal', dealId || 'no abierto', 'Oportunidad comercial cuando aplica.'],
                  ['Task', taskId || 'pendiente', 'Siguiente seguimiento dentro del CRM.'],
                  ['Ventana objetivo', responseLane, 'Prioridad sugerida para responder.'],
                ].map(([title, value, copy]) => (
                  <div key={String(title)} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/50">{title}</div>
                    <div className="mt-1 text-sm font-semibold text-[color:var(--color-text)]">{value}</div>
                    <div className="mt-1 text-[11px] leading-5 text-[color:var(--color-text)]/68">{copy}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-brand-blue/15 bg-brand-blue/5 px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/50">Siguiente mejor paso</div>
                <div className="mt-1 text-sm font-semibold text-[color:var(--color-text)]">{nextStepLabel}</div>
                <div className="mt-1 text-[11px] leading-5 text-[color:var(--color-text)]/68">KCE ya conserva el contexto del caso para que no tengas que reiniciar la conversación.</div>
                {contextSummary.length ? (
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {contextSummary.map((row) => (
                      <div key={row} className="rounded-xl border border-brand-blue/10 bg-white/70 px-3 py-2 text-[11px] leading-5 text-[color:var(--color-text)] dark:bg-black/20">
                        {row}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ['1. Caso recibido', 'Ticket base abierto para no perder el hilo.'],
                  ['2. Continuidad', dealId ? 'El caso ya puede entrar en seguimiento comercial.' : 'El caso queda listo para respuesta y clasificación.'],
                  ['3. Respuesta', `Ventana sugerida: ${responseLane}.`],
                ].map(([title, copy]) => (
                  <div key={title} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/48">{title}</div>
                    <div className="mt-1 text-[11px] leading-5 text-[color:var(--color-text)]/70">{copy}</div>
                  </div>
                ))}
              </div>

              {continueLinks.length ? (
                <div className="grid gap-3 md:grid-cols-3">
                  {continueLinks.map((link) => (
                    <a
                      key={link.href + link.label}
                      href={link.href}
                      className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 transition hover:bg-[color:var(--color-surface)]"
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/48">Continuar desde aquí</div>
                      <div className="mt-1 text-sm font-semibold text-[color:var(--color-text)]">{link.label}</div>
                      <div className="mt-1 text-[11px] leading-5 text-[color:var(--color-text)]/70">{link.copy}</div>
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
