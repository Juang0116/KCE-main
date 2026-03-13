// src/features/marketing/CaptureCtas.tsx
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

import { Button } from '@/components/ui/Button';

type Props = {
  compact?: boolean;
  locale?: string;
};

const SUPPORTED = new Set(['es', 'en', 'fr', 'de']);

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

async function resolveLocale() {
  const h = await headers();
  const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader)) return fromHeader;

  const c = await cookies();
  const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
  if (SUPPORTED.has(fromCookie)) return fromCookie;

  return 'es';
}

export default async function CaptureCtas({ compact = false, locale }: Props) {
  const resolvedLocale = locale || (await resolveLocale());

  return (
    <section
      aria-labelledby="capture-ctas"
      className={compact ? 'mx-auto max-w-6xl px-4 pb-10' : 'mx-auto max-w-6xl px-6 pb-12'}
    >
      <div className="card overflow-hidden p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 id="capture-ctas" className="font-heading text-2xl text-brand-blue">
              Planifica mejor y recibe beneficios
            </h2>
            <p className="max-w-2xl text-[color:var(--color-text)]/80">
              Cuéntanos cómo quieres viajar para recibir recomendaciones personalizadas, suscríbete para ofertas y guías, o habla con nosotros si quieres ayuda antes de reservar.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="primary" className="px-5 py-3">
              <Link href={withLocale(resolvedLocale, '/plan')}>Abrir plan personalizado</Link>
            </Button>
            <Button asChild variant="outline" className="px-5 py-3">
              <Link href={withLocale(resolvedLocale, '/newsletter')}>Suscribirme</Link>
            </Button>
            <Button asChild variant="secondary" className="px-5 py-3">
              <Link href={withLocale(resolvedLocale, '/wishlist')}>Ver Wishlist</Link>
            </Button>
            <Button asChild variant="ghost" className="px-5 py-3">
              <Link href={withLocale(resolvedLocale, '/contact')}>Hablar con un asesor</Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-heading text-brand-yellow">Plan personalizado</p>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/80">
              Encuentra experiencias más alineadas con tu estilo, presupuesto y ritmo.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-heading text-brand-yellow">Newsletter</p>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/80">
              Doble opt-in, sin spam. Solo ofertas reales, historias útiles y lanzamientos.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-heading text-brand-yellow">Wishlist</p>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/80">
              Guarda tus favoritos y retoma tu decisión cuando estés listo para reservar.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-heading text-brand-yellow">Asesoría</p>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/80">
              Si todavía tienes dudas, habla con nosotros antes de pagar y arma un plan seguro.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
