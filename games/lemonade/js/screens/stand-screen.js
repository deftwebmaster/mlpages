import { getState, setState } from '../state/game-store.js';
import { getLocation } from '../data/locations.js';
import { getMenuItem } from '../data/recipes.js';
import { getRecipeDescriptor, getAvailableMenuItems, setActiveMenuItem } from '../systems/recipe-system.js';
import { getPrepEstimate, prepareBatch, startDay } from '../systems/day-cycle-system.js';
import { ensureDayBriefing } from '../systems/briefing-system.js';
import { setCurrentLocation } from '../systems/location-system.js';
import { getNextReputationTier } from '../systems/progression-system.js';
import { WEATHER_TYPES } from '../simulation/weather-model.js';
import { formatMoney } from '../utils/format.js';
import { clamp } from '../utils/math.js';
import { progressBarHtml } from '../components/progress-bar.js';
import { openSheet } from '../components/bottom-sheet.js';
import { showToast } from '../components/toast.js';
import { MILESTONES } from '../data/milestones.js';
import { getAchievement } from '../data/achievements.js';
import { advanceTutorial } from '../systems/tutorial-system.js';
import { tutorialBannerHtml, wireTutorialBanner } from '../components/tutorial-banner.js';
import { playSound } from '../systems/audio-system.js';
import { lemonadeStandSceneHtml } from '../components/brand-scenes.js';

export function renderStandScreen(container, { navigate }) {
  const root = document.createElement('div');
  root.className = 'stack';
  container.appendChild(root);

  function rerender() {
    const state = getState();
    ensureDayBriefing(state);
    root.innerHTML = buildContent(state);
    wireEvents(state);
  }

  function wireEvents(state) {
    wireTutorialBanner(root, rerender);
    root.querySelector('#loc-picker')?.addEventListener('click', () => openLocationPicker(state, rerender));
    root.querySelector('#menu-picker')?.addEventListener('click', () => openMenuPicker(state, rerender));
    root.querySelector('#edit-recipe')?.addEventListener('click', () => navigate('/stand/recipe'));

    root.querySelector('#price-minus')?.addEventListener('click', () => adjustPrice(-0.25));
    root.querySelector('#price-plus')?.addEventListener('click', () => adjustPrice(0.25));
    root.querySelector('#cups-minus')?.addEventListener('click', () => adjustCups(-5));
    root.querySelector('#cups-plus')?.addEventListener('click', () => adjustCups(5));
    root.querySelector('#cups-max')?.addEventListener('click', () => {
      const estimate = getPrepEstimate(getState());
      setState((s) => { s.production.cupsPlanned = Math.max(1, estimate.maxCupsAffordable); });
      rerender();
    });

    root.querySelector('#prep-btn')?.addEventListener('click', () => {
      const s = getState();
      const result = prepareBatch(s, s.production.cupsPlanned);
      if (!result.success) {
        showToast("You don't have enough ingredients for that batch. Visit Supplies.", 'error');
        return;
      }
      if (result.shortfall > 0) {
        showToast(`Only had enough for ${result.cupsPrepared} cups — the rest is ready to sell.`, 'info');
      } else {
        showToast('Batch prepped and ready to sell!', 'success');
      }
      advanceTutorial(state, 'prepare');
      setState(() => {});
      rerender();
    });

    root.querySelector('#start-day-btn')?.addEventListener('click', () => {
      advanceTutorial(state, 'start-day');
      playSound('day-start');
      setState((s) => { s.liveDay = startDay(s); });
      navigate('/stand/live');
    });
  }

  function adjustPrice(delta) {
    setState((s) => {
      s.pricing.price = clamp(Math.round((s.pricing.price + delta) * 100) / 100, 0.25, 10);
      advanceTutorial(s, 'set-price');
    });
    rerender();
  }

  function adjustCups(delta) {
    setState((s) => {
      const batchCap = getPrepEstimate(s).batchCap;
      s.production.cupsPlanned = clamp(s.production.cupsPlanned + delta, 5, batchCap);
    });
    rerender();
  }

  rerender();
  return () => { root.remove(); };
}

