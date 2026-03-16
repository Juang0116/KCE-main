import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';

import ContactForm from '@/features/marketing/ContactForm';
import PremiumConversionStrip from '@/features/marketing/PremiumConversionStrip';
import { splitCsv } from '@/features/marketing/contactContext';
import { Headphones, Mail, MapPin, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

async function resolveLocale(): Promise<'es' | 'en' | 'fr' | 'de'> {
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
  const tag = pickFirst(sp.tag);
  const budget = pickFirst(sp.budget);
  const pace = pickFirst(sp.pace);
  const pax = pickFirst(sp.pax);
  const tour = pickFirst(sp.tour);
  const slug = pickFirst(sp.slug);
  const start = pickFirst(sp.start);
  const end = pickFirst(sp.end);
  const ticket = pickFirst(sp.ticket);
  const conversation = pickFirst(sp.conversation);
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
    <main className="min-h-screen bg-[color:var(--color-bg)] pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* HERO CONTACTO */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-20 md:py-28 text-center text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark to-transparent"></div>
        
        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow backdrop-blur-md">
            <Headphones className="h-3 w-3" /> Equipo Humano KCE
          </div>
          <h1 className="font-heading text-4xl leading-tight md:text-6xl drop-shadow-md">
            Hablemos de tu viaje.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl">
            Sin respuestas automatizadas genéricas. Detrás de KCE hay un equipo de expertos locales listos para ayudarte a coordinar cada detalle de tu experiencia.
          </p>
        </div>
      </section>

      {/* CONTENIDO PRINCIPAL */}
      <section className="mx-auto max-w-[1100px] px-6 -mt-10 relative z-20">
        
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          
          {/* FORMULARIO Y CHAT (Izquierda) */}
          <div className="space-y-8">
            <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-12 shadow-xl">
              <h2 className="font-heading text-3xl text-brand-blue mb-2">Escríbenos</h2>
              <p className="text-sm font-light text-[var(--color-text)]/70 mb-8 leading-relaxed">
                Te respondemos por el canal que elijas. Si es una reserva o un plan, incluye ciudad, fechas aproximadas y número de personas para avanzar con más claridad.
              </p>
              
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

            {/* Alternativa: Plan */}
            <div className="rounded-3xl border border-brand-blue/20 bg-brand-blue/5 p-8 text-center shadow-sm">
              <div className="inline-flex rounded-full bg-brand-blue/10 p-3 text-brand-blue mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-xl text-brand-blue mb-3">¿Aún no sabes qué elegir?</h3>
              <p className="text-sm font-light text-[var(--color-text)]/70 mb-6">
                Si no tienes una pregunta específica sino que quieres inspiración, nuestra IA puede armarte una ruta perfecta en segundos.
              </p>
              <Link href={planHref} className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 shadow-md">
                Armar Plan Personalizado <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* CONTACTO DIRECTO (Derecha Sidebar) */}
          <div className="space-y-6">
            
            {hasIncomingContext && (
              <div className="rounded-[2rem] border border-brand-yellow/30 bg-brand-yellow/5 p-8 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-dark/50 mb-4 border-b border-brand-dark/10 pb-3">
                  <CheckCircle2 className="h-4 w-4 text-brand-yellow" /> Contexto Guardado
                </div>
                <div className="font-heading text-xl text-brand-dark mb-4">{topicLabel}</div>
                <div className="space-y-3 text-sm font-light text-brand-dark/80">
                  {contextRows.map(([label, value]) => (
                    <div key={label} className="flex justify-between items-start gap-4">
                      <span className="opacity-60">{label}</span>
                      <span className="font-medium text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-sm space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="h-5 w-5 text-brand-blue" />
                  <h3 className="font-heading text-xl text-[var(--color-text)]">Email</h3>
                </div>
                <p className="text-sm font-light text-[var(--color-text)]/70 mb-2">Ideal para consultas detalladas o agencias.</p>
                <a href={mailto} className="text-sm font-semibold text-brand-blue hover:underline">{email}</a>
              </div>

              {whatsapp && (
                <div className="pt-6 border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    <h3 className="font-heading text-xl text-[var(--color-text)]">WhatsApp</h3>
                  </div>
                  <p className="text-sm font-light text-[var(--color-text)]/70 mb-3">Si estás en viaje o necesitas una respuesta más rápida, este es el mejor carril.</p>
                  <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-full rounded-xl bg-emerald-500 px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-600 shadow-sm">
                    Abrir WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Qué pasa después */}
            <div className="rounded-[2rem] bg-[color:var(--color-surface-2)] p-8 shadow-inner border border-[var(--color-border)]">
              <h3 className="font-heading text-xl text-[var(--color-text)] mb-6">Qué pasa después</h3>
              <div className="space-y-6">
                {[
                  ['1', 'Recibimos tu caso', 'Si vienes desde tours o planes, KCE conserva el contexto para no preguntarte lo mismo.'],
                  ['2', 'Abrimos Continuidad', 'Creamos un ticket privado para tu caso, asegurando que nada se pierda.'],
                  ['3', 'Atención Prioritaria', 'Las reservas en curso se atienden en menos de 2h. Consultas generales el mismo día.'],
                ].map(([num, title, text]) => (
                  <div key={num} className="relative pl-10">
                    <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue text-xs font-bold">{num}</div>
                    <h4 className="text-sm font-bold text-[var(--color-text)]">{title}</h4>
                    <p className="mt-1 text-xs font-light text-[var(--color-text)]/70 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      <PremiumConversionStrip locale={locale} whatsAppHref={waHref || null} className="px-6 py-20 mt-10" />
    </main>
  );
}