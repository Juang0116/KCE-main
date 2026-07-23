import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PremiumConversionStrip({
  locale = 'es',
  whatsAppHref,
}: {
  locale?: string;
  whatsAppHref?: string | null;
}) {
  return (
    <div className="bg-[color:var(--color-surface-2)]/30 w-full border-t border-[color:var(--color-border)] py-12">
      <div className="mx-auto flex max-w-[var(--container-max)] flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="text-center md:text-left">
          <h4 className="font-heading text-2xl tracking-tight text-[color:var(--color-text)]">
            Diseña tu experiencia ideal.
          </h4>
          <p className="mt-1 text-sm font-light text-[color:var(--color-text-muted)]">
            Conecta con nuestros expertos para empezar a planear.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {whatsAppHref && (
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-full border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-6 text-xs text-[color:var(--color-text-muted)] transition-colors hover:border-brand-blue hover:text-brand-blue"
            >
              <a
                href={whatsAppHref}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="mr-2 h-3.5 w-3.5" /> WhatsApp
              </a>
            </Button>
          )}
          <Button
            asChild
            className="h-10 rounded-full bg-brand-blue px-6 text-xs text-white shadow-pop transition-transform hover:-translate-y-0.5 hover:bg-brand-blue/90"
          >
            <Link href={`/${locale}/contact`}>
              Contactar a KCE <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
