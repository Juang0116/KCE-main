/* src/app/(marketing)/trust/page.tsx */
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import { 
  ShieldCheck, Lock, CreditCard, HeadphonesIcon, 
  FileText, BadgeCheck, Globe, 
  ArrowRight, Landmark, MessageSquare, ChevronRight,
  ShieldAlert, UserCheck, Handshake, Sparkles
} from 'lucide-react';

import { absoluteUrl, safeJsonLd } from '@/lib/seoJson';
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
    case 'en': return { badge: 'KCE Trust Center', title_a: 'Your peace of mind,', title_b: 'our priority.', subtitle: 'Knowing Cultures S.A.S. operates under strict international security protocols. Encrypted payments and total transparency.', cta: 'Speak with an Expert' };
    case 'fr': return { badge: 'Centre de Confiance KCE', title_a: 'Votre sérénité,', title_b: 'notre priorité.', subtitle: 'Knowing Cultures S.A.S. fonctionne selon des protocoles de sécurité. Paiements cryptés et transparence totale.', cta: 'Parler à un Expert' };
    case 'de': return { badge: 'KCE Vertrauenszentrum', title_a: 'Ihre Sicherheit,', title_b: 'unser Standard.', subtitle: 'Knowing Cultures S.A.S. arbeitet nach Sicherheitsprotokollen. Verschlüsselte Zahlungen und vollständige Transparenz.', cta: 'Mit Experten sprechen' };
    default: return { badge: 'Trust Center KCE', title_a: 'Tu tranquilidad,', title_b: 'nuestra prioridad.', subtitle: 'Knowing Cultures S.A.S. opera bajo protocolos internacionales de seguridad. Pagos cifrados, certificación local y transparencia total.', cta: 'Hablar con un Experto' };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const canonicalAbs = absoluteUrl(`/${locale}/trust`);
  return {
    metadataBase: new URL(BASE_SITE_URL), 
    title: 'Confianza y Seguridad | Knowing Cultures S.A.S.', 
    description: 'Conoce nuestros protocolos de seguridad: pagos cifrados, protección Habeas Data y respaldo legal institucional.',
    alternates: { canonical: canonicalAbs, languages: { es: '/es/trust', en: '/en/trust', fr: '/fr/trust', de: '/de/trust' } },
  };
}

