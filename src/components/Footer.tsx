'use client';

// src/components/Footer.tsx

import Link from 'next/link';

import { t, type Dictionary } from '@/i18n/getDictionary';

import SocialLinks from '@/components/SocialLinks';

type Props = { locale: string; dict: Dictionary };

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

export default function Footer({ locale, dict }: Props) {
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] bg-[color:var(--color-surface)]">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <h3 className="font-heading text-lg text-brand-blue">
              {t(dict, 'brand.name', 'Knowing Cultures Enterprise')}
            </h3>
            <p className="mt-2 text-sm text-[color:var(--color-text)]/70">
              {t(
                dict,
                'footer.about',
                'Turismo cultural en Colombia con diseño, seguridad y soporte 24/7.',
              )}
            </p>
            <div className="mt-4">
              <SocialLinks variant="solid" />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[color:var(--color-text)]">
              Núcleo KCE
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-text)]/70">
              <li>
                <Link className="hover:underline" href={withLocale(locale, '/tours')}>
                  {t(dict, 'nav.tours', 'Tours')}
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href={withLocale(locale, '/destinations')}>
                  {t(dict, 'nav.destinations', 'Destinations')}
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href={withLocale(locale, '/plan')}>
                  Plan personalizado
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href={withLocale(locale, '/contact')}>
                  {t(dict, 'footer.contact', 'Contact')}
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href={withLocale(locale, '/about')}>
                  {t(dict, 'nav.about', 'About')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[color:var(--color-text)]">
              {t(dict, 'footer.support_legal', 'Support & legal')}
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-text)]/70">
              <li>
                <a className="hover:underline" href="mailto:hello@kce.travel">
                  hello@kce.travel
                </a>
              </li>
              <li>
                <Link className="hover:underline" href={withLocale(locale, '/faq')}>
                  {t(dict, 'footer.faq', 'FAQ')}
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href={withLocale(locale, '/privacy')}>
                  {t(dict, 'footer.privacy', 'Privacy')}
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href={withLocale(locale, '/policies/cancellation')}>
                  {t(dict, 'footer.cancellation', 'Cancellation policy')}
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href={withLocale(locale, '/terms')}>
                  {t(dict, 'footer.terms', 'Terms')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[color:var(--color-text)]/80">
              {t(dict, 'footer.explore', 'Explora más')}
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-text)]/62">
              <li>
                <Link className="hover:underline" href={withLocale(locale, '/destinations')}>
                  {t(dict, 'nav.destinations', 'Destinations')}
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href={withLocale(locale, '/blog')}>
                  {t(dict, 'footer.blog', 'Blog')}
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href={withLocale(locale, '/wishlist')}>
                  {t(dict, 'nav.wishlist', 'Wishlist')}
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href={withLocale(locale, '/faq')}>
                  {t(dict, 'nav.faq', 'FAQ')}
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href={withLocale(locale, '/trust')}>
                  {t(dict, 'footer.trust', 'Trust & safety')}
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href={withLocale(locale, '/about')}>
                  {t(dict, 'nav.about', 'About KCE')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--color-border)] pt-6 text-xs text-[color:var(--color-text)]/60 md:flex-row md:items-center md:justify-between">
          <div>
            © {new Date().getFullYear()} KCE. {t(dict, 'footer.rights', 'All rights reserved.')}
          </div>
          <div className="flex flex-wrap gap-4">
            <Link className="hover:underline" href={withLocale(locale, '/privacy')}>
              {t(dict, 'footer.privacy', 'Privacy')}
            </Link>
            <Link className="hover:underline" href={withLocale(locale, '/policies/cancellation')}>
              {t(dict, 'footer.cancellation', 'Cancellation policy')}
            </Link>
            <Link className="hover:underline" href={withLocale(locale, '/terms')}>
              {t(dict, 'footer.terms', 'Terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
