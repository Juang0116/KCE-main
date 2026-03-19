import * as React from 'react';
import clsx from 'clsx';

type TProps = { 
  className?: string | undefined; 
  children: React.ReactNode; 
  id?: string;
};

/**
 * Títulos de nivel superior: Hero sections y títulos de página.
 */
export function H1({ className, children, id }: TProps) {
  return (
    <h1
      id={id}
      className={clsx(
        'font-heading text-4xl font-bold tracking-tight text-brand-blue md:text-6xl',
        className,
      )}
    >
      {children}
    </h1>
  );
}

/**
 * Títulos de sección: Títulos dentro de <Section />
 */
export function H2({ className, children, id }: TProps) {
  return (
    <h2
      id={id}
      className={clsx(
        'font-heading text-2xl font-bold tracking-tight text-brand-blue md:text-4xl',
        className,
      )}
    >
      {children}
    </h2>
  );
}

/**
 * Títulos de componentes: Títulos de Cards o bloques de contenido.
 */
export function H3({ className, children, id }: TProps) {
  return (
    <h3
      id={id}
      className={clsx(
        'font-heading text-xl font-bold tracking-tight text-brand-blue md:text-2xl',
        className,
      )}
    >
      {children}
    </h3>
  );
}

/**
 * Párrafo estándar para cuerpo de texto.
 */
export function P({ className, children }: TProps) {
  return (
    <p className={clsx('text-base leading-relaxed text-muted md:text-lg', className)}>
      {children}
    </p>
  );
}

/**
 * Texto de introducción (Lead): Más grande y ligero para subtítulos.
 */
export function Lead({ className, children }: TProps) {
  return (
    <p className={clsx('text-lg leading-relaxed text-muted md:text-xl font-light', className)}>
      {children}
    </p>
  );
}

/**
 * Etiqueta superior (Eyebrow): Para categorías o contexto pequeño.
 */
export function Eyebrow({ className, children }: TProps) {
  return (
    <div className={clsx(
      'text-[11px] font-bold uppercase tracking-[0.25em] text-brand-blue/60 mb-3', 
      className
    )}>
      {children}
    </div>
  );
}