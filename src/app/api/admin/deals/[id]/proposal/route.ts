import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { getTourBySlug } from '@/features/tours/catalog.server';
import { requireAdminScope } from '@/lib/adminAuth';
import { createTask } from '@/lib/botStorage.server';
import { publicEnv } from '@/lib/env';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getStripe } from '@/lib/stripe.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });

const BodySchema = z.object({
  slug: z.string().trim().min(1),
  date: z.string().trim().min(1),
  guests: z.coerce.number().int().min(1).max(20).default(1),
  locale: z.string().trim().optional(),
  customerName: z.string().trim().max(120).optional(),
  email: z.string().trim().email().optional(),
  includeCheckoutLink: z.boolean().optional(),
}).strict();

// --- HELPERS DE FORMATEO ---

function fmtMoney(amountMinor: number, locale: string) {
  return new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(amountMinor / 100);
}

function getProposalText(args: {
  lang: 'es' | 'en' | 'de';
  customerName?: string; // Nota: el ? aquí ya define que puede no estar
  tour: any;
  date: string;
  guests: number;
  checkoutUrl?: string | null;
}) {
  const { lang, customerName, tour, date, guests, checkoutUrl } = args;
  const locale = lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'es-ES';
  
  const pricePP = Math.round(Number(tour.base_price || tour.price || 0));
  const total = pricePP * guests;

  const greetings = { es: 'Hola', en: 'Hi', de: 'Hallo' };
  const greet = customerName ? `${greetings[lang]} ${customerName},` : `${greetings[lang]},`;

  const labels = {
    es: { intro: 'Te comparto la propuesta:', tour: 'Tour', date: 'Fecha', pax: 'Personas', total: 'Total', next: 'Para confirmar, paga aquí:' },
    en: { intro: 'Here is your proposal:', tour: 'Tour', date: 'Date', pax: 'Guests', total: 'Total', next: 'To confirm, pay here:' },
    de: { intro: 'Hier ist Ihr Angebot:', tour: 'Tour', date: 'Datum', pax: 'Personen', total: 'Gesamt', next: 'Zur Bestätigung hier bezahlen:' }
  }[lang];

  const lines = [
    greet,
    '',
    labels.intro,
    '',
    `• ${labels.tour}: ${tour.title}`,
    `• ${labels.date}: ${date}`,
    `• ${labels.pax}: ${guests}`,
    `• ${labels.total}: ${fmtMoney(total, locale)}`,
    '',
    checkoutUrl ? `${labels.next}\n${checkoutUrl}` : 'Si te parece bien, dime y te envío el link de pago.',
    '',
    '— KCE | Knowing Cultures'
  ];

  return lines.join('\n');
}

// --- HANDLER ---

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  try {
    const { id: dealId } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload inválido', details: parsed.error.flatten(), requestId }, { status: 400 });
    }

    const tour = await getTourBySlug(parsed.data.slug);
    if (!tour) return NextResponse.json({ error: 'Tour no encontrado', requestId }, { status: 404 });

    const pricePP = Math.round(Number((tour as any).base_price || (tour as any).price || 0));
    
    let checkoutUrl: string | null = null;
    let stripeSessionId: string | null = null;

    if (parsed.data.includeCheckoutLink) {
      const stripe = getStripe();
      const origin = (publicEnv.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
      
      // SOLUCIÓN ERROR 2769: Usamos un objeto dinámico para no pasar 'undefined' explícito
      const sessionOptions: any = {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: { name: tour.title, metadata: { slug: tour.slug } },
            unit_amount: pricePP,
          },
          quantity: parsed.data.guests,
        }],
        metadata: { deal_id: dealId, tour_slug: tour.slug, date: parsed.data.date },
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout/cancel`,
      };

      // Solo agregamos la propiedad si realmente existe el valor
      if (parsed.data.email) {
        sessionOptions.customer_email = parsed.data.email;
      }

      const session = await stripe.checkout.sessions.create(sessionOptions);
      checkoutUrl = session.url;
      stripeSessionId = session.id;
    }

    // SOLUCIÓN ERROR 2379: Evitamos pasar customerName si es undefined
    const lang = parsed.data.locale?.startsWith('de') ? 'de' : parsed.data.locale?.startsWith('en') ? 'en' : 'es';
    
    const proposalArgs: any = {
      lang,
      tour,
      date: parsed.data.date,
      guests: parsed.data.guests,
      checkoutUrl
    };

    if (parsed.data.customerName) {
      proposalArgs.customerName = parsed.data.customerName;
    }

    const text = getProposalText(proposalArgs);

    // Actualizar Deal y Auditoría
    const admin = getSupabaseAdmin();
    if (admin) {
      await (admin as any).from('deals').update({
        stage: checkoutUrl ? 'checkout' : 'proposal',
        probability: checkoutUrl ? 75 : 50,
        amount_minor: pricePP * parsed.data.guests
      }).eq('id', dealId);
    }

    void logEvent('crm.proposal_generated', { dealId, tour: tour.slug, stripeSessionId }, { userId: auth.actor ?? null });

    await createTask({
      dealId,
      title: checkoutUrl ? 'Seguimiento de pago (24h)' : 'Confirmar propuesta (48h)',
      priority: checkoutUrl ? 'high' : 'normal',
      dueAt: new Date(Date.now() + (checkoutUrl ? 24 : 48) * 3600000).toISOString(),
      requestId
    });

    return NextResponse.json({ ok: true, text, checkoutUrl, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });

  } catch (err: any) {
    void logEvent('api.error', { route: 'admin.proposal.create', error: err.message, requestId }, { userId: auth.actor ?? null });
    return NextResponse.json({ error: 'Error interno', requestId }, { status: 500 });
  }
}