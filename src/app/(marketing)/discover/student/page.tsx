import { generateMarketMetadata, renderMarketLanding, type MarketLandingConfig } from '@/features/marketing/MarketIntentLandingPage';

/**
 * Student & Young Adult Market Landing Configuration
 * Focus: Accessibility, Cultural Discovery, Confidence-building, and Movement.
 * Targeted at younger travelers who seek authentic stories but need extra guidance.
 */
const config: MarketLandingConfig = {
  slug: 'student',
  title: 'Student and young-adult Colombia discovery routes',
  description:
    'A more accessible lane for younger travelers who need clarity, confidence and culture-first discovery before opening the full KCE catalog.',
  eyebrow: 'Student intent lane',
  promiseTitle: 'Move younger travelers from curiosity into a clearer Colombia shortlist',
  promiseBody:
    'This route is built for travelers who want movement, culture and memorable stories, but still need more guidance and reassurance before they book.',
  trustCards: [
    { 
      eyebrow: 'Accessible route', 
      title: 'Easier entry into Colombia planning' 
    },
    { 
      eyebrow: 'Culture + movement', 
      title: 'A stronger fit for younger discovery intent' 
    },
    { 
      eyebrow: 'Guided support', 
      title: 'Use a personalized plan or human help when doubts appear' 
    },
  ],
  infoCards: [
    {
      title: 'Why this lane matters',
      body: 'Student and young-adult traffic is often curious but less certain. A dedicated route helps KCE capture that demand without forcing a premium-only framing too early.',
    },
    {
      title: 'Best use case',
      body: 'Useful for social campaigns, creator traffic, youth partnerships and content that emphasizes discovery, culture and confidence-building.',
    },
    {
      title: 'Commercial angle',
      body: 'Guide them toward tours, a personalized plan and human support so the traveler keeps moving inside KCE instead of leaving after one visit.',
    },
  ],
  ctaMessage: 'Hola KCE, quiero una ruta clara y accesible para descubrir Colombia.',
  shortlistTitle: 'Tours that fit younger, culture-led travel planning',
  closeTitle: 'Use this lane to keep younger international demand inside the KCE journey',
  closeBody:
    'Blend confidence, cultural discovery and lighter-friction planning so student and young-adult traffic warms into shortlist-ready action.',
};

export async function generateMetadata() {
  return generateMarketMetadata(config);
}

export default async function StudentLandingPage() {
  /**
   * renderMarketLanding ensures that the 'Discovery' vibe 
   * remains professional but approachable for this demographic.
   */
  return renderMarketLanding(config);
}