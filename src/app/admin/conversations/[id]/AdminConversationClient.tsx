'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Send,
  MessageSquare,
  Globe,
  Languages,
  Clock,
  User,
  Bot,
  ShieldCheck,
  ArrowUpRight,
  Zap,
  ExternalLink,
  Terminal,
  Sparkles,
  Hash,
  AlertTriangle, // <--- Añade esta línea aquí
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Message = {
  id: string;
  role: string;
  content: string;
  meta?: Record<string, unknown> | null;
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
  const title = cust?.name || cust?.email || lead?.email || lead?.whatsapp || 'Viajero Anónimo';
  const subtitle = cust?.email || lead?.email || lead?.whatsapp || 'Sin contacto verificado';
  return { title, subtitle };
}

function badgeStatus(status: string) {
  const s = (status || '').toLowerCase();
  const base =
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border shadow-sm';
  if (s === 'active')
    return `${base} border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400`;
  if (s === 'closed') return `${base} border-brand-dark/10 bg-surface-2 text-muted`;
  return `${base} border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-brand-yellow`;
}

export function AdminConversationClient({ id }: { id: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchConversation = useCallback(async () => {
    if (!data) setLoading(true);
    setError(null);
    try {
      const r = await adminFetch(`/api/admin/conversations/${encodeURIComponent(id)}`);
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setData(j as ApiResponse);
      setTimeout(scrollToBottom, 100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado al cargar hilos');
    } finally {
      setLoading(false);
    }
  }, [id, data, scrollToBottom]);

  useEffect(() => {
    void fetchConversation();
  }, [id]);
  useEffect(() => {
    scrollToBottom();
  }, [data?.messages, scrollToBottom]);

  // UX Pro: Auto-ajuste de altura del textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [draft]);

  const conv = data?.conversation;
  const ownerInfo = conv ? owner(conv) : { title: '...', subtitle: '...' };

  const send = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await adminFetch(`/api/admin/conversations/${encodeURIComponent(id)}/message`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Falla en la transmisión');
      setDraft('');
      if (textareaRef.current) textareaRef.current.style.height = 'inherit';
      await fetchConversation();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto w-full max-w-7xl space-y-10 pb-24 duration-1000">
      {/* 01. HEADER TÁCTICO */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <Link
            href="/admin/conversations"
            className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:text-brand-blue"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />{' '}
            CRM / Inbox
          </Link>
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-blue/5 bg-brand-blue/10 text-brand-blue shadow-inner">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-heading text-4xl leading-none tracking-tighter text-main">
                {ownerInfo.title}
              </h1>
              <div className="mt-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted opacity-60">
                <Hash className="h-3 w-3" /> {id.slice(0, 12)} <span className="opacity-20">|</span>{' '}
                {ownerInfo.subtitle}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => void fetchConversation()}
            disabled={loading}
            className="h-12 rounded-full border-brand-dark/10 px-6 text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-surface-2"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin text-brand-blue' : ''}`}
            />{' '}
            Refrescar Hilo
          </Button>
        </div>
      </header>

      {/* 02. DASHBOARD DE CONTEXTO */}
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Estatus Hilo', val: badgeStatus(conv?.status || ''), isBadge: true },
          { label: 'Origen', val: conv?.channel || 'Cloud Web', icon: Globe, caps: true },
          { label: 'Idioma', val: conv?.locale || 'ES', icon: Languages, caps: true },
          {
            label: 'Fecha Apertura',
            val: conv?.created_at
              ? new Date(conv.created_at).toLocaleDateString('es-CO', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—',
            icon: Clock,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface p-6 shadow-soft transition-all duration-300 hover:shadow-pop dark:border-white/5"
          >
            <p className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">
              {stat.icon && <stat.icon className="h-3.5 w-3.5" />} {stat.label}
            </p>
            <div className={`text-xs font-bold text-main ${stat.caps ? 'uppercase' : ''}`}>
              {stat.isBadge ? <span className={stat.val as string}>{conv?.status}</span> : stat.val}
            </div>
          </div>
        ))}
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
        {/* 03. TERMINAL DE CHAT (LA BÓVEDA) */}
        <section className="relative flex h-[800px] flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
          {/* Status Bar */}
          <div className="relative z-20 flex items-center justify-between border-b border-brand-dark/10 bg-brand-dark px-8 py-5">
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 animate-pulse text-brand-yellow" />
              <h3 className="font-heading text-sm uppercase tracking-[0.2em] text-white">
                Signal: Live Feed
              </h3>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">
                Active Connection
              </span>
            </div>
          </div>

          {/* Chat Bubbles */}
          <div className="bg-surface-2/30 custom-scrollbar flex-1 space-y-8 overflow-y-auto scroll-smooth p-8">
            {(data?.messages || []).length === 0 && !loading ? (
              <div className="flex h-full flex-col items-center justify-center italic text-muted opacity-40">
                <MessageSquare className="mb-6 h-16 w-16 opacity-10" />
                <p className="text-base font-light">
                  Inicia la transmisión para ver el flujo de datos.
                </p>
              </div>
            ) : (
              (data?.messages || []).map((m) => {
                const isAgent = ['agent', 'assistant', 'system', 'admin'].includes(m.role);
                const isBot = ['assistant', 'system'].includes(m.role);

                return (
                  <div
                    key={m.id}
                    className={`animate-in fade-in slide-in-from-bottom-2 flex w-full max-w-[85%] flex-col ${isAgent ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div
                      className={`mb-2 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest ${isAgent ? 'text-brand-blue/80' : 'text-brand-yellow/90'}`}
                    >
                      {isBot ? (
                        <>
                          <Bot className="h-3.5 w-3.5" /> IA Core
                        </>
                      ) : isAgent ? (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5" /> KCE Operator
                        </>
                      ) : (
                        <>
                          <User className="h-3.5 w-3.5" /> Voyager
                        </>
                      )}
                      <span className="font-mono font-normal opacity-30">
                        {m.created_at
                          ? new Date(m.created_at).toLocaleTimeString('es-CO', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                    <div
                      className={`whitespace-pre-wrap px-7 py-5 text-sm font-light leading-relaxed shadow-soft transition-all duration-300 ${
                        isAgent
                          ? 'rounded-[2.5rem] rounded-tr-sm bg-brand-blue text-white'
                          : 'rounded-[2.5rem] rounded-tl-sm border border-brand-dark/5 bg-surface text-main dark:border-white/5'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ÁREA DE INTERVENCIÓN */}
          <div className="relative z-20 border-t border-brand-dark/10 bg-surface p-6">
            {error && (
              <div className="animate-in slide-in-from-bottom-1 mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-[10px] font-bold uppercase text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" /> {error}
              </div>
            )}
            <div className="group relative">
              <textarea
                ref={textareaRef}
                className="bg-surface-2/50 placeholder:text-muted/30 min-h-[140px] w-full resize-none rounded-[2.5rem] border border-brand-dark/10 py-6 pl-8 pr-20 text-sm font-light leading-relaxed text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Escribe un mensaje de guante blanco..."
                disabled={sending}
              />
              <div className="absolute bottom-4 right-4">
                <Button
                  onClick={() => void send()}
                  disabled={sending || !draft.trim()}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-dark p-0 text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95 disabled:opacity-30"
                >
                  {sending ? (
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  ) : (
                    <Send className="ml-1 h-6 w-6" />
                  )}
                </Button>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-3">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-blue opacity-50" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-40">
                Human-in-the-loop Protocol: AI is currently in monitoring mode.
              </p>
            </div>
          </div>
        </section>

        {/* 04. SIDEBAR TÁCTICO (BÓVEDA) */}
        <aside className="space-y-6 lg:sticky lg:top-8">
          <div className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5">
            <div className="pointer-events-none absolute -right-4 -top-4 opacity-[0.02]">
              <Zap className="h-32 w-32 text-brand-blue" />
            </div>

            <header className="mb-8 flex items-center gap-4 border-b border-brand-dark/5 pb-6 dark:border-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-blue/5 bg-brand-blue/10 text-brand-blue shadow-inner">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-main">
                Atajos CRM
              </h2>
            </header>

            <div className="relative z-10 space-y-4">
              {[
                { label: 'Gestionar Negocio', h: '/admin/deals', icon: Zap },
                { label: 'Tickets de Soporte', h: '/admin/tickets', icon: MessageSquare },
                { label: 'Perfil de Cliente', h: '/admin/customers', icon: User },
              ].map((link, i) => (
                <Link
                  key={i}
                  href={link.h}
                  className="bg-surface-2/50 group flex w-full items-center justify-between rounded-2xl border border-brand-dark/10 px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-main shadow-sm transition-all hover:bg-brand-dark hover:text-brand-yellow dark:border-white/10"
                >
                  <span className="flex items-center gap-3">
                    <link.icon className="h-4 w-4 opacity-50 group-hover:opacity-100" />{' '}
                    {link.label}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>

          {/* Editorial Shield Box */}
          <div className="rounded-[var(--radius-2xl)] border border-brand-blue/10 bg-brand-blue/5 p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
              <ShieldCheck className="h-4 w-4" /> Editorial Protocol
            </div>
            <p className="border-l-2 border-brand-blue/20 pl-4 text-[11px] font-light italic leading-relaxed text-brand-blue/80">
              &quot;Al intervenir, prioriza la personalización. La IA ya ha mapeado el interés del
              viajero; tu rol es cerrar la confianza con el estándar de servicio de Knowing Cultures
              S.A.S.&quot;
            </p>
          </div>

          {/* Footer del Nodo */}
          <footer className="flex items-center justify-center gap-4 py-4 opacity-30">
            <Terminal className="h-3.5 w-3.5 text-muted" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted">
              Communication Node v4.1
            </span>
          </footer>
        </aside>
      </div>
    </div>
  );
}
