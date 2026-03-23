/* src/app/(marketing)/faq/page.tsx */
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { HelpCircle, ShieldCheck, CreditCard, Users, RefreshCw, MessageCircle, ArrowRight, Globe2, Sparkles, ChevronDown } from 'lucide-react';
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
    description: t(dict, 'faq.subtitle', 'Respuestas claras sobre seguridad, pagos y logística para tu viaje por Colombia.'),
    robots: { index: true, follow: true },
    alternates: { canonical: absoluteUrl(`/${locale}/faq`) }
  };
}

type FaqItem = { q: string; a: string; tag: string };

export default async function FAQPage() {
  const locale = await resolveLocale();
  const dict = await getDictionary(locale);

  const faqs: FaqItem[] = (dict as any).faq_data || [];
  const tags = [...new Set(faqs.map((f) => f.tag))];

  const tagIcons: Record<string, any> = {
    'Seguridad': ShieldCheck, 'Safety': ShieldCheck, 'Sicherheit': ShieldCheck, 'Sécurité': ShieldCheck,
    'Pagos': CreditCard, 'Payments': CreditCard, 'Zahlungen': CreditCard, 'Paiements': CreditCard,
    'Cuenta': Users, 'Account': Users, 'Konto': Users, 'Compte': Users,
    'Cambios': RefreshCw, 'Changes': RefreshCw, 'Änderungen': RefreshCw, 'Modifications': RefreshCw,
    'Soporte': MessageCircle, 'Support': MessageCircle,
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
    <main className="min-h-screen bg-base flex flex-col animate-fade-in" id="top">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* 01. HERO EDITORIAL (ADN KCE PREMIUM) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-40 text-center border-b border-white/5">
        {/* Capas de iluminación inmersiva */}
        <div className="absolute top-0 left-1/2 w-full max-w-4xl h-80 bg-brand-blue/10 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-yellow/5 rounded-full blur-[120px] pointer-events-none translate-x-1/3 translate-y-1/3" />
        
        <div className="relative z-10 mx-auto max-w-5xl flex flex-col items-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.4em] text-white shadow-xl backdrop-blur-md">
            <HelpCircle className="h-3.5 w-3.5 text-brand-yellow" /> Knowing Cultures S.A.S. • Soporte
          </div>
          
          <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl text-white tracking-tighter leading-[1] mb-10">
            {t(dict, 'faq.title', 'FAQ')} <br />
            <span className="text-brand-yellow font-light italic opacity-90">
              {t(dict, 'faq.subtitle', 'Respuestas claras.')}
            </span>
          </h1>

          {/* Category pills (Editorial Glassmorphism) */}
          <nav className="mt-12 flex flex-wrap justify-center gap-4 max-w-4xl">
            {tags.map((tag) => (
              <a key={tag} href={`#tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-lg px-7 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-white/70 hover:bg-white hover:text-brand-dark hover:-translate-y-1 transition-all duration-500 shadow-xl">
                {tag}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* BREADCRUMB SUTIL */}
      <div className="w-full bg-surface border-b border-brand-dark/5 dark:border-white/5 py-4 px-6">
        <div className="mx-auto max-w-[var(--container-max)] flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-muted opacity-80">
          <Link href={withLocale(locale, '/')} className="hover:text-brand-blue transition-colors">Inicio</Link>
          <ArrowRight className="h-3 w-3 opacity-30" />
          <span className="text-main">Centro de Ayuda y FAQ</span>
        </div>
      </div>

      {/* 02. FAQ POR CATEGORÍAS (Magazine Layout) */}
      <div className="mx-auto w-full max-w-4xl px-6 py-24 md:py-40 space-y-28">
        {tags.map((tag) => {
          const TagIcon = tagIcons[tag] || HelpCircle;
          const tagFaqs = faqs.filter((f) => f.tag === tag);
          return (
            <section key={tag} id={`tag-${tag.toLowerCase().replace(/\s+/g, '-')}`} className="scroll-mt-32">
              <div className="mb-12 flex items-center justify-between border-b border-brand-dark/5 dark:border-white/5 pb-8">
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/5 border border-brand-blue/10 text-brand-blue shadow-sm">
                    <TagIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="font-heading text-4xl text-main tracking-tight">{tag}</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">Sección especializada</p>
                  </div>
                </div>
                <a href="#top" className="group hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-brand-blue transition-all">
                  Volver arriba <ArrowRight className="h-3 w-3 -rotate-90 group-hover:-translate-y-1 transition-transform" />
                </a>
              </div>
              
              <div className="space-y-6">
                {tagFaqs.map((faq, i) => (
                  <details key={i} className="group rounded-[var(--radius-2xl)] border border-brand-dark/5 dark:border-white/5 bg-surface overflow-hidden transition-all duration-500 hover:border-brand-blue/20 hover:shadow-pop">
                    <summary className="flex cursor-pointer items-center justify-between gap-6 px-8 md:px-12 py-8 md:py-10 text-xl md:text-2xl font-heading text-main hover:text-brand-blue transition-colors list-none outline-none">
                      <span className="tracking-tight leading-tight">{faq.q}</span>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-brand-blue group-open:bg-brand-blue group-open:text-white transition-all duration-500 shadow-inner">
                        <ChevronDown className="h-5 w-5 group-open:rotate-180 transition-transform duration-500" />
                      </div>
                    </summary>
                    <div className="border-t border-brand-dark/5 dark:border-white/5 px-8 md:px-12 py-10 md:py-14 text-lg font-light text-muted leading-relaxed bg-surface-2/30 animate-in slide-in-from-top-4 duration-500">
                      <div className="max-w-2xl">
                         {faq.a}
                      </div>
                      <div className="mt-10 pt-8 border-t border-brand-dark/5 flex items-center gap-4">
                         <div className="h-1.5 w-1.5 rounded-full bg-brand-yellow" />
                         <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 italic">Información validada por Knowing Cultures S.A.S.</p>
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
      <section className="bg-surface-2 border-t border-brand-dark/5 py-24 md:py-40">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-[var(--radius-[40px])] border border-brand-dark/5 bg-surface p-12 md:p-24 text-center shadow-soft group">
            {/* Brillo dinámico */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none transition-transform duration-1000 group-hover:scale-150" />
            
            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-2 border border-brand-dark/5 text-brand-blue mb-10 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
                <MessageCircle className="h-10 w-10" />
              </div>
              <h2 className="font-heading text-4xl md:text-6xl text-main tracking-tight mb-8">
                {t(dict, 'faq.cta', "¿Aún tienes dudas?")}
              </h2>
              <p className="text-xl md:text-2xl font-light text-muted leading-relaxed mb-14">
                Nuestro equipo de Conciergerie está disponible para resolver cualquier detalle logístico o técnico antes de tu viaje.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6 w-full sm:w-auto">
                <Button asChild size="lg" className="rounded-full bg-brand-blue text-white hover:bg-brand-dark px-14 py-8 text-xs font-bold uppercase tracking-[0.2em] shadow-pop transition-all hover:-translate-y-1 border-transparent">
                  <Link href={withLocale(locale, '/contact')} className="flex items-center justify-center gap-3">
                    Hablar con un Experto <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-brand-dark/10 text-main bg-surface hover:bg-surface-2 px-14 py-8 text-xs font-bold uppercase tracking-[0.2em] transition-all hover:-translate-y-1">
                  <Link href="/trust">Centro de Confianza</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marca de agua institucional sutil */}
      <div className="py-12 text-center bg-surface-2 opacity-30">
         <Globe2 className="h-8 w-8 mx-auto mb-4 text-brand-blue opacity-20" />
         <p className="text-[9px] font-bold uppercase tracking-[0.5em]">Knowing Cultures S.A.S. • Bogotá, Colombia • 2026</p>
      </div>
    </main>
  );
}