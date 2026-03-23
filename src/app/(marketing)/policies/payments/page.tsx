/* src/app/(marketing)/policies/payments/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  ShieldCheck, Lock, CreditCard, FileText, 
  RefreshCcw, AlertCircle, CheckCircle2, ArrowRight,
  ShieldAlert, Landmark, History, Globe2
} from 'lucide-react';

import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Pagos Seguros y Transparencia | Knowing Cultures S.A.S.',
  description: 'Información técnica sobre pagos cifrados vía Stripe, manejo de divisas y facturación legal para tus experiencias en Colombia.',
  robots: { index: true, follow: true },
};

export default function PaymentsPolicyPage() {
  return (
    <main className="min-h-screen bg-base flex flex-col animate-fade-in" id="top">
      
      {/* 01. HERO SEGURIDAD (ADN KCE PREMIUM) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center border-b border-white/5">
        {/* Destello de fondo (Verde Seguridad / Éxito) */}
        <div className="absolute top-0 left-1/2 w-full max-w-4xl h-80 bg-green-500/10 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-5xl flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
            <Lock className="h-3.5 w-3.5 text-brand-yellow" /> Infraestructura Cifrada
          </div>
          
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-white tracking-tight leading-[1.05] mb-8">
            Pagos seguros & <br className="hidden sm:block" />
            <span className="text-brand-yellow font-light italic opacity-90">transparencia total.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg md:text-xl font-light leading-relaxed text-white/70">
            En <span className="text-white font-medium">Knowing Cultures S.A.S.</span> usamos el estándar de oro de la industria. Tus datos sensibles nunca tocan nuestros servidores; son procesados por la infraestructura global de <strong className="text-white font-bold">Stripe</strong> y <strong className="text-white font-bold">PayPal</strong>.
          </p>
        </div>
      </section>

      {/* BREADCRUMB SUTIL */}
      <div className="w-full bg-surface border-b border-brand-dark/5 dark:border-white/5 py-4 px-6">
        <div className="mx-auto max-w-[var(--container-max)] flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-80">
          <Link href="/" className="hover:text-brand-blue transition-colors">Inicio</Link>
          <ArrowRight className="h-3 w-3 opacity-30" />
          <span className="text-main">Seguridad de Pagos</span>
        </div>
      </div>

      {/* 02. CONTENEDOR PRINCIPAL */}
      <section className="mx-auto w-full max-w-[var(--container-max)] px-6 py-20 md:py-32 flex flex-col gap-16 md:gap-24 flex-1">
        
        {/* Info Clave Moneda (Banner Editorial) */}
        <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 md:p-14 shadow-soft flex flex-col lg:flex-row items-start lg:items-center gap-12 group transition-all hover:shadow-pop">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[var(--radius-2xl)] bg-brand-blue/5 border border-brand-blue/10 text-brand-blue shadow-sm group-hover:scale-105 transition-transform duration-500">
            <Landmark className="h-10 w-10" />
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-3xl md:text-4xl text-main tracking-tight mb-4">Gestión de Divisas (EUR/USD)</h2>
            <p className="text-lg font-light leading-relaxed text-muted">
              Nuestra operación principal se liquida en <strong className="text-main font-bold">Euros (EUR)</strong> o <strong className="text-main font-bold">Dólares (USD)</strong>. Antes de pagar, verás el desglose exacto. Si tu tarjeta es de otra divisa, el banco emisor aplicará su tipo de cambio oficial, garantizando que siempre pagues el valor justo de mercado.
            </p>
          </div>
          
          <div className="w-full lg:w-80 rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface-2 p-8 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
               <Globe2 className="h-20 w-20 text-brand-blue" />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted mb-4 border-b border-brand-dark/5 pb-3">
              <AlertCircle className="h-4 w-4 text-brand-yellow" /> Nota Bancaria
            </div>
            <p className="text-xs font-light text-muted leading-relaxed relative z-10">
              Cualquier cargo que aparezca como &quot;pendiente&quot; tras un intento fallido es una reserva de cupo que tu banco libera automáticamente en un plazo de 2 a 5 días hábiles.
            </p>
          </div>
        </div>

        {/* Grid de Garantías (Tarjetas Premium) */}
        <div className="grid gap-10 md:grid-cols-3">
          {[
            { 
              icon: ShieldCheck, 
              title: 'Checkout Seguro', 
              copy: 'Nuestras sesiones de pago cuentan con validación 3D Secure y cumplen con el estándar PCI-DSS Nivel 1.',
              color: 'text-green-600',
              bg: 'bg-green-500/5',
              border: 'border-green-500/10'
            },
            { 
              icon: FileText, 
              title: 'Voucher & Factura', 
              copy: 'Al confirmar el pago, se genera automáticamente un documento legal de reserva y factura PDF en tu bandeja de entrada.',
              color: 'text-brand-blue',
              bg: 'bg-brand-blue/5',
              border: 'border-brand-blue/10'
            },
            { 
              icon: History, 
              title: 'Trazabilidad Total', 
              copy: 'Puedes consultar tu historial de transacciones y estados de pago en tiempo real desde tu perfil de viajero.',
              color: 'text-brand-terra',
              bg: 'bg-brand-terra/5',
              border: 'border-brand-terra/10'
            }
          ].map((item, idx) => (
            <div key={idx} className={`group rounded-[var(--radius-3xl)] border ${item.border} ${item.bg} p-10 shadow-soft transition-all duration-500 hover:shadow-xl hover:-translate-y-2`}>
              <div className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ${item.color} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                <item.icon className="h-7 w-7" />
              </div>
              <h3 className="font-heading text-2xl text-main tracking-tight mb-4">{item.title}</h3>
              <p className="text-sm font-light leading-relaxed text-muted">{item.copy}</p>
            </div>
          ))}
        </div>

        {/* CULTURA DE SEGURIDAD (Bloques Maestros) */}
        <div className="grid gap-12 lg:grid-cols-2 pt-12 border-t border-brand-dark/5">
          
          <div className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 md:p-14 shadow-soft relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-[0.03] text-green-600 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <ShieldCheck className="h-72 w-72" />
            </div>
            
            <div className="relative z-10">
              <div className="mb-10 flex items-center gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-3xl text-main tracking-tight">Recomendaciones KCE</h3>
              </div>
              
              <ul className="space-y-6">
                {[
                  'Verifica que el candado de seguridad SSL esté activo en kce.travel.',
                  'Usa métodos de pago con autenticación biométrica o token (Apple Pay / Google Pay).',
                  'Evita realizar transacciones desde conexiones de Wi-Fi públicas o abiertas.',
                  'Conserva tu correo de confirmación como soporte legal de tu contrato.'
                ].map((text, i) => (
                  <li key={i} className="flex gap-4 text-base font-light leading-relaxed text-muted">
                    <span className="text-brand-blue font-bold shrink-0 mt-1">•</span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface-2 p-10 md:p-14 shadow-inner transition-all hover:bg-surface">
            <div className="mb-10 flex items-center gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface border border-brand-dark/10 text-muted transition-colors group-hover:text-brand-blue">
                <RefreshCcw className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-3xl text-main tracking-tight">Gestión de Incidencias</h3>
            </div>
            
            <div className="space-y-6 text-base font-light leading-relaxed text-muted">
              <p>
                Si detectas un cargo duplicado o un error en la tarifa aplicada, te pedimos <strong className="text-brand-blue font-bold">contactar a nuestro soporte humano</strong> antes de iniciar una disputa bancaria.
              </p>
              <p>
                En <strong className="text-main font-bold">Knowing Cultures S.A.S.</strong> resolvemos cualquier error técnico en menos de 24 horas hábiles, evitando procesos burocráticos lentos con tu entidad financiera.
              </p>
              
              <div className="pt-10">
                <Button asChild size="lg" className="w-full sm:w-auto rounded-full px-10 py-8 bg-brand-blue text-white hover:bg-brand-dark shadow-pop transition-all text-xs font-bold uppercase tracking-widest border-transparent">
                  <Link href="/contact" className="flex items-center justify-center gap-3">Contactar Concierge <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* FOOTER DE CONFIANZA (Minimalist Security) */}
      <section className="bg-surface-2 border-t border-brand-dark/5 py-24 md:py-32 mt-auto">
        <div className="mx-auto max-w-4xl px-6 text-center">
           <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-surface border border-brand-dark/5 shadow-soft mb-10">
              <ShieldAlert className="h-10 w-10 text-brand-yellow" />
           </div>
           <h2 className="font-heading text-4xl md:text-6xl text-main tracking-tight mb-8">Navegación Protegida</h2>
           <p className="text-lg md:text-xl font-light text-muted leading-relaxed max-w-2xl mx-auto mb-14">
             Contamos con un equipo legal y técnico monitoreando la seguridad de cada transacción 24/7 desde Bogotá. Tu única preocupación debe ser qué empacar.
           </p>
           <div className="flex justify-center items-center gap-8 opacity-40 grayscale">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em]">STRIPE SECURE</div>
              <div className="h-1.5 w-1.5 rounded-full bg-brand-blue" />
              <div className="text-[10px] font-bold uppercase tracking-[0.3em]">AES-256 ENCRYPTION</div>
           </div>
        </div>
      </section>

      {/* Marca de agua legal sutil */}
      <div className="py-12 text-center bg-surface-2 opacity-30">
         <p className="text-[9px] font-bold uppercase tracking-[0.4em]">Knowing Cultures S.A.S. • Bogotá, Colombia</p>
      </div>
      
    </main>
  );
}