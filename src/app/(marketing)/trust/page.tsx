/* src/app/(marketing)/trust/page.tsx */
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  HeadphonesIcon,
  FileText,
  BadgeCheck,
  Globe,
  ArrowRight,
  Landmark,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  Handshake,
  Sparkles,
} from 'lucide-react';

import { absoluteUrl, safeJsonLd } from '@/lib/seoJson';
import { Button } from '@/components/ui/Button';

export const revalidate = 300;

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);
const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(
  /\/+$/,
  '',
);

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;
  const c = await cookies();
  const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
  if (SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;
  return 'es';
}

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

function getCopy(locale: SupportedLocale) {
  switch (locale) {
    case 'en':
      return {
        badge: 'KCE Trust Center',
        title_a: 'Your peace of mind,',
        title_b: 'our priority.',
        subtitle:
          'Knowing Cultures S.A.S. operates under strict international security protocols. Encrypted payments and total transparency.',
        cta: 'Speak with an Expert',
      };
    case 'fr':
      return {
        badge: 'Centre de Confiance KCE',
        title_a: 'Votre sérénité,',
        title_b: 'notre priorité.',
        subtitle:
          'Knowing Cultures S.A.S. fonctionne selon des protocoles de sécurité. Paiements cryptés et transparence totale.',
        cta: 'Parler à un Expert',
      };
    case 'de':
      return {
        badge: 'KCE Vertrauenszentrum',
        title_a: 'Ihre Sicherheit,',
        title_b: 'unser Standard.',
        subtitle:
          'Knowing Cultures S.A.S. arbeitet nach Sicherheitsprotokollen. Verschlüsselte Zahlungen und vollständige Transparenz.',
        cta: 'Mit Experten sprechen',
      };
    default:
      return {
        badge: 'Trust Center KCE',
        title_a: 'Tu tranquilidad,',
        title_b: 'nuestra prioridad.',
        subtitle:
          'Knowing Cultures S.A.S. opera bajo protocolos internacionales de seguridad. Pagos cifrados, certificación local y transparencia total.',
        cta: 'Hablar con un Experto',
      };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const canonicalAbs = absoluteUrl(`/${locale}/trust`);
  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: 'Confianza y Seguridad | Knowing Cultures S.A.S.',
    description:
      'Conoce nuestros protocolos de seguridad: pagos cifrados, protección Habeas Data y respaldo legal institucional.',
    alternates: {
      canonical: canonicalAbs,
      languages: { es: '/es/trust', en: '/en/trust', fr: '/fr/trust', de: '/de/trust' },
    },
  };
}

