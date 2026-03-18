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
    <main className="min-h-screen bg-[var(--color-bg)] pb-24">
      
      {/* HERO PRIVACIDAD */}
      <header className="relative overflow-hidden bg-brand-dark px-6 py-20 md:py-28 text-center text-white shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.png')] bg-repeat"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md">
            <Lock className="h-3 w-3" /> Protección de Datos
          </div>
          <h1 className="font-heading text-4xl leading-tight md:text-6xl drop-shadow-md">
            Tu privacidad, <br/>
            <span className="text-brand-yellow font-light italic text-3xl md:text-5xl lg:text-6xl">Nuestra prioridad.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
            En KCE valoramos la confianza que depositas en nosotros. Esta política explica de forma clara cómo cuidamos tu información personal.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <nav aria-label="Navegación legal" className="flex flex-wrap justify-center gap-3">
              {['Términos', 'Cookies', 'Contacto'].map((item) => (
                <Link 
                  key={item}
                  href={`/${item.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`} 
                  className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/20"
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* CONTENIDO DE LA POLÍTICA */}
      <section className="mx-auto max-w-5xl px-6 -mt-10 relative z-20 space-y-8">
        
        {/* Banner de Actualización */}
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/5 text-brand-blue">
              <RefreshCw className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-[var(--color-text)]">Última actualización: marzo de 2026</p>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">
            Sitio Oficial: {site}
          </div>
        </div>

        {/* Grid de Secciones */}
        <div className="grid gap-6">
          
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
            description="Usamos tus datos exclusivamente para procesar tus reservas, enviarte confirmaciones de viaje y mejorar la seguridad de nuestra plataforma. No vendemos tus datos a terceros."
          />

          <div className="grid gap-6 md:grid-cols-2">
            <PolicyCard 
              icon={UserCheck} 
              title="3) Base legal"
              description="Tratamos datos bajo la ejecución de un contrato (reserva), interés legítimo (seguridad) y tu consentimiento explícito."
            />
            <PolicyCard 
              icon={Cookie} 
              title="4) Cookies"
              description="Usamos cookies técnicas necesarias y, si lo autorizas, analíticas para entender cómo mejorar KCE."
              link={{ label: "Gestionar Cookies", href: "/cookies" }}
            />
          </div>

          <PolicyCard 
            icon={HardDrive} 
            title="5) Proveedores de confianza"
            description="Solo compartimos lo necesario con aliados que cumplen estándares globales de seguridad:"
            items={[
              { bold: "Pagos:", text: "Stripe (nosotros no guardamos tus números de tarjeta)." },
              { bold: "Emails:", text: "Resend (para comunicaciones transaccionales)." },
              { bold: "Infraestructura:", text: "Vercel y Supabase (hosting y base de datos protegida)." }
            ]}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <PolicyCard 
              icon={ShieldCheck} 
              title="6) Seguridad"
              description="Aplicamos enlaces firmados y monitoreo constante. Ningún sistema es infalible, pero protegemos KCE con tecnología de punta."
            />
            <PolicyCard 
              icon={FileText} 
              title="7) Tus Derechos"
              description="Puedes solicitar acceso, corrección o eliminación de tus datos en cualquier momento."
            />
          </div>

          {/* CONTACTO DE PRIVACIDAD */}
          <div className="rounded-[3rem] border border-brand-blue/20 bg-brand-blue/5 p-10 md:p-16 text-center shadow-inner">
            <Mail className="mx-auto h-10 w-10 text-brand-blue mb-6" />
            <h2 className="font-heading text-3xl text-brand-blue mb-4">¿Dudas sobre tus datos?</h2>
            <p className="text-lg font-light text-[var(--color-text)]/60 leading-relaxed mb-10">
              Nuestro equipo de soporte técnico resolverá cualquier solicitud de privacidad de forma personalizada.
            </p>
            <Button asChild size="lg" className="rounded-full px-10 shadow-lg">
              <a href={`mailto:${contactEmail}?subject=${encodeURIComponent('Privacidad | Solicitud de datos')}`}>
                Contactar a {contactEmail} <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

        </div>
      </section>

    </main>
  );
}

// Sub-componente interno para limpieza del código
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
    <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-10 shadow-lg">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue">
          <Icon className="h-6 w-6" />
        </div>
        <h2 className="font-heading text-2xl text-brand-blue">{title}</h2>
      </div>
      
      {description && (
        <p className="text-base font-light leading-relaxed text-[var(--color-text)]/70 mb-6">
          {description}
        </p>
      )}

      {items && (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={i} className="flex gap-3 text-sm font-light text-[var(--color-text)]/70">
              <span className="text-brand-blue font-bold">•</span>
              <span><strong>{it.bold}</strong> {it.text}</span>
            </li>
          ))}
        </ul>
      )}

      {link && (
        <div className="mt-6">
          <Link href={link.href} className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue hover:underline">
            {link.label} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}