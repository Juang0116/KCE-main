'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { 
  Search, Clock, RefreshCw, 
  MessageSquare, ArrowRight, Filter,
  ShieldCheck, Bot, User, Globe, ChevronLeft, 
  ChevronRight, Sparkles, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
    return new Date(iso).toLocaleString('es-CO', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  } catch { return iso; }
}

function badgeStatus(status: string) {
  const s = (status || '').toLowerCase();
  const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border shadow-sm';
  if (s === 'active') return `${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-600`;
  if (s === 'closed') return `${base} border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/40`;
  if (s === 'bot') return `${base} border-brand-blue/20 bg-brand-blue/5 text-brand-blue`;
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

  // UX Pro: Evita race conditions en búsquedas rápidas
  const reqIdRef = useRef(0);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (scope) p.set('scope', scope);
    p.set('page', String(page));
    p.set('limit', String(limit));
    return p.toString();
  }, [q, scope, page, limit]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const myReqId = ++reqIdRef.current;

    try {
      const r = await adminFetch(`/api/admin/conversations?${query}`);
      const j = await r.json().catch(() => ({}));
      
      if (myReqId !== reqIdRef.current) return;
      if (!r.ok) throw new Error(j?.error || `Falla de Red (HTTP ${r.status})`);
      
      setData(j as ApiResponse);
    } catch (e: unknown) {
      if (myReqId !== reqIdRef.current) return;
      setError(e instanceof Error ? e.message : 'Error de sincronización');
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  }, [query]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const hasPrev = page > 1;
  const hasNext = data?.total == null ? (data?.items?.length ?? 0) === limit : page * limit < (data.total ?? 0);

  const conversationItems = data?.items ?? [];
  const signals = useMemo(() => [
    { label: 'Hilos en Radar', value: data?.total != null ? String(data.total) : '—', note: 'Sesiones totales identificadas.' },
    { label: 'Acción Humana', value: String(conversationItems.filter(i => i.status !== 'closed').length), note: 'Hilos que requieren supervisión.' },
    { label: 'Omnicanalidad', value: String(new Set(conversationItems.map(i => i.channel)).size), note: 'Web + WhatsApp activos.' },
  ], [conversationItems, data?.total]);

  return (
    <div className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE OPERACIONES */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Zap className="h-3.5 w-3.5" /> Communication Hub
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue">
            Bandeja de <span className="text-brand-yellow italic font-light">Mensajes</span>
          </h1>
          <p className="mt-4 text-base text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Supervisión del flujo conversacional. Intervén en los hilos de alta temperatura para cerrar acuerdos premium.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-full shadow-sm" onClick={() => void fetchData()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
          </Button>
        </div>
      </header>

      {/* 02. WORKBENCH (ESTRATÉGICO) */}
      <AdminOperatorWorkbench
        eyebrow="Intelligence Flow"
        title="Enrutamiento de Contexto"
        description="Detecta los hilos donde la IA ha calificado al lead. Tu objetivo es el handoff fluido: de la respuesta automática al servicio de guante blanco."
        actions={[
          { href: '/admin/tickets', label: 'Support Queue', tone: 'primary' },
          { href: '/admin/ai/lab', label: 'Calibrar Bot' },
        ]}
        signals={signals}
      />

      {/* 03. FILTROS DE BÓVEDA */}
      <section className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-end justify-between mb-10 pb-8 border-b border-[var(--color-border)]">
          <div className="grid gap-6 sm:grid-cols-2 w-full lg:w-3/5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1">Capa de Búsqueda</label>
              <div className="relative">
                 <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30" />
                 <select
                   value={scope}
                   onChange={(e) => { setScope(e.target.value as any); setPage(1); }}
                   className="w-full h-14 pl-12 pr-6 rounded-2xl border border-[var(--color-border)] bg-white text-sm font-bold text-brand-blue outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-blue/5 transition-all"
                 >
                   <option value="meta">Identidad (Email / WhatsApp)</option>
                   <option value="content">Contexto (Contenido del Chat)</option>
                 </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1">Palabra Clave / ID</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                <input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                  placeholder={scope === 'content' ? 'ej: precios, reserva...' : 'ej: viajero@kce.travel'}
                  className="w-full h-14 pl-12 rounded-2xl border border-[var(--color-border)] bg-white text-sm font-light text-brand-dark outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <Button variant="ghost" onClick={() => { setQ(''); setScope('meta'); setPage(1); }} className="rounded-xl uppercase text-[10px] tracking-widest font-bold">
               Reset
             </Button>
             <div className="h-14 px-8 flex items-center justify-center rounded-2xl bg-brand-dark text-brand-yellow text-xs font-bold uppercase tracking-widest shadow-xl">
               {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : `${data?.total ?? 0} Hilos Found`}
             </div>
          </div>
        </div>

        {error && (
          <div className="mb-10 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 flex items-center gap-4 text-rose-700 animate-in zoom-in-95">
            <ShieldCheck className="h-6 w-6 opacity-40" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* 04. TABLA DE COMUNICACIONES */}
        <div className="overflow-x-auto rounded-[2.5rem] border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40">
                <th className="px-8 py-6">Estado & Canal</th>
                <th className="px-8 py-6">Entidad Viajera</th>
                <th className="px-8 py-6">Último Pulso de Mensajería</th>
                <th className="px-8 py-6 text-right">Mando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr><td colSpan={4} className="px-8 py-24 text-center animate-pulse text-xs font-bold uppercase tracking-widest text-[var(--color-text)]/20">Interrogando al servidor...</td></tr>
              ) : conversationItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-32 text-center">
                    <MessageSquare className="mx-auto h-12 w-12 text-brand-blue/10 mb-6" />
                    <p className="text-lg font-light text-[var(--color-text)]/30 italic">No hay hilos en la ventana actual.</p>
                  </td>
                </tr>
              ) : (
                conversationItems.map((c) => {
                  const lead = c.leads?.email || c.leads?.whatsapp || 'Anónimo';
                  const cust = c.customers?.email || c.customers?.name || c.customers?.phone || 'Prospecto sin registro';
                  const isBot = c.last_message?.role === 'assistant' || c.last_message?.role === 'bot';
                  
                  return (
                    <tr key={c.id} className="group transition-all hover:bg-brand-blue/[0.01]">
                      <td className="px-8 py-6 align-top">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={badgeStatus(c.status)}>{c.status || 'active'}</span>
                          <span className="text-[10px] font-mono text-[var(--color-text)]/20 uppercase">#{c.id.slice(0,8)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-lg bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center text-brand-blue">
                              {c.channel === 'whatsapp' ? <Zap className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                           </div>
                           <div>
                             <div className="text-[10px] font-bold uppercase tracking-widest text-brand-dark">{c.channel}</div>
                             <div className="text-[9px] font-mono text-[var(--color-text)]/40 uppercase">{c.locale || 'ES-CO'}</div>
                           </div>
                        </div>
                      </td>

                      <td className="px-8 py-6 align-top">
                        <div className="font-heading text-lg text-brand-blue group-hover:text-brand-yellow transition-colors line-clamp-1">{cust}</div>
                        <div className="mt-1 text-[10px] font-medium text-[var(--color-text)]/40 flex items-center gap-1.5">
                           <User className="h-3 w-3" /> {lead}
                        </div>
                      </td>

                      <td className="px-8 py-6 align-top">
                        {c.last_message ? (
                          <div className={`rounded-2xl p-5 border shadow-inner transition-all group-hover:shadow-md ${
                            isBot ? 'bg-brand-blue/[0.03] border-brand-blue/10' : 'bg-[var(--color-surface-2)] border-[var(--color-border)]'
                          }`}>
                            <header className="flex items-center justify-between mb-3 border-b border-black/[0.03] pb-2">
                               <div className="flex items-center gap-2">
                                  {isBot ? <Bot className="h-3.5 w-3.5 text-brand-blue" /> : <User className="h-3.5 w-3.5 text-[var(--color-text)]/40" />}
                                  <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isBot ? 'text-brand-blue' : 'text-[var(--color-text)]/60'}`}>
                                    {isBot ? 'KCE Bot Inferencia' : 'Respuesta Viajero'}
                                  </span>
                               </div>
                               <span className="text-[9px] font-mono text-[var(--color-text)]/30">{fmtDT(c.last_message.created_at)}</span>
                            </header>
                            <p className="text-sm font-light text-brand-dark line-clamp-2 leading-relaxed italic">
                              &quot;{c.last_message.content}&quot;
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs italic text-[var(--color-text)]/20 py-4">
                             <Clock className="h-4 w-4" /> Sin actividad reciente.
                          </div>
                        )}
                      </td>

                      <td className="px-8 py-6 align-top text-right">
                        <Button asChild size="sm" className="rounded-xl bg-brand-dark text-brand-yellow shadow-lg hover:scale-105 transition-transform">
                          <Link href={`/admin/conversations/${encodeURIComponent(c.id)}`}>
                            Abrir Consola <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                        <div className="mt-3 text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/20">
                           Ver Historial Completo
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 05. PAGINACIÓN PREMIUM */}
        {data?.total != null && data.total > limit && (
          <footer className="mt-10 flex items-center justify-between border-t border-[var(--color-border)] pt-8">
            <Button 
              variant="outline" 
              disabled={!hasPrev || loading} 
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="rounded-full px-8"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
            
            <div className="flex items-center gap-4">
               <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text)]/30">
                 Nodo de Datos: {page} <span className="opacity-30">/</span> {Math.ceil(data.total / limit)}
               </div>
            </div>

            <Button 
              variant="outline" 
              disabled={!hasNext || loading} 
              onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="rounded-full px-8"
            >
              Siguiente <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </footer>
        )}
      </section>

      {/* FOOTER DE INTEGRIDAD */}
      <footer className="pt-10 flex flex-wrap items-center justify-center gap-12 border-t border-[var(--color-border)] opacity-20 transition-opacity hover:opacity-50">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Data Sovereignty Active
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5" /> Intelligence Unit v2.4
        </div>
      </footer>

    </div>
  );
}