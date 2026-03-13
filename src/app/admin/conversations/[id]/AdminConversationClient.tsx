'use client';


import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState } from 'react';

type Message = {
  id: string;
  role: string;
  content: string;
  meta: any;
  created_at: string;
};

type Conversation = {
  id: string;
  channel: string;
  locale: string;
  status: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  lead_id: string | null;
  customer_id: string | null;
  leads?: {
    id: string;
    email: string | null;
    whatsapp: string | null;
    stage: string | null;
  } | null;
  customers?: {
    id: string;
    email: string | null;
    name: string | null;
    phone: string | null;
    country: string | null;
  } | null;
};

type ApiResponse = {
  conversation: Conversation;
  messages: Message[];
};

function owner(c: Conversation) {
  const cust = c.customers;
  const lead = c.leads;
  const title = cust?.name || cust?.email || lead?.email || lead?.whatsapp || '—';
  const subtitle = cust?.email || lead?.email || lead?.whatsapp || '—';
  return { title, subtitle };
}

function roleBadge(role: string) {
  const r = (role || '').toLowerCase();
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  if (r === 'user') return `${base} bg-sky-500/15 text-sky-800 dark:text-sky-200`;
  if (r === 'assistant') return `${base} bg-violet-500/15 text-violet-800 dark:text-violet-200`;
  if (r === 'agent') return `${base} bg-emerald-500/15 text-emerald-800 dark:text-emerald-200`;
  return `${base} bg-black/10 text-[color:var(--color-text)]/80`;
}

export function AdminConversationClient({ id }: { id: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const refreshKey = useMemo(() => id, [id]);

  const fetchConversation = () => {
    setLoading(true);
    setError(null);
    adminFetch(`/api/admin/conversations/${encodeURIComponent(id)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        return j as ApiResponse;
      })
      .then((j) => setData(j))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const conv = data?.conversation;
  const ownerInfo = conv ? owner(conv) : { title: '—', subtitle: '—' };

  const send = async () => {
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    try {
      const res = await adminFetch(`/api/admin/conversations/${encodeURIComponent(id)}/message`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setDraft('');
      fetchConversation();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSending(false);
    }
  };

  return (
    <section>
      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-black/10 bg-black/5 p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[color:var(--color-text)]/60 text-sm">Owner</div>
            <div className="font-semibold text-[color:var(--color-text)]">{ownerInfo.title}</div>
            <div className="text-[color:var(--color-text)]/60 text-xs">{ownerInfo.subtitle}</div>
          </div>
          <div className="text-[color:var(--color-text)]/60 mt-3 text-xs sm:mt-0">
            <div>Canal: {conv?.channel || '—'}</div>
            <div>Idioma: {conv?.locale || '—'}</div>
            <div>Creada: {conv ? new Date(conv.created_at).toLocaleString() : '—'}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-black/10">
        <div className="border-b border-black/10 bg-black/5 px-4 py-3 text-sm font-semibold">
          Mensajes
        </div>
        <div className="max-h-[520px] overflow-auto p-4">
          {loading ? (
            <div className="text-[color:var(--color-text)]/70 text-sm">Cargando…</div>
          ) : null}

          {!loading && (data?.messages?.length ?? 0) === 0 ? (
            <div className="text-[color:var(--color-text)]/70 text-sm">No hay mensajes.</div>
          ) : null}

          <div className="space-y-4">
            {(data?.messages ?? []).map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={roleBadge(m.role)}>{m.role}</span>
                  <span className="text-[color:var(--color-text)]/60 text-xs">
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-[color:var(--color-text)]">
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-black/10 bg-black/5 p-4">
        <div className="text-sm font-semibold text-[color:var(--color-text)]">
          Responder como agente
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          placeholder="Escribe tu respuesta…"
          className="mt-3 w-full rounded-xl border border-black/10 bg-[color:var(--color-surface)] p-3 text-sm"
        />
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={fetchConversation}
            className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm hover:bg-black/10"
            type="button"
          >
            Refrescar
          </button>
          <button
            disabled={sending || !draft.trim()}
            onClick={send}
            className="rounded-xl border border-black/10 bg-brand-blue px-4 py-2 text-sm text-white disabled:opacity-50"
            type="button"
          >
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </div>
    </section>
  );
}
