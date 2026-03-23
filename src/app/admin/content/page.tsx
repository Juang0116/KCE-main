import 'server-only';
import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  FileText, PenTool, ArrowRight, 
  LayoutDashboard, Globe, Sparkles, 
  BarChart3, History, CheckCircle2, 
  MonitorPlay, Youtube, Terminal, ShieldCheck, Zap
} from 'lucide-react';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { Button } from '@/components/ui/Button';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Content Hub | KCE Ops',
  description: 'Gestión central de la arquitectura de contenidos, SEO y Vlog de Knowing Cultures S.A.S.',
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
    postsDraft: 0, postsPub: 0, videosDraft: 0, videosPub: 0,
  }));

  const totalPosts = counts.postsDraft + counts.postsPub;
  const totalVideos = counts.videosDraft + counts.videosPub;

  return (
    <main className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 01. CABECERA INSTITUCIONAL */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Sparkles className="h-3.5 w-3.5" /> Content Engine Unit
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tighter">
            Gestor de <span className="text-brand-yellow italic font-light">Contenidos</span>
          </h1>
          <p className="mt-3 text-base text-muted font-light max-w-2xl leading-relaxed">
            Control maestro de la narrativa bilingüe de Knowing Cultures. Desde aquí calibras el Blog SEO y la Videoteca para maximizar el alcance orgánico.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="rounded-full shadow-sm hover:bg-surface-2 border-brand-dark/10 h-12 px-8 text-[10px] font-bold uppercase tracking-widest transition-all">
            <Link href="/admin">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Root Admin
            </Link>
          </Button>
        </div>
      </header>

      {/* 02. BANNER DE ESTRATEGIA (LA VISIÓN) */}
      <section className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-blue/20 bg-brand-dark p-10 md:p-16 shadow-pop text-white">
        <div className="absolute top-0 right-0 p-12 opacity-[0.05] transition-transform hover:scale-110 duration-1000 pointer-events-none">
          <Globe className="h-80 w-80 text-brand-yellow" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
            <PenTool className="h-3.5 w-3.5" /> Authority Strategy
          </div>
          <h2 className="font-heading text-3xl md:text-5xl mb-8 tracking-tight">Atrae viajeros sin depender de Ads</h2>
          <p className="text-xl font-light leading-relaxed text-white/80 italic border-l-2 border-brand-yellow/30 pl-8">
            &quot;El contenido no es solo información; es la infraestructura de confianza. Un post bien escrito ahorra 10 minutos de soporte, y un video auténtico proyecta la realidad de Knowing Cultures.&quot;
          </p>
        </div>
      </section>

      {/* 03. HUB DE MÓDULOS (GRILLA TÁCTICA) */}
      <div className="grid gap-8 md:grid-cols-2">
        
        {/* MÓDULO BLOG */}
        <Link href="/admin/content/posts" className="group relative rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 shadow-soft transition-all duration-500 hover:shadow-pop hover:-translate-y-1 hover:border-brand-blue/20 overflow-hidden flex flex-col justify-between min-h-[350px]">
          <div className="absolute -right-6 -top-6 opacity-[0.02] transition-transform group-hover:scale-110 duration-700">
            <FileText className="h-56 w-56 text-brand-blue" />
          </div>
          
          <div className="relative z-10">
            <header className="flex items-center justify-between mb-10">
              <div className="h-16 w-16 rounded-2xl bg-brand-blue/10 border border-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner group-hover:bg-brand-blue group-hover:text-white transition-all duration-500">
                <FileText className="h-8 w-8" />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                Abrir Biblioteca <ArrowRight className="h-4 w-4" />
              </div>
            </header>
            <h3 className="font-heading text-3xl text-main mb-4 tracking-tight group-hover:text-brand-blue transition-colors">Artículos (Blog)</h3>
            <p className="text-base font-light leading-relaxed text-muted max-w-xs opacity-70">
              Redacción en Markdown, optimización SEO y gestión de autoridad semántica.
            </p>
          </div>

          <div className="relative z-10 mt-12 grid grid-cols-3 gap-6 border-t border-brand-dark/5 dark:border-white/5 pt-8 bg-surface-2/30 -mx-10 px-10 pb-2">
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted flex items-center gap-1.5 opacity-60">
                <CheckCircle2 className="h-3 w-3 text-green-500" /> Live
              </p>
              <p className="text-3xl font-heading text-main tracking-tight">{counts.postsPub}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted flex items-center gap-1.5 opacity-60">
                <History className="h-3 w-3 text-amber-500" /> Drafts
              </p>
              <p className="text-3xl font-heading text-main tracking-tight">{counts.postsDraft}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">Volume</p>
              <p className="text-3xl font-heading text-brand-blue/30 tracking-tight">{totalPosts}</p>
            </div>
          </div>
        </Link>

        {/* MÓDULO VLOG */}
        <Link href="/admin/content/videos" className="group relative rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 shadow-soft transition-all duration-500 hover:shadow-pop hover:-translate-y-1 hover:border-red-600/20 overflow-hidden flex flex-col justify-between min-h-[350px]">
          <div className="absolute -right-6 -top-6 opacity-[0.02] transition-transform group-hover:scale-110 duration-700">
            <Youtube className="h-56 w-56 text-red-600" />
          </div>

          <div className="relative z-10">
            <header className="flex items-center justify-between mb-10">
              <div className="h-16 w-16 rounded-2xl bg-red-600/10 border border-red-600/10 flex items-center justify-center text-red-600 shadow-inner group-hover:bg-red-600 group-hover:text-white transition-all duration-500">
                <MonitorPlay className="h-8 w-8" />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                Abrir Videoteca <ArrowRight className="h-4 w-4" />
              </div>
            </header>
            <h3 className="font-heading text-3xl text-main mb-4 tracking-tight group-hover:text-red-600 transition-colors">Vlog (YouTube)</h3>
            <p className="text-base font-light leading-relaxed text-muted max-w-xs opacity-70">
              Sincronización de videos, curaduría visual y nutrición de leads mediante video-sales.
            </p>
          </div>

          <div className="relative z-10 mt-12 grid grid-cols-3 gap-6 border-t border-brand-dark/5 dark:border-white/5 pt-8 bg-surface-2/30 -mx-10 px-10 pb-2">
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted flex items-center gap-1.5 opacity-60">
                <Zap className="h-3 w-3 text-green-500" /> Streaming
              </p>
              <p className="text-3xl font-heading text-main tracking-tight">{counts.videosPub}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted flex items-center gap-1.5 opacity-60">
                <History className="h-3 w-3 text-amber-500" /> Edit
              </p>
              <p className="text-3xl font-heading text-main tracking-tight">{counts.videosDraft}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">Volume</p>
              <p className="text-3xl font-heading text-red-600/20 tracking-tight">{totalVideos}</p>
            </div>
          </div>
        </Link>

      </div>

      {/* 04. FOOTER TÉCNICO DE SISTEMA */}
      <footer className="mt-16 flex flex-col sm:flex-row items-center justify-between border-t border-brand-dark/10 dark:border-white/10 pt-12 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Terminal className="h-3.5 w-3.5" /> Content Hub v4.1
        </div>
        <div className="flex items-center gap-8 text-[10px] font-mono tracking-widest uppercase text-muted mt-4 sm:mt-0">
           <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 opacity-40 text-green-500" /> SEO Core: Validated
           </div>
           <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 opacity-40 text-brand-yellow" /> Cloud Delivery: Active
           </div>
        </div>
      </footer>
      
    </main>
  );
}