// src/app/(marketing)/checkout/success/page.tsx
import 'server-only';

import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import BookingProgressRail from '@/features/bookings/components/BookingProgressRail';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';
import BookingTrustStrip from '@/features/bookings/components/BookingTrustStrip';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { toTourLike } from '@/features/tours/adapters';
import { getTourBySlug, listTours } from '@/features/tours/catalog.server';
import { SITE_URL, serverEnv } from '@/lib/env';
import { signLinkToken } from '@/lib/linkTokens.server';
import { getStripe } from '@/lib/stripe.server';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CreditCard,
  Download,
  MessageCircleMore,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react';

import type { Metadata } from 'next';
import type Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  searchParams: Promise<SearchParams> | SearchParams;
};

const ZERO_DECIMAL = new Set([
  'bif',
  'clp',
  'djf',
  'gnf',
  'jpy',
  'kmf',
  'krw',
  'mga',
  'pyg',
  'rwf',
  'ugx',
  'vnd',
  'vuv',
  'xaf',
  'xof',
  'xpf',
]);

function safeStr(v: unknown) {
  return typeof v === 'string' ? v.trim() : '';
}

function pickFirst(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return safeStr(v[0]);
  return safeStr(v);
}

function guessLocale(sp: SearchParams, md?: Record<string, string | undefined>) {
  const raw = safeStr(md?.locale) || pickFirst(sp.locale) || pickFirst(sp.lang);
  const lc = raw.toLowerCase();
  if (lc === 'es' || lc === 'en' || lc === 'fr' || lc === 'de') return lc;
  return 'es';
}

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

function money(minor: number | null | undefined, currency = 'EUR', locale = 'es-CO') {
  if (minor == null) return '';
  const c = (currency || 'EUR').toLowerCase();
  const zero = ZERO_DECIMAL.has(c);
  const value = zero ? minor : minor / 100;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: zero ? 0 : 2,
    maximumFractionDigits: zero ? 0 : 2,
  }).format(value);
}

const BASE_URL = (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
  /\/+$/,
  '',
);

