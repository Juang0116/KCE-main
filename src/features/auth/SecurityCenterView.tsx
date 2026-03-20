'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/Button';
import { GlobalLogoutButton } from '@/features/auth/GlobalLogoutButton';
import { isEmailVerified } from '@/lib/auth/verification';
import { supabaseBrowser } from '@/lib/supabase/browser';

type ActivityItem = {
  id: string;
  type: string;
  source: string | null;
  entity_id: string | null;
  created_at: string | null;
  payload: unknown;
};

function detectLocalePrefix(pathname: string) {
  const seg = pathname.split('/').filter(Boolean)[0] || '';
  if (/^(es|en|de|fr)$/i.test(seg)) return `/${seg.toLowerCase()}`;
  return '';
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function SecurityCenterView() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const localePrefix = detectLocalePrefix(pathname);

  const [loading, setLoading] = React.useState(true);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState<string | null>(null);
  const [verified, setVerified] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [lastSignInAt, setLastSignInAt] = React.useState<string | null>(null);
  const [createdAt, setCreatedAt] = React.useState<string | null>(null);

  const [events, setEvents] = React.useState<ActivityItem[]>([]);
  const [eventsLoading, setEventsLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function logClient(type: string, payload: Record<string, unknown>) {
    if (!accessToken) return;
    try {
      await fetch('/api/account/activity/log', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ type, payload, source: 'client' }),
      });
    } catch {
      // best-effort
    }
  }

  async function loadSessionAndProfile() {
    setLoading(true);
    setMsg(null);
    try {
      const sb = supabaseBrowser();
      if (!sb) {
        setAccessToken(null);
        setEmail(null);
        setVerified(false);
        setUserId(null);
        return;
      }
      const { data } = await sb.auth.getSession();
      const session = data.session;
      if (!session) {
        setAccessToken(null);
        setEmail(null);
        setVerified(false);
        setUserId(null);
        return;
      }

      setAccessToken(session.access_token);
      const u = session.user;
      setEmail(u.email ?? null);
      setVerified(isEmailVerified(u));
      setUserId(u.id ?? null);
      setLastSignInAt((u as any)?.last_sign_in_at ?? null);
      setCreatedAt((u as any)?.created_at ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function loadActivity() {
    if (!accessToken) return;
    setEventsLoading(true);
    try {
      const res = await fetch('/api/account/activity?limit=50', {
        headers: { authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      });
      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.error || 'Failed to load activity');
      setEvents(Array.isArray(json?.items) ? (json.items as ActivityItem[]) : []);
    } catch (e: any) {
      setMsg(e?.message || 'No se pudo cargar actividad');
    } finally {
      setEventsLoading(false);
    }
  }

  async function resendVerification() {
    setMsg(null);
    try {
      const sb = supabaseBrowser();
      if (!sb || !email) return;

      // Supabase JS v2: auth.resend({ type: 'signup', email })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const res = await (sb.auth as any).resend?.({ type: 'signup', email });
      if (res?.error) throw res.error;

      await logClient('auth.verify_resend', { email });
      setMsg('Listo: enviamos un correo de verificación. Revisa spam/promociones.');
    } catch (e: any) {
      setMsg(e?.message || 'No se pudo reenviar la verificación');
    }
  }

  async function logoutHere() {
    setMsg(null);
    try {
      const sb = supabaseBrowser();
      if (!sb) return;
      await sb.auth.signOut();
      if (accessToken) await logClient('auth.logout', { scope: 'local' });
      router.refresh();
      router.push(
        `${localePrefix || ''}/login?next=${encodeURIComponent(`${localePrefix || ''}/account/security`)}`,
      );
    } catch (e: any) {
      setMsg(e?.message || 'No se pudo cerrar sesión');
    }
  }

  React.useEffect(() => {
    void loadSessionAndProfile();
    const sb = supabaseBrowser();
    if (!sb) return;
    const { data } = sb.auth.onAuthStateChange(() => {
      void loadSessionAndProfile();
    });
    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!accessToken) return;
    void loadActivity();
    void logClient('account.security.open', { pathname });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const backHref = `${localePrefix}/account`;

  if (loading) {
    return (
      <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <div className="text-[color:var(--color-text)]/70 text-sm">Cargando seguridad…</div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <h1 className="font-heading text-2xl text-brand-blue">Centro de seguridad</h1>
        <p className="text-[color:var(--color-text)]/80 mt-2 text-sm">
          No hay una sesión activa. Inicia sesión para administrar tu cuenta.
        </p>
        <div className="mt-5">
          <Button asChild>
            <Link
              href={`${localePrefix}/login?next=${encodeURIComponent(`${localePrefix}/account/security`)}`}
            >
              Ir a login
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[color:var(--color-text)]/60 text-sm">Cuenta</div>
          <h1 className="font-heading text-3xl text-brand-blue">Centro de seguridad</h1>
          <p className="text-[color:var(--color-text)]/75 mt-2 text-sm">
            Revisa tu sesión, verificación y eventos recientes. Esto nos ayuda a mantener un
            estándar tipo “Facebook/Instagram”.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant="outline"
          >
            <Link href={backHref}>Volver</Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => void loadActivity()}
            disabled={eventsLoading}
          >
            Refrescar actividad
          </Button>
        </div>
      </div>

      {msg ? (
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4 text-sm text-[color:var(--color-text)]">
          {msg}
        </div>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
          <h2 className="font-heading text-lg text-[color:var(--color-text)]">Estado de sesión</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[color:var(--color-text)]/70">Email</span>
              <span className="break-all font-medium">{email}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[color:var(--color-text)]/70">Verificado</span>
              <span
                className={
                  verified
                    ? 'font-medium text-emerald-700 dark:text-emerald-200'
                    : 'font-medium text-amber-700 dark:text-amber-200'
                }
              >
                {verified ? 'Sí' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[color:var(--color-text)]/70">Último acceso</span>
              <span className="font-medium">{formatDateTime(lastSignInAt)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[color:var(--color-text)]/70">Creación</span>
              <span className="font-medium">{formatDateTime(createdAt)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[color:var(--color-text)]/70">User ID</span>
              <span className="break-all font-mono text-xs">{userId ?? '—'}</span>
            </div>
          </div>

          {!verified ? (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <div className="font-semibold text-amber-800 dark:text-amber-200">
                Tu email no está verificado
              </div>
              <div className="text-[color:var(--color-text)]/80 mt-1">
                Si activaste verificación obligatoria, es normal que algunas acciones se bloqueen
                hasta confirmar.
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void resendVerification()}
                >
                  Reenviar verificación
                </Button>
                <Button
                  asChild
                  variant="outline"
                >
                  <Link href={`${localePrefix}/verify-email?email=${encodeURIComponent(email)}`}>
                    Guía de verificación
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => void logoutHere()}
            >
              Cerrar sesión
            </Button>
            <GlobalLogoutButton />
          </div>

          <div className="text-[color:var(--color-text)]/60 mt-3 text-xs">
            “Cerrar sesión (todos)” invalida tokens en otros dispositivos. Si ves actividad extraña,
            úsalo y cambia contraseña.
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
          <h2 className="font-heading text-lg text-[color:var(--color-text)]">Acciones rápidas</h2>
          <p className="text-[color:var(--color-text)]/75 mt-2 text-sm">
            Atajos a lo más importante: perfil, contraseña, reservas y soporte.
          </p>

          <div className="mt-4 grid gap-2">
            <Button
              asChild
              variant="outline"
            >
              <Link href={`${localePrefix}/account`}>Editar perfil / datos</Link>
            </Button>
            <Button
              asChild
              variant="outline"
            >
              <Link
                href={`${localePrefix}/reset-password?next=${encodeURIComponent(`${localePrefix}/account/security`)}`}
              >
                Cambiar contraseña
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
            >
              <Link href={`${localePrefix}/account/bookings`}>Ver mis reservas</Link>
            </Button>
            <Button
              asChild
              variant="outline"
            >
              <Link href={`${localePrefix}/account/support`}>Abrir ticket de soporte</Link>
            </Button>
          </div>

          <div className="mt-6 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4 text-sm">
            <div className="font-semibold">Próximo nivel (P2)</div>
            <ul className="text-[color:var(--color-text)]/80 mt-2 list-disc space-y-1 pl-5">
              <li>2FA opcional (TOTP) + códigos de recuperación.</li>
              <li>Gestión de sesiones / dispositivos (lista + revoke individual).</li>
              <li>Notificaciones: “nuevo inicio de sesión” y “cambio de email”.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg text-[color:var(--color-text)]">
            Actividad reciente
          </h2>
          <div className="text-[color:var(--color-text)]/60 text-xs">
            Últimos {events.length} eventos
          </div>
        </div>

        {eventsLoading ? (
          <div className="text-[color:var(--color-text)]/70 mt-4 text-sm">Cargando…</div>
        ) : events.length === 0 ? (
          <div className="text-[color:var(--color-text)]/70 mt-4 text-sm">
            Aún no hay eventos registrados para tu usuario.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-[color:var(--color-border)]">
            <div className="divide-y divide-[var(--color-border)]">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[color:var(--color-text)]/70 font-mono text-xs">
                      {ev.type}
                    </div>
                    <div className="text-[color:var(--color-text)]/60 text-xs">
                      {formatDateTime(ev.created_at)}
                    </div>
                  </div>
                  <div className="text-[color:var(--color-text)]/70 mt-2 text-xs">
                    {ev.source ? (
                      <span className="mr-3">
                        source: <span className="font-mono">{ev.source}</span>
                      </span>
                    ) : null}
                    {ev.entity_id ? (
                      <span>
                        entity: <span className="font-mono">{ev.entity_id}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-[color:var(--color-text)]/60 mt-3 text-xs">
          Nota: esto usa tu tabla <span className="font-mono">events</span>. De aquí sale auditoría
          y métricas (admin/events).
        </div>
      </section>
    </div>
  );
}
