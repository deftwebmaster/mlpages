// Competitors influence local price expectations and siphon off customers who
// prefer their profile. They are not directly attackable — only outcompeted.

export const COMPETITORS = [
  {
    id: 'lucys-lemonade',
    name: "Lucy's Lemonade",
    identity: 'Cheap prices, sweet recipes, strong with families.',
    priceLevel: 'low',
    qualityLevel: 'medium',
    strongSegments: ['children', 'parents'],
    introReputation: 10,
  },
  {
    id: 'fresh-press',
    name: 'Fresh Press',
    identity: 'Premium ingredients, high prices, health-focused reputation.',
    priceLevel: 'high',
    qualityLevel: 'high',
    strongSegments: ['fitness', 'tourists'],
    introReputation: 20,
  },
  {
    id: 'chill-cup',
    name: 'Chill Cup',
    identity: 'Fast service, aggressive event placement, commuter appeal.',
    priceLevel: 'medium',
    qualityLevel: 'medium',
    strongSegments: ['commuters'],
    introReputation: 30,
  },
  {
    id: 'sunny-sips',
    name: 'Sunny Sips',
    identity: 'Heavy marketing, trendy flavors, strong tourist appeal.',
    priceLevel: 'medium',
    qualityLevel: 'medium',
    strongSegments: ['tourists', 'children'],
    introReputation: 40,
  },
];

export function getCompetitor(id) {
  return COMPETITORS.find((c) => c.id === id);
}
