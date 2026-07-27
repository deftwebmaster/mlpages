// Random events fire on at most one day at a time, presenting 2-3 concrete
// choices. Each choice carries a small, explicit set of effects (applied by
// event-model.js) plus outcome text shown to the player immediately.

export const EVENTS = [
  {
    id: 'cooler-breakdown',
    title: 'Your cooler stops working at midday.',
    trigger: { minDay: 3, weight: 1 },
    choices: [
      { id: 'buy-ice', label: 'Buy emergency ice for $18', cashDelta: -18,
        outcome: 'You bought emergency ice and kept drinks cold all afternoon.' },
      { id: 'reduce', label: 'Reduce production and continue', productionMultiplier: 0.7,
        outcome: 'You scaled back production to make do without reliable cooling.' },
      { id: 'close-early', label: 'Close early to protect reputation', closeEarlyHour: 2, reputationDelta: 1,
        outcome: 'You closed a couple hours early rather than serve warm drinks.' },
    ],
  },
  {
    id: 'lemon-shortage',
    title: 'A regional lemon shortage has pushed prices up sharply.',
    trigger: { minDay: 2, weight: 1 },
    choices: [
      { id: 'pay-premium', label: 'Pay the premium price today', cashDelta: -12,
        outcome: 'You paid a steep premium to keep your recipe unchanged.' },
      { id: 'switch-recipe', label: 'Stretch supply with a lighter recipe', qualityMultiplier: 0.92,
        outcome: 'You stretched your lemon supply, slightly diluting quality.' },
      { id: 'skip', label: 'Skip lemon-heavy prep today', productionMultiplier: 0.6,
        outcome: 'You cut back production rather than pay inflated prices.' },
    ],
  },
  {
    id: 'supplier-discount',
    title: 'Your supplier is offering a one-day bulk discount.',
    trigger: { minDay: 2, weight: 1 },
    choices: [
      { id: 'buy-big', label: 'Stock up heavily', cashDelta: -25, discountBanked: true,
        outcome: 'You stocked up heavily at a discount for the days ahead.' },
      { id: 'buy-some', label: 'Buy a modest extra amount', cashDelta: -10, discountBanked: true,
        outcome: 'You picked up a modest discount without overcommitting cash.' },
      { id: 'pass', label: 'Pass on it today', outcome: 'You passed on the discount to preserve cash.' },
    ],
  },
  {
    id: 'employee-calls-out',
    title: 'One of your staff calls out sick.',
    trigger: { minDay: 1, weight: 1, requiresEmployees: true },
    choices: [
      { id: 'cover', label: 'Cover the shift yourself', serviceSpeedMultiplier: 0.9,
        outcome: 'You covered the shift yourself, running a bit slower than usual.' },
      { id: 'shorthanded', label: 'Run shorthanded today', serviceSpeedMultiplier: 0.75,
        outcome: 'You ran shorthanded, and service slowed during the rush.' },
      { id: 'temp', label: 'Hire a same-day temp for $25', cashDelta: -25,
        outcome: 'You hired a same-day temp and kept service running smoothly.' },
    ],
  },
  {
    id: 'local-festival',
    title: 'A local festival is drawing bigger crowds than usual nearby.',
    trigger: { minDay: 4, weight: 0.8 },
    choices: [
      { id: 'prep-more', label: 'Prepare extra batches to catch the wave', productionMultiplier: 1.3, trafficMultiplier: 1.2,
        outcome: 'You prepped extra batches and caught the festival wave.' },
      { id: 'normal', label: 'Stick to your normal plan', trafficMultiplier: 1.1,
        outcome: 'You stuck to your normal plan and still saw a modest bump.' },
    ],
  },
  {
    id: 'school-field-day',
    title: 'The local school is holding field day this afternoon.',
    trigger: { minDay: 3, weight: 0.8 },
    choices: [
      { id: 'kid-friendly', label: 'Lean into kid-friendly pricing', priceCapMultiplier: 0.85, trafficMultiplier: 1.2,
        outcome: 'You leaned into family-friendly pricing and traffic picked up.' },
      { id: 'ignore', label: 'Keep pricing as planned', outcome: 'You kept your normal pricing through field day.' },
    ],
  },
  {
    id: 'celebrity-customer',
    title: 'A minor local celebrity just bought a cup and is posting about it.',
    trigger: { minDay: 6, weight: 0.4 },
    choices: [
      { id: 'lean-in', label: 'Lean into the moment publicly', awarenessDelta: 6, reputationDelta: 1,
        outcome: 'You leaned into the moment and awareness ticked up.' },
      { id: 'stay-humble', label: 'Stay low-key', reputationDelta: 2,
        outcome: 'You stayed humble, and it quietly boosted your reputation.' },
    ],
  },
  {
    id: 'food-critic-visit',
    title: 'A food blogger is quietly reviewing stands in the area today.',
    trigger: { minDay: 8, weight: 0.4 },
    choices: [
      { id: 'best-recipe', label: 'Serve your best possible batch', qualityMultiplier: 1.1, cashDelta: -8,
        outcome: 'You served your best batch, hoping the critic noticed.' },
      { id: 'business-as-usual', label: 'Keep business as usual', outcome: 'You kept things business as usual.' },
    ],
  },
  {
    id: 'viral-post',
    title: 'A photo of your stand is going viral online.',
    trigger: { minDay: 10, weight: 0.3 },
    choices: [
      { id: 'ride-wave', label: 'Rush to prepare more product', productionMultiplier: 1.4, trafficMultiplier: 1.4, cashDelta: -6,
        outcome: 'You rushed to prep more product to meet the sudden demand.' },
      { id: 'cautious', label: 'Stay cautious and avoid overextending', trafficMultiplier: 1.15,
        outcome: 'You stayed cautious, missing some of the wave but avoiding waste.' },
    ],
  },
  {
    id: 'health-inspection',
    title: 'A health inspector is stopping by unannounced.',
    trigger: { minDay: 6, weight: 0.5 },
    choices: [
      { id: 'confident', label: 'Welcome the inspection', reputationDelta: 2,
        outcome: 'The inspection went smoothly and reflected well on you.' },
      { id: 'nervous-close', label: 'Close briefly to tidy up first', closeEarlyHour: 0.5,
        outcome: 'You paused briefly to tidy up before the inspection.' },
    ],
  },
  {
    id: 'equipment-malfunction',
    title: 'Your dispenser jams during the lunch rush.',
    trigger: { minDay: 5, weight: 0.7 },
    choices: [
      { id: 'quick-fix', label: 'Attempt a quick fix ($10 in parts)', cashDelta: -10,
        outcome: 'A quick fix got you back up and running fast.' },
      { id: 'slow-down', label: 'Slow down service until it clears', serviceSpeedMultiplier: 0.7,
        outcome: 'You slowed service down until the jam cleared on its own.' },
    ],
  },
  {
    id: 'charity-fundraiser',
    title: 'A neighbor asks if you can support a charity fundraiser today.',
    trigger: { minDay: 7, weight: 0.5 },
    choices: [
      { id: 'donate', label: 'Donate a portion of profits', donatePercent: 0.1, reputationDelta: 2,
        outcome: 'You donated a portion of profits and reputation improved.' },
      { id: 'decline', label: 'Politely decline this time', outcome: 'You politely declined this time.' },
    ],
  },
  {
    id: 'competitor-price-war',
    title: 'A nearby competitor just slashed their prices.',
    trigger: { minDay: 12, weight: 0.6, requiresCompetitors: true },
    choices: [
      { id: 'match', label: 'Match their price today', priceCapMultiplier: 0.85,
        outcome: 'You matched their price to hold onto your customers.' },
      { id: 'hold-quality', label: 'Hold your price, lean on quality', qualityMultiplier: 1.05,
        outcome: 'You held your price and leaned on quality to keep customers.' },
    ],
  },
  {
    id: 'road-construction',
    title: 'Surprise road construction is blocking easy access to your spot.',
    trigger: { minDay: 9, weight: 0.5 },
    choices: [
      { id: 'push-through', label: 'Push through the day anyway', trafficMultiplier: 0.75,
        outcome: 'You pushed through, but foot traffic suffered.' },
      { id: 'relocate', label: 'Move to a backup spot nearby', trafficMultiplier: 0.9, cashDelta: -5,
        outcome: 'You relocated slightly to dodge the worst of it.' },
    ],
  },
  {
    id: 'power-outage',
    title: 'A brief power outage hits the area.',
    trigger: { minDay: 15, weight: 0.4, requiresElectricEquipment: true },
    choices: [
      { id: 'manual-mode', label: 'Switch to manual prep', productionMultiplier: 0.6,
        outcome: 'You switched to manual prep until power returned.' },
      { id: 'wait-out', label: 'Pause until power returns', closeEarlyHour: 1,
        outcome: 'You paused operations briefly until power returned.' },
    ],
  },
  {
    id: 'catering-request',
    title: 'A local business asks for a large last-minute catering order.',
    trigger: { minDay: 14, weight: 0.4 },
    choices: [
      { id: 'accept', label: 'Accept the order', cashDelta: 45, productionMultiplier: 0.85,
        outcome: 'You accepted the order — good money, but it strained your supply.' },
      { id: 'decline-catering', label: 'Decline — too disruptive today', outcome: 'You declined to keep today simple.' },
    ],
  },
];

export function getEvent(id) {
  return EVENTS.find((e) => e.id === id);
}
