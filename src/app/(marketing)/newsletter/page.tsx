/*src/app/(marketing)/newsletter/page.tsx*/
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import {
  Mail,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react';

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
  if (direct === 'en' || direct === 'fr' || direct === 'de' || direct === 'es')
    return direct as SupportedLocale;
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
    return {
      tone: 'ok',
      title: '¡Suscripción confirmada!',
      text: 'Bienvenido/a a la comunidad KCE.',
      icon: CheckCircle2,
    };
  }
  if (unsubscribed === '1') {
    return {
      tone: 'ok',
      title: 'Suscripción cancelada',
      text: 'Te echaremos de menos. Vuelve cuando quieras.',
      icon: Bell,
    };
  }
  if (confirmed === '0' || unsubscribed === '0') {
    return {
      tone: 'err',
      title: 'Hubo un problema',
      text:
        err === 'invalid'
          ? 'El enlace ha expirado o no es válido.'
          : 'Inténtalo de nuevo en unos minutos.',
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
    <PageShell className="relative flex min-h-screen animate-fade-in flex-col overflow-hidden bg-base">
      {/* 01. HERO EDITORIAL (ADN KCE PREMIUM) */}
      <section className="relative overflow-hidden border-b border-brand-dark/10 bg-brand-dark px-6 py-24 text-center md:py-32">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-full max-w-4xl -translate-x-1/2 rounded-full bg-brand-blue/10 blur-[120px]"></div>

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
            <Mail className="h-3.5 w-3.5 text-brand-yellow" /> KCE Updates & Stories
          </div>

          <h1 className="mb-8 font-heading text-5xl leading-[1.05] tracking-tight text-white md:text-7xl lg:text-8xl">
            Newsletter <br className="hidden sm:block" />
            <span className="font-light italic text-brand-yellow opacity-90">de KCE.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
            Recibe historias, datos curiosos y ofertas especiales. Una forma pausada de inspirarte
            antes de decidir tu próxima ruta por Colombia.
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-20 md:py-32">
        {/* BANNERS DE ESTADO (CONFIRMACIÓN/ERROR) */}
        {banner && (
          <div
            className={`mb-16 flex flex-col items-center gap-5 rounded-[var(--radius-2xl)] border p-8 text-center shadow-soft transition-all sm:flex-row sm:items-start sm:text-left ${
              banner.tone === 'ok'
                ? 'border-green-500/20 bg-green-500/5 text-main'
                : 'border-red-500/20 bg-red-500/5 text-main'
            }`}
          >
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                banner.tone === 'ok' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
              }`}
            >
              <banner.icon className="h-7 w-7" />
            </div>
            <div className="pt-1">
              <h3 className="font-heading text-2xl tracking-tight text-main">{banner.title}</h3>
              <p className="mt-2 text-base font-light leading-relaxed text-muted">{banner.text}</p>
            </div>
          </div>
        )}

        {/* 02. BENEFICIOS GRID */}
        <section className="mb-24 grid gap-10 md:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: 'Ofertas Reales',
              text: 'Promociones y lanzamientos exclusivos para suscriptores.',
            },
            {
              icon: HeartHandshake,
              title: 'Inspiración Útil',
              text: 'Guías cortas y relatos para comparar destinos con criterio.',
            },
            {
              icon: ShieldCheck,
              title: 'Sin Ruido',
              text: 'Confirmación doble y baja inmediata con un solo clic.',
            },
          ].map((benefit, i) => (
            <div
              key={i}
              className="group flex flex-col items-center text-center"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--radius-xl)] border border-brand-dark/10 bg-surface text-brand-blue shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:border-brand-blue group-hover:bg-brand-blue group-hover:text-white dark:border-white/10">
                <benefit.icon className="h-7 w-7" />
              </div>
              <h4 className="mb-3 font-heading text-2xl tracking-tight text-main transition-colors group-hover:text-brand-blue">
                {benefit.title}
              </h4>
              <p className="px-4 text-base font-light leading-relaxed text-muted">{benefit.text}</p>
            </div>
          ))}
        </section>

        {/* 03. FORMULARIO (Tarjeta Premium) */}
        <div className="group overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/10 bg-surface shadow-pop dark:border-white/10">
          <div className="grid lg:grid-cols-[1fr_400px]">
            {/* Form Side */}
            <div className="relative overflow-hidden p-10 md:p-16">
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-brand-yellow/5 blur-[80px] transition-transform duration-1000 group-hover:scale-125"></div>

              <div className="relative z-10">
                <div className="mb-10">
                  <h2 className="mb-4 font-heading text-3xl tracking-tight text-main md:text-4xl">
                    Únete a la lista
                  </h2>
                  <p className="text-lg font-light leading-relaxed text-muted">
                    Prometemos contenido de valor. Puedes marcharte cuando quieras con un solo clic.
                  </p>
                </div>

                <NewsletterForm />

                <div className="mt-12 border-t border-brand-dark/5 pt-8 dark:border-white/5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                      <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="pt-0.5">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-70">
                        Privacidad KCE
                      </p>
                      <p className="text-xs font-light leading-relaxed text-muted">
                        Usamos tu email solo para enviarte historias y novedades. Al suscribirte,
                        aceptas nuestra política de privacidad y tratamiento de datos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support/Links Side (Capa Editorial) */}
            <div className="flex flex-col justify-center border-t border-brand-dark/5 bg-surface-2 p-10 dark:border-white/5 md:p-16 lg:border-l lg:border-t-0">
              <h3 className="mb-8 font-heading text-2xl tracking-tight text-main">
                ¿Necesitas algo más inmediato?
              </h3>
              <div className="space-y-4">
                <Button
                  asChild
                  variant="outline"
                  className="group/btn h-14 w-full justify-between rounded-xl border-brand-dark/10 bg-surface px-6 text-xs font-bold uppercase tracking-widest transition-all hover:border-brand-blue hover:text-brand-blue dark:border-white/10"
                >
                  <Link
                    href={withLocale(locale, '/contact')}
                    className="flex w-full items-center justify-between"
                  >
                    Habla con KCE{' '}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="group/btn h-14 w-full justify-between rounded-xl border-brand-dark/10 bg-surface px-6 text-xs font-bold uppercase tracking-widest transition-all hover:border-brand-blue hover:text-brand-blue dark:border-white/10"
                >
                  <Link
                    href={withLocale(locale, '/plan')}
                    className="flex w-full items-center justify-between"
                  >
                    Plan Personalizado{' '}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
              </div>
              <p className="mt-10 text-sm font-light italic leading-relaxed text-muted">
                La newsletter es ideal para inspirarte a largo plazo. Si ya tienes fechas y quieres
                una ruta real, usa los canales directos de arriba.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
