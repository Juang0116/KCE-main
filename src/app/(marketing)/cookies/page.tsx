'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Settings, Save, CheckCircle2, Lock, Fingerprint, BarChart3 } from 'lucide-react';
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

function Toggle({ id, checked, disabled, onChange, label, description, icon: Icon }: {
  id: string; checked: boolean; disabled?: boolean; onChange?: (next: boolean) => void; label: string; description?: string; icon: any;
}) {
  return (
    <div className={cx(
      'group flex items-start justify-between gap-6 rounded-[2.5rem] border p-8 transition-all duration-300',
      checked && !disabled 
        ? 'border-[var(--brand-blue)]/20 bg-[color:var(--color-surface)] shadow-md' 
        : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/50 grayscale hover:grayscale-0'
    )}>
      <div className="flex gap-5">
        <div className={cx(
          "h-12 w-12 shrink-0 flex items-center justify-center rounded-2xl transition-colors",
          checked && !disabled ? "bg-[var(--brand-blue)] text-white" : "bg-[color:var(--color-border)] text-[color:var(--color-text-muted)]"
        )}>
          <Icon className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className="block text-xl font-heading text-[var(--brand-blue)]">
            {label}
          </label>
          {description && (
            <p className="mt-2 text-sm font-light leading-relaxed text-[color:var(--color-text-muted)]">{description}</p>
          )}
        </div>
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
            'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20',
            disabled ? 'cursor-not-allowed bg-[color:var(--color-border)] border-transparent'
                     : checked ? 'bg-[var(--color-success, var(--color-success, var(--color-success)))] border-transparent' : 'bg-[color:var(--color-border)] border-transparent'
          )}
        >
          <span
            aria-hidden="true"
            className={cx(
              'pointer-events-none inline-block size-6 translate-x-0.5 rounded-full bg-[color:var(--color-surface)] shadow-lg transition-transform duration-300 ease-out',
              checked ? 'translate-x-[1.6rem]' : 'translate-x-0'
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
    const raw = typeof document !== 'undefined' ? getCookie(COOKIE_NAME) : null;
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
    if (!raw) return;
    try {
      const parsed: any = JSON.parse(raw);
      setPrefs({ necessary: true, analytics: !!parsed.analytics, marketing: !!parsed.marketing });
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
    <main className="min-h-screen bg-[color:var(--color-bg)] pb-24 pt-24 md:pt-40">
      <div className="mx-auto max-w-4xl px-6">
        
        {/* Cabecera Editorial */}
        <header className="mb-16 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--brand-blue)] shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-yellow)]" /> Privacidad y Transparencia
          </div>
          <h1 className="font-heading text-5xl md:text-7xl text-[var(--brand-blue)] tracking-tighter leading-[0.9] mb-8">
            Tus datos, <br/><span className="text-[var(--brand-yellow)] italic font-light">tu decisión.</span>
          </h1>
          <p className="text-xl font-light text-[color:var(--color-text-muted)] max-w-2xl mx-auto leading-relaxed mb-10">
            En KCE creemos en una navegación honesta. Controla qué cookies permites para personalizar tu viaje por nuestra plataforma.
          </p>

          <nav className="flex flex-wrap justify-center gap-6 text-[11px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)]">
            <Link href="/privacy" className="hover:text-[var(--brand-blue)] transition-colors">Política de Privacidad</Link>
            <span className="opacity-20">/</span>
            <Link href="/terms" className="hover:text-[var(--brand-blue)] transition-colors">Términos de Servicio</Link>
            <span className="opacity-20">/</span>
            <span className="text-[var(--brand-blue)] border-b-2 border-[var(--brand-yellow)] pb-1">Gestión de Cookies</span>
          </nav>
        </header>

        {/* Panel de Control - Diseño Limpio */}
        <section className="rounded-[4rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10 md:p-20 shadow-2xl relative overflow-hidden">
          <div className="mb-12 flex items-center justify-between border-b border-[color:var(--color-border)] pb-8">
            <div className="flex items-center gap-4">
              <Settings className="h-7 w-7 text-[var(--brand-blue)]/30" />
              <h2 className="font-heading text-3xl text-[var(--brand-blue)]">Preferencias</h2>
            </div>
          </div>

          <div className="space-y-6">
            <Toggle
              id="cookies-necessary"
              checked
              disabled
              icon={Lock}
              label="Cookies Esenciales"
              description="Obligatorias para procesar pagos seguros vía Stripe, mantener tu sesión y garantizar que tus reservas no se pierdan."
            />
            <Toggle
              id="cookies-analytics"
              checked={prefs.analytics}
              icon={BarChart3}
              onChange={(next) => setPrefs((p) => ({ ...p, analytics: next }))}
              label="Métricas de Rendimiento"
              description="Nos ayudan a entender de forma anónima qué experiencias culturales son las más valoradas por nuestra comunidad."
            />
            <Toggle
              id="cookies-marketing"
              checked={prefs.marketing}
              icon={Fingerprint}
              onChange={(next) => setPrefs((p) => ({ ...p, marketing: next }))}
              label="Personalización Premium"
              description="Permite que recordemos tus intereses para ofrecerte itinerarios que realmente conecten con tu estilo de viaje."
            />
          </div>

          {/* Barra de Acción Inferior */}
          <div className="mt-16 pt-10 border-t border-[color:var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="text-sm font-medium">
              {saved ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-5 py-2.5 text-[var(--color-success, var(--color-success, var(--color-success)))] animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="h-4 w-4" /> Ajustes actualizados
                </span>
              ) : hasChanges ? (
                <span className="text-[var(--brand-yellow)] italic font-light text-lg">Tienes cambios pendientes por guardar.</span>
              ) : (
                <span className="text-[color:var(--color-text-muted)] font-light">Tus preferencias están al día.</span>
              )}
            </div>

            <Button 
              onClick={save} 
              disabled={!hasChanges || saving} 
              size="lg" 
              className="w-full sm:w-auto rounded-full px-12 h-16 bg-[var(--brand-blue)] hover:bg-[var(--brand-dark)] text-white shadow-xl transition-all disabled:opacity-30 text-[11px] font-bold uppercase tracking-widest"
            >
              {saving ? 'Aplicando...' : <><Save className="mr-3 h-4 w-4" /> Guardar Cambios</>}
            </Button>
          </div>
        </section>

        {/* Footer de Soporte */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[color:var(--color-text-muted)] leading-relaxed max-w-md mx-auto">
            KCE Travel — Compromiso con la protección de datos y la transparencia digital.
          </p>
          <p className="text-sm text-[color:var(--color-text-muted)]">
            ¿Dudas sobre tus derechos? <Link href="/contact" className="text-[var(--brand-blue)] font-bold hover:underline">Habla con nuestro equipo</Link>.
          </p>
        </div>

      </div>
    </main>
  );
}