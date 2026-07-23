import 'server-only';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  FileText,
  PenTool,
  ArrowRight,
  LayoutDashboard,
  Globe,
  Sparkles,
  BarChart3,
  History,
  CheckCircle2,
  MonitorPlay,
  Youtube,
  Terminal,
  ShieldCheck,
  Zap,
} from 'lucide-react';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { Button } from '@/components/ui/Button';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Content Hub | KCE Ops',
  description:
    'Gestión central de la arquitectura de contenidos, SEO y Vlog de Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

interface ContentTelemetry {
  postsDraft: number;
  postsPub: number;
  videosDraft: number;
  videosPub: number;
}

/**
 * Recupera la telemetría de contenidos en tiempo real mediante head queries.
 */
async function getCounts(): Promise<ContentTelemetry> {
  const admin = getSupabaseAdmin();

  const [postsDraft, postsPub, videosDraft, videosPub] = await Promise.all([
    admin.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    admin.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    admin.from('videos').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    admin.from('videos').select('id', { count: 'exact', head: true }).eq('status', 'published'),
  ]);

  return {
    postsDraft: postsDraft.count ?? 0,
    postsPub: postsPub.count ?? 0,
    videosDraft: videosDraft.count ?? 0,
    videosPub: videosPub.count ?? 0,
  };
}

