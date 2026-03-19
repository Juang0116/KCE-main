import { 
  ShieldCheck, 
  Compass, 
  HeartHandshake, 
  Receipt, 
  CalendarCheck2, 
  MessageCircle 
} from 'lucide-react';

interface LaunchTrustRailProps {
  locale?: string;
  variant?: 'default' | 'postpurchase';
}

export default function LaunchTrustRail({ locale = 'es', variant = 'default' }: LaunchTrustRailProps) {
  
  const content = variant === 'postpurchase' ? {
    item1: {
      icon: Receipt,
      title: "Documentación Lista",
      desc: "Tu factura PDF y resumen de compra están disponibles para descarga inmediata."
    },
    item2: {
      icon: CalendarCheck2,
      title: "Reserva Confirmada",
      desc: "La fecha ha sido bloqueada en nuestro sistema. Ya puedes añadirla a tu calendario."
    },
    item3: {
      icon: MessageCircle,
      title: "Línea Directa",
      desc: "Tu Travel Planner ya tiene el contexto de tu compra para asistirte por WhatsApp."
    }
  } : {
    item1: {
      icon: ShieldCheck,
      title: "Transacción Segura",
      desc: "Cifrado de grado bancario vía Stripe. Facturación clara y sin sorpresas."
    },
    item2: {
      icon: Compass,
      title: "Curaduría Experta",
      desc: "Cada itinerario en nuestro catálogo es verificado y auditado por locales."
    },
    item3: {
      icon: HeartHandshake,
      title: "Soporte Incondicional",
      desc: "Acompañamiento humano 24/7 para garantizar un viaje fluido."
    }
  };

  const items = [content.item1, content.item2, content.item3];

  return (
    <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto w-full py-10">
      {items.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center text-center group">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[2rem] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-soft text-brand-blue group-hover:scale-110 group-hover:border-brand-blue/30 group-hover:bg-brand-blue/5 transition-all duration-500">
            <item.icon className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h4 className="font-heading text-lg text-[var(--color-text)] mb-2 group-hover:text-brand-blue transition-colors">
            {item.title}
          </h4>
          <p className="text-sm font-light text-[var(--color-text-muted)] leading-relaxed px-4">
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  );
}