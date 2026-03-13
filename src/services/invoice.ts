// src/services/invoice.ts
import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';

import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
import QRCode from 'qrcode';

/* ─────────────────────────────────────────────────────────────
   Runtime guard (pdf-lib + qrcode requieren Node.js)
   ───────────────────────────────────────────────────────────── */
if (process.env.NEXT_RUNTIME === 'edge') {
  throw new Error('[invoice] Esta utilidad requiere Node.js (no Edge).');
}

/* ─────────────────────────────────────────────────────────────
   Tipos públicos (retrocompatibles + legales)
   ───────────────────────────────────────────────────────────── */

export type InvoiceParty = {
  name?: string | null; // Razón social
  taxId?: string | null; // VAT/NIF u otro
  address?: string | null; // Dirección fiscal
  city?: string | null;
  country?: string | null;
  email?: string | null;
};

export type InvoiceLine = {
  description: string;
  quantity: number; // >=1
  unitPriceMinor: number; // EUR cents
  vatRate?: number | null; // 0..1 (ej 0.19)
};

export type InvoiceInput = {
  bookingId: string;

  // NUEVO (recomendado)
  invoiceNumber?: string | null;
  issuedAtISO?: string | null; // fecha emisión

  // RETROCOMPAT (tu error venía de aquí)
  createdAtISO?: string | null;

  // Partes
  seller?: InvoiceParty | null;
  buyer?: InvoiceParty | null;

  // Reserva / servicio
  tourTitle: string;
  tourDate?: string | null; // YYYY-MM-DD
  persons: number;

  // Si no pasas lineItems, se arma 1 línea con persons + total/unit
  lineItems?: InvoiceLine[] | null;

  // Montos (si ya los tienes calculados desde Stripe)
  subtotalMinor?: number | null;
  vatMinor?: number | null;
  totalMinor?: number | null;
  vatRate?: number | null; // fallback VAT rate si no hay por línea

  // Moneda/locale
  currency?: string | null; // default 'EUR'
  locale?: string | null; // default 'es-ES'

  // Pago
  paymentProvider?: string | null; // 'stripe'
  paymentRef?: string | null; // session id / payment intent / etc.

  // Links
  siteUrl?: string | null; // https://kce.travel
};

export type InvoiceOptions = {
  logoUrl?: string; // default intenta public/logo.png
  theme?: {
    brandBlue?: string; // '#0D5BA1'
    brandYellow?: string; // '#FFC300'
    textDark?: string; // '#111827'
  };
  showFiscalNote?: boolean;
  showQr?: boolean;
  qrUrl?: string;
  qrLabel?: string;
};

/* ─────────────────────────────────────────────────────────────
   THEME CONFIG
   ───────────────────────────────────────────────────────────── */
const DEFAULT_THEME = {
  brandBlue: '#0D5BA1',
  brandYellow: '#FFC300',
  textDark: '#111827',
};

const DEFAULT_LOCALE = 'es-ES';
const DEFAULT_CURRENCY = 'EUR';
const PAGE_SIZE_A4: [number, number] = [595.28, 841.89]; // pt

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

const ZERO_DECIMAL = new Set([
  'bif',
  'clp',
  'djf',
  'gnf',
  'jpy',
  'kmf',
  'krw',
  'mga',
  'pyg',
  'rwf',
  'ugx',
  'vnd',
  'vuv',
  'xaf',
  'xof',
  'xpf',
]);
const THREE_DECIMAL = new Set(['bhd', 'iqd', 'jod', 'kwd', 'lyd', 'omr', 'tnd']);

function defaultFractionDigitsFor(currency: string): number {
  const c = currency.toLowerCase();
  if (ZERO_DECIMAL.has(c)) return 0;
  if (THREE_DECIMAL.has(c)) return 3;
  return 2;
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '').trim();
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const n = Number.parseInt(full, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  return rgb(r, g, b);
}

function parseColor(s?: string) {
  const val = (s || '').trim();
  if (!val) return undefined;
  try {
    return hexToRgb(val.startsWith('#') ? val : `#${val}`);
  } catch {
    return undefined;
  }
}

