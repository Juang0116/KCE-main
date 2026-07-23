/* src/app/(marketing)/faq/page.tsx */
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import {
  HelpCircle,
  ShieldCheck,
  CreditCard,
  Users,
  RefreshCw,
  MessageCircle,
  ArrowRight,
  Globe2,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getDictionary, t, type SupportedLocale } from '@/i18n/getDictionary';
import { absoluteUrl, safeJsonLd } from '@/lib/seoJson';

const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const fromH = (h.get('x-kce-locale') || '').toLowerCase();
  if (SUPPORTED.has(fromH as SupportedLocale)) return fromH as SupportedLocale;
  const c = await cookies();
  const v = c.get('kce.locale')?.value?.toLowerCase();
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
    title: `Soporte y Preguntas Frecuentes | Knowing Cultures S.A.S.`,
    description: t(
      dict,
      'faq.subtitle',
      'Respuestas claras sobre seguridad, pagos y logística para tu viaje por Colombia.',
    ),
    robots: { index: true, follow: true },
    alternates: { canonical: absoluteUrl(`/${locale}/faq`) },
  };
}

type FaqItem = { q: string; a: string; tag: string };

export default async function FAQPage() {
  const locale = await resolveLocale();
  const dict = await getDictionary(locale);

  const faqs: FaqItem[] = (dict as any).faq_data || [];
  const tags = [...new Set(faqs.map((f) => f.tag))];

  const tagIcons: Record<string, any> = {
    Seguridad: ShieldCheck,
    Safety: ShieldCheck,
    Sicherheit: ShieldCheck,
    Sécurité: ShieldCheck,
    Pagos: CreditCard,
    Payments: CreditCard,
    Zahlungen: CreditCard,
    Paiements: CreditCard,
    Cuenta: Users,
    Account: Users,
    Konto: Users,
    Compte: Users,
    Cambios: RefreshCw,
    Changes: RefreshCw,
    Änderungen: RefreshCw,
    Modifications: RefreshCw,
    Soporte: MessageCircle,
    Support: MessageCircle,
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <main
      className="flex min-h-screen animate-fade-in flex-col bg-base"
      id="top"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      {/* 01. HERO EDITORIAL (ADN KCE PREMIUM) */}
      <section className="relative overflow-hidden border-b border-white/5 bg-brand-dark px-6 py-24 text-center md:py-40">
        {/* Capas de iluminación inmersiva */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-full max-w-4xl -translate-x-1/2 rounded-full bg-brand-blue/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-brand-yellow/5 blur-[120px]" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.4em] text-white shadow-xl backdrop-blur-md">
            <HelpCircle className="h-3.5 w-3.5 text-brand-yellow" /> Knowing Cultures S.A.S. •
            Soporte
          </div>

          <h1 className="mb-10 font-heading text-6xl leading-[1] tracking-tighter text-white md:text-8xl lg:text-9xl">
            {t(dict, 'faq.title', 'FAQ')} <br />
            <span className="font-light italic text-brand-yellow opacity-90">
              {t(dict, 'faq.subtitle', 'Respuestas claras.')}
            </span>
          </h1>

          {/* Category pills (Editorial Glassmorphism) */}
          <nav className="mt-12 flex max-w-4xl flex-wrap justify-center gap-4">
            {tags.map((tag) => (
              <a
                key={tag}
                href={`#tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-7 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 shadow-xl backdrop-blur-lg transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:text-brand-dark"
              >
                {tag}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* BREADCRUMB SUTIL */}
      <div className="w-full border-b border-brand-dark/5 bg-surface px-6 py-4 dark:border-white/5">
        <div className="mx-auto flex max-w-[var(--container-max)] items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-muted opacity-80">
          <Link
            href={withLocale(locale, '/')}
            className="transition-colors hover:text-brand-blue"
          >
            Inicio
          </Link>
          <ArrowRight className="h-3 w-3 opacity-30" />
          <span className="text-main">Centro de Ayuda y FAQ</span>
        </div>
      </div>

      {/* 02. FAQ POR CATEGORÍAS (Magazine Layout) */}
      <div className="mx-auto w-full max-w-4xl space-y-28 px-6 py-24 md:py-40">
        {tags.map((tag) => {
          const TagIcon = tagIcons[tag] || HelpCircle;
          const tagFaqs = faqs.filter((f) => f.tag === tag);
          return (
            <section
              key={tag}
              id={`tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
              className="scroll-mt-32"
            >
              <div className="mb-12 flex items-center justify-between border-b border-brand-dark/5 pb-8 dark:border-white/5">
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-blue/10 bg-brand-blue/5 text-brand-blue shadow-sm">
                    <TagIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="font-heading text-4xl tracking-tight text-main">{tag}</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                      Sección especializada
                    </p>
                  </div>
                </div>
                <a
                  href="#top"
                  className="group hidden items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted transition-all hover:text-brand-blue md:flex"
                >
                  Volver arriba{' '}
                  <ArrowRight className="h-3 w-3 -rotate-90 transition-transform group-hover:-translate-y-1" />
                </a>
              </div>

              <div className="space-y-6">
                {tagFaqs.map((faq, i) => (
                  <details
                    key={i}
                    className="group overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface transition-all duration-500 hover:border-brand-blue/20 hover:shadow-pop dark:border-white/5"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-8 py-8 font-heading text-xl text-main outline-none transition-colors hover:text-brand-blue md:px-12 md:py-10 md:text-2xl">
                      <span className="leading-tight tracking-tight">{faq.q}</span>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-brand-blue shadow-inner transition-all duration-500 group-open:bg-brand-blue group-open:text-white">
                        <ChevronDown className="h-5 w-5 transition-transform duration-500 group-open:rotate-180" />
                      </div>
                    </summary>
                    <div className="bg-surface-2/30 animate-in slide-in-from-top-4 border-t border-brand-dark/5 px-8 py-10 text-lg font-light leading-relaxed text-muted duration-500 dark:border-white/5 md:px-12 md:py-14">
                      <div className="max-w-2xl">{faq.a}</div>
                      <div className="mt-10 flex items-center gap-4 border-t border-brand-dark/5 pt-8">
                        <div className="h-1.5 w-1.5 rounded-full bg-brand-yellow" />
                        <p className="text-[10px] font-bold uppercase italic tracking-widest opacity-40">
                          Información validada por Knowing Cultures S.A.S.
                        </p>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* 03. CTA FINAL DE SOPORTE (Premium Glassmorphism) */}
      <section className="border-t border-brand-dark/5 bg-surface-2 py-24 md:py-40">
        <div className="mx-auto max-w-5xl px-6">
          <div className="group relative overflow-hidden rounded-[var(--radius-[40px])] border border-brand-dark/5 bg-surface p-12 text-center shadow-soft md:p-24">
            {/* Brillo dinámico */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-blue/5 blur-[100px] transition-transform duration-1000 group-hover:scale-150" />

            <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
              <div className="mb-10 flex h-20 w-20 items-center justify-center rounded-3xl border border-brand-dark/5 bg-surface-2 text-brand-blue shadow-sm transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <MessageCircle className="h-10 w-10" />
              </div>
              <h2 className="mb-8 font-heading text-4xl tracking-tight text-main md:text-6xl">
                {t(dict, 'faq.cta', '¿Aún tienes dudas?')}
              </h2>
              <p className="mb-14 text-xl font-light leading-relaxed text-muted md:text-2xl">
                Nuestro equipo de Conciergerie está disponible para resolver cualquier detalle
                logístico o técnico antes de tu viaje.
              </p>
              <div className="flex w-full flex-col justify-center gap-6 sm:w-auto sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full border-transparent bg-brand-blue px-14 py-8 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-pop transition-all hover:-translate-y-1 hover:bg-brand-dark"
                >
                  <Link
                    href={withLocale(locale, '/contact')}
                    className="flex items-center justify-center gap-3"
                  >
                    Hablar con un Experto <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full border-brand-dark/10 bg-surface px-14 py-8 text-xs font-bold uppercase tracking-[0.2em] text-main transition-all hover:-translate-y-1 hover:bg-surface-2"
                >
                  <Link href="/trust">Centro de Confianza</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marca de agua institucional sutil */}
      <div className="bg-surface-2 py-12 text-center opacity-30">
        <Globe2 className="mx-auto mb-4 h-8 w-8 text-brand-blue opacity-20" />
        <p className="text-[9px] font-bold uppercase tracking-[0.5em]">
          Knowing Cultures S.A.S. • Bogotá, Colombia • 2026
        </p>
      </div>
    </main>
  );
}
