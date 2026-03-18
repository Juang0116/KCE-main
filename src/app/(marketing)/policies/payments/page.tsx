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
    <main className="min-h-screen bg-[var(--color-bg)] pb-24">
      
      {/* HERO PAGOS (TRUST-FIRST) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-20 md:py-28 text-center text-white shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.png')] bg-repeat"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md shadow-sm">
            <Lock className="h-3 w-3" /> Transacción Cifrada
          </div>
          <h1 className="font-heading text-4xl leading-tight md:text-6xl drop-shadow-md">
            Pagos seguros & <br/>
            <span className="text-brand-yellow font-light italic text-3xl md:text-5xl lg:text-6xl">Transparencia total.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
            En KCE usamos el estándar de oro de la industria. Tus datos nunca tocan nuestros servidores; se procesan directamente con la infraestructura global de <strong>Stripe</strong>.
          </p>
        </div>
      </section>

      {/* CONTENEDOR PRINCIPAL */}
      <section className="mx-auto max-w-6xl px-6 -mt-10 relative z-20 space-y-10">
        
        {/* INFO CLAVE MONEDA */}
        <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-10">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] bg-brand-blue/5 text-brand-blue">
            <CreditCard className="h-10 w-10" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-heading text-2xl text-brand-blue mb-4">Operación en EUR (Euros)</h2>
            <p className="text-base font-light leading-relaxed text-[var(--color-text)]/70">
              Nuestro mercado principal es Europa. Verás el total y la moneda antes de confirmar. Si tu banco opera en otra moneda, puede aplicar conversiones y comisiones propias según sus políticas internas.
            </p>
          </div>
          <div className="w-full md:w-auto rounded-2xl border border-brand-blue/10 bg-brand-blue/5 p-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-blue/50 mb-2">
              <AlertCircle className="h-3 w-3" /> Nota bancaria
            </div>
            <p className="text-xs font-light text-brand-blue/70 leading-relaxed">
              Si tu banco muestra un cargo &quot;pendiente&quot;, se libera automáticamente si el pago no se completa con éxito.
            </p>
          </div>
        </div>

        {/* GRID DE PASOS Y PROMESAS */}
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { 
              icon: ShieldCheck, 
              title: 'Checkout Seguro', 
              copy: 'Resumen claro del tour, fechas y total final. Sin cargos ocultos en el último paso.',
              color: 'text-emerald-500'
            },
            { 
              icon: FileText, 
              title: 'Confirmación & Factura', 
              copy: 'Recibirás un email instantáneo con acceso a tu factura oficial y recibo de Stripe.',
              color: 'text-brand-blue'
            },
            { 
              icon: RefreshCcw, 
              title: 'Gestión de Cambios', 
              copy: 'Las políticas de cancelación son transparentes y se muestran en cada experiencia antes del pago.',
              color: 'text-amber-500'
            }
          ].map((item, idx) => (
            <div key={idx} className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-lg transition-all hover:shadow-xl group">
              <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] ${item.color} transition-colors group-hover:bg-brand-blue group-hover:text-white`}>
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-xl text-brand-blue mb-3">{item.title}</h3>
              <p className="text-sm font-light leading-relaxed text-[var(--color-text)]/60">{item.copy}</p>
            </div>
          ))}
        </div>

        {/* BUENAS PRÁCTICAS & DISPUTAS (DOS COLUMNAS) */}
        <div className="grid gap-8 lg:grid-cols-2">
          
          {/* Buenas Prácticas */}
          <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 shadow-lg relative overflow-hidden">
            <div className="absolute -right-6 -top-6 opacity-[0.03]">
              <ShieldCheck className="h-32 w-32" />
            </div>
            <h3 className="font-heading text-2xl text-brand-blue mb-8 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              Seguridad para el viajero
            </h3>
            <ul className="space-y-6">
              {[
                'Verifica que la URL sea kce.travel antes de ingresar datos.',
                'Evita usar redes Wi-Fi públicas para transacciones financieras.',
                'Si tu banco solicita verificación 3DS (app o SMS), complétala para asegurar la reserva.'
              ].map((text, i) => (
                <li key={i} className="flex gap-4 text-sm font-light leading-relaxed text-[var(--color-text)]/70">
                  <span className="text-brand-yellow font-bold">•</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Reembolsos */}
          <div className="rounded-[3rem] border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-10 shadow-inner">
            <h3 className="font-heading text-2xl text-brand-blue mb-8">Reembolsos & Disputas</h3>
            <div className="space-y-4 text-sm font-light leading-relaxed text-[var(--color-text)]/60">
              <p>
                Si un reembolso aplica según nuestra política, lo procesamos vía Stripe de inmediato. El tiempo de reflejo en tu extracto depende exclusivamente de tu entidad bancaria.
              </p>
              <p>
                Si tienes un problema, contáctanos primero. Las disputas bancarias (chargebacks) son procesos lentos; nuestro equipo de soporte suele resolver cualquier incidencia en una fracción del tiempo.
              </p>
              <div className="mt-8">
                <Button asChild variant="outline" className="rounded-full px-8 border-brand-blue/20 text-brand-blue">
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