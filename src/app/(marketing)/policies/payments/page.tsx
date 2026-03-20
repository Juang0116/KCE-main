import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  ShieldCheck, Lock, CreditCard, FileText, 
  RefreshCcw, AlertCircle, CheckCircle2, ArrowRight 
} from 'lucide-react';

import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Pagos y seguridad — KCE',
  description: 'Información clara sobre pagos seguros con Stripe: moneda, confirmación, facturación y recomendaciones.',
  robots: { index: true, follow: true },
};

export default function PaymentsPolicyPage() {
  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] flex flex-col animate-fade-in" id="top">
      
      {/* 01. HERO PAGOS (Editorial Parity - Trust First) */}
      <section className="relative w-full flex flex-col justify-center overflow-hidden bg-[color:var(--color-surface)] border-b border-[color:var(--color-border)] px-6 py-20 md:py-32 text-center">
        {/* Destello sutil de seguridad financiera */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-64 bg-[color:var(--color-success)]/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-success)] shadow-sm backdrop-blur-md">
            <Lock className="h-3 w-3" /> Transacción Cifrada
          </div>
          
          <h1 className="font-heading text-4xl sm:text-5xl leading-tight md:text-6xl lg:text-7xl text-[color:var(--color-text)] drop-shadow-sm tracking-tight mb-6">
            Pagos seguros & <br className="hidden sm:block" />
            <span className="text-[color:var(--color-success)] italic font-light opacity-90">Transparencia total.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-[color:var(--color-text-muted)] md:text-xl">
            En KCE usamos el estándar de oro de la industria. Tus datos nunca tocan nuestros servidores; se procesan directamente con la infraestructura global de <strong className="text-[color:var(--color-text)] font-medium">Stripe</strong>.
          </p>
        </div>
      </section>

      {/* 02. CONTENEDOR PRINCIPAL */}
      <section className="mx-auto w-full max-w-[var(--container-max)] px-6 py-20 flex flex-col gap-16 flex-1 relative z-20">
        
        {/* Info Clave Moneda (Banner Principal) */}
        <div className="rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-12 shadow-soft flex flex-col md:flex-row items-start md:items-center gap-10 group">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[var(--radius-xl)] bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] text-brand-blue shadow-sm group-hover:scale-105 group-hover:border-brand-blue/30 transition-all">
            <CreditCard className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-2xl text-[color:var(--color-text)] mb-3">Operación en EUR (Euros)</h2>
            <p className="text-base font-light leading-relaxed text-[color:var(--color-text-muted)]">
              Nuestro mercado principal es Europa. Verás el total y la moneda exactos antes de confirmar. Si tu banco opera en otra moneda local, pueden aplicar conversiones y comisiones propias según sus políticas internas.
            </p>
          </div>
          
          {/* Nota Bancaria Sutil */}
          <div className="w-full md:w-80 rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/50 p-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] opacity-70 mb-3 border-b border-[color:var(--color-border)] pb-3">
              <AlertCircle className="h-3.5 w-3.5 text-brand-yellow" /> Nota bancaria
            </div>
            <p className="text-sm font-light text-[color:var(--color-text-muted)] leading-relaxed">
              Si tu banco muestra un cargo &quot;pendiente&quot;, se libera automáticamente si el pago no se completa con éxito.
            </p>
          </div>
        </div>

        {/* Grid de Pasos y Promesas (Glass Cards) */}
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { 
              icon: ShieldCheck, 
              title: 'Checkout Seguro', 
              copy: 'Resumen claro del tour, fechas y total final. Sin cargos ocultos en el último paso.',
              color: 'text-[color:var(--color-success)]',
              bg: 'bg-[color:var(--color-success)]/10',
              border: 'group-hover:border-[color:var(--color-success)]/30'
            },
            { 
              icon: FileText, 
              title: 'Confirmación & Factura', 
              copy: 'Recibirás un email instantáneo con acceso a tu factura oficial y recibo de Stripe.',
              color: 'text-brand-blue',
              bg: 'bg-brand-blue/10',
              border: 'group-hover:border-brand-blue/30'
            },
            { 
              icon: RefreshCcw, 
              title: 'Gestión de Cambios', 
              copy: 'Las políticas de cancelación son transparentes y se muestran en cada experiencia antes del pago.',
              color: 'text-brand-terra',
              bg: 'bg-brand-terra/10',
              border: 'group-hover:border-brand-terra/30'
            }
          ].map((item, idx) => (
            <div key={idx} className={`rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-soft transition-all duration-300 hover:shadow-md group ${item.border}`}>
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${item.bg} ${item.color} transition-transform duration-300 group-hover:scale-110`}>
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-xl text-[color:var(--color-text)] mb-3">{item.title}</h3>
              <p className="text-sm font-light leading-relaxed text-[color:var(--color-text-muted)]">{item.copy}</p>
            </div>
          ))}
        </div>

        {/* BUENAS PRÁCTICAS & DISPUTAS (Dos Columnas Limpias) */}
        <div className="grid gap-8 lg:grid-cols-2 pt-8 border-t border-[color:var(--color-border)]">
          
          {/* Buenas Prácticas */}
          <div className="rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-10 shadow-soft relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 opacity-[0.03] transition-transform duration-700 group-hover:scale-125 pointer-events-none">
              <ShieldCheck className="h-48 w-48 text-[color:var(--color-success)]" />
            </div>
            
            <div className="relative z-10">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-2xl text-[color:var(--color-text)]">Seguridad para el viajero</h3>
              </div>
              
              <ul className="space-y-5">
                {[
                  'Verifica que la URL sea kce.travel antes de ingresar datos.',
                  'Evita usar redes Wi-Fi públicas para transacciones financieras.',
                  'Si tu banco solicita verificación 3DS (app o SMS), complétala para asegurar la reserva.'
                ].map((text, i) => (
                  <li key={i} className="flex gap-4 text-sm font-light leading-relaxed text-[color:var(--color-text-muted)]">
                    <span className="text-[color:var(--color-success)] font-bold shrink-0 mt-0.5">•</span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Reembolsos & Disputas */}
          <div className="rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/30 p-8 md:p-10 shadow-inner group transition-colors hover:bg-[color:var(--color-surface)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-surface)] border border-[color:var(--color-border)] text-[color:var(--color-text-muted)] shadow-sm group-hover:text-brand-blue transition-colors">
                <RefreshCcw className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-2xl text-[color:var(--color-text)]">Reembolsos & Disputas</h3>
            </div>
            
            <div className="space-y-5 text-sm font-light leading-relaxed text-[color:var(--color-text-muted)]">
              <p>
                Si un reembolso aplica según nuestra política, lo procesamos vía Stripe de inmediato. El tiempo de reflejo en tu extracto depende exclusivamente de tu entidad bancaria.
              </p>
              <p>
                Si tienes un problema, <strong className="text-[color:var(--color-text)] font-medium">contáctanos primero</strong>. Las disputas bancarias (chargebacks) son procesos extremadamente lentos; nuestro equipo de soporte suele resolver cualquier incidencia financiera en una fracción del tiempo.
              </p>
              
              <div className="mt-8 pt-4">
                <Button asChild variant="outline" className="w-full sm:w-auto rounded-full px-8 border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)] hover:text-brand-blue hover:border-brand-blue transition-colors">
                  <Link href="/contact">Hablar con Soporte <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>

        </div>
      </section>
      
    </main>
  );
}