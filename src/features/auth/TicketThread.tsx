/* src/features/auth/TicketThread.tsx */
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';

function detectLocalePrefix(pathname: string) {
  const seg = pathname.split('/').filter(Boolean)[0] || '';
  if (/^(es|en|de|fr)$/i.test(seg)) return `/${seg.toLowerCase()}`;
  return '';
}

type Ticket = {
  id: string;
  summary: string | null;
  status: string | null;
  priority: string | null;
  created_at: string | null;
  last_message_at: string | null;
};

type Msg = {
  id: string;
  role: string;
  content: string;
  created_at: string | null;
};

type Props = {
  ticketId: string;
};

function fmt(ts?: string | null) {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function TicketThread({ ticketId }: Props) {
  const pathname = usePathname() || '/';
  const localePrefix = detectLocalePrefix(pathname);
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [ticket, setTicket] = React.useState<Ticket | null>(null);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [text, setText] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [err, setErr] = React.useState<string>('');

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const sb = supabaseBrowser();
      if (!sb) throw new Error('Auth no configurado');

      const sess = await sb.auth.getSession();
      const token = sess.data.session?.access_token;
      if (!token) throw new Error('Inicia sesión para ver tu ticket.');

      const res = await fetch(`/api/account/tickets/${encodeURIComponent(ticketId)}`, {
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || json?.error || 'No pudimos cargar el ticket.');

      setTicket((json?.ticket as Ticket) || null);
      setMessages(Array.isArray(json?.messages) ? (json.messages as Msg[]) : []);
    } catch (e: any) {
      setErr(e?.message || 'No pudimos cargar el ticket.');
    } finally {
      setLoading(false);
    }
  }

  async function sendReply() {
    if (!text.trim()) return;
    setSending(true);
    setErr('');
    try {
      const sb = supabaseBrowser();
      if (!sb) throw new Error('Auth no configurado');

      const sess = await sb.auth.getSession();
      const token = sess.data.session?.access_token;
      if (!token) throw new Error('Inicia sesión para responder.');

      const res = await fetch(`/api/account/tickets/${encodeURIComponent(ticketId)}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text.trim() }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || json?.error || 'No pudimos enviar el mensaje.');

      setText('');
      await load();
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || 'No pudimos enviar el mensaje.');
    } finally {
      setSending(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, [ticketId]);

  const contactHref = `${localePrefix}/contact?source=ticket-thread&ticket=${encodeURIComponent(ticketId)}`;
  const replyTemplates = [
    { label: 'Siguiente paso', value: 'Necesito confirmar el siguiente paso exacto de este caso.' },
    { label: 'Dato nuevo', value: 'Comparto un dato nuevo para que sigamos en este mismo hilo.' },
    { label: 'Booking / invoice', value: 'Necesito apoyo sobre booking, invoice o logística sin abrir otro canal.' },
  ];

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue/72">support thread</div>
          <h2 className="mt-2 font-heading text-2xl text-brand-blue">Este ticket ya debería sentirse como continuidad real</h2>
          <p className="text-[color:var(--color-text)]/75 mt-2 text-sm leading-6">
            Mantén en un solo hilo las respuestas, el estado del caso y el siguiente paso. Así KCE puede seguir con contexto sin abrir conversaciones paralelas.
          </p>
          <p className="text-[color:var(--color-text)]/62 mt-2 text-xs">
            ID: <span className="font-mono">{ticketId}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`${localePrefix}/account/support`}>Volver</Link>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
            Actualizar
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-brand-blue/12 bg-brand-blue/5 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue">continuidad del caso</div>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/74">
            Si este caso toca reserva, pago, invoice o punto de encuentro, conserva el ticket y vuelve a reservas antes de abrir otro canal.
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/52">atajos útiles</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm"><Link href={`${localePrefix}/account/bookings`}>Mis reservas</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href={contactHref}>Contacto</Link></Button>
          </div>
        </div>
      </div>

      {err ? (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-200">
          {err}
        </div>
      ) : null}

      {loading ? (
        <p className="text-[color:var(--color-text)]/70 mt-4 text-sm">Cargando…</p>
      ) : ticket ? (
        <div className="mt-5 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-[color:var(--color-text)]">{ticket.summary || 'Soporte KCE'}</div>
            <div className="flex items-center gap-2">
              <span className="text-[color:var(--color-text)]/70 rounded-full bg-black/5 px-2 py-1 text-[11px] font-semibold">{ticket.status || 'open'}</span>
              {ticket.priority ? <span className="text-[color:var(--color-text)]/70 rounded-full bg-black/5 px-2 py-1 text-[11px] font-semibold">{ticket.priority}</span> : null}
            </div>
          </div>
          <div className="text-[color:var(--color-text)]/60 mt-2 text-xs">
            Creado: {fmt(ticket.created_at)}
            {ticket.last_message_at ? ` · Última actividad: ${fmt(ticket.last_message_at)}` : ''}
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-[color:var(--color-text)]">Conversación</h3>
        <div className="mt-3 grid gap-3">
          {messages.length === 0 ? (
            <p className="text-[color:var(--color-text)]/70 text-sm">Aún no hay mensajes.</p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={m.role === 'user' ? 'rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4' : 'rounded-2xl border border-[color:var(--color-border)] bg-black/5 p-4 dark:bg-[color:var(--color-surface-2)]'}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[color:var(--color-text)]/70 text-xs font-semibold">{m.role === 'user' ? 'Tú' : m.role === 'agent' ? 'Agente' : 'KCE'}</div>
                  <div className="text-[color:var(--color-text)]/60 text-xs">{fmt(m.created_at)}</div>
                </div>
                <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm text-[color:var(--color-text)]">{m.content}</pre>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="reply" className="text-[color:var(--color-text)]/70 text-sm">Responder</label>
          <div className="flex flex-wrap gap-2">
            {replyTemplates.map((template) => (
              <button
                key={template.label}
                type="button"
                onClick={() => setText(template.value)}
                className="rounded-full border border-brand-blue/12 bg-brand-blue/5 px-3 py-1 text-[11px] font-semibold text-brand-blue transition hover:bg-brand-blue/10"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>
        <textarea
          id="reply"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe tu mensaje…"
          className="mt-2 min-h-[110px] w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="button" variant="primary" disabled={sending || text.trim().length < 2} onClick={() => void sendReply()}>
            {sending ? 'Enviando…' : 'Enviar'}
          </Button>
          <p className="text-[color:var(--color-text)]/60 text-xs">Mantén un solo hilo por caso para que el equipo responda con más contexto y menos fricción.</p>
        </div>
      </div>
    </div>
  );
}
