/*src/app/(marketing)/newsletter/page.tsx*/
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { Mail, Bell, Sparkles, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';

import { PageShell } from '@/components/layout/PageShell';
import NewsletterForm from '@/features/marketing/NewsletterForm';
import { Button } from '@/components/ui/Button';
import type { SupportedLocale } from '@/i18n/locales';

export const metadata: Metadata = {
  title: 'Newsletter | KCE',
  description: 'Novedades, historias y ofertas de Knowing Cultures Enterprise.',
  robots: { index: false, follow: true },
};

type SearchParams = Record<string, string | string[] | undefined>;

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const c = await cookies();
  const direct = (h.get('x-kce-locale') || c.get('kce.locale')?.value || '').toLowerCase();
  if (direct === 'en' || direct === 'fr' || direct === 'de' || direct === 'es') return direct as SupportedLocale;
  const al = (h.get('accept-language') || '').toLowerCase();
  if (al.startsWith('fr')) return 'fr';
  if (al.startsWith('de')) return 'de';
  if (al.startsWith('en')) return 'en';
  return 'es';
}

function withLocale(locale: SupportedLocale, path: string): string {
  const safe = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${safe}`;
}

function pickFirst(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return (v[0] ?? '').trim();
  return (v ?? '').trim();
}

type BannerTone = 'ok' | 'err' | 'info';
type Banner = { tone: BannerTone; title: string; text: string; icon: any } | null;

function buildBanner(sp: SearchParams): Banner {
  const confirmed = pickFirst(sp.confirmed);
  const unsubscribed = pickFirst(sp.unsubscribed);
  const err = pickFirst(sp.err);

  if (confirmed === '1') {
    return { tone: 'ok', title: '¡Suscripción confirmada!', text: 'Bienvenido/a a la comunidad KCE.', icon: CheckCircle2 };
  }
  if (unsubscribed === '1') {
    return { tone: 'ok', title: 'Suscripción cancelada', text: 'Te echaremos de menos. Vuelve cuando quieras.', icon: Bell };
  }
  if (confirmed === '0' || unsubscribed === '0') {
    return {
      tone: 'err',
      title: 'Hubo un problema',
      text: err === 'invalid' ? 'El enlace ha expirado o no es válido.' : 'Inténtalo de nuevo en unos minutos.',
      icon: AlertCircle,
    };
  }
  return null;
}

export default async function NewsletterPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (await Promise.resolve(searchParams ?? {})) as SearchParams;
  const banner = buildBanner(sp);
  const locale = await resolveLocale();

  return (
    <PageShell className="bg-base min-h-screen flex flex-col animate-fade-in relative overflow-hidden">
      
      {/* 01. HERO EDITORIAL (ADN KCE PREMIUM) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center border-b border-brand-dark/10">
        <div className="absolute top-0 left-1/2 w-full max-w-4xl h-[400px] bg-brand-blue/10 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
            <Mail className="h-3.5 w-3.5 text-brand-yellow" /> KCE Updates & Stories
          </div>
          
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-white tracking-tight leading-[1.05] mb-8">
            Newsletter <br className="hidden sm:block"/> 
            <span className="text-brand-yellow italic font-light opacity-90">de KCE.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg md:text-xl font-light leading-relaxed text-white/70">
            Recibe historias, datos curiosos y ofertas especiales. Una forma pausada de inspirarte antes de decidir tu próxima ruta por Colombia.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-6 py-20 md:py-32 relative z-10">
        
        {/* BANNERS DE ESTADO (CONFIRMACIÓN/ERROR) */}
        {banner && (
          <div className={`mb-16 flex flex-col sm:flex-row items-center sm:items-start gap-5 rounded-[var(--radius-2xl)] border p-8 shadow-soft transition-all text-center sm:text-left ${
            banner.tone === 'ok' 
              ? 'border-green-500/20 bg-green-500/5 text-main' 
              : 'border-red-500/20 bg-red-500/5 text-main'
          }`}>
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
               banner.tone === 'ok' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
            }`}>
              <banner.icon className="h-7 w-7" />
            </div>
            <div className="pt-1">
              <h3 className="text-2xl font-heading text-main tracking-tight">{banner.title}</h3>
              <p className="mt-2 text-base font-light text-muted leading-relaxed">{banner.text}</p>
            </div>
          </div>
        )}

        {/* 02. BENEFICIOS GRID */}
        <section className="mb-24 grid gap-10 md:grid-cols-3">
          {[
            { icon: Sparkles, title: 'Ofertas Reales', text: 'Promociones y lanzamientos exclusivos para suscriptores.' },
            { icon: HeartHandshake, title: 'Inspiración Útil', text: 'Guías cortas y relatos para comparar destinos con criterio.' },
            { icon: ShieldCheck, title: 'Sin Ruido', text: 'Confirmación doble y baja inmediata con un solo clic.' }
          ].map((benefit, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--radius-xl)] bg-surface border border-brand-dark/10 dark:border-white/10 text-brand-blue shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:bg-brand-blue group-hover:text-white group-hover:border-brand-blue">
                <benefit.icon className="h-7 w-7" />
              </div>
              <h4 className="font-heading text-2xl text-main mb-3 tracking-tight group-hover:text-brand-blue transition-colors">{benefit.title}</h4>
              <p className="text-base font-light leading-relaxed text-muted px-4">{benefit.text}</p>
            </div>
          ))}
        </section>

        {/* 03. FORMULARIO (Tarjeta Premium) */}
        <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/10 dark:border-white/10 bg-surface shadow-pop group">
          <div className="grid lg:grid-cols-[1fr_400px]">
            
            {/* Form Side */}
            <div className="p-10 md:p-16 relative overflow-hidden">
              <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-brand-yellow/5 rounded-full blur-[80px] pointer-events-none transition-transform duration-1000 group-hover:scale-125"></div>
              
              <div className="relative z-10">
                <div className="mb-10">
                  <h2 className="font-heading text-3xl md:text-4xl text-main tracking-tight mb-4">Únete a la lista</h2>
                  <p className="text-lg font-light text-muted leading-relaxed">
                    Prometemos contenido de valor. Puedes marcharte cuando quieras con un solo clic.
                  </p>
                </div>
                
                <NewsletterForm />

                <div className="mt-12 pt-8 border-t border-brand-dark/5 dark:border-white/5">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-70 mb-1">Privacidad KCE</p>
                      <p className="text-xs font-light text-muted leading-relaxed">
                        Usamos tu email solo para enviarte historias y novedades. Al suscribirte, aceptas nuestra política de privacidad y tratamiento de datos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support/Links Side (Capa Editorial) */}
            <div className="bg-surface-2 p-10 md:p-16 border-t lg:border-t-0 lg:border-l border-brand-dark/5 dark:border-white/5 flex flex-col justify-center">
              <h3 className="font-heading text-2xl text-main mb-8 tracking-tight">¿Necesitas algo más inmediato?</h3>
              <div className="space-y-4">
                <Button asChild variant="outline" className="w-full justify-between rounded-xl bg-surface border-brand-dark/10 dark:border-white/10 hover:border-brand-blue hover:text-brand-blue transition-all group/btn h-14 px-6 text-xs font-bold uppercase tracking-widest">
                  <Link href={withLocale(locale, '/contact')} className="flex items-center justify-between w-full">
                    Habla con KCE <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between rounded-xl bg-surface border-brand-dark/10 dark:border-white/10 hover:border-brand-blue hover:text-brand-blue transition-all group/btn h-14 px-6 text-xs font-bold uppercase tracking-widest">
                  <Link href={withLocale(locale, '/plan')} className="flex items-center justify-between w-full">
                    Plan Personalizado <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
              </div>
              <p className="mt-10 text-sm font-light text-muted leading-relaxed italic">
                La newsletter es ideal para inspirarte a largo plazo. Si ya tienes fechas y quieres una ruta real, usa los canales directos de arriba.
              </p>
            </div>

          </div>
        </div>

      </div>
    </PageShell>
  );
}