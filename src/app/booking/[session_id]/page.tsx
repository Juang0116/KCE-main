// src/app/booking/[session_id]/page.tsx
import 'server-only';
import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import BookingActionBar from '@/features/bookings/components/BookingActionBar';
import BookingProgressRail from '@/features/bookings/components/BookingProgressRail';
import BookingTrustStrip from '@/features/bookings/components/BookingTrustStrip';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';
import LaunchTrustRail from '@/features/marketing/LaunchTrustRail';
import { formatCurrencyEUR, formatDuration } from '@/utils/format';
import {
  ArrowRight,
  CalendarPlus2,
  Download,
  MessageCircleMore,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

type BookingPayload = {
  ok: boolean;
  requestId?: string;
  error?: string;
  booking?: {
    id: string;
    session_id: string;
    status?: string | null;

    tour_id?: string | null;
    tour_slug?: string | null;
    tour_title?: string | null;
    tour_city?: string | null;
    tour_image?: string | null;
    duration_hours?: number | null;

    amount_total?: number | null;
    currency?: string | null;

    customer_name?: string | null;
    customer_email?: string | null;

    created_at?: string | null;
  };
};

async function resolveLocale(): Promise<SupportedLocale> {
  const c = await cookies();
  const v = (c.get('kce.locale')?.value || '').toLowerCase();
  return v === 'en' || v === 'fr' || v === 'de' ? v : 'es';
}

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

function safeStr(v: string | null | undefined): string {
  return (v ?? '').trim();
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function fetchBooking(sessionId: string, token: string | null): Promise<BookingPayload> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const url = new URL(`/api/booking/${encodeURIComponent(sessionId)}`, base);
  if (token) url.searchParams.set('t', token);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) return { ok: false, error: `Failed to load booking (${res.status})` };
  return (await res.json()) as BookingPayload;
}

function absoluteBookingUrl(sessionId: string, token: string | null) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const u = new URL(`/booking/${encodeURIComponent(sessionId)}`, base);
  if (token) u.searchParams.set('t', token);
  return u.toString();
}

