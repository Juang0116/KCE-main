'use client';


import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';

type OutboundStatus = 'draft' | 'queued' | 'sending' | 'sent' | 'failed' | 'canceled';
type OutboundChannel = 'whatsapp' | 'email';

type OutboundRow = {
  id: string;
  deal_id: string | null;
  ticket_id: string | null;
  channel: OutboundChannel;
  provider: string;
  status: OutboundStatus;
  to_email: string | null;
  to_phone: string | null;
  subject: string | null;
  body: string;
  template_key: string | null;
  template_variant: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  outcome: 'none' | 'replied' | 'paid' | 'lost';
  replied_at: string | null;
  replied_note: string | null;
  attributed_won_at: string | null;
  attributed_booking_id: string | null;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as T;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function AdminOutboundClient() {
  const [items, setItems] = useState<OutboundRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [status, setStatus] = useState<OutboundStatus | ''>('');
  const [outcome, setOutcome] = useState<OutboundRow['outcome'] | ''>('');
  const [q, setQ] = useState('');
  const [dealId, setDealId] = useState('');
  const [ticketId, setTicketId] = useState('');

  const filtered = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return items.filter((item) => {
      if (status && item.status !== status) return false;
      if (outcome && item.outcome !== outcome) return false;
      if (dealId.trim() && item.deal_id !== dealId.trim()) return false;
      if (ticketId.trim() && item.ticket_id !== ticketId.trim()) return false;
      if (nq) {
        const hay = `${item.to_email ?? ''} ${item.to_phone ?? ''} ${item.subject ?? ''} ${item.body ?? ''}`.toLowerCase();
        if (!hay.includes(nq)) return false;
      }
      return true;
    });
  }, [items, status, outcome, q, dealId, ticketId]);

  const stats = useMemo(() => {
    const visible = filtered.length;
    const pending = filtered.filter((r) => r.status === 'queued' || r.status === 'draft').length;
    const sent = filtered.filter((r) => r.status === 'sent').length;
    const failed = filtered.filter((r) => r.status === 'failed').length;
    const replied = filtered.filter((r) => r.outcome === 'replied').length;
    const paid = filtered.filter((r) => r.outcome === 'paid').length;
    return { visible, pending, sent, failed, replied, paid };
  }, [filtered]);

  async function load() {
    setMsg('');
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (q.trim()) params.set('q', q.trim());
      if (dealId.trim()) params.set('deal_id', dealId.trim());
      if (ticketId.trim()) params.set('ticket_id', ticketId.trim());
      const data = await api<{ items: OutboundRow[] }>(`/api/admin/outbound?${params.toString()}`);
      setItems(data.items || []);
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo cargar outbound.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openWhatsApp(id: string) {
    setMsg('');
    try {
      const data = await api<{ waLink: string }>(`/api/admin/outbound/${id}/send`, { method: 'POST', body: JSON.stringify({ mode: 'send_now' }) });
      if (data.waLink) window.open(data.waLink, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo abrir WhatsApp.'));
    }
  }

  async function sendEmail(id: string) {
    setMsg('');
    setLoading(true);
    try {
      const data = await api<{ ok: boolean; sent: number; failed: number }>(`/api/admin/outbound/${id}/send`, { method: 'POST', body: JSON.stringify({ mode: 'send_now' }) });
      setMsg(`Email: sent=${data.sent} failed=${data.failed}`);
      await load();
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo enviar email.'));
    } finally {
      setLoading(false);
    }
  }

  async function markSent(id: string) {
    setMsg('');
    setLoading(true);
    try {
      await api(`/api/admin/outbound/${id}/mark-sent`, { method: 'POST' });
      await load();
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo marcar como enviado.'));
    } finally {
      setLoading(false);
    }
  }

  async function markReplied(id: string) {
    setMsg('');
    setLoading(true);
    try {
      await api(`/api/admin/outbound/${id}/mark-replied`, { method: 'POST', body: JSON.stringify({}) });
      await load();
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo marcar reply.'));
    } finally {
      setLoading(false);
    }
  }

  async function markLost(id: string) {
    setMsg('');
    setLoading(true);
    try {
      await api(`/api/admin/outbound/${id}/mark-lost`, { method: 'POST', body: JSON.stringify({}) });
      await load();
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo marcar perdido.'));
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    try {
      navigator.clipboard.writeText(text);
      setMsg('Copiado ✅');
    } catch {
      setMsg('No se pudo copiar.');
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-3 dark:border-white/10"><div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">Visibles</div><div className="mt-1 text-2xl font-semibold">{stats.visible}</div></div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-3 dark:border-white/10"><div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">Pendientes</div><div className="mt-1 text-2xl font-semibold">{stats.pending}</div></div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-3 dark:border-white/10"><div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">Enviados</div><div className="mt-1 text-2xl font-semibold">{stats.sent}</div></div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-3 dark:border-white/10"><div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">Replies</div><div className="mt-1 text-2xl font-semibold">{stats.replied}</div></div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-3 dark:border-white/10"><div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">Atribuidos</div><div className="mt-1 text-2xl font-semibold">{stats.paid}</div></div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-3 dark:border-white/10"><div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">Fallidos</div><div className="mt-1 text-2xl font-semibold">{stats.failed}</div></div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <button type="button" className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10" onClick={() => { setStatus(''); setOutcome(''); }}>Todos</button>
        <button type="button" className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10" onClick={() => { setStatus('queued'); setOutcome(''); }}>Trabajar pendientes</button>
        <button type="button" className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10" onClick={() => { setStatus('sent'); setOutcome(''); }}>Seguir enviados</button>
        <button type="button" className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10" onClick={() => { setStatus(''); setOutcome('replied'); }}>Revisar replies</button>
        <button type="button" className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10" onClick={() => { setStatus('failed'); setOutcome(''); }}>Corregir fallidos</button>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="grid gap-3 md:grid-cols-5">
          <label className="grid gap-1">
            <span className="text-xs text-[color:var(--color-text)]/70">Estado</span>
            <select
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="">(todos)</option>
              <option value="queued">queued</option>
              <option value="sent">sent</option>
              <option value="failed">failed</option>
              <option value="draft">draft</option>
              <option value="canceled">canceled</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-[color:var(--color-text)]/70">Outcome</span>
            <select
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as OutboundRow['outcome'] | '')}
            >
              <option value="">(todos)</option>
              <option value="none">none</option>
              <option value="replied">replied</option>
              <option value="paid">paid</option>
              <option value="lost">lost</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-[color:var(--color-text)]/70">Buscar</span>
            <input
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="email / teléfono / texto"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-[color:var(--color-text)]/70">Deal ID</span>
            <input
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black"
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
              placeholder="uuid"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-[color:var(--color-text)]/70">Ticket ID</span>
            <input
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="uuid"
            />
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={load} isLoading={loading}>Recargar</Button>
        </div>
      </div>

      {msg ? <div className="mt-3 text-sm text-[color:var(--color-text)]/80">{msg}</div> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="text-left text-xs text-[color:var(--color-text)]/70">
            <tr className="border-b border-black/10 dark:border-white/10">
              <th className="py-2 pr-3">Fecha</th>
              <th className="py-2 pr-3">Canal</th>
              <th className="py-2 pr-3">Estado</th>
              <th className="py-2 pr-3">Outcome</th>
              <th className="py-2 pr-3">Destino</th>
              <th className="py-2 pr-3">Asunto</th>
              <th className="py-2 pr-3">Mensaje</th>
              <th className="py-2 pr-3">Vínculos</th>
              <th className="py-2 pr-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const dest = r.channel === 'email' ? (r.to_email || '-') : (r.to_phone || '-');
              const snippet = (r.body || '').slice(0, 120);
              return (
                <tr key={r.id} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-3 pr-3">{fmtDate(r.created_at)}</td>
                  <td className="py-3 pr-3">{r.channel}</td>
                  <td className="py-3 pr-3">
                    <span className="rounded-full border border-black/10 px-2 py-0.5 text-xs dark:border-white/10">{r.status}</span>
                    {r.error ? <div className="mt-1 text-xs text-red-600 dark:text-red-400">{r.error}</div> : null}
                  </td>
                  <td className="py-3 pr-3">
                    <span className="rounded-full border border-black/10 px-2 py-0.5 text-xs dark:border-white/10">{r.outcome || 'none'}</span>
                    {r.outcome === 'replied' && r.replied_at ? (
                      <div className="mt-1 text-[10px] text-[color:var(--color-text)]/60">{fmtDate(r.replied_at)}</div>
                    ) : null}
                    {r.outcome === 'paid' && r.attributed_booking_id ? (
                      <div className="mt-1 text-[10px] text-[color:var(--color-text)]/60">booking: {r.attributed_booking_id}</div>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3">{dest}</td>
                  <td className="py-3 pr-3">{r.subject || '-'}</td>
                  <td className="py-3 pr-3">
                    <div className="max-w-[440px] whitespace-pre-wrap text-xs text-[color:var(--color-text)]/80">{snippet}{r.body.length > 120 ? '…' : ''}</div>
                    {r.template_key ? <div className="mt-1 text-[10px] text-[color:var(--color-text)]/50">tpl: {r.template_key}{r.template_variant ? `/${r.template_variant}` : ''}</div> : null}
                  </td>
                  <td className="py-3 pr-3 text-xs">
                    <div className="flex flex-col gap-1">
                      {r.deal_id ? <Link className="underline" href={`/admin/sales?deal=${r.deal_id}`}>Deal</Link> : null}
                      {r.ticket_id ? <Link className="underline" href={`/admin/tickets?ticket=${r.ticket_id}`}>Ticket</Link> : null}
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="h-8 rounded-lg border border-black/10 bg-[color:var(--color-surface)] px-2 text-xs hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                        onClick={() => copy(r.body || '')}
                      >
                        Copiar
                      </button>

                      {r.channel === 'whatsapp' ? (
                        <>
                          <button
                            type="button"
                            className="h-8 rounded-lg border border-black/10 bg-[color:var(--color-surface)] px-2 text-xs hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                            onClick={() => openWhatsApp(r.id)}
                          >
                            Abrir WA
                          </button>
                          <button
                            type="button"
                            className="h-8 rounded-lg border border-black/10 bg-[color:var(--color-surface)] px-2 text-xs hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                            onClick={() => markSent(r.id)}
                          >
                            Marcar enviado
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="h-8 rounded-lg border border-black/10 bg-[color:var(--color-surface)] px-2 text-xs hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
                            onClick={() => sendEmail(r.id)}
                            disabled={loading}
                          >
                            Enviar email
                          </button>
                          <button
                            type="button"
                            className="h-8 rounded-lg border border-black/10 bg-[color:var(--color-surface)] px-2 text-xs hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                            onClick={() => markSent(r.id)}
                          >
                            Marcar enviado
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        className="h-8 rounded-lg border border-black/10 bg-[color:var(--color-surface)] px-2 text-xs hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
                        onClick={() => markReplied(r.id)}
                        disabled={loading || r.outcome === 'paid'}
                      >
                        Marcar reply
                      </button>
                      <button
                        type="button"
                        className="h-8 rounded-lg border border-black/10 bg-[color:var(--color-surface)] px-2 text-xs hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
                        onClick={() => markLost(r.id)}
                        disabled={loading || r.outcome === 'paid'}
                      >
                        Perdido
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filtered.length ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-sm text-[color:var(--color-text)]/60">
                  Sin mensajes outbound.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
