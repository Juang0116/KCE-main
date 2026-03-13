// src/features/marketing/whatsapp.ts
export function normalizeWhatsAppNumber(raw?: string | null): string | null {
  const v = (raw || '').trim();
  if (!v) return null;

  // Permite formatos: +57 300..., 57300..., 300...
  const digits = v.replace(/[^0-9]/g, '');
  if (!digits) return null;
  return digits;
}

export function buildWhatsAppHref(opts: {
  number?: string | null;
  message?: string;
  url?: string;
}) {
  const number = normalizeWhatsAppNumber(opts.number);
  if (!number) return null;

  const baseMsg = (opts.message || '').trim();
  const url = (opts.url || '').trim();

  const parts = [baseMsg].filter(Boolean);
  if (url) parts.push(`URL: ${url}`);

  const text = encodeURIComponent(parts.join('\n'));
  return `https://wa.me/${number}${text ? `?text=${text}` : ''}`;
}
