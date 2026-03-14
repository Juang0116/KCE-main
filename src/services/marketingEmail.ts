// src/services/marketingEmail.ts
import 'server-only';

import { Resend } from 'resend';

import { absUrl, serverEnv } from '@/lib/env';
import { buildEuGuidePdf } from '@/services/leadMagnetEuGuidePdf';

function must(v: string | undefined, name: string): string {
  if (!v || !v.trim()) throw new Error(`[marketingEmail] Missing env: ${name}`);
  return v.trim();
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]!,
  );
}

export async function sendNewsletterConfirmEmail(args: {
  to: string;
  confirmToken: string;
  unsubscribeToken: string;
  language?: string;
}) {
  const apiKey = must(serverEnv.RESEND_API_KEY, 'RESEND_API_KEY');
  const from = must(serverEnv.EMAIL_FROM, 'EMAIL_FROM');
  const replyTo = (serverEnv.EMAIL_REPLY_TO || '').trim();

  const resend = new Resend(apiKey);

  const confirmUrl = absUrl(
    `/api/newsletter/confirm?token=${encodeURIComponent(args.confirmToken)}`,
  );
  const unsubscribeUrl = absUrl(
    `/api/newsletter/unsubscribe?token=${encodeURIComponent(args.unsubscribeToken)}`,
  );

  const subject = 'Confirma tu suscripción — KCE';

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto; line-height:1.45;">
    <h2 style="margin:0 0 12px;">Confirma tu suscripción</h2>
    <p style="margin:0 0 12px;">
      Para recibir novedades, historias y ofertas de KCE, confirma tu correo con el botón de abajo.
    </p>
    <p style="margin:16px 0;">
      <a href="${confirmUrl}" style="display:inline-block;padding:12px 16px;background:#0B3A60;color:#fff;text-decoration:none;border-radius:10px;">
        Confirmar suscripción
      </a>
    </p>
    <p style="margin:0 0 12px;color:#334155;">
      Si no fuiste tú, ignora este email.
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:18px 0;" />
    <p style="margin:0;color:#64748b;font-size:12px;">
      Cancelar suscripción: <a href="${unsubscribeUrl}">${escapeHtml(unsubscribeUrl)}</a>
    </p>
  </div>`.trim();

  const text = [
    'Confirma tu suscripción a KCE:',
    confirmUrl,
    '',
    'Cancelar suscripción:',
    unsubscribeUrl,
  ].join('\n');

  const payload: any = {
    from,
    to: [args.to],
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  };

  const { data, error } = await resend.emails.send(payload);
  if (error) throw new Error(`[marketingEmail] ${error.name}: ${error.message}`);
  return data;
}

export async function sendQuizResultsEmail(args: {
  to: string;
  name?: string | null;
  recommendations: Array<{ title: string; url: string; city?: string | null }>;
}) {
  const apiKey = must(serverEnv.RESEND_API_KEY, 'RESEND_API_KEY');
  const from = must(serverEnv.EMAIL_FROM, 'EMAIL_FROM');
  const replyTo = (serverEnv.EMAIL_REPLY_TO || '').trim();

  const resend = new Resend(apiKey);

  const subject = 'Tus recomendaciones de viaje — KCE';

  const itemsHtml = args.recommendations
    .map(
      (r) => `<li style="margin:10px 0;">
      <a href="${r.url}" style="color:#0B3A60;text-decoration:none;font-weight:600;">${escapeHtml(r.title)}</a>
      ${r.city ? `<div style="color:#64748b;font-size:12px;">${escapeHtml(r.city)}</div>` : ''}
    </li>`,
    )
    .join('');

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto; line-height:1.45;">
    <h2 style="margin:0 0 12px;">Tus tours recomendados</h2>
    <p style="margin:0 0 12px;">
      ${args.name ? `Hola ${escapeHtml(args.name)}.` : 'Hola.'} Según tus respuestas, aquí tienes opciones que encajan con tu perfil:
    </p>
    <ul style="padding-left:18px;margin:10px 0 16px;">
      ${itemsHtml}
    </ul>
    <p style="margin:0;color:#334155;">
      Si quieres, responde este correo y te armamos un plan a medida.
    </p>
  </div>`.trim();

  const text = [
    'Tus tours recomendados:',
    ...args.recommendations.map((r) => `- ${r.title} (${r.url})`),
  ].join('\n');

  const payload: any = {
    from,
    to: [args.to],
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  };

  const { data, error } = await resend.emails.send(payload);
  if (error) throw new Error(`[marketingEmail] ${error.name}: ${error.message}`);
  return data;
}



