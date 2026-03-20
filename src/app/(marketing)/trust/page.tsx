import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import { getDictionary, t } from '@/i18n/getDictionary';
import { 
  ShieldCheck, Lock, CreditCard, HeadphonesIcon, 
  FileText, ShieldAlert, BadgeCheck, Globe, 
  ArrowRight, Landmark, MessageSquare, ChevronRight
} from 'lucide-react';

import { SITE_URL } from '@/lib/env';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';
import { Button } from '@/components/ui/Button';

export const revalidate = 300;

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);
const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers(); const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;
  const c = await cookies(); const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
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
    case 'en': return { badge: 'KCE Trust Center', title: 'Your peace of mind, our standard.', subtitle: 'KCE operates under international security protocols. Encrypted payments, real human support, and total transparency.', cta: 'Speak with an Expert' };
    case 'fr': return { badge: 'Centre de Confiance KCE', title: 'Votre sérénité, notre priorité.', subtitle: 'KCE fonctionne selon des protocoles de sécurité internationaux. Paiements cryptés, support humain réel et politiques transparentes.', cta: 'Parler à un Expert' };
    case 'de': return { badge: 'KCE Vertrauenszentrum', title: 'Ihre Sicherheit, unser Standard.', subtitle: 'KCE arbeitet nach internationalen Sicherheitsprotokollen. Verschlüsselte Zahlungen, echter menschlicher Support und vollständige Transparenz.', cta: 'Mit einem Experten sprechen' };
    default: return { badge: 'Trust Center KCE', title: 'Tu tranquilidad, nuestra prioridad.', subtitle: 'KCE opera bajo protocolos internacionales de seguridad. Pagos cifrados, soporte humano real y políticas de transparencia total.', cta: 'Hablar con un Experto' };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const canonicalAbs = absoluteUrl(`/${locale}/trust`);
  return {
    metadataBase: new URL(BASE_SITE_URL), 
    title: 'Confianza y Seguridad | KCE Colombia', 
    description: 'Pagos seguros con Stripe, protección de datos y soporte 24/7. Conoce cómo KCE protege tu viaje.',
    alternates: { canonical: canonicalAbs, languages: { es: '/es/trust', en: '/en/trust', fr: '/fr/trust', de: '/de/trust' } },
  };
}

