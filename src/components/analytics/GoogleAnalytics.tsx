// src/components/analytics/GoogleAnalytics.tsx
// Consent-aware Google Analytics 4 loader.
// Only loads if NEXT_PUBLIC_GA_MEASUREMENT_ID is set AND user has given analytics consent.
'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';

function getConsent(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const raw = document.cookie
      .split('; ')
      .find((c) => c.startsWith('kce_consent='))
      ?.split('=')?.[1];
    if (!raw) return false;
    const parsed = JSON.parse(decodeURIComponent(raw));
    return !!(parsed?.analytics);
  } catch {
    return false;
  }
}

export default function GoogleAnalytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(getConsent());
    // Listen for consent changes
    const handler = () => setAllowed(getConsent());
    window.addEventListener('kce:consent_updated', handler);
    return () => window.removeEventListener('kce:consent_updated', handler);
  }, []);

  if (!GA_ID || !allowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { page_path: window.location.pathname });
        `}
      </Script>
    </>
  );
}
