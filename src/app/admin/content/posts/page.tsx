import 'server-only';

import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import {
  ArrowLeft,
  Plus,
  Edit3,
  FileText,
  Globe,
  Sparkles,
  Clock,
  Layout,
  CheckCircle2,
  Search,
  History,
  ArrowRight,
  BarChart3,
  Terminal,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gestión de Blog | KCE Ops',
  description: 'Directorio de autoridad y estrategia SEO para Knowing Cultures S.A.S.',
};

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

  // PRO TIP: Usamos { count: 'exact' } para que el KPI de Total sea real
  const { data, count } = await admin
    .from('posts')
    .select('id,slug,title,status,lang,published_at,updated_at', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .limit(200);

  const items = (data ?? []) as PostRow[];

  // Señales estratégicas
  const totalPosts = count ?? items.length;
  const publishedCount = items.filter((i) => i.status === 'published').length;
  const draftCount = items.filter((i) => i.status === 'draft').length;

  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-24 duration-700">
      {/* 01. HEADER TÁCTICO */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <Link
            href="/admin/content"
            className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:text-brand-blue"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />{' '}
            Authority Engine / Hub
          </Link>
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
              <FileText className="h-3.5 w-3.5" /> Content Repository
            </div>
            <h1 className="font-heading text-4xl tracking-tighter text-main md:text-5xl">
              Artículos del <span className="font-light italic text-brand-yellow">Blog</span>
            </h1>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            asChild
            className="h-14 rounded-full bg-brand-dark px-10 text-xs font-bold uppercase tracking-widest text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white"
          >
            <Link href="/admin/content/posts/new">
              <Plus className="mr-2 h-4 w-4" /> Crear Nueva Historia
            </Link>
          </Button>
        </div>
      </header>

      {/* 02. SEÑALES DE CONTENIDO (KPI STRIP) */}
      <section className="grid gap-6 sm:grid-cols-3">
        {[
          {
            label: 'Total Publicaciones',
            value: totalPosts,
            color: 'text-brand-blue',
            icon: Layout,
          },
          {
            label: 'En Vivo (Live)',
            value: publishedCount,
            color: 'text-green-600 dark:text-green-400',
            icon: Globe,
          },
          { label: 'En Redacción', value: draftCount, color: 'text-amber-500', icon: Edit3 },
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

      {/* 03. LA BÓVEDA DE CONTENIDOS (TABLA) */}
      <section className="relative flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
        <div className="bg-surface-2/30 flex items-center justify-between border-b border-brand-dark/5 p-8 pb-6 dark:border-white/5">
          <div className="flex items-center gap-3">
            <Search className="h-6 w-6 text-brand-blue opacity-50" />
            <h2 className="font-heading text-2xl tracking-tight text-main">
              Directorio de Manuscritos
            </h2>
          </div>
          <div className="rounded-full border border-brand-dark/5 bg-surface px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted shadow-sm dark:border-white/5">
            Cache: Synchronized ({totalPosts})
          </div>
        </div>

        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-surface-2/50 border-b border-brand-dark/5 dark:border-white/5">
              <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                <th className="px-8 py-5">Estructura & Narrativa</th>
                <th className="px-8 py-5 text-center">Mercado</th>
                <th className="px-8 py-5 text-center">Estatus</th>
                <th className="px-8 py-5 text-right">Cronología</th>
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
                    <FileText className="mx-auto mb-6 h-16 w-16 text-brand-blue opacity-10" />
                    <p className="font-heading text-xl tracking-tight text-main opacity-30">
                      La factoría está en silencio
                    </p>
                    <p className="mt-2 text-sm font-light italic text-muted">
                      No se encontraron artículos. Es hora de iniciar una nueva historia.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((p) => {
                  const isPub = p.status === 'published';
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-surface-2/50 group cursor-default bg-surface transition-colors"
                    >
                      <td className="px-8 py-6 align-top">
                        <div className="font-heading text-xl leading-tight tracking-tight text-main transition-colors group-hover:text-brand-blue">
                          {p.title || (
                            <span className="italic opacity-20">Manuscrito sin título</span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted opacity-60">
                          <span className="font-bold text-brand-blue/60">URI:</span>
                          <span className="max-w-[300px] truncate">
                            /{p.slug || 'slug-pendiente'}
                          </span>
                        </div>
                      </td>

                      <td className="px-8 py-6 text-center align-top">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-brand-dark/10 bg-surface-2 px-4 py-2 shadow-inner dark:border-white/10">
                          <Globe className="h-3.5 w-3.5 text-brand-blue opacity-40" />
                          <span className="text-[10px] font-bold uppercase text-main">
                            {p.lang ?? 'ES'}
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
                          {p.status}
                        </span>
                      </td>

                      <td className="px-8 py-6 text-right align-top">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2 text-xs font-bold text-main">
                            <Clock className="h-3.5 w-3.5 text-brand-blue opacity-30" />
                            {p.updated_at
                              ? new Date(p.updated_at).toLocaleDateString('es-CO', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </div>
                          <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-muted opacity-40">
                            Última revisión
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6 text-right align-top">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="group/btn h-10 rounded-xl px-4 text-brand-blue transition-all hover:bg-brand-blue/5"
                        >
                          <Link href={`/admin/content/posts/${p.id}`}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                              Editar
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
            <Terminal className="h-3.5 w-3.5" /> Authority Lane v3.2
          </div>
          <div className="mt-4 flex items-center gap-8 font-mono text-[10px] uppercase tracking-widest text-muted sm:mt-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 opacity-40" /> SEO Integrity: 100%
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-brand-yellow opacity-40" /> Cloud Sync: Active
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
