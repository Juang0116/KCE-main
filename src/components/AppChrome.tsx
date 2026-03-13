'use client';

import { usePathname } from 'next/navigation';

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

function isAdminPath(pathname: string) {
  return /^\/(?:(es|en|fr|de)\/)?admin(?:\/|$)/i.test(pathname || '/');
}

export default function AppChrome({ locale, dict, envLabel, envHint, slot }: Props) {
  const pathname = usePathname() || '/';
  if (isAdminPath(pathname)) return null;

  if (slot === 'header') {
    return <Header locale={locale} dict={dict} envLabel={envLabel} {...(envHint ? { envHint } : {})} />;
  }

  return (
    <>
      <Footer locale={locale} dict={dict} />
      <WhatsAppFloatingButton />
      <DeferredChatWidget />
    </>
  );
}