function buildContent(state) {
  const location = getLocation(state.locations.currentId);
  const menuItem = getMenuItem(state.recipes.activeMenuItemId);
  const forecast = state.today.forecast;
  const weatherInfo = WEATHER_TYPES[forecast.type] || WEATHER_TYPES.sunny;
  const estimate = getPrepEstimate(state);
  const descriptor = getRecipeDescriptor(state.recipes.current);
  const availableMenuItems = getAvailableMenuItems(state);
  const ownedLocations = state.locations.ownedIds.map((id) => getLocation(id));

  const readiness = [
    { label: 'Recipe set', done: true },
    { label: 'Price set', done: true },
    { label: `Ingredients for ${state.production.cupsPlanned} cups`, done: state.ui.currentDayPrepared || estimate.maxCupsAffordable >= state.production.cupsPlanned },
    { label: "Today's batch prepared", done: state.ui.currentDayPrepared },
  ];

  const nextTier = getNextReputationTier(state.reputation.score);
  const objective = getPrimaryObjective(state);
  const optionalGoals = getOptionalGoals(state);

  const prepRatio = estimate.batchCap ? clamp(state.production.cupsPlanned / estimate.batchCap, 0, 1) : 0;
  const demandMidpoint = Math.round((estimate.demandRange.low + estimate.demandRange.high) / 2);
  const planGap = state.production.cupsPlanned - demandMidpoint;
  const planSignal = planGap < -8 ? 'Conservative batch'
    : planGap > 12 ? 'Aggressive batch'
      : 'Demand-matched batch';
  const activeEmployees = state.employees.filter((e) => e.shift !== 'closed').length;

  return `
    ${tutorialBannerHtml(state, 'stand')}

    <div class="stand-command">
      <div class="stand-command__copy">
        <span class="eyebrow">Morning Setup</span>
        <h1>${location.name}</h1>
        <p>${forecast.confidence === 'uncertain' ? 'Forecast says ' : ''}${weatherInfo.label}, ${forecast.temperature}°F${state.today.localActivity.label ? ` · ${state.today.localActivity.label}` : ''}</p>
        ${ownedLocations.length > 1 ? '<button class="chip stand-command__change" id="loc-picker">Change location</button>' : ''}
      </div>
      ${lemonadeStandSceneHtml({ variant: 'hero', weather: forecast.type, employeeCount: activeEmployees, cups: state.production.cupsPlanned, customers: Math.round(demandMidpoint / 12) })}
      <div class="stand-command__weather">${weatherInfo.icon}</div>
    </div>

    <div class="day-snapshot">
      ${snapshotTile('Demand', `${estimate.demandRange.low}–${estimate.demandRange.high}`, 'cups')}
      ${snapshotTile('Price Feel', estimate.reaction, 'customers')}
      ${snapshotTile('Batch Signal', planSignal, planGap === 0 ? 'balanced' : planGap > 0 ? '+ supply' : 'lean')}
    </div>

    <div class="card plan-card stack--tight">
      <div class="row row--between plan-card__header">
        <span class="section-title" style="margin:0;">Today's Plan</span>
        <button class="badge badge-tier" id="menu-picker" ${availableMenuItems.length <= 1 ? 'style="visibility:hidden;"' : ''}>${menuItem.name} ▾</button>
      </div>
      <div class="plan-card__recipe">
        <div>
          <div style="font-weight:800;font-size:1.1rem;">${descriptor}</div>
          <div class="card__subtitle">${menuItem.name}</div>
        </div>
        <button class="btn btn--secondary btn--sm" id="edit-recipe">Edit Recipe</button>
      </div>

      <div class="row row--between" style="margin-top:8px;">
        <span class="card__subtitle">Price per cup</span>
        <span class="badge ${reactionTone(estimate.reaction)}">${estimate.reaction}</span>
      </div>
      <div class="stepper">
        <button class="stepper__btn" id="price-minus" aria-label="Lower price">−</button>
        <div class="stepper__value">${formatMoney(state.pricing.price)}</div>
        <button class="stepper__btn" id="price-plus" aria-label="Raise price">+</button>
      </div>
      <div class="card__subtitle">Neighborhood range: ${formatMoney(estimate.priceExpectation[0])}–${formatMoney(estimate.priceExpectation[1])}</div>

      <div class="row row--between" style="margin-top:8px;">
        <span class="card__subtitle">Cups to prepare</span>
        <span class="card__subtitle">Cost/cup ${formatMoney(estimate.cupCost)}</span>
      </div>
      <div class="stepper">
        <button class="stepper__btn" id="cups-minus" aria-label="Fewer cups">−</button>
        <div class="stepper__value">${state.production.cupsPlanned}</div>
        <button class="stepper__btn" id="cups-plus" aria-label="More cups">+</button>
      </div>
      <div class="row row--between">
        <span class="card__subtitle">Estimated demand: ${estimate.demandRange.low}–${estimate.demandRange.high} cups</span>
        <button class="badge" id="cups-max">Use max (${estimate.maxCupsAffordable})</button>
      </div>
      <div class="card__subtitle">Equipment limit: ${estimate.batchCap} cups per batch</div>
      <div class="batch-meter" aria-hidden="true">
        <span style="width:${Math.round(prepRatio * 100)}%;"></span>
      </div>

      <div class="grid-2" style="margin-top:8px;">
        ${statTile('Potential revenue', formatMoney(estimate.potentialRevenue))}
        ${statTile('Est. margin/cup', formatMoney(estimate.estimatedMargin))}
      </div>
    </div>

    <div class="card readiness-card">
      <div class="section-title">Launch Checklist</div>
      <div class="readiness-list">
        ${readiness.map((r) => `<div class="readiness-item ${r.done ? 'done' : ''}"><span class="dot"></span>${r.label}</div>`).join('')}
      </div>
    </div>

    <button class="btn btn--primary btn--lg btn--full cta-button" id="${state.ui.currentDayPrepared ? 'start-day-btn' : 'prep-btn'}">
      ${state.ui.currentDayPrepared ? '☀️ Start Day' : '🧃 Prepare Today'}
    </button>

    ${objective ? `
    <div class="card">
      <div class="section-title">Objective</div>
      <div style="font-weight:700;margin-bottom:6px;">${objective.name}</div>
      <div class="card__subtitle">${objective.description}</div>
      ${optionalGoals.length ? `
      <div style="border-top:1px solid var(--border-soft);margin-top:10px;padding-top:10px;">
        <div class="card__subtitle" style="font-weight:700;margin-bottom:4px;">Also try:</div>
        ${optionalGoals.map((g) => `<div class="card__subtitle">🏆 ${g.name} — ${g.description}</div>`).join('')}
      </div>` : ''}
    </div>` : ''}

    <div class="card">
      <div class="row row--between" style="margin-bottom:6px;">
        <span class="section-title" style="margin:0;">Reputation</span>
        <span class="card__subtitle">${Math.round(state.reputation.score)}/100</span>
      </div>
      ${progressBarHtml(state.reputation.score / 100)}
      ${nextTier ? `<div class="card__subtitle" style="margin-top:6px;">${nextTier.min - state.reputation.score} pts to ${nextTier.label}</div>` : `<div class="card__subtitle" style="margin-top:6px;">You've reached the top tier!</div>`}
    </div>
  `;
}

function snapshotTile(label, value, sublabel) {
  return `<div class="snapshot-tile">
    <div class="snapshot-tile__label">${label}</div>
    <div class="snapshot-tile__value">${value}</div>
    <div class="snapshot-tile__sub">${sublabel}</div>
  </div>`;
}

function statTile(label, value) {
  return `<div class="stat-card"><div class="stat-card__label">${label}</div><div class="stat-card__value">${value}</div></div>`;
}

function reactionTone(reaction) {
  if (reaction === 'Bargain') return 'badge--info';
  if (reaction === 'Fair') return 'badge--success';
  if (reaction === 'Expensive') return 'badge--warning';
  return 'badge--danger';
}

function getPrimaryObjective(state) {
  const nextMilestone = MILESTONES.find((m) => !state.milestones.completed.includes(m.id));
  return nextMilestone || null;
}

// Roughly ordered easiest-to-hardest so early goals surface before deep late-game ones.
const OPTIONAL_GOAL_ORDER = [
  'first-sale', 'sold-out', 'perfect-batch', 'rush-hour', 'neighborhood-favorite',
  'rain-or-shine', 'hundred-dollar-day', 'no-waste-streak', 'first-employee',
  'five-star-service', 'second-location', 'thousand-cup-club',
];

function getOptionalGoals(state, count = 2) {
  return OPTIONAL_GOAL_ORDER
    .filter((id) => !state.achievements.earned.includes(id))
    .slice(0, count)
    .map((id) => getAchievement(id))
    .filter(Boolean);
}

function openLocationPicker(state, rerender) {
  openSheet({
    title: 'Choose Location',
    render: (body, close) => {
      body.innerHTML = state.locations.ownedIds.map((id) => {
        const loc = getLocation(id);
        return `<button class="list-row" style="width:100%;text-align:left;" data-id="${id}">
          <div class="list-row__icon">📍</div>
          <div class="list-row__body">
            <div class="list-row__title">${loc.name}</div>
            <div class="list-row__subtitle">${loc.tagline}</div>
          </div>
          ${id === state.locations.currentId ? '<span class="badge badge--success">Current</span>' : ''}
        </button>`;
      }).join('');
      body.querySelectorAll('[data-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          setCurrentLocation(state, btn.dataset.id);
          setState(() => {});
          close();
          rerender();
        });
      });
    },
  });
}

function openMenuPicker(state, rerender) {
  const items = getAvailableMenuItems(state);
  openSheet({
    title: 'Choose Menu Item',
    render: (body, close) => {
      body.innerHTML = items.map((item) => `
        <button class="list-row" style="width:100%;text-align:left;" data-id="${item.id}">
          <div class="list-row__icon">🥤</div>
          <div class="list-row__body">
            <div class="list-row__title">${item.name}</div>
            <div class="list-row__subtitle">${item.description}</div>
          </div>
          ${item.id === state.recipes.activeMenuItemId ? '<span class="badge badge--success">Active</span>' : ''}
        </button>
      `).join('');
      body.querySelectorAll('[data-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          setActiveMenuItem(state, btn.dataset.id);
          setState(() => {});
          close();
          rerender();
        });
      });
    },
  });
}
