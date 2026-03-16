'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { useEffect, useMemo, useState } from 'react';
import { Star, CheckCircle2, XCircle, Clock, Image as ImageIcon, MapPin } from 'lucide-react';

type ReviewStatus = 'pending' | 'approved' | 'rejected';

type Review = {
  id: string;
  tour_slug: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  comment: string | null;
  customer_name: string | null;
  customer_email: string | null;
  avatar_url: string | null;
  media_urls: string[] | null;
  face_consent: boolean | null;
  status: ReviewStatus | string | null;
  created_at: string | null;
};

type ApiResp = {
  items: Review[];
  page: number;
  limit: number;
  total: number | null;
  requestId?: string;
  error?: string;
};

function stars(n: number) {
  const v = Math.max(0, Math.min(5, Math.round(Number.isFinite(n) ? n : 0)));
  return '★★★★★'.slice(0, v) + '☆☆☆☆☆'.slice(0, 5 - v);
}

function fmtDate(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function AdminReviewsClient() {
  const [status, setStatus] = useState<ReviewStatus>('pending');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [items, setItems] = useState<Review[]>([]);
  const [total, setTotal] = useState<number | null>(null);

  const [loadingList, setLoadingList] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const pages = useMemo(() => {
    if (total == null) return null;
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  async function load() {
    setLoadingList(true);
    setErr(null);
    try {
      const resp = await fetch(`/api/admin/reviews?status=${encodeURIComponent(status)}&page=${page}&limit=${limit}`, { cache: 'no-store' });
      const json = (await resp.json().catch(() => null)) as ApiResp | null;
      if (!resp.ok) throw new Error(json?.error || 'Error cargando reseñas');

      setItems(Array.isArray(json?.items) ? json!.items : []);
      setTotal(typeof json?.total === 'number' ? json.total : (json?.total ?? null));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoadingList(false);
    }
  }

  async function action(id: string, kind: 'approve' | 'reject') {
    setActionId(id);
    setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/reviews/${encodeURIComponent(id)}/${kind}`, { method: 'POST' });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.error || 'Error');

      if (status === 'pending') {
        setItems((prev) => prev.filter((x) => x.id !== id));
        setTotal((t) => (typeof t === 'number' ? Math.max(0, t - 1) : t));
      } else {
        await load();
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setActionId(null);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  const busy = loadingList || actionId != null;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Centro de Reseñas</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Modera y publica el feedback de los viajeros para construir prueba social.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench 
        eyebrow="Trust & Reputation"
        title="La prueba social es tu mejor vendedor"
        description="Asegúrate de que las reseñas aprobadas cumplen las políticas de KCE. Los testimonios reales con fotos aumentan la conversión del catálogo exponencialmente."
        actions={[
          { href: '/admin/catalog', label: 'Ver Catálogo', tone: 'primary' },
          { href: '/admin/bookings', label: 'Cruzar Reservas' }
        ]}
        signals={[
          { label: 'Volumen', value: String(total ?? items.length), note: `Reseñas en estado: ${status}.` },
          { label: 'Filtro Actual', value: status.toUpperCase(), note: 'Selecciona las pestañas abajo para cambiar de vista.' }
        ]}
      />

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-10 shadow-sm">
        
        {/* Selector de Pestañas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-[var(--color-border)] pb-6">
          <div className="flex flex-wrap gap-2 bg-[var(--color-surface-2)] p-1.5 rounded-2xl border border-[var(--color-border)]">
            <button onClick={() => { setStatus('pending'); setPage(1); }} className={`flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${status === 'pending' ? 'bg-amber-500 text-white shadow-md' : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-[var(--color-border)]'}`}>
              <Clock className="h-4 w-4"/> Pendientes
            </button>
            <button onClick={() => { setStatus('approved'); setPage(1); }} className={`flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${status === 'approved' ? 'bg-emerald-500 text-white shadow-md' : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-[var(--color-border)]'}`}>
              <CheckCircle2 className="h-4 w-4"/> Aprobadas
            </button>
            <button onClick={() => { setStatus('rejected'); setPage(1); }} className={`flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${status === 'rejected' ? 'bg-rose-500 text-white shadow-md' : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-[var(--color-border)]'}`}>
              <XCircle className="h-4 w-4"/> Rechazadas
            </button>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 bg-[var(--color-surface-2)] px-4 py-2 rounded-lg border border-[var(--color-border)] w-max mx-auto sm:mx-0">
            {total != null ? `${total} ENCONTRADAS` : 'BUSCANDO...'}
          </div>
        </div>

        {err && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{err}</div>}

        {/* Tarjetas de Reseñas */}
        <div className="space-y-6">
          {loadingList ? (
            <div className="py-16 text-center text-[var(--color-text)]/40 font-medium">Sincronizando base de reseñas...</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <Star className="mx-auto h-12 w-12 text-[var(--color-text)]/10 mb-4"/>
              <h3 className="font-heading text-xl text-[var(--color-text)]/70">Bandeja Limpia</h3>
              <p className="mt-1 text-sm text-[var(--color-text)]/40 font-light">No hay reseñas en la bandeja de '{status}'.</p>
            </div>
          ) : (
            items.map((r) => {
              const body = (r.body || r.comment || '').trim();
              return (
                <div key={r.id} className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 md:p-8 shadow-sm transition hover:shadow-md hover:border-brand-blue/30 group">
                  <div className="flex flex-col lg:flex-row gap-6">
                    
                    {/* Metadatos (Izquierda) */}
                    <div className="lg:w-[30%] shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] pb-6 lg:pb-0 lg:pr-8">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl text-brand-yellow tracking-widest drop-shadow-sm">{stars(r.rating)}</span>
                      </div>
                      <div className="font-heading text-xl text-brand-blue">{r.customer_name || 'Anónimo'}</div>
                      <div className="text-[10px] font-mono text-[var(--color-text)]/50 mt-1 uppercase tracking-widest truncate">{r.customer_email || 'Sin Email'}</div>
                      
                      <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/60 bg-[var(--color-surface)] px-3 py-2 rounded-xl border border-[var(--color-border)] w-max">
                        <MapPin className="h-3 w-3 text-brand-blue"/> {r.tour_slug || 'Tour General'}
                      </div>
                      <div className="mt-3 text-[10px] text-[var(--color-text)]/40 uppercase tracking-widest font-bold">Recibida: {fmtDate(r.created_at)}</div>
                    </div>

                    {/* Contenido (Centro) */}
                    <div className="lg:w-full flex flex-col justify-between">
                      <div>
                        {r.title && <h4 className="font-heading text-2xl text-[var(--color-text)] mb-3">"{r.title}"</h4>}
                        {body ? (
                          <p className="text-sm font-light text-[var(--color-text)]/80 leading-relaxed italic border-l-2 border-brand-blue/30 pl-4 py-1">
                            {body}
                          </p>
                        ) : (
                          <span className="text-xs text-[var(--color-text)]/30 italic font-light">El cliente dejó una calificación sin texto.</span>
                        )}

                        {/* Medios y Fotos */}
                        {(r.avatar_url || (r.media_urls && r.media_urls.length > 0)) && (
                          <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-4">
                              <ImageIcon className="h-4 w-4"/> Material Adjunto 
                              {r.face_consent !== null && (
                                <span className={`ml-3 px-2.5 py-1 rounded-lg border ${r.face_consent ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : 'bg-rose-500/10 border-rose-500/20 text-rose-700'}`}>
                                  Permiso uso imagen: {r.face_consent ? 'SÍ' : 'NO'}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-3">
                              {r.avatar_url && (
                                <a href={r.avatar_url} target="_blank" rel="noreferrer" className="h-16 w-16 rounded-full border-2 border-[var(--color-border)] overflow-hidden hover:scale-105 transition-transform shadow-sm" title="Ver Avatar">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={r.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                                </a>
                              )}
                              {r.media_urls?.map((url, idx) => (
                                <a key={idx} href={url} target="_blank" rel="noreferrer" className="h-16 w-24 rounded-xl border-2 border-[var(--color-border)] overflow-hidden hover:scale-105 transition-transform shadow-sm" title="Ver Foto">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={url} alt={`Foto ${idx+1}`} className="h-full w-full object-cover" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Acciones (Bottom) */}
                      {status === 'pending' && (
                        <div className="mt-8 pt-4 border-t border-[var(--color-border)] flex flex-col sm:flex-row justify-end gap-3">
                          <button disabled={busy} onClick={() => void action(r.id, 'reject')} className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-50 px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-rose-600 transition hover:bg-rose-100 disabled:opacity-50">
                            {actionId === r.id ? 'Procesando...' : <><XCircle className="h-4 w-4"/> Rechazar</>}
                          </button>
                          <button disabled={busy} onClick={() => void action(r.id, 'approve')} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-600 disabled:opacity-50 shadow-md">
                            {actionId === r.id ? 'Procesando...' : <><CheckCircle2 className="h-4 w-4"/> Aprobar y Publicar</>}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Paginación */}
        {pages && pages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-[var(--color-border)] pt-6">
            <button disabled={page <= 1 || busy} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-3 text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 transition hover:bg-[var(--color-surface)]">
              ← Anterior
            </button>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
              Página {page} de {pages}
            </div>
            <button disabled={page >= pages || busy} onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-3 text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 transition hover:bg-[var(--color-surface)]">
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}