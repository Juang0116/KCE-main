import Link from 'next/link';

export type ReleaseConfidenceBandItem = {
  eyebrow?: string;
  title: string;
  body: string;
};

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  items: ReleaseConfidenceBandItem[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
};

export default function ReleaseConfidenceBand({
  eyebrow,
  title,
  description,
  items,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  className = '',
}: Props) {
  return (
    <section
      className={`overflow-hidden rounded-[calc(var(--radius)+0.6rem)] border border-[color:var(--color-border)] bg-[linear-gradient(160deg,rgba(255,255,255,0.99),rgba(248,244,236,0.97))] shadow-hard ${className}`.trim()}
    >
      <div className="grid gap-0 lg:grid-cols-[0.98fr_1.02fr]">
        <div className="border-b border-[color:var(--color-border)] bg-[linear-gradient(160deg,rgba(8,41,86,0.98),rgba(11,84,162,0.94)_62%,rgba(216,176,74,0.78))] px-6 py-7 text-white lg:border-b-0 lg:border-r lg:px-8 lg:py-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">{eyebrow}</div>
          <h2 className="mt-3 font-heading text-[1.95rem] leading-[0.98] text-white md:text-[2.25rem]">{title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 md:text-base">{description}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="rounded-[1.1rem] bg-[color:var(--color-surface)] px-4 py-3 text-sm font-semibold text-brand-blue shadow-soft transition hover:opacity-95"
            >
              {primaryLabel}
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link
                href={secondaryHref}
                className="rounded-[1.1rem] border border-white/18 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/14"
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="px-6 py-7 lg:px-8 lg:py-8">
          <div className="grid gap-4 md:grid-cols-3">
            {items.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="rounded-[1.35rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue">
                  {item.eyebrow || `${index + 1}`.padStart(2, '0')}
                </div>
                <h3 className="mt-3 font-heading text-xl text-brand-blue">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[color:var(--color-text)]/75">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
