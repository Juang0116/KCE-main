import { generateMarketMetadata, renderMarketLanding, type MarketLandingConfig } from '@/features/marketing/MarketIntentLandingPage';

const config: MarketLandingConfig = {
  slug: 'france',
  title: 'Colombia shortlists for France-based travellers',
  description:
    'A more editorial route for France-based travelers looking for culture, gastronomy, local stories and a curated Colombian shortlist with human support.',
  eyebrow: 'France demand lane',
  promiseTitle: 'Channel France-based interest into culture-first Colombia demand',
  promiseBody:
    'This lane helps KCE frame Colombia through meaning, place, food and context so the visitor feels invited into a richer, more elevated travel narrative.',
  trustCards: [
    { eyebrow: 'Editorial feel', title: 'Culture-forward framing and more polished positioning' },
    { eyebrow: 'Human context', title: 'Stories, neighborhoods and guided meaning' },
    { eyebrow: 'Trust layer', title: 'Shortlist, support and secure booking path' },
  ],
  infoCards: [
    {
      title: 'Why this lane matters',
      body: 'France-based travelers often respond well to cultural texture, gastronomy and a more editorial presentation. This route lets KCE lead with that.',
    },
    {
      title: 'Best use case',
      body: 'Strong for partnerships, blog features, cultural SEO and social content where the traveler wants discovery with more depth and less generic tourism framing.',
    },
    {
      title: 'Commercial angle',
      body: 'Move the visitor toward tours, newsletter, lead magnet or human support depending on how much confidence and structure they still need.',
    },
  ],
  ctaMessage: 'Hola KCE, viajo desde Francia y busco una shortlist cultural para Colombia.',
  shortlistTitle: 'Tours that fit a France-based cultural shortlist',
  closeTitle: 'Use this lane to convert France-based culture interest into action',
  closeBody:
    'Pair stronger editorial framing with shortlist-ready tours and human support so KCE captures the visitor before they disappear into generic research loops.',
};

export async function generateMetadata() {
  return generateMarketMetadata(config);
}

export default async function FranceLandingPage() {
  return renderMarketLanding(config);
}
