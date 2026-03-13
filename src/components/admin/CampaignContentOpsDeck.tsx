import clsx from 'clsx';

type Props = {
  cards: Array<{ title: string; body: string; tone?: 'light' | 'dark' }>;
  className?: string;
};

export default function CampaignContentOpsDeck({ cards, className }: Props) {
  return (
    <section className={clsx('grid gap-4 md:grid-cols-3', className)} aria-label='Campaign and content operations'>
      {cards.map((card, idx) => (
        <article
          key={`${card.title}:${idx}`}
          className={clsx(
            'rounded-2xl border p-4 shadow-soft',
            card.tone === 'dark'
              ? 'border-transparent bg-[linear-gradient(155deg,rgba(6,29,61,0.98),rgba(10,69,135,0.95)_62%,rgba(216,176,74,0.74))] text-white'
              : 'border-[var(--color-border)] bg-[color:var(--color-surface)]',
          )}
        >
          <div className={clsx('text-sm font-semibold', card.tone === 'dark' ? 'text-white' : 'text-[color:var(--color-text)]')}>{card.title}</div>
          <p className={clsx('mt-2 text-sm leading-6', card.tone === 'dark' ? 'text-white/82' : 'text-[color:var(--color-text)]/72')}>{card.body}</p>
        </article>
      ))}
    </section>
  );
}
