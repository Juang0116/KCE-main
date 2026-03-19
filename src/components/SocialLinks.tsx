'use client';

import clsx from 'clsx';
import { Facebook, Instagram, Youtube, Twitter } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { getSocialLinks } from '@/lib/social';

/**
 * Icono de TikTok optimizado para encajar con el set de Lucide.
 */
function TikTokIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
    >
      <path d="M16.5 3c.4 2.6 1.9 4.4 4.5 4.7V11c-1.8 0-3.4-.6-4.7-1.6V16c0 3.6-2.9 6-6.5 6-3.2 0-5.8-2.6-5.8-5.8 0-3.8 3.6-6.6 7.4-5.7v3.2c-1.8-.6-3.7.7-3.7 2.5 0 1.4 1.1 2.6 2.6 2.6 1.9 0 2.8-1.3 2.8-3.2V3h3.4z" />
    </svg>
  );
}

function iconFor(key: string) {
  switch (key) {
    case 'facebook': return Facebook;
    case 'instagram': return Instagram;
    case 'youtube': return Youtube;
    case 'x': return Twitter;
    case 'tiktok': return TikTokIcon;
    default: return null;
  }
}

interface SocialLinksProps {
  className?: string;
  size?: number;
  variant?: 'ghost' | 'solid' | 'outline';
}

export default function SocialLinks({
  className,
  size = 18,
  variant = 'ghost',
}: SocialLinksProps) {
  const links = React.useMemo(() => getSocialLinks(), []);
  if (!links.length) return null;

  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      {links.map((l) => {
        const Icon = iconFor(l.key);
        if (!Icon) return null;

        return (
          <Link
            key={l.key}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            aria-label={l.label}
            className={clsx(
              // Layout base: Círculos perfectos con flex center
              'group inline-flex size-9 items-center justify-center rounded-full transition-all duration-300',
              // Variante Ghost: Sutil, ideal para el Footer
              variant === 'ghost' && [
                'bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]/60',
                'hover:bg-brand-blue hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-blue/20'
              ],
              // Variante Solid: Destacada, ideal para el Sidebar de Contacto
              variant === 'solid' && [
                'bg-brand-yellow text-brand-dark shadow-soft',
                'hover:scale-110 hover:shadow-md'
              ],
              // Variante Outline: Elegante
              variant === 'outline' && [
                'border border-[var(--color-border)] text-[color:var(--color-text)]/70',
                'hover:border-brand-blue hover:text-brand-blue hover:bg-brand-blue/5'
              ]
            )}
          >
            <Icon
              size={size}
              className="transition-transform group-hover:scale-110"
            />
          </Link>
        );
      })}
    </div>
  );
}