import { getState } from '../state/game-store.js';
import { getLocation } from '../data/locations.js';
import { getMenuItem } from '../data/recipes.js';
import { formatMoney, formatPercent, capitalize } from '../utils/format.js';
import { sum } from '../utils/math.js';

export function renderReportsScreen(container) {
  const root = document.createElement('div');
  root.className = 'stack';
  const state = getState();
  root.innerHTML = buildContent(state);
  container.appendChild(root);
  return () => root.remove();
}

function buildContent(state) {
  const days = state.history.days;
  if (!days.length) {
    return `<div class="empty-state"><div class="icon">📊</div><p>Finish your first day to see reports here.</p></div>`;
  }

  const last7 = days.slice(-7);
  const maxProfit = Math.max(1, ...last7.map((d) => Math.abs(d.waterfall.netProfit)));

  const productStats = {};
  const locationStats = {};
  const segmentStats = {};
  let totalWaste = 0;
  let totalPrepared = 0;

  for (const day of days) {
    const p = (productStats[day.menuItemId] ||= { cupsSold: 0, revenue: 0 });
    p.cupsSold += day.cupsSold;
    p.revenue += day.waterfall.revenue;

    const l = (locationStats[day.locationId] ||= { profit: 0, days: 0 });
    l.profit += day.waterfall.netProfit;
    l.days += 1;

    for (const [seg, count] of Object.entries(day.segmentSales || {})) {
      segmentStats[seg] = (segmentStats[seg] || 0) + count;
    }
    totalWaste += day.cupsWasted;
    totalPrepared += day.cupsPrepared;
  }

  const totalSegmentSales = sum(Object.values(segmentStats)) || 1;

  return `
    <div class="section-title">Last 7 Days</div>
    <div class="card">
      <div class="trend-bars">
        ${last7.map((d) => `<div class="trend-bar" style="height:${Math.max(6, Math.abs(d.waterfall.netProfit) / maxProfit * 100)}%;background:${d.waterfall.netProfit >= 0 ? 'linear-gradient(180deg,var(--color-lemon),var(--color-leaf))' : 'linear-gradient(180deg,var(--accent-danger),var(--color-coral))'};" title="Day ${d.day}: ${formatMoney(d.waterfall.netProfit)}"></div>`).join('')}
      </div>
      <div class="row row--between card__subtitle" style="margin-top:6px;">
        <span>Day ${last7[0].day}</span><span>Day ${last7[last7.length - 1].day}</span>
      </div>
    </div>

    <div class="grid-2">
      ${statTile('Lifetime Profit', formatMoney(state.finances.lifetimeProfit))}
      ${statTile('Total Cups Sold', state.stats.totalCupsSold)}
      ${statTile('Days Run', state.stats.daysCompleted)}
      ${statTile('Waste Rate', formatPercent(totalPrepared ? totalWaste / totalPrepared : 0))}
    </div>

    <div class="section-title">Product Performance</div>
    <div class="stack--tight">
      ${Object.entries(productStats).map(([id, s]) => `
        <div class="card row row--between">
          <div>
            <div style="font-weight:700;">${getMenuItem(id)?.name || id}</div>
            <div class="card__subtitle">${s.cupsSold} cups sold</div>
          </div>
          <div style="font-weight:800;">${formatMoney(s.revenue)}</div>
        </div>
      `).join('')}
    </div>

    <div class="section-title">Location Performance</div>
    <div class="stack--tight">
      ${Object.entries(locationStats).map(([id, s]) => `
        <div class="card row row--between">
          <div>
            <div style="font-weight:700;">${getLocation(id)?.name || id}</div>
            <div class="card__subtitle">${s.days} day(s) operated</div>
          </div>
          <div style="font-weight:800;" class="${s.profit >= 0 ? '' : ''}">${formatMoney(s.profit)}</div>
        </div>
      `).join('')}
    </div>

    <div class="section-title">Customer Mix</div>
    <div class="card stack--tight">
      ${Object.entries(segmentStats).map(([seg, count]) => `
        <div class="row row--between">
          <span>${capitalize(seg)}</span>
          <span class="card__subtitle">${Math.round((count / totalSegmentSales) * 100)}%</span>
        </div>
      `).join('') || '<div class="card__subtitle">No sales yet.</div>'}
    </div>
  `;
}

function statTile(label, value) {
  return `<div class="stat-card"><div class="stat-card__label">${label}</div><div class="stat-card__value">${value}</div></div>`;
}
