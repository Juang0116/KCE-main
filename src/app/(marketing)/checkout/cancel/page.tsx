/* src/app/(marketing)/checkout/cancel/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import { RotateCcw, XCircle, MessageCircle, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import OpenChatButton from '@/features/ai/OpenChatButton';
import BookingProgressRail from '@/features/bookings/components/BookingProgressRail';
import BookingTrustStrip from '@/features/bookings/components/BookingTrustStrip';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { TOURS } from '@/features/tours/data.mock';
import { SITE_URL } from '@/lib/env';
import { formatCOP, formatISODatePretty } from '@/utils/format';

type SearchParams = Record<string, string | string[] | undefined>;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const baseUrl = (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

export const metadata: Metadata = {
  title: 'Pago cancelado | KCE',
  description: 'Tu pago fue cancelado. Vuelve a intentar o contáctanos para finalizar tu reserva.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${baseUrl}/checkout/cancel` },
};

const pick = (v?: string | string[]) => (Array.isArray(v) ? (v[0] ?? '') : (v ?? ''));
const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

const clampText = (s: string, max = 120) => (s.length > max ? s.slice(0, max) : s);

const REASON_COPY: Record<string, string> = {
  expired: 'La sesión de pago expiró.',
  session_expired: 'La sesión de pago expiró.',
  user_canceled: 'Cancelaste el flujo de pago.',
  canceled: 'Cancelaste el flujo de pago.',
  bank_declined: 'El banco rechazó la transacción.',
  insufficient_funds: 'Fondos insuficientes.',
  authentication_required: 'El banco solicitó verificación adicional.',
  popup_blocked: 'El navegador bloqueó la ventana del pago.',
  network: 'Un problema de red impidió finalizar el pago.',
  timeout: 'Se agotó el tiempo del pago.',
};

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (!locale) return href;
  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

export default async function CancelPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (await Promise.resolve(searchParams ?? {})) as SearchParams;

  const locale = clampText(pick(sp.l).trim().toLowerCase(), 5);
  const hasLocale = /^(es|en|fr|de)$/.test(locale);
  const l = hasLocale ? locale : '';

  const tourParamRaw = clampText(pick(sp.tour).trim(), 200);
  const tourParam = tourParamRaw ? safeDecode(tourParamRaw) : '';
  const dateRaw = clampText(pick(sp.date).trim(), 40);

  const qtyStr = pick(sp.q).trim();
  const parsedQty = qtyStr ? Number.parseInt(qtyStr, 10) : NaN;
  const qty = Number.isFinite(parsedQty) ? Math.max(1, parsedQty) : undefined;

  const reasonKey = pick(sp.reason).trim().toLowerCase();
  const reasonText = reasonKey ? (REASON_COPY[reasonKey] ?? `Se canceló el pago (${reasonKey}).`) : null;

  const matched =
    TOURS.find((t) => t.slug === tourParam) ||
    TOURS.find((t) => t.title.toLowerCase() === tourParam.toLowerCase());

  const popular = TOURS.filter((t) => (matched ? t.slug !== matched.slug : true)).slice(0, 3);

  const retryHref = (() => {
    if (!matched) return withLocale(l, '/tours');
    const u = new URL(withLocale(l, `/tours/${matched.slug}`), 'http://local');
    if (dateRaw) u.searchParams.set('date', dateRaw);
    if (typeof qty === 'number' && qty > 0) u.searchParams.set('q', String(qty));
    return `${u.pathname}${u.search || ''}`;
  })();

  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message: `Hola KCE, mi pago fue cancelado. Necesito ayuda para finalizar la reserva.${
      matched ? `\nTour: ${matched.title}` : tourParam ? `\nTour: ${tourParam}` : ''
    }${dateRaw ? `\nFecha: ${dateRaw}` : ''}${typeof qty === 'number' ? `\nPersonas: ${qty}` : ''}`,
    url: `${baseUrl}${retryHref}`,
  });

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <section className="overflow-hidden rounded-[2rem] border border-brand-blue/12 bg-[color:var(--color-surface)] shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-8 md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/20 bg-brand-red/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-brand-red">
              <XCircle className="size-4" aria-hidden="true" />
              payment interrupted
            </div>
            <h1 className="mt-5 font-heading text-3xl text-brand-blue md:text-5xl">Tu pago no se completó, pero el cierre sigue vivo</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--color-text)]/72 md:text-base">
              {reasonText
                ? `${reasonText} Lo bueno es que todavía puedes retomar el tour, hablar con el equipo o volver al catálogo sin perder el contexto.`
                : 'El pago se canceló, pero todavía puedes volver a intentarlo o entrar a soporte para cerrar la reserva sin improvisar.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}>
                <Link href={retryHref}>{matched ? `Reintentar “${matched.title}”` : 'Volver al catálogo'}</Link>
              </Button>
              {waHref ? (
                <Button asChild variant="outline" size="lg" leftIcon={<MessageCircle className="size-4" aria-hidden="true" />}>
                  <a href={waHref} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                </Button>
              ) : null}
              <OpenChatButton variant="outline" addQueryParam className="h-11 px-5 text-sm">
                Hablar con IA
              </OpenChatButton>
            </div>
          </div>

          <div className="border-t border-brand-blue/10 bg-brand-blue p-8 text-white lg:border-l lg:border-t-0 md:p-10">
            <p className="text-xs uppercase tracking-[0.18em] text-white/65">recovery desk</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="flex items-center gap-2 text-white">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  <span className="font-heading text-lg">Recupera el contexto</span>
                </div>
                <p className="mt-2 text-sm text-white/78">Vuelve a la ficha del tour con fecha y personas prellenadas cuando sea posible.</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="flex items-center gap-2 text-white">
                  <Sparkles className="size-4" aria-hidden="true" />
                  <span className="font-heading text-lg">Pide ayuda rápida</span>
                </div>
                <p className="mt-2 text-sm text-white/78">El equipo puede ayudarte a terminar el cierre, revisar el intento o sugerir una alternativa.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BookingProgressRail
        current={0}
        steps={[
          { id: 'intent', label: 'Intento detectado', detail: 'Ya sabemos que hubo intención de compra.' },
          { id: 'recover', label: 'Retomar flujo', detail: 'Puedes volver al tour o pedir ayuda humana.' },
          { id: 'close', label: 'Cerrar reserva', detail: 'El objetivo es llevarte de nuevo a pago sin fricción.' },
        ]}
      />

      <BookingTrustStrip />

      {(tourParam || dateRaw || qty || reasonText) ? (
        <section className="rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">attempt summary</p>
              <h2 className="mt-2 font-heading text-2xl text-brand-blue">Resumen del intento</h2>
            </div>
            {reasonText ? (
              <span className="inline-flex items-center rounded-full bg-brand-red/10 px-3 py-1 text-xs text-brand-red ring-1 ring-brand-red/20">
                {reasonText}
              </span>
            ) : null}
          </div>

          <dl className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {tourParam ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">tour</dt>
                <dd className="mt-2">
                  {matched ? (
                    <Link className="font-heading text-brand-blue underline underline-offset-4 hover:opacity-90" href={withLocale(l, `/tours/${matched.slug}`)}>
                      {matched.title}
                    </Link>
                  ) : (
                    <strong className="text-[color:var(--color-text)]">{tourParam}</strong>
                  )}
                  {matched ? (
                    <div className="mt-1 text-sm text-[color:var(--color-text)]/65">Desde {formatCOP(matched.price)}</div>
                  ) : null}
                </dd>
              </div>
            ) : null}

            {dateRaw ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">fecha</dt>
                <dd className="mt-2 font-medium text-[color:var(--color-text)]">{formatISODatePretty(dateRaw)}</dd>
              </div>
            ) : null}

            {typeof qty === 'number' && qty > 0 ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">personas</dt>
                <dd className="mt-2 font-medium text-[color:var(--color-text)]">{qty}</dd>
              </div>
            ) : null}

            {reasonText ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">motivo</dt>
                <dd className="mt-2 text-sm text-[color:var(--color-text)]/75">{reasonText}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild variant="primary" size="lg">
              <Link href={retryHref}>
                <RotateCcw className="mr-2 size-4" aria-hidden="true" />
                {matched ? `Reintentar en “${matched.title}”` : 'Ver tours'}
              </Link>
            </Button>
            {waHref ? (
              <Button asChild variant="outline" size="lg">
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 size-4" aria-hidden="true" />
                  WhatsApp
                </a>
              </Button>
            ) : null}
            <Button asChild variant="ghost" size="lg">
              <Link href={withLocale(l, '/contact')}>Hablar con el equipo</Link>
            </Button>
          </div>
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8">
        <h2 className="font-heading text-2xl text-brand-blue">Qué pudo pasar</h2>
        <ul className="mt-4 grid gap-3 text-sm text-[color:var(--color-text)]/75 md:grid-cols-3">
          <li className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">La entidad bancaria rechazó el pago o pidió verificación adicional.</li>
          <li className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">La sesión expiró o el navegador bloqueó la ventana de pago.</li>
          <li className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">La página se cerró antes de que el proceso se confirmara por completo.</li>
        </ul>
      </section>

      <section className="rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">popular alternatives</p>
            <h2 className="mt-2 font-heading text-2xl text-brand-blue">También te pueden gustar</h2>
          </div>
          <Button asChild variant="ghost">
            <Link href={withLocale(l, '/tours')}>Explorar catálogo</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {popular.map((tour) => (
            <Link
              key={tour.slug}
              href={withLocale(l, `/tours/${tour.slug}`)}
              className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5 transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <p className="font-heading text-lg text-brand-blue">{tour.title}</p>
              <p className="mt-1 text-sm text-[color:var(--color-text)]/65">{tour.city}</p>
              <p className="mt-4 text-sm text-[color:var(--color-text)]/72">Desde <span className="font-heading text-brand-blue">{formatCOP(tour.price)}</span></p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
