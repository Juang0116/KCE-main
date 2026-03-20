import 'server-only';
import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  FileText, PenTool, ArrowRight, 
  LayoutDashboard, Globe, Sparkles, 
  BarChart3, History, CheckCircle2, 
  MonitorPlay, Youtube 
} from 'lucide-react';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { Button } from '@/components/ui/Button';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'CMS & Content Authority | Admin KCE',
  description: 'Gestión central de la arquitectura de contenidos, SEO y Vlog de Knowing Cultures Enterprise.',
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
    <main className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA INSTITUCIONAL */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Sparkles className="h-3.5 w-3.5" /> Content Engine Unit
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue">
            Gestor de <span className="text-brand-yellow italic font-light">Contenidos</span>
          </h1>
          <p className="mt-4 text-base text-[color:var(--color-text)]/50 font-light leading-relaxed max-w-2xl">
            Control maestro de la narrativa bilingüe de KCE. Desde aquí calibras el Blog SEO y la Videoteca para maximizar el engagement orgánico.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="rounded-full shadow-sm">
            <Link href="/admin">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Root Admin
            </Link>
          </Button>
        </div>
      </header>

      {/* 02. BANNER DE ESTRATEGIA (LA VISIÓN) */}
      <section className="relative overflow-hidden rounded-[3rem] border border-brand-blue/10 bg-brand-dark p-10 md:p-16 shadow-2xl text-white">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Globe className="h-64 w-64 text-brand-yellow" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
            <PenTool className="h-3.5 w-3.5" /> Authority Strategy
          </div>
          <h2 className="font-heading text-3xl md:text-4xl mb-6">Atrae viajeros sin depender de Ads</h2>
          <p className="text-lg font-light leading-relaxed text-white/70 italic border-l-2 border-brand-yellow/20 pl-8">
            &quot;El contenido no es solo información; es la infraestructura de confianza. Un post bien escrito ahorra 10 minutos de soporte humano, y un video auténtico cierra ventas por sí solo.&quot;
          </p>
        </div>
      </section>

      {/* 03. HUB DE MÓDULOS (GRILLA TÁCTICA) */}
      <div className="grid gap-8 md:grid-cols-2">
        
        {/* MÓDULO BLOG */}
        <Link href="/admin/content/posts" className="group relative rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10 shadow-sm transition-all hover:shadow-2xl hover:-translate-y-1 hover:border-brand-blue/30 overflow-hidden flex flex-col justify-between min-h-[320px]">
          <div className="absolute -right-6 -top-6 opacity-[0.03] transition-transform group-hover:scale-110">
            <FileText className="h-48 w-48 text-brand-blue" />
          </div>
          
          <div className="relative z-10">
            <header className="flex items-center justify-between mb-8">
              <div className="h-14 w-14 rounded-[1.5rem] bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner group-hover:bg-brand-blue group-hover:text-white transition-all duration-500">
                <FileText className="h-7 w-7" />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-blue opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                Abrir Blog <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </header>
            <h3 className="font-heading text-3xl text-brand-blue mb-4">Artículos (Blog)</h3>
            <p className="text-sm font-light leading-relaxed text-[color:var(--color-text)]/50 max-w-xs">
              Redacción en Markdown, optimización SEO y gestión de autoridad escrita.
            </p>
          </div>

          <div className="relative z-10 mt-12 grid grid-cols-3 gap-4 border-t border-[color:var(--color-border)] pt-8">
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Publicados
              </p>
              <p className="text-3xl font-heading text-emerald-600">{counts.postsPub}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 flex items-center gap-1">
                <History className="h-3 w-3 text-amber-500" /> Drafts
              </p>
              <p className="text-3xl font-heading text-amber-600">{counts.postsDraft}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30">Total</p>
              <p className="text-3xl font-heading text-brand-blue/40">{totalPosts}</p>
            </div>
          </div>
        </Link>

        {/* MÓDULO VLOG */}
        <Link href="/admin/content/videos" className="group relative rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10 shadow-sm transition-all hover:shadow-2xl hover:-translate-y-1 hover:border-rose-600/30 overflow-hidden flex flex-col justify-between min-h-[320px]">
          <div className="absolute -right-6 -top-6 opacity-[0.03] transition-transform group-hover:scale-110">
            <Youtube className="h-48 w-48 text-rose-600" />
          </div>

          <div className="relative z-10">
            <header className="flex items-center justify-between mb-8">
              <div className="h-14 w-14 rounded-[1.5rem] bg-rose-500/5 border border-rose-500/10 flex items-center justify-center text-rose-600 shadow-inner group-hover:bg-rose-600 group-hover:text-white transition-all duration-500">
                <MonitorPlay className="h-7 w-7" />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-rose-600 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                Abrir Vlog <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </header>
            <h3 className="font-heading text-3xl text-brand-blue mb-4">Vlog (YouTube)</h3>
            <p className="text-sm font-light leading-relaxed text-[color:var(--color-text)]/50 max-w-xs">
              Sincronización de videos, curaduría visual y nutrición de leads mediante video.
            </p>
          </div>

          <div className="relative z-10 mt-12 grid grid-cols-3 gap-4 border-t border-[color:var(--color-border)] pt-8">
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Activos
              </p>
              <p className="text-3xl font-heading text-emerald-600">{counts.videosPub}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 flex items-center gap-1">
                <History className="h-3 w-3 text-amber-500" /> Drafts
              </p>
              <p className="text-3xl font-heading text-amber-600">{counts.videosDraft}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30">Total</p>
              <p className="text-3xl font-heading text-rose-600/30">{totalVideos}</p>
            </div>
          </div>
        </Link>

      </div>

      {/* FOOTER DE CALIDAD */}
      <footer className="mt-16 flex flex-wrap items-center justify-center gap-12 border-t border-[color:var(--color-border)] pt-12 opacity-30 transition-opacity hover:opacity-60 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
          <BarChart3 className="h-3 w-3" /> SEO Optimized Core
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
          <CheckCircle2 className="h-3 w-3" /> Integrity Check Active
        </div>
      </footer>
      
    </main>
  );
}