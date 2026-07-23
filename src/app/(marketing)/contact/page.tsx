/* src/app/(marketing)/contact/page.tsx */
import type { Metadata } from 'next';
import { getDictionary, t } from '@/i18n/getDictionary';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

import ContactForm from '@/features/marketing/ContactForm';
import PremiumConversionStrip from '@/features/marketing/PremiumConversionStrip';
import { splitCsv } from '@/features/marketing/contactContext';
import {
  Headphones,
  Mail,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  Globe2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { absoluteUrl, safeJsonLd } from '@/lib/seoJson';

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(
  /\/+$/,
  '',
);

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

async function resolveLocale(): Promise<'es' | 'en' | 'fr' | 'de'> {
  const h = await headers();
  const fromH = (h.get('x-kce-locale') || '').toLowerCase();
  if (fromH === 'en' || fromH === 'fr' || fromH === 'de') return fromH as any;
  const c = await cookies();
  const v = c.get('kce.locale')?.value?.toLowerCase();
  return v === 'en' || v === 'fr' || v === 'de' ? (v as any) : 'es';
}

function normalizeWhatsApp(raw: string) {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  return digits.length >= 11 ? digits : `57${digits}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const canonical = absoluteUrl(`/${locale}/contact`);
  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: 'Concierge & Soporte Premium | Knowing Cultures S.A.S.',
    description:
      'Atención personalizada para resolver reservas o diseñar expediciones exclusivas en Colombia con expertos locales.',
    alternates: { canonical },
    openGraph: {
      title: 'KCE Concierge',
      description: 'Atención humana para el viajero exigente.',
      url: canonical,
      type: 'website',
      images: [{ url: absoluteUrl('/images/hero-kce.jpg') }],
    },
  };
}

type SearchParams = Record<string, string | string[] | undefined>;
type Props = { searchParams?: Promise<SearchParams> | SearchParams };

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return (value[0] || '').trim();
  return (value || '').trim();
}

export default async function ContactPage({ searchParams }: Props) {
  const locale = await resolveLocale();
  const dict = await getDictionary(locale);
  const sp = (await Promise.resolve(searchParams ?? {})) as SearchParams;

  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'knowingcultures@gmail.com';
  const whatsappRaw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || '';
  const whatsapp = normalizeWhatsApp(whatsappRaw);
  const canonical = absoluteUrl(`/${locale}/contact`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contacto — KCE',
    url: canonical,
    inLanguage: locale,
    mainEntity: {
      '@type': 'Organization',
      name: 'Knowing Cultures S.A.S.',
      url: absoluteUrl('/'),
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email,
          availableLanguage: ['es', 'en', 'fr', 'de'],
        },
        ...(whatsapp
          ? [{ '@type': 'ContactPoint', contactType: 'WhatsApp', telephone: `+${whatsapp}` }]
          : []),
      ],
    },
  };

  const mailto = `mailto:${encodeURIComponent(email)}`;
  const waHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola KCE, me gustaría hablar con un experto sobre mi viaje.')}`
    : '';

  // Procesamiento de Contexto
  const source = pickFirst(sp.source);
  const emailContext = pickFirst(sp.email);
  const whatsappContext = pickFirst(sp.whatsapp);
  const inboundMessage = pickFirst(sp.message);
  const topic = pickFirst(sp.topic);
  const city = pickFirst(sp.city);
  const pax = pickFirst(sp.pax);
  const tour = pickFirst(sp.tour);
  const slug = pickFirst(sp.slug);
  const ticket = pickFirst(sp.ticket);
  const interests = splitCsv(pickFirst(sp.interests)).slice(0, 6);

  const contextRows = [
    city ? ['Ciudad destino', city] : null,
    tour ? ['Interés en tour', tour] : null,
    pax ? ['Viajeros', pax] : null,
    interests.length ? ['Pasiones', interests.join(', ')] : null,
  ].filter(Boolean) as Array<[string, string]>;

  const topicLabel =
    topic === 'plan'
      ? 'Plan Personalizado'
      : topic === 'tour'
        ? 'Tour Específico'
        : topic === 'booking'
          ? 'Soporte de Reserva'
          : 'Consulta de Autor';
  const hasIncomingContext = contextRows.length > 0 || Boolean(topic || source);

  const initialMessage = hasIncomingContext
    ? [
        `Hola KCE, quiero continuar mi proceso de ${topicLabel}:`,
        city ? `- Destino: ${city}` : '',
        tour ? `- Tour: ${tour}` : '',
        pax ? `- Grupo: ${pax}` : '',
        inboundMessage ? `- Nota: ${inboundMessage}` : '',
        ticket ? `- Ref: ${ticket}` : '',
        '',
        'Quedo atento a su respuesta.',
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  return (
    <main className="flex min-h-screen animate-fade-in flex-col overflow-x-hidden bg-base">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      {/* 01. HERO CONCIERGE (ADN KCE PREMIUM) */}
      <section className="relative w-full overflow-hidden border-b border-white/5 bg-brand-dark px-6 py-24 text-center md:py-32">
        {/* Capas de iluminación inmersiva */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-full max-w-4xl -translate-x-1/2 rounded-full bg-brand-blue/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-brand-yellow/5 blur-[120px]" />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.4em] text-white shadow-xl backdrop-blur-md">
            <Headphones className="h-3.5 w-3.5 text-brand-yellow" /> Knowing Cultures S.A.S. •
            Conciergerie
          </div>

          <h1 className="mb-10 font-heading text-5xl leading-[1.05] tracking-tight text-white md:text-7xl lg:text-8xl">
            {t(dict, 'contact.title_part1', 'Escríbenos')} <br className="hidden md:block" />
            <span className="font-light italic text-brand-yellow opacity-90">
              {t(dict, 'contact.title_part2', 'y hablemos de tu viaje.')}
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-xl font-light leading-relaxed text-white/60">
            Atención humana y experta para resolver reservas, coordinar logísticas o diseñar la ruta
            que mejor refleje tu estilo de vida.
          </p>
        </div>
      </section>

      {/* Breadcrumb de Navegación */}
      <div className="w-full border-b border-brand-dark/5 bg-surface px-6 py-4 dark:border-white/5">
        <div className="mx-auto flex max-w-[var(--container-max)] items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-muted opacity-80 sm:justify-start">
          <Link
            href={withLocale(locale, '/')}
            className="transition-colors hover:text-brand-blue"
          >
            Inicio
          </Link>
          <ArrowRight className="h-3 w-3 opacity-30" />
          <span className="text-main">Canales de Soporte</span>
        </div>
      </div>

      {/* 02. CONTENEDOR DE COMUNICACIÓN */}
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-1 flex-col gap-24 px-6 py-20 md:py-32">
        <div className="grid items-start gap-16 lg:grid-cols-[1fr_420px]">
          {/* EL FORMULARIO (Espacio de Trabajo) */}
          <div className="relative">
            <header className="mb-16 border-b border-brand-dark/5 pb-12 dark:border-white/5">
              <h2 className="mb-4 font-heading text-4xl tracking-tight text-main">
                Envía un mensaje de autor
              </h2>
              <p className="text-lg font-light leading-relaxed text-muted">
                Tu solicitud será procesada por un consultor especializado en el territorio
                colombiano.
              </p>
            </header>

            <div className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5 md:p-16">
              {/* Línea de acento */}
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent" />

              <ContactForm
                initialEmail={emailContext}
                initialWhatsapp={whatsappContext}
                initialMessage={initialMessage}
                source={source || 'contact_page'}
                topic={topicLabel}
                salesContext={{ ...(slug ? { slug } : {}), tour, city }}
                continueLinks={
                  [
                    slug
                      ? {
                          href: withLocale(locale, `/tours/${slug}`),
                          label: 'Volver al Tour',
                          copy: 'Retoma tu selección previa.',
                        }
                      : null,
                    {
                      href: withLocale(locale, '/plan'),
                      label: 'Diseñar Plan',
                      copy: 'Si prefieres una ruta a medida.',
                    },
                  ].filter(Boolean) as any
                }
              />
            </div>
          </div>

          {/* SIDEBAR DE CONFIANZA & CONTEXTO (Institutional Sidebar) */}
          <aside className="sticky top-32 space-y-10">
            {/* RECONOCIMIENTO DE CONTEXTO (Efecto WOW) */}
            {hasIncomingContext && (
              <div className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-yellow/30 bg-brand-yellow/5 p-10 shadow-soft">
                <div className="absolute -right-6 -top-6 opacity-[0.03] transition-transform duration-1000 group-hover:scale-150">
                  <Sparkles className="h-32 w-32 text-brand-yellow" />
                </div>
                <div className="relative z-10">
                  <div className="mb-8 flex items-center gap-3 border-b border-brand-terra/10 pb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-terra">
                    <ShieldCheck className="h-4 w-4" /> Contexto Sincronizado
                  </div>
                  <div className="mb-8 font-heading text-2xl tracking-tight text-main">
                    {topicLabel}
                  </div>
                  <div className="space-y-5">
                    {contextRows.map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-start justify-between gap-6 border-b border-brand-dark/5 pb-3"
                      >
                        <span className="text-[10px] font-bold uppercase text-muted opacity-60">
                          {label}
                        </span>
                        <span className="text-right text-sm font-medium text-main">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CANALES DIRECTOS (Premium Grid) */}
            <div className="space-y-12 rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft dark:border-white/10">
              {/* Email */}
              <div className="group">
                <div className="mb-5 flex items-center gap-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/5 text-brand-blue transition-all duration-500 group-hover:scale-110 group-hover:bg-brand-blue group-hover:text-white">
                    <Mail className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-xl tracking-tight text-main">Vía Correo</h3>
                </div>
                <p className="mb-4 text-sm font-light leading-relaxed text-muted">
                  Para grupos corporativos o solicitudes detalladas.
                </p>
                <a
                  href={mailto}
                  className="text-base font-bold tracking-tight text-brand-blue transition-colors hover:text-brand-dark"
                >
                  {email}
                </a>
              </div>

              {/* WhatsApp */}
              {whatsapp && (
                <div className="group border-t border-brand-dark/5 pt-10">
                  <div className="mb-5 flex items-center gap-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10 text-green-600 transition-all duration-500 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading text-xl tracking-tight text-main">WhatsApp Live</h3>
                  </div>
                  <p className="mb-8 text-sm font-light leading-relaxed text-muted">
                    Asistencia inmediata para viajeros en ruta o dudas urgentes.
                  </p>
                  <Button
                    asChild
                    className="w-full rounded-full bg-green-600 py-8 text-xs font-bold uppercase tracking-widest text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-green-700"
                  >
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Iniciar Chat Directo
                    </a>
                  </Button>
                </div>
              )}
            </div>

            {/* Mención Legal Sutil */}
            <div className="px-6 text-center opacity-40">
              <div className="mb-4 flex justify-center">
                <Globe2 className="h-6 w-6 text-brand-blue" />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.4em]">
                Knowing Cultures S.A.S. • Bogotá, Colombia
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* 03. FOOTER CONVERSIÓN */}
      <div className="mt-auto border-t border-brand-dark/5 bg-surface-2 pt-16">
        <div className="mb-12 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
            Respaldo Institucional 2026
          </p>
        </div>
        <PremiumConversionStrip
          locale={locale}
          whatsAppHref={waHref}
        />
      </div>
    </main>
  );
}
