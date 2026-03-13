/* src/features/auth/AccountView.tsx */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { LogoutButton } from '@/features/auth/LogoutButton';
import { GlobalLogoutButton } from '@/features/auth/GlobalLogoutButton';
import { isEmailVerified } from '@/lib/auth/verification';

function detectLocalePrefix(pathname: string) {
  const seg = pathname.split('/').filter(Boolean)[0] || '';
  if (/^(es|en|de|fr)$/i.test(seg)) return `/${seg.toLowerCase()}`;
  return '';
}

type Status = 'idle' | 'loading' | 'error';

export default function AccountView() {
  const pathname = usePathname() || '/';
  const localePrefix = detectLocalePrefix(pathname);

  const [status, setStatus] = React.useState<Status>('loading');
  const [msg, setMsg] = React.useState<string>('');
  const [email, setEmail] = React.useState<string>('');
  const [userId, setUserId] = React.useState<string>('');
  const [emailConfirmed, setEmailConfirmed] = React.useState<boolean>(false);
  const [fullName, setFullName] = React.useState<string>('');
  const [phone, setPhone] = React.useState<string>('');
  const [avatarUrl, setAvatarUrl] = React.useState<string>('');
  const [_accessToken, setAccessToken] = React.useState<string>('');
  const [counts, setCounts] = React.useState<{ bookings: number; wishlist: number } | null>(null);
  const [loadingCounts, setLoadingCounts] = React.useState(false);

  const [savingProfile, setSavingProfile] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);

  const [newEmail, setNewEmail] = React.useState('');
  const [changingEmail, setChangingEmail] = React.useState(false);

  const [newPassword, setNewPassword] = React.useState('');
  const [newPassword2, setNewPassword2] = React.useState('');
  const [changingPassword, setChangingPassword] = React.useState(false);

  async function load() {
    setStatus('loading');
    setMsg('');

    try {
      const sb = supabaseBrowser();
      if (!sb) {
        setStatus('error');
        setMsg(
          'Auth no configurado. Revisa NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        );
        return;
      }

      const { data: sessionRes } = await sb.auth.getSession();
      if (!sessionRes.session) {
        setStatus('idle');
        setAccessToken('');
        setCounts(null);

        setEmail('');
        setUserId('');
        setEmailConfirmed(false);
        setFullName('');
        setPhone('');
        setAvatarUrl('');
        return;
      }

      const token = sessionRes.session.access_token;
      setAccessToken(token);
      void loadCounts(token);

      const { data: userRes, error: userErr } = await sb.auth.getUser();
      if (userErr) throw userErr;

      const u = userRes.user;
      setUserId(u?.id ?? '');
      setEmail(u?.email ?? '');
      setEmailConfirmed(isEmailVerified(u));
      const meta = (u as any)?.user_metadata ?? {};
      setFullName(String(meta.full_name ?? meta.name ?? '').trim());
      setPhone(String(meta.phone ?? '').trim());
      setAvatarUrl(String(meta.avatar_url ?? '').trim());
      setStatus('idle');
    } catch (err: any) {
      console.error('[AccountView] load error:', err);
      setStatus('error');
      const m = String(err?.message || 'No pudimos cargar tu cuenta.');
      // Errores típicos cuando Supabase está caído / red:
      if (/failed to fetch|network|522/i.test(m)) {
        setMsg(
          'Parece un problema de conexión con el servidor de autenticación. Intenta de nuevo en unos minutos.',
        );
      } else {
        setMsg(m);
      }
    }
  }

  async function loadCounts(token: string) {
    if (!token) return;
    setLoadingCounts(true);
    try {
      const [bRes, wRes] = await Promise.all([
        fetch('/api/account/bookings', { headers: { authorization: `Bearer ${token}` } }).catch(
          () => null,
        ),
        fetch('/api/wishlist', { headers: { authorization: `Bearer ${token}` } }).catch(() => null),
      ]);

      let bookings = 0;
      if (bRes && bRes.ok) {
        const bj = await bRes.json().catch(() => null);
        bookings = Array.isArray(bj?.items) ? bj.items.length : 0;
      }

      let wishlist = 0;
      if (wRes && wRes.ok) {
        const wj = await wRes.json().catch(() => null);
        wishlist = Array.isArray(wj?.items) ? wj.items.length : 0;
      }

      setCounts({ bookings, wishlist });
    } catch {
      // ignore (non-critical)
    } finally {
      setLoadingCounts(false);
    }
  }

  async function saveProfile() {
    setMsg('');
    setSavingProfile(true);
    try {
      const sb = supabaseBrowser();
      if (!sb) throw new Error('Auth no configurado');

      const data: Record<string, unknown> = {
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      };

      const { error } = await sb.auth.updateUser({ data });
      if (error) throw error;
      setMsg('✅ Perfil actualizado.');
      await load();
    } catch (err: any) {
      console.error('[AccountView] saveProfile error:', err);
      setMsg(err?.message || 'No pudimos actualizar tu perfil.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function uploadAvatar(file: File) {
    setMsg('');
    setUploadingAvatar(true);
    try {
      const sb = supabaseBrowser();
      if (!sb) throw new Error('Auth no configurado');
      if (!userId) throw new Error('No encontramos tu usuario. Inicia sesión de nuevo.');

      // Upload via server route to avoid Supabase Storage RLS failures from the browser.
      const fd = new FormData();
      fd.append('file', file);

      // This app uses a browser Supabase client (localStorage session). Route Handlers
      // can't read that session unless we forward the access token.
      const { data: sData } = await sb.auth.getSession();
      const accessToken = String(sData?.session?.access_token || '').trim();

      const res = await fetch('/api/account/avatar', {
        method: 'POST',
        body: fd,
        ...(accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || 'No pudimos subir la foto.');

      const publicUrl = String(j?.url || '').trim();
      if (!publicUrl) throw new Error('No pudimos obtener la URL del avatar.');


      setAvatarUrl(publicUrl);
      setMsg('✅ Foto subida. Guarda cambios para aplicarla.');
    } catch (err: any) {
      const msg = String(err?.message ?? err ?? '');
      console.error('[AccountView] uploadAvatar error:', err);
      setMsg(msg || 'No pudimos subir la foto. Intenta de nuevo en unos segundos.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function changeEmail() {
    setMsg('');
    setChangingEmail(true);
    try {
      const sb = supabaseBrowser();
      if (!sb) throw new Error('Auth no configurado');
      const next = newEmail.trim();
      if (!next || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(next))
        throw new Error('Ingresa un correo válido.');

      const { error } = await sb.auth.updateUser({ email: next });
      if (error) throw error;

      setMsg(
        '📩 Te enviamos un correo para confirmar el cambio de email. Revisa tu bandeja (y spam).',
      );
      setNewEmail('');
      await load();
    } catch (err: any) {
      console.error('[AccountView] changeEmail error:', err);
      setMsg(err?.message || 'No pudimos cambiar el correo.');
    } finally {
      setChangingEmail(false);
    }
  }

  async function changePasswordNow() {
    setMsg('');
    setChangingPassword(true);
    try {
      const sb = supabaseBrowser();
      if (!sb) throw new Error('Auth no configurado');

      const p1 = newPassword;
      const p2 = newPassword2;
      if (p1.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
      if (p1 !== p2) throw new Error('Las contraseñas no coinciden.');

      const { error } = await sb.auth.updateUser({ password: p1 });
      if (error) throw error;

      setNewPassword('');
      setNewPassword2('');
      setMsg('✅ Contraseña actualizada.');
    } catch (err: any) {
      console.error('[AccountView] changePassword error:', err);
      setMsg(err?.message || 'No pudimos cambiar la contraseña.');
    } finally {
      setChangingPassword(false);
    }
  }

  async function resendConfirmation() {
    setMsg('');
    try {
      const sb = supabaseBrowser();
      if (!sb) throw new Error('Auth no configurado');
      if (!email) throw new Error('No encontramos tu email en la sesión.');

      // Re-envía email de confirmación (si el proyecto lo requiere)
      const { error } = await sb.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setMsg('Listo. Te enviamos un correo de verificación. Revisa tu bandeja (y spam).');
    } catch (err: any) {
      console.error('[AccountView] resend error:', err);
      setMsg(err?.message || 'No pudimos reenviar el correo.');
    }
  }

  React.useEffect(() => {
    void load();

    const sb = supabaseBrowser();
    if (!sb) return;

    const { data } = sb.auth.onAuthStateChange(() => {
      void load();
    });

    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'loading') {
    return (
      <div className="card p-6">
        <h2 className="font-heading text-xl text-brand-blue">Tu cuenta</h2>
        <p className="text-[color:var(--color-text)]/70 mt-3">Cargando…</p>
      </div>
    );
  }

  // No sesión
  const loginHref = `${localePrefix}/login?next=${encodeURIComponent(`${localePrefix}/account`)}`;

  if (!email) {
    return (
      <div className="card p-6">
        <h2 className="font-heading text-xl text-brand-blue">Tu cuenta</h2>
        <p className="text-[color:var(--color-text)]/75 mt-2">
          Inicia sesión para ver tu perfil y preferencias.
        </p>
        <div className="mt-4">
          <Button
            asChild
            variant="primary"
          >
            <Link href={loginHref}>Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    );
  }

  const resetHref = `${localePrefix}/forgot-password?next=${encodeURIComponent(`${localePrefix}/account`)}`;

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl text-brand-blue">Tu cuenta</h2>
          <p className="text-[color:var(--color-text)]/75 mt-2">Gestiona tu sesión y seguridad.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
          >
            Actualizar
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link href={`${localePrefix}/account/security`}>Seguridad</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link href={`${localePrefix}/account/activity`}>Actividad</Link>
          </Button>
          <GlobalLogoutButton />
          <LogoutButton />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
          <div className="text-[color:var(--color-text)]/60 text-xs">Reservas</div>
          <div className="mt-1 text-2xl font-semibold text-[color:var(--color-text)]">
            {loadingCounts ? '…' : (counts?.bookings ?? '—')}
          </div>
          <div className="mt-2">
            <Link
              className="text-sm text-brand-blue hover:underline"
              href={`${localePrefix}/account/bookings`}
            >
              Ver mis reservas
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
          <div className="text-[color:var(--color-text)]/60 text-xs">Wishlist</div>
          <div className="mt-1 text-2xl font-semibold text-[color:var(--color-text)]">
            {loadingCounts ? '…' : (counts?.wishlist ?? '—')}
          </div>
          <div className="mt-2">
            <Link
              className="text-sm text-brand-blue hover:underline"
              href={`${localePrefix}/wishlist`}
            >
              Ver wishlist
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
          <div className="text-[color:var(--color-text)]/60 text-xs">Soporte</div>
          <div className="mt-1 text-base font-semibold text-[color:var(--color-text)]">
            Centro de soporte
          </div>
          <div className="mt-2">
            <Link
              className="text-sm text-brand-blue hover:underline"
              href={`${localePrefix}/account/support`}
            >
              Abrir un ticket
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[color:var(--color-text)]/70 text-sm">Perfil</div>
              <div className="mt-1 text-base font-semibold text-[color:var(--color-text)]">
                Tu información
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={savingProfile}
              onClick={() => void saveProfile()}
            >
              {savingProfile ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="size-16 rounded-full border border-[var(--color-border)] object-cover"
              />
            ) : (
              <div className="dark:bg-[color:var(--color-surface)]/10 grid size-16 place-items-center rounded-full bg-black/5 text-lg font-semibold">
                {email ? email[0]?.toUpperCase() : 'U'}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="avatarFile"
                className="text-[color:var(--color-text)]/60 text-xs"
              >
                Foto de perfil
              </label>
              <input
                id="avatarFile"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadAvatar(f);
                }}
                disabled={uploadingAvatar}
                className="text-sm"
              />
              <p className="text-[color:var(--color-text)]/60 text-xs">
                {uploadingAvatar
                  ? 'Subiendo…'
                  : "Usa PNG/JPG/WEBP. Requiere bucket 'avatars' en Supabase Storage."}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="profileFullName"
                className="text-[color:var(--color-text)]/70 text-sm"
              >
                Nombre
              </label>
              <input
                id="profileFullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
                className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="profilePhone"
                className="text-[color:var(--color-text)]/70 text-sm"
              >
                Celular
              </label>
              <input
                id="profilePhone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+57 300 000 0000"
                className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm"
              />
              <p className="text-[color:var(--color-text)]/60 mt-1 text-xs">
                Lo usaremos para soporte/reservas (WhatsApp) si lo autorizas.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="profileAvatarUrl"
              className="text-[color:var(--color-text)]/70 text-sm"
            >
              URL de avatar (opcional)
            </label>
            <input
              id="profileAvatarUrl"
              name="photo"
              inputMode="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
          <div className="text-[color:var(--color-text)]/70 text-sm">Email</div>
          <div className="mt-1 text-base font-semibold text-[color:var(--color-text)]">{email}</div>
          <div className="mt-2 text-sm">
            {emailConfirmed ? (
              <span className="text-green-700 dark:text-green-200">Verificado</span>
            ) : (
              <span className="text-amber-800 dark:text-amber-200">Sin verificar</span>
            )}
          </div>

          {!emailConfirmed ? (
            <div className="mt-4">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => void resendConfirmation()}
              >
                Reenviar verificación
              </Button>
              <p className="text-[color:var(--color-text)]/60 mt-2 text-xs">
                Si no te llega, revisa spam/promociones. Si sigue fallando, puede ser un rate limit
                temporal.
              </p>
            </div>
          ) : null}

          <div className="mt-5">
            <label
              htmlFor="profileNewEmail"
              className="text-[color:var(--color-text)]/70 text-sm"
            >
              Cambiar correo
            </label>
            <input
              id="profileNewEmail"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nuevo@correo.com"
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm"
            />
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={changingEmail}
                onClick={() => void changeEmail()}
              >
                {changingEmail ? 'Enviando…' : 'Solicitar cambio'}
              </Button>
            </div>
            <p className="text-[color:var(--color-text)]/60 mt-2 text-xs">
              Te enviaremos un correo de confirmación. Puede requerir volver a iniciar sesión.
            </p>
          </div>
        </div>
      </div>


      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-[var(--color-border)] bg-[color:var(--color-bg)]/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-0">
        <div className="flex justify-end">
          <Button type="button" variant="primary" size="sm" disabled={savingProfile} onClick={() => void saveProfile()}>
            {savingProfile ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[color:var(--color-text)]/70 text-sm">Seguridad</div>
            <div className="mt-1 text-base font-semibold text-[color:var(--color-text)]">
              Protege tu cuenta
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link href={resetHref}>Reset por correo</Link>
          </Button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="newPassword"
              className="text-[color:var(--color-text)]/70 text-sm"
            >
              Nueva contraseña
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="********"
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="newPassword2"
              className="text-[color:var(--color-text)]/70 text-sm"
            >
              Confirmar contraseña
            </label>
            <input
              id="newPassword2"
              type="password"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              placeholder="********"
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={changingPassword}
            onClick={() => void changePasswordNow()}
          >
            {changingPassword ? 'Actualizando…' : 'Cambiar contraseña ahora'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled
          >
            Activar 2FA (próximamente)
          </Button>
        </div>

        <p className="text-[color:var(--color-text)]/60 mt-2 text-xs">
          Si Supabase te pide reautenticación, usa “Reset por correo”. En P2 activamos 2FA (TOTP)
          opcional.
        </p>
      </div>

      {msg ? (
        <p
          className={
            status === 'error'
              ? 'mt-4 text-sm text-red-600 dark:text-red-200'
              : 'text-[color:var(--color-text)]/80 mt-4 text-sm'
          }
        >
          {msg}
        </p>
      ) : null}
    </div>
  );
}
