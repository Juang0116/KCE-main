'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  Star, CheckCircle2, XCircle, Clock, 
  Image as ImageIcon, MapPin, ShieldCheck, 
  MessageSquare, User, Mail, Camera, 
  ChevronLeft, ChevronRight, ShieldAlert,
  RefreshCw, Hash, Eye, Trash2, 
  FileCheck, UserCheck, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE REPUTACIÓN ---
type ReviewStatus = 'pending' | 'approved' | 'rejected';
type Review = {
  id: string; tour_slug: string | null; rating: number; title: string | null;
  body: string | null; comment: string | null; customer_name: string | null;
  customer_email: string | null; avatar_url: string | null; media_urls: string[] | null;
  face_consent: boolean | null; status: ReviewStatus | string | null; created_at: string | null;
};

// --- HELPERS ---
function stars(n: number) {
  const v = Math.max(0, Math.min(5, Math.round(Number.isFinite(n) ? n : 0)));
  return (
    <div className="flex gap-1 text-brand-yellow drop-shadow-[0_2px_4px_rgba(251,191,36,0.2)]">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < v ? 'fill-current' : 'opacity-20'}`} />
      ))}
    </div>
  );
}

function fmtDate(iso: string | null) {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function AdminReviewsClient() {
  const [status, setStatus] = useState<ReviewStatus>('pending');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [items, setItems] = useState<Review[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const resp = await fetch(`/api/admin/reviews?status=${status}&page=${page}&limit=${limit}`, { cache: 'no-store' });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Err_Review_Node');
      setItems(json.items || []);
      setTotal(json.total);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }, [status, page, limit]);

  useEffect(() => { void load(); }, [load]);

  async function handleAction(id: string, kind: 'approve' | 'reject') {
    setActionId(id); setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/reviews/${id}/${kind}`, { method: 'POST' });
      if (!resp.ok) throw new Error('Action_Denied');
      if (status === 'pending') {
        setItems(prev => prev.filter(x => x.id !== id));
        setTotal(t => (t !== null ? t - 1 : t));
      } else { await load(); }
    } catch (e: any) { setErr(e.message); } finally { setActionId(null); }
  }

  const pages = useMemo(() => (total ? Math.ceil(total / limit) : 1), [total, limit]);
  const busy = loading || actionId != null;

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA TÁCTICA */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <MessageSquare className="h-4 w-4" /> Social Proof Lane: /reputation-vault-node
          </div>
          <h1 className="font-heading text-4xl md:text-7xl text-main tracking-tighter leading-none">
            Gestión de <span className="text-brand-yellow italic font-light">Feedback</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed mt-2 italic">
            Unidad de curación de reputación para Knowing Cultures S.A.S. Modera testimonios y asegura que la voz del viajero potencie la confianza del mercado.
          </p>
        </div>
        <div className="flex gap-4">
           <Button onClick={() => void load()} disabled={busy} variant="outline" className="rounded-full h-12 px-8 border-brand-dark/10 shadow-sm font-bold uppercase tracking-widest text-[10px] hover:bg-surface-2 transition-all">
             <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin text-brand-blue' : ''}`} /> Sincronizar Feed
           </Button>
        </div>
      </header>

      {/* 02. WORKBENCH OPERATIVO */}
      <AdminOperatorWorkbench 
        eyebrow="Trust Engine"
        title="Curación de Social Proof"
        description="Asegúrate de que las reseñas aprobadas cumplen las políticas estéticas y éticas de marca. Prioriza aquellas con material multimedia de alta resolución."
        actions={[
          { href: '/admin/catalog', label: 'Ver Catálogo', tone: 'primary' },
          { href: '/admin/bookings', label: 'Validar Reservas' }
        ]}
        signals={[
          { label: 'Volumen Nodo', value: String(total ?? items.length), note: `Registros en estado ${status}.` },
          { label: 'Signal Status', value: status.toUpperCase(), note: 'Filtro de moderación activo.' }
        ]}
      />

      {/* 03. LA BÓVEDA DE REPUTACIÓN */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden relative flex flex-col">
        
        {/* TABS DE MODERACIÓN */}
        <div className="p-8 border-b border-brand-dark/5 dark:border-white/5 bg-surface-2/30 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex p-1.5 rounded-[2rem] bg-surface border border-brand-dark/10 shadow-inner w-full lg:w-max">
            {[
              { id: 'pending', l: 'Pendientes', c: 'bg-brand-yellow text-brand-dark', i: Clock },
              { id: 'approved', l: 'Aprobadas', c: 'bg-green-600 text-white', i: CheckCircle2 },
              { id: 'rejected', l: 'Rechazadas', c: 'bg-red-600 text-white', i: XCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setStatus(tab.id as ReviewStatus); setPage(1); }}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-3 h-12 px-8 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
                  status === tab.id 
                    ? `${tab.c} shadow-pop scale-105 ring-4 ring-white/10` 
                    : 'text-muted hover:bg-surface-2 hover:text-main'
                }`}
              >
                <tab.i className="h-4 w-4" /> {tab.l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
             <div className="px-6 py-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 text-[10px] font-mono font-bold text-brand-blue uppercase tracking-[0.2em] shadow-sm">
                Total_Records: {total ?? 0}
             </div>
          </div>
        </div>

        {err && (
          <div className="mx-8 mt-8 p-6 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 dark:bg-red-950/10 text-red-700 dark:text-red-400 flex items-center gap-5 shadow-sm font-bold animate-in slide-in-from-top-2">
             <ShieldAlert className="h-6 w-6 opacity-60" />
             <p className="text-sm">Falla de Enlace Forense: <span className="font-light">{err}</span></p>
          </div>
        )}

        {/* LISTADO DE RESEÑAS */}
        <div className="p-10 space-y-12">
          {loading && items.length === 0 ? (
            <div className="py-48 flex flex-col items-center justify-center gap-6 animate-pulse">
               <RefreshCw className="h-16 w-16 text-brand-blue opacity-10 animate-spin" />
               <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted">Retrieving Reputation Data...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-48 text-center flex flex-col items-center justify-center gap-6 opacity-20 group">
               <Star className="h-24 w-24 text-brand-blue group-hover:scale-110 transition-transform duration-700" />
               <div className="space-y-1">
                  <p className="text-2xl font-heading uppercase tracking-tighter text-main">Bandeja Vacía</p>
                  <p className="text-sm font-light italic">No se han detectado señales en el canal de {status}.</p>
               </div>
            </div>
          ) : (
            <div className="grid gap-10">
              {items.map((r) => (
                <article key={r.id} className="group relative rounded-[3rem] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 md:p-14 shadow-soft hover:shadow-pop transition-all hover:border-brand-blue/20 overflow-hidden flex flex-col lg:flex-row gap-12">
                  
                  {/* Status Indicator Bar */}
                  <div className={`absolute left-0 top-0 h-full w-2 ${status === 'pending' ? 'bg-brand-yellow' : status === 'approved' ? 'bg-green-500' : 'bg-red-500'} opacity-10 group-hover:opacity-100 transition-opacity`} />
                  
                  {/* ASIDE: Identidad del Cliente */}
                  <aside className="lg:w-[350px] shrink-0 space-y-10">
                    <div className="flex items-center gap-5">
                      <div className="h-20 w-20 rounded-[2rem] bg-surface-2 border border-brand-dark/5 overflow-hidden shadow-inner flex items-center justify-center group-hover:rotate-3 transition-transform">
                        {r.avatar_url ? (
                          <img src={r.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 opacity-20">
                             <User className="h-8 w-8" />
                             <span className="text-[8px] font-black uppercase tracking-tighter">No_Ava</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="font-heading text-2xl text-main truncate tracking-tighter">{r.customer_name || 'Anonymous_Node'}</p>
                        <div className="flex items-center gap-3 px-3 py-1 rounded-lg bg-surface-2 border border-brand-dark/5 w-fit">
                           <Mail className="h-3 w-3 text-brand-blue opacity-40" /> 
                           <span className="text-[10px] font-mono font-bold text-muted truncate max-w-[150px]">{r.customer_email || 'SECURE_HIDDEN'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                       <div className="p-6 rounded-[2rem] bg-surface-2/50 border border-brand-dark/5 shadow-inner">
                          <div className="flex flex-col gap-4">
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-40">Experiencia</span>
                                {stars(r.rating)}
                             </div>
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                                   <MapPin className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-bold text-main uppercase tracking-tight">{r.tour_slug || 'GENERAL_EXPERIENCE'}</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-3 px-6 py-3 rounded-full border border-brand-dark/5 bg-surface text-[10px] font-mono text-muted/50 uppercase tracking-widest group-hover:text-main transition-colors">
                          <Clock className="h-3.5 w-3.5 opacity-40" /> Ingesta: {fmtDate(r.created_at)}
                       </div>
                    </div>
                  </aside>

                  {/* MAIN: Contenido del Testimonio */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-8">
                      {r.title && <h3 className="font-heading text-4xl text-main tracking-tighter leading-none">&quot;{r.title}&quot;</h3>}
                      
                      <div className="relative">
                         <div className="absolute -left-6 top-0 h-full w-1 bg-brand-blue/10 rounded-full" />
                         <p className="text-lg font-light leading-relaxed text-main/80 italic pl-4">
                           {(r.body || r.comment || 'Technical Note: Feedback sin cuerpo de texto enviado por el viajero.').trim()}
                         </p>
                      </div>

                      {/* Multimedia Node */}
                      {r.media_urls && r.media_urls.length > 0 && (
                        <div className="mt-12 space-y-8 pt-10 border-t border-brand-dark/5">
                           <header className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">
                                 <Camera className="h-4 w-4" /> Multimedia Dispatch
                              </div>
                              {r.face_consent !== null && (
                                <div className={`px-5 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-2 ${r.face_consent ? 'bg-green-500/5 border-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-500/5 border-red-500/20 text-red-600'}`}>
                                   <UserCheck className="h-3 w-3" /> Face Consent: {r.face_consent ? 'GRANTED' : 'DENIED'}
                                </div>
                              )}
                           </header>
                           <div className="flex flex-wrap gap-5">
                              {r.media_urls.map((url, idx) => (
                                <a key={idx} href={url} target="_blank" rel="noreferrer" className="relative h-32 w-44 rounded-[2rem] border-4 border-white dark:border-brand-dark shadow-soft overflow-hidden hover:scale-110 hover:shadow-pop transition-all group/img">
                                   <img src={url} alt="" className="h-full w-full object-cover" />
                                   <div className="absolute inset-0 bg-brand-blue/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                      <Eye className="text-white h-6 w-6" />
                                   </div>
                                </a>
                              ))}
                           </div>
                        </div>
                      )}
                    </div>

                    {/* MANDO DE MODERACIÓN */}
                    {status === 'pending' && (
                      <footer className="mt-16 flex flex-col sm:flex-row justify-end gap-5 border-t border-brand-dark/5 dark:border-white/5 pt-10">
                        <Button 
                          onClick={() => void handleAction(r.id, 'reject')} 
                          disabled={busy} 
                          className="h-16 px-10 rounded-[1.8rem] border-2 border-red-500/10 bg-surface text-red-600 font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95 flex items-center justify-center"
                        >
                          {actionId === r.id ? <RefreshCw className="h-5 w-5 animate-spin" /> : <><Trash2 className="mr-3 h-4 w-4"/> Rechazar Entrada</>}
                        </Button>
                        <Button 
                          onClick={() => void handleAction(r.id, 'approve')} 
                          disabled={busy} 
                          className="h-16 px-12 rounded-[1.8rem] bg-green-600 text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-pop hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center"
                        >
                          {actionId === r.id ? <RefreshCw className="h-5 w-5 animate-spin" /> : <><FileCheck className="mr-3 h-5 w-5"/> Aprobar Testimonio</>}
                        </Button>
                      </footer>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* PAGINACIÓN FORENSE */}
        {pages > 1 && (
          <footer className="p-10 border-t border-brand-dark/5 dark:border-white/5 bg-surface-2/30 flex items-center justify-between">
            <Button disabled={page <= 1 || busy} onClick={() => setPage(p => Math.max(1, p - 1))} variant="outline" className="h-12 px-8 rounded-xl border-brand-dark/10 bg-surface shadow-sm font-bold uppercase tracking-widest text-[10px] hover:bg-surface-2 transition-all">
              <ChevronLeft className="mr-3 h-4 w-4" /> Anterior
            </Button>
            <div className="flex items-center gap-4">
               <div className="h-px w-12 bg-brand-dark/10" />
               <div className="text-[11px] font-mono font-black text-brand-blue uppercase tracking-[0.4em]">
                 Page: {page} <span className="opacity-20">/</span> {pages}
               </div>
               <div className="h-px w-12 bg-brand-dark/10" />
            </div>
            <Button disabled={page >= pages || busy} onClick={() => setPage(p => p + 1)} variant="outline" className="h-12 px-8 rounded-xl border-brand-dark/10 bg-surface shadow-sm font-bold uppercase tracking-widest text-[10px] hover:bg-surface-2 transition-all">
              Siguiente <ChevronRight className="ml-3 h-4 w-4" />
            </Button>
          </footer>
        )}
      </section>

      {/* FOOTER DE INTEGRIDAD CORPORATIVA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Trust Verification Active
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ImageIcon className="h-4 w-4 opacity-50" /> Media Integrity v2.1
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <UserCheck className="h-4 w-4 animate-pulse" /> Verified Testimonial Node
        </div>
      </footer>

    </div>
  );
}