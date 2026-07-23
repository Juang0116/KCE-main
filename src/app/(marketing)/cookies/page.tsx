/* src/app/(marketing)/cookies/page.tsx */
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Settings,
  Save,
  CheckCircle2,
  Lock,
  Fingerprint,
  BarChart3,
  ArrowRight,
  Globe2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Prefs = { necessary: true; analytics: boolean; marketing: boolean };

const COOKIE_NAME = 'kce_consent';
const ONE_YEAR = 60 * 60 * 24 * 365;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|;)\\s*${name}=([^;]*)`));
  const v = m?.[1];
  if (typeof v !== 'string') return null;
  return decodeURIComponent(v);
}

function setCookie(name: string, value: string) {
  const secure =
    typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure}`;
}

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function Toggle({
  id,
  checked,
  disabled,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
  label: string;
  description?: string;
  icon: any;
}) {
  return (
    <div
      className={cx(
        'group flex items-start justify-between gap-6 rounded-[var(--radius-2xl)] border p-8 transition-all duration-500',
        checked && !disabled
          ? 'border-brand-blue/20 bg-surface shadow-soft'
          : 'bg-surface-2/50 border-brand-dark/5 opacity-80 hover:opacity-100 dark:border-white/5',
      )}
    >
      <div className="flex gap-6">
        <div
          className={cx(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-all duration-500',
            checked && !disabled
              ? 'rotate-3 scale-110 bg-brand-blue text-white'
              : 'border border-brand-dark/5 bg-surface text-muted',
          )}
        >
          <Icon className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <label
            htmlFor={id}
            className="block cursor-pointer font-heading text-xl tracking-tight text-main"
          >
            {label}
          </label>
          {description && (
            <p className="mt-3 max-w-lg text-sm font-light leading-relaxed text-muted">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          role="switch"
          id={id}
          aria-checked={checked}
          aria-disabled={disabled ? 'true' : 'false'}
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            onChange?.(!checked);
          }}
          className={cx(
            'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 outline-none ring-offset-2 transition-all duration-500 focus:ring-2 focus:ring-brand-blue/20',
            disabled
              ? 'bg-muted/20 cursor-not-allowed border-transparent'
              : checked
                ? 'border-transparent bg-green-600 shadow-inner'
                : 'bg-muted/30 border-transparent',
          )}
        >
          <span
            aria-hidden="true"
            className={cx(
              'pointer-events-none inline-block size-6 rounded-full bg-white shadow-xl transition-all duration-500 ease-out',
              checked ? 'translate-x-[1.6rem]' : 'translate-x-0.5',
            )}
          />
        </button>
      </div>
    </div>
  );
}

