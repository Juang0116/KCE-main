import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import { 
  ShieldCheck, Lock, CreditCard, HeadphonesIcon, 
  FileText, ShieldAlert, BadgeCheck, Globe, 
  ArrowRight, Landmark, MessageSquare
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
    case 'en': return { badge: 'Trust Center KCE', title: 'Your peace of mind, our standard.', subtitle: 'KCE operates under international security protocols. Encrypted payments, real human support, and transparent policies.', cta: 'Speak with an Expert' };
    case 'fr': return { badge: 'Centre de Confiance', title: 'Votre sérénité, notre priorité.', subtitle: 'KCE fonctionne selon des protocoles de sécurité internationaux. Paiements cryptés, support humain réel et politiques transparentes.', cta: 'Parler à un Expert' };
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
    <main className="min-h-screen bg-[var(--color-bg)] pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* HERO TRUST (PREMIUM INSTITUTIONAL) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center text-white shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[url('/brand/pattern.png')] bg-repeat"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md">
            <ShieldCheck className="h-3 w-3" /> {copy.badge}
          </div>
          <h1 className="font-heading text-4xl leading-tight md:text-6xl lg:text-7xl drop-shadow-xl">
            {copy.title.split(',')[0]}, <br/>
            <span className="text-brand-yellow font-light italic">{copy.title.split(',')[1]}</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
            {copy.subtitle}
          </p>
        </div>
      </section>

      {/* CUADRÍCULA DE PILARES DE SEGURIDAD */}
      <section className="mx-auto max-w-7xl px-6 -mt-12 relative z-20">
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Pagos */}
          <div className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 md:p-14 shadow-2xl transition-all hover:shadow-brand-blue/5">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue">
              <CreditCard className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-3xl text-brand-blue mb-6">Pagos 100% Seguros</h2>
            <ul className="space-y-4 text-base font-light text-[var(--color-text)]/70 mb-10">
              <li className="flex gap-3"><BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0" /> Procesamiento global cifrado vía Stripe.</li>
              <li className="flex gap-3"><BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0" /> Operación transparente en EUR y USD.</li>
              <li className="flex gap-3"><BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0" /> Confirmación inmediata y factura PDF oficial.</li>
            </ul>
            <Link href={withLocale(locale, '/policies/payments')} className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-blue hover:underline">
              Ver política de pagos <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Privacidad */}
          <div className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 md:p-14 shadow-2xl transition-all hover:shadow-brand-blue/5">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-3xl text-brand-blue mb-6">Protección de Datos</h2>
            <ul className="space-y-4 text-base font-light text-[var(--color-text)]/70 mb-10">
              <li className="flex gap-3"><BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0" /> Cumplimiento estricto de Habeas Data.</li>
              <li className="flex gap-3"><BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0" /> Cuentas seguras con accesos protegidos.</li>
              <li className="flex gap-3"><BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0" /> Nunca almacenamos los datos de tu tarjeta.</li>
            </ul>
            <Link href={withLocale(locale, '/privacy')} className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-blue hover:underline">
              Ver aviso de privacidad <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Políticas */}
          <div className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 md:p-14 shadow-2xl transition-all hover:shadow-brand-blue/5">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue">
              <FileText className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-3xl text-brand-blue mb-6">Transparencia Legal</h2>
            <ul className="space-y-4 text-base font-light text-[var(--color-text)]/70 mb-10">
              <li className="flex gap-3"><BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0" /> Términos de servicio claros y accesibles.</li>
              <li className="flex gap-3"><BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0" /> Políticas de cancelación por experiencia.</li>
              <li className="flex gap-3"><BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0" /> Gestión de reembolsos con trazabilidad total.</li>
            </ul>
            <Link href={withLocale(locale, '/terms')} className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-blue hover:underline">
              Ver términos de uso <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Soporte */}
          <div className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 md:p-14 shadow-2xl transition-all hover:shadow-brand-blue/5">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue">
              <HeadphonesIcon className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-3xl text-brand-blue mb-6">Soporte en Destino</h2>
            <ul className="space-y-4 text-base font-light text-[var(--color-text)]/70 mb-10">
              <li className="flex gap-3"><BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0" /> Canal privado de atención desde tu cuenta.</li>
              <li className="flex gap-3"><BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0" /> Asistencia rápida vía WhatsApp en tiempo real.</li>
              <li className="flex gap-3"><BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0" /> Guías locales certificados por KCE.</li>
            </ul>
            <Link href={withLocale(locale, '/contact')} className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-blue hover:underline">
              Ir a Soporte <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

        </div>
      </section>

      {/* SECCIÓN DE CERTIFICACIONES SUTILES */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="flex flex-wrap justify-center items-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
           <div className="flex items-center gap-2 font-bold text-2xl"><Landmark className="h-8 w-8" /> STRIPE</div>
           <div className="flex items-center gap-2 font-bold text-2xl"><Globe className="h-8 w-8" /> HTTPS SECURE</div>
           <div className="flex items-center gap-2 font-bold text-2xl"><ShieldCheck className="h-8 w-8" /> 3D SECURE</div>
        </div>
      </section>

      {/* CTA FINAL DE ACCIÓN */}
      <section className="mx-auto max-w-5xl px-6">
        <div className="rounded-[4rem] bg-brand-blue p-12 md:p-20 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.png')] bg-repeat scale-150"></div>
          <div className="relative z-10">
            <MessageSquare className="mx-auto h-12 w-12 text-brand-yellow mb-8" />
            <h2 className="font-heading text-3xl md:text-5xl mb-6">¿Aún tienes dudas sobre tu reserva?</h2>
            <p className="text-lg font-light text-white/70 mb-10 max-w-2xl mx-auto">
              Nuestro equipo humano está disponible para explicarte cada detalle logístico y de seguridad antes de que realices cualquier pago.
            </p>
            <Button asChild size="lg" className="rounded-full bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90 px-12 shadow-xl">
              <Link href={withLocale(locale, '/contact')}>{copy.cta}</Link>
            </Button>
          </div>
        </div>
      </section>

    </main>
  );
}