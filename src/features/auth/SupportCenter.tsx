/* src/features/auth/SupportCenter.tsx */
'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';

function detectLocalePrefix(pathname: string) {
  const seg = pathname.split('/').filter(Boolean)[0] || '';
  if (/^(es|en|de|fr)$/i.test(seg)) return `/${seg.toLowerCase()}`;
  return '';
}

function pickFirst(value: string | null) {
  return String(value || '').trim();
}

type TicketItem = {
  id: string;
  summary: string | null;
  status: string | null;
  priority: string | null;
  last_message_at: string | null;
  created_at: string | null;
};

export default function SupportCenter() {
  const pathname = usePathname() || '/';
  const localePrefix = detectLocalePrefix(pathname);
  const router = useRouter();
  const search = useSearchParams();

  const [loading, setLoading] = React.useState(true);
  const [tickets, setTickets] = React.useState<TicketItem[]>([]);
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [bookingId, setBookingId] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [msg, setMsg] = React.useState<string>('');

  const source = pickFirst(search.get('source'));
  const inboundTicket = pickFirst(search.get('ticket'));
  const inboundSummary = pickFirst(search.get('summary'));
  const inboundContext = pickFirst(search.get('context'));
  const inboundConversation = pickFirst(search.get('conversation'));

  React.useEffect(() => {
    const bid = pickFirst(search.get('bookingId'));
    const nextSubject = pickFirst(search.get('subject'));
    const nextMessage = pickFirst(search.get('message'));

    if (bid) setBookingId(bid);
    if (nextSubject) setSubject(nextSubject);
    if (nextMessage) setMessage(nextMessage);
  }, [search]);

  const starterTemplates = React.useMemo(() => ([
    {
      label: 'Reserva / fecha',
      subject: 'Ayuda con mi reserva',
      message: bookingId
        ? `Necesito ayuda con la reserva ${bookingId}. Quiero confirmar la fecha, el punto de encuentro o el siguiente paso.`
        : 'Necesito ayuda con mi reserva. Quiero confirmar la fecha, el punto de encuentro o el siguiente paso.',
    },
    {
      label: 'Factura / pago',
      subject: 'Ayuda con factura o pago',
      message: bookingId
        ? `Necesito revisar la factura o el pago asociado a la reserva ${bookingId}.`
        : 'Necesito revisar una factura o un pago y quiero conservar el contexto correcto.',
    },
    {
      label: 'Cuenta / login',
      subject: 'Problema de acceso',
      message: 'No puedo entrar bien a mi cuenta o recuperar el booking desde la sesión actual.',
    },
    {
      label: 'Logística / soporte',
      subject: 'Duda logística antes del tour',
      message: bookingId
        ? `Tengo una duda logística sobre la reserva ${bookingId}: horarios, punto de encuentro o preparación.`
        : 'Tengo una duda logística antes del tour y quiero dejarla en un solo hilo.',
    },
  ]), [bookingId]);

  async function load() {
    setLoading(true);
    setMsg('');
    try {
      const sb = supabaseBrowser();
      if (!sb) {
        setTickets([]);
        return;
      }

      const sess = await sb.auth.getSession();
      const token = sess.data.session?.access_token;
      if (!token) {
        setTickets([]);
        return;
      }

      const res = await fetch('/api/account/tickets', {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || json?.error || 'No pudimos cargar tus tickets.');
      }

      setTickets(Array.isArray(json?.items) ? (json.items as TicketItem[]) : []);
    } catch (err: any) {
      console.error('[SupportCenter] load error:', err);
      setMsg(err?.message || 'No pudimos cargar tus tickets.');
    } finally {
      setLoading(false);
    }
  }

  async function createTicket() {
    setMsg('');
    setSending(true);
    try {
      const sb = supabaseBrowser();
      if (!sb) throw new Error('Auth no configurado');

      const sess = await sb.auth.getSession();
      const token = sess.data.session?.access_token;
      if (!token) throw new Error('Inicia sesión para crear un ticket.');

      const body = {
        bookingId: bookingId?.trim() || undefined,
        subject: subject.trim() || undefined,
        message: message.trim(),
      };

      const res = await fetch('/api/account/tickets', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || json?.error || 'No pudimos crear el ticket.');
      }

      setSubject('');
      setMessage('');
      setMsg('✅ Ticket creado.');
      await load();

      if (json?.ticketId) {
        router.push(`${localePrefix}/account/support/${json.ticketId}`);
      }
    } catch (err: any) {
      console.error('[SupportCenter] create error:', err);
      setMsg(err?.message || 'No pudimos crear el ticket.');
    } finally {
      setSending(false);
    }
  }

  React.useEffect(() => {
    void load();

    const sb = supabaseBrowser();
    if (!sb) return;
    const { data } = sb.auth.onAuthStateChange(() => {
      void load();
    });
    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginHref = `${localePrefix}/login?next=${encodeURIComponent(`${localePrefix}/account/support`)}`;
  const premiumContactHref = `${localePrefix}/contact?source=account-support${bookingId ? `&bookingId=${encodeURIComponent(bookingId)}` : ''}${inboundTicket ? `&ticket=${encodeURIComponent(inboundTicket)}` : ''}${inboundConversation ? `&conversation=${encodeURIComponent(inboundConversation)}` : ''}${subject.trim() ? `&message=${encodeURIComponent(subject.trim())}` : ''}`;
  const contextRows = [
    bookingId ? ['Booking ID', bookingId] : null,
    inboundTicket ? ['Ticket previo', inboundTicket] : null,
    inboundConversation ? ['Conversación', inboundConversation] : null,
    source ? ['Origen', source] : null,
    subject.trim() ? ['Asunto', subject.trim()] : null,
    inboundSummary ? ['Resumen', inboundSummary] : null,
    inboundContext ? ['Contexto', inboundContext] : null,
  ].filter(Boolean) as Array<[string, string]>;

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl text-brand-blue">Centro de soporte</h2>
          <p className="text-[color:var(--color-text)]/75 mt-2 text-sm">
            Crea un ticket, conserva el contexto del booking y haz seguimiento en un solo hilo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
            Actualizar
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`${localePrefix}/account`}>Volver a cuenta</Link>
          </Button>
        </div>
      </div>

      {contextRows.length ? (
        <div className="mt-4 rounded-2xl border border-brand-blue/12 bg-brand-blue/5 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue">contexto importado</div>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/74">
            Llegaste con señales previas del caso. Puedes revisar, ajustar o enviar este ticket sin empezar desde cero.
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {contextRows.map(([label, value]) => (
              <div key={`${label}-${value.slice(0, 24)}`} className="rounded-2xl border border-brand-blue/10 bg-white/70 px-3 py-2 text-sm text-[color:var(--color-text)] shadow-soft dark:bg-black/10">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/45">{label}</div>
                <div className="mt-1 break-words text-[13px] leading-5">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href={`${localePrefix}/account/bookings`} className="font-medium text-brand-blue underline underline-offset-4">Volver a mis reservas</Link>
            <Link href={premiumContactHref} className="font-medium text-brand-blue underline underline-offset-4">Abrir contacto premium</Link>
          </div>
        </div>
      ) : null}

      {msg ? (
        <div className="mt-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3 text-sm">
          {msg}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-brand-blue/10 bg-brand-blue/5 p-4 text-sm leading-6 text-[color:var(--color-text)]/74">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-blue">production-readiness support rule</div>
        <p className="mt-2">Mantén un solo hilo por caso principal, conserva bookingId, ticket o conversación cuando existan y usa contacto premium solo cuando realmente necesites escalar el caso o proteger una reserva sensible en producción.</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href={premiumContactHref} className="font-medium text-brand-blue underline underline-offset-4">Escalar este contexto a contacto premium</Link>
          <Link href={`${localePrefix}/account/bookings`} className="font-medium text-brand-blue underline underline-offset-4">Volver a reservas antes de abrir otro canal</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5 lg:col-span-2">
          <div className="text-[color:var(--color-text)]/70 text-sm">Nuevo ticket</div>
          <div className="mt-1 text-base font-semibold text-[color:var(--color-text)]">Cuéntanos qué pasó</div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ticketSubject" className="text-[color:var(--color-text)]/70 text-sm">Asunto (opcional)</label>
              <input
                id="ticketSubject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej: Problema con reserva / factura / login"
                className="mt-2 w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ticketBookingId" className="text-[color:var(--color-text)]/70 text-sm">Booking ID (opcional)</label>
              <input
                id="ticketBookingId"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="UUID de tu reserva"
                className="mt-2 w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm"
              />
              <p className="text-[color:var(--color-text)]/60 mt-1 text-xs">Si vienes desde reservas, booking o chat, intentamos rellenarlo automáticamente.</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="ticketMessage" className="text-[color:var(--color-text)]/70 text-sm">Mensaje</label>
              <div className="flex flex-wrap gap-2">
                {starterTemplates.map((template) => (
                  <button
                    key={template.label}
                    type="button"
                    onClick={() => {
                      setSubject((prev) => prev || template.subject);
                      setMessage(template.message);
                    }}
                    className="rounded-full border border-brand-blue/12 bg-brand-blue/5 px-3 py-1 text-[11px] font-semibold text-brand-blue transition hover:bg-brand-blue/10"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              id="ticketMessage"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe el problema. Si es de pago: fecha, monto, y qué esperabas que pasara."
              className="mt-2 min-h-[140px] w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" variant="primary" disabled={sending || message.trim().length < 10} onClick={() => void createTicket()}>
              {sending ? 'Enviando…' : 'Crear ticket'}
            </Button>
            <Button asChild variant="outline">
              <Link href={loginHref}>Cambiar de cuenta</Link>
            </Button>
            <p className="text-[color:var(--color-text)]/60 text-xs">Recomendación: usa el mismo correo de tus reservas.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
          <div className="text-[color:var(--color-text)]/70 text-sm">Tus tickets</div>
          <div className="mt-1 text-base font-semibold text-[color:var(--color-text)]">Historial</div>

          <div className="mt-4 rounded-2xl border border-brand-blue/10 bg-white/70 p-4 text-sm leading-6 text-[color:var(--color-text)]/72 shadow-soft dark:bg-black/10">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-blue">qué ayuda a resolver más rápido</div>
            <ul className="mt-3 space-y-2">
              <li>• Mantén un solo ticket por caso principal.</li>
              <li>• Si vienes desde booking, conserva el bookingId en el asunto o mensaje.</li>
              <li>• Si ya hablaste por chat, trae el resumen en lugar de empezar otra historia.</li>
            </ul>
          </div>

          {loading ? (
            <p className="text-[color:var(--color-text)]/70 mt-3 text-sm">Cargando…</p>
          ) : tickets.length === 0 ? (
            <p className="text-[color:var(--color-text)]/70 mt-3 text-sm">Aún no tienes tickets. Cuando crees el primero, aparecerá aquí.</p>
          ) : (
            <div className="mt-4 grid gap-2">
              {tickets.slice(0, 8).map((t) => (
                <Link
                  key={t.id}
                  href={`${localePrefix}/account/support/${t.id}`}
                  className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 hover:bg-black/5 dark:hover:bg-[color:var(--color-surface-2)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="line-clamp-2 text-sm font-semibold text-[color:var(--color-text)]">{t.summary || 'Ticket'}</div>
                    <span className="text-[color:var(--color-text)]/70 rounded-full bg-black/5 px-2 py-1 text-[11px] font-semibold">{t.status || 'open'}</span>
                  </div>
                  <div className="text-[color:var(--color-text)]/60 mt-2 break-all text-xs">{t.id}</div>
                </Link>
              ))}
            </div>
          )}

          <p className="text-[color:var(--color-text)]/60 mt-4 text-xs">El objetivo final es que booking, soporte, contacto y CRM compartan la misma continuidad sin ruido adicional.</p>
        </div>
      </div>
    </div>
  );
}
