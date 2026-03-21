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
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Search, 
  MonitorPlay, 
  ExternalLink, 
  BarChart3, 
  History,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  // PRO TIP: Usamos { count: 'exact' } para telemetría precisa sin importar el limit
  const { data, error, count } = await admin
    .from('videos')
    .select('id,slug,title,status,lang,youtube_url,updated_at', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .limit(200);

  const items = ((data ?? []) as VideoRow[]);
  
  // Señales estratégicas de producción basadas en el conteo real
  const totalVideos = count ?? items.length;
  const publishedCount = items.filter(v => v.status === 'published').length;
  const draftCount = items.filter(v => v.status === 'draft').length;

  return (
    <main className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER TÁCTICO */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10">
        <div className="space-y-4">
          <Link 
            href="/admin/content" 
            className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] hover:text-rose-600 transition-colors"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /> Centro de Contenidos
          </Link>
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-rose-600/50">
              <Youtube className="h-3.5 w-3.5" /> Vlog & Visual Authority Lane
            </div>
            <h1 className="font-heading text-4xl md:text-5xl text-brand-blue">
              Catálogo de <span className="text-rose-600 italic font-light">Vlog</span>
            </h1>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button asChild className="rounded-full bg-brand-dark text-brand-yellow shadow-xl hover:scale-105 transition-transform px-8">
            <Link href="/admin/content/videos/new">
              <Plus className="mr-2 h-4 w-4" /> Registrar Video
            </Link>
          </Button>
        </div>
      </header>

      {/* SEÑALES DE PRODUCCIÓN (KPI STRIP) */}
      <section className="grid gap-6 sm:grid-cols-3">
        {[
          { label: 'Contenido Visual', value: totalVideos, color: 'text-rose-600' },
          { label: 'Streaming Activo', value: publishedCount, color: 'text-emerald-500' },
          { label: 'En Post-Producción', value: draftCount, color: 'text-amber-500' },
        ].map((sig, i) => (
          <div key={i} className="group rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-surface-2)] ${sig.color} shadow-inner`}>
              </div>
              <BarChart3 className="h-4 w-4 text-[color:var(--color-text)]/50" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30">{sig.label}</p>
            <p className={`text-3xl font-heading mt-1 ${sig.color}`}>{sig.value}</p>
          </div>
        ))}
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 flex items-center gap-4 text-rose-700 animate-in zoom-in-95">
          <AlertTriangle className="h-6 w-6 text-rose-400" />
          <p className="text-sm font-medium">Error de sincronización multimedia: {error.message}</p>
        </div>
      )}

      {/* LA BÓVEDA MULTIMEDIA (TABLA) */}
      <section className="rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-2xl overflow-hidden relative">
        <div className="p-8 pb-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <Search className="h-5 w-5 text-brand-blue/30" />
             <h2 className="font-heading text-2xl text-brand-blue">Directorio de Videos</h2>
           </div>
           <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30">
              Inferencia de YouTube API activa
           </div>
        </div>

        <div className="overflow-x-auto px-6 pb-6">
          <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm min-w-[1000px]">
              <thead className="bg-[color:var(--color-surface-2)] border-b border-[color:var(--color-border)]">
                <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                  <th className="px-8 py-6">Producción & Fuente</th>
                  <th className="px-8 py-6 text-center">Idioma</th>
                  <th className="px-8 py-6 text-center">Estatus</th>
                  <th className="px-8 py-6 text-right">Actualización</th>
                  <th className="px-8 py-6 text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <Video className="mx-auto h-12 w-12 text-rose-600/10 mb-6" />
                      <p className="text-lg font-light text-[color:var(--color-text)]/30 italic">No hay material visual registrado. Inicia una nueva producción.</p>
                    </td>
                  </tr>
                ) : (
                  items.map((v) => {
                    const isPub = v.status === 'published';
                    return (
                      <tr key={v.id} className="group transition-all hover:bg-rose-600/[0.01]">
                        <td className="px-8 py-6 align-top">
                          <div className="font-heading text-lg text-rose-600 group-hover:text-brand-yellow transition-colors leading-tight line-clamp-1">
                            {v.title || 'Corte sin título'}
                          </div>
                          <div className="mt-2 flex flex-col gap-1">
                            {v.youtube_url && (
                              <a 
                                href={v.youtube_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1.5 text-[9px] font-mono text-brand-blue/60 hover:text-brand-blue transition-colors w-fit"
                              >
                                <Youtube className="h-3 w-3" /> {v.youtube_url}
                                <ExternalLink className="h-2 w-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                            )}
                            <div className="text-[9px] font-mono text-[color:var(--color-text)]/30 uppercase tracking-tighter">
                              <span className="text-brand-blue/20">SLUG:</span> /{v.slug || 'pendiente'}
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-6 align-top text-center">
                          <div className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] px-3 py-1.5 shadow-sm">
                            <Globe className="h-3 w-3 text-brand-blue/40" />
                            <span className="text-[10px] font-bold uppercase text-brand-blue/70">{(v.lang ?? 'ES')}</span>
                          </div>
                        </td>

                        <td className="px-8 py-6 align-top text-center">
                          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] border shadow-sm ${
                            isPub 
                              ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                          }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${isPub ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                            {v.status}
                          </span>
                        </td>

                        <td className="px-8 py-6 align-top text-right">
                          <div className="flex flex-col items-end">
                            <div className="text-[11px] font-bold text-[color:var(--color-text)] flex items-center gap-1.5">
                              <Clock className="h-3 w-3 opacity-30" />
                              {v.updated_at ? new Date(v.updated_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </div>
                            <div className="mt-1 text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50">Montaje final</div>
                          </div>
                        </td>

                        <td className="px-8 py-6 align-top text-right">
                          <Button variant="ghost" size="sm" asChild className="rounded-xl hover:bg-rose-600/5 text-rose-600 group/btn">
                            <Link href={`/admin/content/videos/${v.id}`}>
                              <Edit3 className="mr-2 h-3.5 w-3.5" /> Editar Material
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
        </div>

        {/* FOOTER DE ESTÁNDARES */}
        <footer className="mt-8 flex items-center justify-center gap-12 border-t border-[color:var(--color-border)] pt-8 pb-4 opacity-30">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
            <CheckCircle2 className="h-3 w-3" /> YouTube Sync Integrity
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
            <Video className="h-3 w-3" /> 4K Content Compliant
          </div>
        </footer>
      </section>

    </main>
  );
}