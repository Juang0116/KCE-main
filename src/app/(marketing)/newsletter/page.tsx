// src/app/(marketing)/newsletter/page.tsx
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';

import { PageShell } from '@/components/layout/PageShell';
import NewsletterForm from '@/features/marketing/NewsletterForm';
import type { SupportedLocale } from '@/i18n/locales';

export const metadata: Metadata = {
  title: 'Newsletter | KCE',
  description: 'Novedades, historias y ofertas de Knowing Cultures Enterprise.',
  robots: { index: false, follow: true },
};

type SearchParams = Record<string, string | string[] | undefined>;

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const c = await cookies();
  const direct = (h.get('x-kce-locale') || c.get('kce.locale')?.value || '').toLowerCase();
  if (direct === 'en' || direct === 'fr' || direct === 'de' || direct === 'es') return direct as SupportedLocale;
  const al = (h.get('accept-language') || '').toLowerCase();
  if (al.startsWith('fr')) return 'fr';
  if (al.startsWith('de')) return 'de';
  if (al.startsWith('en')) return 'en';
  return 'es';
}

function withLocale(locale: SupportedLocale, path: string): string {
  const safe = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${safe}`;
}

function pickFirst(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return (v[0] ?? '').trim();
  return (v ?? '').trim();
}

type BannerTone = 'ok' | 'err' | 'info';
type Banner = { tone: BannerTone; title: string; text: string } | null;

function buildBanner(sp: SearchParams): Banner {
  const confirmed = pickFirst(sp.confirmed);
  const unsubscribed = pickFirst(sp.unsubscribed);
  const err = pickFirst(sp.err);

  if (confirmed === '1') {
    return { tone: 'ok', title: '¡Suscripción confirmada!', text: 'Bienvenido/a a KCE.' };
  }
  if (unsubscribed === '1') {
    return { tone: 'ok', title: 'Listo', text: 'Tu suscripción fue cancelada correctamente.' };
  }
  if (confirmed === '0' || unsubscribed === '0') {
    return {
      tone: 'err',
      title: 'No pudimos procesar tu solicitud',
      text: err === 'invalid' ? 'El enlace es inválido o expiró.' : 'Inténtalo de nuevo más tarde.',
    };
  }

  return null;
}

export default async function NewsletterPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (await Promise.resolve(searchParams ?? {})) as SearchParams;
  const banner = buildBanner(sp);
  const locale = await resolveLocale();

  return (
    <PageShell className="px-6 py-12 md:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text)]/70">
            Secondary capture lane · Updates · Stories · Offers
          </div>

          <h1 className="font-heading text-3xl tracking-tight text-brand-blue">
            Newsletter de KCE
          </h1>

          <p className="max-w-2xl text-sm text-[color:var(--color-text)]/70">
            Recibe historias, datos curiosos, lanzamientos de tours y ofertas especiales. Esta es una capa secundaria de captación: si ya quieres una recomendación real, te sirve mejor abrir tu plan personalizado o hablar con KCE.
          </p>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-3" aria-label="Beneficios de suscribirte">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="text-sm font-semibold text-brand-blue">Ofertas reales</div>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/70">
              Promociones puntuales, lanzamientos y oportunidades útiles para decidir mejor.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="text-sm font-semibold text-brand-blue">Inspiración útil</div>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/70">
              Historias, guías cortas y contenido para comparar destinos y experiencias.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="text-sm font-semibold text-brand-blue">Sin ruido</div>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/70">
              Confirmación doble, baja con un clic y enfoque en contenido relevante.
            </p>
          </div>
        </section>

        {banner ? (
          <section
            role={banner.tone === 'err' ? 'alert' : 'status'}
            className={[
              'mb-6 rounded-2xl border p-4 shadow-soft',
              banner.tone === 'ok'
                ? 'border-emerald-200/40 bg-emerald-200/15 text-emerald-950 dark:text-emerald-50'
                : banner.tone === 'err'
                  ? 'border-red-200/40 bg-red-200/15 text-red-950 dark:text-red-50'
                  : 'border-[var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]',
            ].join(' ')}
          >
            <div className="text-sm font-semibold">{banner.title}</div>
            <div className="mt-1 text-sm opacity-90">{banner.text}</div>
          </section>
        ) : null}

        <section className="card p-6 md:p-8">
          <NewsletterForm />

          <p className="mt-6 text-xs text-[color:var(--color-text)]/60">
            Al suscribirte, aceptas recibir correos relacionados con KCE. Puedes cancelar en
            cualquier momento.
          </p>

          <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">
              Privacidad
            </div>
            <p className="mt-1 text-xs text-[color:var(--color-text)]/60">
              No enviamos spam. Solo contenido útil y ofertas relevantes. Puedes darte de baja con
              un clic.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a className="text-brand-blue hover:underline" href={withLocale(locale, '/contact')}>
              ¿Necesitas ayuda antes de reservar? Habla con KCE
            </a>
            <span className="text-[color:var(--color-text)]/40">•</span>
            <a className="text-brand-blue hover:underline" href={withLocale(locale, '/plan')}>
              ¿Prefieres una recomendación rápida? Abre tu plan personalizado
            </a>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
