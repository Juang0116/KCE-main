'use client';

import Link from 'next/link';
import { ArrowRight, Mail } from 'lucide-react';
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
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6">
        
        {/* Newsletter & Brand Block */}
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] border-b border-[var(--color-border)] pb-16">
          <div className="max-w-md">
            <h3 className="font-heading text-3xl md:text-4xl text-brand-blue mb-4">
              {t(dict, 'brand.name', 'Knowing Cultures Enterprise')}
            </h3>
            <p className="text-sm font-light leading-relaxed text-[var(--color-text)]/70 mb-8">
              {t(dict, 'footer.about', 'Diseñamos experiencias culturales auténticas en Colombia. Conecta con destinos reales apoyados por expertos locales y tecnología premium.')}
            </p>
            <SocialLinks variant="solid" />
          </div>

          <div className="rounded-[2rem] bg-brand-blue/5 border border-brand-blue/10 p-8">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="h-5 w-5 text-brand-blue" />
              <h4 className="font-heading text-xl text-brand-blue">Únete al Club KCE</h4>
            </div>
            <p className="text-xs text-[var(--color-text)]/60 font-light mb-6">
              Recibe inspiración de viajes, rutas exclusivas y descuentos ocultos antes que nadie. Cero spam.
            </p>
            <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); alert('Newsletter suscripción mock'); }}>
              <input 
                type="email" 
                placeholder="Tu correo electrónico..." 
                required 
                className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm outline-none focus:border-brand-blue transition-colors"
              />
              <button type="submit" className="h-12 flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 shrink-0">
                Unirme
              </button>
            </form>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 py-16">
          
          {/* Columna 1 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-6">
              Experiencias
            </h4>
            <ul className="space-y-4 text-sm font-light text-[var(--color-text)]/80">
              <li><Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/tours')}>{t(dict, 'nav.tours', 'Ver Catálogo Completo')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/destinations')}>{t(dict, 'nav.destinations', 'Explorar por Ciudades')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/plan')}>Plan Personalizado (IA)</Link></li>
            </ul>
          </div>

          {/* Columna 2 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-6">
              Nosotros
            </h4>
            <ul className="space-y-4 text-sm font-light text-[var(--color-text)]/80">
              <li><Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/about')}>{t(dict, 'nav.about', 'Quiénes Somos (About)')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/blog')}>{t(dict, 'footer.blog', 'Blog de Viajes')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/contact')}>{t(dict, 'footer.contact', 'Contacto & Agencias')}</Link></li>
            </ul>
          </div>

          {/* Columna 3 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-6">
              Tu Viaje
            </h4>
            <ul className="space-y-4 text-sm font-light text-[var(--color-text)]/80">
              <li><Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/account')}>{t(dict, 'nav.account', 'Mi Cuenta')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/account/bookings')}>Mis Reservas & Tickets</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/wishlist')}>{t(dict, 'nav.wishlist', 'Mi Wishlist')}</Link></li>
            </ul>
          </div>

          {/* Columna 4 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-6">
              {t(dict, 'footer.support_legal', 'Soporte y Legal')}
            </h4>
            <ul className="space-y-4 text-sm font-light text-[var(--color-text)]/80">
              <li><Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/faq')}>{t(dict, 'footer.faq', 'Preguntas Frecuentes')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/trust')}>{t(dict, 'footer.trust', 'Garantía y Seguridad')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/privacy')}>{t(dict, 'footer.privacy', 'Privacidad')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/policies/cancellation')}>{t(dict, 'footer.cancellation', 'Política de Cancelación')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" href={withLocale(locale, '/terms')}>{t(dict, 'footer.terms', 'Términos de Servicio')}</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-[var(--color-border)] pt-8">
          <div className="text-xs text-[var(--color-text)]/50">
            © {new Date().getFullYear()} Knowing Cultures Enterprise SAS. {t(dict, 'footer.rights', 'Todos los derechos reservados.')}
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">Operado desde Colombia</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}