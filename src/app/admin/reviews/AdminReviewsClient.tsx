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
  return d.toLocaleString('es-CO', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function parseStatus(v: string): ReviewStatus {
  return v === 'approved' || v === 'rejected' ? v : 'pending';
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
        
        {/* Selector de Pestañas (Elegante) */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-[var(--color-border)] pb-6">
          <div className="flex gap-2 bg-[var(--color-surface-2)] p-1.5 rounded-full border border-[var(--color-border)]">
            <button onClick={() => { setStatus('pending'); setPage(1); }} className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${status === 'pending' ? 'bg-amber-500 text-white shadow-md scale-105' : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-black/5'}`}>
              <Clock className="h-4 w-4"/> Pendientes
            </button>
            <button onClick={() => { setStatus('approved'); setPage(1); }} className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${status === 'approved' ? 'bg-emerald-500 text-white shadow-md scale-105' : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-black/5'}`}>
              <CheckCircle2 className="h-4 w-4"/> Aprobadas
            </button>
            <button onClick={() => { setStatus('rejected'); setPage(1); }} className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${status === 'rejected' ? 'bg-rose-500 text-white shadow-md scale-105' : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-black/5'}`}>
              <XCircle className="h-4 w-4"/> Rechazadas
            </button>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">
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
              <p className="mt-1 text-sm text-[var(--color-text)]/40">No hay reseñas marcadas como {status}.</p>
            </div>
          ) : (
            items.map((r) => {
              const body = (r.body || r.comment || '').trim();
              return (
                <div key={r.id} className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 shadow-sm transition hover:shadow-md hover:border-brand-blue/30">
                  <div className="flex flex-col lg:flex-row gap-6">
                    
                    {/* Metadatos (Izquierda) */}
                    <div className="lg:w-1/3 shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] pb-4 lg:pb-0 lg:pr-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl text-brand-yellow tracking-widest">{stars(r.rating)}</span>
                      </div>
                      <div className="font-heading text-lg text-brand-blue">{r.customer_name || 'Anónimo'}</div>
                      <div className="text-xs text-[var(--color-text)]/50 mt-1">{r.customer_email}</div>
                      
                      <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-text)]/60 bg-[var(--color-surface)] px-3 py-2 rounded-xl border border-[var(--color-border)] w-max">
                        <MapPin className="h-3 w-3"/> {r.tour_slug || 'Tour General'}
                      </div>
                      <div className="mt-3 text-[10px] text-[var(--color-text)]/40">Recibida: {fmtDate(r.created_at)}</div>
                    </div>

                    {/* Contenido (Centro) */}
                    <div className="lg:w-full">
                      {r.title && <h4 className="font-heading text-xl text-[var(--color-text)] mb-2">"{r.title}"</h4>}
                      {body ? (
                        <p className="text-sm font-light text-[var(--color-text)]/80 leading-relaxed italic border-l-2 border-brand-blue/30 pl-4 py-1">
                          {body}
                        </p>
                      ) : (
                        <span className="text-xs text-[var(--color-text)]/30 italic">Sin comentario escrito.</span>
                      )}

                      {/* Medios y Fotos */}
                      {(r.avatar_url || (r.media_urls && r.media_urls.length > 0)) && (
                        <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-3">
                            <ImageIcon className="h-3 w-3"/> Material Adjunto 
                            {r.face_consent !== null && (
                              <span className={`ml-2 px-2 py-0.5 rounded-full border ${r.face_consent ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : 'bg-rose-500/10 border-rose-500/20 text-rose-700'}`}>
                                Permiso uso imagen: {r.face_consent ? 'SÍ' : 'NO'}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-3">
                            {r.avatar_url && (
                              <a href={r.avatar_url} target="_blank" rel="noreferrer" className="h-12 w-12 rounded-full border-2 border-[var(--color-border)] overflow-hidden hover:scale-105 transition-transform" title="Ver Avatar">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={r.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                              </a>
                            )}
                            {r.media_urls?.map((url, idx) => (
                              <a key={idx} href={url} target="_blank" rel="noreferrer" className="h-12 w-16 rounded-xl border-2 border-[var(--color-border)] overflow-hidden hover:scale-105 transition-transform" title="Ver Foto">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Foto ${idx+1}`} className="h-full w-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Acciones (Derecha) */}
                    {status === 'pending' && (
                      <div className="lg:w-48 shrink-0 flex flex-row lg:flex-col justify-end lg:justify-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[var(--color-border)] lg:pl-6">
                        <button disabled={busy} onClick={() => void action(r.id, 'approve')} className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-600 disabled:opacity-50 shadow-sm">
                          {actionId === r.id ? '...' : <><CheckCircle2 className="h-4 w-4"/> Aprobar</>}
                        </button>
                        <button disabled={busy} onClick={() => void action(r.id, 'reject')} className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-50 px-4 py-3 text-xs font-bold uppercase tracking-widest text-rose-600 transition hover:bg-rose-100 disabled:opacity-50">
                          {actionId === r.id ? '...' : <><XCircle className="h-4 w-4"/> Rechazar</>}
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Paginación */}
        {pages && pages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-[var(--color-border)] pt-6">
            <button disabled={page <= 1 || busy} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest disabled:opacity-30 transition hover:bg-[var(--color-surface)]">
              ← Anterior
            </button>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
              Página {page} de {pages}
            </div>
            <button disabled={page >= pages || busy} onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest disabled:opacity-30 transition hover:bg-[var(--color-surface)]">
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}