export default function CookiesPage() {
  const [prefs, setPrefs] = useState<Prefs>({
    necessary: true,
    analytics: false,
    marketing: false,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialPrefs = useMemo(() => {
    if (typeof document === 'undefined')
      return { necessary: true, analytics: false, marketing: false } as Prefs;
    const raw = getCookie(COOKIE_NAME);
    if (!raw) return { necessary: true, analytics: false, marketing: false } as Prefs;
    try {
      const parsed: any = JSON.parse(raw);
      return {
        necessary: true,
        analytics: !!parsed.analytics,
        marketing: !!parsed.marketing,
      } as Prefs;
    } catch {
      return { necessary: true, analytics: false, marketing: false } as Prefs;
    }
  }, []);

  useEffect(() => {
    const raw = getCookie(COOKIE_NAME);
    if (raw) {
      try {
        const parsed: any = JSON.parse(raw);
        setPrefs({ necessary: true, analytics: !!parsed.analytics, marketing: !!parsed.marketing });
      } catch {}
    }
  }, []);

  const hasChanges =
    prefs.analytics !== initialPrefs.analytics || prefs.marketing !== initialPrefs.marketing;

  const save = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setCookie(COOKIE_NAME, JSON.stringify(prefs));

    await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefs, page: '/cookies' }),
    }).catch(() => {});

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  }, [prefs, saving]);

  return (
    <main className="relative min-h-screen animate-fade-in overflow-hidden bg-base pb-32">
      {/* 01. HERO INSTITUCIONAL (ADN KCE PREMIUM) */}
      <section className="relative mb-20 overflow-hidden border-b border-white/5 bg-brand-dark px-6 py-28 text-center md:py-40">
        {/* Capas de iluminación */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-full max-w-4xl -translate-x-1/2 rounded-full bg-brand-blue/10 blur-[120px]" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-xl backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-brand-yellow" /> Privacidad & Ética Digital
          </div>

          <h1 className="mb-10 font-heading text-6xl leading-[1] tracking-tighter text-white md:text-8xl lg:text-9xl">
            Tus datos, <br />
            <span className="font-light italic text-brand-yellow opacity-90">tu decisión.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-xl font-light leading-relaxed text-white/60 md:text-2xl">
            En <span className="font-medium text-white">Knowing Cultures S.A.S.</span> creemos en
            una navegación honesta. Controla qué cookies permites para personalizar tu viaje a
            través de nuestra plataforma editorial.
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6">
        {/* 02. NAVEGACIÓN LEGAL SECUNDARIA */}
        <nav className="mb-16 flex flex-wrap items-center justify-center gap-8 text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
          <Link
            href="/privacy"
            className="transition-colors hover:text-brand-blue"
          >
            Aviso de Privacidad
          </Link>
          <div className="h-1.5 w-1.5 rounded-full bg-brand-yellow/40" />
          <Link
            href="/terms"
            className="transition-colors hover:text-brand-blue"
          >
            Términos Legales
          </Link>
          <div className="h-1.5 w-1.5 rounded-full bg-brand-yellow/40" />
          <span className="border-b border-brand-blue/30 pb-1 text-brand-blue">
            Preferencia de Cookies
          </span>
        </nav>

        {/* 03. PANEL DE CONTROL (Bóveda Digital) */}
        <section className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5 md:p-20">
          {/* Marca de agua de fondo */}
          <div className="pointer-events-none absolute -bottom-20 -right-20 text-brand-blue opacity-[0.02] transition-transform duration-1000 group-hover:scale-110">
            <Settings className="h-[400px] w-[400px] -rotate-12" />
          </div>

          <div className="relative z-10">
            <header className="mb-16 border-b border-brand-dark/5 pb-12">
              <h2 className="font-heading text-4xl tracking-tight text-main">
                Centro de Preferencias
              </h2>
              <p className="mt-4 text-base font-light text-muted">
                Gestiona el tratamiento de tu información según la Ley 1581 de 2012.
              </p>
            </header>

            <div className="space-y-8">
              <Toggle
                id="cookies-necessary"
                checked
                disabled
                icon={Lock}
                label="Cookies de Funcionamiento"
                description="Indispensables para procesar tus pagos seguros vía Stripe/PayPal, mantener tu sesión activa y garantizar la integridad del contrato de servicio."
              />
              <Toggle
                id="cookies-analytics"
                checked={prefs.analytics}
                icon={BarChart3}
                onChange={(next) => setPrefs((p) => ({ ...p, analytics: next }))}
                label="Análisis de Experiencia"
                description="Nos permiten entender qué historias y expediciones culturales resuenan más con nuestra comunidad para mejorar continuamente nuestra oferta editorial."
              />
              <Toggle
                id="cookies-marketing"
                checked={prefs.marketing}
                icon={Fingerprint}
                onChange={(next) => setPrefs((p) => ({ ...p, marketing: next }))}
                label="Personalización de Ruta"
                description="Recuerda tus destinos favoritos e intereses para ofrecerte itinerarios de autor que conecten realmente con tu estilo personal de viaje."
              />
            </div>

            {/* 04. ACCIÓN DE GUARDADO */}
            <div className="mt-20 flex flex-col items-center justify-between gap-10 border-t border-brand-dark/5 pt-12 md:flex-row">
              <div className="flex min-h-[48px] items-center">
                {saved ? (
                  <div className="animate-in fade-in zoom-in inline-flex items-center gap-3 rounded-full border border-green-500/10 bg-green-500/5 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-green-600 duration-500">
                    <CheckCircle2 className="h-4 w-4" /> Preferencias Actualizadas
                  </div>
                ) : hasChanges ? (
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-2 animate-ping rounded-full bg-brand-yellow" />
                    <span className="font-heading text-xl font-light italic text-brand-blue">
                      Tienes cambios sin aplicar...
                    </span>
                  </div>
                ) : (
                  <span className="flex items-center gap-3 text-lg font-light italic text-muted opacity-60">
                    <Globe2 className="h-5 w-5 opacity-30" /> Navegación sincronizada
                  </span>
                )}
              </div>

              <Button
                onClick={save}
                disabled={!hasChanges || saving}
                size="lg"
                className="flex w-full items-center justify-center gap-4 rounded-full border-transparent bg-brand-blue px-14 py-8 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-pop transition-all hover:bg-brand-dark disabled:opacity-20 md:w-auto"
              >
                {saving ? (
                  'Procesando...'
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* 05. PIE DE PÁGINA LEGAL */}
        <div className="mt-24 space-y-8 text-center">
          <div className="flex items-center justify-center gap-4 opacity-30">
            <div className="h-px w-12 bg-brand-dark" />
            <p className="text-[9px] font-bold uppercase tracking-[0.5em]">
              Knowing Cultures S.A.S. • 2026
            </p>
            <div className="h-px w-12 bg-brand-dark" />
          </div>
          <p className="mx-auto max-w-2xl text-base font-light leading-relaxed text-muted">
            ¿Deseas una copia detallada de tus datos o ejercer tu derecho de supresión? <br />
            <Link
              href="/contact"
              className="font-bold text-brand-blue underline decoration-brand-yellow/30 underline-offset-8 transition-all hover:text-brand-dark"
            >
              Contacta a nuestro Oficial de Privacidad
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
