import 'server-only';

import { Resend } from 'resend';

function must(v: string | undefined, name: string): string {
  if (!v || !v.trim()) throw new Error(`[opsDigestEmail] Missing env: ${name}`);
  return v.trim();
}

export async function sendOpsDigestEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = must(process.env.RESEND_API_KEY, 'RESEND_API_KEY');
  const from = (process.env.RESEND_FROM || 'KCE <no-reply@knowingcultures.com>').trim();
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
