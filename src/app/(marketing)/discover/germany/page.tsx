import { generateMarketMetadata, renderMarketLanding, type MarketLandingConfig } from '@/features/marketing/MarketIntentLandingPage';

/**
 * Germany Market Landing Configuration
 * Focus: Structure, Operational Confidence, Transparency, and Nature.
 * Targeted at travelers who value reliability, detail, and well-paced logistics.
 */
const config: MarketLandingConfig = {
  slug: 'germany',
  title: 'Colombia planning lane for Germany-based travellers',
  description:
    'A structure-first landing for Germany-based travelers who value clarity, trust, nature, transparent planning and a straightforward route into Colombia experiences.',
  eyebrow: 'Germany demand lane',
  promiseTitle: 'Turn Germany-based planning intent into structured demand',
  promiseBody:
    'This lane helps KCE present Colombia with more clarity, trust and rhythm so the visitor can evaluate options without feeling lost or oversold.',
  trustCards: [
    { 
      eyebrow: 'Structure first', 
      title: 'Clear paths from research to shortlist' 
    },
    { 
      eyebrow: 'Trust + detail', 
      title: 'Transparent flow, secure booking, real support' 
    },
    { 
      eyebrow: 'Nature appeal', 
      title: 'Coffee region, landscapes and well-paced routes' 
    },
  ],
  infoCards: [
    {
      title: 'Why this lane matters',
      body: 'Germany-based travelers often respond to clarity, detail and confident structure. KCE can stand out by making the route easier to evaluate and trust.',
    },
    {
      title: 'Best use case',
      body: 'Strong for SEO, travel communities, partners and upper-funnel acquisition where the traveler wants less noise and more operational confidence.',
    },
    {
      title: 'Planning route',
      body: 'Guide visitors toward tours, a personalized plan or WhatsApp help depending on how much clarity they still need before booking.',
    },
  ],
  ctaMessage: 'Hola KCE, viajo desde Alemania y quiero una ruta clara para reservar en Colombia.',
  shortlistTitle: 'Tours that match a Germany-based planning mindset',
  closeTitle: 'Use this lane to convert structured research into qualified demand',
  closeBody:
    'Give the visitor a cleaner path through content, tours and human handoff so they keep moving inside KCE instead of leaving with unresolved questions.',
};

export async function generateMetadata() {
  return generateMarketMetadata(config);
}

export default async function GermanyLandingPage() {
  /**
   * Leveraging the same master template for speed and consistency.
   * renderMarketLanding handles the heavy lifting of the UI.
   */
  return renderMarketLanding(config);
}