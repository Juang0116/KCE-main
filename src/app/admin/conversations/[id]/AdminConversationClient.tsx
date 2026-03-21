'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, RefreshCw, Send, MessageSquare, 
  Globe, Languages, Clock, User, Bot, 
  ShieldCheck, ArrowUpRight, Zap, ExternalLink 
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
  leads?: { id: string; email: string | null; whatsapp: string | null; stage: string | null; } | null;
  customers?: { id: string; email: string | null; name: string | null; phone: string | null; country: string | null; } | null;
};

type ApiResponse = {
  conversation: Conversation;
  messages: Message[];
};

function owner(c: Conversation) {
  const cust = c.customers;
  const lead = c.leads;
  const title = cust?.name || cust?.email || lead?.email || lead?.whatsapp || 'Viajero Anónimo';
  const subtitle = cust?.email || lead?.email || lead?.whatsapp || 'Sin contacto';
  return { title, subtitle };
}

function badgeStatus(status: string) {
  const s = (status || '').toLowerCase();
  const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border shadow-sm';
  if (s === 'active') return `${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-700`;
  if (s === 'closed') return `${base} border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text-muted)]`;
  return `${base} border-amber-500/20 bg-amber-500/10 text-amber-700`;
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

  useEffect(() => { void fetchConversation(); }, [id]);
  useEffect(() => { scrollToBottom(); }, [data?.messages, scrollToBottom]);

  // UX Pro: Auto-ajuste de altura del textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [draft]);

  const conv = data?.conversation;
  const ownerInfo = conv ? owner(conv) : { title: '—', subtitle: '—' };

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
    <div className="mx-auto w-full max-w-7xl space-y-10 pb-24 animate-in fade-in duration-700">
      
      {/* HEADER TÁCTICO */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[color:var(--color-border)] pb-8">
        <div className="space-y-4">
          <Link href="/admin/conversations" className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] hover:text-brand-blue transition-colors">
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /> Bandeja de Entrada
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue border border-brand-blue/10">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-heading text-3xl text-brand-blue">{ownerInfo.title}</h1>
              <p className="text-[10px] font-mono text-[color:var(--color-text)]/30 uppercase tracking-tighter mt-1">
                ID Sesión: {id.slice(0,12)} • {ownerInfo.subtitle}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => void fetchConversation()} disabled={loading} className="rounded-full shadow-sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refrescar Hilo
          </Button>
        </div>
      </header>

      {/* DASHBOARD DE CONTEXTO */}
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Estatus Hilo', val: badgeStatus(conv?.status || ''), isBadge: true },
          { label: 'Canal de Origen', val: conv?.channel || '—', icon: Globe, caps: true },
          { label: 'Localización', val: conv?.locale || 'ES', icon: Languages, caps: true },
          { label: 'Apertura', val: conv?.created_at ? new Date(conv.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—', icon: Clock }
        ].map((stat, i) => (
          <div key={i} className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/30 mb-2 flex items-center gap-1.5">
              {stat.icon && <stat.icon className="h-3 w-3" />} {stat.label}
            </p>
            <div className={`text-xs font-bold text-brand-blue ${stat.caps ? 'uppercase' : ''}`}>
              {stat.isBadge ? <span className={stat.val as string}>{conv?.status}</span> : stat.val}
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px] items-start">
        
        {/* TERMINAL DE CHAT */}
        <section className="rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-2xl flex flex-col h-[750px] overflow-hidden relative">
          
          <div className="border-b border-[color:var(--color-border)] bg-brand-dark px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-brand-yellow animate-pulse" />
              <h3 className="font-heading text-sm text-white uppercase tracking-widest">Live Feed</h3>
            </div>
            <div className="flex items-center gap-2">
               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
               <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Connected</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-black/[0.02] custom-scrollbar">
            {(data?.messages || []).length === 0 && !loading ? (
              <div className="h-full flex flex-col items-center justify-center text-[color:var(--color-text)]/50">
                <MessageSquare className="h-12 w-12 mb-4 opacity-10" />
                <p className="text-sm font-light italic">Inicia la conversación para ver el flujo de datos.</p>
              </div>
            ) : (
              (data?.messages || []).map((m) => {
                const isAgent = ['agent', 'assistant', 'system', 'admin'].includes(m.role);
                const isBot = ['assistant', 'system'].includes(m.role);
                
                return (
                  <div key={m.id} className={`flex flex-col w-full max-w-[85%] ${isAgent ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                    <div className={`mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest ${isAgent ? 'text-brand-blue/60' : 'text-brand-yellow/80'}`}>
                      {isBot ? <><Bot className="h-3 w-3" /> Inferencia IA</> : isAgent ? <><ShieldCheck className="h-3 w-3" /> Operador KCE</> : <><User className="h-3 w-3" /> Viajero</>}
                      <span className="font-mono font-normal opacity-40">{m.created_at ? new Date(m.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <div className={`px-6 py-4 text-sm font-light leading-relaxed whitespace-pre-wrap shadow-xl ${
                      isAgent 
                        ? 'rounded-[2rem] rounded-tr-sm bg-brand-blue text-white' 
                        : 'rounded-[2rem] rounded-tl-sm border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)]'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ÁREA DE INTERVENCIÓN */}
          <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
            <div className="relative">
              <textarea
                ref={textareaRef}
                className="w-full rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] pl-6 pr-20 py-5 text-sm font-light leading-relaxed outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all min-h-[120px] resize-none"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
                placeholder="Escribe un mensaje de guante blanco..."
                disabled={sending}
              />
              <div className="absolute right-3 bottom-3">
                <Button 
                  onClick={() => void send()} 
                  disabled={sending || !draft.trim()} 
                  className="h-12 w-12 rounded-full bg-brand-dark text-brand-yellow shadow-lg hover:scale-110 transition-all flex items-center justify-center p-0"
                >
                  {sending ? <RefreshCw className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5 ml-0.5"/>}
                </Button>
              </div>
            </div>
            <p className="mt-3 text-center text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 flex items-center justify-center gap-2">
               <ShieldCheck className="h-3 w-3" /> Intervención Humana activa: El bot se pausará temporalmente.
            </p>
          </div>
        </section>

        {/* SIDEBAR TÁCTICO */}
        <aside className="space-y-6 sticky top-10">
          <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-xl">
            <header className="flex items-center gap-3 border-b border-[color:var(--color-border)] pb-6 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue shadow-inner">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-xl text-brand-blue uppercase tracking-tight">Atajos CRM</h2>
            </header>

            <div className="space-y-3">
              {[
                { label: 'Gestionar Negocio', h: '/admin/deals', icon: Zap },
                { label: 'Ver Ticket Soporte', h: '/admin/tickets', icon: MessageSquare },
                { label: 'Perfil de Cliente', h: '/admin/customers', icon: User }
              ].map((link, i) => (
                <Link 
                  key={i} 
                  href={link.h} 
                  className="flex items-center justify-between w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-blue hover:bg-brand-blue hover:text-white transition-all group"
                >
                  <span className="flex items-center gap-2"><link.icon className="h-3.5 w-3.5" /> {link.label}</span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-brand-blue/5 border border-brand-blue/10 p-8">
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-blue/50 mb-4">
                <ShieldCheck className="h-3.5 w-3.5" /> Protocolo de Handoff
             </div>
             <p className="text-[11px] text-brand-blue/70 font-light leading-relaxed italic">
               &quot;Al intervenir manualmente, asegúrate de saludar al viajero por su nombre y validar los datos que el Bot ya ha recolectado para evitar redundancias.&quot;
             </p>
          </div>
        </aside>
      </div>
    </div>
  );
}