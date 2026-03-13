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
}) {
  return sendQuizResultsEmail(args);
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