export default async function AdminContentHome() {
  const counts = await getCounts().catch(() => ({
    postsDraft: 0,
    postsPub: 0,
    videosDraft: 0,
    videosPub: 0,
  }));

  const totalPosts = counts.postsDraft + counts.postsPub;
  const totalVideos = counts.videosDraft + counts.videosPub;

  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-24 duration-700">
      {/* 01. CABECERA INSTITUCIONAL */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Sparkles className="h-3.5 w-3.5" /> Content Engine Unit
          </div>
          <h1 className="font-heading text-4xl tracking-tighter text-main md:text-5xl">
            Gestor de <span className="font-light italic text-brand-yellow">Contenidos</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base font-light leading-relaxed text-muted">
            Control maestro de la narrativa bilingüe de Knowing Cultures. Desde aquí calibras el
            Blog SEO y la Videoteca para maximizar el alcance orgánico.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-full border-brand-dark/10 px-8 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-surface-2"
          >
            <Link href="/admin">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Root Admin
            </Link>
          </Button>
        </div>
      </header>

      {/* 02. BANNER DE ESTRATEGIA (LA VISIÓN) */}
      <section className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-blue/20 bg-brand-dark p-10 text-white shadow-pop md:p-16">
        <div className="pointer-events-none absolute right-0 top-0 p-12 opacity-[0.05] transition-transform duration-1000 hover:scale-110">
          <Globe className="h-80 w-80 text-brand-yellow" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-yellow/20 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
            <PenTool className="h-3.5 w-3.5" /> Authority Strategy
          </div>
          <h2 className="mb-8 font-heading text-3xl tracking-tight md:text-5xl">
            Atrae viajeros sin depender de Ads
          </h2>
          <p className="border-l-2 border-brand-yellow/30 pl-8 text-xl font-light italic leading-relaxed text-white/80">
            &quot;El contenido no es solo información; es la infraestructura de confianza. Un post
            bien escrito ahorra 10 minutos de soporte, y un video auténtico proyecta la realidad de
            Knowing Cultures.&quot;
          </p>
        </div>
      </section>

      {/* 03. HUB DE MÓDULOS (GRILLA TÁCTICA) */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* MÓDULO BLOG */}
        <Link
          href="/admin/content/posts"
          className="group relative flex min-h-[350px] flex-col justify-between overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-brand-blue/20 hover:shadow-pop dark:border-white/5"
        >
          <div className="absolute -right-6 -top-6 opacity-[0.02] transition-transform duration-700 group-hover:scale-110">
            <FileText className="h-56 w-56 text-brand-blue" />
          </div>

          <div className="relative z-10">
            <header className="mb-10 flex items-center justify-between">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-blue/10 bg-brand-blue/10 text-brand-blue shadow-inner transition-all duration-500 group-hover:bg-brand-blue group-hover:text-white">
                <FileText className="h-8 w-8" />
              </div>
              <div className="flex -translate-x-4 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
                Abrir Biblioteca <ArrowRight className="h-4 w-4" />
              </div>
            </header>
            <h3 className="mb-4 font-heading text-3xl tracking-tight text-main transition-colors group-hover:text-brand-blue">
              Artículos (Blog)
            </h3>
            <p className="max-w-xs text-base font-light leading-relaxed text-muted opacity-70">
              Redacción en Markdown, optimización SEO y gestión de autoridad semántica.
            </p>
          </div>

          <div className="bg-surface-2/30 relative z-10 -mx-10 mt-12 grid grid-cols-3 gap-6 border-t border-brand-dark/5 px-10 pb-2 pt-8 dark:border-white/5">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
                <CheckCircle2 className="h-3 w-3 text-green-500" /> Live
              </p>
              <p className="font-heading text-3xl tracking-tight text-main">{counts.postsPub}</p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
                <History className="h-3 w-3 text-amber-500" /> Drafts
              </p>
              <p className="font-heading text-3xl tracking-tight text-main">{counts.postsDraft}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
                Volume
              </p>
              <p className="font-heading text-3xl tracking-tight text-brand-blue/30">
                {totalPosts}
              </p>
            </div>
          </div>
        </Link>

        {/* MÓDULO VLOG */}
        <Link
          href="/admin/content/videos"
          className="group relative flex min-h-[350px] flex-col justify-between overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-red-600/20 hover:shadow-pop dark:border-white/5"
        >
          <div className="absolute -right-6 -top-6 opacity-[0.02] transition-transform duration-700 group-hover:scale-110">
            <Youtube className="h-56 w-56 text-red-600" />
          </div>

          <div className="relative z-10">
            <header className="mb-10 flex items-center justify-between">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-600/10 bg-red-600/10 text-red-600 shadow-inner transition-all duration-500 group-hover:bg-red-600 group-hover:text-white">
                <MonitorPlay className="h-8 w-8" />
              </div>
              <div className="flex -translate-x-4 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
                Abrir Videoteca <ArrowRight className="h-4 w-4" />
              </div>
            </header>
            <h3 className="mb-4 font-heading text-3xl tracking-tight text-main transition-colors group-hover:text-red-600">
              Vlog (YouTube)
            </h3>
            <p className="max-w-xs text-base font-light leading-relaxed text-muted opacity-70">
              Sincronización de videos, curaduría visual y nutrición de leads mediante video-sales.
            </p>
          </div>

          <div className="bg-surface-2/30 relative z-10 -mx-10 mt-12 grid grid-cols-3 gap-6 border-t border-brand-dark/5 px-10 pb-2 pt-8 dark:border-white/5">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
                <Zap className="h-3 w-3 text-green-500" /> Streaming
              </p>
              <p className="font-heading text-3xl tracking-tight text-main">{counts.videosPub}</p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
                <History className="h-3 w-3 text-amber-500" /> Edit
              </p>
              <p className="font-heading text-3xl tracking-tight text-main">{counts.videosDraft}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
                Volume
              </p>
              <p className="font-heading text-3xl tracking-tight text-red-600/20">{totalVideos}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* 04. FOOTER TÉCNICO DE SISTEMA */}
      <footer className="mt-16 flex flex-col items-center justify-between border-t border-brand-dark/10 pt-12 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Terminal className="h-3.5 w-3.5" /> Content Hub v4.1
        </div>
        <div className="mt-4 flex items-center gap-8 font-mono text-[10px] uppercase tracking-widest text-muted sm:mt-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500 opacity-40" /> SEO Core: Validated
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-brand-yellow opacity-40" /> Cloud Delivery: Active
          </div>
        </div>
      </footer>
    </main>
  );
}