export default async function TrustPage() {
  const locale = await resolveLocale();
  const copy = getCopy(locale);
  const canonical = absoluteUrl(`/${locale}/trust`);
  const jsonLd = { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Confianza y Seguridad — KCE', url: canonical };

  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] pb-32 animate-fade-in">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* 01. HERO TRUST (Institutional Gold) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-28 md:py-40 text-center text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.png')] bg-repeat" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/50 via-brand-dark to-[var(--color-bg)]" />
        
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue backdrop-blur-md shadow-2xl">
            <ShieldCheck className="h-4 w-4" /> {copy.badge}
          </div>
          <h1 className="font-heading text-5xl leading-[1.1] md:text-7xl lg:text-8xl tracking-tight mb-10">
            {copy.title.split(',')[0]}, <br/>
            <span className="text-brand-blue font-light italic">{copy.title.split(',')[1]}</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl font-light leading-relaxed text-white/50 md:text-2xl">
            {copy.subtitle}
          </p>
        </div>
      </section>

      {/* 02. SECURITY PILLARS GRID */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 -mt-20 relative z-20">
        <div className="grid gap-8 md:grid-cols-2">
          
          {/* Pillar Card Template */}
          {[
            {
              title: 'Pagos 100% Seguros',
              icon: CreditCard,
              link: '/policies/payments',
              linkLabel: 'Ver política de pagos',
              points: [
                'Procesamiento global cifrado vía Stripe.',
                'Operación transparente en EUR y USD.',
                'Confirmación inmediata y factura PDF oficial.'
              ]
            },
            {
              title: 'Protección de Datos',
              icon: Lock,
              link: '/privacy',
              linkLabel: 'Ver aviso de privacidad',
              points: [
                'Cumplimiento estricto de Habeas Data.',
                'Cuentas seguras con accesos protegidos.',
                'Nunca almacenamos los datos de tu tarjeta.'
              ]
            },
            {
              title: 'Transparencia Legal',
              icon: FileText,
              link: '/terms',
              linkLabel: 'Ver términos de uso',
              points: [
                'Términos de servicio claros y accesibles.',
                'Políticas de cancelación por experiencia.',
                'Gestión de reembolsos con trazabilidad total.'
              ]
            },
            {
              title: 'Soporte en Destino',
              icon: HeadphonesIcon,
              link: '/contact',
              linkLabel: 'Ir a Soporte',
              points: [
                'Canal privado de atención desde tu cuenta.',
                'Asistencia rápida vía WhatsApp en tiempo real.',
                'Guías locales certificados por KCE.'
              ]
            }
          ].map((pillar, idx) => (
            <div key={idx} className="group rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-12 md:p-16 shadow-soft hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden relative">
              {/* Pillar Accent Icon (Background) */}
              <pillar.icon className="absolute -bottom-10 -right-10 h-48 w-48 text-brand-blue/[0.03] -rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-0" />
              
              <div className="relative z-10">
                <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] text-brand-blue shadow-sm group-hover:bg-brand-blue group-hover:text-white transition-all duration-500">
                  <pillar.icon className="h-8 w-8" />
                </div>
                <h2 className="font-heading text-3xl text-[color:var(--color-text)] mb-8 tracking-tight">{pillar.title}</h2>
                <ul className="space-y-5 mb-12">
                  {pillar.points.map((point, pIdx) => (
                    <li key={pIdx} className="flex gap-4 items-start text-base font-light text-[color:var(--color-text-muted)]">
                      <BadgeCheck className="h-5 w-5 text-brand-yellow shrink-0 mt-0.5" /> 
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Link href={withLocale(locale, pillar.link)} className="group/link inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                  {pillar.linkLabel} <ChevronRight className="h-3 w-3 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}

        </div>
      </section>

      {/* 03. TRUST LOGOS (Institutional Whisper) */}
      <section className="mx-auto max-w-5xl px-6 py-32">
        <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/30 px-12 py-8 flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
           <div className="flex items-center gap-3 font-bold text-xl tracking-tighter"><Landmark className="h-6 w-6" /> STRIPE</div>
           <div className="flex items-center gap-3 font-bold text-xl tracking-tighter"><Globe className="h-6 w-6" /> TLS 1.3 SECURE</div>
           <div className="flex items-center gap-3 font-bold text-xl tracking-tighter"><ShieldCheck className="h-6 w-6" /> PCI-DSS</div>
           <div className="flex items-center gap-3 font-bold text-xl tracking-tighter uppercase">3D Secure</div>
        </div>
      </section>

      {/* 04. CONCIERGE CTA (Final Trust) */}
      <section className="mx-auto max-w-[var(--container-max)] px-6">
        <div className="rounded-[var(--radius-2xl)] bg-brand-blue p-16 md:p-28 text-center text-white shadow-pop relative overflow-hidden group">
          {/* Decorative Rings */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/[0.03] rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-yellow/[0.03] rounded-full translate-x-1/3 translate-y-1/3" />
          
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <div className="h-20 w-20 flex items-center justify-center rounded-3xl bg-white/10 border border-white/10 text-brand-yellow mb-10 shadow-inner group-hover:rotate-12 transition-transform duration-700">
              <MessageSquare className="h-10 w-10 fill-current" />
            </div>
            <h2 className="font-heading text-4xl md:text-6xl mb-8 tracking-tight">¿Aún tienes dudas sobre tu reserva?</h2>
            <p className="text-xl font-light text-white/60 mb-12 leading-relaxed">
              Nuestro equipo humano está disponible para explicarte cada detalle logístico y de seguridad antes de que realices cualquier pago.
            </p>
            <Button asChild className="rounded-full bg-brand-yellow text-brand-blue hover:bg-white px-14 py-8 h-auto shadow-2xl transition-all group/btn">
              <Link href={withLocale(locale, '/contact')} className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-4">
                {copy.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

    </main>
  );
}