// src/components/admin/AdminPageHeader.tsx
import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type Crumb = { label: string; href?: string };

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
}

export function AdminPageHeader({ title, description, breadcrumbs, actions }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-2 flex items-center gap-1 text-[11px] text-[color:var(--color-text-muted)]">
            <Link href="/admin" className="hover:text-brand-blue transition-colors">Admin</Link>
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                <ChevronRight className="h-3 w-3 opacity-40" />
                {b.href ? (
                  <Link href={b.href} className="hover:text-brand-blue transition-colors">{b.label}</Link>
                ) : (
                  <span className="text-[color:var(--color-text)]">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="font-heading text-2xl text-[color:var(--color-text)]">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">{description}</p>
        )}
      </div>
      {actions && <div className="mt-3 flex shrink-0 items-center gap-2 sm:mt-0">{actions}</div>}
    </div>
  );
}
