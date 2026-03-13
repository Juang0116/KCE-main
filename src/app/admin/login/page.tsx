// src/app/admin/login/page.tsx
'use client';


import { adminFetch } from '@/lib/adminFetch.client';
import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/Button';


export default function AdminLoginPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [user, setUser] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string>('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      const next = sp.get('next') || '/admin';
      router.replace(next);
      router.refresh();
    } catch (err: any) {
      setMsg(String(err?.message || 'No se pudo iniciar sesión.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--color-text)]">Admin</h1>
      <p className="mt-2 text-sm text-[color:var(--color-text)]/75">
        Ingresa tus credenciales para acceder al panel.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <div className="text-sm font-medium text-[color:var(--color-text)]/85">Usuario</div>
          <input
            id="admin_user"
            name="admin_user"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="admin"
            className="mt-1 w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none
                       focus:border-black/25 dark:border-white/10 dark:bg-black/30"
            autoComplete="username"
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium text-[color:var(--color-text)]/85">Contraseña</div>
          <input
            id="admin_pass"
            name="admin_pass"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            type="password"
            className="mt-1 w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none
                       focus:border-black/25 dark:border-white/10 dark:bg-black/30"
            autoComplete="current-password"
          />
        </label>

        {msg ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {msg}
          </div>
        ) : null}

        <Button type="submit" variant="primary" isLoading={loading} disabled={loading || !pass}>
          Entrar
        </Button>

        <p className="text-xs text-[color:var(--color-text)]/60">
          Tip: Configura <code className="font-mono">ADMIN_USER</code> y <code className="font-mono">ADMIN_PASS</code> en Vercel.
        </p>
      </form>
    </main>
  );
}
