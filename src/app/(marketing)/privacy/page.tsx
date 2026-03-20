import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  ShieldCheck, Eye, Database, Lock, 
  Mail, UserCheck, RefreshCw, FileText, 
  ArrowRight, Cookie, HardDrive
} from 'lucide-react';

import { Button } from '@/components/ui/Button';

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(BASE_SITE_URL),
  title: 'Privacidad — KCE',
  description: 'Política de privacidad de KCE: datos que recopilamos, finalidades, cookies y tus derechos como usuario.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Privacidad — KCE',
    description: 'Conoce cómo KCE protege y gestiona tus datos de contacto y reserva.',
    url: '/privacy',
    type: 'article',
  },
};

export default function PrivacyPage() {
  const contactEmail = (process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@kce.travel').trim();
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').trim().replace(/\/+$/, '');

  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] flex flex-col animate-fade-in">
      
      {/* 01. HERO PRIVACIDAD (Editorial Parity - Claro y Elegante) */}
      <header className="relative w-full flex flex-col justify-center overflow-hidden bg-[color:var(--color-surface)] border-b border-[color:var(--color-border)] px-6 py-20 md:py-32 text-center">
        {/* Destello sutil de seguridad */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-brand-yellow/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm backdrop-blur-md">
            <Lock className="h-3 w-3" /> Protección de Datos
          </div>
          
          <h1 className="font-heading text-4xl sm:text-5xl leading-tight md:text-6xl lg:text-7xl text-[color:var(--color-text)] drop-shadow-sm tracking-tight mb-6">
            Tu privacidad, <br className="hidden sm:block" />
            <span className="text-brand-blue italic font-light">nuestra prioridad.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-[color:var(--color-text-muted)] md:text-xl">
            En KCE valoramos la confianza que depositas en nosotros. Esta política explica de forma clara cómo cuidamos tu información personal.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <nav aria-label="Navegación legal" className="flex flex-wrap justify-center gap-3">
              {['Términos', 'Cookies', 'Contacto'].map((item) => (
                <Link 
                  key={item}
                  href={`/${item.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`} 
                  className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-surface-2)] hover:border-brand-blue hover:text-brand-blue shadow-sm"
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* 02. CONTENIDO DE LA POLÍTICA */}
      <section className="mx-auto w-full max-w-[var(--container-max)] px-6 py-20 flex flex-col gap-12 flex-1 relative z-20">
        
        {/* Banner de Actualización (Info Strip) */}
        <div className="rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 md:px-10 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-surface-2)] text-[color:var(--color-text-muted)] border border-[color:var(--color-border)]">
              <RefreshCw className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-[color:var(--color-text)]">Última actualización: marzo de 2026</p>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] opacity-70">
            Sitio Oficial: {site}
          </div>
        </div>

        {/* Grid de Secciones */}
        <div className="grid gap-8">
          
          <PolicyCard 
            icon={Database} 
            title="1) Datos que recopilamos"
            items={[
              { bold: "Cuenta:", text: "Email, nombre y teléfono (opcional)." },
              { bold: "Reservas:", text: "Tour, fecha, viajeros y referencias técnicas de pago." },
              { bold: "Soporte:", text: "Mensajes y adjuntos que envías en tus consultas." },
              { bold: "Técnicos:", text: "IP, navegador y logs de seguridad anti-fraude." }
            ]}
          />

          <PolicyCard 
            icon={Eye} 
            title="2) Uso de la información"
            description="Usamos tus datos exclusivamente para procesar tus reservas, enviarte confirmaciones de viaje y mejorar la seguridad de nuestra plataforma. No vendemos tus datos a terceros en ninguna circunstancia."
          />

          <div className="grid gap-8 md:grid-cols-2">
            <PolicyCard 
              icon={UserCheck} 
              title="3) Base legal"
              description="Tratamos datos bajo la ejecución de un contrato (reserva), interés legítimo (seguridad) y tu consentimiento explícito."
            />
            <PolicyCard 
              icon={Cookie} 
              title="4) Cookies"
              description="Usamos cookies técnicas estrictamente necesarias y, si lo autorizas, analíticas para entender cómo mejorar KCE."
              link={{ label: "Gestionar Cookies", href: "/cookies" }}
            />
          </div>

          <PolicyCard 
            icon={HardDrive} 
            title="5) Proveedores de confianza"
            description="Solo compartimos lo estrictamente necesario con aliados que cumplen estándares globales de seguridad:"
            items={[
              { bold: "Pagos:", text: "Stripe (nosotros no guardamos ni procesamos tus números de tarjeta)." },
              { bold: "Emails:", text: "Resend (para el envío de comunicaciones transaccionales)." },
              { bold: "Infraestructura:", text: "Vercel y Supabase (hosting y base de datos con encriptación de extremo a extremo)." }
            ]}
          />

          <div className="grid gap-8 md:grid-cols-2">
            <PolicyCard 
              icon={ShieldCheck} 
              title="6) Seguridad"
              description="Aplicamos enlaces firmados (magic links) y monitoreo constante. Ningún sistema es infalible, pero protegemos la plataforma con tecnología de punta."
            />
            <PolicyCard 
              icon={FileText} 
              title="7) Tus Derechos"
              description="Puedes solicitar acceso, corrección, exportación o eliminación total de tus datos en cualquier momento desde tu panel."
            />
          </div>
        </div>
      </section>

      {/* 03. CONTACTO DE PRIVACIDAD (Footer Action) */}
      <section className="bg-[color:var(--color-surface-2)]/30 border-t border-[color:var(--color-border)] py-20 mt-auto">
        <div className="mx-auto max-w-4xl px-6">
          <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-brand-blue/20 bg-brand-blue/5 p-12 md:p-16 shadow-inner text-center group">
            {/* Glow Sutil */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-blue/10 rounded-full blur-[80px] pointer-events-none transition-transform duration-1000 group-hover:scale-150"></div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-[color:var(--color-surface)] border border-[color:var(--color-border)] text-brand-blue mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Mail className="h-8 w-8" />
              </div>
              <h2 className="font-heading text-3xl md:text-4xl text-[color:var(--color-text)] tracking-tight mb-4">¿Dudas sobre tus datos?</h2>
              <p className="text-lg font-light text-[color:var(--color-text-muted)] leading-relaxed mb-10">
                Nuestro equipo de soporte técnico y legal resolverá cualquier solicitud de privacidad o ejercicio de derechos de forma personalizada.
              </p>
              <Button asChild size="lg" className="rounded-full bg-brand-blue text-white hover:bg-brand-blue/90 px-10 py-6 text-base shadow-pop hover:-translate-y-0.5 transition-transform">
                <a href={`mailto:${contactEmail}?subject=${encodeURIComponent('Privacidad | Solicitud de datos')}`}>
                  Contactar a {contactEmail} <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

// Sub-componente interno rediseñado (Zero-Pattern Layout)
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
    <div className="rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-10 shadow-soft transition-shadow hover:shadow-md group">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-xl)] bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] text-brand-blue group-hover:bg-brand-blue/5 transition-colors">
          <Icon className="h-6 w-6" />
        </div>
        <h2 className="font-heading text-2xl text-[color:var(--color-text)]">{title}</h2>
      </div>
      
      {description && (
        <p className="text-base font-light leading-relaxed text-[color:var(--color-text-muted)] mb-6">
          {description}
        </p>
      )}

      {items && (
        <ul className="space-y-4">
          {items.map((it, i) => (
            <li key={i} className="flex gap-4 text-sm font-light text-[color:var(--color-text-muted)] leading-relaxed">
              <span className="text-brand-blue font-bold shrink-0 mt-0.5">•</span>
              <span><strong className="text-[color:var(--color-text)] font-medium">{it.bold}</strong> {it.text}</span>
            </li>
          ))}
        </ul>
      )}

      {link && (
        <div className="mt-8 pt-6 border-t border-[color:var(--color-border)]">
          <Link href={link.href} className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue hover:text-brand-terra transition-colors">
            {link.label} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}