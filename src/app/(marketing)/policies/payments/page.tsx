/* src/app/(marketing)/policies/payments/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  FileText,
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Landmark,
  History,
  Globe2,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Pagos Seguros y Transparencia | Knowing Cultures S.A.S.',
  description:
    'Información técnica sobre pagos cifrados vía Stripe, manejo de divisas y facturación legal para tus experiencias en Colombia.',
  robots: { index: true, follow: true },
};

export default function PaymentsPolicyPage() {
  return (
    <main
      className="flex min-h-screen animate-fade-in flex-col bg-base"
      id="top"
    >
      {/* 01. HERO SEGURIDAD (ADN KCE PREMIUM) */}
      <section className="relative overflow-hidden border-b border-white/5 bg-brand-dark px-6 py-24 text-center md:py-32">
        {/* Destello de fondo (Verde Seguridad / Éxito) */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-full max-w-4xl -translate-x-1/2 rounded-full bg-green-500/10 blur-[120px]" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
            <Lock className="h-3.5 w-3.5 text-brand-yellow" /> Infraestructura Cifrada
          </div>

          <h1 className="mb-8 font-heading text-5xl leading-[1.05] tracking-tight text-white md:text-7xl lg:text-8xl">
            Pagos seguros & <br className="hidden sm:block" />
            <span className="font-light italic text-brand-yellow opacity-90">
              transparencia total.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
            En <span className="font-medium text-white">Knowing Cultures S.A.S.</span> usamos el
            estándar de oro de la industria. Tus datos sensibles nunca tocan nuestros servidores;
            son procesados por la infraestructura global de{' '}
            <strong className="font-bold text-white">Stripe</strong> y{' '}
            <strong className="font-bold text-white">PayPal</strong>.
          </p>
        </div>
      </section>

      {/* BREADCRUMB SUTIL */}
      <div className="w-full border-b border-brand-dark/5 bg-surface px-6 py-4 dark:border-white/5">
        <div className="mx-auto flex max-w-[var(--container-max)] items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-80">
          <Link
            href="/"
            className="transition-colors hover:text-brand-blue"
          >
            Inicio
          </Link>
          <ArrowRight className="h-3 w-3 opacity-30" />
          <span className="text-main">Seguridad de Pagos</span>
        </div>
      </div>

      {/* 02. CONTENEDOR PRINCIPAL */}
      <section className="mx-auto flex w-full max-w-[var(--container-max)] flex-1 flex-col gap-16 px-6 py-20 md:gap-24 md:py-32">
        {/* Info Clave Moneda (Banner Editorial) */}
        <div className="group flex flex-col items-start gap-12 rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-soft transition-all hover:shadow-pop dark:border-white/5 md:p-14 lg:flex-row lg:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[var(--radius-2xl)] border border-brand-blue/10 bg-brand-blue/5 text-brand-blue shadow-sm transition-transform duration-500 group-hover:scale-105">
            <Landmark className="h-10 w-10" />
          </div>
          <div className="flex-1">
            <h2 className="mb-4 font-heading text-3xl tracking-tight text-main md:text-4xl">
              Gestión de Divisas (EUR/USD)
            </h2>
            <p className="text-lg font-light leading-relaxed text-muted">
              Nuestra operación principal se liquida en{' '}
              <strong className="font-bold text-main">Euros (EUR)</strong> o{' '}
              <strong className="font-bold text-main">Dólares (USD)</strong>. Antes de pagar, verás
              el desglose exacto. Si tu tarjeta es de otra divisa, el banco emisor aplicará su tipo
              de cambio oficial, garantizando que siempre pagues el valor justo de mercado.
            </p>
          </div>

          <div className="relative flex w-full flex-col justify-center overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface-2 p-8 lg:w-80">
            <div className="absolute right-0 top-0 p-4 opacity-5">
              <Globe2 className="h-20 w-20 text-brand-blue" />
            </div>
            <div className="mb-4 flex items-center gap-2 border-b border-brand-dark/5 pb-3 text-[10px] font-bold uppercase tracking-widest text-muted">
              <AlertCircle className="h-4 w-4 text-brand-yellow" /> Nota Bancaria
            </div>
            <p className="relative z-10 text-xs font-light leading-relaxed text-muted">
              Cualquier cargo que aparezca como &quot;pendiente&quot; tras un intento fallido es una
              reserva de cupo que tu banco libera automáticamente en un plazo de 2 a 5 días hábiles.
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
              border: 'border-green-500/10',
            },
            {
              icon: FileText,
              title: 'Voucher & Factura',
              copy: 'Al confirmar el pago, se genera automáticamente un documento legal de reserva y factura PDF en tu bandeja de entrada.',
              color: 'text-brand-blue',
              bg: 'bg-brand-blue/5',
              border: 'border-brand-blue/10',
            },
            {
              icon: History,
              title: 'Trazabilidad Total',
              copy: 'Puedes consultar tu historial de transacciones y estados de pago en tiempo real desde tu perfil de viajero.',
              color: 'text-brand-terra',
              bg: 'bg-brand-terra/5',
              border: 'border-brand-terra/10',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`group rounded-[var(--radius-3xl)] border ${item.border} ${item.bg} p-10 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-xl`}
            >
              <div
                className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ${item.color} transition-transform duration-500 group-hover:rotate-3 group-hover:scale-110`}
              >
                <item.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-4 font-heading text-2xl tracking-tight text-main">{item.title}</h3>
              <p className="text-sm font-light leading-relaxed text-muted">{item.copy}</p>
            </div>
          ))}
        </div>

        {/* CULTURA DE SEGURIDAD (Bloques Maestros) */}
        <div className="grid gap-12 border-t border-brand-dark/5 pt-12 lg:grid-cols-2">
          <div className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft md:p-14">
            <div className="pointer-events-none absolute -bottom-10 -right-10 text-green-600 opacity-[0.03] transition-transform duration-1000 group-hover:scale-110">
              <ShieldCheck className="h-72 w-72" />
            </div>

            <div className="relative z-10">
              <div className="mb-10 flex items-center gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-3xl tracking-tight text-main">
                  Recomendaciones KCE
                </h3>
              </div>

              <ul className="space-y-6">
                {[
                  'Verifica que el candado de seguridad SSL esté activo en kce.travel.',
                  'Usa métodos de pago con autenticación biométrica o token (Apple Pay / Google Pay).',
                  'Evita realizar transacciones desde conexiones de Wi-Fi públicas o abiertas.',
                  'Conserva tu correo de confirmación como soporte legal de tu contrato.',
                ].map((text, i) => (
                  <li
                    key={i}
                    className="flex gap-4 text-base font-light leading-relaxed text-muted"
                  >
                    <span className="mt-1 shrink-0 font-bold text-brand-blue">•</span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface-2 p-10 shadow-inner transition-all hover:bg-surface md:p-14">
            <div className="mb-10 flex items-center gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-dark/10 bg-surface text-muted transition-colors group-hover:text-brand-blue">
                <RefreshCcw className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-3xl tracking-tight text-main">
                Gestión de Incidencias
              </h3>
            </div>

            <div className="space-y-6 text-base font-light leading-relaxed text-muted">
              <p>
                Si detectas un cargo duplicado o un error en la tarifa aplicada, te pedimos{' '}
                <strong className="font-bold text-brand-blue">
                  contactar a nuestro soporte humano
                </strong>{' '}
                antes de iniciar una disputa bancaria.
              </p>
              <p>
                En <strong className="font-bold text-main">Knowing Cultures S.A.S.</strong>{' '}
                resolvemos cualquier error técnico en menos de 24 horas hábiles, evitando procesos
                burocráticos lentos con tu entidad financiera.
              </p>

              <div className="pt-10">
                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-full border-transparent bg-brand-blue px-10 py-8 text-xs font-bold uppercase tracking-widest text-white shadow-pop transition-all hover:bg-brand-dark sm:w-auto"
                >
                  <Link
                    href="/contact"
                    className="flex items-center justify-center gap-3"
                  >
                    Contactar Concierge <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER DE CONFIANZA (Minimalist Security) */}
      <section className="mt-auto border-t border-brand-dark/5 bg-surface-2 py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-10 inline-flex h-20 w-20 items-center justify-center rounded-full border border-brand-dark/5 bg-surface shadow-soft">
            <ShieldAlert className="h-10 w-10 text-brand-yellow" />
          </div>
          <h2 className="mb-8 font-heading text-4xl tracking-tight text-main md:text-6xl">
            Navegación Protegida
          </h2>
          <p className="mx-auto mb-14 max-w-2xl text-lg font-light leading-relaxed text-muted md:text-xl">
            Contamos con un equipo legal y técnico monitoreando la seguridad de cada transacción
            24/7 desde Bogotá. Tu única preocupación debe ser qué empacar.
          </p>
          <div className="flex items-center justify-center gap-8 opacity-40 grayscale">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em]">STRIPE SECURE</div>
            <div className="h-1.5 w-1.5 rounded-full bg-brand-blue" />
            <div className="text-[10px] font-bold uppercase tracking-[0.3em]">
              AES-256 ENCRYPTION
            </div>
          </div>
        </div>
      </section>

      {/* Marca de agua legal sutil */}
      <div className="bg-surface-2 py-12 text-center opacity-30">
        <p className="text-[9px] font-bold uppercase tracking-[0.4em]">
          Knowing Cultures S.A.S. • Bogotá, Colombia
        </p>
      </div>
    </main>
  );
}
