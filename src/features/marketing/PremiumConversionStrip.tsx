import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PremiumConversionStrip({ 
  locale = 'es', 
  whatsAppHref 
}: { 
  locale?: string; 
  whatsAppHref?: string | null 
}) {
  return (
    <div className="w-full bg-[color:var(--color-surface-2)]/30 border-t border-[color:var(--color-border)] py-12">
      <div className="mx-auto max-w-[var(--container-max)] px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="text-center md:text-left">
          <h4 className="font-heading text-2xl text-[color:var(--color-text)] tracking-tight">Diseña tu experiencia ideal.</h4>
          <p className="text-sm text-[color:var(--color-text-muted)] font-light mt-1">Conecta con nuestros expertos para empezar a planear.</p>
        </div>

        <div className="flex items-center gap-4">
          {whatsAppHref && (
            <Button asChild variant="outline" className="rounded-full border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-muted)] hover:text-brand-blue hover:border-brand-blue transition-colors h-10 px-6 text-xs">
              <a href={whatsAppHref} target="_blank" rel="noreferrer">
                <MessageCircle className="h-3.5 w-3.5 mr-2" /> WhatsApp
              </a>
            </Button>
          )}
          <Button asChild className="rounded-full bg-brand-blue text-white hover:bg-brand-blue/90 shadow-pop transition-transform hover:-translate-y-0.5 h-10 px-6 text-xs">
            <Link href={`/${locale}/contact`}>
              Contactar a KCE <ArrowRight className="h-3.5 w-3.5 ml-2" />
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
}