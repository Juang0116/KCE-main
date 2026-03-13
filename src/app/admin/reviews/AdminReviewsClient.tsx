// src/app/admin/reviews/AdminReviewsClient.tsx
'use client';


import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState } from 'react';

type ReviewStatus = 'pending' | 'approved' | 'rejected';

type Review = {
  id: string;
  tour_slug: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  comment: string | null;
  customer_name: string | null;
  customer_email: string | null;
  avatar_url: string | null;
  media_urls: string[] | null;
  face_consent: boolean | null;
  status: ReviewStatus | string | null;
  created_at: string | null;
};

type ApiResp = {
  items: Review[];
  page: number;
  limit: number;
  total: number | null;
  requestId?: string;
  error?: string;
};

function stars(n: number) {
  const v = Math.max(0, Math.min(5, Math.round(Number.isFinite(n) ? n : 0)));
  return '★★★★★'.slice(0, v) + '☆☆☆☆☆'.slice(0, 5 - v);
}

function fmtDate(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseStatus(v: string): ReviewStatus {
  return v === 'approved' || v === 'rejected' ? v : 'pending';
}

export function AdminReviewsClient() {
  const [status, setStatus] = useState<ReviewStatus>('pending');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [items, setItems] = useState<Review[]>([]);
  const [total, setTotal] = useState<number | null>(null);

  const [loadingList, setLoadingList] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const pages = useMemo(() => {
    if (total == null) return null;
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  async function load() {
    setLoadingList(true);
    setErr(null);
    try {
      const resp = await fetch(
        `/api/admin/reviews?status=${encodeURIComponent(status)}&page=${page}&limit=${limit}`,
        { cache: 'no-store' },
      );
      const json = (await resp.json().catch(() => null)) as ApiResp | null;
      if (!resp.ok) throw new Error(json?.error || 'Error cargando reseñas');

      setItems(Array.isArray(json?.items) ? json!.items : []);
      setTotal(typeof json?.total === 'number' ? json.total : (json?.total ?? null));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoadingList(false);
    }
  }

  async function action(id: string, kind: 'approve' | 'reject') {
    setActionId(id);
    setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/reviews/${encodeURIComponent(id)}/${kind}`, {
        method: 'POST',
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.error || 'Error');

      // Optimista: quita el item localmente (si estás en pending)
      if (status === 'pending') {
        setItems((prev) => prev.filter((x) => x.id !== id));
        setTotal((t) => (typeof t === 'number' ? Math.max(0, t - 1) : t));
      } else {
        // si estás viendo approved/rejected, recarga (para consistencia)
        await load();
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setActionId(null);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  const busy = loadingList || actionId != null;

  return (
    <section className="rounded-2xl border border-brand-dark/10 bg-[color:var(--color-surface)] p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-[color:var(--color-text)]/70 text-sm">Estado</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(parseStatus(e.target.value));
              setPage(1);
            }}
            className="rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
          >
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobadas</option>
            <option value="rejected">Rechazadas</option>
          </select>
        </div>

        <div className="text-[color:var(--color-text)]/70 text-sm">
          {total != null ? (
            <>
              Total: <span className="font-medium text-[color:var(--color-text)]">{total}</span>
            </>
          ) : (
            '—'
          )}
        </div>
      </div>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-[color:var(--color-text)]/60 text-left text-xs uppercase tracking-wide">
              <th className="px-3">Tour</th>
              <th className="px-3">Cliente</th>
              <th className="px-3">Rating</th>
              <th className="px-3">Contenido</th>
              <th className="px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => {
              const body = (r.body || r.comment || '').trim();
              const when = fmtDate(r.created_at);

              return (
                <tr
                  key={r.id}
                  className="rounded-xl bg-black/5"
                >
                  <td className="p-3 align-top">
                    <div className="font-medium text-[color:var(--color-text)]">
                      {r.tour_slug || '—'}
                    </div>
                    <div className="text-[color:var(--color-text)]/60 mt-1 text-xs">{when}</div>
                  </td>

                  <td className="p-3 align-top">
                    <div className="font-medium text-[color:var(--color-text)]">
                      {r.customer_name || '—'}
                    </div>
                    <div className="text-[color:var(--color-text)]/60 mt-1 text-xs">
                      {r.customer_email || ''}
                    </div>
                  </td>

                  <td className="p-3 align-top">
                    <div className="text-[color:var(--color-text)]/80">{stars(r.rating)}</div>
                  </td>

                  <td className="p-3 align-top">
                    {r.title ? (
                      <div className="font-semibold text-[color:var(--color-text)]">{r.title}</div>
                    ) : null}
                    {body ? (
                      <div className="text-[color:var(--color-text)]/80 mt-1">{body}</div>
                    ) : null}

                    {r.avatar_url ? (
                      <div className="mt-2">
                        <a
                          className="text-brand-blue underline"
                          href={r.avatar_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver foto
                        </a>
                      </div>
                    ) : null}

                    {Array.isArray(r.media_urls) && r.media_urls.length > 0 ? (
                      <div className="text-[color:var(--color-text)]/70 mt-2 text-xs">
                        <div>
                          Fotos ({r.media_urls.length}) · Consentimiento:{' '}
                          {r.face_consent ? (
                            <span className="text-green-700">sí</span>
                          ) : (
                            <span className="text-red-700">no</span>
                          )}
                        </div>

                        {r.face_consent ? (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {r.media_urls.slice(0, 4).map((url, idx) => (
                              <a
                                key={`${r.id}-m-${idx}`}
                                className="text-brand-blue underline"
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Abrir {idx + 1}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </td>

                  <td className="p-3 text-right align-top">
                    {status === 'pending' ? (
                      <div className="inline-flex gap-2">
                        <button
                          disabled={busy}
                          onClick={() => void action(r.id, 'approve')}
                          className="rounded-lg bg-green-600 px-3 py-1.5 font-medium text-white disabled:opacity-60"
                        >
                          {actionId === r.id ? '...' : 'Aprobar'}
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => void action(r.id, 'reject')}
                          className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white disabled:opacity-60"
                        >
                          {actionId === r.id ? '...' : 'Rechazar'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-[color:var(--color-text)]/60 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {!items.length && (
              <tr>
                <td
                  colSpan={5}
                  className="text-[color:var(--color-text)]/60 px-3 py-6 text-center text-sm"
                >
                  {loadingList ? 'Cargando…' : 'No hay reseñas en este estado.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages && pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            className="rounded-lg border border-black/10 px-3 py-1.5 text-sm disabled:opacity-50"
            disabled={page <= 1 || busy}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Anterior
          </button>
          <div className="text-[color:var(--color-text)]/60 text-xs">
            Página {page} de {pages}
          </div>
          <button
            className="rounded-lg border border-black/10 px-3 py-1.5 text-sm disabled:opacity-50"
            disabled={page >= pages || busy}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}
    </section>
  );
}
