import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  Share2, Globe, Play, BookOpen, 
  ArrowRight, HeartHandshake, ShieldCheck, 
  Sparkles, MessageCircle 
} from 'lucide-react';

import SocialLinks from '@/components/SocialLinks';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Redes y contenido — KCE',
  description: 'Canales oficiales de Knowing Cultures Enterprise: Facebook, Instagram, TikTok, YouTube y X.',
  robots: { index: false, follow: true },
};

export default function SocialPage() {
  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] pb-24 animate-fade-in">
      
      {/* 01. HERO SOCIAL (Refined Branding) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center text-white">
        {/* Pattern & Glow Overlay */}
        <div className="absolute inset-0 opacity-5 bg-[url('/brand/pattern.png')] bg-repeat" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/50 via-brand-dark to-[var(--color-bg)]" />
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue backdrop-blur-sm shadow-xl">
            <Share2 className="h-3.5 w-3.5" /> Canales Oficiales
          </div>
          
          <h1 className="font-heading text-5xl leading-[1.1] md:text-7xl lg:text-8xl tracking-tight mb-8">
            Redes & <br />
            <span className="text-brand-blue italic font-light">Contenido.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-white/60 md:text-xl">
            Sigue nuestra huella digital. Validamos cada historia y cada ruta a través de nuestras comunidades oficiales en el mundo.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button asChild variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10 px-8 py-6 h-auto">
              <Link href="/tours" className="text-xs font-bold uppercase tracking-widest">Explorar Tours</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10 px-8 py-6 h-auto">
              <Link href="/plan" className="text-xs font-bold uppercase tracking-widest">Plan Personalizado</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 02. MAIN CONTENT AREA */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 -mt-16 relative z-20 space-y-12">
        
        {/* PRIMARY CARD: GLOBAL PRESENCE */}
        <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-soft group">
          <div className="grid lg:grid-cols-[1fr_400px]">
            
            <div className="p-10 md:p-16 lg:p-20">
              <header className="flex items-center gap-5 mb-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] text-brand-blue shadow-sm transition-transform group-hover:scale-110">
                  <Globe className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="font-heading text-3xl text-[color:var(--color-text)] tracking-tight">Presencia Global</h2>
                  <p className="text-[10px] font-bold text-[color:var(--color-text-muted)] uppercase tracking-[0.2em] opacity-60">Nuestras Redes</p>
                </div>
              </header>
              
              <p className="text-lg font-light leading-relaxed text-[color:var(--color-text-muted)] mb-12 max-w-xl">
                Asegúrate de seguir los canales oficiales para evitar perfiles falsos. Si compartes un enlace de KCE, el preview debe mostrar siempre nuestra identidad visual.
              </p>

              <div className="social-links-container animate-slide-up">
                <SocialLinks variant="solid" />
              </div>

              {/* Security/Tip Box */}
              <div className="mt-16 rounded-2xl border border-brand-yellow/20 bg-brand-yellow/[0.03] p-8 flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-yellow text-brand-blue shadow-pop">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-blue uppercase tracking-[0.15em] mb-2 italic">Tip de Compartido</p>
                  <p className="text-sm font-light text-[color:var(--color-text-muted)] leading-relaxed">
                    Si el preview de un enlace no carga en WhatsApp o Instagram, suele ser por la caché de la aplicación. Prueba reenviar el link unos minutos después para refrescar la meta-data.
                  </p>
                </div>
              </div>
            </div>

            {/* SIDEBAR CTA (Trust Layer) */}
            <div className="bg-brand-blue p-12 md:p-16 text-white flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
              
              <ShieldCheck className="relative z-10 h-14 w-14 text-brand-yellow mb-8" />
              <h3 className="relative z-10 font-heading text-3xl mb-6 leading-tight">Capa de <br/>Confianza</h3>
              <p className="relative z-10 text-base font-light leading-relaxed text-white/70 mb-10">
                El contenido editorial en redes sirve para darte contexto y seguridad. Para una recomendación técnica y comercial, nuestro equipo humano te espera en el portal oficial.
              </p>
              <Button asChild className="relative z-10 rounded-full bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90 shadow-pop py-7 h-auto group">
                <Link href="/contact" className="text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3">
                  Hablar con KCE <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

          </div>
        </div>

        {/* EDITORIAL GRID (Blog & Vlog) */}
        <div className="grid gap-8 md:grid-cols-2">
          
          {/* BLOG CARD */}
          <div className="rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-12 shadow-soft group transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 text-brand-blue transition-transform group-hover:scale-150">
                <BookOpen className="h-32 w-32" />
             </div>
             <div className="relative z-10">
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all duration-500 shadow-sm">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h3 className="font-heading text-3xl text-[color:var(--color-text)] mb-4 tracking-tight">Blog KCE</h3>
                <p className="text-base font-light leading-relaxed text-[color:var(--color-text-muted)] mb-10 max-w-xs">
                  Artículos profundos sobre cultura, gastronomía y consejos para viajar por Colombia con propósito.
                </p>
                <Button asChild variant="ghost" className="p-0 h-auto text-brand-blue hover:bg-transparent group/btn">
                  <Link href="/blog" className="flex items-center gap-3 font-bold uppercase tracking-[0.2em] text-[10px]">
                    Explorar Guías <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-2" />
                  </Link>
                </Button>
             </div>
          </div>

          {/* VLOG CARD */}
          <div className="rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-12 shadow-soft group transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 text-brand-blue transition-transform group-hover:scale-150">
                <Play className="h-32 w-32" />
             </div>
             <div className="relative z-10">
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all duration-500 shadow-sm">
                  <Play className="h-8 w-8" />
                </div>
                <h3 className="font-heading text-3xl text-[color:var(--color-text)] mb-4 tracking-tight">Vlog Visual</h3>
                <p className="text-base font-light leading-relaxed text-[color:var(--color-text-muted)] mb-10 max-w-xs">
                  Historias grabadas en el terreno. La forma más directa de sentir la energía de nuestras experiencias.
                </p>
                <Button asChild variant="ghost" className="p-0 h-auto text-brand-blue hover:bg-transparent group/btn">
                  <Link href="/vlog" className="flex items-center gap-3 font-bold uppercase tracking-[0.2em] text-[10px]">
                    Ver Videos <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-2" />
                  </Link>
                </Button>
             </div>
          </div>

        </div>

        {/* 03. MINIMAL FOOTER NAVEGACIÓN */}
        <footer className="mt-20 flex flex-wrap justify-center gap-10 border-t border-[color:var(--color-border)] pt-16 pb-8">
          {['Contacto', 'FAQ', 'Términos', 'Inicio'].map((item) => (
            <Link 
              key={item}
              href={item === 'Inicio' ? '/' : `/${item.toLowerCase()}`}
              className="text-[10px] font-bold uppercase tracking-[0.3em] text-[color:var(--color-text-muted)] hover:text-brand-blue transition-colors relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-0 after:h-[1px] after:bg-brand-blue hover:after:w-full after:transition-all"
            >
              {item}
            </Link>
          ))}
        </footer>

      </section>

      {/* Floating Support (Zero-Pattern Style) */}
      <div className="fixed bottom-10 right-10 z-50">
        <Button asChild size="icon" className="h-16 w-16 rounded-2xl bg-emerald-500 shadow-pop hover:bg-emerald-600 transition-all hover:scale-110 hover:-rotate-6 border-4 border-white">
          <Link href="/contact" aria-label="Contact support">
            <MessageCircle className="h-7 w-7 text-white fill-current" />
          </Link>
        </Button>
      </div>

    </main>
  );
}