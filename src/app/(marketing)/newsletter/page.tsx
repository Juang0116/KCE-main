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
    <PageShell className="bg-[color:var(--color-bg)] min-h-screen flex flex-col animate-fade-in relative overflow-hidden">
      
      {/* Destellos ambientales (Glow) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="mx-auto w-full max-w-4xl px-6 py-20 md:py-32 relative z-10">
        
        {/* 01. HEADER & INTRO (Editorial Parity) */}
        <header className="mb-16 text-center flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm backdrop-blur-md">
            <Mail className="h-3 w-3" /> KCE Updates & Stories
          </div>
          
          <h1 className="font-heading text-5xl leading-tight text-[color:var(--color-text)] md:text-7xl lg:text-8xl tracking-tight mb-6">
            Newsletter <br className="hidden sm:block"/> 
            <span className="text-brand-blue italic font-light">de KCE</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-[color:var(--color-text-muted)] md:text-xl">
            Recibe historias, datos curiosos y ofertas especiales. Una forma pausada de inspirarte antes de decidir tu próxima ruta por Colombia.
          </p>
        </header>

        {/* BANNERS DE ESTADO (CONFIRMACIÓN/ERROR) */}
        {banner && (
          <div className={`mb-12 flex flex-col sm:flex-row items-center sm:items-start gap-4 rounded-[var(--radius-2xl)] border p-6 shadow-soft transition-all text-center sm:text-left ${
            banner.tone === 'ok' 
              ? 'border-[color:var(--color-success)]/20 bg-[color:var(--color-success)]/5 text-[color:var(--color-text)]' 
              : 'border-red-500/20 bg-red-500/5 text-[color:var(--color-text)]'
          }`}>
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm ${
               banner.tone === 'ok' ? 'bg-[color:var(--color-success)] text-white' : 'bg-red-500 text-white'
            }`}>
              <banner.icon className="h-6 w-6" />
            </div>
            <div className="pt-1">
              <h3 className="text-lg font-heading text-[color:var(--color-text)]">{banner.title}</h3>
              <p className="mt-1 text-sm font-light opacity-80">{banner.text}</p>
            </div>
          </div>
        )}

        {/* 02. BENEFICIOS GRID (Seamless List) */}
        <section className="mb-20 grid gap-8 md:grid-cols-3">
          {[
            { icon: Sparkles, title: 'Ofertas Reales', text: 'Promociones y lanzamientos exclusivos para suscriptores.' },
            { icon: HeartHandshake, title: 'Inspiración Útil', text: 'Guías cortas y relatos para comparar destinos con criterio.' },
            { icon: ShieldCheck, title: 'Sin Ruido', text: 'Confirmación doble y baja inmediata con un solo clic.' }
          ].map((benefit, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[var(--radius-xl)] bg-[color:var(--color-surface)] border border-[color:var(--color-border)] text-brand-blue shadow-soft transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-blue/5 group-hover:border-brand-blue/30">
                <benefit.icon className="h-6 w-6" />
              </div>
              <h4 className="font-heading text-xl text-[color:var(--color-text)] mb-2 group-hover:text-brand-blue transition-colors">{benefit.title}</h4>
              <p className="text-sm font-light leading-relaxed text-[color:var(--color-text-muted)] px-4">{benefit.text}</p>
            </div>
          ))}
        </section>

        {/* 03. FORMULARIO (Glassmorphism Premium) */}
        <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/80 backdrop-blur-xl shadow-soft group">
          <div className="grid lg:grid-cols-[1fr_350px]">
            
            {/* Form Side */}
            <div className="p-8 md:p-12 relative overflow-hidden">
              {/* Destello decorativo interno */}
              <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-brand-yellow/5 rounded-full blur-[60px] pointer-events-none transition-transform duration-700 group-hover:scale-150"></div>
              
              <div className="relative z-10">
                <div className="mb-8">
                  <h2 className="font-heading text-3xl text-[color:var(--color-text)] tracking-tight mb-2">Únete a la lista</h2>
                  <p className="text-sm font-light text-[color:var(--color-text-muted)]">
                    Prometemos contenido de valor. Puedes marcharte cuando quieras.
                  </p>
                </div>
                
                {/* Asumiendo que NewsletterForm es un formulario limpio sin cajas rígidas por dentro */}
                <NewsletterForm />

                <div className="mt-10 pt-8 border-t border-[color:var(--color-border)]">
                  <div className="flex items-start gap-4">
                    <ShieldCheck className="h-6 w-6 text-[color:var(--color-success)] shrink-0" />
                    <div className="pt-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] opacity-70 mb-1">Privacidad KCE</p>
                      <p className="text-xs font-light text-[color:var(--color-text-muted)] leading-relaxed">
                        Usamos tu email solo para contenido relevante. Al suscribirte, aceptas nuestra política de datos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support/Links Side */}
            <div className="bg-[color:var(--color-surface-2)]/30 p-8 md:p-12 border-t lg:border-t-0 lg:border-l border-[color:var(--color-border)] flex flex-col justify-center">
              <h3 className="font-heading text-xl text-[color:var(--color-text)] mb-6">¿Necesitas algo más inmediato?</h3>
              <div className="space-y-4">
                <Button asChild variant="outline" className="w-full justify-between rounded-xl bg-[color:var(--color-surface)] border-[color:var(--color-border)] hover:border-brand-blue hover:text-brand-blue transition-colors group/btn h-12">
                  <Link href={withLocale(locale, '/contact')}>
                    Habla con KCE <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between rounded-xl bg-[color:var(--color-surface)] border-[color:var(--color-border)] hover:border-brand-blue hover:text-brand-blue transition-colors group/btn h-12">
                  <Link href={withLocale(locale, '/plan')}>
                    Plan Personalizado <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
              </div>
              <p className="mt-8 text-xs font-light text-[color:var(--color-text-muted)] leading-relaxed italic">
                La newsletter es ideal para inspirarte a largo plazo. Si ya tienes fechas y quieres una ruta real, usa los enlaces de arriba.
              </p>
            </div>

          </div>
        </div>

      </div>
    </PageShell>
  );
}