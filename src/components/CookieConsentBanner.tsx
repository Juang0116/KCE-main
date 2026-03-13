'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';

type Prefs = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const COOKIE_NAME = 'kce_consent';
const ONE_YEAR = 60 * 60 * 24 * 365;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const re = new RegExp(`(^|;)\\s*${name}=([^;]+)`);
  const m = document.cookie.match(re);

  const raw = m?.[2];
  if (!raw) return null;

  return decodeURIComponent(raw);
}

function setCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`;
}

async function postConsent(prefs: Prefs) {
  try {
    await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefs }),
    });
  } catch {
    // best-effort
  }
}

export default function CookieConsentBanner() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'banner' | 'manage'>('banner');
  const [prefs, setPrefs] = useState<Prefs>({ necessary: true, analytics: false, marketing: false });

  useEffect(() => {
    const raw = getCookie(COOKIE_NAME);
    if (!raw) {
      setOpen(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setPrefs({
        necessary: true,
        analytics: !!parsed.analytics,
        marketing: !!parsed.marketing,
      });
      setOpen(false);
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:p-4">
      <div className="mx-auto max-w-4xl rounded-2xl border border-black/10 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-black">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm">
            <div className="font-semibold">Cookies y privacidad</div>
            <div className="mt-1 opacity-80">
              Usamos cookies necesarias para el funcionamiento. Puedes aceptar analíticas/marketing o
              gestionar tus preferencias.
              <a className="ml-2 underline" href="/cookies">
                Ver más
              </a>
            </div>
          </div>

          {mode === 'banner' ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setMode('manage')}>
                Gestionar
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  const p: Prefs = { necessary: true, analytics: true, marketing: true };
                  setCookie(COOKIE_NAME, JSON.stringify(p));
                  postConsent(p);
                  setOpen(false);
                }}
              >
                Aceptar todo
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const p: Prefs = { necessary: true, analytics: false, marketing: false };
                  setCookie(COOKIE_NAME, JSON.stringify(p));
                  postConsent(p);
                  setOpen(false);
                }}
              >
                Rechazar
              </Button>
            </div>
          ) : (
            <div className="flex-1">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked disabled />
                  Necesarias
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={prefs.analytics}
                    onChange={(e) => setPrefs((p) => ({ ...p, analytics: e.target.checked }))}
                  />
                  Analíticas
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={prefs.marketing}
                    onChange={(e) => setPrefs((p) => ({ ...p, marketing: e.target.checked }))}
                  />
                  Marketing
                </label>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    const p: Prefs = { ...prefs, necessary: true };
                    setCookie(COOKIE_NAME, JSON.stringify(p));
                    postConsent(p);
                    setOpen(false);
                  }}
                >
                  Guardar
                </Button>

                <Button size="sm" variant="secondary" onClick={() => setMode('banner')}>
                  Atrás
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