export async function sendPlanResultsEmail(args: {
  to: string;
  name?: string | null;
  recommendations: Array<{ title: string; url: string; city?: string | null }>;
  richPlan?: {
    city: string;
    days: number;
    budgetCOPPerPersonPerDay: { min: number; max: number };
    itinerary: Array<{
      day: number;
      date: string;
      title: string;
      summary: string;
      blocks: Array<{
        time: string;
        title: string;
        neighborhood?: string | undefined;
        description: string;
        approx_cost_cop?: number | undefined;
      }>;
      safety: string;
    }>;
    totals: { approx_total_cop_per_person: number };
  } | null;
  marketingCopy?: { headline?: string | undefined; subhead?: string | undefined } | null;
}) {
  // If rich plan available, send the enhanced email; fallback to quiz results
  if (!args.richPlan) {
    return sendQuizResultsEmail({
      to: args.to,
      name: args.name ?? null,
      recommendations: args.recommendations,
    });
  }

  const apiKey = must(serverEnv.RESEND_API_KEY, 'RESEND_API_KEY');
  const from = must(serverEnv.EMAIL_FROM, 'EMAIL_FROM');
  const replyTo = (serverEnv.EMAIL_REPLY_TO || '').trim();
  const resend = new Resend(apiKey);

  const { richPlan, marketingCopy } = args;
  const greeting = args.name ? `Hola ${escapeHtml(args.name)}` : 'Hola';
  const contactUrl = absUrl('/contact?source=plan-email');
  const toursUrl = absUrl('/tours');

  const headline = marketingCopy?.headline
    ? escapeHtml(marketingCopy.headline)
    : `Tu plan de ${richPlan.days} días en ${escapeHtml(richPlan.city)}`;

  const subhead = marketingCopy?.subhead
    ? escapeHtml(marketingCopy.subhead)
    : `COP ${richPlan.budgetCOPPerPersonPerDay.min.toLocaleString()} – ${richPlan.budgetCOPPerPersonPerDay.max.toLocaleString()} / día / persona`;

  const daysHtml = richPlan.itinerary
    .map(
      (day) => `
      <div style="margin:20px 0;border-left:3px solid #0D5BA1;padding-left:16px;">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(day.date)}</div>
        <div style="font-size:16px;font-weight:700;color:#0D5BA1;margin:4px 0 8px;">${escapeHtml(day.title)}</div>
        <div style="font-size:13px;color:#334155;margin-bottom:10px;">${escapeHtml(day.summary)}</div>
        ${day.blocks
          .map(
            (b) => `
          <div style="background:#f8fafc;border-radius:8px;padding:10px 12px;margin:6px 0;">
            <div style="font-size:11px;font-weight:700;color:#0D5BA1;">${escapeHtml(b.time)}${b.neighborhood ? ` · ${escapeHtml(b.neighborhood)}` : ''}</div>
            <div style="font-size:13px;font-weight:600;color:#1e293b;margin:3px 0;">${escapeHtml(b.title)}</div>
            <div style="font-size:12px;color:#475569;">${escapeHtml(b.description)}</div>
            ${b.approx_cost_cop ? `<div style="font-size:11px;color:#64748b;margin-top:4px;">~COP ${b.approx_cost_cop.toLocaleString()}</div>` : ''}
          </div>`,
          )
          .join('')}
        <div style="font-size:11px;color:#92400e;background:#fef3c7;border-radius:6px;padding:6px 10px;margin-top:8px;">
          🛡️ ${escapeHtml(day.safety)}
        </div>
      </div>`,
    )
    .join('');

  const recsHtml = args.recommendations.length
    ? `<div style="margin-top:24px;">
        <div style="font-size:14px;font-weight:700;color:#0D5BA1;margin-bottom:10px;">Tours KCE recomendados</div>
        <ul style="padding-left:18px;margin:0;">
          ${args.recommendations
            .map(
              (r) =>
                `<li style="margin:8px 0;"><a href="${r.url}" style="color:#0D5BA1;font-weight:600;text-decoration:none;">${escapeHtml(r.title)}</a>${r.city ? `<span style="color:#64748b;font-size:12px;"> · ${escapeHtml(r.city)}</span>` : ''}</li>`,
            )
            .join('')}
        </ul>
      </div>`
    : '';

  const html = `
  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto;line-height:1.5;max-width:600px;margin:0 auto;">
    <div style="background:#0D5BA1;padding:28px 24px;border-radius:12px 12px 0 0;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#FFC300;margin-bottom:8px;">Plan exclusivo KCE</div>
      <h1 style="margin:0;font-size:22px;color:#fff;line-height:1.3;">${headline}</h1>
      <div style="margin-top:8px;font-size:13px;color:rgba(255,255,255,0.8);">${subhead}</div>
    </div>

    <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 16px;color:#334155;">${greeting} 👋 Tu plan de viaje personalizado está listo.</p>

      ${daysHtml}

      <div style="background:#f0fdf4;border-radius:8px;padding:12px 16px;margin-top:20px;font-size:13px;color:#166534;">
        💰 Total estimado: <strong>~COP ${richPlan.totals.approx_total_cop_per_person.toLocaleString()} / persona</strong>
      </div>

      ${recsHtml}

      <div style="margin-top:28px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:8px;">¿Te gusta este borrador?</div>
        <div style="font-size:13px;color:#475569;margin-bottom:14px;">Nuestros asesores pueden afinarlo y gestionar las reservas.</div>
        <a href="${contactUrl}" style="display:inline-block;background:#0D5BA1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;">Hablar con un Asesor →</a>
      </div>

      <p style="margin-top:20px;font-size:12px;color:#94a3b8;text-align:center;">
        <a href="${toursUrl}" style="color:#0D5BA1;">Ver catálogo completo</a> · 
        <a href="${contactUrl}" style="color:#0D5BA1;">Contacto</a>
      </p>
    </div>
  </div>`.trim();

  const text = [
    `${greeting} — Tu plan de ${richPlan.days} días en ${richPlan.city}`,
    '',
    ...richPlan.itinerary.map(
      (d) => `Día ${d.day} — ${d.title}\n${d.summary}\n${d.blocks.map((b) => `  ${b.time} ${b.title}`).join('\n')}`,
    ),
    '',
    `Total estimado: ~COP ${richPlan.totals.approx_total_cop_per_person.toLocaleString()} / persona`,
    '',
    `Hablar con asesor: ${contactUrl}`,
  ].join('\n');

  const subject = `Tu plan de ${richPlan.days} días en ${richPlan.city} — KCE ✈️`;

  const payload: any = {
    from,
    to: [args.to],
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  };

  const { data, error } = await resend.emails.send(payload);
  if (error) throw new Error(`[marketingEmail.richPlan] ${error.name}: ${error.message}`);
  return data;
}

