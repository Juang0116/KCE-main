import { Button } from '@/components/ui/Button';

type ActionTone = 'primary' | 'outline';

export type LaunchCommandActionItem = {
  href: string;
  label: string;
  detail: string;
  tone?: ActionTone;
};

type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  actions: LaunchCommandActionItem[];
  className?: string;
};

export default function LaunchCommandActionDeck({
  eyebrow = 'launch command',
  title,
  description,
  actions,
  className,
}: Props) {
  return (
    <section className={[
      'rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] p-5 shadow-soft md:p-6',
      className || '',
    ].join(' ')}>
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">{eyebrow}</p>
        <h2 className="mt-2 font-heading text-2xl text-brand-blue">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-[color:var(--color-text)]/72">{description}</p>
      </div>

      <div className="mt-5 flex gap-3 overflow-x-auto pb-1 md:hidden">
        {actions.map((action) => (
          <div key={`${action.label}-${action.href}`} className="min-w-[15rem] flex-1 rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <p className="font-heading text-base text-brand-blue">{action.label}</p>
            <p className="mt-2 text-sm leading-5 text-[color:var(--color-text)]/70">{action.detail}</p>
            <div className="mt-4">
              <Button asChild variant={action.tone === 'primary' ? 'primary' : 'outline'} size="sm" className="w-full">
                <a href={action.href}>{action.label}</a>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <div key={`${action.label}-${action.href}`} className="rounded-[1.7rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
            <p className="font-heading text-lg text-brand-blue">{action.label}</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">{action.detail}</p>
            <div className="mt-4">
              <Button asChild variant={action.tone === 'primary' ? 'primary' : 'outline'} size="sm" className="w-full">
                <a href={action.href}>{action.label}</a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
