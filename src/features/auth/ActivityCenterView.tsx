/* src/features/auth/ActivityCenterView.tsx */
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';

function detectLocalePrefix(pathname: string) {
  const seg = pathname.split('/').filter(Boolean)[0] || '';
  if (/^(es|en|de|fr)$/i.test(seg)) return `/${seg.toLowerCase()}`;
  return '';
}

type ActivityItem = {
  id: string;
  type: string;
  created_at: string;
  meta: any;
  ip?: string | null;
  ua?: string | null;
};

type Status = 'loading' | 'ready' | 'error';

function fmtWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

function labelType(t: string) {
  const key = String(t || '').toLowerCase();
  if (key.startsWith('auth')) return 'Autenticación';
  if (key.startsWith('profile')) return 'Perfil';
  if (key.startsWith('wishlist')) return 'Wishlist';
  if (key.startsWith('booking')) return 'Reservas';
  if (key.startsWith('support')) return 'Soporte';
  if (key.startsWith('security')) return 'Seguridad';
  if (key.startsWith('admin')) return 'Admin';
  return 'Actividad';
}

function safeSummary(item: ActivityItem) {
  const t = String(item.type || '');
  const m = item.meta || {};

  if (/auth\.login/i.test(t)) return 'Inicio de sesión';
  if (/auth\.logout/i.test(t)) return 'Cierre de sesión';
  if (/auth\.password_reset/i.test(t)) return 'Cambio de contraseña';
  if (/profile\.update/i.test(t)) return 'Actualización de perfil';
  if (/profile\.avatar/i.test(t)) return 'Foto de perfil actualizada';
  if (/wishlist\.toggle/i.test(t)) {
    const slug = m?.slug ? ` (${m.slug})` : '';
    return `Wishlist actualizado${slug}`;
  }
  if (/support\.ticket_create/i.test(t))
    return `Ticket creado${m?.subject ? `: ${m.subject}` : ''}`;
  if (/support\.ticket_reply/i.test(t))
    return `Respuesta enviada${m?.ticket_id ? ` (ticket ${m.ticket_id})` : ''}`;

  if (m?.message) return String(m.message);
  if (m?.subject) return String(m.subject);
  return t || 'Evento';
}

export default function ActivityCenterView() {
  const pathname = usePathname() || '/';
  const localePrefix = detectLocalePrefix(pathname);

  const [status, setStatus] = React.useState<Status>('loading');
  const [error, setError] = React.useState<string>('');
  const [items, setItems] = React.useState<ActivityItem[]>([]);
  const [filter, setFilter] = React.useState<string>('');
  const [exporting, setExporting] = React.useState<boolean>(false);

  async function load() {
    setStatus('loading');
    setError('');

    try {
      const sb = supabaseBrowser();
      if (!sb) {
        setStatus('error');
        setError(
          'Auth no configurado. Revisa NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        );
        return;
      }

      const { data: sessionRes } = await sb.auth.getSession();
      const token = sessionRes.session?.access_token || '';
      if (!token) {
        setStatus('ready');
        setItems([]);
        return;
      }

      const res = await fetch('/api/account/activity', {
        headers: { authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const json = await res.json();
      setItems(Array.isArray(json?.items) ? json.items : []);
      setStatus('ready');
    } catch (err: any) {
      console.error('[ActivityCenterView] load error:', err);
      setStatus('error');
      const m = String(err?.message || 'No pudimos cargar tu actividad.');
      if (/failed to fetch|network|522/i.test(m)) {
        setError(
          'Parece un problema de conexión con el servidor. Intenta de nuevo en unos minutos.',
        );
      } else {
        setError(m);
      }
    }
  }

  async function downloadCsv() {
    setExporting(true);
    try {
      const sb = supabaseBrowser();
      const { data: sessionRes } = await sb!.auth.getSession();
      const token = sessionRes.session?.access_token || '';
      if (!token) return;

      const res = await fetch('/api/account/activity/export', {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kce-activity-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[ActivityCenterView] export error:', err);
    } finally {
      setExporting(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  const filtered = !filter
    ? items
    : items.filter((x) =>
        String(x.type || '')
          .toLowerCase()
          .startsWith(filter),
      );

  const filters = [
    { key: '', label: 'Todo' },
    { key: 'auth', label: 'Login' },
    { key: 'profile', label: 'Perfil' },
    { key: 'wishlist', label: 'Wishlist' },
    { key: 'booking', label: 'Reservas' },
    { key: 'support', label: 'Soporte' },
    { key: 'security', label: 'Seguridad' },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-2xl">Actividad de la cuenta</h1>
          <p className="mt-1 text-sm text-white/70">
            Historial de acciones relevantes (login, cambios, wishlist, tickets). Útil para
            seguridad y auditoría.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={load}
          >
            Recargar
          </Button>
          <Button
            variant="outline"
            onClick={downloadCsv}
            isLoading={exporting}
          >
            Exportar CSV
          </Button>
          <Button asChild>
            <a href={`${localePrefix}/account`}>Volver a Cuenta</a>
          </Button>
        </div>
      </div>

      {status === 'error' ? (
        <div className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key || 'all'}
            type="button"
            onClick={() => setFilter(f.key)}
            className={
              'rounded-full border px-3 py-1 text-xs transition ' +
              (filter === f.key
                ? 'border-white/40 bg-white/10 text-white'
                : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10')
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-12 gap-2 bg-white/5 px-4 py-3 text-xs text-white/70">
          <div className="col-span-4 md:col-span-3">Fecha</div>
          <div className="col-span-4 md:col-span-2">Tipo</div>
          <div className="col-span-4 md:col-span-7">Detalle</div>
        </div>

        {status === 'loading' ? (
          <div className="px-4 py-6 text-sm text-white/70">Cargando actividad…</div>
        ) : null}

        {status === 'ready' && filtered.length === 0 ? (
          <div className="px-4 py-6 text-sm text-white/70">
            No hay actividad registrada todavía.
            <div className="mt-2">
              <Button
                asChild
                variant="outline"
              >
                <a
                  href={`${localePrefix}/login?next=${encodeURIComponent(`${localePrefix}/account/activity`)}`}
                >
                  Iniciar sesión
                </a>
              </Button>
            </div>
          </div>
        ) : null}

        {status === 'ready' && filtered.length > 0 ? (
          <ul className="divide-y divide-white/10">
            {filtered.map((it) => (
              <li
                key={it.id}
                className="grid grid-cols-12 gap-2 px-4 py-3 text-sm"
              >
                <div className="col-span-12 text-white/70 md:col-span-3">
                  {fmtWhen(it.created_at)}
                </div>
                <div className="col-span-12 md:col-span-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs">
                    {labelType(it.type)}
                  </span>
                </div>
                <div className="col-span-12 md:col-span-7">
                  <div className="text-white">{safeSummary(it)}</div>
                  <div className="mt-1 text-xs text-white/50">
                    {it.ip ? <span>IP: {it.ip}</span> : null}
                    {it.ip && it.ua ? <span> · </span> : null}
                    {it.ua ? (
                      <span className="break-words">UA: {String(it.ua).slice(0, 140)}</span>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
