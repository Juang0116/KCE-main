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
    <main className="min-h-screen bg-[var(--color-bg)] pb-24 pt-12 md:pt-20">
      <div className="mx-auto max-w-4xl px-6">
        
        {/* ENCABEZADO ELEGANTE */}
        <header className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark shadow-sm">
            <Star className="h-3 w-3 fill-brand-yellow" /> Tu opinión nos hace crecer
          </div>
          
          <h1 className="font-heading text-4xl leading-tight text-brand-blue md:text-6xl">
            ¿Cómo fue tu experiencia?
          </h1>

          {booking ? (
            <div className="mt-8 inline-flex flex-col items-center gap-2 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <p className="text-lg font-light text-[var(--color-text)]/70">
                {booking.customer_name ? `Hola ${booking.customer_name}, ` : ''} 
                nos encantaría saber qué tal estuvo:
              </p>
              <div className="flex items-center gap-2 text-brand-blue font-heading text-xl">
                <MapPin className="h-5 w-5" /> {booking.tour_title}
              </div>
              {booking.tour_date && (
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text)]/40">
                  {new Date(booking.tour_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          ) : (
            <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-[var(--color-text)]/70">
              Tu reseña ayuda a futuros viajeros a elegir con confianza y apoya directamente el trabajo de nuestros guías y aliados locales.
            </p>
          )}
        </header>

        {/* EL FORMULARIO (BOVEDA PREMIUM) */}
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          
          <section className="overflow-hidden rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-12 shadow-2xl relative">
            {/* Línea de acento superior */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-yellow via-brand-blue to-brand-yellow"></div>
            
            <div className="mb-10 flex items-center gap-4 border-b border-[var(--color-border)] pb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading text-2xl text-brand-blue">Escribe tu reseña</h2>
                <p className="text-xs font-light text-[var(--color-text)]/50 uppercase tracking-widest">Feedback constructivo</p>
              </div>
            </div>

            <ReviewForm tourSlug={booking?.tour_slug ?? tourSlug ?? ''} />
          </section>

          {/* SIDEBAR DE IMPACTO EMOCIONAL */}
          <aside className="space-y-6">
            <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-8 shadow-inner">
              <h3 className="font-heading text-xl text-brand-blue mb-6">¿Por qué reseñar?</h3>
              
              <ul className="space-y-8">
                <li className="flex gap-4">
                  <Heart className="h-5 w-5 text-red-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-brand-blue">Apoyo Local</p>
                    <p className="mt-1 text-xs font-light leading-relaxed text-[var(--color-text)]/60">Tus palabras motivan a los guías que te acompañaron en la ruta.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Users className="h-5 w-5 text-brand-blue shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-brand-blue">Comunidad</p>
                    <p className="mt-1 text-xs font-light leading-relaxed text-[var(--color-text)]/60">Ayudas a otros viajeros a descubrir joyas ocultas en Colombia.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Sparkles className="h-5 w-5 text-brand-yellow shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-brand-blue">Mejora Continua</p>
                    <p className="mt-1 text-xs font-light leading-relaxed text-[var(--color-text)]/60">KCE utiliza tu feedback para perfeccionar cada detalle logístico.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="px-4">
              <Button asChild variant="ghost" className="w-full text-[var(--color-text)]/40 hover:text-brand-blue transition-colors">
                <Link href="/tours" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                  <ArrowLeft className="h-3 w-3" /> Volver al catálogo
                </Link>
              </Button>
            </div>
          </aside>
        </div>

      </div>
    </main>
  );
}