export const metadata: Metadata = {
  title: 'Pago confirmado | KCE',
  robots: { index: false, follow: false },
  metadataBase: new URL(BASE_URL),
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const sp = (await Promise.resolve(searchParams ?? {})) as SearchParams;

  const sessionId = pickFirst(sp.session_id);
  const tourParam = pickFirst(sp.tour);
  const date = pickFirst(sp.date);
  const q = pickFirst(sp.q);

  let receiptUrl = '';
  let customerEmail = '';
  let customerName = '';
  let status: Stripe.Checkout.Session.PaymentStatus | 'unknown' = 'unknown';
  let totalMinor: number | null = null;
  let currency = 'EUR';
  let tourSlugFromStripe: string | null = null;
  let tourTitleFromStripe: string | null = null;
  let stripeLocaleHint: string | null = null;

  let md: Record<string, string | undefined> | undefined;

  if (process.env.STRIPE_SECRET_KEY && sessionId) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent', 'payment_intent.latest_charge'],
      });

      status = (session.payment_status || 'unknown') as Stripe.Checkout.Session.PaymentStatus | 'unknown';
      currency = (session.currency || 'eur').toUpperCase();
      totalMinor = typeof session.amount_total === 'number' ? session.amount_total : null;

      customerEmail = safeStr(session.customer_details?.email ?? session.customer_email);
      customerName = safeStr(session.customer_details?.name);

      const pi = session.payment_intent as Stripe.PaymentIntent | null;
      const latestCharge = pi?.latest_charge as Stripe.Charge | string | null | undefined;
      receiptUrl =
        typeof latestCharge === 'object' && latestCharge ? safeStr(latestCharge.receipt_url) : '';

      md = (session.metadata ?? {}) as Record<string, string | undefined>;
      tourSlugFromStripe = safeStr(md.tour_slug || md.slug) || null;
      tourTitleFromStripe = safeStr(md.tour_title || md.title) || null;
      stripeLocaleHint = safeStr(md.locale) || null;
    } catch {
      // noop
    }
  }

  const locale = guessLocale(sp, md);
  const tourSlug = tourSlugFromStripe || (tourParam ? safeStr(tourParam) : null);
  const tour = tourSlug ? await getTourBySlug(tourSlug) : null;
  const uiTour = tour ? toTourLike(tour) : null;
  const tourTitle = uiTour?.title || tourTitleFromStripe || 'Tour KCE';

  const secret = (serverEnv.LINK_TOKEN_SECRET || '').trim();
  const token =
    secret && sessionId ? signLinkToken({ sessionId, secret, ttlSeconds: 60 * 60 * 24 * 30 }) : '';

  const manageUrl =
    sessionId && token
      ? withLocale(locale, `/booking/${encodeURIComponent(sessionId)}?t=${encodeURIComponent(token)}`)
      : withLocale(locale, '/tours');

  const paid = status === 'paid';

  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message: [
      process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE ||
        'Hola KCE, necesito ayuda con mi reserva.',
      '',
      `Reserva / Pago`,
      `Tour: ${tourTitle}`,
      `Estado: ${paid ? 'paid' : String(status)}`,
      sessionId ? `Session: ${sessionId}` : '',
      customerName ? `Nombre: ${customerName}` : '',
      customerEmail ? `Email: ${customerEmail}` : '',
      totalMinor != null ? `Total: ${money(totalMinor, currency, locale === 'es' ? 'es-CO' : 'en-US')}` : '',
      stripeLocaleHint ? `Locale: ${stripeLocaleHint}` : '',
      '',
      `Link de booking: ${BASE_URL}${manageUrl}`,
    ]
      .filter(Boolean)
      .join('\n'),
    url: `${BASE_URL}${manageUrl}`,
  });

  const { items: popularItems } = await listTours({ limit: 3, sort: 'popular' });
  const popular = popularItems.map(toTourLike).filter((t) => t.slug !== uiTour?.slug);

  if (!sessionId) {
    return (
      <main className="container mx-auto max-w-4xl space-y-6 px-4 py-10">
        <section className="overflow-hidden rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] shadow-soft">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-8 md:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-brand-blue">
                <BadgeCheck className="size-4" aria-hidden="true" />
                cierre protegido
              </div>
              <h1 className="mt-5 font-heading text-3xl text-brand-blue md:text-4xl">
                No pudimos identificar el booking todavía
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--color-text)]/72">
                Si vienes desde Stripe, vuelve a abrir el enlace del checkout o entra al soporte con el contexto de tu compra. El equipo te ayuda a retomar el cierre sin perder el hilo.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={withLocale(locale, '/tours')}>Ver tours</Link>
                </Button>
                {waHref ? (
                  <Button asChild variant="outline" size="lg">
                    <a href={waHref} target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                  </Button>
                ) : null}
                <Button asChild variant="ghost" size="lg">
                  <Link href={withLocale(locale, '/contact')}>Contacto</Link>
                </Button>
              </div>
            </div>
            <div className="border-t border-brand-blue/10 bg-brand-blue p-8 text-white lg:border-l lg:border-t-0 md:p-10">
              <p className="text-xs uppercase tracking-[0.22em] text-white/65">siguiente mejor paso</p>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="font-heading text-lg">Explora de nuevo</p>
                  <p className="mt-1 text-sm text-white/78">Vuelve al catálogo y retoma el flujo cuando quieras.</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="font-heading text-lg">Pide apoyo humano</p>
                  <p className="mt-1 text-sm text-white/78">Úsalo si necesitas reconstruir tu reserva o validar tu intento de pago.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-6xl space-y-8 px-4 py-10">
      <section className="overflow-hidden rounded-[2rem] border border-brand-blue/12 bg-[color:var(--color-surface)] shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-8 md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-emerald-700">
              <ShieldCheck className="size-4" aria-hidden="true" />
              {paid ? 'payment secured' : 'payment pending'}
            </div>
            <h1 className="mt-5 font-heading text-3xl text-brand-blue md:text-5xl">
              {paid ? 'Tu compra quedó confirmada' : 'Tu pago está siendo procesado'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--color-text)]/72 md:text-base">
              {paid
                ? 'Ya pasaste el punto más importante del cierre. Desde aquí puedes abrir tu booking, descargar tu factura y seguir con la preparación de la experiencia.'
                : 'Si acabas de pagar, tu booking puede tardar unos segundos en reflejarse. Igual te dejamos el siguiente paso claro para no perder momentum.'}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">tour</p>
                <p className="mt-2 font-heading text-base text-brand-blue">{tourTitle}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">fecha</p>
                <p className="mt-2 font-heading text-base text-brand-blue">{date || 'Por confirmar'}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">personas</p>
                <p className="mt-2 font-heading text-base text-brand-blue">{q || '—'}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">total</p>
                <p className="mt-2 font-heading text-base text-brand-blue">
                  {money(totalMinor, currency, locale === 'es' ? 'es-CO' : 'en-US') || '—'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}>
                <Link href={manageUrl}>Abrir booking seguro</Link>
              </Button>
              {receiptUrl ? (
                <Button asChild variant="outline" size="lg" leftIcon={<ReceiptText className="size-4" aria-hidden="true" />}>
                  <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                    Ver recibo Stripe
                  </a>
                </Button>
              ) : null}
              {waHref ? (
                <Button asChild variant="outline" size="lg" leftIcon={<MessageCircleMore className="size-4" aria-hidden="true" />}>
                  <a href={waHref} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="border-t border-brand-blue/10 bg-brand-blue p-8 text-white lg:border-l lg:border-t-0 md:p-10">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/logo.png"
                alt="KCE"
                width={56}
                height={56}
                className="size-12 rounded-2xl bg-white/10 p-2 object-contain"
                priority
              />
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/65">post-checkout suite</p>
                <p className="font-heading text-2xl text-white">KCE booking access</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="flex items-center gap-2 text-white">
                  <CreditCard className="size-4" aria-hidden="true" />
                  <span className="font-heading text-base">Compra registrada</span>
                </div>
                <p className="mt-2 text-sm text-white/78">
                  Mantén este punto como referencia principal para factura, booking y soporte.
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="flex items-center gap-2 text-white">
                  <CalendarClock className="size-4" aria-hidden="true" />
                  <span className="font-heading text-base">Preparación guiada</span>
                </div>
                <p className="mt-2 text-sm text-white/78">
                  Desde tu booking podrás añadir la experiencia al calendario y revisar los siguientes pasos.
                </p>
              </div>
              {(customerEmail || customerName) ? (
                <div className="rounded-2xl bg-white/10 p-4 text-sm text-white/78">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/65">cliente</p>
                  <p className="mt-2 font-medium text-white">{customerName || 'Cliente KCE'}</p>
                  {customerEmail ? <p className="mt-1 text-white/70">{customerEmail}</p> : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <BookingProgressRail
        current={paid ? 1 : 0}
        steps={[
          { id: 'payment', label: 'Pago', detail: paid ? 'Validado y visible en tu compra.' : 'En revisión o sincronización.' },
          { id: 'booking', label: 'Booking', detail: 'Acceso seguro con herramientas de post-compra.' },
          { id: 'prepare', label: 'Prepararte', detail: 'Soporte, factura y siguientes pasos claros.' },
        ]}
      />

      <BookingTrustStrip />


      <div className="mt-8">
        <LaunchCommandActionDeck
          eyebrow="success command"
          title={locale === 'en' ? 'After checkout, the traveler should keep seeing the same protected next steps' : locale === 'fr' ? 'Après le checkout, le voyageur doit continuer à voir les mêmes prochaines étapes protégées' : locale === 'de' ? 'Nach dem Checkout sollte der Reisende weiterhin dieselben geschützten nächsten Schritte sehen' : 'Después del checkout, el viajero debería seguir viendo los mismos siguientes pasos protegidos'}
          description={locale === 'en' ? 'This final command layer keeps booking, account, support and continued shopping visible even on smaller screens.' : locale === 'fr' ? 'Cette dernière couche garde visibles booking, compte, support et continuité commerciale même sur mobile.' : locale === 'de' ? 'Diese letzte Ebene hält Booking, Konto, Support und kommerzielle Fortsetzung auch auf kleineren Bildschirmen sichtbar.' : 'Esta capa final mantiene visibles booking, cuenta, soporte y continuidad comercial incluso en mobile.'}
          actions={[
            { href: manageUrl, label: locale === 'en' ? 'Open booking' : locale === 'fr' ? 'Ouvrir le booking' : locale === 'de' ? 'Booking öffnen' : 'Abrir booking', detail: locale === 'en' ? 'Return to the secure post-purchase center.' : locale === 'fr' ? 'Retourne au centre post-achat sécurisé.' : locale === 'de' ? 'Kehre zum sicheren Post-Purchase-Center zurück.' : 'Vuelve al centro post-compra seguro.', tone: 'primary' },
            { href: withLocale(locale, '/account/bookings'), label: locale === 'en' ? 'My account' : locale === 'fr' ? 'Mon compte' : locale === 'de' ? 'Mein Konto' : 'Mi cuenta', detail: locale === 'en' ? 'Recover bookings and continuity from account.' : locale === 'fr' ? 'Retrouve bookings et continuité depuis le compte.' : locale === 'de' ? 'Hole Bookings und Kontinuität aus dem Konto zurück.' : 'Recupera reservas y continuidad desde la cuenta.' },
            { href: withLocale(locale, '/account/support?source=checkout-success'), label: locale === 'en' ? 'Support' : locale === 'fr' ? 'Support' : locale === 'de' ? 'Support' : 'Soporte', detail: locale === 'en' ? 'Open a contextual support lane if anything feels off.' : locale === 'fr' ? 'Ouvre une voie de support contextualisée si quelque chose cloche.' : locale === 'de' ? 'Öffne einen kontextreichen Support-Kanal, wenn etwas nicht stimmt.' : 'Abre un carril de soporte contextual si algo no cuadra.' },
            { href: withLocale(locale, '/tours'), label: locale === 'en' ? 'More tours' : locale === 'fr' ? 'Plus de tours' : locale === 'de' ? 'Mehr Touren' : 'Más tours', detail: locale === 'en' ? 'Keep building the itinerary from the catalog.' : locale === 'fr' ? 'Continue à construire l’itinéraire depuis le catalogue.' : locale === 'de' ? 'Baue die Reise weiter über den Katalog aus.' : 'Sigue construyendo el itinerario desde el catálogo.' },
          ]}
        />
      </div>


      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">next move</p>
              <h2 className="mt-2 font-heading text-2xl text-brand-blue">Qué hacer ahora</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-brand-blue">
              secure flow
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
              <p className="font-heading text-lg text-brand-blue">1. Abre tu booking</p>
              <p className="mt-2 text-sm text-[color:var(--color-text)]/72">
                Guarda el enlace firmado para volver a tu reserva sin depender del checkout.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
              <p className="font-heading text-lg text-brand-blue">2. Descarga todo</p>
              <p className="mt-2 text-sm text-[color:var(--color-text)]/72">
                Desde el booking tendrás factura PDF, calendario y vías de soporte listas.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
              <p className="font-heading text-lg text-brand-blue">3. Resuelve dudas ahora</p>
              <p className="mt-2 text-sm text-[color:var(--color-text)]/72">
                Si algo no coincide, usa soporte hoy y evita fricción cerca a la experiencia.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="lg" leftIcon={<Download className="size-4" aria-hidden="true" />}>
              <Link href={manageUrl}>Ir al booking</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={withLocale(locale, '/account/bookings')}>Ir a mi cuenta</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href={withLocale(locale, '/contact')}>Hablar con el equipo</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-brand-blue/10 bg-brand-blue p-6 text-white shadow-soft md:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-white/65">post-purchase desk</p>
          <h2 className="mt-2 font-heading text-2xl text-white">Todo listo para la siguiente pantalla</h2>
          <p className="mt-3 text-sm leading-6 text-white/78">
            Tu booking es el centro de operación después de pagar. En una sola vista podrás revisar la reserva, descargar factura y pedir ayuda con contexto completo.
          </p>
          <div className="mt-6 space-y-3">
            {[
              'Factura PDF disponible desde el booking',
              'Soporte rápido con ID de sesión y contexto',
              'Ruta clara hacia calendario, cuenta y siguientes experiencias',
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/82">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {popular.length > 0 ? (
        <section className="rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">keep the momentum</p>
              <h2 className="mt-2 font-heading text-2xl text-brand-blue">Sigue construyendo tu itinerario</h2>
            </div>
            <Button asChild variant="ghost">
              <Link href={withLocale(locale, '/tours')}>Ver más tours</Link>
            </Button>
          </div>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {popular.map((t) => (
              <li key={t.slug} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
                <Link href={withLocale(locale, `/tours/${encodeURIComponent(t.slug)}`)} className="block">
                  <p className="font-heading text-lg text-brand-blue">{t.title}</p>
                  <p className="mt-1 text-sm text-[color:var(--color-text)]/68">{t.city || 'Colombia'}</p>
                  {t.base_price != null ? (
                    <p className="mt-4 text-sm text-[color:var(--color-text)]/72">
                      Desde <span className="font-heading text-brand-blue">{money(t.base_price, 'EUR', locale === 'es' ? 'es-CO' : 'en-US')}</span>
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
