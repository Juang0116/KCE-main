import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
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
    <PageShell className="bg-[var(--color-bg)] min-h-screen pb-24 pt-12 md:pt-20">
      <div className="mx-auto w-full max-w-4xl px-6">
        
        {/* HEADER & INTRO */}
        <header className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
            <Mail className="h-3 w-3" /> KCE Updates & Stories
          </div>
          <h1 className="font-heading text-4xl leading-tight text-brand-blue md:text-6xl">
            Newsletter de KCE
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-[var(--color-text)]/70">
            Recibe historias, datos curiosos y ofertas especiales. Una forma pausada de inspirarte antes de decidir tu próxima ruta por Colombia.
          </p>
        </header>

        {/* BANNERS DE ESTADO (CONFIRMACIÓN/ERROR) */}
        {banner && (
          <div className={`mb-10 flex items-start gap-4 rounded-[2rem] border p-6 shadow-xl transition-all ${
            banner.tone === 'ok' 
              ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-900' 
              : 'border-red-500/20 bg-red-500/5 text-red-900'
          }`}>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
               banner.tone === 'ok' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}>
              <banner.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">{banner.title}</h3>
              <p className="mt-1 text-sm opacity-80">{banner.text}</p>
            </div>
          </div>
        )}

        {/* BENEFICIOS GRID */}
        <section className="mb-12 grid gap-4 md:grid-cols-3">
          {[
            { icon: Sparkles, title: 'Ofertas Reales', text: 'Promociones y lanzamientos exclusivos para suscriptores.' },
            { icon: HeartHandshake, title: 'Inspiración Útil', text: 'Guías cortas y relatos para comparar destinos con criterio.' },
            { icon: ShieldCheck, title: 'Sin Ruido', text: 'Confirmación doble y baja inmediata con un solo clic.' }
          ].map((benefit, i) => (
            <div key={i} className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-hover hover:shadow-md">
              <benefit.icon className="mb-4 h-6 w-6 text-brand-blue" />
              <h4 className="font-heading text-lg text-brand-blue">{benefit.title}</h4>
              <p className="mt-2 text-sm font-light leading-relaxed text-[var(--color-text)]/60">{benefit.text}</p>
            </div>
          ))}
        </section>

        {/* MAIN FORM CARD (THE VAULT) */}
        <div className="overflow-hidden rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            
            {/* Form Side */}
            <div className="p-8 md:p-12 lg:p-16">
              <div className="mb-8">
                <h2 className="font-heading text-2xl text-brand-blue">Únete a la lista</h2>
                <p className="mt-2 text-sm font-light text-[var(--color-text)]/60">
                  Prometemos contenido de valor. Puedes marcharte cuando quieras.
                </p>
              </div>
              
              <NewsletterForm />

              <div className="mt-10 pt-8 border-t border-[var(--color-border)]">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-1">Privacidad KCE</p>
                    <p className="text-xs font-light text-[var(--color-text)]/60 leading-relaxed">
                      Usamos tu email solo para contenido relevante. Al suscribirte, aceptas nuestra política de datos.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support/Links Side */}
            <div className="bg-[var(--color-surface-2)] p-8 md:p-12 lg:p-16 border-t lg:border-t-0 lg:border-l border-[var(--color-border)] flex flex-col justify-center">
              <h3 className="font-heading text-xl text-brand-blue mb-6">¿Necesitas algo más inmediato?</h3>
              <div className="space-y-4">
                <Button asChild variant="outline" className="w-full justify-between rounded-2xl group">
                  <a href={withLocale(locale, '/contact')}>
                    Habla con KCE <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between rounded-2xl group">
                  <a href={withLocale(locale, '/plan')}>
                    Plan Personalizado <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </div>
              <p className="mt-8 text-xs font-light text-[var(--color-text)]/50 leading-relaxed italic">
                La newsletter es ideal para inspirarte a largo plazo. Si ya tienes fechas y quieres una ruta real, usa los enlaces de arriba.
              </p>
            </div>

          </div>
        </div>

      </div>
    </PageShell>
  );
}