export default async function TrustPage() {
  const locale = await resolveLocale();
  const copy = getCopy(locale);
  const canonical = absoluteUrl(`/${locale}/trust`);
  const jsonLd = { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Confianza y Seguridad — KCE', url: canonical };

  return (
    <main className="min-h-screen bg-base pb-32 animate-fade-in overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* 01. HERO TRUST (ADN KCE PREMIUM) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-28 md:py-40 text-center text-white border-b border-white/5">
        {/* Capas de iluminación inmersiva */}
        <div className="absolute top-0 left-1/2 w-full max-w-4xl h-80 bg-brand-blue/10 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-yellow/5 rounded-full blur-[120px] pointer-events-none translate-x-1/3 translate-y-1/3" />
        
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.4em] text-white backdrop-blur-md shadow-2xl">
            <ShieldCheck className="h-4 w-4 text-brand-yellow" /> {copy.badge}
          </div>
          <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl tracking-tighter leading-[1] mb-10">
            {copy.title_a} <br/>
            <span className="text-brand-yellow font-light italic opacity-90">{copy.title_b}</span>
          </h1>
          <p className="mx-auto max-w-3xl text-xl md:text-2xl font-light leading-relaxed text-white/60">
            {copy.subtitle}
          </p>
        </div>
      </section>

      {/* 02. SECURITY PILLARS GRID (Institutional Cards) */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 -mt-16 relative z-20">
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
                'Seguridad PCI-DSS Nivel 1 en cada transacción.'
              ]
            },
            {
              title: 'Privacidad de Autor',
              icon: Lock,
              link: '/privacy',
              linkLabel: 'Aviso de Privacidad',
              points: [
                'Tratamiento según Ley 1581 de 2012 (Habeas Data).',
                'Derecho de acceso y supresión garantizado.',
                'Protocolos TLS 1.3 para el blindaje de datos.'
              ]
            },
            {
              title: 'Estatura Legal',
              icon: Landmark,
              link: '/terms',
              linkLabel: 'Términos Legales',
              points: [
                'Operado por Knowing Cultures S.A.S. (NIT en trámite).',
                'Sede oficial en Bogotá, República de Colombia.',
                'Contratos vinculantes bajo legislación nacional.'
              ]
            },
            {
              title: 'Garantía Operativa',
              icon: Handshake,
              link: '/policies/cancellation',
              linkLabel: 'Política de Cancelación',
              points: [
                'Reembolso del 100% por cancelaciones previas a 48h.',
                'Gestión humana directa ante imprevistos técnicos.',
                'Seguro de asistencia incluido en expediciones selectas.'
              ]
            }
          ].map((pillar, idx) => (
            <div key={idx} className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-12 md:p-16 shadow-soft hover:shadow-pop transition-all duration-700 hover:-translate-y-2 overflow-hidden relative">
              {/* Icono de fondo (Watermark effect) */}
              <pillar.icon className="absolute -bottom-10 -right-10 h-64 w-64 text-brand-blue/[0.02] -rotate-12 transition-transform duration-[2000ms] group-hover:scale-110 group-hover:rotate-0" />
              
              <div className="relative z-10">
                <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/5 border border-brand-blue/10 text-brand-blue transition-all duration-500 group-hover:bg-brand-blue group-hover:text-white group-hover:scale-110">
                  <pillar.icon className="h-8 w-8" />
                </div>
                
                <h2 className="font-heading text-4xl text-main mb-8 tracking-tight">{pillar.title}</h2>
                
                <ul className="space-y-6 mb-12">
                  {pillar.points.map((point, pIdx) => (
                    <li key={pIdx} className="flex gap-4 items-start text-base font-light text-muted leading-relaxed">
                      <BadgeCheck className="h-5 w-5 text-brand-yellow shrink-0 mt-1" /> 
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                
                <Link href={withLocale(locale, pillar.link)} className="group/link inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue hover:text-brand-dark transition-all">
                  {pillar.linkLabel} <ChevronRight className="h-4 w-4 transition-transform group-hover/link:translate-x-2" />
                </Link>
              </div>
            </div>
          ))}

        </div>
      </section>

      {/* 03. INSTITUTIONAL SEALS (Whisper of Authority) */}
      <section className="mx-auto max-w-5xl px-6 py-28 md:py-44">
        <div className="text-center mb-16">
           <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted opacity-40">Infraestructura de Grado Global</p>
        </div>
        <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface-2/30 px-12 py-12 flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
           <div className="flex items-center gap-3 font-bold text-xl tracking-tighter text-main"><Landmark className="h-6 w-6" /> STRIPE</div>
           <div className="h-2 w-2 rounded-full bg-brand-blue" />
           <div className="flex items-center gap-3 font-bold text-xl tracking-tighter text-main"><ShieldCheck className="h-6 w-6" /> PCI-DSS</div>
           <div className="h-2 w-2 rounded-full bg-brand-blue" />
           <div className="flex items-center gap-3 font-bold text-xl tracking-tighter text-main"><Globe className="h-6 w-6" /> TLS 1.3 SECURE</div>
           <div className="h-2 w-2 rounded-full bg-brand-blue" />
           <div className="flex items-center gap-3 font-bold text-xl tracking-tighter uppercase text-main">Law 1581 Compliant</div>
        </div>
      </section>

      {/* 04. CONCIERGE CTA (The Human Touch) */}
      <section className="mx-auto max-w-5xl px-6">
        <div className="rounded-[var(--radius-[40px])] bg-brand-dark p-12 md:p-24 text-center text-white shadow-pop relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/brand/pattern.png')] bg-repeat opacity-[0.03]" />
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-blue/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <div className="h-24 w-24 flex items-center justify-center rounded-[2.5rem] bg-white/5 border border-white/10 text-brand-yellow mb-12 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700">
              <HeadphonesIcon className="h-12 w-12" />
            </div>
            <h2 className="font-heading text-4xl md:text-7xl mb-10 tracking-tight leading-[1.1]">¿Prefieres una consulta privada?</h2>
            <p className="text-xl md:text-2xl font-light text-white/60 mb-16 leading-relaxed">
              Nuestro concierge está a tu disposición para aclarar cualquier punto de nuestros términos legales o resolver dudas técnicas antes de confirmar tu expedición.
            </p>
            <Button asChild size="lg" className="rounded-full bg-brand-blue text-white hover:bg-white hover:text-brand-dark px-16 py-8 h-auto shadow-2xl transition-all border-transparent">
              <Link href={withLocale(locale, '/contact')} className="text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-5">
                {copy.cta} <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Marca de agua institucional sutil */}
      <div className="py-20 text-center opacity-30">
         <div className="flex justify-center mb-6">
            <Landmark className="h-8 w-8 text-brand-blue" />
         </div>
         <p className="text-[10px] font-bold uppercase tracking-[0.5em]">Knowing Cultures S.A.S. • Bogotá, Colombia • 2026</p>
      </div>

    </main>
  );
}