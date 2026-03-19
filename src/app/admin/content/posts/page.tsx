import 'server-only';

import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { 
  ArrowLeft, Plus, Edit3, FileText, Globe, 
  Sparkles, Clock, Layout, CheckCircle2, 
  Search, History, ArrowRight, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PostRow = {
  id: string;
  slug: string | null;
  title: string | null;
  status: 'draft' | 'published' | 'archived' | string;
  lang: string | null;
  published_at: string | null;
  updated_at: string | null;
};

export default async function AdminPostsList() {
  const admin = getSupabaseAdmin();

  // PRO TIP: Usamos { count: 'exact' } para que el KPI de Total no se tope con el limit(200)
  const { data, error, count } = await admin
    .from('posts')
    .select('id,slug,title,status,lang,published_at,updated_at', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .limit(200);

  const items = ((data ?? []) as PostRow[]);
  
  // Señales estratégicas
  const totalPosts = count ?? items.length; // Usamos el count real de la base de datos
  const publishedCount = items.filter(i => i.status === 'published').length;
  const draftCount = items.filter(i => i.status === 'draft').length;

  return (
    <main className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER TÁCTICO */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10">
        <div className="space-y-4">
          <Link 
            href="/admin/content" 
            className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 hover:text-brand-blue transition-colors"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /> Centro de Contenidos
          </Link>
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
              <FileText className="h-3.5 w-3.5" /> Authority & SEO Lane
            </div>
            <h1 className="font-heading text-4xl md:text-5xl text-brand-blue">
              Artículos del <span className="text-brand-yellow italic font-light">Blog</span>
            </h1>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button asChild className="rounded-full bg-brand-dark text-brand-yellow shadow-xl hover:scale-105 transition-transform px-8">
            <Link href="/admin/content/posts/new">
              <Plus className="mr-2 h-4 w-4" /> Crear Nuevo Post
            </Link>
          </Button>
        </div>
      </header>

      {/* SEÑALES DE CONTENIDO (KPI STRIP) */}
      <section className="grid gap-6 sm:grid-cols-3">
        {[
          { label: 'Total Artículos', value: totalPosts, color: 'text-brand-blue' },
          { label: 'En Vivo', value: publishedCount, color: 'text-emerald-500' },
          { label: 'En Redacción', value: draftCount, color: 'text-amber-500' },
        ].map((sig, i) => (
          <div key={i} className="group rounded-[2rem] border border-[var(--color-border)] bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface-2)] ${sig.color} shadow-inner`}>
                <sig.icon className="h-5 w-5" />
              </div>
              <BarChart3 className="h-4 w-4 text-[var(--color-text)]/10" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">{sig.label}</p>
            <p className={`text-3xl font-heading mt-1 ${sig.color}`}>{sig.value}</p>
          </div>
        ))}
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 flex items-center gap-4 text-rose-700 animate-in zoom-in-95">
          <Sparkles className="h-6 w-6 text-rose-400" />
          <p className="text-sm font-medium">Error de sincronización con Supabase: {error.message}</p>
        </div>
      )}

      {/* LA BÓVEDA DE CONTENIDOS (TABLA) */}
      <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl overflow-hidden relative">
        <div className="p-8 pb-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <Search className="h-5 w-5 text-brand-blue/30" />
             <h2 className="font-heading text-2xl text-brand-blue">Directorio de Publicaciones</h2>
           </div>
           <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">
             Mostrando los últimos 200 registros
           </div>
        </div>

        <div className="overflow-x-auto px-6 pb-6">
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm min-w-[900px]">
              <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40">
                  <th className="px-8 py-6">Estructura del Post</th>
                  <th className="px-8 py-6 text-center">Mercado</th>
                  <th className="px-8 py-6 text-center">Estatus</th>
                  <th className="px-8 py-6 text-right">Cronología</th>
                  <th className="px-8 py-6 text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <FileText className="mx-auto h-12 w-12 text-brand-blue/10 mb-6" />
                      <p className="text-lg font-light text-[var(--color-text)]/30 italic">La factoría de contenido está vacía. Inicia una nueva historia.</p>
                    </td>
                  </tr>
                ) : (
                  items.map((p) => {
                    const isPub = p.status === 'published';
                    return (
                      <tr key={p.id} className="group transition-all hover:bg-brand-blue/[0.01]">
                        <td className="px-8 py-6 align-top">
                          <div className="font-heading text-lg text-brand-blue group-hover:text-brand-yellow transition-colors leading-tight">
                            {p.title || 'Manuscrito sin título'}
                          </div>
                          <div className="mt-1 flex items-center gap-2 font-mono text-[9px] text-[var(--color-text)]/40 uppercase tracking-tighter">
                            <span className="text-brand-blue/30">SLUG:</span> /{p.slug || 'pendiente'}
                          </div>
                        </td>

                        <td className="px-8 py-6 align-top text-center">
                          <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-1.5 shadow-sm">
                            <Globe className="h-3 w-3 text-brand-blue/40" />
                            <span className="text-[10px] font-bold uppercase text-brand-blue/70">{(p.lang ?? 'ES')}</span>
                          </div>
                        </td>

                        <td className="px-8 py-6 align-top text-center">
                          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] border shadow-sm ${
                            isPub 
                              ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                          }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${isPub ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                            {p.status}
                          </span>
                        </td>

                        <td className="px-8 py-6 align-top text-right">
                          <div className="flex flex-col items-end">
                            <div className="text-[11px] font-bold text-brand-dark flex items-center gap-1.5">
                              <Clock className="h-3 w-3 opacity-30" />
                              {p.updated_at ? new Date(p.updated_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </div>
                            <div className="mt-1 text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/20">Última revisión</div>
                          </div>
                        </td>

                        <td className="px-8 py-6 align-top text-right">
                          <Button variant="ghost" size="sm" asChild className="rounded-xl hover:bg-brand-blue/5 text-brand-blue group/btn">
                            <Link href={`/admin/content/posts/${p.id}`}>
                              <Edit3 className="mr-2 h-3.5 w-3.5" /> Editar Post
                              <ArrowRight className="ml-2 h-3 w-3 opacity-0 -translate-x-2 transition-all group-hover/btn:opacity-100 group-hover/btn:translate-x-0" />
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
        <footer className="mt-8 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-8 pb-4 opacity-30">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
            <CheckCircle2 className="h-3 w-3" /> SEO Optimized Content
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
            <History className="h-3 w-3" /> Version Control Active
          </div>
        </footer>
      </section>

    </main>
  );
}