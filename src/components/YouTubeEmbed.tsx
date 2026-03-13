// src/components/YouTubeEmbed.tsx
import * as React from 'react';

import { youTubeEmbedUrl } from '@/lib/youtube';

export default function YouTubeEmbed({
  urlOrId,
  title,
  className,
}: {
  urlOrId: string;
  title?: string;
  className?: string;
}) {
  const src = youTubeEmbedUrl(urlOrId);
  if (!src) return null;

  return (
    <div className={className}>
      <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-black/40">
        <div
          className="relative w-full"
          style={{ paddingTop: '56.25%' }}
        >
          <iframe
            className="absolute inset-0 size-full"
            src={src}
            title={title ?? 'YouTube video player'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
