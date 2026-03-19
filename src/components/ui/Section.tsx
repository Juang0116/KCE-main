import * as React from 'react';
import clsx from 'clsx';
import { Container } from './Container'; // Asegúrate de que la ruta es correcta

// 1. Definimos el tipo antes de usarlo en la interfaz (Arregla Error 2304: SectionVariant)
type SectionVariant = 'transparent' | 'surface' | 'dark' | 'brand';

// 2. Definimos el mapa de estilos (Arregla Error 2552: variants vs variant)
const sectionVariants: Record<SectionVariant, string> = {
  transparent: 'bg-transparent',
  surface: 'bg-brand-dark/[0.02]',
  dark: 'bg-brand-dark text-white',
  brand: 'bg-brand-blue text-white',
};

interface SectionProps {
  children: React.ReactNode;
  className?: string | undefined;
  containerClassName?: string | undefined;
  variant?: SectionVariant;
  id?: string | undefined;
  fullHeight?: boolean;
}

export function Section({
  className,
  containerClassName,
  children,
  variant = 'transparent',
  id,
  fullHeight = false,
}: SectionProps) {
  return (
    <section
      id={id}
      className={clsx(
        'relative py-12 md:py-24',
        fullHeight && 'min-h-[calc(100vh-80px)] flex flex-col justify-center',
        sectionVariants[variant], // Usamos el nombre corregido aquí
        className
      )}
    >
      {/* Container ahora debería ser reconocido (Arregla Error 2304: Container) */}
      <Container className={containerClassName}>
        {children}
      </Container>
    </section>
  );
}