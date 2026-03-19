/* src/components/CookieConsentBanner.tsx */
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button'; // Asegúrate de que la ruta coincida con tu ButtonPremium o el de Shadcn
import { t, type Dictionary } from '@/i18n/getDictionary';
import clsx from 'clsx';

type Prefs = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

type Props = {
  dict: Dictionary;
};

const COOKIE_NAME = 'kce_consent';
const ONE_YEAR = 60 * 60 * 24 * 365;

// Utils de cookies integrados para evitar dependencias externas
function setConsentCookie(prefs: Prefs) {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(prefs))}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`;
}

export default function CookieConsentBanner({ dict }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'banner' | 'manage'>('banner');
  const [prefs, setPrefs] = useState<Prefs>({ necessary: true, analytics: false, marketing: false });

  useEffect(() => {
    const raw = document.cookie.split('; ').find(row => row.startsWith(`${COOKIE_NAME}=`))?.split('=')[1];
    if (!raw) {
      setOpen(true);
      return;
    }
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      setPrefs({ necessary: true, analytics: !!parsed.analytics, marketing: !!parsed.marketing });
    } catch {
      setOpen(true);
    }
  }, []);

  const handleSave = (newPrefs: Prefs) => {
    setConsentCookie(newPrefs);
    // Podrías disparar eventos de GTM aquí
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[110] p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-brand-dark/10 bg-white/95 p-6 shadow-2xl backdrop-blur-md dark:bg-brand-dark/95">
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          
          <div className="space-y-1">
            <h4 className="font-heading text-lg font-bold text-brand-blue dark:text-white">
              {t(dict, 'cookies.title', 'Tu privacidad es nuestra prioridad')}
            </h4>
            <p className="max-w-xl text-sm leading-relaxed text-brand-dark/70 dark:text-white/70">
              {t(dict, 'cookies.description', 'Utilizamos cookies para mejorar tu experiencia de reserva y entender cómo exploras Colombia con nosotros.')}
              <a href="/privacy" className="ml-1 font-bold text-brand-blue underline decoration-brand-blue/30 underline-offset-4 hover:text-brand-yellow">
                {t(dict, 'cookies.link', 'Política de privacidad')}
              </a>
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {mode === 'banner' ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl"
                  onClick={() => setMode('manage')}
                >
                  {t(dict, 'cookies.manage', 'Gestionar')}
                </Button>
                <Button 
                  size="sm" 
                  className="rounded-xl bg-brand-blue text-white hover:bg-brand-blue/90"
                  onClick={() => handleSave({ necessary: true, analytics: true, marketing: true })}
                >
                  {t(dict, 'cookies.accept', 'Aceptar todas')}
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-4 w-full md:w-auto">
                <div className="flex gap-4">
                  <PreferenceToggle 
                    label="Necesarias" 
                    checked disabled 
                  />
                  <PreferenceToggle 
                    label="Análisis" 
                    checked={prefs.analytics} 
                    onChange={(v) => setPrefs(p => ({...p, analytics: v}))} 
                  />
                  <PreferenceToggle 
                    label="Marketing" 
                    checked={prefs.marketing} 
                    onChange={(v) => setPrefs(p => ({...p, marketing: v}))} 
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setMode('banner')}>Atrás</Button>
                  <Button size="sm" onClick={() => handleSave(prefs)}>Guardar mi selección</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreferenceToggle({ label, checked, onChange, disabled = false }: { 
  label: string, checked: boolean, onChange?: (v: boolean) => void, disabled?: boolean 
}) {
  return (
    <label className={clsx(
      "flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-opacity",
      disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
    )}>
      <input 
        type="checkbox" 
        checked={checked} 
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="h-4 w-4 rounded border-brand-dark/20 text-brand-blue focus:ring-brand-blue"
      />
      {label}
    </label>
  );
}