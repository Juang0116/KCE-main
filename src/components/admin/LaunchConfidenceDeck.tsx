import Link from 'next/link';

type Props = {
  compact?: boolean;
  title?: string;
  description?: string;
  accountHref?: string;
};

type Lane = {
  eyebrow: string;
  title: string;
  body: string;
  highlight?: boolean;
};

const lanes: Lane[] = [
  {
    eyebrow: 'Launch now',
    title: 'Push traffic only when the traveler path feels effortless',
    body:
      'Home, tours, matcher, WhatsApp and checkout should read like one promise. If any step still feels improvised, fix that lane before scaling campaigns.',
    highlight: true,
  },
  {
    eyebrow: 'Watch next',
    title: 'Protect post-purchase confidence after the payment succeeds',
    body:
      'Success, booking, account and support must keep the same tone and the same case context so the traveler never feels dropped after paying.',
  },
  {
    eyebrow: 'Operate',
    title: 'Let revenue, QA, marketing and sales tell the same story',
    body:
      'The team should be able to answer three things fast: what is winning, what is fragile, and what must be fixed before pushing harder.',
  },
];

const launchChecklist = [
  ['Traffic lanes', 'Verify that discover, market pages and premium routes still land on the right CTA path for colder visitors.'],
  ['Mobile proof', 'Review vertical mobile on home, tours, detail, booking and account to make sure there is no friction or horizontal drift.'],
  ['Revenue proof', 'Confirm RC Verify, bookings, invoice, email and account all reflect the same paid session before pushing volume.'],
  ['Operator proof', 'Marketing, sales and bookings should each know the next move without opening five unrelated panels.'],
] as const;

export default function LaunchConfidenceDeck({
  compact = false,
  title = 'Launch confidence closeout',
  description = 'Use this block as the last commercial read before pushing more traffic: launch only when UX, revenue and operator confidence all feel aligned.',
  accountHref = '/es/account/bookings',
}: Props) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-soft">
      <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="p-6 md:p-8">
          <div className="inline-flex rounded-full border border-brand-blue/12 bg-brand-blue/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue">
            last premium polish
          </div>
          <h2 className="mt-4 font-heading text-2xl text-brand-blue md:text-3xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-text)]/72">{description}</p>

          <div className={`mt-6 grid gap-4 ${compact ? 'md:grid-cols-1 xl:grid-cols-3' : 'md:grid-cols-3'}`}>
            {lanes.map((lane) => (
              <article
                key={lane.title}
                className={lane.highlight
                  ? 'rounded-[22px] border border-transparent bg-[linear-gradient(150deg,rgba(10,61,128,0.98),rgba(10,61,128,0.88)_62%,rgba(216,179,73,0.35))] p-4 text-white shadow-soft'
                  : 'rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4'}
              >
                <div className={lane.highlight ? 'text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62' : 'text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/55'}>
                  {lane.eyebrow}
                </div>
                <h3 className={lane.highlight ? 'mt-2 text-base font-semibold text-white' : 'mt-2 text-base font-semibold text-brand-blue'}>{lane.title}</h3>
                <p className={lane.highlight ? 'mt-2 text-sm leading-6 text-white/80' : 'mt-2 text-sm leading-6 text-[color:var(--color-text)]/72'}>{lane.body}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="border-t border-brand-blue/10 bg-[linear-gradient(160deg,rgba(15,55,120,0.98),rgba(15,55,120,0.90)_62%,rgba(216,179,73,0.18))] p-6 text-white lg:border-l lg:border-t-0 md:p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">launch confidence order</div>
          <div className="mt-4 space-y-3">
            {launchChecklist.map(([heading, copy]) => (
              <div key={heading} className="rounded-[20px] border border-white/10 bg-white/8 p-4">
                <p className="text-sm font-semibold text-white">{heading}</p>
                <p className="mt-2 text-sm leading-6 text-white/80">{copy}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <Link href="/admin/qa" className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/15">QA</Link>
            <Link href="/admin/revenue" className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/15">Revenue</Link>
            <Link href="/admin/marketing" className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/15">Marketing</Link>
            <Link href="/admin/sales" className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/15">Sales</Link>
            <Link href={accountHref} className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/15">Account</Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
