/* src/app/(marketing)/privacy/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  ShieldCheck, Eye, Database, Lock, 
  Mail, UserCheck, RefreshCw, FileText, 
  ArrowRight, Cookie, HardDrive, ShieldAlert,
  Globe2, Landmark
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { absoluteUrl } from '@/lib/seoJson';

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(BASE_SITE_URL),
  title: 'Privacidad & Habeas Data | Knowing Cultures S.A.S.',
  description: 'Conoce cómo Knowing Cultures S.A.S. protege tu información personal bajo la Ley 1581 de 2012 y estándares internacionales.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  const contactEmail = (process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'knowingcultures@gmail.com').trim();
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').trim().replace(/\/+$/, '');

  return (
    <main className="min-h-screen bg-base flex flex-col animate-fade-in">
      
      {/* 01. HERO PRIVACIDAD (ADN KCE PREMIUM) */}
      <header className="relative overflow-hidden bg-brand-dark px-6 py-28 md:py-40 text-center border-b border-white/5">
        {/* Capas de iluminación inmersiva */}
        <div className="absolute top-0 left-1/2 w-full max-w-4xl h-80 bg-brand-blue/10 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-yellow/5 rounded-full blur-[120px] pointer-events-none translate-x-1/3 translate-y-1/3" />
        
        <div className="relative z-10 mx-auto max-w-5xl flex flex-col items-center">
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.4em] text-white shadow-xl backdrop-blur-md">
            <Lock className="h-4 w-4 text-brand-yellow" /> Seguridad de Grado Institucional
          </div>
          
          <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl text-white tracking-tighter leading-[1] mb-10">
            Tu privacidad, <br className="hidden sm:block" />
            <span className="text-brand-yellow font-light italic opacity-90">nuestro compromiso.</span>
          </h1>
          
          <p className="mx-auto max-w-3xl text-xl md:text-2xl font-light leading-relaxed text-white/60">
            En <span className="text-white font-medium">Knowing Cultures S.A.S.</span> tratamos tu información bajo estrictos protocolos de Habeas Data y estándares internacionales de protección.
          </p>

          <nav className="mt-16 flex flex-wrap justify-center items-center gap-8 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
            <Link href="/terms" className="hover:text-brand-yellow transition-colors">Términos Legales</Link>
            <div className="h-1.5 w-1.5 rounded-full bg-brand-yellow/40" />
            <span className="text-brand-blue border-b border-brand-blue/30 pb-1">Política de Privacidad</span>
            <div className="h-1.5 w-1.5 rounded-full bg-brand-yellow/40" />
            <Link href="/cookies" className="hover:text-brand-yellow transition-colors">Gestión de Cookies</Link>
          </nav>
        </div>
      </header>

      {/* 02. CONTENIDO DE LA POLÍTICA */}
      <section className="mx-auto w-full max-w-[var(--container-max)] px-6 py-20 md:py-32 flex flex-col gap-12 md:gap-16 flex-1 relative z-20">
        
        {/* Ficha Técnica de la Política (Banner Editorial) */}
        <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 md:p-12 shadow-soft flex flex-col lg:flex-row items-center justify-between gap-10 transition-all hover:shadow-pop">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 text-brand-blue border border-brand-dark/5 shadow-sm">
              <Landmark className="h-8 w-8" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-60 mb-1">Entidad Responsable</p>
              <p className="text-lg font-heading text-main tracking-tight">Knowing Cultures S.A.S. • Bogotá, Colombia</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 bg-brand-blue/5 px-5 py-2.5 rounded-full border border-brand-blue/10 text-[10px] font-bold uppercase tracking-widest text-brand-blue">
              <RefreshCw className="h-3.5 w-3.5" /> Revisión: Marzo 2026
            </div>
            <div className="flex items-center gap-2 bg-surface-2 px-5 py-2.5 rounded-full border border-brand-dark/5 text-[10px] font-bold uppercase tracking-widest text-muted">
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
              { bold: "Identidad Personal:", text: "Email, nombre completo y pasaporte/ID (requerido por autoridades turísticas)." },
              { bold: "Logística de Viaje:", text: "Dirección de estancia, número de contacto y preferencias de itinerario." },
              { bold: "Transacciones:", text: "Referencias de pago cifradas. Knowing Cultures S.A.S. nunca almacena números de tarjeta." },
              { bold: "Datos Técnicos:", text: "Dirección IP y cookies de sesión para garantizar la integridad de tu reserva." }
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
              { bold: "Stripe & PayPal:", text: "Procesamiento de pagos con seguridad PCI-DSS Nivel 1." },
              { bold: "Resend:", text: "Envío cifrado de confirmaciones y documentos legales." },
              { bold: "Supabase & Vercel:", text: "Arquitectura de base de datos con encriptación AES-256 de grado militar." }
            ]}
          />

          <div className="grid gap-10 lg:grid-cols-2">
            <PolicyCard 
              icon={Cookie} 
              title="5. Política de Cookies"
              description="Implementamos cookies esenciales para el carrito de compras y cookies analíticas anónimas que nos ayudan a mejorar el contenido editorial de nuestra plataforma."
              link={{ label: "Personalizar Cookies", href: "/cookies" }}
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
      <section className="bg-surface-2 border-t border-brand-dark/5 py-24 md:py-32 mt-auto relative overflow-hidden">
        {/* Marca de agua institucional sutil */}
        <Globe2 className="absolute -left-20 -bottom-20 h-96 w-96 text-brand-blue/[0.03] pointer-events-none" />

        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="relative overflow-hidden rounded-[var(--radius-[40px])] border border-brand-dark/5 bg-surface p-12 md:p-24 text-center shadow-soft group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none transition-transform duration-1000 group-hover:scale-150"></div>
            
            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-surface-2 border border-brand-dark/5 text-brand-blue mb-10 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:bg-brand-blue group-hover:text-white">
                <Mail className="h-10 w-10" />
              </div>
              <h2 className="font-heading text-4xl md:text-6xl text-main tracking-tight mb-8">¿Deseas ejercer tus derechos?</h2>
              <p className="text-xl font-light text-muted leading-relaxed mb-14">
                Nuestro Oficial de Privacidad está a tu disposición para atender cualquier solicitud relacionada con la supresión o actualización de tus datos personales.
              </p>
              <Button asChild size="lg" className="rounded-full bg-brand-blue text-white hover:bg-brand-dark px-14 py-8 text-xs font-bold uppercase tracking-[0.2em] shadow-pop transition-all hover:-translate-y-1 border-transparent">
                <a href={`mailto:${contactEmail}?subject=${encodeURIComponent('Solicitud Habeas Data | Knowing Cultures S.A.S.')}`}>
                  Contactar Soporte de Privacidad <ArrowRight className="ml-3 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Legal Sutil */}
      <div className="py-12 text-center bg-surface-2 opacity-30">
         <p className="text-[9px] font-bold uppercase tracking-[0.5em]">Knowing Cultures S.A.S. • Bogotá, Colombia • 2026</p>
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
  link 
}: { 
  icon: any, 
  title: string, 
  description?: string, 
  items?: { bold: string, text: string }[],
  link?: { label: string, href: string }
}) {
  return (
    <div className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 md:p-16 shadow-soft transition-all duration-500 hover:shadow-xl hover:border-brand-blue/20">
      <div className="flex flex-col md:flex-row md:items-center gap-8 mb-12">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-2 border border-brand-dark/5 text-brand-blue transition-all duration-500 group-hover:bg-brand-blue group-hover:text-white group-hover:scale-110 shadow-sm group-hover:rotate-3">
          <Icon className="h-8 w-8" />
        </div>
        <h2 className="font-heading text-4xl text-main tracking-tight group-hover:text-brand-blue transition-colors">{title}</h2>
      </div>
      
      {description && (
        <p className="text-xl font-light leading-relaxed text-muted mb-10 max-w-5xl">
          {description}
        </p>
      )}

      {items && (
        <div className="grid gap-8 md:grid-cols-2">
          {items.map((it, i) => (
            <div key={i} className="flex gap-5 items-start">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-yellow shrink-0 mt-3" />
              <p className="text-base font-light leading-relaxed text-muted">
                <strong className="text-main font-bold block mb-1">{it.bold}</strong> {it.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {link && (
        <div className="mt-12 pt-10 border-t border-brand-dark/5">
          <Link href={link.href} className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue hover:text-brand-dark transition-colors group/link">
            {link.label} <ArrowRight className="h-4 w-4 group-hover/link:translate-x-2 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
}