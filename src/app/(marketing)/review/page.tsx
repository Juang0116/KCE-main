// src/app/(marketing)/review/page.tsx
import type { Metadata } from 'next';
import { ReviewForm } from '@/features/reviews/ReviewForm';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const metadata: Metadata = {
  title: 'Deja tu reseña | KCE',
  description: 'Cuéntanos cómo fue tu experiencia. Tu opinión ayuda a otros viajeros a descubrir lo mejor de Colombia.',
  robots: { index: false, follow: false }, // private link sent by agent
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
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-yellow/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-dark">
          ⭐ Tu opinión importa
        </div>
        <h1 className="font-heading text-3xl font-semibold text-[color:var(--color-text)]">
          ¿Cómo fue tu experiencia?
        </h1>
        {booking ? (
          <p className="mt-3 text-[color:var(--color-text-muted)]">
            {booking.customer_name ? `Hola ${booking.customer_name}. ` : ''}
            Cuéntanos cómo estuvo{' '}
            <strong className="text-[color:var(--color-text)]">{booking.tour_title}</strong>
            {booking.tour_date ? ` el ${new Date(booking.tour_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}` : ''}.
          </p>
        ) : (
          <p className="mt-3 text-[color:var(--color-text-muted)]">
            Tu reseña ayuda a otros viajeros a descubrir lo mejor de Colombia y apoya directamente a nuestros guías locales.
          </p>
        )}
      </div>

      <ReviewForm tourSlug={booking?.tour_slug ?? tourSlug ?? ''} />
    </main>
  );
}
