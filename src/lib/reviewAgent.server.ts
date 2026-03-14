import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';

// 🤖 IA: Redactar Agradecimiento y Petición de Reseña
async function draftReviewRequest(tourName: string, customerName: string): Promise<string> {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) return `Hola ${customerName}, esperamos que hayas disfrutado tu experiencia en ${tourName}. ¿Nos ayudarías con una breve reseña?`;

  const prompt = `
Eres el Director de Experiencia de KCE (Knowing Cultures Enterprise).
Ayer, el cliente ${customerName || 'Viajero'} tomó el tour "${tourName}".
Escribe un correo CORTO, CÁLIDO y MUY AGRADECIDO.

Objetivo: Pedirle amablemente que nos deje una reseña (feedback) sobre su experiencia.
Reglas:
1. Trátalo de tú. Tono humano, cercano y local (eres colombiano).
2. Dile que sus comentarios son vitales para ayudar a otros viajeros a descubrir la verdadera Colombia y apoyan directamente a nuestros guías locales.
3. Despídete como "El equipo de Experiencia de KCE".
4. NO incluyas URLs falsas, el sistema inyectará el botón automáticamente.
`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.7,
      }),
    });
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data.choices[0]?.message?.content || `Hola ${customerName}, gracias por viajar con KCE.`;
  } catch (err) {
    return `Hola ${customerName}, esperamos que hayas disfrutado mucho tu tour ${tourName}. Nos encantaría conocer tu opinión para seguir mejorando.`;
  }
}

export async function runReviewAgent(requestId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('No admin instance available');

  // 🔥 FIX: Evitamos el error de tipos de TypeScript
  const sb = admin as any;

  let processedCount = 0;
  await logEvent('review_agent.started', { requestId }, { source: 'review_agent' });

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);

    // Usamos 'sb' en lugar de 'admin'
    const { data: bookings, error } = await sb
      .from('bookings')
      .select('id, customer_email, customer_name, tour_title, tour_date')
      .eq('status', 'confirmed')
      .eq('tour_date', yesterdayStr);

    if (error) throw error;
    if (!bookings || bookings.length === 0) return { processed: 0 };

    for (const booking of bookings) {
      if (!booking.customer_email) continue;

      const message = await draftReviewRequest(
        booking.tour_title || 'Tour',
        booking.customer_name || booking.customer_email.split('@')[0]
      );

      await sb.from('outbound_messages').insert({
        recipient_email: booking.customer_email,
        channel: 'email',
        direction: 'outbound',
        status: 'pending',
        subject: `¿Qué tal estuvo tu experiencia en Colombia? 🇨🇴`,
        body_text: message + `\n\n👇 ¡Haz clic en el enlace de abajo para calificar tu tour y ayudarnos a crecer!\nhttps://kce.travel/review-demo`, 
      });

      processedCount++;
    }

    await logEvent('review_agent.completed', { requestId, processedCount }, { source: 'review_agent' });
    return { processed: processedCount };

  } catch (err: any) {
    console.error('Review Agent Error:', err);
    throw err;
  }
}