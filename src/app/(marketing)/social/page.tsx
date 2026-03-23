/* src/app/(marketing)/social/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  Share2, Globe, Play, BookOpen, 
  ArrowRight, HeartHandshake, ShieldCheck, 
  Sparkles, MessageCircle, Youtube, Instagram
} from 'lucide-react';

import SocialLinks from '@/components/SocialLinks';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Redes y contenido — KCE',
  description: 'Canales oficiales de Knowing Cultures Enterprise: Historias y comunidad global.',
  robots: { index: false, follow: true },
};

export default function SocialPage() {
  return (
    <main className="min-h-screen bg-base pb-24 animate-fade-in">
      
      {/* 01. HERO SOCIAL (ADN KCE PREMIUM) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center border-b border-brand-dark/10">
        {/* Glows de fondo */}
        <div className="absolute top-0 left-1/2 w-full max-w-4xl h-80 bg-brand-blue/10 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-xl backdrop-blur-md">
            <Share2 className="h-3.5 w-3.5 text-brand-yellow" /> Canales Oficiales
          </div>
          
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-white tracking-tight leading-[1.05] mb-8">
            Redes & <br />
            <span className="text-brand-yellow font-light italic opacity-90">Contenido.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg md:text-xl font-light leading-relaxed text-white/70">
            Sigue nuestra huella digital. Validamos cada historia y cada ruta a través de nuestras comunidades oficiales alrededor del mundo.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button asChild className="rounded-full bg-brand-blue text-white hover:bg-brand-dark px-8 py-6 h-auto shadow-pop transition-transform hover:-translate-y-1">
              <Link href="/tours" className="text-xs font-bold uppercase tracking-widest">Explorar Tours</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/20 text-white bg-white/5 hover:bg-white hover:text-brand-dark px-8 py-6 h-auto backdrop-blur-md transition-all">
              <Link href="/plan" className="text-xs font-bold uppercase tracking-widest">Plan Personalizado</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 02. ÁREA DE CONTENIDO PRINCIPAL */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 -mt-16 relative z-20 space-y-12 md:space-y-16">
        
        {/* TARJETA PRIMARIA: PRESENCIA GLOBAL */}
        <div className="overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-soft group">
          <div className="grid lg:grid-cols-[1fr_400px]">
            
            <div className="p-8 md:p-16 lg:p-20">
              <header className="flex items-center gap-5 mb-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/5 border border-brand-blue/10 text-brand-blue shadow-sm transition-transform group-hover:scale-110 duration-500">
                  <Globe className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="font-heading text-3xl md:text-4xl text-main tracking-tight">Presencia Global</h2>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] opacity-60">Comunidad KCE</p>
                </div>
              </header>
              
              <p className="text-lg md:text-xl font-light leading-relaxed text-muted mb-12 max-w-2xl">
                Asegúrate de seguir nuestros perfiles oficiales. Si compartes un enlace de nuestra plataforma, el preview mostrará siempre nuestra identidad visual y sellos de seguridad.
              </p>

              <div className="animate-slide-up">
                <SocialLinks variant="solid" />
              </div>

              {/* Security/Tip Box */}
              <div className="mt-16 rounded-2xl border border-brand-yellow/20 bg-brand-yellow/[0.03] p-8 flex flex-col sm:flex-row gap-6 items-start transition-all hover:bg-brand-yellow/[0.06]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-yellow text-brand-dark shadow-pop">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-dark uppercase tracking-widest mb-2 italic">Tip de Compartido</p>
                  <p className="text-sm font-light text-muted leading-relaxed">
                    Si el preview de un enlace no carga instantáneamente en WhatsApp o Instagram, suele ser por la caché local. Prueba reenviar el link unos minutos después para refrescar la meta-data oficial.
                  </p>
                </div>
              </div>
            </div>

            {/* SIDEBAR CTA (Trust Layer Premium) */}
            <div className="bg-brand-dark p-12 md:p-16 text-white flex flex-col justify-center relative overflow-hidden">
              {/* Brillo decorativo */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/20 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2" />
              
              <div className="relative z-10">
                <ShieldCheck className="h-14 w-14 text-brand-yellow mb-8" />
                <h3 className="font-heading text-3xl mb-6 leading-tight tracking-tight">Capa de <br/><span className="text-brand-yellow italic font-light">Confianza.</span></h3>
                <p className="text-base font-light leading-relaxed text-white/60 mb-10">
                  El contenido editorial en redes sirve para darte contexto e inspiración. Para una recomendación técnica, nuestro equipo humano te espera en el portal.
                </p>
                <Button asChild className="w-full rounded-full bg-brand-blue text-white hover:bg-white hover:text-brand-dark shadow-pop py-7 h-auto group border border-transparent hover:border-white/10 transition-all">
                  <Link href="/contact" className="text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3">
                    Hablar con Concierge <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>

          </div>
        </div>

        {/* EDITORIAL GRID (Blog & Vlog) */}
        <div className="grid gap-8 md:grid-cols-2">
          
          {/* BLOG CARD */}
          <div className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 md:p-14 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-pop">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-brand-blue transition-transform duration-1000 group-hover:scale-125 group-hover:rotate-6">
                <BookOpen className="h-40 w-40" />
              </div>
              <div className="relative z-10">
                <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/5 border border-brand-blue/10 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all duration-500 shadow-sm">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h3 className="font-heading text-3xl text-main mb-4 tracking-tight">Revista Editorial</h3>
                <p className="text-base font-light leading-relaxed text-muted mb-10 max-w-xs">
                  Artículos profundos sobre cultura, gastronomía y consejos para viajar por Colombia con un propósito real.
                </p>
                <Button asChild variant="ghost" className="p-0 h-auto text-brand-blue hover:bg-transparent group/btn">
                  <Link href="/blog" className="flex items-center gap-3 font-bold uppercase tracking-widest text-[10px]">
                    Explorar Crónicas <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-2" />
                  </Link>
                </Button>
              </div>
          </div>

          {/* VLOG CARD */}
          <div className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 md:p-14 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-pop">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-brand-terra transition-transform duration-1000 group-hover:scale-125 group-hover:-rotate-6">
                <Play className="h-40 w-40" />
              </div>
              <div className="relative z-10">
                <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-terra/5 border border-brand-terra/10 text-brand-terra group-hover:bg-brand-terra group-hover:text-white transition-all duration-500 shadow-sm">
                  <Play className="h-8 w-8" />
                </div>
                <h3 className="font-heading text-3xl text-main mb-4 tracking-tight">Vlog Visual</h3>
                <p className="text-base font-light leading-relaxed text-muted mb-10 max-w-xs">
                  Historias grabadas en el terreno. La forma más inmersiva de sentir la energía de nuestras experiencias.
                </p>
                <Button asChild variant="ghost" className="p-0 h-auto text-brand-terra hover:bg-transparent group/btn">
                  <Link href="/vlog" className="flex items-center gap-3 font-bold uppercase tracking-widest text-[10px]">
                    Ver Expediciones <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-2" />
                  </Link>
                </Button>
              </div>
          </div>

        </div>

        {/* 03. FOOTER NAVEGACIÓN MINIMALISTA */}
        <footer className="mt-24 flex flex-wrap justify-center gap-10 border-t border-brand-dark/5 dark:border-white/5 pt-16 pb-8">
          {['Contacto', 'FAQ', 'Términos', 'Inicio'].map((item) => (
            <Link 
              key={item}
              href={item === 'Inicio' ? '/' : `/${item.toLowerCase()}`}
              className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted hover:text-brand-blue transition-colors relative group"
            >
              {item}
              <span className="absolute -bottom-2 left-0 w-0 h-px bg-brand-blue transition-all group-hover:w-full" />
            </Link>
          ))}
        </footer>

      </section>

      {/* Floating Support (Diseño KCE Boutique) */}
      <div className="fixed bottom-8 right-8 md:bottom-12 md:right-12 z-50">
        <Button asChild size="icon" className="h-16 w-16 md:h-20 md:w-20 rounded-[2rem] bg-green-600 shadow-pop hover:bg-green-700 transition-all hover:scale-110 hover:-rotate-6 border-4 border-white dark:border-brand-dark">
          <Link href="/contact" aria-label="Contact concierge">
            <MessageCircle className="h-7 w-7 md:h-9 md:w-9 text-white fill-current" />
          </Link>
        </Button>
      </div>

    </main>
  );
}