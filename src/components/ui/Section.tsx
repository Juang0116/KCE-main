import * as React from 'react';
import clsx from 'clsx';
import { Container } from './Container';

export function Section({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={clsx('py-10 md:py-14', className)}>
      <Container>{children}</Container>
    </section>
  );
}
