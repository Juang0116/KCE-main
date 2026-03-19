import type { Metadata } from 'next';
import Link from 'next/link';
import { Star, MessageSquare, Heart, Users, ArrowLeft, Sparkles, MapPin } from 'lucide-react';

import { ReviewForm } from '@/features/reviews/ReviewForm';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Deja tu reseña | KCE',
  description: 'Cuéntanos cómo fue tu experiencia. Tu opinión ayuda a otros viajeros a descubrir lo mejor de Colombia.',
  robots: { index: false, follow: false }, 
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getBookingInfo(bookingId: string | null) {
  if (!bookingId) return null;
  try {
    const admin = getSupabaseAdmin() as any;
    const { data } = await admin
      .from('bookings')
      .select('id, customer_name, tour_title, tour_slug, tour_date, status')
      .eq('id', bookingId)
      .eq('status', 'confirmed')
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string; tour?: string }>;
}) {
  const params = await searchParams;
  const bookingId = params.booking ?? null;
  const tourSlug = params.tour ?? null;
  const booking = await getBookingInfo(bookingId);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-24 pt-16 md:pt-24 animate-fade-in">
      <div className="mx-auto max-w-[var(--container-max)] px-6">
        
        {/* 01. ENCABEZADO (Editorial Style) */}
        <header className="mb-16 text-center flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark shadow-sm">
            <Star className="h-3 w-3 fill-brand-yellow text-brand-yellow" /> Tu opinión nos hace crecer
          </div>
          
          <h1 className="font-heading text-4xl leading-tight text-[var(--color-text)] md:text-6xl lg:text-7xl tracking-tight">
            ¿Cómo fue tu <br className="hidden md:block" />
            <span className="text-brand-blue italic font-light">experiencia?</span>
          </h1>

          {booking ? (
            <div className="mt-10 inline-flex flex-col items-center gap-2 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-soft animate-slide-up">
              <p className="text-lg font-light text-[var(--color-text-muted)]">
                {booking.customer_name ? `Hola ${booking.customer_name}, ` : ''} 
                nos encantaría saber qué tal estuvo:
              </p>
              <div className="flex items-center gap-3 text-brand-blue font-heading text-2xl">
                <MapPin className="h-6 w-6" /> {booking.tour_title}
              </div>
              {booking.tour_date && (
                <div className="mt-2 rounded-full bg-[var(--color-surface-2)] px-4 py-1 border border-[var(--color-border)]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                    {new Date(booking.tour_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-[var(--color-text-muted)] md:text-xl">
              Tu reseña ayuda a futuros viajeros a elegir con confianza y apoya directamente el trabajo de nuestros guías locales.
            </p>
          )}
        </header>

        {/* 02. GRID DE CONTENIDO */}
        <div className="grid gap-12 lg:grid-cols-[1fr_360px] items-start">
          
          {/* EL FORMULARIO (Clean Canvas) */}
          <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-12 lg:p-16 shadow-soft relative overflow-hidden group">
            {/* Sutil glow de fondo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="mb-12 flex items-center gap-5 border-b border-[var(--color-border)] pb-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-brand-blue shadow-sm group-hover:scale-110 transition-transform">
                <MessageSquare className="h-7 w-7" />
              </div>
              <div>
                <h2 className="font-heading text-2xl text-[var(--color-text)]">Escribe tu reseña</h2>
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em] opacity-60">Feedback constructivo</p>
              </div>
            </div>

            <div className="review-form-wrapper animate-slide-up">
              <ReviewForm tourSlug={booking?.tour_slug ?? tourSlug ?? ''} />
            </div>
          </section>

          {/* SIDEBAR (The "Why" - Editorial Card) */}
          <aside className="space-y-8 sticky top-24">
            <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-10 shadow-inner group">
              <h3 className="font-heading text-2xl text-[var(--color-text)] mb-8 tracking-tight">¿Por qué reseñar?</h3>
              
              <ul className="space-y-10">
                <li className="flex gap-5">
                  <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-red-400 shadow-sm group-hover:-rotate-6 transition-transform">
                    <Heart className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text)]">Apoyo Local</p>
                    <p className="mt-1.5 text-sm font-light leading-relaxed text-[var(--color-text-muted)]">Tus palabras motivan a los guías que te acompañaron en la ruta.</p>
                  </div>
                </li>
                <li className="flex gap-5">
                  <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-brand-blue shadow-sm group-hover:rotate-6 transition-transform">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text)]">Comunidad</p>
                    <p className="mt-1.5 text-sm font-light leading-relaxed text-[var(--color-text-muted)]">Ayudas a otros viajeros a descubrir joyas ocultas en Colombia.</p>
                  </div>
                </li>
                <li className="flex gap-5">
                  <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-brand-yellow shadow-sm group-hover:-rotate-6 transition-transform">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text)]">Mejora Continua</p>
                    <p className="mt-1.5 text-sm font-light leading-relaxed text-[var(--color-text-muted)]">KCE utiliza tu feedback para perfeccionar cada detalle logístico.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="px-4">
              <Button asChild variant="ghost" className="w-full text-[var(--color-text-muted)] hover:text-brand-blue hover:bg-transparent transition-all group">
                <Link href="/tours" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]">
                  <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /> Volver al catálogo
                </Link>
              </Button>
            </div>
          </aside>
        </div>

      </div>
    </main>
  );
}