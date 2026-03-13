import 'server-only';

import fs from 'node:fs/promises';
import path from 'node:path';

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

type EuGuidePdfOpts = {
  siteUrl: string;
};

function wrapText(text: string, maxChars: number): string[] {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length <= maxChars) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = w;
  }
  if (line) lines.push(line);
  return lines;
}

export async function buildEuGuidePdf(opts: EuGuidePdfOpts): Promise<Buffer> {
  const siteUrl = String(opts.siteUrl || '').trim() || 'https://kce.travel';
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Theme
  const brandBlue = rgb(0x0d / 255, 0x5b / 255, 0xa1 / 255);
  const brandYellow = rgb(0xff / 255, 0xc3 / 255, 0x00 / 255);
  const textDark = rgb(0x11 / 255, 0x18 / 255, 0x27 / 255);
  const textMuted = rgb(0x4b / 255, 0x55 / 255, 0x63 / 255);

  const { width, height } = page.getSize();
  const margin = 48;

  // Header
  page.drawRectangle({ x: 0, y: height - 96, width, height: 96, color: brandBlue });
  page.drawText('Knowing Cultures Enterprise', {
    x: margin,
    y: height - 48,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText('Guía Europa → Colombia', {
    x: margin,
    y: height - 72,
    size: 14,
    font,
    color: rgb(1, 1, 1),
  });

  // Logo (top-right)
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const logoBytes = await fs.readFile(logoPath);
    const logo = await doc.embedPng(logoBytes);
    const targetW = 86;
    const scale = targetW / logo.width;
    const targetH = logo.height * scale;
    page.drawRectangle({
      x: width - margin - targetW - 10,
      y: height - 86,
      width: targetW + 10,
      height: targetH + 10,
      color: rgb(1, 1, 1),
      opacity: 0.12,
    });
    page.drawImage(logo, {
      x: width - margin - targetW,
      y: height - 81,
      width: targetW,
      height: targetH,
    });
  } catch {
    // ignore logo failures; PDF still works
  }

  // Body
  let y = height - 130;
  const h1 = 18;
  const p = 11;
  const lh = 14;

  page.drawText('Checklist rápido, rutas y tips de seguridad', {
    x: margin,
    y,
    size: h1,
    font: fontBold,
    color: textDark,
  });
  y -= 24;

  const intro =
    'Esta guía está pensada para viajeros europeos que vienen por primera vez a Colombia: qué empacar, cómo moverte, recomendaciones de destinos y cómo reservar con seguridad.';
  for (const line of wrapText(intro, 92)) {
    page.drawText(line, { x: margin, y, size: p, font, color: textMuted });
    y -= lh;
  }
  y -= 10;

  // Badge
  page.drawRectangle({
    x: margin,
    y: y - 18,
    width: 240,
    height: 26,
    color: brandYellow,
  });
  page.drawText('Incluye tours recomendados KCE', {
    x: margin + 12,
    y: y - 11,
    size: 11,
    font: fontBold,
    color: textDark,
  });
  y -= 42;

  const sections: Array<{ title: string; bullets: string[] }> = [
    {
      title: '1) Antes de viajar (7 días)',
      bullets: [
        'Verifica pasaporte + vigencia (mín. 6 meses).',
        'Compra seguro de viaje (salud + equipaje).',
        'Define tu ruta: Bogotá → Eje Cafetero → Cartagena (ejemplo).',
        'Informa a tu banco y lleva 2 medios de pago.',
      ],
    },
    {
      title: '2) Durante el viaje (seguridad práctica)',
      bullets: [
        'Usa apps oficiales, evita exhibir objetos de valor en calle.',
        'En ciudades: moverte en zonas turísticas y con guía recomendado.',
        'Si haces rural: confirma clima, ropa adecuada y pickup.',
      ],
    },
    {
      title: '3) Reservas con KCE (paso a paso)',
      bullets: [
        'Elige un tour → define fecha/personas → checkout seguro (Stripe).',
        'Recibes confirmación por email + factura PDF.',
        'Soporte antes y después del tour (WhatsApp + chat web).',
      ],
    },
  ];

  const colGap = 24;
  const colW = (width - margin * 2 - colGap) / 2;
  const leftX = margin;
  const rightX = margin + colW + colGap;

  const drawSection = (x: number, startY: number, s: { title: string; bullets: string[] }) => {
    let yy = startY;
    page.drawText(s.title, { x, y: yy, size: 12, font: fontBold, color: brandBlue });
    yy -= 18;
    for (const b of s.bullets) {
      const lines = wrapText(b, 48);
      // bullet dot
      page.drawCircle({ x: x + 4, y: yy + 4, size: 2.2, color: brandBlue });
      for (const line of lines) {
        page.drawText(line, { x: x + 14, y: yy, size: 10.5, font, color: textMuted });
        yy -= 13;
      }
      yy -= 4;
    }
    return yy;
  };

  const [leftSection, rightSection, finalSection] = sections;
  if (!leftSection || !rightSection || !finalSection) {
    throw new Error('Lead magnet PDF sections are incomplete');
  }

  const yLeftEnd = drawSection(leftX, y, leftSection);
  const yRightEnd = drawSection(rightX, y, rightSection);
  const yNext = Math.min(yLeftEnd, yRightEnd) - 6;
  y = drawSection(leftX, yNext, finalSection);

  // Footer
  const footerY = 52;
  page.drawRectangle({ x: 0, y: 0, width, height: 72, color: rgb(0.97, 0.97, 0.98) });
  page.drawText('Contacto', { x: margin, y: footerY, size: 10, font: fontBold, color: textDark });
  page.drawText('support@kce.travel', { x: margin, y: footerY - 14, size: 10, font, color: textMuted });
  page.drawText(siteUrl.replace(/^https?:\/\//, ''), {
    x: width - margin - 220,
    y: footerY,
    size: 10,
    font: fontBold,
    color: textDark,
  });
  page.drawText(`Generado: ${new Date().toISOString().slice(0, 10)}`, {
    x: width - margin - 220,
    y: footerY - 14,
    size: 9.5,
    font,
    color: textMuted,
  });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
