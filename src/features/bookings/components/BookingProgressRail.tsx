import clsx from 'clsx';
import { CheckCircle2 } from 'lucide-react';

type Step = {
  id: string;
  label: string;
  detail?: string;
};

type Props = {
  steps: Step[];
  current: number;
  className?: string;
};

export default function BookingProgressRail({ steps, current, className }: Props) {
  return (
    <div className={clsx('grid gap-3 sm:grid-cols-3', className)}>
      {steps.map((step, index) => {
        const active = index <= current;
        return (
          <div
            key={step.id}
            className={clsx(
              'rounded-2xl border p-4 transition',
              active
                ? 'border-brand-blue/20 bg-brand-blue text-white shadow-soft'
                : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)]',
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  'inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                  active ? 'bg-white/15 text-white' : 'bg-black/5 text-[color:var(--color-text)]/70',
                )}
              >
                {active ? <CheckCircle2 className="size-4" aria-hidden="true" /> : index + 1}
              </span>
              <p className={clsx('text-xs uppercase tracking-[0.18em]', active ? 'text-white/70' : 'text-[color:var(--color-text)]/55')}>
                Paso {index + 1}
              </p>
            </div>
            <p className={clsx('mt-3 font-heading text-base', active ? 'text-white' : 'text-brand-blue')}>
              {step.label}
            </p>
            {step.detail ? (
              <p className={clsx('mt-1 text-sm', active ? 'text-white/75' : 'text-[color:var(--color-text)]/70')}>
                {step.detail}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
