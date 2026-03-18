import { generateMarketMetadata, renderMarketLanding, type MarketLandingConfig } from '@/features/marketing/MarketIntentLandingPage';

/**
 * Wellness Market Landing Configuration
 * Focus: Restorative travel, Nature, Slower Rhythms, and Peace of Mind.
 * Targeted at travelers seeking balance and lower-pressure planning.
 */
const config: MarketLandingConfig = {
  slug: 'wellness',
  title: 'Wellness-minded Colombia travel with calmer premium planning',
  description:
    'A cleaner route for travelers seeking balance, nature, slower rhythm and more restorative Colombia experiences.',
  eyebrow: 'Wellness intent lane',
  promiseTitle: 'Move recovery-led travel demand toward a calmer premium shortlist',
  promiseBody:
    'This lane is designed for travelers who respond to softer pacing, space, nature and a more restorative decision-making route.',
  trustCards: [
    { 
      eyebrow: 'Softer pace', 
      title: 'Less friction and more calm planning' 
    },
    { 
      eyebrow: 'Nature-led', 
      title: 'Landscape, breathing room and memorable rhythm' 
    },
    { 
      eyebrow: 'Human help', 
      title: 'Talk to KCE when the traveler wants reassurance' 
    },
  ],
  infoCards: [
    {
      title: 'Why this lane matters',
      body: 'Wellness demand is often colder and more reflective. This route gives that traveler a premium, lower-pressure entry into KCE instead of dropping them into a generic catalog first.',
    },
    {
      title: 'Best use case',
      body: 'Strong for slower social traffic, creator collaborations, nature-led editorial and brand-safe premium campaigns.',
    },
    {
      title: 'Planning route',
      body: 'Move visitors from inspiration into tours, a personalized plan and human guidance instead of forcing an immediate hard sell.',
    },
  ],
  ctaMessage: 'Hola KCE, quiero una ruta wellness/tranquila para Colombia.',
  shortlistTitle: 'Tours that fit calmer, wellness-minded planning',
  closeTitle: 'Use this lane to turn softer intent into calmer premium conversations',
  closeBody:
    'Keep the promise calm, guided and boutique so the traveler can move from vague interest into shortlist-ready action without feeling rushed.',
};

export async function generateMetadata() {
  return generateMarketMetadata(config);
}

export default async function WellnessLandingPage() {
  /**
   * renderMarketLanding ensures that the 'Restorative' promise 
   * is delivered through a high-end, clean UI.
   */
  return renderMarketLanding(config);
}