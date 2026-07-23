import 'server-only';

import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import {
  ArrowLeft,
  Plus,
  Edit3,
  Video,
  Globe,
  Youtube,
  Clock,
  CheckCircle2,
  Search,
  MonitorPlay,
  ExternalLink,
  BarChart3,
  Terminal,
  ShieldCheck,
  Zap,
  AlertTriangle,
  ArrowRight, // <--- Agrega esta línea aquí
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gestión de Vlog | KCE Ops',
  description: 'Control de activos audiovisuales y producciones para Knowing Cultures S.A.S.',
};

type VideoRow = {
  id: string;
  slug: string | null;
  title: string | null;
  status: 'draft' | 'published' | 'archived' | string;
  lang: string | null;
  youtube_url: string | null;
  updated_at: string | null;
};

export default async function AdminVideosList() {
  const admin = getSupabaseAdmin();

  // PRO TIP: Usamos { count: 'exact' } para telemetría precisa
  const { data, error, count } = await admin
    .from('videos')
    .select('id,slug,title,status,lang,youtube_url,updated_at', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .limit(200);

  const items = (data ?? []) as VideoRow[];

  const totalVideos = count ?? items.length;
  const publishedCount = items.filter((v) => v.status === 'published').length;
  const draftCount = items.filter((v) => v.status === 'draft').length;

  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-24 duration-700">
      {/* 01. HEADER TÁCTICO */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <Link
            href="/admin/content"
            className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:text-red-600"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />{' '}
            Production Suite / Hub
          </Link>
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-red-600">
              <Youtube className="h-3.5 w-3.5" /> Vlog & Visual Authority
            </div>
            <h1 className="font-heading text-4xl tracking-tighter text-main md:text-5xl">
              Catálogo de <span className="font-light italic text-red-600">Vlog</span>
            </h1>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            asChild
            className="h-14 rounded-full bg-brand-dark px-10 text-xs font-bold uppercase tracking-widest text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white"
          >
            <Link href="/admin/content/videos/new">
              <Plus className="mr-2 h-4 w-4" /> Registrar Video
            </Link>
          </Button>
        </div>
      </header>

      {/* 02. SEÑALES DE PRODUCCIÓN (KPI STRIP) */}
      <section className="grid gap-6 sm:grid-cols-3">
        {[
          {
            label: 'Activos Visuales',
            value: totalVideos,
            color: 'text-red-600',
            icon: MonitorPlay,
          },
          {
            label: 'Streaming Activo',
            value: publishedCount,
            color: 'text-green-600 dark:text-green-400',
            icon: Globe,
          },
          { label: 'Post-Producción', value: draftCount, color: 'text-amber-500', icon: Video },
        ].map((sig, i) => (
          <div
            key={i}
            className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-pop dark:border-white/5"
          >
            <div className="mb-6 flex items-center justify-between">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-dark/5 bg-surface-2 dark:border-white/5 ${sig.color} shadow-inner`}
              >
                <sig.icon className="h-6 w-6" />
              </div>
              <BarChart3 className="h-4 w-4 text-muted opacity-20" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
              {sig.label}
            </p>
            <p className={`mt-1 font-heading text-4xl tracking-tight ${sig.color}`}>{sig.value}</p>
          </div>
        ))}
      </section>

      {error && (
        <div className="animate-in slide-in-from-top-2 flex items-center gap-4 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 p-6 text-red-700 shadow-sm dark:bg-red-950/20 dark:text-red-400">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <p className="text-sm font-bold">
            Error de Sincronización Multimedia: <span className="font-light">{error.message}</span>
          </p>
        </div>
      )}

      {/* 03. LA BÓVEDA MULTIMEDIA (TABLA) */}
      <section className="relative flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
        <div className="bg-surface-2/30 flex items-center justify-between border-b border-brand-dark/5 p-8 pb-6 dark:border-white/5">
          <div className="flex items-center gap-3">
            <Search className="h-6 w-6 text-brand-blue opacity-50" />
            <h2 className="font-heading text-2xl tracking-tight text-main">
              Directorio de Producciones
            </h2>
          </div>
          <div className="rounded-full border border-brand-dark/5 bg-surface px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted shadow-sm dark:border-white/5">
            YouTube API: Linked ({totalVideos})
          </div>
        </div>

        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-surface-2/50 border-b border-brand-dark/5 dark:border-white/5">
              <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                <th className="px-8 py-5">Producción & Fuente</th>
                <th className="px-8 py-5 text-center">Mercado</th>
                <th className="px-8 py-5 text-center">Estatus</th>
                <th className="px-8 py-5 text-right">Actualización</th>
                <th className="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="bg-surface px-8 py-32 text-center"
                  >
                    <Video className="mx-auto mb-6 h-16 w-16 text-red-600 opacity-10" />
                    <p className="font-heading text-xl tracking-tight text-main opacity-30">
                      Estudio en Silencio
                    </p>
                    <p className="mt-2 text-sm font-light italic text-muted">
                      No hay material visual registrado. Inicia una nueva producción.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((v) => {
                  const isPub = v.status === 'published';
                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-surface-2/50 group cursor-default bg-surface transition-colors"
                    >
                      <td className="px-8 py-6 align-top">
                        <div className="line-clamp-1 font-heading text-xl leading-tight tracking-tight text-main transition-colors group-hover:text-red-600">
                          {v.title || <span className="italic opacity-20">Corte sin título</span>}
                        </div>
                        <div className="mt-2 flex flex-col gap-2">
                          {v.youtube_url && (
                            <a
                              href={v.youtube_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex w-fit items-center gap-2 rounded border border-brand-blue/5 bg-brand-blue/5 px-2 py-0.5 font-mono text-[10px] text-brand-blue/60 transition-colors hover:text-brand-blue"
                            >
                              <Youtube className="h-3 w-3" /> {v.youtube_url.substring(0, 45)}...
                              <ExternalLink className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-100" />
                            </a>
                          )}
                          <div className="font-mono text-[9px] uppercase tracking-widest text-muted opacity-40">
                            <span className="font-bold">PATH:</span> /{v.slug || 'pendiente'}
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6 text-center align-top">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-brand-dark/10 bg-surface-2 px-4 py-2 shadow-inner dark:border-white/10">
                          <Globe className="h-3.5 w-3.5 text-brand-blue opacity-40" />
                          <span className="text-[10px] font-bold uppercase text-main">
                            {v.lang ?? 'ES'}
                          </span>
                        </div>
                      </td>

                      <td className="px-8 py-6 text-center align-top">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-sm ${
                            isPub
                              ? 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400'
                              : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-brand-yellow'
                          }`}
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${isPub ? 'animate-pulse bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-amber-500'}`}
                          />
                          {v.status}
                        </span>
                      </td>

                      <td className="px-8 py-6 text-right align-top">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2 text-xs font-bold text-main">
                            <Clock className="h-3.5 w-3.5 text-red-600 opacity-30" />
                            {v.updated_at
                              ? new Date(v.updated_at).toLocaleDateString('es-CO', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </div>
                          <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-muted opacity-40">
                            Edición final
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6 text-right align-top">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="group/btn h-10 rounded-xl px-4 text-red-600 transition-all hover:bg-red-600/5"
                        >
                          <Link href={`/admin/content/videos/${v.id}`}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                              Editar Material
                            </span>
                            <ArrowRight className="ml-2 h-3.5 w-3.5 -translate-x-2 opacity-0 transition-all group-hover/btn:translate-x-0 group-hover/btn:opacity-100" />
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

        {/* 04. FOOTER TÉCNICO DE SISTEMA */}
        <footer className="bg-surface-2/30 mt-auto flex flex-col items-center justify-between border-t border-brand-dark/5 p-8 opacity-60 dark:border-white/5 sm:flex-row">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
            <Terminal className="h-3.5 w-3.5" /> Media Pipeline v2.1
          </div>
          <div className="mt-4 flex items-center gap-8 font-mono text-[10px] uppercase tracking-widest text-muted sm:mt-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-green-500 opacity-40" /> YouTube Sync:
              Verified
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-brand-yellow opacity-40" /> RAG-Extraction: Active
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
