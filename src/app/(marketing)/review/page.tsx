// src/app/(marketing)/review/page.tsx
import type { Metadata } from 'next';
import { Star, MessageSquare, Quote, Heart } from 'lucide-react';
import { ReviewForm } from '@/features/reviews/ReviewForm';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const metadata: Metadata = {
  title: 'Deja tu reseña | KCE',
  description: 'Cuéntanos cómo fue tu experiencia. Tu opinión ayuda a otros viajeros a descubrir lo mejor de Colombia.',
  robots: { index: false, follow: false }, // Link privado enviado por el concierge
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
    <main className="min-h-screen bg-base pb-24 pt-20 md:pt-32 animate-fade-in relative overflow-hidden">
      
      {/* Glows ambientales sutiles */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-brand-yellow/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto w-full max-w-3xl px-6 relative z-10">
        
        {/* 01. HEADER EDITORIAL */}
        <header className="mb-16 text-center flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue shadow-sm backdrop-blur-md">
            <Star className="h-3.5 w-3.5 text-brand-yellow fill-brand-yellow" /> Tu opinión nos importa
          </div>
          
          <h1 className="font-heading text-4xl md:text-6xl text-main tracking-tight leading-[1.1] mb-6">
            ¿Cómo fue tu <br/>
            <span className="text-brand-blue italic font-light opacity-90">experiencia KCE?</span>
          </h1>

          <div className="max-w-xl mx-auto">
            {booking ? (
              <p className="text-lg md:text-xl font-light leading-relaxed text-muted">
                {booking.customer_name ? `Hola ${booking.customer_name}, ` : ''} 
                queremos saber cada detalle de tu paso por <br/>
                <strong className="text-main font-bold">&quot;{booking.tour_title}&quot;</strong>
                {booking.tour_date ? (
                  <span className="block mt-2 text-sm uppercase tracking-widest opacity-60">
                    Misión cumplida el {new Date(booking.tour_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
                  </span>
                ) : ''}
              </p>
            ) : (
              <p className="text-lg md:text-xl font-light leading-relaxed text-muted">
                Tu relato ayuda a otros viajeros a descubrir la verdadera Colombia y apoya directamente el crecimiento de nuestros guías locales.
              </p>
            )}
          </div>
        </header>

        {/* 02. ZONA DE FORMULARIO (Tarjeta Premium) */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 md:p-14 shadow-pop relative overflow-hidden group">
          {/* Línea decorativa superior */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-yellow/40 via-brand-blue/40 to-brand-yellow/40" />
          
          <div className="relative z-10">
            <div className="mb-10 flex items-center gap-4 border-b border-brand-dark/5 dark:border-white/5 pb-8">
               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/5 border border-brand-blue/10 text-brand-blue">
                  <MessageSquare className="h-6 w-6" />
               </div>
               <div>
                  <h2 className="font-heading text-2xl text-main tracking-tight">Escribe tu crónica</h2>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted opacity-60">Paso único: Califica y comenta</p>
               </div>
            </div>

            <ReviewForm tourSlug={booking?.tour_slug ?? tourSlug ?? ''} />
          </div>
        </section>

        {/* 03. NOTA DE IMPACTO SOCIAL */}
        <footer className="mt-16 grid gap-8 sm:grid-cols-2">
          <div className="flex items-start gap-4 p-6 rounded-2xl bg-surface-2 border border-brand-dark/5">
            <Heart className="h-5 w-5 text-brand-terra shrink-0" />
            <p className="text-sm font-light text-muted leading-relaxed">
              <strong className="text-main font-medium">Impacto local:</strong> Tus palabras son el mejor incentivo para los guías y anfitriones que hacen posible KCE.
            </p>
          </div>
          <div className="flex items-start gap-4 p-6 rounded-2xl bg-surface-2 border border-brand-dark/5">
            <Quote className="h-5 w-5 text-brand-blue shrink-0" />
            <p className="text-sm font-light text-muted leading-relaxed">
              <strong className="text-main font-medium">Comunidad:</strong> Al publicar tu reseña, inspiras a futuros exploradores a viajar con sentido cultural.
            </p>
          </div>
        </footer>

      </div>
    </main>
  );
}