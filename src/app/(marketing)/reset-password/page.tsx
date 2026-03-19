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
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-[var(--color-bg)] animate-fade-in">
      
      <div className="w-full max-w-md">
        
        {/* 01. HEADER ICON AREA */}
        <div className="mb-12 text-center flex flex-col items-center">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-brand-blue shadow-soft group">
            <Lock className="h-6 w-6 transition-transform group-hover:scale-110" />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl text-[var(--color-text)] tracking-tight mb-3">Crear Contraseña</h1>
          <p className="text-sm font-light text-[var(--color-text-muted)] leading-relaxed max-w-[280px]">
            Establece una nueva clave segura para recuperar el acceso a tu cuenta KCE.
          </p>
        </div>

        {/* 02. SECURITY CARD */}
        <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-10 shadow-soft relative">
          
          {status === 'ok' ? (
            <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-heading text-[var(--color-text)] mb-3">¡Todo listo!</h2>
              <p className="text-sm font-light text-[var(--color-text-muted)] mb-10 leading-relaxed">{msg}</p>
              
              <Button asChild size="lg" className="w-full rounded-full bg-brand-blue hover:bg-brand-blue/90 text-white shadow-pop">
                <Link href="/login">
                  Ir a Iniciar Sesión <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Security Requirements Rail */}
              <div className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-5 md:p-6 shadow-inner">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-70 mb-4 pb-3 border-b border-[var(--color-border)]">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-blue" /> Requisitos de Seguridad
                </div>
                <ul className="space-y-3">
                  {[
                    { met: rules.len, label: 'Mínimo 8 caracteres' },
                    { met: rules.upper, label: 'Al menos 1 mayúscula' },
                    { met: rules.number, label: 'Al menos 1 número' }
                  ].map((rule, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-xs">
                      <div className={cx(
                        "h-4 w-4 rounded-full flex items-center justify-center border transition-all duration-300",
                        rule.met ? "bg-emerald-500 border-emerald-500 text-white" : "border-[var(--color-border)] bg-transparent text-transparent"
                      )}>
                        <CheckCircle2 className="h-2.5 w-2.5" />
                      </div>
                      <span className={cx(
                        "transition-colors duration-300",
                        rule.met ? "text-[var(--color-text)] font-medium" : "text-[var(--color-text-muted)]"
                      )}>
                        {rule.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {status === 'error' && msg && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-start gap-3 animate-slide-up">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" /> <span>{msg}</span>
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="new_password" className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Nueva Clave</label>
                  <input
                    id="new_password"
                    type="password"
                    required
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="confirm_password" className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Confirmar Clave</label>
                  <input
                    id="confirm_password"
                    type="password"
                    required
                    value={pass2}
                    onChange={(e) => setPass2(e.target.value)}
                    placeholder="••••••••"
                    className={cx(
                      "w-full rounded-xl border px-5 py-4 text-sm outline-none transition-all",
                      pass2.length > 0 && !match 
                        ? "border-red-300 bg-red-50 focus:ring-red-500/10 focus:border-red-500" 
                        : pass2.length > 0 && match 
                          ? "border-emerald-300 bg-emerald-50 focus:ring-emerald-500/10 focus:border-emerald-500" 
                          : "border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-brand-blue/10 focus:border-brand-blue"
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  size="lg"
                  className="w-full mt-4 rounded-full py-7 shadow-pop group"
                >
                  {status === 'busy' ? (
                    <span className="flex items-center gap-2">Actualizando...</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Guardar Nueva Contraseña <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* 03. FOOTER TRUST BADGE */}
        <div className="mt-12 text-center flex justify-center">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-soft group cursor-default">
            <KeyRound className="h-3.5 w-3.5 text-brand-yellow transition-transform group-hover:rotate-12" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-60">
              Seguridad de Grado Bancario
            </span>
          </div>
        </div>

      </div>
    </main>
  );
}