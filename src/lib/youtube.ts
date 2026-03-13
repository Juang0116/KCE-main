// src/lib/youtube.ts
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();

    // youtu.be/<id>
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id || null;
    }

    // youtube.com/watch?v=<id>
    if (host.endsWith('youtube.com')) {
      const path = u.pathname.replace(/\/+$/, '');
      if (path === '/watch') {
        const id = u.searchParams.get('v');
        return id || null;
      }
      // /embed/<id>
      const parts = path.split('/').filter(Boolean);
      if (parts[0] === 'embed' && parts[1]) return parts[1];
      // /shorts/<id>
      if (parts[0] === 'shorts' && parts[1]) return parts[1];
      // /live/<id>
      if (parts[0] === 'live' && parts[1]) return parts[1];
    }

    return null;
  } catch {
    // If it's not a valid URL, try to treat it as an id.
    const maybe = url.trim();
    if (/^[a-zA-Z0-9_-]{6,}$/.test(maybe)) return maybe;
    return null;
  }
}

export function youTubeEmbedUrl(urlOrId: string): string | null {
  const id = extractYouTubeId(urlOrId);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}

export function youTubeThumbnailUrl(
  urlOrId: string,
  quality: 'hq' | 'mq' | 'sd' = 'hq',
): string | null {
  const id = extractYouTubeId(urlOrId);
  if (!id) return null;
  const file =
    quality === 'mq' ? 'mqdefault.jpg' : quality === 'sd' ? 'sddefault.jpg' : 'hqdefault.jpg';
  return `https://i.ytimg.com/vi/${id}/${file}`;
}
