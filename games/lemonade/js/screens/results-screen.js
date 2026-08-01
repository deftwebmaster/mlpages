import { getState, setState } from '../state/game-store.js';
import { advanceToNextDay } from '../systems/day-cycle-system.js';
import { getLocation } from '../data/locations.js';
import { getAchievement } from '../data/achievements.js';
import { getMilestone } from '../data/milestones.js';
import { getMenuItem } from '../data/recipes.js';
import { formatMoney, formatPercent, capitalize } from '../utils/format.js';
import { WEATHER_TYPES } from '../simulation/weather-model.js';
import { advanceTutorial } from '../systems/tutorial-system.js';
import { tutorialBannerHtml, wireTutorialBanner } from '../components/tutorial-banner.js';
import { lemonadeStandSceneHtml } from '../components/brand-scenes.js';

export function renderResultsScreen(container, { navigate }) {
  const state = getState();
  const report = state.lastDayReport;

  const root = document.createElement('div');
  root.className = 'stack';

  if (!report) {
    root.innerHTML = `<div class="empty-state"><div class="icon">🧾</div><p>No results to show yet.</p></div>`;
    container.appendChild(root);
    return () => root.remove();
  }

  root.innerHTML = tutorialBannerHtml(state, 'results') + buildContent(report);
  container.appendChild(root);

  wireTutorialBanner(root, () => {
    root.innerHTML = tutorialBannerHtml(getState(), 'results') + buildContent(report);
    wireTutorialBanner(root, () => {});
    root.querySelector('#continue-btn').addEventListener('click', onContinue);
  });
  root.querySelector('#continue-btn').addEventListener('click', onContinue);

  function onContinue() {
    advanceTutorial(getState(), 'results');
    setState((s) => advanceToNextDay(s));
    navigate('/stand');
  }

  return () => { root.remove(); };
}

function buildContent(report) {
  const w = report.waterfall;
  const profitTone = w.netProfit >= 0 ? 'positive' : 'negative';
  const { helped, hurt } = deriveFactors(report);
  const location = getLocation(report.locationId);
  const weatherInfo = WEATHER_TYPES[report.weather.type] || WEATHER_TYPES.sunny;
  const sellThrough = report.cupsPrepared ? report.cupsSold / report.cupsPrepared : 0;
  const grade = resultGrade(w.netProfit, sellThrough, report.avgSatisfaction);
  const headline = resultHeadline(grade, w.netProfit);

  const badges = [];
  if (report.newAchievements.length) {
    badges.push(...report.newAchievements.map((id) => `🏆 ${getAchievement(id)?.name}`));
  }
  if (report.newMilestones.length) {
    badges.push(...report.newMilestones.map((id) => `🚀 ${getMilestone(id)?.name} unlocked`));
  }
  if (report.newMenuItems.length) {
    badges.push(...report.newMenuItems.map((id) => `🥤 New menu item: ${getMenuItem(id)?.name}`));
  }

  return `
    <div class="results-hero results-hero--grade-${grade.toLowerCase().replace('+', 'plus')}">
      <div class="results-hero__scene">
        ${lemonadeStandSceneHtml({ variant: 'results', weather: report.weather.type, cups: report.cupsSold, customers: Math.round(report.customersServed / 12) })}
      </div>
      <div class="results-grade">${grade}</div>
      <div class="card__subtitle" style="color:var(--color-navy);opacity:0.76;">Day ${report.day} at ${location.name} · ${weatherInfo.icon} ${report.weather.temperature}°F</div>
      <h1>${headline}</h1>
      <div class="results-hero__amount">${formatMoney(w.netProfit)}</div>
      <div>net profit today</div>
    </div>

    <div class="debrief-strip">
      ${debriefTile('Sell-through', formatPercent(sellThrough))}
      ${debriefTile('Satisfaction', formatPercent(report.avgSatisfaction))}
      ${debriefTile('Waste', `${report.cupsWasted} cups`)}
    </div>

    ${badges.length ? `
    <div class="card stack--tight">
      ${badges.map((b) => `<div class="badge badge--success" style="width:100%;justify-content:center;padding:10px;">${b}</div>`).join('')}
    </div>` : ''}

    <div class="card">
      <div class="section-title">Financial Summary</div>
      ${waterfallRow('Sales revenue', w.revenue)}
      ${waterfallRow('Ingredient costs', -w.ingredientCost)}
      ${waterfallRow('Staff wages', -w.wages)}
      ${w.marketing ? waterfallRow('Marketing', -w.marketing) : ''}
      ${waterfallRow('Location rent', -w.rent)}
      ${waterfallRow('Waste cost', -w.wasteCost)}
      ${w.loanPayment ? waterfallRow('Loan payment', -w.loanPayment) : ''}
      <div class="waterfall-row waterfall-row--total">
        <span>Net profit</span>
        <span class="amount ${profitTone}">${formatMoney(w.netProfit)}</span>
      </div>
    </div>

    <div class="grid-2">
      ${statTile('Cups Sold', report.cupsSold)}
      ${statTile('Cups Wasted', report.cupsWasted)}
      ${statTile('Customers Served', report.customersServed)}
      ${statTile('Avg. Satisfaction', formatPercent(report.avgSatisfaction))}
    </div>

    <div class="card stack--tight">
      <div class="section-title">What Helped</div>
      <div class="factor-list">
        ${helped.length ? helped.map((h) => `<div class="factor-item good"><span class="mark">+</span><span>${h}</span></div>`).join('') : '<div class="card__subtitle">Nothing stood out today.</div>'}
      </div>
    </div>

    <div class="card stack--tight">
      <div class="section-title">What Hurt</div>
      <div class="factor-list">
        ${hurt.length ? hurt.map((h) => `<div class="factor-item bad"><span class="mark">−</span><span>${h}</span></div>`).join('') : '<div class="card__subtitle">No major setbacks today.</div>'}
      </div>
    </div>

    <button class="btn btn--primary btn--lg btn--full" id="continue-btn">Continue to Day ${report.day + 1}</button>
  `;
}

