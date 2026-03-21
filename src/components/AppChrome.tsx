'use client';

import { usePathname } from 'next/navigation';

// QUITAMOS la carpeta /layout/ de la ruta
import Footer from '@/components/Footer'; 
import Header from '@/components/Header';
import DeferredChatWidget from '@/features/ai/DeferredChatWidget';
import WhatsAppFloatingButton from '@/features/marketing/WhatsAppFloatingButton';
import type { Dictionary } from '@/i18n/getDictionary';

type Props = {
  locale: string;
  dict: Dictionary;
  envLabel?: string | undefined;
  envHint?: string | undefined;
  slot: 'header' | 'footer';
};

/**
 * Determina si estamos en una ruta de administración o checkout
 * para evitar distracciones visuales (Header/Footer estándar).
 */
function isFocusModePath(pathname: string) {
  const cleanPath = pathname || '/';
  const isAdmin = /^\/(?:[a-z]{2}\/)?admin(?:\/|$)/i.test(cleanPath);
  const isCheckout = /^\/(?:[a-z]{2}\/)?checkout(?:\/|$)/i.test(cleanPath);
  return isAdmin || isCheckout;
}

export default function AppChrome({ locale, dict, envLabel, envHint, slot }: Props) {
  const pathname = usePathname() ?? '/';
  
  // Si es Admin o Checkout, no renderizamos el "Chrome" estándar 
  // para mantener el foco en la tarea (conversión o gestión).
  if (isFocusModePath(pathname)) return null;

  if (slot === 'header') {
    return (
      <Header 
        locale={locale} 
        dict={dict} 
        // Pasamos las propiedades opcionales solo si están definidas
        // para respetar la regla "exactOptionalPropertyTypes: true"
        {...(envLabel !== undefined ? { envLabel } : {})}
        {...(envHint !== undefined ? { envHint } : {})} 
      />
    );
  }

  return (
    <>
      <Footer locale={locale} dict={dict} />
      
      {/* Widgets de Marketing y Soporte: Solo en el slot de footer para no bloquear el Main Thread */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
        <WhatsAppFloatingButton />
        <DeferredChatWidget />
      </div>
    </>
  );
}