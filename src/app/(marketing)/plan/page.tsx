// src/app/(marketing)/plan/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

import MobileQuickActions from '@/features/marketing/MobileQuickActions';
import PersonalizedPlanForm from '@/features/marketing/PersonalizedPlanForm';
import LaunchTrustRail from '@/features/marketing/LaunchTrustRail';
import PremiumConversionStrip from '@/features/marketing/PremiumConversionStrip';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';

import { getDictionary, type Dictionary } from '@/i18n/getDictionary';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;

  const c = await cookies();
  const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
  if (SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;

  return 'es';
}

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const canonical = withLocale(locale, '/plan');
  const title = 'Plan personalizado | KCE';
  const description =
    'Cuéntanos cómo quieres viajar y recibe experiencias KCE recomendadas según tu estilo, presupuesto y ritmo.';
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function PlanPage() {
  const locale = await resolveLocale();
  const dict: Dictionary = await getDictionary(locale);
  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message:
      process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE ||
      'Hola KCE, quiero ayuda con un plan personalizado.',
    url: withLocale(locale, '/plan'),
  });

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-28">
      <a
        href="#plan-form"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-modal)] focus:rounded-full focus:bg-[color:var(--color-surface)] focus:px-4 focus:py-2 focus:text-sm focus:shadow-pop"
      >
        Saltar al formulario
      </a>

      <MobileQuickActions locale={locale} dict={dict} whatsAppHref={waHref} />

      <section className="overflow-hidden rounded-[calc(var(--radius)+0.5rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text-muted)]">
              <span className="text-brand-blue">Plan personalizado</span>
              <span className="opacity-50">•</span>
              <span>2–3 min</span>
              <span className="opacity-50">•</span>
              <span>Ruta clara</span>
            </div>

            <h1 className="mt-4 max-w-3xl font-heading text-3xl text-[color:var(--color-text)] md:text-5xl">
              Cuéntanos cómo quieres viajar y te ayudamos a aterrizar una ruta KCE que sí encaje contigo.
            </h1>

            <p className="mt-4 max-w-2xl text-base text-[color:var(--color-text)]/75 md:text-lg">
              Describe ciudad, estilo, presupuesto e intereses. Con eso te mostramos tours reales del catálogo y la mejor ruta para seguir con claridad, con apoyo humano si hace falta.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={withLocale(locale, '/tours')}
                className="inline-flex items-center rounded-full bg-[color:var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white no-underline transition hover:opacity-95 hover:no-underline"
              >
                Ver catálogo
              </Link>
              <Link
                href={waHref ?? withLocale(locale, '/contact')}
                className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-5 py-3 text-sm font-semibold text-[color:var(--color-text)] no-underline transition hover:bg-[color:var(--color-surface)] hover:no-underline"
              >
                Hablar con KCE
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              {['Tours reales', 'Continuidad CRM', 'Soporte humano cuando haga falta'].map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1.5 text-[color:var(--color-text)]/80"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-6 md:p-10 lg:border-l lg:border-t-0">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">Qué necesitas para empezar</div>
              <div className="mt-4 grid gap-3">
                {[
                  ['Cuéntanos tu idea', 'Ciudad, presupuesto, ritmo, viajeros e intereses para recomendar mejor.'],
                  ['Recibe una ruta clara', 'Tours reales del catálogo, más una vía simple para seguir con KCE.'],
                  ['Mantén el contexto', 'Si dejas tu email, KCE puede retomar contigo sin arrancar desde cero.'],
                ].map(([title, copy]) => (
                  <div key={String(title)} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                    <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
                    <div className="mt-1 text-sm text-[color:var(--color-text)]/72">{copy}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] p-6 md:p-10">
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {[
              ['1', 'Cuéntanos qué buscas', 'Ciudad, presupuesto, ritmo e intereses para que la recomendación salga más útil.'],
              ['2', 'Recibe opciones reales', 'El resultado sale conectado al catálogo y listo para seguir explorando.'],
              ['3', 'Avanza a tu ritmo', 'Puedes seguir por tour, pedir ayuda humana o dejar tu contacto para retomar después.'],
            ].map(([step, title, copy]) => (
              <div key={step} className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <div className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-text-muted)]">STEP {step}</div>
                <div className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
                <div className="mt-1 text-sm text-[color:var(--color-text)]/70">{copy}</div>
              </div>
            ))}
          </div>

          <section id="plan-form" aria-label="Formulario de plan personalizado">
            <PersonalizedPlanForm />
          </section>
        </div>

        <footer className="border-t border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-6 md:p-10">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ['1. Envías tu idea', 'Comparte destino, fechas, viajeros y presupuesto aproximado.'],
              ['2. KCE ordena opciones', 'Te ayudamos a aterrizar tours reales o una ruta más personalizada.'],
              ['3. Sigues con claridad', 'Puedes ver tours, hablar con KCE o retomar el caso más tarde con contexto.'],
            ].map(([title, copy]) => (
              <div key={String(title)} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4">
                <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
                <p className="mt-1 text-sm text-[color:var(--color-text)]/72">{copy}</p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-sm text-[color:var(--color-text)]/75">
            Privacidad: si dejas tu email, lo usamos para enviarte el resumen y darte soporte. Si aceptas contacto, KCE puede retomar tu caso con más contexto. Puedes ajustar cookies en cualquier momento.
          </p>

          <nav aria-label="Enlaces relacionados" className="mt-3 flex flex-wrap gap-4 text-sm">
            <Link href={withLocale(locale, '/privacy')} className="text-brand-blue underline underline-offset-4 hover:opacity-90">
              Ver privacidad
            </Link>
            <Link href={withLocale(locale, '/cookies')} className="text-brand-blue underline underline-offset-4 hover:opacity-90">
              Preferencias de cookies
            </Link>
            <Link href={withLocale(locale, '/tours')} className="text-brand-blue underline underline-offset-4 hover:opacity-90">
              Ver tours
            </Link>
          </nav>
        </footer>
      </section>

      <LaunchTrustRail locale={locale} className="mt-10" />

      <PremiumConversionStrip locale={locale} whatsAppHref={waHref ?? null} className="px-0 pt-10" />

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ['Bogotá', 'Punto fuerte para empezar: tours urbanos, cultura, gastronomía y rutas fáciles de validar.'],
          ['La Victoria, Caldas', 'Diferencial propio para naturaleza, aventura y experiencias más controladas.'],
          ['Cartagena', 'Ruta premium en preparación para combinar contenido, hospitalidad y experiencias futuras.'],
        ].map(([title, copy]) => (
          <div key={String(title)} className="rounded-[calc(var(--radius)+0.25rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">KCE route</div>
            <div className="mt-2 font-heading text-xl text-brand-blue">{title}</div>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/75">{copy}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
