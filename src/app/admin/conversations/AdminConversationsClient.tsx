'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Search, Clock, RefreshCw, MessageSquare, MapPin, ArrowRight } from 'lucide-react';

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
    return new Date(iso).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function badgeStatus(status: string) {
  const s = (status || '').toLowerCase();
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border shadow-sm';
  if (s === 'active') return `${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-700`;
  if (s === 'closed') return `${base} border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/50`;
  if (s === 'bot') return `${base} border-brand-blue/20 bg-brand-blue/10 text-brand-blue`;
  return `${base} border-amber-500/20 bg-amber-500/10 text-amber-700`;
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
  const hasNext = data?.total == null ? (data?.items?.length ?? 0) === limit : page * limit < (data.total ?? 0);

  const conversationItems = data?.items ?? [];
  const conversationSignals = useMemo(
    () => [
      {
        label: 'Hilos Visibles',
        value: data?.total != null ? String(data.total) : String(conversationItems.length),
        note: 'Conversaciones representadas por el filtro actual.',
      },
      {
        label: 'Requieren Acción',
        value: String(conversationItems.filter((item) => (item.status || '').toLowerCase() !== 'closed').length),
        note: 'Hilos abiertos que pueden requerir soporte o cierre de ventas.',
      },
      {
        label: 'Canales Activos',
        value: String(new Set(conversationItems.map((item) => item.channel).filter(Boolean)).size),
        note: 'Fuentes de mensajería (web, whatsapp) en esta vista.',
      },
    ],
    [conversationItems, data?.total],
  );

  return (
    <section className="space-y-10 pb-20">
      
      {/* Cabecera Ejecutiva */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Bandeja de Mensajes</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Monitorea el Chat de KCE en tiempo real y toma el control de las negociaciones.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="conversation workbench"
        title="Enruta la señal antes de que sea ruido"
        description="Utiliza las conversaciones como capa de enrutamiento: detecta los hilos calientes, decide si pertenecen a soporte o a ventas, y mantén el contexto del viajero intacto durante el handoff."
        actions={[
          { href: '/admin/tickets', label: 'Ver Tickets', tone: 'primary' },
          { href: '/admin/ai', label: 'Configurar AI Desk' },
        ]}
        signals={conversationSignals}
      />

      {/* Filtros de Búsqueda */}
      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        <div className="flex flex-col xl:flex-row gap-4 xl:items-end justify-between mb-8 border-b border-[var(--color-border)] pb-6">
          <div className="grid gap-4 sm:grid-cols-2 w-full xl:w-1/2">
            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Buscar en</div>
              <select
                value={scope}
                onChange={(e) => { setScope(e.target.value as any); setPage(1); }}
                className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 font-semibold outline-none appearance-none cursor-pointer focus:border-brand-blue transition-colors"
              >
                <option value="meta">Datos del Cliente (Email / WhatsApp)</option>
                <option value="content">Contenido de Mensajes (Chat)</option>
              </select>
            </label>

            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Palabra Clave</div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text)]/40" />
                <input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                  placeholder={scope === 'content' ? 'ej: precios, tours...' : 'ej: juan@mail.com...'}
                  className="w-full h-12 pl-12 rounded-xl border border-[var(--color-border)] bg-transparent px-4 outline-none focus:border-brand-blue transition-colors"
                />
              </div>
            </label>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => { setQ(''); setScope('meta'); setPage(1); }} className="h-12 rounded-xl border border-[var(--color-border)] bg-transparent px-6 text-xs font-bold uppercase tracking-widest hover:bg-[var(--color-surface-2)] transition-colors">
              Limpiar
            </button>
            <div className="h-12 flex items-center justify-center rounded-xl bg-brand-blue/5 border border-brand-blue/20 px-6 text-xs font-bold uppercase tracking-widest text-brand-blue">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : `${data?.total ?? 0} Resultados`}
            </div>
          </div>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{error}</div>}

        {/* Tabla de Conversaciones */}
        <div className="overflow-x-auto rounded-3xl border border-[var(--color-border)] bg-white shadow-sm">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-6 py-5">Hilo & Origen</th>
                <th className="px-6 py-5">Cliente Identificado</th>
                <th className="px-6 py-5">Última Interacción</th>
                <th className="px-6 py-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-sm font-medium text-[var(--color-text)]/40">Cargando conversaciones...</td></tr>
              ) : conversationItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <MessageSquare className="mx-auto h-12 w-12 text-[var(--color-text)]/10 mb-4" />
                    <div className="text-sm font-medium text-[var(--color-text)]/40">Bandeja limpia o sin coincidencias.</div>
                  </td>
                </tr>
              ) : (
                conversationItems.map((c) => {
                  const lead = c.leads?.email || c.leads?.whatsapp || 'Anónimo';
                  const cust = c.customers?.email || c.customers?.name || c.customers?.phone || 'No registrado';
                  const isBot = c.last_message?.role === 'assistant';
                  
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50 group">
                      <td className="px-6 py-5 align-top">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={badgeStatus(c.status)}>{c.status || 'active'}</span>
                          <span className="text-[10px] font-mono text-[var(--color-text)]/30">#{c.id.slice(0,6)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text)]">
                          <MapPin className="h-3 w-3 text-brand-blue"/> <span className="capitalize">{c.channel}</span>
                          <span className="text-[var(--color-text)]/30">·</span>
                          <span className="uppercase text-[var(--color-text)]/60">{c.locale || 'ES'}</span>
                        </div>
                        <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 flex items-center gap-1">
                          <Clock className="h-3 w-3"/> {fmtDT(c.created_at)}
                        </div>
                      </td>

                      <td className="px-6 py-5 align-top">
                        <div className="font-medium text-brand-blue mb-1">{cust}</div>
                        <div className="text-xs text-[var(--color-text)]/60">Lead Ref: {lead}</div>
                      </td>

                      <td className="px-6 py-5 align-top">
                        {c.last_message ? (
                          <div className={`rounded-2xl p-4 border ${isBot ? 'bg-brand-blue/5 border-brand-blue/20' : 'bg-[var(--color-surface-2)] border-[var(--color-border)] shadow-inner'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${isBot ? 'text-brand-blue' : 'text-[var(--color-text)]/60'}`}>
                                {isBot ? '🤖 Agente KCE' : '👤 Cliente'}
                              </span>
                              <span className="text-[10px] text-[var(--color-text)]/40 font-mono">{fmtDT(c.last_message.created_at)}</span>
                            </div>
                            <p className="text-sm font-light text-[var(--color-text)]/80 line-clamp-2 leading-relaxed">
                              {c.last_message.content}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs italic text-[var(--color-text)]/30">— Hilo vacío —</span>
                        )}
                      </td>

                      <td className="px-6 py-5 align-top text-right">
                        <Link href={`/admin/conversations/${encodeURIComponent(c.id)}`} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-dark px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-sm">
                          Abrir Chat <ArrowRight className="h-3 w-3"/>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {data?.total != null && data.total > limit && (
          <div className="mt-6 flex items-center justify-between border-t border-[var(--color-border)] pt-6">
            <button disabled={!hasPrev} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest disabled:opacity-30 transition hover:bg-[var(--color-surface)]">
              ← Anterior
            </button>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
              Página {page} de {Math.ceil(data.total / limit)}
            </div>
            <button disabled={!hasNext} onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest disabled:opacity-30 transition hover:bg-[var(--color-surface)]">
              Siguiente →
            </button>
          </div>
        )}

      </div>
    </section>
  );
}