// src/features/marketing/TrustBar.tsx
import Link from 'next/link';
import * as React from 'react';
import { Lock, ShieldCheck, Receipt, MessageCircle } from 'lucide-react';

import { Container } from '@/components/ui/Container';

type TrustBarProps = {
  className?: string;
  compact?: boolean;
};

function Item({
  icon,
  title,
  desc,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
    >
      <div className="mt-0.5 opacity-90">{icon}</div>
      <div className="min-w-0">
        <div className="font-medium leading-tight group-hover:underline">{title}</div>
        <div className="text-sm opacity-80">{desc}</div>
      </div>
    </Link>
  );
}

export default function TrustBar({ className = '', compact = false }: TrustBarProps) {
  return (
    <div className={className}>
      <Container>
        <div className={compact ? 'grid gap-3 md:grid-cols-4' : 'grid gap-3 md:grid-cols-4'}>
          <Item
            icon={<Lock className="h-5 w-5" />}
            title="Pago seguro (EUR)"
            desc="Stripe + 3D Secure cuando aplique. No guardamos tu tarjeta."
            href="/policies/payments"
          />
          <Item
            icon={<Receipt className="h-5 w-5" />}
            title="Factura PDF + confirmación"
            desc="Te llega por email al finalizar el pago."
            href="/policies/payments"
          />
          <Item
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Cancelación clara"
            desc="Reglas transparentes antes de pagar."
            href="/policies/cancellation"
          />
          <Item
            icon={<MessageCircle className="h-5 w-5" />}
            title="Soporte humano"
            desc="Te ayudamos por WhatsApp."
            href="/faq"
          />
        </div>
      </Container>
    </div>
  );
}
