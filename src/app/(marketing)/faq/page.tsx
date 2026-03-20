import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { HelpCircle, ShieldCheck, CreditCard, Users, RefreshCw, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getDictionary, t, type SupportedLocale } from '@/i18n/getDictionary';

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

function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const dict = await getDictionary(locale);
  return {
    title: `${t(dict, 'faq.title', 'FAQ')} | KCE`,
    description: t(dict, 'faq.subtitle', ''),
    robots: { index: true, follow: true },
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
    <main className="min-h-screen bg-[color:var(--color-bg)] flex flex-col animate-fade-in" id="top">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* HERO */}
      <section className="relative w-full flex flex-col justify-center overflow-hidden bg-[color:var(--color-surface)] border-b border-[color:var(--color-border)] px-6 py-20 md:py-32 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
            <HelpCircle className="h-3 w-3" /> KCE
          </div>
          <h1 className="font-heading text-5xl leading-tight md:text-7xl text-[color:var(--color-text)] tracking-tight mb-6">
            {t(dict, 'faq.title', 'FAQ')}<br />
            <span className="text-brand-blue italic font-light opacity-80">
              {t(dict, 'faq.subtitle', 'Clear answers.')}
            </span>
          </h1>

          {/* Category pills */}
          <nav className="mt-8 flex flex-wrap justify-center gap-3">
            {tags.map((tag) => (
              <a key={tag} href={`#tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-2 text-xs font-semibold text-[color:var(--color-text)] hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all">
                {tag}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* FAQ by category */}
      <div className="mx-auto w-full max-w-3xl px-6 py-16 space-y-16">
        {tags.map((tag) => {
          const TagIcon = tagIcons[tag] || HelpCircle;
          const tagFaqs = faqs.filter((f) => f.tag === tag);
          return (
            <section key={tag} id={`tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="mb-6 flex items-center gap-3 border-b border-[color:var(--color-border)] pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue/10">
                  <TagIcon className="h-4 w-4 text-brand-blue" />
                </div>
                <h2 className="font-heading text-xl text-[color:var(--color-text)] uppercase tracking-wide">{tag}</h2>
                <a href="#top" className="ml-auto text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] hover:text-brand-blue transition-colors">
                  ↑
                </a>
              </div>
              <div className="space-y-3">
                {tagFaqs.map((faq, i) => (
                  <details key={i} className="group rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden">
                    <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 text-sm font-semibold text-[color:var(--color-text)] hover:text-brand-blue transition-colors list-none">
                      {faq.q}
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-border)] text-[color:var(--color-text-muted)] group-open:rotate-180 transition-transform">
                        ↓
                      </span>
                    </summary>
                    <div className="border-t border-[color:var(--color-border)] px-6 py-4 text-sm text-[color:var(--color-text-muted)] leading-relaxed">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* CTA */}
      <section className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] py-16 text-center">
        <div className="mx-auto max-w-xl px-6">
          <h2 className="font-heading text-2xl text-[color:var(--color-text)] mb-3">
            {t(dict, 'faq.cta', "Can't find your answer? Write to us")}
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-full bg-brand-blue text-white hover:bg-brand-blue/90 px-8">
              <Link href={withLocale(locale, '/contact')}>{t(dict, 'common.contact_us', 'Contact us')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
