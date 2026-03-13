// src/features/tours/components/MobileStickyBookingCta.tsx
'use client';

import * as React from 'react';

import { Button } from '@/components/ui/Button';
import { formatMinorUnits } from '@/utils/format';

type Props = {
  targetId: string;
  title: string;
  priceMinor: number;
  planHref?: string;
  helpHref?: string;
  helpLabel?: string;
  helpExternal?: boolean;
};

/**
 * CTA sticky para mobile: mejora UX y conversión sin interferir en desktop.
 * - Solo aparece en pantallas pequeñas.
 * - Se esconde si el usuario ya está cerca del widget.
 * - Mantiene una salida guiada si el usuario aún no quiere reservar.
 */
export default function MobileStickyBookingCta({
  targetId,
  title,
  priceMinor,
  planHref,
  helpHref,
  helpLabel = 'Hablar con KCE',
  helpExternal = false,
}: Props) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setVisible(!entry?.isIntersecting);
      },
      {
        root: null,
        threshold: 0.1,
      },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);

  const onClick = () => {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-3 bottom-20 z-40 md:hidden"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4.9rem)' }}
    >
      <div className="mx-auto max-w-sm rounded-[20px] border border-brand-dark/10 bg-[color:var(--color-surface)]/97 px-4 py-3 shadow-hard backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/48">
              Reserva rápida
            </p>
            <p className="truncate text-sm font-medium text-[color:var(--color-text)]">{title}</p>
            <p className="mt-0.5 font-heading text-lg text-brand-blue">
              Desde {formatMinorUnits(priceMinor, 'EUR', 'es-ES')}
            </p>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={onClick}
            aria-label="Ir a reservar"
            className="shrink-0"
          >
            Reservar
          </Button>
        </div>

        {(planHref || helpHref) ? (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3 text-xs">
            {planHref ? (
              <a
                href={planHref}
                className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1.5 font-semibold text-[color:var(--color-text)] transition hover:border-brand-blue/25 hover:text-brand-blue"
              >
                Plan primero
              </a>
            ) : null}
            {helpHref ? (
              <a
                href={helpHref}
                target={helpExternal ? '_blank' : undefined}
                rel={helpExternal ? 'noreferrer' : undefined}
                className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 font-semibold text-brand-blue transition hover:border-brand-blue/25"
              >
                {helpLabel}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