export default async function BookingSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ session_id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await resolveLocale();
  const { session_id } = await params;

  const sp = (await Promise.resolve(searchParams ?? {})) as Record<
    string,
    string | string[] | undefined
  >;

  const token: string | null =
    typeof sp.t === 'string' ? sp.t : Array.isArray(sp.t) ? (sp.t[0] ?? null) : null;

  const id = safeStr(session_id);
  if (!id) redirect(withLocale(locale, '/'));

  const payload = await fetchBooking(id, token);
  const booking = payload.booking;

  if (!payload.ok || !booking) {
    return (
      <main className="mx-auto max-w-[var(--container-max)] px-4 py-10">
        <div className="overflow-hidden rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] shadow-soft">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 md:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-brand-blue">
                <ShieldCheck className="size-4" aria-hidden="true" />
                booking access
              </div>
              <h1 className="mt-5 font-heading text-3xl text-brand-blue md:text-4xl">No pudimos cargar tu compra</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--color-text)]/72">
                {payload.error || 'Intenta recargar. Si el problema continúa, entra por soporte y retomamos tu caso con el contexto correcto.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={withLocale(locale, '/tours')}>Explorar tours</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={withLocale(locale, '/?chat=1')}>Hablar con el Travel Planner</Link>
                </Button>
              </div>
            </div>
            <div className="border-t border-brand-blue/10 bg-brand-blue p-8 text-white lg:border-l lg:border-t-0 md:p-10">
              <p className="text-xs uppercase tracking-[0.18em] text-white/65">support fallback</p>
              <div className="mt-4 rounded-2xl bg-white/10 p-4">
                <p className="font-heading text-lg">Ayuda rápida</p>
                <p className="mt-2 text-sm text-white/78">Si el booking no carga, el equipo puede reconstruir el contexto desde pago, email o sesión.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const title = safeStr(booking.tour_title) || 'Tu experiencia en KCE';
  const slug = safeStr(booking.tour_slug);
  const tourHref = slug ? withLocale(locale, `/tours/${slug}`) : withLocale(locale, '/tours');

  const img = safeStr(booking.tour_image) || '/images/hero-kce.jpg';
  const city = safeStr(booking.tour_city) || 'Colombia';
  const created = fmtDate(booking.created_at);
  const amount = typeof booking.amount_total === 'number' ? booking.amount_total : null;

  const invoiceUrlBase = `/api/invoice/${encodeURIComponent(id)}`;
  const invoiceUrl = token ? `${invoiceUrlBase}?t=${encodeURIComponent(token)}` : invoiceUrlBase;

  const calendarUrlBase = `/api/calendar/${encodeURIComponent(id)}`;
  const calendarUrl = token ? `${calendarUrlBase}?t=${encodeURIComponent(token)}` : calendarUrlBase;

  const bookingUrl = absoluteBookingUrl(id, token);

  const withExtraQuery = (baseUrl: string, qs: string) =>
    `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${qs}`;

  const statusLabel = safeStr(booking.status) || 'paid';
  const statusTone =
    statusLabel === 'paid' || statusLabel === 'succeeded'
      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
      : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300';

  return (
    <main className="mx-auto max-w-[var(--container-max)] space-y-8 px-4 py-10">
      <section className="overflow-hidden rounded-[2rem] border border-brand-blue/12 bg-[color:var(--color-surface)] shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-8 md:p-10">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.22em] ${statusTone}`}>
              <ShieldCheck className="size-4" aria-hidden="true" />
              compra confirmada
            </div>
            <h1 className="mt-5 font-heading text-3xl text-brand-blue md:text-5xl">Tu reserva ya está lista</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--color-text)]/72 md:text-base">
              Aquí queda centralizada tu experiencia: resumen de compra, factura, acceso a calendario y soporte con contexto real. La idea es que no tengas que volver a buscar nada.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">experiencia</p>
                <p className="mt-2 font-heading text-base text-brand-blue">{title}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">ubicación</p>
                <p className="mt-2 font-heading text-base text-brand-blue">{city}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">duración</p>
                <p className="mt-2 font-heading text-base text-brand-blue">
                  {typeof booking.duration_hours === 'number' ? formatDuration(booking.duration_hours) : '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">total</p>
                <p className="mt-2 font-heading text-base text-brand-blue">{amount != null ? formatCurrencyEUR(amount) : '—'}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}>
                <Link href={tourHref}>Ver detalles del tour</Link>
              </Button>
              <Button asChild variant="outline" size="lg" leftIcon={<ReceiptText className="size-4" aria-hidden="true" />}>
                <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                  Ver factura
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" leftIcon={<CalendarPlus2 className="size-4" aria-hidden="true" />}>
                <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                  Añadir al calendario
                </a>
              </Button>
            </div>
          </div>

          <div className="border-t border-brand-blue/10 bg-brand-blue p-8 text-white lg:border-l lg:border-t-0 md:p-10">
            <div className="flex items-center gap-3">
              <Image
                src={img}
                alt={title}
                width={72}
                height={72}
                className="size-16 rounded-2xl border border-white/10 object-cover"
                priority
              />
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/65">booking suite</p>
                <p className="font-heading text-2xl text-white">Centro post-compra</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="font-heading text-lg">Acciones listas</p>
                <p className="mt-1 text-sm text-white/78">Descargar, calendarizar y pedir ayuda sin salirte del contexto de la compra.</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="font-heading text-lg">Contexto claro</p>
                <p className="mt-1 text-sm text-white/78">Session, datos del cliente y enlace seguro reunidos en una sola vista.</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 text-sm text-white/78">
                <p className="text-xs uppercase tracking-[0.18em] text-white/65">creado</p>
                <p className="mt-2 font-medium text-white">{created || '—'}</p>
                {safeStr(booking.customer_email) ? <p className="mt-1 text-white/72">{safeStr(booking.customer_email)}</p> : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <BookingProgressRail
        current={2}
        steps={[
          { id: 'paid', label: 'Pagado', detail: 'La compra quedó registrada.' },
          { id: 'manage', label: 'Gestionar', detail: 'Factura, calendario y soporte disponibles.' },
          { id: 'prepare', label: 'Prepararte', detail: 'Usa esta vista como centro operativo de tu experiencia.' },
        ]}
      />

      <BookingTrustStrip />


      <div className="mt-8">
        <LaunchCommandActionDeck
          eyebrow="post-purchase command"
          title="Después de pagar, el viajero debería ver cuatro salidas claras y no un callejón sin contexto"
          description="Booking, soporte, cuenta y siguientes experiencias ya están listos como una sola ruta de continuidad para el release final."
          actions={[
            { href: token ? withExtraQuery(withLocale(locale, '/account/support'), `source=booking-postpurchase&bookingId=${encodeURIComponent(id)}&subject=${encodeURIComponent('Ayuda con mi reserva')}`) : withLocale(locale, `/account/support?source=booking-postpurchase&bookingId=${encodeURIComponent(id)}&subject=${encodeURIComponent('Ayuda con mi reserva')}`), label: 'Abrir soporte', detail: 'Escala un caso con bookingId ya adjunto.', tone: 'primary' },
            { href: withExtraQuery(withLocale(locale, '/contact'), `source=booking-postpurchase&bookingId=${encodeURIComponent(id)}&subject=${encodeURIComponent('Seguimiento de reserva')}`), label: 'Contacto premium', detail: 'Pasa el caso al equipo con continuidad comercial y operativa.' },
            { href: withLocale(locale, '/account/bookings'), label: 'Mi cuenta y reservas', detail: 'Recupera invoice, calendario y más compras desde tu cuenta.' },
            { href: withLocale(locale, '/tours'), label: 'Explorar más tours', detail: 'Extiende el viaje desde el catálogo cuando ya esté todo claro.' },
          ]}
        />
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          {
            title: 'Factura y calendario',
            copy: 'Abre la invoice, descarga el PDF y guarda la experiencia en tu calendario desde la misma base.',
          },
          {
            title: 'Soporte con contexto',
            copy: 'Si necesitas ayuda, el equipo puede retomar tu caso con la reserva correcta y sin empezar de cero.',
          },
          {
            title: 'Siguiente mejor paso',
            copy: 'Vuelve al catálogo o pide un plan más amplio si quieres extender tu viaje.',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-[1.7rem] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
            <p className="font-heading text-lg text-brand-blue">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">{item.copy}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] shadow-soft">
            <div className="relative aspect-[16/7] w-full bg-[color:var(--color-surface-2)]">
              <Image src={img} alt={title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 66vw" priority />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/72">experiencia reservada</p>
                  <p className="truncate font-heading text-xl text-white md:text-2xl">{title}</p>
                  <p className="mt-1 text-sm text-white/78">{city}</p>
                </div>
                <Button asChild className="shrink-0">
                  <Link href={tourHref}>Ver tour</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">acciones principales</p>
                <h2 className="mt-2 font-heading text-2xl text-brand-blue">Acciones principales</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-brand-blue">
                acceso seguro
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[color:var(--color-text)]/72">
              Guarda tu factura, añade el plan a tu calendario y entra a soporte desde una misma base. La idea es que el post-checkout se sienta tan claro y confiable como el tour.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Button asChild size="lg" className="w-full justify-center" leftIcon={<Download className="size-4" aria-hidden="true" />}>
                <a href={withExtraQuery(invoiceUrl, 'download=1')} target="_blank" rel="noopener noreferrer">
                  Descargar factura
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full justify-center" leftIcon={<ReceiptText className="size-4" aria-hidden="true" />}>
                <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                  Ver factura
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full justify-center" leftIcon={<CalendarPlus2 className="size-4" aria-hidden="true" />}>
                <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                  Calendario
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full justify-center" leftIcon={<MessageCircleMore className="size-4" aria-hidden="true" />}>
                <Link href={withLocale(locale, '/?chat=1')}>Soporte por chat</Link>
              </Button>
            </div>

            <div className="mt-6">
              <BookingActionBar
                bookingUrl={bookingUrl}
                supportContext={{
                  sessionId: id,
                  tourTitle: booking.tour_title ?? null,
                  customerEmail: booking.customer_email ?? null,
                }}
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">next steps</p>
                <h2 className="mt-2 font-heading text-2xl text-brand-blue">Qué sigue después de comprar</h2>
              </div>
              <Sparkles className="size-5 text-brand-blue/55" aria-hidden="true" />
            </div>
            <ol className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  n: 1,
                  t: 'Guarda tus accesos',
                  d: 'Conserva este booking y el PDF de la factura para tener todo centralizado.',
                },
                {
                  n: 2,
                  t: 'Confirma dudas ahora',
                  d: 'Ajusta nombres, logística o preguntas antes del día de salida.',
                },
                {
                  n: 3,
                  t: 'Amplía tu plan',
                  d: 'Explora más experiencias si quieres cerrar un itinerario más completo.',
                },
              ].map((x) => (
                <li key={x.n} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-blue/10 text-sm font-semibold text-brand-blue">
                    {x.n}
                  </span>
                  <p className="mt-4 font-heading text-lg text-brand-blue">{x.t}</p>
                  <p className="mt-2 text-sm text-[color:var(--color-text)]/72">{x.d}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8">
            <h2 className="font-heading text-2xl text-brand-blue">Datos del cliente</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">nombre</p>
                <p className="mt-2 font-medium text-[color:var(--color-text)]">{safeStr(booking.customer_name) || '—'}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">email</p>
                <p className="mt-2 font-medium text-[color:var(--color-text)]">{safeStr(booking.customer_email) || '—'}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">creado</p>
                <p className="mt-2 font-medium text-[color:var(--color-text)]">{created || '—'}</p>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[2rem] border border-brand-blue/10 bg-brand-blue p-6 text-white shadow-soft">
            <p className="text-xs uppercase tracking-[0.18em] text-white/65">resumen de compra</p>
            <h2 className="mt-2 font-heading text-2xl text-white">Resumen de compra</h2>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <span className="text-white/72">Experiencia</span>
                <span className="max-w-[58%] truncate font-medium text-white">{title}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <span className="text-white/72">Ubicación</span>
                <span className="font-medium text-white">{city}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <span className="text-white/72">Duración</span>
                <span className="font-medium text-white">
                  {typeof booking.duration_hours === 'number' ? formatDuration(booking.duration_hours) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <span className="text-white/72">Total</span>
                <span className="font-heading text-white">{amount != null ? formatCurrencyEUR(amount) : '—'}</span>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              <Button asChild className="w-full bg-white text-brand-blue hover:shadow-pop">
                <a href={withExtraQuery(invoiceUrl, 'download=1')} target="_blank" rel="noopener noreferrer">
                  Descargar factura
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10">
                <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                  Añadir al calendario
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10">
                <Link href={withLocale(locale, '/account/bookings')}>Ir a mi cuenta</Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10">
                <Link href={tourHref}>Ver detalles del tour</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] p-6 shadow-soft">
            <h3 className="font-heading text-xl text-brand-blue">Compra protegida</h3>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--color-text)]/72">
              <li>• Factura PDF lista para descargar</li>
              <li>• Link firmado para acceso controlado</li>
              <li>• Soporte rápido con el contexto correcto</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] p-6 shadow-soft">
            <h3 className="font-heading text-xl text-brand-blue">Siguiente mejor paso</h3>
            <p className="mt-3 text-sm leading-6 text-[color:var(--color-text)]/72">
              Si ya quedó todo claro, sigue avanzando: explora más experiencias o deja una solicitud para que el equipo te arme un plan más completo.
            </p>
            <div className="mt-4 grid gap-3">
              <Button asChild variant="outline" className="w-full">
                <Link href={withLocale(locale, '/tours')}>Explorar más tours</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={withLocale(locale, '/contact')}>Pedir ayuda al equipo</Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <LaunchTrustRail locale={locale} variant="postpurchase" />
    </main>
  );
}
