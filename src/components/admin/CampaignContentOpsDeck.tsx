import clsx from 'clsx';
import { Megaphone, FileText, Sparkles } from 'lucide-react';

type CardItem = {
  title: string;
  body: string;
  tone?: 'light' | 'dark';
  icon?: 'campaign' | 'content' | 'ai';
};

type Props = {
  cards: CardItem[];
  className?: string;
};

const iconMap = {
  campaign: Megaphone,
  content: FileText,
  ai: Sparkles,
};

export default function CampaignContentOpsDeck({ cards, className }: Props) {
  return (
    <section 
      className={clsx('grid gap-5 md:grid-cols-3', className)} 
      aria-label='Campaign and content operations'
    >
      {cards.map((card, idx) => {
        const Icon = card.icon ? iconMap[card.icon] : null;
        const isDark = card.tone === 'dark';

        return (
          <article
            key={`${card.title}:${idx}`}
            className={clsx(
              'group relative overflow-hidden rounded-brand border p-6 transition-all duration-300',
              isDark
                ? 'border-transparent bg-brand-dark text-white shadow-hard'
                : 'border-brand-dark/10 bg-surface text-main shadow-soft hover:shadow-pop hover:border-brand-blue/20'
            )}
          >
            {/* Efecto de gradiente sutil solo para la versión Dark para mantener el branding */}
            {isDark && (
              <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/40 via-transparent to-brand-yellow/20 opacity-30" />
            )}

            <div className="relative z-10">
              <header className="flex items-center justify-between">
                <div className={clsx(
                  'text-xs font-bold uppercase tracking-[0.15em]',
                  isDark ? 'text-brand-yellow' : 'text-brand-blue'
                )}>
                  {card.title}
                </div>
                {Icon && (
                  <Icon className={clsx(
                    'h-4 w-4 transition-transform group-hover:scale-110',
                    isDark ? 'text-white/40' : 'text-brand-blue/30'
                  )} />
                )}
              </header>

              <p className={clsx(
                'mt-4 text-sm leading-relaxed',
                isDark ? 'text-white/80' : 'text-muted'
              )}>
                {card.body}
              </p>
            </div>

            {/* Decoración visual inferior */}
            <div className={clsx(
              'mt-6 h-1 w-8 rounded-full transition-all group-hover:w-12',
              isDark ? 'bg-brand-yellow/50' : 'bg-brand-blue/20'
            )} />
          </article>
        );
      })}
    </section>
  );
}