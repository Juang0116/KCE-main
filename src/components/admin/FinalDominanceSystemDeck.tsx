import clsx from 'clsx';

type DominanceLane = {
  kicker: string;
  title: string;
  body: string;
  highlight?: boolean;
};

const lanes: DominanceLane[] = [
  {
    kicker: '01 · Demand quality',
    title: 'Scale the lanes that still feel curated',
    body:
      'Do not reward noisy traffic. Push the intent pages, market lanes and handoff routes that still protect trust, qualification and calmer buying behaviour.',
  },
  {
    kicker: '02 · Conversion authority',
    title: 'Make the close feel inevitable, not desperate',
    body:
      'The premium signal should survive from shortlist to payment: human help, booking confidence and post-purchase continuity must still reinforce the same promise.',
    highlight: true,
  },
  {
    kicker: '03 · Operator calm',
    title: 'Keep delivery readable while volume grows',
    body:
      'A dominant system stays clear under pressure. Revenue, bookings, support and recovery should still read as one calm operating truth even when campaigns push harder.',
  },
];

type Props = {
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
};

export default function FinalDominanceSystemDeck({
  title = 'Final dominance system',
  description = 'Use this closing layer to confirm that KCE can attract, qualify, close and recover with the same premium rhythm before pushing harder internationally.',
  compact = false,
  className,
}: Props) {
  return (
    <section
      className={clsx(
        'overflow-hidden rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] shadow-soft',
        className,
      )}
    >
      <div className={clsx('grid gap-0 lg:grid-cols-[0.97fr_1.03fr]', compact ? 'min-h-0' : 'min-h-[21rem]')}>
        <div className="bg-[linear-gradient(160deg,rgba(8,28,58,0.99),rgba(10,69,135,0.95)_58%,rgba(216,176,74,0.72))] p-7 text-white md:p-9">
          <div className="inline-flex rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
            final dominance
          </div>
          <h2 className="mt-5 max-w-xl font-heading text-2xl tracking-tight md:text-[2.15rem]">{title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/78 md:text-[15px]">{description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {['Demand fit', 'Close authority', 'Operator calm'].map((label) => (
              <div
                key={label}
                className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-sm font-medium text-white/84 backdrop-blur"
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
          {lanes.map((lane) => (
            <article
              key={lane.title}
              className={clsx(
                'rounded-3xl border p-5 shadow-soft',
                lane.highlight
                  ? 'border-transparent bg-[linear-gradient(160deg,rgba(6,29,61,0.98),rgba(10,69,135,0.93)_62%,rgba(216,176,74,0.72))] text-white'
                  : 'border-[var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]',
              )}
            >
              <div className={clsx('text-[11px] font-semibold uppercase tracking-[0.18em]', lane.highlight ? 'text-white/64' : 'text-brand-blue/65')}>
                {lane.kicker}
              </div>
              <h3 className="mt-3 font-heading text-lg tracking-tight">{lane.title}</h3>
              <p className={clsx('mt-2 text-sm leading-6', lane.highlight ? 'text-white/78' : 'text-[color:var(--color-text)]/70')}>
                {lane.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
