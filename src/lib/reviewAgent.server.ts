// src/lib/reviewAgent.server.ts
// Review Agent — sends review request emails to customers who toured yesterday.
import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';
import { agentGenerate } from '@/lib/agentAI.server';
import { absUrl } from '@/lib/env';

async function draftReviewRequest(tourName: string, customerName: string): Promise<string> {
  return agentGenerate({
    systemPrompt: `Eres el Director de Experiencia de KCE (Knowing Cultures Enterprise).
El cliente acaba de completar un tour y quieres pedirle una reseña.
Escribe un correo CORTO, CÁLIDO y MUY AGRADECIDO.
Reglas:
1. Trátalo de tú. Tono humano, cercano y local (eres colombiano).
2. Di que sus comentarios ayudan a otros viajeros a descubrir la verdadera Colombia y apoyan directamente a los guías locales.
3. NO incluyas URLs ni botones — el sistema los inyectará automáticamente.
4. Despídete como "El equipo de Experiencia de KCE".`,
    userMessage: `Cliente: ${customerName || 'Viajero'} | Tour completado: ${tourName}`,
    temperature: 0.7,
    maxTokens: 350,
    fallback: `Hola ${customerName} 🌿 ¡Gracias por viajar con KCE! Esperamos que hayas disfrutado ${tourName}. Nos encantaría conocer tu opinión para seguir mejorando. — Equipo de Experiencia KCE`,
  });
}

export async function runReviewAgent(requestId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('No admin instance available');
  const sb = admin as any;

  let processedCount = 0;
  await logEvent('review_agent.started', { requestId }, { source: 'review_agent' });

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);

    const { data: bookings, error } = await sb
      .from('bookings')
      .select('id, customer_email, customer_name, tour_title, tour_date')
      .eq('status', 'confirmed')
      .eq('tour_date', yesterdayStr);

    if (error) throw error;
    if (!bookings || bookings.length === 0) {
      return { processed: 0 };
    }

    const reviewBase = absUrl('/review');

    for (const booking of bookings) {
      if (!booking.customer_email) continue;

      const message = await draftReviewRequest(
        booking.tour_title || 'Tour',
        booking.customer_name || booking.customer_email.split('@')[0],
      );

      const reviewUrl = `${reviewBase}?booking=${encodeURIComponent(booking.id)}`;
      const fullBody = `${message}\n\n👇 Deja tu reseña aquí:\n${reviewUrl}`;

      await sb.from('crm_outbound_messages').insert({
        to_email: booking.customer_email,
        channel: 'email',
        status: 'queued',
        subject: '¿Qué tal estuvo tu experiencia en Colombia? 🇨🇴',
        body: fullBody,
        metadata: { booking_id: booking.id, agent: 'review_agent', review_url: reviewUrl },
      });

      processedCount++;
    }

    await logEvent('review_agent.completed', { requestId, processedCount }, { source: 'review_agent' });
    return { processed: processedCount };
  } catch (err: any) {
    await logEvent('review_agent.error', { requestId, error: err?.message }, { source: 'review_agent' });
    throw err;
  }
}
