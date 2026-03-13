// src/features/marketing/ProofStack.tsx
import Link from 'next/link';

import TrustBar from '@/features/marketing/TrustBar';

type ProofStackProps = {
  tourTitle: string;
  city?: string | null;
  variant: 'A' | 'B';
};

function Faq() {
  const items = [
    {
      q: '¿Qué pasa después de pagar?',
      a: 'Te llega un email con confirmación y tu factura. Luego coordinamos detalles (punto de encuentro, hora, recomendaciones).',
    },
    {
      q: '¿El precio final puede cambiar?',
      a: 'El total final se confirma en el checkout seguro. Si hay extras opcionales, se muestran antes de pagar.',
    },
    {
      q: '¿Puedo cancelar?',
      a: 'Sí. Consulta nuestra política de cancelación para ver condiciones exactas.',
      href: '/policies/cancellation',
    },
    {
      q: '¿Puedo hablar con alguien antes de pagar?',
      a: 'Claro. Escríbenos por WhatsApp y te ayudamos con dudas rápidas.',
      href: '/faq',
    },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-lg font-semibold">Preguntas frecuentes</div>
      <div className="mt-3 space-y-2">
        {items.map((it) => (
          <details
            key={it.q}
            className="rounded-xl border border-white/10 bg-black/10 p-4 open:bg-black/20"
          >
            <summary className="cursor-pointer font-medium">{it.q}</summary>
            <div className="mt-2 text-sm opacity-85">
              {it.a}{' '}
              {it.href ? (
                <Link href={it.href} className="underline">
                  Ver más
                </Link>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function Objections({ tourTitle, city }: { tourTitle: string; city?: string | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-lg font-semibold">Antes de reservar</div>
      <ul className="mt-3 space-y-2 text-sm opacity-85">
        <li>• Reserva {tourTitle} en {city || 'Colombia'} con checkout seguro.</li>
        <li>• Confirmación por email + factura automática.</li>
        <li>• Soporte por WhatsApp para dudas rápidas.</li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 transition hover:bg-white/20"
          href="/policies/payments"
        >
          Pagos y seguridad
        </Link>
        <Link
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 transition hover:bg-white/20"
          href="/policies/cancellation"
        >
          Cancelación
        </Link>
        <Link
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 transition hover:bg-white/20"
          href="/faq"
        >
          FAQ
        </Link>
      </div>
    </div>
  );
}

export default function ProofStack({ tourTitle, city, variant }: ProofStackProps) {
  // ✅ Best practice: no pasar props opcionales cuando son undefined (exactOptionalPropertyTypes)
  const objectionsProps =
    city === undefined ? { tourTitle } : { tourTitle, city };

  return (
    <section className="mt-8 space-y-6">
      {variant === 'A' ? (
        <>
          <TrustBar />
          <Objections {...objectionsProps} />
          <Faq />
        </>
      ) : (
        <>
          <Objections {...objectionsProps} />
          <TrustBar />
          <Faq />
        </>
      )}
    </section>
  );
}