function slugify(s: string) {
  return (s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function shortId(id: string) {
  const s = String(id || '');
  return s.length > 8 ? s.slice(-8) : s;
}

function formatMoneyFromMinor(amountMinor: number, currency: string, locale: string) {
  const digits = defaultFractionDigitsFor(currency);
  const isZero = ZERO_DECIMAL.has(currency.toLowerCase());
  const value = isZero ? amountMinor : amountMinor / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(value);
  } catch {
    const fallback = value.toFixed(Math.max(0, digits));
    return `${fallback} ${currency.toUpperCase()}`;
  }
}

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number) {
  const lines: string[] = [];
  for (const rawLine of String(text || '').split(/\n/)) {
    const words = rawLine.split(/\s+/);
    let line = '';
    for (const w of words) {
      const tentative = line ? `${line} ${w}` : w;
      const width = font.widthOfTextAtSize(tentative, fontSize);
      if (width <= maxWidth) line = tentative;
      else {
        if (line) lines.push(line);
        if (font.widthOfTextAtSize(w, fontSize) > maxWidth) {
          lines.push(w);
          line = '';
        } else {
          line = w;
        }
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function toAbsoluteUrl(src: string) {
  if (/^https?:\/\//i.test(src)) return src;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || '').trim() || 'http://localhost:3000';
  const b = base.replace(/\/+$/, '');
  const p = src.startsWith('/') ? src : `/${src}`;
  return `${b}${p}`;
}

async function loadLogoBytes(logoUrl?: string): Promise<Uint8Array | null> {
  try {
    const localPath = path.join(process.cwd(), 'public', 'logo.png');
    const buf = await fs.readFile(localPath);
    return new Uint8Array(buf);
  } catch {
    // ignore
  }

  if (logoUrl) {
    try {
      const res = await fetch(toAbsoluteUrl(logoUrl), { cache: 'no-store' });
      if (res.ok) return new Uint8Array(await res.arrayBuffer());
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Retrocompatible: si en tu route estabas llamando buildInvoiceFileName(tourTitle, createdAt),
 * esto NO debe romper.
 */
export function buildInvoiceFileName(tourTitle: string, createdAt?: Date) {
  const dt = createdAt ?? new Date();
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  const slug = slugify(tourTitle);
  return `Invoice-KCE_${y}-${m}-${d}_${slug || 'booking'}.pdf`;
}

/* ─────────────────────────────────────────────────────────────
   API principal: genera el PDF (Buffer)
   ───────────────────────────────────────────────────────────── */
export async function buildInvoicePdf(
  input: InvoiceInput,
  options?: InvoiceOptions,
): Promise<Buffer> {
  const locale = (input.locale || DEFAULT_LOCALE).trim();
  const currency = (input.currency || DEFAULT_CURRENCY).toUpperCase();

  const issuedAtISO = input.issuedAtISO ?? input.createdAtISO ?? null;
  const issuedAt = issuedAtISO ? new Date(issuedAtISO) : new Date();

  const invoiceNumber =
    (input.invoiceNumber || '').trim() ||
    `KCE-${issuedAt.getFullYear()}${String(issuedAt.getMonth() + 1).padStart(2, '0')}${String(
      issuedAt.getDate(),
    ).padStart(2, '0')}-${shortId(input.bookingId)}`;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage(PAGE_SIZE_A4);
  const { width, height } = page.getSize();

  pdf.setTitle(`KCE · Invoice ${invoiceNumber}`);
  pdf.setAuthor('Knowing Cultures Enterprise (KCE)');
  pdf.setSubject('Invoice');
  pdf.setCreationDate(issuedAt);

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const brandBlue = parseColor(options?.theme?.brandBlue) || parseColor(DEFAULT_THEME.brandBlue)!;
  const brandYellow =
    parseColor(options?.theme?.brandYellow) || parseColor(DEFAULT_THEME.brandYellow)!;
  const textDark = parseColor(options?.theme?.textDark) || parseColor(DEFAULT_THEME.textDark)!;

  const baseUrl =
    (input.siteUrl || '').toString().trim().replace(/\/+$/, '') ||
    (process.env.NEXT_PUBLIC_SITE_URL || '').toString().trim().replace(/\/+$/, '') ||
    'http://localhost:3000';

  /* ───────── Header ───────── */
  const headerH = 110;
  page.drawRectangle({ x: 0, y: height - headerH, width, height: headerH, color: brandBlue });
  page.drawRectangle({ x: 0, y: height - headerH, width, height: 4, color: brandYellow });

  page.drawText('KCE — Knowing Cultures Enterprise', {
    x: 32,
    y: height - 56,
    size: 18,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText('Invoice', {
    x: 32,
    y: height - 78,
    size: 12,
    font,
    color: rgb(1, 1, 1),
  });

  // Logo
  try {
    const logoBytes = await loadLogoBytes(options?.logoUrl || 'logo.png');
    if (logoBytes) {
      const img =
        (await pdf.embedPng(logoBytes).catch(async () => null)) || (await pdf.embedJpg(logoBytes));
      const maxW = 160;
      const maxH = 56;
      const scale = Math.min(maxW / img.width, maxH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = width - 24 - w;
      const y = height - 24 - h;

      page.drawRectangle({
        x: x - 6,
        y: y - 6,
        width: w + 12,
        height: h + 12,
        color: rgb(1, 1, 1),
      });
      page.drawImage(img, { x, y, width: w, height: h });
    }
  } catch {
    // ignore
  }

  /* ───────── Datos / layout ───────── */
  const marginX = 40;
  const contentW = width - marginX * 2;
  let y = height - headerH - 32;

  const line = (label: string, value?: string | number | null) => {
    if (value == null || value === '') return;
    page.drawText(`${label}:`, { x: marginX, y, size: 11, font: bold, color: textDark });
    page.drawText(String(value), { x: marginX + 150, y, size: 11, font, color: textDark });
    y -= 18;
  };

  const issuedHuman = issuedAt.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });

  page.drawText('Invoice details', { x: marginX, y, size: 13, font: bold, color: brandBlue });
  y -= 22;
  line('Invoice No.', invoiceNumber);
  line('Issue date', issuedHuman);
  line('Booking ID', input.bookingId);
  if (input.paymentProvider) line('Payment provider', input.paymentProvider);
  if (input.paymentRef) line('Payment reference', input.paymentRef);

  y -= 10;

  page.drawText('Seller', { x: marginX, y, size: 13, font: bold, color: brandBlue });
  y -= 22;
  const seller = input.seller ?? null;
  line('Name', seller?.name ?? 'Knowing Cultures Enterprise (KCE)');
  if (seller?.taxId) line('Tax/VAT ID', seller.taxId);
  if (seller?.address) line('Address', seller.address);
  if (seller?.city) line('City', seller.city);
  if (seller?.country) line('Country', seller.country);
  if (seller?.email) line('Email', seller.email);
  line('Website', baseUrl);

  y -= 10;

  page.drawText('Buyer', { x: marginX, y, size: 13, font: bold, color: brandBlue });
  y -= 22;
  const buyer = input.buyer ?? null;
  line('Name', buyer?.name ?? null);
  line('Email', buyer?.email ?? null);
  if (buyer?.taxId) line('Tax/VAT ID', buyer.taxId);
  if (buyer?.address) line('Address', buyer.address);
  if (buyer?.city) line('City', buyer.city);
  if (buyer?.country) line('Country', buyer.country);

  y -= 10;

  page.drawText('Service', { x: marginX, y, size: 13, font: bold, color: brandBlue });
  y -= 22;

  // Título del tour con wrap
  page.drawText('Description:', { x: marginX, y, size: 11, font: bold, color: textDark });
  const descX = marginX + 150;
  const descMax = contentW - 150;
  const tourLines = wrapText(input.tourTitle, descMax, font, 11);
  tourLines.forEach((ln, i) => {
    page.drawText(ln, { x: descX, y: y - 18 * i, size: 11, font, color: textDark });
  });
  y -= Math.max(18, 18 * tourLines.length);

  if (input.tourDate) line('Service date', input.tourDate);
  line('Currency', currency);

  y -= 10;

  /* ───────── Líneas / totales ───────── */

  const persons = Math.max(1, Number(input.persons) || 1);

  // Si no hay lineItems: crea 1 línea base
  const lineItems: InvoiceLine[] = (
    input.lineItems && Array.isArray(input.lineItems) && input.lineItems.length > 0
      ? input.lineItems
      : [
          {
            description: `${input.tourTitle}${input.tourDate ? ` (${input.tourDate})` : ''}`,
            quantity: persons,
            unitPriceMinor: 0,
            vatRate: input.vatRate ?? 0,
          },
        ]
  ) as InvoiceLine[];

  // Si vino totalMinor pero no unit/subtotal: aproximamos
  if (lineItems.length === 1 && lineItems[0] && lineItems[0].unitPriceMinor === 0) {
    const totalMinor = input.totalMinor ?? null;
    if (typeof totalMinor === 'number' && Number.isFinite(totalMinor) && totalMinor > 0) {
      lineItems[0].unitPriceMinor = Math.round(totalMinor / persons);
    }
  }

  const clampRate = (r: unknown) => {
    const n = typeof r === 'number' ? r : Number(r);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
  };

  const subtotalCalc =
    input.subtotalMinor ??
    lineItems.reduce(
      (acc, it) => acc + Math.max(1, it.quantity) * Math.max(0, it.unitPriceMinor),
      0,
    );

  const vatCalc =
    input.vatMinor ??
    lineItems.reduce((acc, it) => {
      const rate = clampRate(it.vatRate ?? input.vatRate ?? 0);
      const base = Math.max(1, it.quantity) * Math.max(0, it.unitPriceMinor);
      return acc + Math.round(base * rate);
    }, 0);

  const totalCalc = input.totalMinor ?? subtotalCalc + vatCalc;

  // Tabla simple
  const _tableTopY = y;
  const col1 = marginX;
  const col2 = marginX + 320;
  const col3 = marginX + 390;
  const col4 = marginX + 470;

  page.drawText('Item', { x: col1, y, size: 10, font: bold, color: textDark });
  page.drawText('Qty', { x: col2, y, size: 10, font: bold, color: textDark });
  page.drawText('Unit', { x: col3, y, size: 10, font: bold, color: textDark });
  page.drawText('Total', { x: col4, y, size: 10, font: bold, color: textDark });
  y -= 14;
  page.drawRectangle({
    x: marginX,
    y: y + 6,
    width: contentW,
    height: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 10;

  for (const it of lineItems) {
    const qty = Math.max(1, Number(it.quantity) || 1);
    const unit = Math.max(0, Number(it.unitPriceMinor) || 0);
    const rowTotal = qty * unit;

    const itemLines = wrapText(it.description, 300, font, 9);
    const rowLines = Math.max(1, itemLines.length);

    itemLines.forEach((ln, i) => {
      page.drawText(ln, { x: col1, y: y - i * 12, size: 9, font, color: textDark });
    });

    page.drawText(String(qty), { x: col2, y, size: 9, font, color: textDark });
    page.drawText(formatMoneyFromMinor(unit, currency, locale), {
      x: col3,
      y,
      size: 9,
      font,
      color: textDark,
    });
    page.drawText(formatMoneyFromMinor(rowTotal, currency, locale), {
      x: col4,
      y,
      size: 9,
      font,
      color: textDark,
    });

    y -= rowLines * 12 + 8;
  }

  // Totales resaltados
  const blockH = 70;
  const blockY = Math.max(70, y - blockH);
  page.drawRectangle({
    x: marginX - 4,
    y: blockY,
    width: contentW + 8,
    height: blockH,
    color: brandYellow,
  });

  const labelY1 = blockY + 46;
  const labelY2 = blockY + 28;
  const labelY3 = blockY + 10;

  const rightX = marginX + contentW - 10;

  const drawRight = (txt: string, yy: number, size: number, isBold?: boolean) => {
    const f = isBold ? bold : font;
    const w = f.widthOfTextAtSize(txt, size);
    page.drawText(txt, { x: rightX - w, y: yy, size, font: f, color: textDark });
  };

  page.drawText('Subtotal', { x: marginX + 8, y: labelY1, size: 10, font: bold, color: textDark });
  drawRight(formatMoneyFromMinor(subtotalCalc, currency, locale), labelY1, 10);

  page.drawText('VAT/Tax', { x: marginX + 8, y: labelY2, size: 10, font: bold, color: textDark });
  drawRight(formatMoneyFromMinor(vatCalc, currency, locale), labelY2, 10);

  page.drawText('TOTAL', { x: marginX + 8, y: labelY3, size: 12, font: bold, color: textDark });
  drawRight(formatMoneyFromMinor(totalCalc, currency, locale), labelY3 - 2, 14, true);

  y = blockY - 16;

  // Nota legal
  const fiscalNote =
    options?.showFiscalNote === false
      ? ''
      : 'Nota: Esta factura es informativa. Para requisitos fiscales específicos (IVA/VAT, NIF, dirección fiscal), valida con tu asesor contable según el país del comprador/vendedor.';
  if (fiscalNote) {
    const fLines = wrapText(fiscalNote, width - marginX * 2, font, 8);
    const baseY = 36;
    fLines.slice(0, 4).forEach((ln, i) => {
      page.drawText(ln, {
        x: marginX,
        y: baseY + 11 * (fLines.length - 1 - i),
        size: 8,
        font,
        color: textDark,
      });
    });
  }

  // QR
  const showQr = options?.showQr !== false;
  const qrValue = (
    options?.qrUrl || `${baseUrl}/booking/${encodeURIComponent(String(input.bookingId))}`
  ).toString();

  if (showQr && qrValue) {
    try {
      const qrSize = 104;
      const qrPadding = 6;
      const qrLabelPad = 16;
      const footerY = 36;

      const qrPng = await QRCode.toBuffer(qrValue, {
        type: 'png',
        width: qrSize,
        margin: 0,
        errorCorrectionLevel: 'M',
      });

      const qrImg = await pdf.embedPng(qrPng);
      const qrX = width - qrSize - 24;
      const qrY = footerY + 10;

      page.drawRectangle({
        x: qrX - qrPadding,
        y: qrY - qrPadding,
        width: qrSize + qrPadding * 2,
        height: qrSize + qrPadding * 2 + qrLabelPad,
        color: rgb(1, 1, 1),
      });

      page.drawImage(qrImg, { x: qrX, y: qrY + qrLabelPad, width: qrSize, height: qrSize });

      const label = (options?.qrLabel || 'Scan me').toString();
      const labelW = font.widthOfTextAtSize(label, 9);
      page.drawText(label, {
        x: qrX + (qrSize - labelW) / 2,
        y: qrY + 3,
        size: 9,
        font,
        color: textDark,
      });
    } catch {
      // ignore
    }
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
