// src/lib/opsAgent.server.ts
// Ops Agent — sends pre-departure reminders for tours happening tomorrow.
import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';
import { agentGenerate } from '@/lib/agentAI.server';

async function draftPreTourReminder(tourName: string, customerName: string, date: string): Promise<string> {
  return agentGenerate({
    systemPrompt: `Eres la Coordinadora de Operaciones de KCE (Knowing Cultures Enterprise), agencia de turismo premium en Colombia.
Escribe un correo CORTO y EMOCIONANTE recordando que el tour del cliente es MAÑANA.
Reglas:
1. Tono cálido, servicial y seguro.
2. Recuérdale llevar zapatos cómodos, protector solar e hidratación.
3. Pídele ser puntual; si tiene dudas de última hora, que responda este correo o escriba al WhatsApp de soporte.
4. Despídete como "El equipo de Operaciones de KCE".`,
    userMessage: `Cliente: ${customerName || 'Viajero'} | Tour: ${tourName} | Fecha: Mañana (${date})`,
    temperature: 0.5,
    maxTokens: 400,
    fallback: `Hola ${customerName} 👋 Te recordamos que mañana es tu experiencia: ${tourName}. ¡Nos vemos pronto! Lleva zapatos cómodos y protector solar. — Equipo Ops KCE`,
  });
}

export async function runOpsAgent(requestId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('No admin instance available');
  const sb = admin as any;

  let processedCount = 0;
  await logEvent('ops_agent.started', { requestId }, { source: 'ops_agent' });

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().substring(0, 10);

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
        tomorrowStr,
      );

      await sb.from('crm_outbound_messages').insert({
        to_email: booking.customer_email,
        channel: 'email',
        status: 'queued',
        subject: `[Recordatorio] Mañana es tu experiencia: ${booking.tour_title}`,
        body: message,
        metadata: { booking_id: booking.id, agent: 'ops_agent' },
      });

      processedCount++;
    }

    await logEvent('ops_agent.completed', { requestId, processedCount }, { source: 'ops_agent' });
    return { processed: processedCount };
  } catch (err: any) {
    await logEvent('ops_agent.error', { requestId, error: err?.message }, { source: 'ops_agent' });
    throw err;
  }
}
