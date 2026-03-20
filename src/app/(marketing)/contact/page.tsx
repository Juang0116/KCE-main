import type { Metadata } from 'next';
import { getDictionary, t } from '@/i18n/getDictionary';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

import ContactForm from '@/features/marketing/ContactForm';
import PremiumConversionStrip from '@/features/marketing/PremiumConversionStrip';
import { splitCsv } from '@/features/marketing/contactContext';
import { Headphones, Mail, MapPin, ArrowRight, ShieldCheck, CheckCircle2, MessageCircle } from 'lucide-react';

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

async function resolveLocale(): Promise<'es' | 'en' | 'fr' | 'de'> {
  const h = await headers();
  const fromH = (h.get('x-kce-locale') || '').toLowerCase();
  if (fromH === 'en' || fromH === 'fr' || fromH === 'de') return fromH;
  const c = await cookies();
  const v = c.get('kce.locale')?.value?.toLowerCase();
  return v === 'en' || v === 'fr' || v === 'de' ? v : 'es';
}

function absoluteUrl(input?: string) {
  const s = (input || '').trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${BASE_SITE_URL}${s}`;
  return `${BASE_SITE_URL}/${s}`;
}

function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

function normalizeWhatsApp(raw: string) {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  return digits.length >= 11 ? digits : `57${digits}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const canonical = absoluteUrl(withLocale(locale, '/contact'));
  const title = 'Contacto y soporte premium | KCE';
  const description = 'Habla con KCE para resolver reservas, dudas de viaje o continuar un plan personalizado sin perder contexto.';
  return {
    metadataBase: new URL(BASE_SITE_URL),
    title, description, alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website', images: [{ url: absoluteUrl('/images/hero-kce.jpg'), width: 1200, height: 630, alt: 'KCE — Contacto y soporte' }] },
    twitter: { card: 'summary_large_image', title, description, images: [absoluteUrl('/images/hero-kce.jpg')] },
  };
}

type SearchParams = Record<string, string | string[] | undefined>;

type Props = { searchParams?: Promise<SearchParams> | SearchParams; };

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return (value[0] || '').trim();
  return (value || '').trim();
}

