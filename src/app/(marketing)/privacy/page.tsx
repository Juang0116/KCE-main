/* src/app/(marketing)/privacy/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  Eye,
  Database,
  Lock,
  Mail,
  UserCheck,
  RefreshCw,
  FileText,
  ArrowRight,
  Cookie,
  HardDrive,
  ShieldAlert,
  Globe2,
  Landmark,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { absoluteUrl } from '@/lib/seoJson';

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(
  /\/+$/,
  '',
);

export const metadata: Metadata = {
  metadataBase: new URL(BASE_SITE_URL),
  title: 'Privacidad & Habeas Data | Knowing Cultures S.A.S.',
  description:
    'Conoce cómo Knowing Cultures S.A.S. protege tu información personal bajo la Ley 1581 de 2012 y estándares internacionales.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  const contactEmail = (
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'knowingcultures@gmail.com'
  ).trim();
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel')
    .trim()
    .replace(/\/+$/, '');

  return (
    <main className="flex min-h-screen animate-fade-in flex-col bg-base">
      {/* 01. HERO PRIVACIDAD (ADN KCE PREMIUM) */}
      <header className="relative overflow-hidden border-b border-white/5 bg-brand-dark px-6 py-28 text-center md:py-40">
        {/* Capas de iluminación inmersiva */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-full max-w-4xl -translate-x-1/2 rounded-full bg-brand-blue/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-brand-yellow/5 blur-[120px]" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.4em] text-white shadow-xl backdrop-blur-md">
            <Lock className="h-4 w-4 text-brand-yellow" /> Seguridad de Grado Institucional
          </div>

          <h1 className="mb-10 font-heading text-6xl leading-[1] tracking-tighter text-white md:text-8xl lg:text-9xl">
            Tu privacidad, <br className="hidden sm:block" />
            <span className="font-light italic text-brand-yellow opacity-90">
              nuestro compromiso.
            </span>
          </h1>

          <p className="mx-auto max-w-3xl text-xl font-light leading-relaxed text-white/60 md:text-2xl">
            En <span className="font-medium text-white">Knowing Cultures S.A.S.</span> tratamos tu
            información bajo estrictos protocolos de Habeas Data y estándares internacionales de
            protección.
          </p>

          <nav className="mt-16 flex flex-wrap items-center justify-center gap-8 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
            <Link
              href="/terms"
              className="transition-colors hover:text-brand-yellow"
            >
              Términos Legales
            </Link>
            <div className="h-1.5 w-1.5 rounded-full bg-brand-yellow/40" />
            <span className="border-b border-brand-blue/30 pb-1 text-brand-blue">
              Política de Privacidad
            </span>
            <div className="h-1.5 w-1.5 rounded-full bg-brand-yellow/40" />
            <Link
              href="/cookies"
              className="transition-colors hover:text-brand-yellow"
            >
              Gestión de Cookies
            </Link>
          </nav>
        </div>
      </header>

      {/* 02. CONTENIDO DE LA POLÍTICA */}
      <section className="relative z-20 mx-auto flex w-full max-w-[var(--container-max)] flex-1 flex-col gap-12 px-6 py-20 md:gap-16 md:py-32">
        {/* Ficha Técnica de la Política (Banner Editorial) */}
        <div className="flex flex-col items-center justify-between gap-10 rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-soft transition-all hover:shadow-pop dark:border-white/5 md:p-12 lg:flex-row">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-dark/5 bg-surface-2 text-brand-blue shadow-sm">
              <Landmark className="h-8 w-8" />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                Entidad Responsable
              </p>
              <p className="font-heading text-lg tracking-tight text-main">
                Knowing Cultures S.A.S. • Bogotá, Colombia
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <div className="flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-brand-blue">
              <RefreshCw className="h-3.5 w-3.5" /> Revisión: Marzo 2026
            </div>
            <div className="flex items-center gap-2 rounded-full border border-brand-dark/5 bg-surface-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted">
              <ShieldAlert className="h-3.5 w-3.5 text-brand-yellow" /> Ley 1581 de 2012
            </div>
          </div>
        </div>

        {/* Grid de Secciones de la Política */}
        <div className="grid gap-10 md:gap-16">
          <PolicyCard
            icon={Database}
            title="1. Recolección de Datos"
            items={[
              {
                bold: 'Identidad Personal:',
                text: 'Email, nombre completo y pasaporte/ID (requerido por autoridades turísticas).',
              },
              {
                bold: 'Logística de Viaje:',
                text: 'Dirección de estancia, número de contacto y preferencias de itinerario.',
              },
              {
                bold: 'Transacciones:',
                text: 'Referencias de pago cifradas. Knowing Cultures S.A.S. nunca almacena números de tarjeta.',
              },
              {
                bold: 'Datos Técnicos:',
                text: 'Dirección IP y cookies de sesión para garantizar la integridad de tu reserva.',
              },
            ]}
          />

          <div className="grid gap-10 lg:grid-cols-2">
            <PolicyCard
              icon={Eye}
              title="2. Finalidad del Tratamiento"
              description="Tus datos se utilizan exclusivamente para procesar tus expediciones, emitir vouchers legales, garantizar tu seguridad en territorio y cumplir con requerimientos de la DIAN y el Viceministerio de Turismo."
            />
            <PolicyCard
              icon={UserCheck}
              title="3. Derechos del Titular"
              description="Bajo el régimen de Habeas Data, tienes derecho a conocer, actualizar, rectificar y suprimir tu información, o revocar tu consentimiento, enviando una solicitud formal a nuestro Oficial de Privacidad."
            />
          </div>

          <PolicyCard
            icon={HardDrive}
            title="4. Socios de Infraestructura"
            description="Trabajamos con líderes globales que cumplen con estándares GDPR y SOC2 para asegurar que tu información esté blindada en todo momento:"
            items={[
              {
                bold: 'Stripe & PayPal:',
                text: 'Procesamiento de pagos con seguridad PCI-DSS Nivel 1.',
              },
              { bold: 'Resend:', text: 'Envío cifrado de confirmaciones y documentos legales.' },
              {
                bold: 'Supabase & Vercel:',
                text: 'Arquitectura de base de datos con encriptación AES-256 de grado militar.',
              },
            ]}
          />

          <div className="grid gap-10 lg:grid-cols-2">
            <PolicyCard
              icon={Cookie}
              title="5. Política de Cookies"
              description="Implementamos cookies esenciales para el carrito de compras y cookies analíticas anónimas que nos ayudan a mejorar el contenido editorial de nuestra plataforma."
              link={{ label: 'Personalizar Cookies', href: '/cookies' }}
            />
            <PolicyCard
              icon={ShieldCheck}
              title="6. Seguridad Proactiva"
              description="Implementamos autenticación mediante enlaces firmados y monitoreo 24/7 de amenazas para proteger tu cuenta de accesos no autorizados."
            />
          </div>
        </div>
      </section>

      {/* 03. CONTACTO DE PRIVACIDAD (Premium Glassmorphism) */}
      <section className="relative mt-auto overflow-hidden border-t border-brand-dark/5 bg-surface-2 py-24 md:py-32">
        {/* Marca de agua institucional sutil */}
        <Globe2 className="pointer-events-none absolute -bottom-20 -left-20 h-96 w-96 text-brand-blue/[0.03]" />

        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="group relative overflow-hidden rounded-[var(--radius-[40px])] border border-brand-dark/5 bg-surface p-12 text-center shadow-soft md:p-24">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-blue/5 blur-[100px] transition-transform duration-1000 group-hover:scale-150"></div>

            <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
              <div className="mb-10 flex h-20 w-20 items-center justify-center rounded-[2rem] border border-brand-dark/5 bg-surface-2 text-brand-blue shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:bg-brand-blue group-hover:text-white">
                <Mail className="h-10 w-10" />
              </div>
              <h2 className="mb-8 font-heading text-4xl tracking-tight text-main md:text-6xl">
                ¿Deseas ejercer tus derechos?
              </h2>
              <p className="mb-14 text-xl font-light leading-relaxed text-muted">
                Nuestro Oficial de Privacidad está a tu disposición para atender cualquier solicitud
                relacionada con la supresión o actualización de tus datos personales.
              </p>
              <Button
                asChild
                size="lg"
                className="rounded-full border-transparent bg-brand-blue px-14 py-8 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-pop transition-all hover:-translate-y-1 hover:bg-brand-dark"
              >
                <a
                  href={`mailto:${contactEmail}?subject=${encodeURIComponent('Solicitud Habeas Data | Knowing Cultures S.A.S.')}`}
                >
                  Contactar Soporte de Privacidad <ArrowRight className="ml-3 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Legal Sutil */}
      <div className="bg-surface-2 py-12 text-center opacity-30">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em]">
          Knowing Cultures S.A.S. • Bogotá, Colombia • 2026
        </p>
      </div>
    </main>
  );
}

