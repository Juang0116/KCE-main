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
    { icon: Compass,       titleKey: 'about.val1_title', bodyKey: 'about.val1_body' },
    { icon: ShieldCheck,   titleKey: 'about.val2_title', bodyKey: 'about.val2_body' },
    { icon: HeartHandshake,titleKey: 'about.val3_title', bodyKey: 'about.val3_body' },
    { icon: Leaf,          titleKey: 'about.val4_title', bodyKey: 'about.val4_body' },
  ];

  return (
    <main className="w-full bg-base min-h-screen flex flex-col animate-fade-in">

      {/* 01. HERO EDITORIAL (ADN KCE PREMIUM) */}
      <section className="relative min-h-[65vh] w-full flex flex-col justify-center overflow-hidden bg-brand-dark px-6 py-32 text-center border-b border-brand-dark/10">
        {/* Destello de fondo */}
        <div className="absolute top-0 left-1/2 w-full max-w-3xl h-64 bg-brand-blue/20 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
            <Globe2 className="h-3 w-3 text-brand-yellow" /> {t(dict, 'brand.name', 'Knowing Cultures Enterprise')}
          </div>
          
          {/* TITULAR ACTUALIZADO CON LETRA AMARILLA */}
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-white tracking-tight leading-[1.05] mb-8">
            {t(dict, 'about.headline_part1', 'Descubre la Colombia')} <br />
            <span className="text-brand-yellow font-light italic opacity-90">
              {t(dict, 'about.headline_part2', 'que pocos viajeros ven.')}
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg md:text-xl font-light leading-relaxed text-white/70 mb-12">
            {t(dict, 'about.sub', 'Narrativas locales y experiencias auténticas diseñadas para entender la verdadera esencia de nuestro territorio.')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Button asChild size="lg" className="rounded-full bg-brand-yellow text-brand-dark hover:bg-white px-10 py-6 shadow-pop transition-transform hover:-translate-y-1 text-xs font-bold uppercase tracking-widest w-full sm:w-auto">
              <Link href={withLocale(locale, '/tours')}>{t(dict, 'about.cta', 'Explore tours')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-white/30 text-white bg-white/5 hover:bg-white hover:text-brand-dark backdrop-blur-md px-10 py-6 transition-transform hover:-translate-y-1 text-xs font-bold uppercase tracking-widest w-full sm:w-auto">
              <Link href={withLocale(locale, '/contact')}>{t(dict, 'about.cta_contact', 'Contact the team')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* BREADCRUMB SUTIL */}
      <div className="w-full bg-surface border-b border-brand-dark/5 dark:border-white/5 py-3 px-6">
        <div className="mx-auto max-w-[var(--container-max)] flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-80">
          <Link href={withLocale(locale, '/')} className="hover:text-brand-blue transition-colors">Inicio</Link>
          <ArrowRight className="h-3 w-3" />
          <span className="text-main">Nuestra Historia</span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[var(--container-max)] px-6 py-24 md:py-32 flex flex-col gap-24 md:gap-32">

        {/* 02. MISIÓN (MANIFIESTO KCE) */}
        <section className="text-center max-w-4xl mx-auto">
          <h2 className="inline-flex items-center gap-2 font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue mb-8">
            <Compass className="h-3 w-3" /> {t(dict, 'about.mission', 'Our Mission')}
          </h2>
          <p className="font-heading text-3xl md:text-5xl text-main tracking-tight leading-[1.15]">
            &quot;{t(dict, 'about.mission_text', 'Conectar a viajeros conscientes con las raíces culturales más profundas de Colombia a través de rutas curadas por expertos locales.')}&quot;
          </p>
        </section>

        {/* 03. VALORES KCE (Tarjetas Premium) */}
        <section>
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl text-main tracking-tight">Los Pilares de KCE</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {values.map(({ icon: Icon, titleKey, bodyKey }, i) => (
              <div key={i} className="group flex flex-col items-start rounded-[var(--radius-2xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 md:p-12 shadow-soft transition-all duration-500 hover:shadow-pop hover:-translate-y-1 hover:border-brand-blue/30">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-blue/5 border border-brand-blue/10 transition-colors duration-300 group-hover:bg-brand-blue group-hover:text-white text-brand-blue mb-8">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-2xl text-main tracking-tight mb-4 group-hover:text-brand-blue transition-colors">
                  {t(dict, titleKey, '')}
                </h3>
                <p className="text-base font-light text-muted leading-relaxed">
                  {t(dict, bodyKey, '')}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 04. DESTINATIONS CTA */}
        <section className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-brand-dark px-10 py-20 md:p-24 text-center shadow-soft border border-brand-dark/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-yellow/10 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-blue/20 rounded-full blur-[100px] pointer-events-none -translate-x-1/3 translate-y-1/3" />
          
          <div className="relative z-10 mx-auto max-w-2xl flex flex-col items-center">
            <h2 className="font-heading text-4xl md:text-5xl text-white tracking-tight mb-6">
              {t(dict, 'about.destinations', 'KCE Destinations')}
            </h2>
            <p className="text-lg text-white/70 font-light leading-relaxed mb-10">
              {t(dict, 'about.dest_text', 'Desde el Caribe hasta los Andes, nuestra red de anfitriones te espera para mostrarte el lado más auténtico del país.')}
            </p>
            <Button asChild size="lg" className="rounded-full bg-brand-yellow text-brand-dark hover:bg-white px-10 py-6 text-xs font-bold uppercase tracking-widest shadow-pop transition-transform hover:-translate-y-1 w-full sm:w-auto">
              <Link href={withLocale(locale, '/destinations')}>{t(dict, 'common.see_all', 'See all')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>

      </div>
    </main>
  );
}