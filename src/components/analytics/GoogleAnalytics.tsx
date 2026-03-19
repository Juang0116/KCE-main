'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';

/**
 * Lee de forma segura la cookie de consentimiento.
 * Espera un JSON tipo: { analytics: boolean, marketing: boolean }
 */
function getConsent(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('kce_consent='))
      ?.split('=')[1];

    if (!cookie) return false;

    const parsed = JSON.parse(decodeURIComponent(cookie));
    return !!parsed?.analytics;
  } catch (err) {
    // Si la cookie está malformada, asumimos que no hay consentimiento.
    return false;
  }
}

export default function GoogleAnalytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // Verificación inicial
    setAllowed(getConsent());

    // Listener para cambios en tiempo real (cuando el usuario acepta el banner)
    const handler = () => {
      setAllowed(getConsent());
    };

    window.addEventListener('kce:consent_updated', handler);
    return () => window.removeEventListener('kce:consent_updated', handler);
  }, []);

  // Si no hay ID o el usuario no ha aceptado, no renderizamos nada.
  if (!GA_ID || !allowed) return null;

  return (
    <>
      {/* Carga asíncrona de GA4 después de que la página sea interactiva */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { 
            page_path: window.location.pathname,
            cookie_flags: 'SameSite=Lax;Secure'
          });
        `}
      </Script>
    </>
  );
}