export default async function ContactPage({ searchParams }: Props) {
  const locale = await resolveLocale();
  const dict = await getDictionary(locale);
  const sp = (await Promise.resolve(searchParams ?? {})) as SearchParams;

  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'support@kce.travel';
  const whatsappRaw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || '';
  const whatsapp = normalizeWhatsApp(whatsappRaw);
  const canonical = absoluteUrl(withLocale(locale, '/contact'));

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'ContactPage', name: 'Contacto — KCE', url: canonical, inLanguage: locale,
    mainEntity: {
      '@type': 'Organization', name: 'Knowing Cultures Enterprise (KCE)', url: absoluteUrl('/'),
      contactPoint: [
        { '@type': 'ContactPoint', contactType: 'customer support', email, availableLanguage: ['es', 'en', 'fr', 'de'] },
        ...(whatsapp ? [{ '@type': 'ContactPoint', contactType: 'WhatsApp', telephone: `+${whatsapp}`, availableLanguage: ['es', 'en'] }] : []),
      ],
    },
  };

  const mailto = `mailto:${encodeURIComponent(email)}`;
  const waHref = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola KCE, necesito ayuda con mi viaje o reserva.')}` : '';
  const planHref = withLocale(locale, '/plan');

  const source = pickFirst(sp.source);
  const emailContext = pickFirst(sp.email);
  const whatsappContext = pickFirst(sp.whatsapp);
  const inboundMessage = pickFirst(sp.message);
  const topic = pickFirst(sp.topic);
  const city = pickFirst(sp.city);
  const query = pickFirst(sp.q);
  const budget = pickFirst(sp.budget);
  const pace = pickFirst(sp.pace);
  const pax = pickFirst(sp.pax);
  const tour = pickFirst(sp.tour);
  const slug = pickFirst(sp.slug);
  const start = pickFirst(sp.start);
  const end = pickFirst(sp.end);
  const ticket = pickFirst(sp.ticket);
  const interests = splitCsv(pickFirst(sp.interests)).slice(0, 6);

  const contextRows = [
    city ? ['Ciudad base', city] : null,
    tour ? ['Tour o referencia', tour] : null,
    pax ? ['Personas', pax] : null,
    budget ? ['Presupuesto', budget] : null,
    interests.length ? ['Intereses', interests.join(', ')] : null,
    start || end ? ['Fechas', [start || '—', end || '—'].join(' → ')] : null,
  ].filter(Boolean) as Array<[string, string]>;

  const topicLabel = topic === 'plan' ? 'Plan personalizado' : topic === 'tour' ? 'Tour puntual' : topic === 'catalog' ? 'Catálogo / Ayuda' : topic === 'booking' ? 'Reserva / Post-compra' : 'Solicitud general';
  const hasIncomingContext = contextRows.length > 0 || Boolean(topic || source);

  const initialMessage = hasIncomingContext
    ? [ 'Hola KCE, quiero continuar con este caso:', `- Motivo: ${topicLabel}`, city ? `- Ciudad base: ${city}` : '', tour ? `- Tour o referencia: ${tour}` : '', pax ? `- Personas: ${pax}` : '', start || end ? `- Fechas aproximadas: ${[start || '—', end || '—'].join(' → ')}` : '', inboundMessage ? `- Resumen previo: ${inboundMessage}` : '', ticket ? `- Ticket: ${ticket}` : '', '', 'Necesito ayuda para seguir con claridad.' ].filter(Boolean).join('\n')
    : '';

  const salesContext = { ...(city ? { city } : {}), ...(tour ? { tour } : {}), ...(slug ? { slug } : {}), ...(budget ? { budget } : {}), ...(pace ? { pace } : {}), ...(pax ? { pax } : {}), ...(interests.length ? { interests } : {}), ...(start ? { start } : {}), ...(end ? { end } : {}), ...(query || inboundMessage ? { query: query || inboundMessage } : {}) };

  const continueLinks = [
    slug ? { href: withLocale(locale, `/tours/${slug}`), label: 'Volver al tour', copy: 'Retoma el detalle del tour con el mismo contexto.' } : null,
    { href: planHref, label: 'Abrir plan personalizado', copy: 'Ordena tu viaje si todavía necesitas comparar opciones.' },
    { href: withLocale(locale, '/tours'), label: 'Seguir explorando tours', copy: 'Vuelve al catálogo si quieres revisar otras rutas.' },
  ].filter(Boolean) as Array<{ href: string; label: string; copy: string }>;

  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] flex flex-col animate-fade-in">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* 01. HERO EDITORIAL (Paridad de Marca - Sin fondos oscuros duros) */}
      <section className="relative w-full flex flex-col justify-center overflow-hidden bg-[color:var(--color-surface)] border-b border-[color:var(--color-border)] px-6 py-20 md:py-32 text-center">
        {/* Destello sutil azul indicando Servicio/Ayuda */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm backdrop-blur-md">
            <Headphones className="h-3 w-3" /> KCE
          </div>
          
          <h1 className="font-heading text-5xl leading-tight md:text-7xl lg:text-8xl text-[color:var(--color-text)] drop-shadow-sm tracking-tight mb-6">
            {t(dict, 'contact.title', 'Write to us')}
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-[color:var(--color-text-muted)] md:text-xl">
            {t(dict, 'contact_page.subtitle', '')}
          </p>
        </div>
      </section>

      {/* Breadcrumb Orgánico */}
      <div className="w-full bg-[color:var(--color-surface-2)]/30 border-b border-[color:var(--color-border)] py-3 px-6">
        <div className="mx-auto max-w-[var(--container-max)] flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)] opacity-80">
          <Link href={withLocale(locale, '/')} className="hover:text-brand-blue transition-colors">{t(dict, 'brand.short', 'KCE')}</Link>
          <ArrowRight className="h-3 w-3" />
          <span className="text-[color:var(--color-text)] opacity-50">{t(dict, 'contact_page.breadcrumb', 'Contact')}</span>
        </div>
      </div>

      {/* 02. CONTENEDOR PRINCIPAL */}
      <div className="mx-auto w-full max-w-[var(--container-max)] px-6 py-20 flex flex-col gap-24 flex-1">
        
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-start">
          
          {/* FORMULARIO (Izquierda - Sin caja asfixiante) */}
          <div className="relative">
            <header className="mb-10 border-b border-[color:var(--color-border)] pb-8">
              <h2 className="font-heading text-3xl md:text-4xl text-[color:var(--color-text)] tracking-tight mb-4">{t(dict, 'contact_page.title', 'Write to us')}</h2>
              <p className="text-base font-light text-[color:var(--color-text-muted)] leading-relaxed">
                {t(dict, 'contact_page.subtitle', '')}
              </p>
            </header>
            
            <div className="bg-[color:var(--color-surface)] rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] shadow-soft p-6 sm:p-10">
              <ContactForm
                initialEmail={emailContext}
                initialWhatsapp={whatsappContext}
                initialMessage={initialMessage}
                source={source || 'contact_page'}
                topic={topicLabel}
                salesContext={salesContext}
                continueLinks={continueLinks}
              />
            </div>
          </div>

          {/* CONTACTO DIRECTO & CONTEXTO (Derecha Sidebar) */}
          <aside className="space-y-8 sticky top-32">
            
            {/* Si viene desde un tour, mostrar qué tour estaba viendo (Context Awareness) */}
            {hasIncomingContext && (
              <div className="rounded-[var(--radius-2xl)] border border-brand-yellow/30 bg-brand-yellow/5 p-8 shadow-soft relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 transition-transform group-hover:scale-125">
                  <CheckCircle2 className="h-24 w-24 text-brand-yellow" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] mb-6 border-b border-[color:var(--color-border)] pb-4">
                    <ShieldCheck className="h-4 w-4 text-brand-yellow" /> Contexto Guardado
                  </div>
                  <div className="font-heading text-2xl text-[color:var(--color-text)] mb-6">{topicLabel}</div>
                  <div className="space-y-4 text-sm font-light text-[color:var(--color-text-muted)]">
                    {contextRows.map(([label, value]) => (
                      <div key={label} className="flex justify-between items-start gap-4">
                        <span className="opacity-70">{label}</span>
                        <span className="font-medium text-[color:var(--color-text)] text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Alternativas de Contacto Directo */}
            <div className="rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-10 shadow-soft">
              
              {/* Opción Email */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-[color:var(--color-surface-2)] flex items-center justify-center border border-[color:var(--color-border)]">
                    <Mail className="h-5 w-5 text-brand-blue" />
                  </div>
                  <h3 className="font-heading text-xl text-[color:var(--color-text)]">Email</h3>
                </div>
                <p className="text-sm font-light text-[color:var(--color-text-muted)] mb-3 ml-13 pl-13">Ideal para consultas detalladas, grupos grandes o solicitudes de agencias B2B.</p>
                <a href={mailto} className="text-sm font-semibold text-brand-blue hover:text-brand-terra transition-colors ml-13 pl-13 inline-block mt-2">{email}</a>
              </div>

              {/* Opción WhatsApp */}
              {whatsapp && (
                <div className="pt-8 mt-8 border-t border-[color:var(--color-border)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-[color:var(--color-surface-2)] flex items-center justify-center border border-[color:var(--color-border)]">
                      <MessageCircle className="h-5 w-5 text-[color:var(--color-success)]" />
                    </div>
                    <h3 className="font-heading text-xl text-[color:var(--color-text)]">WhatsApp</h3>
                  </div>
                  <p className="text-sm font-light text-[color:var(--color-text-muted)] mb-6 ml-13 pl-13">Si ya estás de viaje o necesitas una respuesta rápida, este es el mejor canal de Concierge.</p>
                  <div className="ml-13 pl-13">
                    <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-full rounded-full bg-[color:var(--color-success)] px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[color:var(--color-success)]/90 shadow-md hover:-translate-y-0.5">
                      Abrir chat directo
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Alternativa a escribir: Usar el Planificador */}
            <div className="rounded-[var(--radius-2xl)] border border-brand-blue/10 bg-[color:var(--color-surface-2)]/30 p-8 shadow-inner text-center group transition-colors hover:bg-[color:var(--color-surface)]">
              <div className="inline-flex rounded-2xl bg-[color:var(--color-surface)] p-3 text-brand-blue mb-4 border border-[color:var(--color-border)] shadow-sm group-hover:bg-brand-blue group-hover:text-white transition-colors">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-xl text-[color:var(--color-text)] mb-3">¿Aún no sabes qué elegir?</h3>
              <p className="text-sm font-light text-[color:var(--color-text-muted)] mb-8">
                Si no tienes una pregunta específica sino que quieres inspiración, nuestra IA puede armarte una ruta perfecta en segundos.
              </p>
              <Link href={planHref} className="inline-flex items-center justify-center w-full rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-[color:var(--color-text)] transition hover:border-brand-blue hover:text-brand-blue shadow-sm">
                Armar Plan <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>

          </aside>
        </div>

      </div>

      {/* 03. FOOTER PREMIUM CONVERSION */}
      <div className="mt-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/30 pt-16">
        <PremiumConversionStrip locale={locale} whatsAppHref={waHref || null} />
      </div>
    </main>
  );
}