function debriefTile(label, value) {
  return `<div class="debrief-tile"><span>${label}</span><strong>${value}</strong></div>`;
}

function waterfallRow(label, amount) {
  const tone = amount < 0 ? 'negative' : amount > 0 ? 'positive' : '';
  return `<div class="waterfall-row"><span>${label}</span><span class="amount ${tone}">${formatMoney(amount)}</span></div>`;
}

function statTile(label, value) {
  return `<div class="stat-card"><div class="stat-card__label">${label}</div><div class="stat-card__value">${value}</div></div>`;
}

function resultGrade(netProfit, sellThrough, satisfaction) {
  if (netProfit > 70 && sellThrough >= 0.85 && satisfaction >= 0.72) return 'S';
  if (netProfit > 25 && sellThrough >= 0.65 && satisfaction >= 0.55) return 'A';
  if (netProfit >= 0 && sellThrough >= 0.45) return 'B';
  if (netProfit >= 0) return 'C';
  return 'D';
}

function resultHeadline(grade, netProfit) {
  if (grade === 'S') return 'Standout Day';
  if (grade === 'A') return 'Strong Momentum';
  if (grade === 'B') return 'Solid Sales';
  if (grade === 'C') return 'Thin Margin';
  return netProfit < 0 ? 'Tough Lessons' : 'Needs Tuning';
}

function deriveFactors(report) {
  const helped = [];
  const hurt = [];

  if (['sunny', 'heat-wave', 'humid'].includes(report.weather.type)) {
    helped.push('Warm weather brought more customers out.');
  }
  if (['heavy-rain', 'cold-front', 'storm-risk'].includes(report.weather.type)) {
    hurt.push(`${capitalize(report.weather.type.replace('-', ' '))} kept foot traffic down.`);
  }
  if (report.forecast.type !== report.weather.type) {
    hurt.push(`The forecast said ${report.forecast.type.replace('-', ' ')}, but it turned out ${report.weather.type.replace('-', ' ')}.`);
  }
  if (report.localActivity?.label) {
    helped.push(`${report.localActivity.label} brought extra traffic your way.`);
  }
  if (report.lostSales.wait > 0) hurt.push(`${report.lostSales.wait} customers left because of long waits.`);
  if (report.lostSales.unavailable > 0) hurt.push(`${report.lostSales.unavailable} customers left because you sold out.`);
  if (report.lostSales.price > 0) hurt.push(`${report.lostSales.price} customers thought your price was too high.`);
  if (report.lostSales.competitor > 0) hurt.push(`${report.lostSales.competitor} customers chose a competitor instead.`);
  if (report.cupsWasted > 0) hurt.push(`${report.cupsWasted} prepared cups went unsold and were wasted.`);
  if (report.cupsWasted === 0 && report.cupsPrepared > 0) helped.push('You sold out with zero waste.');
  if (report.avgSatisfaction >= 0.7) helped.push('Customers left highly satisfied.');
  else if (report.avgSatisfaction < 0.4 && report.customersServed > 0) hurt.push('Customers who bought in were often disappointed.');
  if (report.reputationDelta > 0.3) helped.push(`Reputation rose by ${report.reputationDelta.toFixed(1)} points.`);
  if (report.reputationDelta < -0.3) hurt.push(`Reputation fell by ${Math.abs(report.reputationDelta).toFixed(1)} points.`);
  if (report.departures?.length) hurt.push(`${report.departures.length} employee(s) quit due to low morale.`);
  for (const note of report.marketingNotes || []) hurt.push(note);

  return { helped, hurt };
}
