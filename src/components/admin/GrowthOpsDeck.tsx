import clsx from 'clsx';

type Lane = {
  eyebrow: string;
  title: string;
  body: string;
  tone?: 'light' | 'dark';
};

type Props = {
  title?: string;
  subtitle?: string;
  lanes: Lane[];
  className?: string;
};

export default function GrowthOpsDeck({
  title = 'International growth machine',
  subtitle = 'Turn marketing signals into a clear operating rhythm across acquisition, nurture and conversion.',
  lanes,
  className,
}: Props) {
  return (
    <section
      className={clsx(
        'overflow-hidden rounded-[calc(var(--radius)+0.55rem)] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(247,248,252,0.96))] shadow-soft',
        className,
      )}
    >
      <div className='border-b border-[var(--color-border)] px-5 py-5 md:px-6'>
        <div className='inline-flex rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/60'>
          Growth command deck
        </div>
        <h2 className='mt-3 text-2xl font-semibold tracking-tight text-brand-blue'>{title}</h2>
        <p className='mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/72'>{subtitle}</p>
      </div>
      <div className='grid gap-4 px-5 py-5 lg:grid-cols-3 md:px-6'>
        {lanes.map((lane) => (
          <div
            key={lane.title}
            className={clsx(
              'rounded-[1.2rem] border p-4 shadow-soft',
              lane.tone === 'dark'
                ? 'border-transparent bg-[linear-gradient(155deg,rgba(6,29,61,0.98),rgba(10,69,135,0.95)_62%,rgba(216,176,74,0.74))] text-white'
                : 'border-[var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)]',
            )}
          >
            <div className={clsx('text-[11px] font-semibold uppercase tracking-[0.18em]', lane.tone === 'dark' ? 'text-white/70' : 'text-[color:var(--color-text)]/55')}>
              {lane.eyebrow}
            </div>
            <div className='mt-2 text-lg font-semibold tracking-tight'>{lane.title}</div>
            <p className={clsx('mt-2 text-sm leading-6', lane.tone === 'dark' ? 'text-white/82' : 'text-[color:var(--color-text)]/72')}>
              {lane.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
