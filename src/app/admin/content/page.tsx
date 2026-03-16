import 'server-only';

import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import type { Metadata } from 'next';
import { FileText, Video, PenTool, ArrowRight, LayoutDashboard, Globe } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contenido | Admin | KCE',
  robots: { index: false, follow: false },
};

async function getCounts() {
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
    <main className="space-y-10 pb-20">
      
      {/* Cabecera Ejecutiva */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Gestor de Contenidos (CMS)</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Control central del Blog, SEO y Vlog (YouTube) de KCE.
          </p>
        </div>
        <Link href="/admin" className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)] shadow-sm shrink-0">
          <LayoutDashboard className="h-3 w-3" /> Volver al Admin
        </Link>
      </div>

      {/* Banner de Estrategia */}
      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-10 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none"><Globe className="h-64 w-64 text-brand-blue" /></div>
        <div className="relative z-10 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-blue">
            <PenTool className="h-3 w-3" /> SEO & Marketing
          </div>
          <h2 className="font-heading text-2xl md:text-3xl text-[var(--color-text)] mb-3">Atrae viajeros orgánicamente</h2>
          <p className="text-sm font-light leading-relaxed text-[var(--color-text)]/70">
            El contenido es el combustible de tu embudo de ventas. Escribe artículos para posicionar en Google o enlaza tus videos de YouTube para nutrir a los leads que están considerando viajar a Colombia.
          </p>
        </div>
      </div>

      {/* Tarjetas de Módulos */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Módulo de Posts (Blog) */}
        <Link href="/admin/content/posts" className="group rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-brand-blue/30 relative overflow-hidden flex flex-col justify-between min-h-[240px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/20 group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30 group-hover:text-brand-blue transition-colors flex items-center gap-1">
                Abrir Blog <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"/>
              </div>
            </div>
            <h3 className="font-heading text-2xl text-[var(--color-text)] mb-2">Artículos (Blog)</h3>
            <p className="text-sm text-[var(--color-text)]/50 font-light line-clamp-2">Crea contenido escrito en formato Markdown, gestiona traducciones y mejora el SEO orgánico.</p>
          </div>
          
          <div className="mt-8 flex items-center gap-4 border-t border-[var(--color-border)] pt-5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-1">Publicados</div>
              <div className="font-heading text-2xl text-emerald-600">{counts.postsPub}</div>
            </div>
            <div className="h-8 w-px bg-[var(--color-border)]"></div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-1">Borradores</div>
              <div className="font-heading text-2xl text-amber-600">{counts.postsDraft}</div>
            </div>
            <div className="h-8 w-px bg-[var(--color-border)]"></div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-1">Total</div>
              <div className="font-heading text-2xl text-[var(--color-text)]/80">{totalPosts}</div>
            </div>
          </div>
        </Link>

        {/* Módulo de Videos (Vlog) */}
        <Link href="/admin/content/videos" className="group rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-brand-blue/30 relative overflow-hidden flex flex-col justify-between min-h-[240px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 border border-rose-500/20 group-hover:scale-110 transition-transform">
                <Video className="h-6 w-6" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30 group-hover:text-rose-600 transition-colors flex items-center gap-1">
                Abrir Vlog <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"/>
              </div>
            </div>
            <h3 className="font-heading text-2xl text-[var(--color-text)] mb-2">Videos (YouTube)</h3>
            <p className="text-sm text-[var(--color-text)]/50 font-light line-clamp-2">Sincroniza tus videos de YouTube con la plataforma web para nutrir visualmente a los clientes.</p>
          </div>
          
          <div className="mt-8 flex items-center gap-4 border-t border-[var(--color-border)] pt-5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-1">Publicados</div>
              <div className="font-heading text-2xl text-emerald-600">{counts.videosPub}</div>
            </div>
            <div className="h-8 w-px bg-[var(--color-border)]"></div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-1">Borradores</div>
              <div className="font-heading text-2xl text-amber-600">{counts.videosDraft}</div>
            </div>
            <div className="h-8 w-px bg-[var(--color-border)]"></div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-1">Total</div>
              <div className="font-heading text-2xl text-[var(--color-text)]/80">{totalVideos}</div>
            </div>
          </div>
        </Link>

      </div>
    </main>
  );
}