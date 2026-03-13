import Link from 'next/link';

type QuickAction = {
  href: string;
  label: string;
  tone?: 'primary' | 'default';
};

type Signal = {
  label: string;
  value: string;
  note: string;
};

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: QuickAction[];
  signals?: Signal[];
};

export default function TravelerActionWorkbench({
  eyebrow,
  title,
  description,
  actions = [],
  signals = [],
}: Props) {
  return (
    <section className="rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/60">
            {eyebrow}
          </div>
          <h2 className="mt-3 font-heading text-2xl tracking-tight text-brand-blue md:text-3xl">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/70">{description}</p>
        </div>

        {actions.length ? (
          <div className="flex flex-wrap gap-2 text-xs">
            {actions.map((action) => (
              <Link
                key={`${action.href}:${action.label}`}
                href={action.href}
                className={
                  action.tone === 'primary'
                    ? 'rounded-full bg-brand-blue px-4 py-2 font-semibold text-white transition hover:-translate-y-px'
                    : 'rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)]'
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {signals.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {signals.map((signal) => (
            <article
              key={`${signal.label}:${signal.value}`}
              className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4"
            >
              <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/55">{signal.label}</div>
              <div className="mt-2 text-2xl font-semibold text-brand-blue">{signal.value}</div>
              <p className="mt-1 text-xs leading-5 text-[color:var(--color-text)]/68">{signal.note}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
