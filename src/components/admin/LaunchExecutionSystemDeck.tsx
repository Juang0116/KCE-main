import clsx from 'clsx';

type LaunchLane = {
  kicker: string;
  title: string;
  body: string;
  highlight?: boolean;
};

const lanes: LaunchLane[] = [
  {
    kicker: '01 · Traffic discipline',
    title: 'Scale only lanes that can sustain delivery',
    body:
      'Push market pages, discover hubs and paid traffic only when bookings, revenue and support still read as calm, premium and recoverable.',
  },
  {
    kicker: '02 · Operator readiness',
    title: 'Keep revenue, bookings and support reading the same truth',
    body:
      'Before scaling harder, confirm that admin teams can verify payment, booking assets and traveler support without jumping across disconnected panels.',
    highlight: true,
  },
  {
    kicker: '03 · Premium continuity',
    title: 'The promise must survive after purchase',
    body:
      'Launch confidence is not only acquisition. It means success, booking, account and support still feel premium when real travelers start to arrive in volume.',
  },
] as const;

type Props = {
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
};

export default function LaunchExecutionSystemDeck({
  title = 'Launch execution system',
  description = 'Use this final layer to connect market pressure, operator clarity and traveler calm before calling the release truly ready.',
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
      <div className={clsx('grid gap-0 lg:grid-cols-[0.95fr_1.05fr]', compact ? 'min-h-0' : 'min-h-[21rem]')}>
        <div className="bg-[linear-gradient(160deg,rgba(6,29,61,0.98),rgba(10,69,135,0.96)_58%,rgba(216,176,74,0.76))] p-7 text-white md:p-9">
          <div className="inline-flex rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
            launch execution
          </div>
          <h2 className="mt-5 max-w-xl font-heading text-2xl tracking-tight md:text-[2.15rem]">{title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/78 md:text-[15px]">{description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {['Revenue truth', 'Operator calm', 'Traveler confidence'].map((label) => (
              <div key={label} className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-sm font-medium text-white/84 backdrop-blur">
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
