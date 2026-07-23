/* src/app/(marketing)/about/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import { headers, cookies } from 'next/headers';
import { ArrowRight, Compass, ShieldCheck, HeartHandshake, Leaf, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getDictionary, t, type SupportedLocale } from '@/i18n/getDictionary';

const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const c = await cookies();
  const v = (h.get('x-kce-locale') || c.get('kce.locale')?.value || '').toLowerCase();
  return SUPPORTED.has(v as SupportedLocale) ? (v as SupportedLocale) : 'es';
}

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const dict = await getDictionary(locale);
  return {
    title: `${t(dict, 'about.title', 'About')} | KCE`,
    description: t(dict, 'about.sub', ''),
    robots: { index: true, follow: true },
  };
}

export default async function AboutPage() {
  const locale = await resolveLocale();
  const dict = await getDictionary(locale);

  const values = [
    { icon: Compass, titleKey: 'about.val1_title', bodyKey: 'about.val1_body' },
    { icon: ShieldCheck, titleKey: 'about.val2_title', bodyKey: 'about.val2_body' },
    { icon: HeartHandshake, titleKey: 'about.val3_title', bodyKey: 'about.val3_body' },
    { icon: Leaf, titleKey: 'about.val4_title', bodyKey: 'about.val4_body' },
  ];

  return (
    <main className="flex min-h-screen w-full animate-fade-in flex-col bg-base">
      {/* 01. HERO EDITORIAL (ADN KCE PREMIUM) */}
      <section className="relative flex min-h-[65vh] w-full flex-col justify-center overflow-hidden border-b border-brand-dark/10 bg-brand-dark px-6 py-32 text-center">
        {/* Destello de fondo */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-full max-w-3xl -translate-x-1/2 rounded-full bg-brand-blue/20 blur-[120px]" />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
            <Globe2 className="h-3 w-3 text-brand-yellow" />{' '}
            {t(dict, 'brand.name', 'Knowing Cultures Enterprise')}
          </div>

          {/* TITULAR ACTUALIZADO CON LETRA AMARILLA */}
          <h1 className="mb-8 font-heading text-5xl leading-[1.05] tracking-tight text-white md:text-7xl lg:text-8xl">
            {t(dict, 'about.headline_part1', 'Descubre la Colombia')} <br />
            <span className="font-light italic text-brand-yellow opacity-90">
              {t(dict, 'about.headline_part2', 'que pocos viajeros ven.')}
            </span>
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
            {t(
              dict,
              'about.sub',
              'Narrativas locales y experiencias auténticas diseñadas para entender la verdadera esencia de nuestro territorio.',
            )}
          </p>

          <div className="flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
            <Button
              asChild
              size="lg"
              className="w-full rounded-full bg-brand-yellow px-10 py-6 text-xs font-bold uppercase tracking-widest text-brand-dark shadow-pop transition-transform hover:-translate-y-1 hover:bg-white sm:w-auto"
            >
              <Link href={withLocale(locale, '/tours')}>
                {t(dict, 'about.cta', 'Explore tours')} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full rounded-full border-white/30 bg-white/5 px-10 py-6 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md transition-transform hover:-translate-y-1 hover:bg-white hover:text-brand-dark sm:w-auto"
            >
              <Link href={withLocale(locale, '/contact')}>
                {t(dict, 'about.cta_contact', 'Contact the team')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* BREADCRUMB SUTIL */}
      <div className="w-full border-b border-brand-dark/5 bg-surface px-6 py-3 dark:border-white/5">
        <div className="mx-auto flex max-w-[var(--container-max)] items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-80">
          <Link
            href={withLocale(locale, '/')}
            className="transition-colors hover:text-brand-blue"
          >
            Inicio
          </Link>
          <ArrowRight className="h-3 w-3" />
          <span className="text-main">Nuestra Historia</span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-24 px-6 py-24 md:gap-32 md:py-32">
        {/* 02. MISIÓN (MANIFIESTO KCE) */}
        <section className="mx-auto max-w-4xl text-center">
          <h2 className="mb-8 inline-flex items-center gap-2 font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Compass className="h-3 w-3" /> {t(dict, 'about.mission', 'Our Mission')}
          </h2>
          <p className="font-heading text-3xl leading-[1.15] tracking-tight text-main md:text-5xl">
            &quot;
            {t(
              dict,
              'about.mission_text',
              'Conectar a viajeros conscientes con las raíces culturales más profundas de Colombia a través de rutas curadas por expertos locales.',
            )}
            &quot;
          </p>
        </section>

        {/* 03. VALORES KCE (Tarjetas Premium) */}
        <section>
          <div className="mb-16 text-center">
            <h2 className="font-heading text-3xl tracking-tight text-main md:text-4xl">
              Los Pilares de KCE
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {values.map(({ icon: Icon, titleKey, bodyKey }, i) => (
              <div
                key={i}
                className="group flex flex-col items-start rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-pop dark:border-white/5 md:p-12"
              >
                <div className="mb-8 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-brand-blue/10 bg-brand-blue/5 text-brand-blue transition-colors duration-300 group-hover:bg-brand-blue group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-4 font-heading text-2xl tracking-tight text-main transition-colors group-hover:text-brand-blue">
                  {t(dict, titleKey, '')}
                </h3>
                <p className="text-base font-light leading-relaxed text-muted">
                  {t(dict, bodyKey, '')}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 04. DESTINATIONS CTA */}
        <section className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/10 bg-brand-dark px-10 py-20 text-center shadow-soft md:p-24">
          <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 -translate-y-1/3 translate-x-1/3 rounded-full bg-brand-yellow/10 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 -translate-x-1/3 translate-y-1/3 rounded-full bg-brand-blue/20 blur-[100px]" />

          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
            <h2 className="mb-6 font-heading text-4xl tracking-tight text-white md:text-5xl">
              {t(dict, 'about.destinations', 'KCE Destinations')}
            </h2>
            <p className="mb-10 text-lg font-light leading-relaxed text-white/70">
              {t(
                dict,
                'about.dest_text',
                'Desde el Caribe hasta los Andes, nuestra red de anfitriones te espera para mostrarte el lado más auténtico del país.',
              )}
            </p>
            <Button
              asChild
              size="lg"
              className="w-full rounded-full bg-brand-yellow px-10 py-6 text-xs font-bold uppercase tracking-widest text-brand-dark shadow-pop transition-transform hover:-translate-y-1 hover:bg-white sm:w-auto"
            >
              <Link href={withLocale(locale, '/destinations')}>
                {t(dict, 'common.see_all', 'See all')} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
