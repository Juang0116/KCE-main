'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Image as ImageIcon,
  MapPin,
  ShieldCheck,
  MessageSquare,
  User,
  Mail,
  Camera,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  RefreshCw,
  Hash,
  Eye,
  Trash2,
  FileCheck,
  UserCheck,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE REPUTACIÓN ---
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

// --- HELPERS ---
function stars(n: number) {
  const v = Math.max(0, Math.min(5, Math.round(Number.isFinite(n) ? n : 0)));
  return (
    <div className="flex gap-1 text-brand-yellow drop-shadow-[0_2px_4px_rgba(251,191,36,0.2)]">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < v ? 'fill-current' : 'opacity-20'}`}
        />
      ))}
    </div>
  );
}

function fmtDate(iso: string | null) {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleString('es-CO', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
    setLoading(true);
    setErr(null);
    try {
      const resp = await fetch(`/api/admin/reviews?status=${status}&page=${page}&limit=${limit}`, {
        cache: 'no-store',
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Err_Review_Node');
      setItems(json.items || []);
      setTotal(json.total);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [status, page, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAction(id: string, kind: 'approve' | 'reject') {
    setActionId(id);
    setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/reviews/${id}/${kind}`, { method: 'POST' });
      if (!resp.ok) throw new Error('Action_Denied');
      if (status === 'pending') {
        setItems((prev) => prev.filter((x) => x.id !== id));
        setTotal((t) => (t !== null ? t - 1 : t));
      } else {
        await load();
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setActionId(null);
    }
  }

  const pages = useMemo(() => (total ? Math.ceil(total / limit) : 1), [total, limit]);
  const busy = loading || actionId != null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-32 duration-1000">
      {/* 01. CABECERA TÁCTICA */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 px-2 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <MessageSquare className="h-4 w-4" /> Social Proof Lane: /reputation-vault-node
          </div>
          <h1 className="font-heading text-4xl leading-none tracking-tighter text-main md:text-7xl">
            Gestión de <span className="font-light italic text-brand-yellow">Feedback</span>
          </h1>
          <p className="mt-2 max-w-2xl text-base font-light italic leading-relaxed text-muted">
            Unidad de curación de reputación para Knowing Cultures S.A.S. Modera testimonios y
            asegura que la voz del viajero potencie la confianza del mercado.
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => void load()}
            disabled={busy}
            variant="outline"
            className="h-12 rounded-full border-brand-dark/10 px-8 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-surface-2"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin text-brand-blue' : ''}`}
            />{' '}
            Sincronizar Feed
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
          { href: '/admin/bookings', label: 'Validar Reservas' },
        ]}
        signals={[
          {
            label: 'Volumen Nodo',
            value: String(total ?? items.length),
            note: `Registros en estado ${status}.`,
          },
          {
            label: 'Signal Status',
            value: status.toUpperCase(),
            note: 'Filtro de moderación activo.',
          },
        ]}
      />

      {/* 03. LA BÓVEDA DE REPUTACIÓN */}
      <section className="relative flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
        {/* TABS DE MODERACIÓN */}
        <div className="bg-surface-2/30 flex flex-col items-center justify-between gap-8 border-b border-brand-dark/5 p-8 dark:border-white/5 lg:flex-row">
          <div className="flex w-full rounded-[2rem] border border-brand-dark/10 bg-surface p-1.5 shadow-inner lg:w-max">
            {[
              { id: 'pending', l: 'Pendientes', c: 'bg-brand-yellow text-brand-dark', i: Clock },
              { id: 'approved', l: 'Aprobadas', c: 'bg-green-600 text-white', i: CheckCircle2 },
              { id: 'rejected', l: 'Rechazadas', c: 'bg-red-600 text-white', i: XCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatus(tab.id as ReviewStatus);
                  setPage(1);
                }}
                className={`flex h-12 flex-1 items-center justify-center gap-3 rounded-full px-8 text-[10px] font-bold uppercase tracking-[0.15em] transition-all lg:flex-none ${
                  status === tab.id
                    ? `${tab.c} scale-105 shadow-pop ring-4 ring-white/10`
                    : 'text-muted hover:bg-surface-2 hover:text-main'
                }`}
              >
                <tab.i className="h-4 w-4" /> {tab.l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-full border border-brand-blue/10 bg-brand-blue/5 px-6 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
              Total_Records: {total ?? 0}
            </div>
          </div>
        </div>

        {err && (
          <div className="animate-in slide-in-from-top-2 mx-8 mt-8 flex items-center gap-5 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 p-6 font-bold text-red-700 shadow-sm dark:bg-red-950/10 dark:text-red-400">
            <ShieldAlert className="h-6 w-6 opacity-60" />
            <p className="text-sm">
              Falla de Enlace Forense: <span className="font-light">{err}</span>
            </p>
          </div>
        )}

        {/* LISTADO DE RESEÑAS */}
        <div className="space-y-12 p-10">
          {loading && items.length === 0 ? (
            <div className="flex animate-pulse flex-col items-center justify-center gap-6 py-48">
              <RefreshCw className="h-16 w-16 animate-spin text-brand-blue opacity-10" />
              <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
                Retrieving Reputation Data...
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="group flex flex-col items-center justify-center gap-6 py-48 text-center opacity-20">
              <Star className="h-24 w-24 text-brand-blue transition-transform duration-700 group-hover:scale-110" />
              <div className="space-y-1">
                <p className="font-heading text-2xl uppercase tracking-tighter text-main">
                  Bandeja Vacía
                </p>
                <p className="text-sm font-light italic">
                  No se han detectado señales en el canal de {status}.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-10">
              {items.map((r) => (
                <article
                  key={r.id}
                  className="group relative flex flex-col gap-12 overflow-hidden rounded-[3rem] border border-brand-dark/5 bg-surface p-10 shadow-soft transition-all hover:border-brand-blue/20 hover:shadow-pop dark:border-white/5 md:p-14 lg:flex-row"
                >
                  {/* Status Indicator Bar */}
                  <div
                    className={`absolute left-0 top-0 h-full w-2 ${status === 'pending' ? 'bg-brand-yellow' : status === 'approved' ? 'bg-green-500' : 'bg-red-500'} opacity-10 transition-opacity group-hover:opacity-100`}
                  />

                  {/* ASIDE: Identidad del Cliente */}
                  <aside className="shrink-0 space-y-10 lg:w-[350px]">
                    <div className="flex items-center gap-5">
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[2rem] border border-brand-dark/5 bg-surface-2 shadow-inner transition-transform group-hover:rotate-3">
                        {r.avatar_url ? (
                          <img
                            src={r.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 opacity-20">
                            <User className="h-8 w-8" />
                            <span className="text-[8px] font-black uppercase tracking-tighter">
                              No_Ava
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="truncate font-heading text-2xl tracking-tighter text-main">
                          {r.customer_name || 'Anonymous_Node'}
                        </p>
                        <div className="flex w-fit items-center gap-3 rounded-lg border border-brand-dark/5 bg-surface-2 px-3 py-1">
                          <Mail className="h-3 w-3 text-brand-blue opacity-40" />
                          <span className="max-w-[150px] truncate font-mono text-[10px] font-bold text-muted">
                            {r.customer_email || 'SECURE_HIDDEN'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-surface-2/50 rounded-[2rem] border border-brand-dark/5 p-6 shadow-inner">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-40">
                              Experiencia
                            </span>
                            {stars(r.rating)}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-tight text-main">
                              {r.tour_slug || 'GENERAL_EXPERIENCE'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-muted/50 flex items-center gap-3 rounded-full border border-brand-dark/5 bg-surface px-6 py-3 font-mono text-[10px] uppercase tracking-widest transition-colors group-hover:text-main">
                        <Clock className="h-3.5 w-3.5 opacity-40" /> Ingesta:{' '}
                        {fmtDate(r.created_at)}
                      </div>
                    </div>
                  </aside>

                  {/* MAIN: Contenido del Testimonio */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="space-y-8">
                      {r.title && (
                        <h3 className="font-heading text-4xl leading-none tracking-tighter text-main">
                          &quot;{r.title}&quot;
                        </h3>
                      )}

                      <div className="relative">
                        <div className="absolute -left-6 top-0 h-full w-1 rounded-full bg-brand-blue/10" />
                        <p className="text-main/80 pl-4 text-lg font-light italic leading-relaxed">
                          {(
                            r.body ||
                            r.comment ||
                            'Technical Note: Feedback sin cuerpo de texto enviado por el viajero.'
                          ).trim()}
                        </p>
                      </div>

                      {/* Multimedia Node */}
                      {r.media_urls && r.media_urls.length > 0 && (
                        <div className="mt-12 space-y-8 border-t border-brand-dark/5 pt-10">
                          <header className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">
                              <Camera className="h-4 w-4" /> Multimedia Dispatch
                            </div>
                            {r.face_consent !== null && (
                              <div
                                className={`flex items-center gap-2 rounded-full border px-5 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${r.face_consent ? 'border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400' : 'border-red-500/20 bg-red-500/5 text-red-600'}`}
                              >
                                <UserCheck className="h-3 w-3" /> Face Consent:{' '}
                                {r.face_consent ? 'GRANTED' : 'DENIED'}
                              </div>
                            )}
                          </header>
                          <div className="flex flex-wrap gap-5">
                            {r.media_urls.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="group/img relative h-32 w-44 overflow-hidden rounded-[2rem] border-4 border-white shadow-soft transition-all hover:scale-110 hover:shadow-pop dark:border-brand-dark"
                              >
                                <img
                                  src={url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-brand-blue/20 opacity-0 transition-opacity group-hover/img:opacity-100">
                                  <Eye className="h-6 w-6 text-white" />
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* MANDO DE MODERACIÓN */}
                    {status === 'pending' && (
                      <footer className="mt-16 flex flex-col justify-end gap-5 border-t border-brand-dark/5 pt-10 dark:border-white/5 sm:flex-row">
                        <Button
                          onClick={() => void handleAction(r.id, 'reject')}
                          disabled={busy}
                          className="flex h-16 items-center justify-center rounded-[1.8rem] border-2 border-red-500/10 bg-surface px-10 text-[11px] font-bold uppercase tracking-[0.2em] text-red-600 transition-all hover:border-red-600 hover:bg-red-600 hover:text-white active:scale-95"
                        >
                          {actionId === r.id ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="mr-3 h-4 w-4" /> Rechazar Entrada
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => void handleAction(r.id, 'approve')}
                          disabled={busy}
                          className="flex h-16 items-center justify-center rounded-[1.8rem] bg-green-600 px-12 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-pop transition-all hover:bg-green-700 active:scale-95"
                        >
                          {actionId === r.id ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              <FileCheck className="mr-3 h-5 w-5" /> Aprobar Testimonio
                            </>
                          )}
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
          <footer className="bg-surface-2/30 flex items-center justify-between border-t border-brand-dark/5 p-10 dark:border-white/5">
            <Button
              disabled={page <= 1 || busy}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              variant="outline"
              className="h-12 rounded-xl border-brand-dark/10 bg-surface px-8 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-surface-2"
            >
              <ChevronLeft className="mr-3 h-4 w-4" /> Anterior
            </Button>
            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-brand-dark/10" />
              <div className="font-mono text-[11px] font-black uppercase tracking-[0.4em] text-brand-blue">
                Page: {page} <span className="opacity-20">/</span> {pages}
              </div>
              <div className="h-px w-12 bg-brand-dark/10" />
            </div>
            <Button
              disabled={page >= pages || busy}
              onClick={() => setPage((p) => p + 1)}
              variant="outline"
              className="h-12 rounded-xl border-brand-dark/10 bg-surface px-8 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-surface-2"
            >
              Siguiente <ChevronRight className="ml-3 h-4 w-4" />
            </Button>
          </footer>
        )}
      </section>

      {/* FOOTER DE INTEGRIDAD CORPORATIVA */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Trust Verification Active
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ImageIcon className="h-4 w-4 opacity-50" /> Media Integrity v2.1
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <UserCheck className="h-4 w-4 animate-pulse" /> Verified Testimonial Node
        </div>
      </footer>
    </div>
  );
}
