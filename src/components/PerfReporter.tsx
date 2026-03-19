'use client';

import { useEffect } from 'react';

/**
 * Filtra y asegura que los valores sean numéricos y finitos para evitar errores en la DB/Analítica.
 */
function safeNumber(n: unknown): number | null {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  // Redondeamos a 2 decimales para no enviar ruido innecesario
  return Math.round(n * 100) / 100;
}

export function PerfReporter() {
  useEffect(() => {
    // Usamos window.requestIdleCallback si está disponible para no interferir con la carga inicial
    const report = () => {
      try {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        if (!nav) return;

        // Capturamos el Core Web Vital: LCP de forma aproximada desde el paint timing
        const paint = performance.getEntriesByType('paint');
        const fcp = paint.find(entry => entry.name === 'first-contentful-paint');

        const payload = {
          metric: 'nav.v2',
          page: window.location.pathname,
          timestamp: new Date().toISOString(),
          // Métricas principales
          duration: safeNumber(nav.duration),
          ttfb: safeNumber(nav.responseStart - nav.requestStart),
          fcp: safeNumber(fcp?.startTime),
          
          // Detalle de red (Útil para detectar latencias en regiones específicas de Colombia/Europa)
          network: {
            dns: safeNumber(nav.domainLookupEnd - nav.domainLookupStart),
            tcp: safeNumber(nav.connectEnd - nav.connectStart),
            tls: nav.secureConnectionStart ? safeNumber(nav.connectEnd - nav.secureConnectionStart) : 0,
            transfer: safeNumber(nav.transferSize), // Tamaño de la carga (bytes)
          },
          
          // Ciclo de vida del DOM
          dom: {
            interactive: safeNumber(nav.domInteractive),
            complete: safeNumber(nav.domComplete),
          }
        };

        // Navigator.sendBeacon es el estándar de oro para reportes "fire-and-forget"
        // Si no está disponible, usamos fetch con keepalive
        const body = JSON.stringify(payload);
        const endpoint = '/api/track/perf';

        if (navigator.sendBeacon) {
          navigator.sendBeacon(endpoint, body);
        } else {
          void fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
          });
        }
      } catch (err) {
        // En desarrollo podrías loguear, en producción silencio absoluto
      }
    };

    // Esperamos a que la página termine de cargar completamente antes de reportar
    if (document.readyState === 'complete') {
      report();
    } else {
      window.addEventListener('load', report);
      return () => window.removeEventListener('load', report);
    }
  }, []);

  return null;
}