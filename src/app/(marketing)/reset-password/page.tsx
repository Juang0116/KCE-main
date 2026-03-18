'use client';

import * as React from 'react';
import Link from 'next/link';
import { Lock, CheckCircle2, ShieldAlert, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/Button';

type Status = 'idle' | 'busy' | 'ok' | 'error';

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function checkPassword(pw: string) {
  const len = pw.length >= 8; 
  const upper = /[A-ZÁÉÍÓÚÑ]/.test(pw);
  const number = /\d/.test(pw);
  return { len, upper, number, ok: len && upper && number };
}

function maskSupabaseError(msg: string) {
  const m = (msg || '').toLowerCase();
  if (m.includes('weak') || m.includes('password')) return 'La contraseña es demasiado débil.';
  if (m.includes('expired')) return 'El enlace expiró. Vuelve a solicitar el restablecimiento.';
  if (m.includes('invalid')) return 'Enlace inválido. Vuelve a solicitar el restablecimiento.';
  return 'No se pudo actualizar la contraseña. Intenta de nuevo.';
}

export default function ResetPasswordPage() {
  const [pass, setPass] = React.useState('');
  const [pass2, setPass2] = React.useState('');
  const [status, setStatus] = React.useState<Status>('idle');
  const [msg, setMsg] = React.useState('');

  const rules = React.useMemo(() => checkPassword(pass), [pass]);
  const match = pass.length > 0 && pass2.length > 0 && pass === pass2;
  const canSubmit = status !== 'busy' && rules.ok && match;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'busy') return;
    setMsg('');

    if (!rules.ok) { setStatus('error'); setMsg('Revisa los requisitos de la contraseña.'); return; }
    if (!match) { setStatus('error'); setMsg('Las contraseñas no coinciden.'); return; }

    const sb = supabaseBrowser();
    if (!sb) { setStatus('error'); setMsg('Error de conexión. Recarga la página.'); return; }

    setStatus('busy');
    const { error } = await sb.auth.updateUser({ password: pass });

    if (error) {
      setStatus('error');
      setMsg(maskSupabaseError(error.message || ''));
      return;
    }

    try { await sb.auth.signOut(); } catch { /* noop */ }

    setStatus('ok');
    setMsg('Tu contraseña ha sido actualizada con éxito.');
    setPass(''); setPass2('');
  }

  return (
    <main className="min-h-[90vh] flex flex-col items-center justify-center px-6 py-12 md:py-24 bg-[var(--color-bg)]">
      
      <div className="w-full max-w-md">
        
        {/* Header Icon Area */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue border border-brand-blue/10 shadow-sm">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-3xl text-brand-blue mb-3">Crear Contraseña</h1>
          <p className="text-sm font-light text-[var(--color-text)]/60 leading-relaxed">
            Establece una nueva clave segura para recuperar el acceso total a tu cuenta KCE.
          </p>
        </div>

        {/* The Vault Card */}
        <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-10 shadow-2xl relative">
          {/* Subtle security accent line */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-blue via-brand-yellow to-brand-blue"></div>

          {status === 'ok' ? (
            <div className="text-center py-4 animate-in fade-in zoom-in duration-500">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h2 className="text-xl font-heading text-brand-blue mb-2">¡Todo listo!</h2>
              <p className="text-sm font-light text-[var(--color-text)]/70 mb-8">{msg}</p>
              
              <Button asChild size="lg" className="w-full rounded-full shadow-lg">
                <Link href="/login">
                  Ir a Iniciar Sesión <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Security Requirements Rail */}
              <div className="mb-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40 mb-4">
                  <ShieldCheck className="h-3 w-3 text-brand-blue" /> Requisitos de Seguridad
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-xs font-medium">
                    <CheckCircle2 className={cx("h-4 w-4 transition-colors", rules.len ? "text-emerald-500" : "text-[var(--color-border)]")} />
                    <span className={cx(rules.len ? "text-[var(--color-text)]" : "text-[var(--color-text)]/40")}>Mínimo 8 caracteres</span>
                  </li>
                  <li className="flex items-center gap-3 text-xs font-medium">
                    <CheckCircle2 className={cx("h-4 w-4 transition-colors", rules.upper ? "text-emerald-500" : "text-[var(--color-border)]")} />
                    <span className={cx(rules.upper ? "text-[var(--color-text)]" : "text-[var(--color-text)]/40")}>Al menos 1 mayúscula</span>
                  </li>
                  <li className="flex items-center gap-3 text-xs font-medium">
                    <CheckCircle2 className={cx("h-4 w-4 transition-colors", rules.number ? "text-emerald-500" : "text-[var(--color-border)]")} />
                    <span className={cx(rules.number ? "text-[var(--color-text)]" : "text-[var(--color-text)]/40")}>Al menos 1 número</span>
                  </li>
                </ul>
              </div>

              {status === 'error' && msg && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-500/5 p-4 text-sm text-red-700 flex items-start gap-3 animate-in slide-in-from-top-2">
                  <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" /> <span>{msg}</span>
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label htmlFor="new_password" className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-4">Nueva Clave</label>
                  <input
                    id="new_password"
                    type="password"
                    required
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-4 text-sm outline-none focus:border-brand-blue focus:bg-white transition-all shadow-sm"
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="confirm_password" className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-4">Confirmar Clave</label>
                  <input
                    id="confirm_password"
                    type="password"
                    required
                    value={pass2}
                    onChange={(e) => setPass2(e.target.value)}
                    placeholder="••••••••"
                    className={cx(
                      "w-full rounded-2xl border px-5 py-4 text-sm outline-none transition-all shadow-sm",
                      pass2.length > 0 && !match 
                        ? "border-red-400 bg-red-50/30 focus:border-red-500" 
                        : pass2.length > 0 && match 
                          ? "border-emerald-400 bg-emerald-50/30 focus:border-emerald-500" 
                          : "border-[var(--color-border)] bg-[var(--color-surface-2)] focus:border-brand-blue focus:bg-white"
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  size="lg"
                  className="w-full mt-4 rounded-full py-7 shadow-xl shadow-brand-blue/10"
                >
                  {status === 'busy' ? 'Guardando...' : 'Guardar Nueva Contraseña'}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Footer Support Badge */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)]">
            <KeyRound className="h-3.5 w-3.5 text-brand-yellow" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">
              Seguridad de Grado Bancario
            </span>
          </div>
        </div>

      </div>
    </main>
  );
}