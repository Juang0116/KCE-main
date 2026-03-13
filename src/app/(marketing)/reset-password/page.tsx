/* src/app/(marketing)/reset-password/page.tsx */
'use client';

import * as React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';

type Status = 'idle' | 'busy' | 'ok' | 'error';

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function checkPassword(pw: string) {
  const len = pw.length >= 10; // si quieres 8, cambia a >= 8
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

  const canSubmit =
    status !== 'busy' && rules.ok && match && pass.length > 0 && pass2.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'busy') return;

    setMsg('');

    if (!rules.ok) {
      setStatus('error');
      setMsg('Revisa los requisitos de la contraseña.');
      return;
    }
    if (!match) {
      setStatus('error');
      setMsg('Las contraseñas no coinciden.');
      return;
    }

    const sb = supabaseBrowser();
    if (!sb) {
      setStatus('error');
      setMsg('Auth no configurado. Revisa tus variables NEXT_PUBLIC_SUPABASE_*.');
      return;
    }

    setStatus('busy');

    const { error } = await sb.auth.updateUser({ password: pass });

    if (error) {
      setStatus('error');
      setMsg(maskSupabaseError(error.message || ''));
      return;
    }

    // Opcional: cerrar sesión para “limpiar” el flujo de recovery
    try {
      await sb.auth.signOut();
    } catch {
      // noop
    }

    setStatus('ok');
    setMsg('Contraseña actualizada. Ya puedes iniciar sesión con tu nueva contraseña.');
    setPass('');
    setPass2('');
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="card p-6 md:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl text-brand-blue">Nueva contraseña</h1>
            <p className="mt-2 text-sm text-[color:var(--color-text)]/75">
              Crea una contraseña segura para tu cuenta.
            </p>
          </div>

          <div
            className={cx(
              'rounded-full border px-3 py-1 text-xs',
              status === 'ok' && 'border-emerald-200/40 bg-emerald-200/15 text-emerald-900 dark:text-emerald-50',
              status === 'error' &&
                'border-red-200/40 bg-red-200/15 text-red-900 dark:text-red-50',
              (status === 'idle' || status === 'busy') &&
                'border-[var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]/70',
            )}
          >
            {status === 'busy'
              ? 'Guardando…'
              : status === 'ok'
                ? 'Listo'
                : status === 'error'
                  ? 'Revisa'
                  : 'Seguro'}
          </div>
        </div>

        {/* Requisitos */}
        <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">
            Requisitos
          </div>
          <ul className="mt-3 grid gap-2 text-sm">
            <li className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cx(
                  'grid size-5 place-items-center rounded-full border text-xs',
                  rules.len
                    ? 'border-emerald-200/40 bg-emerald-200/15 text-emerald-900 dark:text-emerald-50'
                    : 'border-[var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)]/60',
                )}
              >
                ✓
              </span>
              <span className="text-[color:var(--color-text)]/75">Mínimo 10 caracteres</span>
            </li>

            <li className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cx(
                  'grid size-5 place-items-center rounded-full border text-xs',
                  rules.upper
                    ? 'border-emerald-200/40 bg-emerald-200/15 text-emerald-900 dark:text-emerald-50'
                    : 'border-[var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)]/60',
                )}
              >
                ✓
              </span>
              <span className="text-[color:var(--color-text)]/75">Al menos 1 letra mayúscula</span>
            </li>

            <li className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cx(
                  'grid size-5 place-items-center rounded-full border text-xs',
                  rules.number
                    ? 'border-emerald-200/40 bg-emerald-200/15 text-emerald-900 dark:text-emerald-50'
                    : 'border-[var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)]/60',
                )}
              >
                ✓
              </span>
              <span className="text-[color:var(--color-text)]/75">Al menos 1 número</span>
            </li>
          </ul>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-6 space-y-3"
        >
          <div className="space-y-1.5">
            <label htmlFor="reset_new_password" className="text-sm font-medium text-[color:var(--color-text)]">
              Nueva contraseña
            </label>
            <input
              id="reset_new_password"
              type="password"
              required
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Ej: Kce2026ViajeSeguro"
              autoComplete="new-password"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reset_confirm_password" className="text-sm font-medium text-[color:var(--color-text)]">
              Repite la contraseña
            </label>
            <input
              id="reset_confirm_password"
              type="password"
              required
              value={pass2}
              onChange={(e) => setPass2(e.target.value)}
              placeholder="Repite exactamente la misma"
              autoComplete="new-password"
              className={cx(
                'w-full rounded-xl border bg-[color:var(--color-surface)] px-3 py-2 text-sm outline-none focus:ring-2',
                pass2.length === 0
                  ? 'border-[var(--color-border)] focus:ring-brand-blue/30'
                  : match
                    ? 'border-emerald-200/40 focus:ring-emerald-500/20'
                    : 'border-red-200/50 focus:ring-red-500/20',
              )}
            />
            {pass2.length > 0 && !match ? (
              <p className="text-xs text-red-600 dark:text-red-200">No coincide.</p>
            ) : null}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={!canSubmit}
              isLoading={status === 'busy'}
              className="w-full py-2.5"
            >
              Guardar contraseña
            </Button>
          </div>
        </form>

        {msg ? (
          <p
            role={status === 'error' ? 'alert' : 'status'}
            className={cx(
              'mt-4 rounded-xl border px-3 py-2 text-sm',
              status === 'error'
                ? 'border-red-200/40 bg-red-200/15 text-red-900 dark:text-red-50'
                : 'border-emerald-200/40 bg-emerald-200/15 text-emerald-900 dark:text-emerald-50',
            )}
          >
            {msg}
          </p>
        ) : null}

        {status === 'ok' ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="text-sm text-brand-blue underline underline-offset-4 hover:opacity-90"
            >
              Ir a iniciar sesión
            </Link>
            <Link
              href="/account"
              className="text-sm text-brand-blue underline underline-offset-4 hover:opacity-90"
            >
              Ir a mi cuenta
            </Link>
          </div>
        ) : (
          <p className="mt-4 text-xs text-[color:var(--color-text)]/60">
            Si el enlace expiró, vuelve a solicitar el restablecimiento desde{' '}
            <Link
              href="/forgot-password"
              className="text-brand-blue underline underline-offset-4 hover:opacity-90"
            >
              “Olvidé mi contraseña”
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
