import Link from 'next/link';

type QuickLink = {
  href: string;
  label: string;
  tone?: 'primary' | 'default';
};

type FocusItem = {
  label: string;
  title: string;
  body: string;
  href?: string;
  cta?: string;
};

type NoteItem = {
  title: string;
  body: string;
};

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  quickLinks: QuickLink[];
  focusItems: FocusItem[];
  notes?: NoteItem[];
};

export default function AdminExecutivePanel({
  eyebrow,
  title,
  description,
  quickLinks,
  focusItems,
  notes = [],
}: Props) {
  return (
    <section className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft">
      <div className="inline-flex rounded-full border border-brand-blue/15 bg-brand-blue/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue">
        {eyebrow}
      </div>
      <h1 className="mt-4 font-heading text-3xl tracking-tight text-brand-blue md:text-4xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--color-text)]/72 md:text-base">{description}</p>

      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        {quickLinks.map((link) => (
          <Link
            key={`${link.href}:${link.label}`}
            href={link.href}
            className={
              link.tone === 'primary'
                ? 'rounded-full bg-brand-blue px-4 py-2 font-semibold text-white transition hover:-translate-y-px'
                : 'rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)]'
            }
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {focusItems.map((item) => (
          <article key={`${item.label}:${item.title}`} className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">{item.label}</div>
            <h2 className="mt-3 font-heading text-xl tracking-tight text-brand-blue">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{item.body}</p>
            {item.href && item.cta ? (
              <Link href={item.href} className="mt-4 inline-flex rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-sm font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface-3)]">
                {item.cta}
              </Link>
            ) : null}
          </article>
        ))}
      </div>

      {notes.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {notes.map((note) => (
            <article key={note.title} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
              <h3 className="text-sm font-semibold text-[color:var(--color-text)]">{note.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/68">{note.body}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
