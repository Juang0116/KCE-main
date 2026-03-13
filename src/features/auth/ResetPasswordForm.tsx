/* src/features/auth/ResetPasswordForm.tsx */
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';

type Status = 'idle' | 'saving' | 'done' | 'error';

function safeNextPath(nextParam: string | null, fallback: string) {
  const n = (nextParam ?? '').trim();
  if (!n) return fallback;
  if (!n.startsWith('/') || n.startsWith('//')) return fallback;
  return n;
}

export default function ResetPasswordForm({ nextParam }: { nextParam?: string | null }) {
  const router = useRouter();

  const [password, setPassword] = React.useState('');
  const [password2, setPassword2] = React.useState('');

  const [status, setStatus] = React.useState<Status>('idle');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const nextPath = safeNextPath(nextParam ?? null, '/');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg('La contraseña debe tener mínimo 8 caracteres.');
      setStatus('error');
      return;
    }
    if (password !== password2) {
      setErrorMsg('Las contraseñas no coinciden.');
      setStatus('error');
      return;
    }

    setStatus('saving');

    try {
      const sb = supabaseBrowser();
      if (!sb) {
        setErrorMsg('Auth no configurado. Revisa .env.local y reinicia.');
        setStatus('error');
        return;
      }

      // En el flujo de recovery, Supabase detecta el token en la URL y crea sesión.
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;

      setStatus('done');

      // Redirige luego de un segundo para que el usuario vea el OK
      setTimeout(() => {
        router.push(nextPath);
      }, 800);
    } catch (err: any) {
      console.error('[ResetPassword] update error:', err);
      setErrorMsg(err?.message || 'No pudimos actualizar la contraseña.');
      setStatus('error');
    }
  }

  return (
    <div className="card p-6">
      <h2 className="font-heading text-xl text-brand-blue">Nueva contraseña</h2>
      <p className="text-[color:var(--color-text)]/75 mt-2">
        Elige una contraseña nueva para tu cuenta.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 flex flex-col gap-3"
      >
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña (mín 8)"
          className="w-full"
          autoComplete="new-password"
          minLength={8}
        />
        <input
          type="password"
          required
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          placeholder="Repite la contraseña"
          className="w-full"
          autoComplete="new-password"
          minLength={8}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            disabled={status === 'saving'}
            isLoading={status === 'saving'}
          >
            Guardar
          </Button>
          <Button
            asChild
            variant="ghost"
          >
            <Link href="/login">Ir a login</Link>
          </Button>
        </div>
      </form>

      {status === 'done' ? (
        <p className="text-[color:var(--color-text)]/80 mt-4">Listo. Redirigiendo…</p>
      ) : null}

      {status === 'error' && errorMsg ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          <div className="font-semibold">No se pudo actualizar</div>
          <div className="mt-1">{errorMsg}</div>
        </div>
      ) : null}
    </div>
  );
}
