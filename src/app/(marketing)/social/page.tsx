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
    <main className="min-h-screen bg-[var(--color-bg)] pb-24">
      
      {/* HERO SOCIAL (DARK PREMIUM) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-20 md:py-28 text-center text-white shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.png')] bg-repeat"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md">
            <Share2 className="h-3 w-3" /> Canales Oficiales
          </div>
          <h1 className="font-heading text-4xl leading-tight md:text-6xl drop-shadow-md">
            Redes & Contenido.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl">
            Sigue nuestra huella digital. Validamos cada historia y cada ruta a través de nuestras comunidades oficiales en el mundo.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/5 px-6">
              <Link href="/tours">Explorar Tours</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/5 px-6">
              <Link href="/plan">Plan Personalizado</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* GRID DE CARTAS (EL VAULT) */}
      <section className="mx-auto max-w-6xl px-6 -mt-10 relative z-20 space-y-8">
        
        {/* CARTA PRINCIPAL: REDES */}
        <div className="overflow-hidden rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
          <div className="grid lg:grid-cols-[1fr_0.8fr]">
            
            <div className="p-10 md:p-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl text-brand-blue">Presencia Global</h2>
                  <p className="text-xs font-light text-[var(--color-text)]/40 uppercase tracking-widest">Nuestras Redes</p>
                </div>
              </div>
              
              <p className="text-base font-light leading-relaxed text-[var(--color-text)]/70 mb-10">
                Asegúrate de seguir los canales oficiales para evitar perfiles falsos. Si compartes un enlace de KCE, el preview en redes debe mostrar siempre nuestra identidad visual.
              </p>

              <div className="social-links-wrapper scale-110 origin-left">
                <SocialLinks variant="solid" />
              </div>

              <div className="mt-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-yellow/20 text-brand-dark">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-blue uppercase tracking-widest mb-1">Tip de Compartido</p>
                  <p className="text-xs font-light text-[var(--color-text)]/60 leading-relaxed">
                    Si el preview de un enlace no carga en WhatsApp o Instagram, suele ser por la caché de la aplicación. Prueba reenviar el link unos minutos después.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA SECUNDARIO DERECHA */}
            <div className="bg-brand-blue p-10 md:p-16 text-white flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-white/10">
              <ShieldCheck className="h-12 w-12 text-brand-yellow mb-6" />
              <h3 className="font-heading text-2xl mb-4">Capa de Confianza</h3>
              <p className="text-sm font-light leading-relaxed text-white/70 mb-8">
                El contenido editorial en redes sirve para darte contexto y seguridad. Sin embargo, para una recomendación técnica y comercial, nuestro equipo humano te espera en el portal de KCE.
              </p>
              <Button asChild className="rounded-full bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90 shadow-lg">
                <Link href="/contact">Hablar con KCE <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>

          </div>
        </div>

        {/* CONTENIDO EDITORIAL GRID */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* BLOG */}
          <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 shadow-lg group transition-all hover:shadow-2xl">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-brand-blue/5 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all">
              <BookOpen className="h-7 w-7" />
            </div>
            <h3 className="font-heading text-2xl text-brand-blue mb-4">Blog KCE</h3>
            <p className="text-sm font-light leading-relaxed text-[var(--color-text)]/60 mb-8">
              Artículos profundos sobre cultura, gastronomía y consejos prácticos para viajar por Colombia con propósito.
            </p>
            <Button asChild variant="ghost" className="p-0 text-brand-blue hover:bg-transparent hover:translate-x-2 transition-transform">
              <Link href="/blog" className="flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
                Explorar Guías <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          {/* VLOG */}
          <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 shadow-lg group transition-all hover:shadow-2xl">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-brand-blue/5 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all">
              <Play className="h-7 w-7" />
            </div>
            <h3 className="font-heading text-2xl text-brand-blue mb-4">Vlog Visual</h3>
            <p className="text-sm font-light leading-relaxed text-[var(--color-text)]/60 mb-8">
              Historias grabadas en el terreno. La forma más directa de sentir la energía de nuestras experiencias antes de reservar.
            </p>
            <Button asChild variant="ghost" className="p-0 text-brand-blue hover:bg-transparent hover:translate-x-2 transition-transform">
              <Link href="/vlog" className="flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
                Ver Videos <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

        </div>

        {/* FOOTER NAVEGACIÓN SOCIAL */}
        <footer className="mt-12 flex flex-wrap justify-center gap-8 border-t border-[var(--color-border)] pt-12">
          {['Contacto', 'FAQ', 'Términos', 'Inicio'].map((item) => (
            <Link 
              key={item}
              href={item === 'Inicio' ? '/' : `/${item.toLowerCase()}`}
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40 hover:text-brand-blue transition-colors"
            >
              {item}
            </Link>
          ))}
        </footer>

      </section>

      {/* Soporte Flotante sutil (Opcional) */}
      <div className="fixed bottom-8 right-8 z-50">
        <Button asChild size="icon" className="h-14 w-14 rounded-full bg-emerald-500 shadow-2xl hover:bg-emerald-600 transition-transform hover:scale-110">
          <Link href="/contact"><MessageCircle className="h-6 w-6 text-white" /></Link>
        </Button>
      </div>

    </main>
  );
}