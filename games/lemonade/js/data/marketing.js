// Marketing campaigns boost brand awareness (tracked separately from reputation).
// reach is a rough audience size used by the demand model as a traffic multiplier
// while the campaign is active.

export const MARKETING_CAMPAIGNS = [
  { id: 'handmade-signs', name: 'Handmade Signs', cost: 5, durationDays: 2, reach: 0.05,
    unlockRequirement: {}, audience: 'local', downside: null,
    description: 'Cheap and cheerful, works best very locally.' },
  { id: 'neighborhood-flyers', name: 'Neighborhood Flyers', cost: 15, durationDays: 3, reach: 0.1,
    unlockRequirement: { reputation: 5 }, audience: 'families',
    description: 'Paper flyers dropped around the block.' },
  { id: 'social-media-post', name: 'Social Media Post', cost: 20, durationDays: 2, reach: 0.15,
    unlockRequirement: { reputation: 10 }, audience: 'general',
    description: 'Quick reach, fades fast.' },
  { id: 'coupon-campaign', name: 'Coupon Campaign', cost: 30, durationDays: 4, reach: 0.12,
    unlockRequirement: { reputation: 12 }, audience: 'price-sensitive', priceDiscount: 0.1,
    description: 'Drives traffic but trims margins.' },
  { id: 'local-sponsorship', name: 'Local Sponsorship', cost: 75, durationDays: 7, reach: 0.2,
    unlockRequirement: { reputation: 20 }, audience: 'community',
    description: 'Sponsor a local team or event for lasting goodwill.' },
  { id: 'event-booth', name: 'Event Booth', cost: 100, durationDays: 1, reach: 0.35,
    unlockRequirement: { reputation: 22 }, audience: 'event-goers',
    description: 'Set up at a local event for a single big day.' },
  { id: 'influencer-feature', name: 'Influencer Feature', cost: 180, durationDays: 5, reach: 0.4,
    unlockRequirement: { reputation: 35 }, audience: 'tourists',
    description: 'A local influencer shouts you out — if it lands.', riskOfFlop: 0.2 },
  { id: 'radio-ad', name: 'Radio Advertisement', cost: 250, durationDays: 6, reach: 0.3,
    unlockRequirement: { reputation: 40 }, audience: 'commuters',
    description: 'Steady reach across the whole area.' },
  { id: 'billboard', name: 'Billboard', cost: 500, durationDays: 14, reach: 0.45,
    unlockRequirement: { reputation: 50 }, audience: 'general',
    description: 'Big, expensive, and hard to ignore.' },
  { id: 'regional-campaign', name: 'Regional Campaign', cost: 1200, durationDays: 21, reach: 0.65,
    unlockRequirement: { reputation: 65 }, audience: 'regional',
    description: 'A full multi-channel push across the region.' },
];

export function getCampaign(id) {
  return MARKETING_CAMPAIGNS.find((c) => c.id === id);
}
