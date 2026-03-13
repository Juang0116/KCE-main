/* src/app/(marketing)/cookies/page.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const secure =
    typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure}`;
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
}: {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className={cx(
            'block text-sm font-semibold tracking-tight text-[color:var(--color-text)]',
            disabled && 'opacity-80',
          )}
        >
          {label}
        </label>
        {description ? (
          <p className="mt-1 text-sm text-[color:var(--color-text)]/70">{description}</p>
        ) : null}
      </div>

      <div className="pt-0.5">
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
            'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40',
            disabled
              ? 'cursor-not-allowed border-[var(--color-border)] bg-[color:var(--color-surface-2)] opacity-70'
              : checked
                ? 'border-brand-blue/30 bg-brand-blue/25'
                : 'border-[var(--color-border)] bg-[color:var(--color-surface-2)] hover:bg-[color:var(--color-surface)]',
          )}
        >
          <span
            aria-hidden="true"
            className={cx(
              'pointer-events-none inline-block size-5 translate-x-1 rounded-full shadow-sm transition',
              checked ? 'translate-x-6 bg-brand-blue' : 'bg-[color:var(--color-text)]/50',
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

  // Para comparar si hay cambios y habilitar/deshabilitar el botón Guardar
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // solo una vez

  useEffect(() => {
    // Cargar desde cookie al montar (si existe)
    const raw = getCookie(COOKIE_NAME);
    if (!raw) return;
    try {
      const parsed: unknown = JSON.parse(raw);
      const p = parsed as { analytics?: unknown; marketing?: unknown };
      setPrefs({ necessary: true, analytics: !!p.analytics, marketing: !!p.marketing });
    } catch {
      // ignore invalid cookie
    }
  }, []);

  const hasChanges =
    prefs.analytics !== initialPrefs.analytics || prefs.marketing !== initialPrefs.marketing;

  async function save() {
    if (saving) return;
    setSaving(true);

    setCookie(COOKIE_NAME, JSON.stringify(prefs));

    // Best-effort (no rompemos UX si falla)
    await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefs, page: '/cookies' }),
    }).catch(() => {});

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl tracking-tight text-brand-blue">
          Preferencias de cookies
        </h1>
        <p className="text-sm text-[color:var(--color-text)]/70">
          Controla qué cookies permites. Las cookies necesarias siempre permanecen activas para que
          el sitio funcione correctamente.
        </p>
        <nav aria-label="Navegación legal" className="flex flex-wrap gap-4 pt-2 text-sm">
          <a href="/privacy" className="text-brand-blue underline underline-offset-4 hover:opacity-90">Privacidad</a>
          <a href="/terms" className="text-brand-blue underline underline-offset-4 hover:opacity-90">Términos</a>
          <a href="/cookies" className="text-brand-blue underline underline-offset-4 hover:opacity-90">Cookies</a>
          <a href="/contact" className="text-brand-blue underline underline-offset-4 hover:opacity-90">Contacto</a>
        </nav>
      </header>

      <section className="mt-6 card p-6">
        <div className="space-y-4">
          <Toggle
            id="cookies-necessary"
            checked
            disabled
            label="Necesarias"
            description="Imprescindibles para seguridad, sesión, navegación y funcionamiento básico."
          />

          <Toggle
            id="cookies-analytics"
            checked={prefs.analytics}
            onChange={(next) => setPrefs((p) => ({ ...p, analytics: next }))}
            label="Analíticas"
            description="Nos ayuda a medir uso y rendimiento para mejorar tu experiencia."
          />

          <Toggle
            id="cookies-marketing"
            checked={prefs.marketing}
            onChange={(next) => setPrefs((p) => ({ ...p, marketing: next }))}
            label="Marketing"
            description="Permite atribución de campañas y personalización de anuncios (si aplica)."
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={save} disabled={!hasChanges || saving}>
            {saving ? 'Guardando…' : 'Guardar preferencias'}
          </Button>

          <span className="text-sm text-[color:var(--color-text)]/60">
            {saved ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-3 py-1 text-brand-blue ring-1 ring-brand-blue/20">
                Guardado ✅
              </span>
            ) : hasChanges ? (
              'Tienes cambios sin guardar.'
            ) : (
              'Sin cambios.'
            )}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
          <p className="text-xs text-[color:var(--color-text)]/65">
            Nota: Puedes actualizar estas preferencias en cualquier momento. Algunas funciones pueden
            depender de tu elección (por ejemplo, medición de uso o atribución). Si tienes dudas,
            contáctanos.
          </p>
        </div>
      </section>
    </main>
  );
}
