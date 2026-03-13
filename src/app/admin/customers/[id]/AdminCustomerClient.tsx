'use client';


import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Customer = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  country: string | null;
  language: string | null;
  created_at: string;
};

type Booking = {
  id: string;
  status: 'pending' | 'paid' | 'canceled';
  stripe_session_id: string | null;
  tour_id: string | null;
  date: string;
  persons: number;
  total: number | null;
  currency: string | null;
  origin_currency: string | null;
  tour_price_minor: number | null;
  customer_email: string | null;
  customer_name: string | null;
  phone: string | null;
  created_at: string;
};

type Lead = {
  id: string;
  email: string | null;
  whatsapp: string | null;
  source: string | null;
  language: string | null;
  stage: string;
  tags: string[];
  notes: string | null;
  created_at: string;
};

type Conversation = {
  id: string;
  lead_id: string | null;
  customer_id: string | null;
  channel: string;
  locale: string;
  status: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

type EventRow = {
  id: string;
  type: string;
  source: string | null;
  entity_id: string | null;
  dedupe_key: string | null;
  payload: any;
  created_at: string;
};

type ApiResp = {
  customer: Customer;
  bookings: Booking[];
  leads: Lead[];
  conversations: Conversation[];
  events: EventRow[];
  requestId?: string;
  error?: string;
};

function fmtMoney(minor: number | null, currency: string | null) {
  if (minor == null || !currency) return '—';
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(minor / 100);
  } catch {
    return `${minor} ${currency}`;
  }
}

