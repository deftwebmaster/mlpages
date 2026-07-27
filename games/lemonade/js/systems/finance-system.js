import { roundTo } from '../utils/math.js';

export function canAfford(state, amount) {
  return state.finances.cash >= amount;
}

export function spendCash(state, amount, { trackExpense = true } = {}) {
  state.finances.cash = roundTo(state.finances.cash - amount, 2);
  if (trackExpense) state.finances.lifetimeExpenses = roundTo(state.finances.lifetimeExpenses + amount, 2);
}

export function addCash(state, amount, { trackRevenue = false } = {}) {
  state.finances.cash = roundTo(state.finances.cash + amount, 2);
  if (trackRevenue) state.finances.lifetimeRevenue = roundTo(state.finances.lifetimeRevenue + amount, 2);
}

/**
 * Records a completed day's P&L. `waterfall.netProfit` is the full business
 * performance figure (includes ingredient/waste costs already paid for when
 * supplies were purchased) and feeds lifetime stats; `cashDelta` is the actual
 * cash movement today (revenue minus wages/rent/loan, which settle today) so
 * ingredient costs are never deducted from cash twice.
 */
export function recordDayFinancials(state, waterfall, cashDelta) {
  state.finances.lifetimeRevenue = roundTo(state.finances.lifetimeRevenue + waterfall.revenue, 2);
  const expenses = waterfall.ingredientCost + waterfall.wages + waterfall.marketing + waterfall.rent + waterfall.wasteCost + waterfall.loanPayment;
  state.finances.lifetimeExpenses = roundTo(state.finances.lifetimeExpenses + expenses, 2);
  state.finances.lifetimeProfit = roundTo(state.finances.lifetimeProfit + waterfall.netProfit, 2);
  state.finances.cash = roundTo(state.finances.cash + cashDelta, 2);
}
