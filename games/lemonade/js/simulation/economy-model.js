import { roundTo, clamp, sum } from '../utils/math.js';
import { getUpgrade } from '../data/upgrades.js';

/** The "neighborhood expects to pay" range shown to the player pre-day. */
export function computeLocalPriceExpectation({ location, reputation, quality }) {
  const [lo, hi] = location.priceExpectation;
  const repBoost = 1 + reputation / 220;
  // Quality is neutral at 0.75 (a baseline stand with no upgrades) so it
  // doesn't drag the price expectation down before the player has done anything.
  const qualityBoost = 1 + (quality - 0.75) * 0.24;
  return [roundTo(lo * repBoost * qualityBoost, 2), roundTo(hi * repBoost * qualityBoost, 2)];
}

export function priceReaction(price, [lo, hi]) {
  if (price < lo * 0.8) return 'Bargain';
  if (price <= hi) return 'Fair';
  if (price <= hi * 1.3) return 'Expensive';
  return 'Overpriced';
}

export function buildWaterfall({ revenue, ingredientCost, wages, marketing, rent, wasteCost, loanPayment = 0 }) {
  const netProfit = revenue - ingredientCost - wages - marketing - rent - wasteCost - loanPayment;
  return { revenue, ingredientCost, wages, marketing, rent, wasteCost, loanPayment, netProfit: roundTo(netProfit, 2) };
}

export function computeBusinessValue(state) {
  const { finances, inventory, upgrades, locations } = state;
  const inventoryValue = Object.values(inventory).reduce((sum, item) => sum + item.quantity * 0.4, 0);
  // Only count what was actually paid for — free starter gear/locations
  // shouldn't inflate valuation before the player has done anything.
  const upgradeValue = sum(upgrades.owned.map((id) => getUpgrade(id)?.cost || 0));
  const locationValue = locations.ownedIds.filter((id) => id !== 'driveway').length * 300;
  const loanBalance = finances.loans.reduce((sum, loan) => sum + loan.remainingPrincipal, 0);
  return Math.max(0, roundTo(finances.cash + inventoryValue + upgradeValue + locationValue - loanBalance, 2));
}

/** Simple fixed-payment loan: equal daily payments across the term. */
export function createLoan({ principal, annualRatePct, termDays, startedDay }) {
  const dailyRate = annualRatePct / 100 / 365;
  const totalInterest = principal * dailyRate * termDays * 1.15; // slight simplification buffer
  const totalOwed = principal + totalInterest;
  const dailyPayment = roundTo(totalOwed / termDays, 2);
  return {
    id: `loan-${startedDay}-${Math.round(principal)}`,
    principal,
    remainingPrincipal: principal,
    dailyPayment,
    daysRemaining: termDays,
    annualRatePct,
    startedDay,
  };
}

export function applyLoanPayment(loan) {
  const payment = Math.min(loan.dailyPayment, loan.remainingPrincipal + loan.dailyPayment * 0.0001);
  const updated = {
    ...loan,
    remainingPrincipal: Math.max(0, roundTo(loan.remainingPrincipal - (loan.dailyPayment * 0.75), 2)),
    daysRemaining: Math.max(0, loan.daysRemaining - 1),
  };
  return { updated, payment: loan.dailyPayment };
}

export function reputationDelta({ avgSatisfaction, stockouts, cleanlinessOk = true }) {
  let delta = (avgSatisfaction - 0.55) * 4;
  if (stockouts > 0) delta -= Math.min(3, stockouts * 0.6);
  if (!cleanlinessOk) delta -= 2;
  return clamp(delta, -6, 4);
}
