'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Send, MessageSquare, Globe, Languages, Clock } from 'lucide-react';

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

function badgeStatus(status: string) {
  const s = (status || '').toLowerCase();
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border shadow-sm';
  if (s === 'active') return `${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-700`;
  if (s === 'closed') return `${base} border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/50`;
  return `${base} border-amber-500/20 bg-amber-500/10 text-amber-700`;
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
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-20">
      
      {/* Breadcrumbs & Header */}
      <div>
        <Link href="/admin/conversations" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 hover:text-brand-blue transition-colors mb-4">
          <ArrowLeft className="h-3 w-3" /> Volver a la Bandeja
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="h-6 w-6 text-brand-blue" />
              <h1 className="font-heading text-2xl md:text-3xl text-[var(--color-text)] leading-tight">
                {ownerInfo.title}
              </h1>
            </div>
            <div className="text-xs text-[var(--color-text)]/50 font-mono flex items-center gap-2">
              Conv ID: {id.slice(0,8)} | Contacto: {ownerInfo.subtitle}
            </div>
          </div>
          <button onClick={fetchConversation} disabled={loading} className="shrink-0 flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)] disabled:opacity-50">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refrescar
          </button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{error}</div>}

      {/* Tarjeta de Metadatos Contextuales */}
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-1.5">Estado Hilo</div>
            <span className={badgeStatus(conv?.status || '')}>{conv?.status || '—'}</span>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-1.5 flex items-center gap-1.5"><Globe className="h-3 w-3"/> Canal</div>
            <div className="text-sm font-medium text-[var(--color-text)] capitalize">{conv?.channel || '—'}</div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-1.5 flex items-center gap-1.5"><Languages className="h-3 w-3"/> Idioma</div>
            <div className="text-sm font-medium text-[var(--color-text)] uppercase">{conv?.locale || 'ES'}</div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-1.5 flex items-center gap-1.5"><Clock className="h-3 w-3"/> Creado</div>
            <div className="text-sm font-medium text-[var(--color-text)]">
              {conv?.created_at ? new Date(conv.created_at).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px] items-start">
        
        {/* Historial de Mensajes (Chat UI) */}
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm flex flex-col h-[700px] overflow-hidden">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-6 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-brand-blue" />
              <h3 className="font-heading text-lg text-[var(--color-text)]">Sala de Chat</h3>
            </div>
            {loading && <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 animate-pulse">Sincronizando...</span>}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/5 dark:bg-white/5 custom-scrollbar">
            {(data?.messages || []).length === 0 && !loading ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--color-text)]/30">
                <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">Hilo de conversación vacío.</p>
              </div>
            ) : null}

            {(data?.messages || []).map((m) => {
              const isAgent = m.role === 'agent' || m.role === 'assistant' || m.role === 'system';
              const isBot = m.role === 'assistant' || m.role === 'system';
              
              return (
                <div key={m.id} className={`flex flex-col w-full max-w-[85%] ${isAgent ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                  <div className={`mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${isAgent ? 'text-brand-blue' : 'text-[var(--color-text)]/50'}`}>
                    {isBot ? '🤖 AI Autopilot' : isAgent ? '👨‍💻 Agente KCE' : '👤 Cliente'}
                    <span className="font-mono font-normal opacity-50 lowercase">{m.created_at ? new Date(m.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <div className={`px-5 py-4 text-sm font-light leading-relaxed whitespace-pre-wrap shadow-sm ${isAgent ? 'rounded-3xl rounded-tr-sm bg-brand-blue text-white' : 'rounded-3xl rounded-tl-sm border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'}`}>
                    {m.content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Caja de Redacción (Adentro del chat) */}
          <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-6">
            <textarea
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-4 text-sm font-light leading-relaxed outline-none focus:border-brand-blue transition-colors min-h-[100px] resize-y placeholder:text-[var(--color-text)]/40"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribe tu respuesta aquí (se enviará como Agente Humano)..."
              disabled={sending}
            />
            <div className="flex justify-end pt-3">
              <button onClick={send} disabled={sending || !draft.trim()} className="flex items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-xs font-bold uppercase tracking-widest text-brand-yellow hover:scale-105 shadow-md transition-all disabled:opacity-50">
                {sending ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>} 
                {sending ? 'Transmitiendo...' : 'Enviar Mensaje'}
              </button>
            </div>
          </div>
        </div>

        {/* Panel Lateral de Enlaces (Soporte Contextual) */}
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sticky top-6">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-4 border-b border-[var(--color-border)] pb-3">
            Atajos de CRM
          </div>
          <div className="space-y-3">
            <Link href="/admin/deals" className="block w-full text-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors">
              Ir a Bandeja de Deals
            </Link>
            <Link href="/admin/tickets" className="block w-full text-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors">
              Ir a Support Tickets
            </Link>
            <Link href="/admin/customers" className="block w-full text-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors">
              Directorio de Clientes
            </Link>
          </div>
          <div className="mt-6 pt-4 border-t border-[var(--color-border)] text-xs font-light text-[var(--color-text)]/50 leading-relaxed text-center">
            Las respuestas enviadas desde aquí pausarán al Bot de Inteligencia Artificial temporalmente para este usuario.
          </div>
        </div>
      </div>
    </div>
  );
}