export async function sendLeadMagnetEuGuideEmail(args: { to: string; downloadUrl: string }) {
  const apiKey = must(serverEnv.RESEND_API_KEY, 'RESEND_API_KEY');
  const from = must(serverEnv.EMAIL_FROM, 'EMAIL_FROM');
  const replyTo = (serverEnv.EMAIL_REPLY_TO || '').trim();

  const resend = new Resend(apiKey);

  const subject = 'Tu guía gratis (Europa → Colombia) — KCE';

  const quizUrl = absUrl('/plan');

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto; line-height:1.45;">
    <h2 style="margin:0 0 12px;">Tu guía está lista ✅</h2>
    <p style="margin:0 0 12px;color:#334155;">
      Gracias por pedir la guía de viaje. Puedes descargarla aquí:
    </p>
    <p style="margin:16px 0;">
      <a href="${args.downloadUrl}" style="display:inline-block;padding:12px 16px;background:#0B3A60;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;">
        Descargar guía (PDF)
      </a>
    </p>
    <p style="margin:0 0 12px;color:#334155;">
      ¿Quieres recomendaciones exactas desde el catálogo? Abre tu plan personalizado:
      <a href="${quizUrl}" style="color:#0B3A60;text-decoration:underline;">${escapeHtml(quizUrl)}</a>
    </p>
    <p style="margin:0;color:#64748b;font-size:12px;">— Equipo KCE</p>
  </div>`.trim();

  const text = [
    'Tu guía está lista:',
    args.downloadUrl,
    '',
    'Plan personalizado:',
    quizUrl,
  ].join('\n');

  // Best-effort attach a branded PDF. If generation fails, fall back to the static file.
  let attachments: any[] | undefined;
  try {
    const base = absUrl('/').replace(/\/+$/, '');
    const buf = await buildEuGuidePdf({ siteUrl: base });
    attachments = [
      {
        filename: 'KCE-Guia-Europa-Colombia.pdf',
        content: buf.toString('base64'),
        contentType: 'application/pdf',
      },
    ];
  } catch {
    try {
      const { readFile } = await import('node:fs/promises');
      const { join } = await import('node:path');
      const p = join(process.cwd(), 'public', 'lead-magnets', 'kce-eu-guide.pdf');
      const buf = await readFile(p);
      attachments = [
        {
          filename: 'KCE-Guia-Europa-Colombia.pdf',
          content: buf.toString('base64'),
          contentType: 'application/pdf',
        },
      ];
    } catch {
      attachments = undefined;
    }
  }

  const payload: any = {
    from,
    to: [args.to],
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
    ...(attachments ? { attachments } : {}),
  };

  const { data, error } = await resend.emails.send(payload);
  if (error) throw new Error(`[marketingEmail] ${error.name}: ${error.message}`);
  return data;
}