export default async function TrustPage() {
  const locale = await resolveLocale();
  const copy = getCopy(locale);
  const canonical = absoluteUrl(`/${locale}/trust`);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Confianza y Seguridad — KCE',
    url: canonical,
  };

  return (
    <main className="min-h-screen animate-fade-in overflow-x-hidden bg-base pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      {/* 01. HERO TRUST (ADN KCE PREMIUM) */}
      <section className="relative overflow-hidden border-b border-white/5 bg-brand-dark px-6 py-28 text-center text-white md:py-40">
        {/* Capas de iluminación inmersiva */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-full max-w-4xl -translate-x-1/2 rounded-full bg-brand-blue/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-brand-yellow/5 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.4em] text-white shadow-2xl backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-brand-yellow" /> {copy.badge}
          </div>
          <h1 className="mb-10 font-heading text-6xl leading-[1] tracking-tighter md:text-8xl lg:text-9xl">
            {copy.title_a} <br />
            <span className="font-light italic text-brand-yellow opacity-90">{copy.title_b}</span>
          </h1>
          <p className="mx-auto max-w-3xl text-xl font-light leading-relaxed text-white/60 md:text-2xl">
            {copy.subtitle}
          </p>
        </div>
      </section>

      {/* 02. SECURITY PILLARS GRID (Institutional Cards) */}
      <section className="relative z-20 mx-auto -mt-16 max-w-[var(--container-max)] px-6">
        <div className="grid gap-10 md:grid-cols-2">
          {[
            {
              title: 'Pagos Protegidos',
              icon: CreditCard,
              link: '/policies/payments',
              linkLabel: 'Protocolos de pago',
              points: [
                'Procesamiento cifrado vía Stripe y PayPal.',
                'Precios transparentes en USD/EUR sin cargos ocultos.',
                'Seguridad PCI-DSS Nivel 1 en cada transacción.',
              ],
            },
            {
              title: 'Privacidad de Autor',
              icon: Lock,
              link: '/privacy',
              linkLabel: 'Aviso de Privacidad',
              points: [
                'Tratamiento según Ley 1581 de 2012 (Habeas Data).',
                'Derecho de acceso y supresión garantizado.',
                'Protocolos TLS 1.3 para el blindaje de datos.',
              ],
            },
            {
              title: 'Estatura Legal',
              icon: Landmark,
              link: '/terms',
              linkLabel: 'Términos Legales',
              points: [
                'Operado por Knowing Cultures S.A.S. (NIT en trámite).',
                'Sede oficial en Bogotá, República de Colombia.',
                'Contratos vinculantes bajo legislación nacional.',
              ],
            },
            {
              title: 'Garantía Operativa',
              icon: Handshake,
              link: '/policies/cancellation',
              linkLabel: 'Política de Cancelación',
              points: [
                'Reembolso del 100% por cancelaciones previas a 48h.',
                'Gestión humana directa ante imprevistos técnicos.',
                'Seguro de asistencia incluido en expediciones selectas.',
              ],
            },
          ].map((pillar, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-12 shadow-soft transition-all duration-700 hover:-translate-y-2 hover:shadow-pop dark:border-white/5 md:p-16"
            >
              {/* Icono de fondo (Watermark effect) */}
              <pillar.icon className="absolute -bottom-10 -right-10 h-64 w-64 -rotate-12 text-brand-blue/[0.02] transition-transform duration-[2000ms] group-hover:rotate-0 group-hover:scale-110" />

              <div className="relative z-10">
                <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-blue/10 bg-brand-blue/5 text-brand-blue transition-all duration-500 group-hover:scale-110 group-hover:bg-brand-blue group-hover:text-white">
                  <pillar.icon className="h-8 w-8" />
                </div>

                <h2 className="mb-8 font-heading text-4xl tracking-tight text-main">
                  {pillar.title}
                </h2>

                <ul className="mb-12 space-y-6">
                  {pillar.points.map((point, pIdx) => (
                    <li
                      key={pIdx}
                      className="flex items-start gap-4 text-base font-light leading-relaxed text-muted"
                    >
                      <BadgeCheck className="mt-1 h-5 w-5 shrink-0 text-brand-yellow" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={withLocale(locale, pillar.link)}
                  className="group/link inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue transition-all hover:text-brand-dark"
                >
                  {pillar.linkLabel}{' '}
                  <ChevronRight className="h-4 w-4 transition-transform group-hover/link:translate-x-2" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 03. INSTITUTIONAL SEALS (Whisper of Authority) */}
      <section className="mx-auto max-w-5xl px-6 py-28 md:py-44">
        <div className="mb-16 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted opacity-40">
            Infraestructura de Grado Global
          </p>
        </div>
        <div className="bg-surface-2/30 flex flex-wrap items-center justify-center gap-12 rounded-[var(--radius-3xl)] border border-brand-dark/5 px-12 py-12 opacity-40 grayscale transition-all duration-1000 hover:opacity-100 hover:grayscale-0 md:gap-20">
          <div className="flex items-center gap-3 text-xl font-bold tracking-tighter text-main">
            <Landmark className="h-6 w-6" /> STRIPE
          </div>
          <div className="h-2 w-2 rounded-full bg-brand-blue" />
          <div className="flex items-center gap-3 text-xl font-bold tracking-tighter text-main">
            <ShieldCheck className="h-6 w-6" /> PCI-DSS
          </div>
          <div className="h-2 w-2 rounded-full bg-brand-blue" />
          <div className="flex items-center gap-3 text-xl font-bold tracking-tighter text-main">
            <Globe className="h-6 w-6" /> TLS 1.3 SECURE
          </div>
          <div className="h-2 w-2 rounded-full bg-brand-blue" />
          <div className="flex items-center gap-3 text-xl font-bold uppercase tracking-tighter text-main">
            Law 1581 Compliant
          </div>
        </div>
      </section>

      {/* 04. CONCIERGE CTA (The Human Touch) */}
      <section className="mx-auto max-w-5xl px-6">
        <div className="group relative overflow-hidden rounded-[var(--radius-[40px])] bg-brand-dark p-12 text-center text-white shadow-pop md:p-24">
          <div className="absolute left-0 top-0 h-full w-full bg-[url('/brand/pattern.svg')] bg-repeat opacity-[0.03]" />
          <div className="absolute left-0 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-blue/10 blur-[120px]" />

          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
            <div className="mb-12 flex h-24 w-24 items-center justify-center rounded-[2.5rem] border border-white/10 bg-white/5 text-brand-yellow shadow-inner transition-transform duration-700 group-hover:rotate-6 group-hover:scale-110">
              <HeadphonesIcon className="h-12 w-12" />
            </div>
            <h2 className="mb-10 font-heading text-4xl leading-[1.1] tracking-tight md:text-7xl">
              ¿Prefieres una consulta privada?
            </h2>
            <p className="mb-16 text-xl font-light leading-relaxed text-white/60 md:text-2xl">
              Nuestro concierge está a tu disposición para aclarar cualquier punto de nuestros
              términos legales o resolver dudas técnicas antes de confirmar tu expedición.
            </p>
            <Button
              asChild
              size="lg"
              className="h-auto rounded-full border-transparent bg-brand-blue px-16 py-8 text-white shadow-2xl transition-all hover:bg-white hover:text-brand-dark"
            >
              <Link
                href={withLocale(locale, '/contact')}
                className="flex items-center gap-5 text-xs font-bold uppercase tracking-[0.3em]"
              >
                {copy.cta} <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Marca de agua institucional sutil */}
      <div className="py-20 text-center opacity-30">
        <div className="mb-6 flex justify-center">
          <Landmark className="h-8 w-8 text-brand-blue" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.5em]">
          Knowing Cultures S.A.S. • Bogotá, Colombia • 2026
        </p>
      </div>
    </main>
  );
}
