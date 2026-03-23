'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { 
  Search, Clock, RefreshCw, 
  MessageSquare, ArrowRight, Filter,
  ShieldCheck, Bot, User, Globe, ChevronLeft, 
  ChevronRight, Sparkles, Zap, Terminal, Hash
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
  if (s === 'active') return `${base} border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400`;
  if (s === 'closed') return `${base} border-brand-dark/10 dark:border-white/10 bg-surface-2 text-muted`;
  if (s === 'bot') return `${base} border-brand-blue/20 bg-brand-blue/5 text-brand-blue`;
  return `${base} border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-brand-yellow`;
}

export default function AdminConversationsClient() {
  const [q, setQ] = useState('');
  const [scope, setScope] = useState<'meta' | 'content'>('meta');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    { label: 'Hilos en Radar', value: data?.total != null ? String(data.total) : '0', note: 'Sesiones totales.' },
    { label: 'Acción Humana', value: String(conversationItems.filter(i => i.status !== 'closed').length), note: 'Requieren supervisión.' },
    { label: 'Omnicanal', value: String(new Set(conversationItems.map(i => i.channel)).size), note: 'Canales activos.' },
  ], [conversationItems, data?.total]);

  return (
    <div className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA DE OPERACIONES */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Zap className="h-3.5 w-3.5" /> Communication Hub
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tighter">
            Bandeja de <span className="text-brand-yellow italic font-light">Mensajes</span>
          </h1>
          <p className="mt-3 text-base text-muted font-light max-w-2xl leading-relaxed">
            Supervisión táctica del flujo conversacional. Intervén en los hilos de alta temperatura para cerrar acuerdos premium de Knowing Cultures.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-full shadow-sm hover:bg-surface-2 h-12 px-8 border-brand-dark/10 text-[10px] font-bold uppercase tracking-widest transition-all" onClick={() => void fetchData()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
          </Button>
        </div>
      </header>

      {/* 02. WORKBENCH (ESTRATÉGICO) */}
      <AdminOperatorWorkbench
        eyebrow="Intelligence Flow"
        title="Enrutamiento de Contexto"
        description="Detecta los hilos calificados por el núcleo de IA. Tu objetivo es el handoff fluido: de la respuesta automática al servicio de guante blanco."
        actions={[
          { href: '/admin/tickets', label: 'Ver Incidencias', tone: 'primary' },
          { href: '/admin/ai/lab', label: 'Calibrar Agentes' },
        ]}
        signals={signals}
      />

      {/* 03. FILTROS DE BÓVEDA */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-pop relative overflow-hidden flex flex-col">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-end justify-between mb-10 pb-8 border-b border-brand-dark/5 dark:border-white/5">
          <div className="grid gap-6 sm:grid-cols-2 w-full lg:w-3/5">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Capa de Búsqueda</label>
              <div className="relative">
                 <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40" />
                 <select
                   value={scope}
                   onChange={(e) => { setScope(e.target.value as any); setPage(1); }}
                   className="w-full h-14 pl-12 pr-6 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-sm font-bold text-main outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner"
                 >
                   <option value="meta">Identidad (Email / WhatsApp)</option>
                   <option value="content">Contexto (Contenido del Chat)</option>
                 </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Palabra Clave / Nodo</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40 group-focus-within:opacity-100 transition-opacity" />
                <input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                  placeholder={scope === 'content' ? 'ej: precios, itinerario...' : 'ej: viajero@kce.travel'}
                  className="w-full h-14 pl-12 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-sm font-light text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner placeholder:text-muted/30"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <Button variant="ghost" onClick={() => { setQ(''); setScope('meta'); setPage(1); }} className="rounded-xl uppercase text-[10px] tracking-widest font-bold h-14 px-6 hover:bg-brand-blue/5">
               Reset Filtros
             </Button>
             <div className="h-14 px-8 flex items-center justify-center rounded-2xl bg-brand-dark text-brand-yellow text-xs font-bold uppercase tracking-widest shadow-pop">
               {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : `${data?.total ?? 0} Sesiones`}
             </div>
          </div>
        </div>

        {error && (
          <div className="mb-10 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 dark:bg-red-950/20 p-6 flex items-center gap-4 text-red-700 dark:text-red-400 animate-in slide-in-from-top-2 shadow-sm">
            <ShieldCheck className="h-6 w-6 shrink-0 opacity-40" />
            <p className="text-sm font-bold">Protocolo de Error: <span className="font-light">{error}</span></p>
          </div>
        )}

        {/* 04. TABLA DE COMUNICACIONES */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-surface-2/50 border-b border-brand-dark/5 dark:border-white/5">
              <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                <th className="px-8 py-6">Estatus & Canal</th>
                <th className="px-8 py-6">Identidad Viajera</th>
                <th className="px-8 py-6">Última Inferencia de Mensaje</th>
                <th className="px-8 py-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
              {loading && !conversationItems.length ? (
                <tr><td colSpan={4} className="px-8 py-32 text-center animate-pulse text-xs font-bold uppercase tracking-[0.4em] text-muted bg-surface">Sincronizando flujo de datos...</td></tr>
              ) : conversationItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-40 text-center bg-surface">
                    <MessageSquare className="mx-auto h-16 w-16 text-brand-blue opacity-10 mb-6" />
                    <p className="text-xl font-heading text-main tracking-tight opacity-30">Silencio en el Hub</p>
                    <p className="text-sm font-light text-muted mt-2 italic">No hay hilos de conversación que coincidan con la telemetría actual.</p>
                  </td>
                </tr>
              ) : (
                conversationItems.map((c) => {
                  const lead = c.leads?.email || c.leads?.whatsapp || 'Anónimo';
                  const cust = c.customers?.email || c.customers?.name || c.customers?.phone || 'Prospecto sin registro';
                  const isBot = c.last_message?.role === 'assistant' || c.last_message?.role === 'system';
                  
                  return (
                    <tr key={c.id} className="group transition-colors hover:bg-surface-2/50 cursor-default bg-surface">
                      <td className="px-8 py-8 align-top">
                        <div className="flex items-center gap-3 mb-4">
                          <span className={badgeStatus(c.status)}>{c.status || 'active'}</span>
                          <span className="text-[10px] font-mono text-muted opacity-40 uppercase flex items-center gap-1">
                             <Hash className="h-2.5 w-2.5" /> {c.id.slice(0,8)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-brand-blue/10 border border-brand-blue/5 flex items-center justify-center text-brand-blue shadow-inner">
                              {c.channel === 'whatsapp' ? <Zap className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                           </div>
                           <div>
                             <div className="text-[10px] font-bold uppercase tracking-widest text-main">{c.channel}</div>
                             <div className="text-[9px] font-mono text-muted uppercase opacity-60">{c.locale || 'ES-CO'}</div>
                           </div>
                        </div>
                      </td>

                      <td className="px-8 py-8 align-top">
                        <div className="font-heading text-xl text-main group-hover:text-brand-blue transition-colors line-clamp-1 tracking-tight">{cust}</div>
                        <div className="mt-2 text-[11px] font-medium text-muted flex items-center gap-2">
                           <User className="h-3.5 w-3.5 opacity-30" /> {lead}
                        </div>
                      </td>

                      <td className="px-8 py-8 align-top">
                        {c.last_message ? (
                          <div className={`rounded-2xl p-5 border shadow-soft transition-all group-hover:shadow-md max-w-md ${
                            isBot ? 'bg-brand-blue/[0.03] border-brand-blue/10' : 'bg-surface-2 border-brand-dark/5 dark:border-white/5'
                          }`}>
                            <header className="flex items-center justify-between mb-3 border-b border-brand-dark/5 dark:border-white/5 pb-2">
                               <div className="flex items-center gap-2">
                                  {isBot ? <Bot className="h-4 w-4 text-brand-blue" /> : <User className="h-4 w-4 text-muted" />}
                                  <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isBot ? 'text-brand-blue' : 'text-muted'}`}>
                                    {isBot ? 'Inferencia IA' : 'Respuesta Viajero'}
                                  </span>
                               </div>
                               <span className="text-[9px] font-mono text-muted opacity-40 uppercase tracking-tighter">{fmtDT(c.last_message.created_at)}</span>
                            </header>
                            <p className="text-sm font-light text-main line-clamp-2 leading-relaxed italic opacity-80">
                              &quot;{c.last_message.content}&quot;
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs italic text-muted opacity-40 py-6">
                             <Clock className="h-4 w-4" /> Sin actividad reciente registrada.
                          </div>
                        )}
                      </td>

                      <td className="px-8 py-8 align-top text-right">
                        <Button asChild className="rounded-xl bg-brand-dark text-brand-yellow hover:bg-brand-blue hover:text-white shadow-pop transition-all h-11 px-6 text-[10px] font-bold uppercase tracking-widest">
                          <Link href={`/admin/conversations/${encodeURIComponent(c.id)}`}>
                            Abrir Consola <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
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
          <footer className="mt-10 flex flex-col sm:flex-row items-center justify-between border-t border-brand-dark/5 dark:border-white/5 pt-8 gap-6">
            <Button 
              variant="outline" 
              disabled={!hasPrev || loading} 
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="rounded-full h-12 px-10 border-brand-dark/10 text-[10px] font-bold uppercase tracking-widest hover:bg-surface-2 transition-all"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
            
            <div className="flex items-center gap-4">
               <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-60">
                 Página <span className="text-main font-bold">{page}</span> de {Math.ceil(data.total / limit)}
               </div>
            </div>

            <Button 
              variant="outline" 
              disabled={!hasNext || loading} 
              onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="rounded-full h-12 px-10 border-brand-dark/10 text-[10px] font-bold uppercase tracking-widest hover:bg-surface-2 transition-all"
            >
              Siguiente <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </footer>
        )}
      </section>

      {/* 06. FOOTER DE INTEGRIDAD */}
      <footer className="pt-16 flex flex-col sm:flex-row items-center justify-center gap-10 border-t border-brand-dark/10 dark:border-white/10 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-blue" /> Data Sovereignty Active
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Terminal className="h-3.5 w-3.5" /> Intelligence Unit v2.4
        </div>
      </footer>

    </div>
  );
}