import clsx from 'clsx';

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs',
        'border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--muted)]',
        className,
      )}
    >
      {children}
    </span>
  );
}
