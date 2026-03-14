import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';

// 🤖 IA: Redactar Recordatorio de Tour (Pre-Departure)
async function draftPreTourReminder(tourName: string, customerName: string, date: string): Promise<string> {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) return `Hola ${customerName}, te recordamos que mañana es tu experiencia: ${tourName}. ¡Nos vemos pronto!`;

  const prompt = `
Eres la Coordinadora de Operaciones de KCE (Knowing Cultures Enterprise), una agencia de turismo premium en Colombia.
Escribe un correo CORTO y EMOCIONANTE a un cliente recordando que SU TOUR ES MAÑANA.

DATOS:
- Cliente: ${customerName || 'Viajero'}
- Tour: ${tourName}
- Fecha: Mañana (${date})

REGLAS:
1. Tono cálido, servicial y seguro.
2. Recuérdale llevar zapatos cómodos, protector solar e hidratación (es estándar para Colombia).
3. Pídele que sea puntual y que si tiene dudas de última hora, responda a este correo o escriba al WhatsApp de soporte.
4. Despídete como "El equipo de Operaciones de KCE".
`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.5,
      }),
    });
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data.choices[0]?.message?.content || `Hola ${customerName}, te recordamos que mañana es tu tour: ${tourName}.`;
  } catch (err) {
    return `Hola ${customerName}, te esperamos mañana para tu experiencia en ${tourName}. ¡No olvides llevar ropa cómoda!`;
  }
}

export async function runOpsAgent(requestId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('No admin instance available');
  
  // 🔥 FIX: Evitamos el "SelectQueryError" de TypeScript forzando el tipo
  const sb = admin as any; 

  let processedCount = 0;
  await logEvent('ops_agent.started', { requestId }, { source: 'ops_agent' });

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().substring(0, 10);

    // Usamos 'sb' en lugar de 'admin'
    const { data: bookings, error } = await sb
      .from('bookings')
      .select('id, customer_email, customer_name, tour_title, tour_date')
      .eq('status', 'confirmed')
      .eq('tour_date', tomorrowStr);

    if (error) throw error;

    if (!bookings || bookings.length === 0) {
      return { processed: 0, message: 'No tours scheduled for tomorrow.' };
    }

    for (const booking of bookings) {
      if (!booking.customer_email) continue;

      const message = await draftPreTourReminder(
        booking.tour_title || 'Tour',
        booking.customer_name || booking.customer_email.split('@')[0],
        tomorrowStr
      );

      await sb.from('outbound_messages').insert({
        recipient_email: booking.customer_email,
        channel: 'email',
        direction: 'outbound',
        status: 'pending',
        subject: `[Recordatorio] Mañana es tu experiencia: ${booking.tour_title}`,
        body_text: message,
      });

      processedCount++;
    }

    await logEvent('ops_agent.completed', { requestId, processedCount }, { source: 'ops_agent' });
    return { processed: processedCount };

  } catch (err: any) {
    console.error('Ops Agent Error:', err);
    throw err;
  }
}