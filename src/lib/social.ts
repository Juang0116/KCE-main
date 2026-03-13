// src/lib/social.ts
/**
 * Social links for KCE.
 * Keep URLs configurable via env for deployments.
 */
export type SocialKey = 'facebook' | 'instagram' | 'tiktok' | 'x' | 'youtube';

export type SocialLink = {
  key: SocialKey;
  label: string;
  href: string;
};

function clean(url: string | undefined) {
  const u = String(url || '').trim();
  return u ? u : '';
}

export function getSocialLinks(): SocialLink[] {
  const links: SocialLink[] = [
    {
      key: 'facebook',
      label: 'Facebook',
      href: clean(process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL),
    },
    {
      key: 'instagram',
      label: 'Instagram',
      href: clean(process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL),
    },
    { key: 'tiktok', label: 'TikTok', href: clean(process.env.NEXT_PUBLIC_SOCIAL_TIKTOK_URL) },
    { key: 'x', label: 'X', href: clean(process.env.NEXT_PUBLIC_SOCIAL_X_URL) },
    { key: 'youtube', label: 'YouTube', href: clean(process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE_URL) },
  ];

  // Remove empties so dev doesn't show broken links.
  return links.filter((l) => Boolean(l.href));
}
