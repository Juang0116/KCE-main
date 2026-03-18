'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  Star, CheckCircle2, XCircle, Clock, 
  Image as ImageIcon, MapPin, ShieldCheck, 
  MessageSquare, User, Mail, Camera, 
  ChevronLeft, ChevronRight, ShieldAlert,
  RefreshCw // ✅ Importación corregida
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
type ApiResp = { items: Review[]; page: number; limit: number; total: number | null; error?: string; };

function stars(n: number) {
  const v = Math.max(0, Math.min(5, Math.round(Number.isFinite(n) ? n : 0)));
  return '★'.repeat(v) + '☆'.repeat(5 - v);
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

  useEffect(() => { load(); }, [load]);

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
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER DE REPUTACIÓN */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10 px-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <MessageSquare className="h-3.5 w-3.5" /> Social Proof Lane: /reputation-vault
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            Gestión de <span className="text-brand-yellow italic font-light">Feedback</span>
          </h1>
          <p className="mt-4 text-base text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Unidad de curación de reputación. Modera testimonios y asegura que la voz del viajero 
            potencie la confianza en KCE.
          </p>
        </div>
      </header>

      <AdminOperatorWorkbench 
        eyebrow="Trust Engine"
        title="Curación de Testimonios Reales"
        description="Asegúrate de que las reseñas aprobadas cumplen las políticas de marca. Prioriza aquellas con material multimedia adjunto."
        actions={[
          { href: '/admin/catalog', label: 'Ver Tours', tone: 'primary' },
          { href: '/admin/bookings', label: 'Verificar Reserva' }
        ]}
        signals={[
          { label: 'Volumen Nodo', value: String(total ?? items.length), note: `Feedback en estado ${status}.` },
          { label: 'Filtro Activo', value: status.toUpperCase(), note: 'Selector de flujo activo.' }
        ]}
      />

      <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl overflow-hidden relative">
        
        {/* TABS DE ESTADO */}
        <div className="p-8 border-b border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex p-1.5 rounded-[2rem] bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-inner w-full sm:w-max">
            {[
              { id: 'pending', l: 'Pendientes', c: 'bg-amber-500', i: Clock },
              { id: 'approved', l: 'Aprobadas', c: 'bg-emerald-500', i: CheckCircle2 },
              { id: 'rejected', l: 'Rechazadas', c: 'bg-rose-500', i: XCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setStatus(tab.id as ReviewStatus); setPage(1); }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-3 h-12 px-8 rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest transition-all ${
                  status === tab.id 
                    ? `${tab.c} text-white shadow-lg scale-105` 
                    : 'text-[var(--color-text)]/40 hover:bg-white hover:text-brand-blue'
                }`}
              >
                <tab.i className="h-4 w-4" /> {tab.l}
              </button>
            ))}
          </div>
          <div className="px-6 py-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 text-[9px] font-mono font-bold text-brand-blue uppercase tracking-widest">
            Audit Node: {total ?? 0} Records
          </div>
        </div>

        {err && (
          <div className="mx-8 mt-8 p-6 rounded-[2rem] border border-rose-500/20 bg-rose-500/5 text-rose-700 flex items-center gap-4 animate-in zoom-in-95">
             <ShieldAlert className="h-6 w-6 opacity-40" />
             <p className="text-sm font-medium">{err}</p>
          </div>
        )}

        {/* LISTADO DINÁMICO */}
        <div className="p-8 space-y-8">
          {loading ? (
            <div className="py-32 text-center">
              <RefreshCw className="h-12 w-12 text-brand-blue/10 mx-auto animate-spin mb-6" />
              <p className="text-sm font-light text-[var(--color-text)]/40 italic">Sincronizando base de reputación...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-32 text-center opacity-30">
               <Star className="h-16 w-16 mx-auto mb-6" />
               <p className="text-xl font-heading uppercase tracking-tighter">Bandeja Vacía</p>
               <p className="text-sm font-light italic">No se han detectado señales en el canal de {status}.</p>
            </div>
          ) : (
            items.map((r) => ( // ✅ Sintaxis de mapeo corregida
              <article key={r.id} className="group relative rounded-[2.5rem] border border-[var(--color-border)] bg-white p-8 transition-all hover:shadow-2xl hover:border-brand-blue/20 overflow-hidden">
                <div className={`absolute left-0 top-0 h-full w-1.5 ${status === 'pending' ? 'bg-amber-500' : status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'} opacity-20 group-hover:opacity-100 transition-opacity`} />
                
                <div className="flex flex-col lg:flex-row gap-10">
                  <aside className="lg:w-[320px] shrink-0 space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-[1.5rem] bg-brand-blue/5 border border-brand-blue/10 overflow-hidden shadow-inner flex items-center justify-center">
                        {r.avatar_url ? (
                          <img src={r.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : <User className="h-6 w-6 text-brand-blue/20" />}
                      </div>
                      <div className="space-y-1">
                        <p className="font-heading text-xl text-brand-dark truncate max-w-[180px]">{r.customer_name || 'Anonymous'}</p>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-brand-blue/50">
                           <Mail className="h-3 w-3" /> {r.customer_email?.slice(0, 18) || 'No_Email'}...
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                       <div className="text-2xl text-brand-yellow drop-shadow-sm tracking-widest">{stars(r.rating)}</div>
                       <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] w-max">
                          <MapPin className="h-3.5 w-3.5 text-brand-blue" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-dark">{r.tour_slug || 'General_Tour'}</span>
                       </div>
                       <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/30 flex items-center gap-2">
                          <Clock className="h-3 w-3" /> Ingesta: {fmtDate(r.created_at)}
                       </div>
                    </div>
                  </aside>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {r.title && <h3 className="font-heading text-3xl text-brand-dark mb-6 tracking-tighter">"{r.title}"</h3>}
                      <p className="text-base font-light leading-relaxed text-[var(--color-text)]/80 italic border-l-4 border-brand-blue/10 pl-6 py-2">
                         {(r.body || r.comment || 'Feedback sin cuerpo de texto.').trim()}
                      </p>

                      {r.media_urls && r.media_urls.length > 0 && (
                        <div className="mt-10 space-y-6 pt-8 border-t border-black/[0.03]">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/30">
                                 <Camera className="h-4 w-4" /> Multimedia Node
                              </div>
                              {r.face_consent !== null && (
                                <div className={`px-4 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-widest ${r.face_consent ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/5 border-rose-500/20 text-rose-600'}`}>
                                   Face Consent: {r.face_consent ? 'GRANTED' : 'DENIED'}
                                </div>
                              )}
                           </div>
                           <div className="flex flex-wrap gap-4">
                              {r.media_urls.map((url, idx) => (
                                <a key={idx} href={url} target="_blank" rel="noreferrer" className="relative h-24 w-32 rounded-[1.5rem] border-2 border-white shadow-md overflow-hidden hover:scale-105 transition-transform">
                                   <img src={url} alt="" className="h-full w-full object-cover" />
                                </a>
                              ))}
                           </div>
                        </div>
                      )}
                    </div>

                    {status === 'pending' && (
                      <div className="mt-12 flex flex-col sm:flex-row justify-end gap-4 border-t border-black/[0.03] pt-8">
                        <Button onClick={() => handleAction(r.id, 'reject')} disabled={busy} variant="outline" className="h-14 px-8 rounded-2xl border-rose-500/10 text-rose-600 font-bold uppercase tracking-widest text-[10px]">
                          {actionId === r.id ? 'Wait...' : <><XCircle className="mr-2 h-4 w-4"/> Rechazar</>}
                        </Button>
                        <Button onClick={() => handleAction(r.id, 'approve')} disabled={busy} variant="primary" className="h-14 px-10 rounded-2xl bg-emerald-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-xl">
                          {actionId === r.id ? 'Wait...' : <><CheckCircle2 className="mr-2 h-4 w-4"/> Aprobar</>}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* PAGINACIÓN */}
        {pages > 1 && (
          <footer className="p-8 border-t border-[var(--color-border)] flex items-center justify-between">
            <Button disabled={page <= 1 || busy} onClick={() => setPage(p => Math.max(1, p - 1))} variant="outline" className="h-10 px-6 rounded-xl text-[9px] font-bold uppercase tracking-widest">
              <ChevronLeft className="mr-2 h-3.5 w-3.5" /> Anterior
            </Button>
            <div className="text-[10px] font-mono font-bold text-brand-blue/40 uppercase tracking-[0.3em]">
              Window: {page} / {pages}
            </div>
            <Button disabled={page >= pages || busy} onClick={() => setPage(p => p + 1)} variant="outline" className="h-10 px-6 rounded-xl text-[9px] font-bold uppercase tracking-widest">
              Siguiente <ChevronRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </footer>
        )}
      </section>

      <footer className="mt-12 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Trust Verification
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ImageIcon className="h-3.5 w-3.5" /> Media Integrity v2.1
        </div>
      </footer>
    </div>
  );
}