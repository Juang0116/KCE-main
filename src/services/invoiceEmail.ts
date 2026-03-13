// src/services/invoiceEmail.ts
import 'server-only';
import { Resend } from 'resend';

import { serverEnv } from '@/lib/env';

export type SendInvoiceEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  filename: string;
  pdf: Buffer;
};

function must(v: string | undefined, name: string): string {
  if (!v || !v.trim()) throw new Error(`[invoiceEmail] Missing env: ${name}`);
  return v.trim();
}

export async function sendInvoiceEmail(args: SendInvoiceEmailArgs) {
  const apiKey = must(serverEnv.RESEND_API_KEY, 'RESEND_API_KEY');
  const from = must(serverEnv.EMAIL_FROM, 'EMAIL_FROM');

  const resend = new Resend(apiKey);

  // exactOptionalPropertyTypes: omite replyTo si no existe
  const replyTo = (serverEnv.EMAIL_REPLY_TO || '').trim();

  const payload = {
    from,
    to: [args.to],
    subject: args.subject,
    html: args.html,
    text: args.text,
    attachments: [
      {
        filename: args.filename,
        // ✅ base64 estable
        content: args.pdf.toString('base64'),
        contentType: 'application/pdf',
      },
    ],
    ...(replyTo ? { replyTo } : {}),
  };

  const { data, error } = await resend.emails.send(payload as any);
  if (error) throw new Error(`[invoiceEmail] ${error.name}: ${error.message}`);

  return data;
}
