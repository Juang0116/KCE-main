// src/app/(marketing)/review/page.tsx
import type { Metadata } from 'next';
import { Star, MessageSquare, Quote, Heart } from 'lucide-react';
import { ReviewForm } from '@/features/reviews/ReviewForm';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const metadata: Metadata = {
  title: 'Deja tu reseña | KCE',
  description:
    'Cuéntanos cómo fue tu experiencia. Tu opinión ayuda a otros viajeros a descubrir lo mejor de Colombia.',
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
    <main className="relative min-h-screen animate-fade-in overflow-hidden bg-base pb-24 pt-20 md:pt-32">
      {/* Glows ambientales sutiles */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-full max-w-4xl -translate-x-1/2 rounded-full bg-brand-yellow/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-brand-blue/5 blur-[100px]" />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-6">
        {/* 01. HEADER EDITORIAL */}
        <header className="mb-16 flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue shadow-sm backdrop-blur-md">
            <Star className="h-3.5 w-3.5 fill-brand-yellow text-brand-yellow" /> Tu opinión nos
            importa
          </div>

          <h1 className="mb-6 font-heading text-4xl leading-[1.1] tracking-tight text-main md:text-6xl">
            ¿Cómo fue tu <br />
            <span className="font-light italic text-brand-blue opacity-90">experiencia KCE?</span>
          </h1>

          <div className="mx-auto max-w-xl">
            {booking ? (
              <p className="text-lg font-light leading-relaxed text-muted md:text-xl">
                {booking.customer_name ? `Hola ${booking.customer_name}, ` : ''}
                queremos saber cada detalle de tu paso por <br />
                <strong className="font-bold text-main">&quot;{booking.tour_title}&quot;</strong>
                {booking.tour_date ? (
                  <span className="mt-2 block text-sm uppercase tracking-widest opacity-60">
                    Misión cumplida el{' '}
                    {new Date(booking.tour_date).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </span>
                ) : (
                  ''
                )}
              </p>
            ) : (
              <p className="text-lg font-light leading-relaxed text-muted md:text-xl">
                Tu relato ayuda a otros viajeros a descubrir la verdadera Colombia y apoya
                directamente el crecimiento de nuestros guías locales.
              </p>
            )}
          </div>
        </header>

        {/* 02. ZONA DE FORMULARIO (Tarjeta Premium) */}
        <section className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5 md:p-14">
          {/* Línea decorativa superior */}
          <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-brand-yellow/40 via-brand-blue/40 to-brand-yellow/40" />

          <div className="relative z-10">
            <div className="mb-10 flex items-center gap-4 border-b border-brand-dark/5 pb-8 dark:border-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-blue/10 bg-brand-blue/5 text-brand-blue">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading text-2xl tracking-tight text-main">
                  Escribe tu crónica
                </h2>
                <p className="text-xs font-bold uppercase tracking-widest text-muted opacity-60">
                  Paso único: Califica y comenta
                </p>
              </div>
            </div>

            <ReviewForm tourSlug={booking?.tour_slug ?? tourSlug ?? ''} />
          </div>
        </section>

        {/* 03. NOTA DE IMPACTO SOCIAL */}
        <footer className="mt-16 grid gap-8 sm:grid-cols-2">
          <div className="flex items-start gap-4 rounded-2xl border border-brand-dark/5 bg-surface-2 p-6">
            <Heart className="h-5 w-5 shrink-0 text-brand-terra" />
            <p className="text-sm font-light leading-relaxed text-muted">
              <strong className="font-medium text-main">Impacto local:</strong> Tus palabras son el
              mejor incentivo para los guías y anfitriones que hacen posible KCE.
            </p>
          </div>
          <div className="flex items-start gap-4 rounded-2xl border border-brand-dark/5 bg-surface-2 p-6">
            <Quote className="h-5 w-5 shrink-0 text-brand-blue" />
            <p className="text-sm font-light leading-relaxed text-muted">
              <strong className="font-medium text-main">Comunidad:</strong> Al publicar tu reseña,
              inspiras a futuros exploradores a viajar con sentido cultural.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
