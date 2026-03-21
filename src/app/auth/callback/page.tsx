'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react';

import { supabaseBrowser } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/Button';

function safeNextPath(nextParam: string | null, fallback: string) {
  const n = (nextParam ?? '').trim();
  if (!n) return fallback;
  // Evita open-redirects por seguridad
  if (!n.startsWith('/') || n.startsWith('//')) return fallback;
  return n;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        const supabase = supabaseBrowser();
        if (!supabase) {
          setStatus('error');
          setErrorMessage('La configuración del sistema no está disponible en este momento.');
          return;
        }

        // PKCE flow: Intercambio de código por sesión activa
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) throw error;

        const url = new URL(window.location.href);
        const next = safeNextPath(url.searchParams.get('next'), '/wishlist');

        setStatus('success');
        
        // Pequeño delay intencional para que el usuario vea el estado de éxito
        setTimeout(() => {
          router.replace(next);
        }, 1000);

      } catch (err: any) {
        console.error('Auth Callback Error:', err);
        setStatus('error');
        setErrorMessage('No pudimos verificar tu identidad. El enlace podría haber expirado.');
      }
    })();
  }, [router]);

  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-[color:var(--color-bg)] px-6">
      <div className="w-full max-w-md">
        <div className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10 md:p-14 shadow-2xl text-center relative overflow-hidden">
          
          {/* Decoración de fondo sutil */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--brand-blue)] via-[var(--brand-yellow)] to-[var(--color-success, var(--color-success, var(--color-success)))]"></div>

          {status === 'loading' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-[var(--brand-blue)] animate-spin" />
                <div className="absolute inset-0 rounded-full border-4 border-[var(--brand-blue)]/10 border-t-[var(--brand-yellow)] animate-[spin_3s_linear_infinite]"></div>
              </div>
              <div className="space-y-3">
                <h1 className="font-heading text-2xl text-[var(--brand-blue)]">Verificando credenciales</h1>
                <p className="text-sm font-light text-[color:var(--color-text-muted)]">Estamos preparando tu acceso seguro a la plataforma KCE...</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-8 animate-in zoom-in duration-500">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-[var(--color-success, var(--color-success, var(--color-success)))]" />
              </div>
              <div className="space-y-3">
                <h1 className="font-heading text-2xl text-[var(--brand-blue)]">¡Acceso concedido!</h1>
                <p className="text-sm font-light text-[color:var(--color-text-muted)]">Redirigiendo a tu panel personal...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="mx-auto w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                <ShieldAlert className="h-10 w-10 text-red-500" />
              </div>
              <div className="space-y-3">
                <h1 className="font-heading text-2xl text-red-600">Error de autenticación</h1>
                <p className="text-sm font-light text-[color:var(--color-text-muted)]">{errorMessage}</p>
              </div>
              <Button 
                onClick={() => router.push('/login')}
                className="w-full rounded-full h-14 bg-[var(--brand-blue)] hover:bg-[var(--brand-dark)] text-[11px] font-bold uppercase tracking-widest"
              >
                Reintentar acceso
              </Button>
            </div>
          )}
        </div>

        {/* Branding de seguridad */}
        <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
          KCE Security Protocol — Cifrado de punto a punto
        </p>
      </div>
    </main>
  );
}