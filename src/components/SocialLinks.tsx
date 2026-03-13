// src/components/SocialLinks.tsx
'use client';

import clsx from 'clsx';
import { Facebook, Instagram, Youtube, Twitter } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { getSocialLinks } from '@/lib/social';

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M16.5 3c.4 2.6 1.9 4.4 4.5 4.7V11c-1.8 0-3.4-.6-4.7-1.6V16c0 3.6-2.9 6-6.5 6-3.2 0-5.8-2.6-5.8-5.8 0-3.8 3.6-6.6 7.4-5.7v3.2c-1.8-.6-3.7.7-3.7 2.5 0 1.4 1.1 2.6 2.6 2.6 1.9 0 2.8-1.3 2.8-3.2V3h3.4z" />
    </svg>
  );
}

function iconFor(key: string) {
  switch (key) {
    case 'facebook':
      return Facebook;
    case 'instagram':
      return Instagram;
    case 'youtube':
      return Youtube;
    case 'x':
      return Twitter;
    case 'tiktok':
      return TikTokIcon;
    default:
      return null;
  }
}

export default function SocialLinks({
  className,
  size = 18,
  variant = 'ghost',
}: {
  className?: string;
  size?: number;
  variant?: 'ghost' | 'solid';
}) {
  const links = React.useMemo(() => getSocialLinks(), []);
  if (!links.length) return null;

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {links.map((l) => {
        const Icon = iconFor(l.key);
        return (
          <Link
            key={l.key}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            aria-label={l.label}
            className={clsx(
              'inline-flex size-9 items-center justify-center rounded-full transition',
              variant === 'ghost'
                ? 'border border-white/10 bg-white/5 hover:bg-white/10'
                : 'bg-brand-yellow text-black hover:opacity-90',
            )}
          >
            {Icon ? (
              <Icon
                size={size}
                className="opacity-90"
              />
            ) : (
              <span className="text-xs">•</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
