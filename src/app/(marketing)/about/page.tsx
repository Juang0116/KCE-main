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
    <main className="w-full bg-[color:var(--color-bg)] min-h-screen flex flex-col animate-fade-in">

      {/* HERO */}
      <section className="relative w-full flex flex-col justify-center overflow-hidden bg-[color:var(--color-surface)] border-b border-[color:var(--color-border)] px-6 py-20 md:py-32 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
            <Globe2 className="h-3 w-3 text-brand-blue" /> {t(dict, 'brand.name', 'Knowing Cultures Enterprise')}
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl text-[color:var(--color-text)] tracking-tight mb-6 leading-tight">
            {t(dict, 'about.headline', 'Discover the Colombia few travelers see')}
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-[color:var(--color-text-muted)] md:text-xl">
            {t(dict, 'about.sub', '')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full bg-brand-blue text-white hover:bg-brand-blue/90 px-10">
              <Link href={withLocale(locale, '/tours')}>{t(dict, 'about.cta', 'Explore tours')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-10">
              <Link href={withLocale(locale, '/contact')}>{t(dict, 'about.cta_contact', 'Contact the team')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-6 py-24 flex flex-col gap-24">

        {/* MISSION */}
        <section className="text-center max-w-3xl mx-auto">
          <h2 className="font-heading text-sm font-bold uppercase tracking-[0.3em] text-[color:var(--color-text-muted)] mb-6">
            {t(dict, 'about.mission', 'Our Mission')}
          </h2>
          <p className="text-2xl md:text-3xl font-light leading-relaxed text-[color:var(--color-text)] tracking-tight">
            &quot;{t(dict, 'about.mission_text', '')}&quot;
          </p>
        </section>

        {/* VALUES */}
        <section className="grid gap-12 md:grid-cols-2">
          {values.map(({ icon: Icon, titleKey, bodyKey }, i) => (
            <div key={i} className="flex items-start gap-5 group">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 transition-colors group-hover:bg-brand-blue">
                <Icon className="h-6 w-6 text-brand-blue transition-colors group-hover:text-white" />
              </div>
              <div>
                <h3 className="font-heading text-xl text-[color:var(--color-text)]">{t(dict, titleKey, '')}</h3>
                <p className="mt-2 text-[color:var(--color-text-muted)] leading-relaxed">{t(dict, bodyKey, '')}</p>
              </div>
            </div>
          ))}
        </section>

        {/* DESTINATIONS */}
        <section className="rounded-3xl bg-brand-blue p-10 md:p-16 text-white text-center">
          <h2 className="font-heading text-3xl mb-4">{t(dict, 'about.destinations', 'KCE Destinations')}</h2>
          <p className="text-lg text-white/80 font-light max-w-2xl mx-auto">{t(dict, 'about.dest_text', '')}</p>
          <Button asChild className="mt-8 rounded-full bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90 px-8">
            <Link href={withLocale(locale, '/destinations')}>{t(dict, 'common.see_all', 'See all')} →</Link>
          </Button>
        </section>

      </div>
    </main>
  );
}
