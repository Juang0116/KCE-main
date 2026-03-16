import 'server-only';

import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { ArrowLeft, Plus, Edit3, FileText, Globe } from 'lucide-react';

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

  const { data, error } = await admin
    .from('posts')
    .select('id,slug,title,status,lang,published_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(200);

  const items = ((data ?? []) as PostRow[]);

  return (
    <main className="space-y-10 pb-20">
      
      {/* Cabecera */}
      <div>
        <Link href="/admin/content" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 hover:text-brand-blue transition-colors mb-4">
          <ArrowLeft className="h-3 w-3" /> Volver al CMS
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Artículos del Blog</h1>
            <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
              Directorio de contenido escrito y SEO.
            </p>
          </div>
          
          <div className="flex gap-3 shrink-0">
            <Link href="/admin/content/posts/new" className="flex items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-md">
              <Plus className="h-4 w-4" /> Nuevo Post
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-700">
          No se pudieron cargar los posts: {error.message}
        </div>
      )}

      {/* Tabla Premium */}
      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="overflow-x-auto rounded-3xl border border-[var(--color-border)] bg-white shadow-sm">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-6 py-5">Título y Slug</th>
                <th className="px-6 py-5 text-center">Idioma</th>
                <th className="px-6 py-5 text-center">Estado</th>
                <th className="px-6 py-5 text-right">Última Edición</th>
                <th className="px-6 py-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <FileText className="mx-auto h-12 w-12 text-[var(--color-text)]/10 mb-4" />
                    <div className="text-sm font-medium text-[var(--color-text)]/40">No hay posts creados aún.</div>
                  </td>
                </tr>
              ) : (
                items.map((p) => {
                  const isPub = p.status === 'published';
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                      <td className="px-6 py-5 align-top">
                        <div className="font-semibold text-brand-blue text-base mb-1">{p.title || 'Sin título'}</div>
                        <div className="text-[10px] font-mono text-[var(--color-text)]/50">/{p.slug || '—'}</div>
                      </td>

                      <td className="px-6 py-5 align-top text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/70">
                          <Globe className="h-3 w-3 opacity-50"/> {(p.lang ?? 'ES').toUpperCase()}
                        </span>
                      </td>

                      <td className="px-6 py-5 align-top text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${isPub ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : 'bg-amber-500/10 border-amber-500/20 text-amber-700'}`}>
                          {p.status}
                        </span>
                      </td>

                      <td className="px-6 py-5 align-top text-right">
                        <div className="text-xs text-[var(--color-text)]/70 font-medium">
                          {p.updated_at ? new Date(p.updated_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </div>
                      </td>

                      <td className="px-6 py-5 align-top text-right">
                        <div className="flex justify-end">
                          <Link href={`/admin/content/posts/${p.id}`} className="flex h-9 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)] shadow-sm">
                            <Edit3 className="h-3 w-3" /> Editar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}