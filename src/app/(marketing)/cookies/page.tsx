/* src/app/(marketing)/cookies/page.tsx */
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { ShieldCheck, Settings, Save, CheckCircle2, Lock, Fingerprint, BarChart3, ArrowRight, Globe2 } from 'lucide-react';
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
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure}`;
}

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function Toggle({ id, checked, disabled, onChange, label, description, icon: Icon }: {
  id: string; checked: boolean; disabled?: boolean; onChange?: (next: boolean) => void; label: string; description?: string; icon: any;
}) {
  return (
    <div className={cx(
      'group flex items-start justify-between gap-6 rounded-[var(--radius-2xl)] border p-8 transition-all duration-500',
      checked && !disabled 
        ? 'border-brand-blue/20 bg-surface shadow-soft' 
        : 'border-brand-dark/5 dark:border-white/5 bg-surface-2/50 opacity-80 hover:opacity-100'
    )}>
      <div className="flex gap-6">
        <div className={cx(
          "h-14 w-14 shrink-0 flex items-center justify-center rounded-2xl transition-all duration-500 shadow-sm",
          checked && !disabled 
            ? "bg-brand-blue text-white scale-110 rotate-3" 
            : "bg-surface border border-brand-dark/5 text-muted"
        )}>
          <Icon className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className="block text-xl font-heading text-main tracking-tight cursor-pointer">
            {label}
          </label>
          {description && (
            <p className="mt-3 text-sm font-light leading-relaxed text-muted max-w-lg">{description}</p>
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
            'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-all duration-500 outline-none ring-offset-2 focus:ring-2 focus:ring-brand-blue/20',
            disabled ? 'cursor-not-allowed bg-muted/20 border-transparent'
                     : checked ? 'bg-green-600 border-transparent shadow-inner' : 'bg-muted/30 border-transparent'
          )}
        >
          <span
            aria-hidden="true"
            className={cx(
              'pointer-events-none inline-block size-6 rounded-full bg-white shadow-xl transition-all duration-500 ease-out',
              checked ? 'translate-x-[1.6rem]' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>
    </div>
  );
}

export default function CookiesPage() {
  const [prefs, setPrefs] = useState<Prefs>({ necessary: true, analytics: false, marketing: false });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialPrefs = useMemo(() => {
    if (typeof document === 'undefined') return { necessary: true, analytics: false, marketing: false } as Prefs;
    const raw = getCookie(COOKIE_NAME);
    if (!raw) return { necessary: true, analytics: false, marketing: false } as Prefs;
    try {
      const parsed: any = JSON.parse(raw);
      return { necessary: true, analytics: !!parsed.analytics, marketing: !!parsed.marketing } as Prefs;
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

  const hasChanges = prefs.analytics !== initialPrefs.analytics || prefs.marketing !== initialPrefs.marketing;

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
    <main className="min-h-screen bg-base pb-32 animate-fade-in relative overflow-hidden">
      
      {/* 01. HERO INSTITUCIONAL (ADN KCE PREMIUM) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-28 md:py-40 text-center border-b border-white/5 mb-20">
        {/* Capas de iluminación */}
        <div className="absolute top-0 left-1/2 w-full max-w-4xl h-80 bg-brand-blue/10 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-5xl flex flex-col items-center">
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-xl backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-brand-yellow" /> Privacidad & Ética Digital
          </div>
          
          <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl text-white tracking-tighter leading-[1] mb-10">
            Tus datos, <br/>
            <span className="text-brand-yellow font-light italic opacity-90">tu decisión.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-xl md:text-2xl font-light leading-relaxed text-white/60">
            En <span className="text-white font-medium">Knowing Cultures S.A.S.</span> creemos en una navegación honesta. Controla qué cookies permites para personalizar tu viaje a través de nuestra plataforma editorial.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-6 relative z-10">
        
        {/* 02. NAVEGACIÓN LEGAL SECUNDARIA */}
        <nav className="mb-16 flex flex-wrap justify-center items-center gap-8 text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
          <Link href="/privacy" className="hover:text-brand-blue transition-colors">Aviso de Privacidad</Link>
          <div className="h-1.5 w-1.5 rounded-full bg-brand-yellow/40" />
          <Link href="/terms" className="hover:text-brand-blue transition-colors">Términos Legales</Link>
          <div className="h-1.5 w-1.5 rounded-full bg-brand-yellow/40" />
          <span className="text-brand-blue border-b border-brand-blue/30 pb-1">Preferencia de Cookies</span>
        </nav>

        {/* 03. PANEL DE CONTROL (Bóveda Digital) */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 md:p-20 shadow-pop relative overflow-hidden group">
          {/* Marca de agua de fondo */}
          <div className="absolute -bottom-20 -right-20 opacity-[0.02] text-brand-blue pointer-events-none transition-transform duration-1000 group-hover:scale-110">
             <Settings className="h-[400px] w-[400px] -rotate-12" />
          </div>

          <div className="relative z-10">
            <header className="mb-16 border-b border-brand-dark/5 pb-12">
               <h2 className="font-heading text-4xl text-main tracking-tight">Centro de Preferencias</h2>
               <p className="mt-4 text-base font-light text-muted">Gestiona el tratamiento de tu información según la Ley 1581 de 2012.</p>
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
            <div className="mt-20 pt-12 border-t border-brand-dark/5 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="min-h-[48px] flex items-center">
                {saved ? (
                  <div className="inline-flex items-center gap-3 rounded-full bg-green-500/5 border border-green-500/10 px-6 py-3 text-green-600 font-bold uppercase text-[10px] tracking-widest animate-in fade-in zoom-in duration-500">
                    <CheckCircle2 className="h-4 w-4" /> Preferencias Actualizadas
                  </div>
                ) : hasChanges ? (
                  <div className="flex items-center gap-4">
                     <div className="h-2 w-2 rounded-full bg-brand-yellow animate-ping" />
                     <span className="text-brand-blue font-heading text-xl italic font-light">Tienes cambios sin aplicar...</span>
                  </div>
                ) : (
                  <span className="text-muted font-light text-lg italic opacity-60 flex items-center gap-3">
                    <Globe2 className="h-5 w-5 opacity-30" /> Navegación sincronizada
                  </span>
                )}
              </div>

              <Button 
                onClick={save} 
                disabled={!hasChanges || saving} 
                size="lg" 
                className="w-full md:w-auto rounded-full px-14 py-8 bg-brand-blue text-white hover:bg-brand-dark shadow-pop transition-all disabled:opacity-20 text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-4 border-transparent"
              >
                {saving ? 'Procesando...' : <><Save className="h-4 w-4" /> Guardar Cambios</>}
              </Button>
            </div>
          </div>
        </section>

        {/* 05. PIE DE PÁGINA LEGAL */}
        <div className="mt-24 text-center space-y-8">
           <div className="flex justify-center gap-4 items-center opacity-30">
              <div className="h-px w-12 bg-brand-dark" />
              <p className="text-[9px] font-bold uppercase tracking-[0.5em]">Knowing Cultures S.A.S. • 2026</p>
              <div className="h-px w-12 bg-brand-dark" />
           </div>
           <p className="text-base text-muted font-light leading-relaxed max-w-2xl mx-auto">
             ¿Deseas una copia detallada de tus datos o ejercer tu derecho de supresión? <br/>
             <Link href="/contact" className="text-brand-blue font-bold hover:text-brand-dark transition-all underline underline-offset-8 decoration-brand-yellow/30">Contacta a nuestro Oficial de Privacidad</Link>.
           </p>
        </div>

      </div>
    </main>
  );
}