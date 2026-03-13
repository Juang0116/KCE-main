'use client';


import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type ConversationItem = {
  id: string;
  channel: string;
  locale: string;
  status: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  lead_id: string | null;
  customer_id: string | null;
  leads?: { email: string | null; whatsapp: string | null } | null;
  customers?: { email: string | null; name: string | null; phone: string | null } | null;
  last_message?: { role: string; content: string; created_at: string } | null;
};

type ApiResponse = {
  items: ConversationItem[];
  page: number;
  limit: number;
  total: number | null;
  requestId?: string;
  error?: string;
};

function fmtDT(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminConversationsClient() {
  const [q, setQ] = useState('');
  const [scope, setScope] = useState<'meta' | 'content'>('meta');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (scope) p.set('scope', scope);
    p.set('page', String(page));
    p.set('limit', String(limit));
    return p.toString();
  }, [q, scope, page, limit]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    adminFetch(`/api/admin/conversations?${query}`)
      .then(async (r) => {
        const j = (await r.json().catch(() => null)) as ApiResponse | null;
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        return j as ApiResponse;
      })
      .then((j) => {
        if (cancelled) return;
        setData(j);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Error');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const hasPrev = page > 1;
  const hasNext =
    data?.total == null ? (data?.items?.length ?? 0) === limit : page * limit < (data.total ?? 0);

  const conversationItems = data?.items ?? [];
  const conversationSignals = useMemo(
    () => [
      {
        label: 'Visible threads',
        value: data?.total != null ? String(data.total) : String(conversationItems.length),
        note: 'Conversations represented by the current filter and page state.',
      },
      {
        label: 'Need action',
        value: String(conversationItems.filter((item) => (item.status || '').toLowerCase() !== 'closed').length),
        note: 'Threads that are not closed yet and may still need support or handoff.',
      },
      {
        label: 'Channels',
        value: String(new Set(conversationItems.map((item) => item.channel).filter(Boolean)).size),
        note: 'Distinct live channels represented in this view.',
      },
      {
        label: 'Read mode',
        value: scope === 'content' ? 'Content' : 'Meta',
        note: 'Whether the operator is searching message content or customer metadata.',
      },
    ],
    [conversationItems, data?.total, scope],
  );

  return (
    <section className="space-y-4">
      <AdminOperatorWorkbench
        eyebrow="conversation workbench"
        title="Route live signal before it turns into noise"
        description="Use conversations as a routing layer: detect the threads that still matter, decide whether they belong to support, sales or closure, and keep the traveler context intact during handoff."
        actions={[
          { href: '/admin/tickets', label: 'Tickets', tone: 'primary' },
          { href: '/admin/customers', label: 'Customers' },
          { href: '/admin/ai', label: 'AI desk' },
          { href: '/admin/launch-hq', label: 'Launch HQ' },
        ]}
        signals={conversationSignals}
      />
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm">
              <div className="text-[color:var(--color-text)]/70 mb-1">Buscar</div>
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder={
                  scope === 'content' ? 'texto en mensajes…' : 'email, nombre, whatsapp…'
                }
                className="w-full rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-3 py-2 text-sm"
              />
            </label>

            <label className="text-sm">
              <div className="text-[color:var(--color-text)]/70 mb-1">Alcance</div>
              <select
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value as any);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-3 py-2 text-sm"
              >
                <option value="meta">Lead/Customer (email/whatsapp/nombre)</option>
                <option value="content">Contenido de mensajes</option>
              </select>
            </label>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setQ('');
                  setScope('meta');
                  setPage(1);
                }}
                className="w-full rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-4 py-2 text-sm hover:bg-black/5"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="text-[color:var(--color-text)]/70 text-sm">
            {loading
              ? 'Cargando…'
              : data?.total != null
                ? `${data.total} resultados`
                : 'Resultados'}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-2xl border border-black/10">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="bg-black/5 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Creada</th>
                <th className="px-4 py-3 font-semibold">Canal / Idioma</th>
                <th className="px-4 py-3 font-semibold">Lead / Cliente</th>
                <th className="px-4 py-3 font-semibold">Último mensaje</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((c) => {
                const lead = c.leads?.email || c.leads?.whatsapp || '—';
                const cust = c.customers?.email || c.customers?.name || c.customers?.phone || '—';
                return (
                  <tr
                    key={c.id}
                    className="border-t border-black/10"
                  >
                    <td className="text-[color:var(--color-text)]/70 whitespace-nowrap px-4 py-3">
                      {fmtDT(c.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[color:var(--color-text)]">{c.channel}</div>
                      <div className="text-[color:var(--color-text)]/60 mt-1 text-xs">
                        {c.locale || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[color:var(--color-text)]/60 text-xs">Lead: {lead}</div>
                      <div className="text-[color:var(--color-text)]/60 mt-1 text-xs">
                        Cliente: {cust}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.last_message ? (
                        <>
                          <div className="text-[color:var(--color-text)]/60 text-xs">
                            {fmtDT(c.last_message.created_at)}
                          </div>
                          <div className="mt-1 text-[color:var(--color-text)]">
                            {c.last_message.content}
                          </div>
                        </>
                      ) : (
                        <span className="text-[color:var(--color-text)]/60">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href={`/admin/conversations/${encodeURIComponent(c.id)}`}
                        className="rounded-xl border border-black/10 bg-black/5 px-3 py-1.5 text-xs hover:bg-black/10"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {!loading && (data?.items?.length ?? 0) === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-[color:var(--color-text)]/70 px-4 py-10 text-center"
                  >
                    No hay resultados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <button
            disabled={!hasPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm disabled:opacity-50"
          >
            Anterior
          </button>

          <div className="text-[color:var(--color-text)]/70 text-sm">Página {page}</div>

          <button
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
}