// Sub-componente PolicyCard (Estándar Editorial)
function PolicyCard({
  icon: Icon,
  title,
  description,
  items,
  link,
}: {
  icon: any;
  title: string;
  description?: string;
  items?: { bold: string; text: string }[];
  link?: { label: string; href: string };
}) {
  return (
    <div className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft transition-all duration-500 hover:border-brand-blue/20 hover:shadow-xl dark:border-white/5 md:p-16">
      <div className="mb-12 flex flex-col gap-8 md:flex-row md:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-brand-dark/5 bg-surface-2 text-brand-blue shadow-sm transition-all duration-500 group-hover:rotate-3 group-hover:scale-110 group-hover:bg-brand-blue group-hover:text-white">
          <Icon className="h-8 w-8" />
        </div>
        <h2 className="font-heading text-4xl tracking-tight text-main transition-colors group-hover:text-brand-blue">
          {title}
        </h2>
      </div>

      {description && (
        <p className="mb-10 max-w-5xl text-xl font-light leading-relaxed text-muted">
          {description}
        </p>
      )}

      {items && (
        <div className="grid gap-8 md:grid-cols-2">
          {items.map((it, i) => (
            <div
              key={i}
              className="flex items-start gap-5"
            >
              <div className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-yellow" />
              <p className="text-base font-light leading-relaxed text-muted">
                <strong className="mb-1 block font-bold text-main">{it.bold}</strong> {it.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {link && (
        <div className="mt-12 border-t border-brand-dark/5 pt-10">
          <Link
            href={link.href}
            className="group/link inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue transition-colors hover:text-brand-dark"
          >
            {link.label}{' '}
            <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-2" />
          </Link>
        </div>
      )}
    </div>
  );
}
