// src/app/(marketing)/verify-email/page.tsx
import type { Metadata } from 'next';

import VerifyEmailView from '@/features/auth/VerifyEmailView';

export const revalidate = 0;

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kce.travel').replace(
  /\/+$/,
  '',
);

export const metadata: Metadata = {
  metadataBase: new URL(BASE_SITE_URL),
  title: 'Verifica tu correo — KCE',
  description: 'Confirma tu correo para activar tu cuenta y acceder a funciones como wishlist.',
  robots: { index: false, follow: true },
  alternates: { canonical: `${BASE_SITE_URL}/verify-email` },
  openGraph: {
    title: 'Verifica tu correo — KCE',
    description: 'Confirma tu correo para activar tu cuenta.',
    url: `${BASE_SITE_URL}/verify-email`,
    type: 'website',
  },
  twitter: { card: 'summary' },
};

export default function VerifyEmailPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <VerifyEmailView />
    </main>
  );
}
