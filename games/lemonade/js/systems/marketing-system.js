import { MARKETING_CAMPAIGNS, getCampaign } from '../data/marketing.js';
import { spendCash, canAfford } from './finance-system.js';
import { clamp, roundTo } from '../utils/math.js';
import { chance } from '../utils/random.js';

export function getAvailableCampaigns(state) {
  const activeIds = state.marketing.activeCampaigns.map((c) => c.id);
  return MARKETING_CAMPAIGNS.filter((c) => {
    if (activeIds.includes(c.id)) return false;
    const req = c.unlockRequirement || {};
    return state.reputation.score >= (req.reputation || 0);
  });
}

export function launchCampaign(state, campaignId) {
  const campaign = getCampaign(campaignId);
  if (!campaign) return { success: false, reason: 'not-found' };
  if (!canAfford(state, campaign.cost)) return { success: false, reason: 'insufficient-funds' };
  spendCash(state, campaign.cost);
  state.marketing.activeCampaigns.push({
    id: campaign.id,
    daysRemaining: campaign.durationDays,
    startedDay: state.calendar.day,
    flopped: false,
  });
  return { success: true };
}

export function getActiveCampaignReach(state, rng = Math.random) {
  let reach = 0;
  for (const active of state.marketing.activeCampaigns) {
    const campaign = getCampaign(active.id);
    if (!campaign) continue;
    if (active.flopped) continue;
    reach += campaign.reach;
  }
  return clamp(reach, 0, 0.75);
}

export function getActivePriceDiscount(state) {
  let discount = 0;
  for (const active of state.marketing.activeCampaigns) {
    const campaign = getCampaign(active.id);
    if (campaign?.priceDiscount) discount = Math.max(discount, campaign.priceDiscount);
  }
  return discount;
}

/** Day-end: decrement durations, resolve flop risk once, decay/grow brand awareness. */
export function tickMarketing(state, rng = Math.random) {
  const notes = [];
  for (const active of state.marketing.activeCampaigns) {
    const campaign = getCampaign(active.id);
    if (campaign?.riskOfFlop && active.daysRemaining === campaign.durationDays) {
      if (chance(rng, campaign.riskOfFlop)) {
        active.flopped = true;
        notes.push(`${campaign.name} didn't land the way you hoped.`);
      }
    }
    active.daysRemaining -= 1;
  }
  state.marketing.activeCampaigns = state.marketing.activeCampaigns.filter((c) => c.daysRemaining > 0);

  const reach = getActiveCampaignReach(state);
  const target = 20 + reach * 200;
  const current = state.reputation.brandAwareness;
  const drift = reach > 0 ? (target - current) * 0.08 : -current * 0.02;
  state.reputation.brandAwareness = clamp(roundTo(current + drift, 2), 0, 100);
  return notes;
}
