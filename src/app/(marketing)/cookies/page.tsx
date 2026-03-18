'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Settings, Save, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Prefs = { necessary: true; analytics: boolean; marketing: boolean };

const COOKIE_NAME = 'kce_consent';
const ONE_YEAR = 60 * 60 * 24 * 365;

function getCookie(name: string): string | null {
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

function Toggle({ id, checked, disabled, onChange, label, description }: {
  id: string; checked: boolean; disabled?: boolean; onChange?: (next: boolean) => void; label: string; description?: string;
}) {
  return (
    <div className={cx(
      'flex items-start justify-between gap-6 rounded-3xl border p-6 transition-colors',
      checked && !disabled ? 'border-brand-blue/30 bg-brand-blue/5' : 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)]'
    )}>
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className={cx('block text-lg font-heading text-brand-blue', disabled && 'opacity-80')}>
          {label}
        </label>
        {description && (
          <p className="mt-2 text-sm font-light leading-relaxed text-[var(--color-text)]/70">{description}</p>
        )}
      </div>

      <div className="pt-1">
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
            'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40',
            disabled ? 'cursor-not-allowed border-transparent bg-[var(--color-border)] opacity-50'
                     : checked ? 'border-transparent bg-emerald-500' : 'border-transparent bg-[var(--color-border)]'
          )}
        >
          <span
            aria-hidden="true"
            className={cx(
              'pointer-events-none inline-block size-6 translate-x-0.5 rounded-full shadow-md transition-transform duration-300',
              checked ? 'translate-x-[1.6rem] bg-white' : 'bg-white'
            )}
          />
          <span className="sr-only">{label}</span>
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
    const raw = typeof document !== 'undefined' ? getCookie(COOKIE_NAME) : null;
    if (!raw) return { necessary: true, analytics: false, marketing: false } as Prefs;
    try {
      const parsed: unknown = JSON.parse(raw);
      const p = parsed as { analytics?: unknown; marketing?: unknown };
      return { necessary: true, analytics: !!p.analytics, marketing: !!p.marketing } as Prefs;
    } catch {
      return { necessary: true, analytics: false, marketing: false } as Prefs;
    }
  }, []);

  useEffect(() => {
    const raw = getCookie(COOKIE_NAME);
    if (!raw) return;
    try {
      const parsed: unknown = JSON.parse(raw);
      const p = parsed as { analytics?: unknown; marketing?: unknown };
      setPrefs({ necessary: true, analytics: !!p.analytics, marketing: !!p.marketing });
    } catch {}
  }, []);

  const hasChanges = prefs.analytics !== initialPrefs.analytics || prefs.marketing !== initialPrefs.marketing;

  async function save() {
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
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-24 pt-20 md:pt-32">
      <div className="mx-auto max-w-3xl px-6">
        
        {/* Cabecera Legal */}
        <header className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
            <ShieldCheck className="h-3 w-3" /> Transparencia KCE
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight mb-6">
            Preferencias de Cookies
          </h1>
          <p className="text-lg font-light text-[var(--color-text)]/70 max-w-xl mx-auto leading-relaxed mb-8">
            Controla qué información compartes con nosotros. Las cookies necesarias siempre permanecen activas para garantizar que tu experiencia y tus pagos sean seguros.
          </p>

          <nav aria-label="Navegación legal" className="flex flex-wrap justify-center gap-4 text-[10px] font-bold uppercase tracking-widest">
            <Link href="/privacy" className="text-[var(--color-text)]/50 hover:text-brand-blue transition-colors">Privacidad</Link>
            <span className="text-[var(--color-text)]/20">•</span>
            <Link href="/terms" className="text-[var(--color-text)]/50 hover:text-brand-blue transition-colors">Términos</Link>
            <span className="text-[var(--color-text)]/20">•</span>
            <Link href="/cookies" className="text-brand-blue border-b border-brand-blue pb-1">Cookies</Link>
          </nav>
        </header>

        {/* Panel de Control */}
        <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-blue to-emerald-500"></div>
          
          <div className="mb-8 flex items-center gap-3 border-b border-[var(--color-border)] pb-6">
            <Settings className="h-6 w-6 text-brand-blue/50" />
            <h2 className="font-heading text-2xl text-brand-blue">Tus Ajustes</h2>
          </div>

          <div className="space-y-4">
            <Toggle
              id="cookies-necessary"
              checked
              disabled
              label="Cookies Necesarias"
              description="Imprescindibles para procesar pagos seguros (Stripe), mantener tu sesión iniciada y guardar el contexto de tus viajes."
            />
            <Toggle
              id="cookies-analytics"
              checked={prefs.analytics}
              onChange={(next) => setPrefs((p) => ({ ...p, analytics: next }))}
              label="Analíticas y Rendimiento"
              description="Nos ayuda a medir de forma anónima qué tours gustan más y cómo mejorar la velocidad de la plataforma."
            />
            <Toggle
              id="cookies-marketing"
              checked={prefs.marketing}
              onChange={(next) => setPrefs((p) => ({ ...p, marketing: next }))}
              label="Marketing y Personalización"
              description="Permite que te mostremos los destinos que dejaste pendientes si nos visitas en otras plataformas."
            />
          </div>

          {/* Barra de Acción */}
          <div className="mt-10 pt-8 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-sm font-light text-[var(--color-text)]/60">
              {saved ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-emerald-600 font-medium">
                  <CheckCircle2 className="h-4 w-4" /> Preferencias Guardadas
                </span>
              ) : hasChanges ? (
                <span className="text-brand-yellow font-medium italic">Tienes cambios sin guardar.</span>
              ) : (
                'Tus ajustes están actualizados.'
              )}
            </div>

            <Button onClick={save} disabled={!hasChanges || saving} size="lg" className="w-full sm:w-auto rounded-full px-8 shadow-md">
              {saving ? 'Aplicando...' : <><Save className="mr-2 h-4 w-4" /> Guardar Preferencias</>}
            </Button>
          </div>
        </section>

        {/* Nota Legal */}
        <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 leading-relaxed max-w-lg mx-auto">
          Nota: Puedes actualizar estas preferencias en cualquier momento. Si tienes dudas sobre cómo manejamos tus datos, <Link href="/contact" className="hover:text-brand-blue underline">contáctanos</Link>.
        </p>

      </div>
    </main>
  );
}