export function AdminCustomerClient({ id }: { id: string }) {
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const paidCount = useMemo(() => {
    const bookings = data?.bookings ?? [];
    return bookings.filter((b) => b.status === 'paid').length;
  }, [data]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/customers/${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      const json = (await resp.json().catch(() => null)) as ApiResp | null;
      if (!resp.ok) throw new Error(json?.error || 'Error cargando customer');
      setData(json);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading && !data) {
    return (
      <section className="rounded-2xl border border-black/10 bg-black/5 p-6">
        <p className="text-[color:var(--color-text)]/70 text-sm">Cargando…</p>
      </section>
    );
  }

  if (err) {
    return (
      <section className="rounded-2xl border border-red-600/30 bg-red-50 p-6">
        <p className="text-sm text-red-700">{err}</p>
      </section>
    );
  }

  if (!data) return null;

  const c = data.customer;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-dark/10 bg-[color:var(--color-surface)] p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[color:var(--color-text)]/60 text-xs uppercase tracking-wide">
              Cliente
            </div>
            <h2 className="mt-1 text-xl font-semibold text-[color:var(--color-text)]">
              {c.name || '—'}
            </h2>
            <p className="text-[color:var(--color-text)]/70 mt-1 text-sm">{c.email || '—'}</p>
            <p className="text-[color:var(--color-text)]/70 mt-1 text-sm">{c.phone || ''}</p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3">
            <div className="text-[color:var(--color-text)]/60 text-xs">Resumen</div>
            <div className="mt-1 text-sm">
              <span className="font-medium">{(data.bookings || []).length}</span> reservas (
              {paidCount} pagadas)
            </div>
            <div className="mt-1 text-sm">
              <span className="font-medium">{(data.leads || []).length}</span> leads asociados
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4">
            <div className="text-[color:var(--color-text)]/60 text-xs">País</div>
            <div className="mt-1 text-sm font-medium">{c.country || '—'}</div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4">
            <div className="text-[color:var(--color-text)]/60 text-xs">Idioma</div>
            <div className="mt-1 text-sm font-medium">{c.language || '—'}</div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4">
            <div className="text-[color:var(--color-text)]/60 text-xs">Creado</div>
            <div className="mt-1 text-sm font-medium">{c.created_at}</div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-brand-dark/10 bg-[color:var(--color-surface)] p-6 shadow-soft">
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-semibold text-[color:var(--color-text)]">Reservas</h3>
          <Link
            href="/admin/bookings"
            className="text-sm font-medium text-brand-blue hover:underline"
          >
            Ver todas
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-[color:var(--color-text)]/60 text-left text-xs uppercase tracking-wide">
                <th className="px-3">Estado</th>
                <th className="px-3">Fecha</th>
                <th className="px-3">Pax</th>
                <th className="px-3">Total</th>
                <th className="px-3">Session</th>
                <th className="px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {(data.bookings || []).map((b) => (
                <tr
                  key={b.id}
                  className="rounded-xl bg-black/5"
                >
                  <td className="p-3">
                    <span className="rounded-lg border border-black/10 bg-white/60 px-2 py-1 text-xs">
                      {b.status}
                    </span>
                  </td>
                  <td className="p-3">{b.date}</td>
                  <td className="p-3">{b.persons}</td>
                  <td className="p-3">{fmtMoney(b.total, b.currency)}</td>
                  <td className="text-[color:var(--color-text)]/60 p-3 text-xs">
                    {b.stripe_session_id || '—'}
                  </td>
                  <td className="p-3 text-right">
                    {b.stripe_session_id ? (
                      <Link
                        href={`/booking/${encodeURIComponent(b.stripe_session_id)}`}
                        className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm font-medium hover:bg-white"
                        target="_blank"
                      >
                        Abrir booking
                      </Link>
                    ) : (
                      <span className="text-[color:var(--color-text)]/50 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}

              {!(data.bookings || []).length && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-[color:var(--color-text)]/60 px-3 py-6 text-center text-sm"
                  >
                    No hay reservas asociadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-dark/10 bg-[color:var(--color-surface)] p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-[color:var(--color-text)]">Leads asociados</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-[color:var(--color-text)]/60 text-left text-xs uppercase tracking-wide">
                <th className="px-3">Contacto</th>
                <th className="px-3">Fuente</th>
                <th className="px-3">Stage</th>
                <th className="px-3">Tags</th>
                <th className="px-3">Creado</th>
              </tr>
            </thead>
            <tbody>
              {(data.leads || []).map((l) => (
                <tr
                  key={l.id}
                  className="rounded-xl bg-black/5"
                >
                  <td className="p-3">
                    <div className="font-medium">{l.email || '—'}</div>
                    <div className="text-[color:var(--color-text)]/60 mt-1 text-xs">
                      {l.whatsapp || ''}
                    </div>
                  </td>
                  <td className="p-3">{l.source || '—'}</td>
                  <td className="p-3">
                    <span className="rounded-lg border border-black/10 bg-white/60 px-2 py-1 text-xs">
                      {l.stage}
                    </span>
                  </td>
                  <td className="text-[color:var(--color-text)]/70 p-3 text-xs">
                    {(l.tags || []).join(', ') || '—'}
                  </td>
                  <td className="text-[color:var(--color-text)]/60 p-3 text-xs">{l.created_at}</td>
                </tr>
              ))}

              {!(data.leads || []).length && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-[color:var(--color-text)]/60 px-3 py-6 text-center text-sm"
                  >
                    No hay leads asociados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-dark/10 bg-[color:var(--color-surface)] p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-[color:var(--color-text)]">Conversaciones</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-[color:var(--color-text)]/60 text-left text-xs uppercase tracking-wide">
                <th className="px-3">Canal</th>
                <th className="px-3">Idioma</th>
                <th className="px-3">Inicio</th>
                <th className="px-3">Cierre</th>
                <th className="px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {(data.conversations || []).map((cv) => (
                <tr
                  key={cv.id}
                  className="rounded-xl bg-black/5"
                >
                  <td className="p-3">{cv.channel}</td>
                  <td className="p-3">{cv.locale || '—'}</td>
                  <td className="text-[color:var(--color-text)]/60 p-3 text-xs">{cv.created_at}</td>
                  <td className="text-[color:var(--color-text)]/60 p-3 text-xs">
                    {cv.closed_at || '—'}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/conversations/${encodeURIComponent(cv.id)}`}
                      className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm font-medium hover:bg-white"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}

              {!(data.conversations || []).length && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-[color:var(--color-text)]/60 px-3 py-6 text-center text-sm"
                  >
                    No hay conversaciones asociadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-dark/10 bg-[color:var(--color-surface)] p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-[color:var(--color-text)]">Eventos (timeline)</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-[color:var(--color-text)]/60 text-left text-xs uppercase tracking-wide">
                <th className="px-3">Tipo</th>
                <th className="px-3">Source</th>
                <th className="px-3">Entity</th>
                <th className="px-3">Created</th>
                <th className="px-3">Payload</th>
              </tr>
            </thead>
            <tbody>
              {(data.events || []).map((ev) => (
                <tr
                  key={ev.id}
                  className="rounded-xl bg-black/5"
                >
                  <td className="p-3 align-top">
                    <div className="font-medium">{ev.type}</div>
                    <div className="text-[color:var(--color-text)]/60 mt-1 text-xs">
                      {ev.dedupe_key || ''}
                    </div>
                  </td>
                  <td className="p-3 align-top">{ev.source || '—'}</td>
                  <td className="text-[color:var(--color-text)]/60 p-3 align-top text-xs">
                    {ev.entity_id || '—'}
                  </td>
                  <td className="text-[color:var(--color-text)]/60 p-3 align-top text-xs">
                    {ev.created_at}
                  </td>
                  <td className="p-3 align-top">
                    <details className="text-xs">
                      <summary className="text-[color:var(--color-text)]/70 cursor-pointer">
                        Ver
                      </summary>
                      <pre className="mt-2 max-w-[680px] overflow-auto rounded-xl border border-black/10 bg-black/5 p-3 text-[11px] leading-relaxed">
                        {JSON.stringify(ev.payload ?? null, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}

              {!(data.events || []).length && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-[color:var(--color-text)]/60 px-3 py-6 text-center text-sm"
                  >
                    No hay eventos para este cliente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
