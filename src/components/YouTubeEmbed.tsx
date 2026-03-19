import * as React from 'react';
import clsx from 'clsx';
import { Play } from 'lucide-react'; // Para un posible placeholder
import { youTubeEmbedUrl } from '@/lib/youtube';

interface YouTubeEmbedProps {
  urlOrId: string;
  title?: string;
  className?: string;
}

export default function YouTubeEmbed({
  urlOrId,
  title,
  className,
}: YouTubeEmbedProps) {
  const src = youTubeEmbedUrl(urlOrId);

  // Si no hay URL válida, no renderizamos un cuadro vacío que rompa la UI
  if (!src) return null;

  return (
    <div className={clsx("group relative w-full", className)}>
      {/* Contenedor con Aspect Ratio moderno. 
        Usamos aspect-video (16/9) de Tailwind para evitar el padding-top manual.
      */}
      <div className={clsx(
        "aspect-video w-full overflow-hidden rounded-3xl border shadow-2xl transition-all duration-500",
        "border-brand-dark/5 bg-brand-dark/5 dark:border-white/10 dark:bg-white/5",
        "group-hover:border-brand-blue/30 group-hover:shadow-brand-blue/10"
      )}>
        <iframe
          className="h-full w-full"
          src={src}
          title={title ?? 'KCE Video Experience'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          loading="lazy" // Optimización de performance: solo carga si el usuario hace scroll hasta aquí
        />
      </div>
      
      {/* Un sutil indicador visual de que es contenido de KCE */}
      <div className="absolute -bottom-3 -right-3 -z-10 h-24 w-24 rounded-full bg-brand-blue/5 blur-2xl transition-opacity group-hover:opacity-100" />
    </div>
  );
}