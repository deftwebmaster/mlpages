import { getState, setState } from '../state/game-store.js';
import { getLocation } from '../data/locations.js';
import {
  isBottlingOperational, getAvailableBottleSizes, maxBottlesFromInventory,
  produceBottles, refreshContractOffers, acceptContract, deliverContract,
} from '../systems/wholesale-system.js';
import { qualityScore } from '../systems/recipe-system.js';
import { formatMoney, formatPercent } from '../utils/format.js';
import { openSheet } from '../components/bottom-sheet.js';
import { showToast } from '../components/toast.js';
import { progressBarHtml } from '../components/progress-bar.js';

export function renderWholesaleScreen(container, { navigate }) {
  const root = document.createElement('div');
  root.className = 'stack';
  container.appendChild(root);

  function rerender() {
    const state = getState();
    if (isBottlingOperational(state) && state.wholesale.offers.length === 0) {
      refreshContractOffers(state, Math.random, 3);
      setState(() => {});
    }
    root.innerHTML = buildContent(state);
    wireEvents(state);
  }

  function wireEvents(state) {
    root.querySelector('#back-btn')?.addEventListener('click', () => navigate('/business'));
    root.querySelector('#goto-locations')?.addEventListener('click', () => navigate('/business/locations'));

    root.querySelectorAll('[data-produce]').forEach((btn) => {
      btn.addEventListener('click', () => openProduceSheet(state, btn.dataset.produce, rerender));
    });
    root.querySelectorAll('[data-accept]').forEach((btn) => {
      btn.addEventListener('click', () => openAcceptSheet(state, btn.dataset.accept, rerender));
    });
    root.querySelectorAll('[data-deliver]').forEach((btn) => {
      btn.addEventListener('click', () => openDeliverSheet(state, btn.dataset.deliver, rerender));
    });
  }

  rerender();
  return () => { root.remove(); };
}

function buildContent(state) {
  const header = `
    <div class="row"><button class="icon-btn" id="back-btn" aria-label="Back">←</button><div style="font-weight:800;font-size:1.2rem;">Wholesale &amp; Bottling</div></div>
  `;

  if (!isBottlingOperational(state)) {
    const facility = getLocation('production-facility');
    return `
      ${header}
      <div class="card" style="text-align:center;">
        <div style="font-size:2rem;margin-bottom:8px;">🏭</div>
        <div style="font-weight:800;margin-bottom:4px;">Open a Production Facility</div>
        <div class="card__subtitle" style="margin-bottom:12px;">Bottling, batch production, and wholesale contracts all run out of the Production Facility location.</div>
        <div class="card__subtitle">Requires ${facility.unlockRequirement.reputation} reputation &amp; ${formatMoney(facility.unlockRequirement.cash, { whole: true })} cash</div>
        <div class="card__subtitle">You have ${Math.round(state.reputation.score)} reputation &amp; ${formatMoney(state.finances.cash, { whole: true })} cash</div>
        <button class="btn btn--primary btn--full" style="margin-top:12px;" id="goto-locations">View Locations</button>
      </div>
    `;
  }

  const quality = qualityScore(state.recipes.activeMenuItemId, state.recipes.current, state);
  const bottleSizes = getAvailableBottleSizes(state);

  return `
    ${header}

    <div class="card row row--between">
      <span class="card__subtitle">Current product quality</span>
      <span class="badge ${quality >= 0.6 ? 'badge--success' : 'badge--warning'}">${formatPercent(quality)}</span>
    </div>

    <div class="section-title">Bottle Inventory</div>
    <div class="stack--tight">
      ${bottleSizes.map((b) => bottleRow(state, b)).join('')}
    </div>

    <div class="section-title" style="margin-top:16px;">Contract Offers</div>
    <div class="stack--tight">
      ${state.wholesale.offers.length
        ? state.wholesale.offers.map((o) => offerRow(o)).join('')
        : '<div class="empty-state card__subtitle">No offers right now — check back tomorrow.</div>'}
    </div>

    <div class="section-title" style="margin-top:16px;">Active Contracts</div>
    <div class="stack--tight">
      ${state.wholesale.activeContracts.length
        ? state.wholesale.activeContracts.map((c) => activeContractRow(state, c)).join('')
        : '<div class="empty-state card__subtitle">No active contracts.</div>'}
    </div>

    ${state.wholesale.completedContracts.length ? `
    <div class="section-title" style="margin-top:16px;">History</div>
    <div class="stack--tight">
      ${state.wholesale.completedContracts.slice(-5).reverse().map((c) => `
        <div class="list-row card">
          <div class="list-row__icon">${c.outcome === 'fulfilled' ? '✅' : '❌'}</div>
          <div class="list-row__body">
            <div class="list-row__title">${c.clientName}</div>
            <div class="list-row__subtitle">${c.outcome === 'fulfilled' ? `Fulfilled on Day ${c.completedDay}` : `Missed deadline on Day ${c.completedDay}`}</div>
          </div>
        </div>
      `).join('')}
    </div>` : ''}
  `;
}

function bottleRow(state, bottle) {
  const onHand = state.wholesale.bottleInventory[bottle.id]?.quantity || 0;
  const maxProducible = maxBottlesFromInventory(state, bottle.id);
  return `
    <div class="card row row--between">
      <div>
        <div style="font-weight:700;">${bottle.name}</div>
        <div class="card__subtitle">${Math.round(onHand)} on hand · ${formatMoney(bottle.packagingCost)}/bottle to produce</div>
        <div class="card__subtitle">Shelf life ${bottle.shelfLifeDays} days · can make up to ${maxProducible} now</div>
      </div>
      <button class="btn btn--secondary btn--sm" data-produce="${bottle.id}">Produce</button>
    </div>
  `;
}

function offerRow(offer) {
  return `
    <div class="card stack--tight">
      <div class="row row--between">
        <div style="font-weight:700;">${offer.clientName}</div>
        <div style="font-weight:800;">${formatMoney(offer.pricePerUnit)}/btl</div>
      </div>
      <div class="card__subtitle">${offer.quantity} bottles · ${offer.deadlineDays} day deadline · min quality ${formatPercent(offer.qualityRequirement)}</div>
      <div class="card__subtitle">Penalty if missed: ${formatMoney(offer.penalty)} · Reputation reward: +${offer.reputationReward}</div>
      <button class="btn btn--primary btn--full" data-accept="${offer.id}">Accept Contract</button>
    </div>
  `;
}

function activeContractRow(state, contract) {
  const pct = contract.quantity > 0 ? contract.fulfilled / contract.quantity : 0;
  return `
    <div class="card stack--tight">
      <div class="row row--between">
        <div style="font-weight:700;">${contract.clientName}</div>
        <span class="badge ${contract.daysRemaining <= 1 ? 'badge--danger' : 'badge--info'}">${contract.daysRemaining} day${contract.daysRemaining === 1 ? '' : 's'} left</span>
      </div>
      <div class="card__subtitle">${Math.round(contract.fulfilled)} / ${contract.quantity} bottles delivered</div>
      ${progressBarHtml(pct, { thin: true })}
      <button class="btn btn--secondary btn--full" data-deliver="${contract.id}">Deliver</button>
    </div>
  `;
}

function openProduceSheet(state, bottleId, rerender) {
  const maxQty = maxBottlesFromInventory(state, bottleId);
  let qty = Math.min(24, maxQty);
  openSheet({
    title: 'Produce Bottles',
    render: (body, close) => {
      function refresh() {
        body.innerHTML = `
          <div class="stepper">
            <button class="stepper__btn" id="q-minus">−</button>
            <div class="stepper__value">${qty} bottles</div>
            <button class="stepper__btn" id="q-plus">+</button>
          </div>
          <div class="card__subtitle" style="text-align:center;margin-bottom:12px;">Max from current ingredients: ${maxQty}</div>
          <button class="btn btn--primary btn--full" id="confirm-produce" ${qty <= 0 ? 'disabled' : ''}>Produce ${qty} Bottles</button>
        `;
        body.querySelector('#q-minus').addEventListener('click', () => { qty = Math.max(0, qty - 6); refresh(); });
        body.querySelector('#q-plus').addEventListener('click', () => { qty = Math.min(maxQty, qty + 6); refresh(); });
        body.querySelector('#confirm-produce')?.addEventListener('click', () => {
          const result = produceBottles(state, bottleId, qty);
          setState(() => {});
          if (result.success) {
            showToast(`Produced ${result.quantityProduced} bottles.`, 'success');
            close();
            rerender();
          } else {
            showToast(result.reason === 'insufficient-funds' ? "Can't afford the packaging cost." : "Not enough ingredients.", 'error');
          }
        });
      }
      refresh();
    },
  });
}

function openAcceptSheet(state, offerId, rerender) {
  const bottleSizes = getAvailableBottleSizes(state);
  openSheet({
    title: 'Fulfill With Which Bottle?',
    render: (body, close) => {
      body.innerHTML = bottleSizes.map((b) => `
        <button class="list-row" style="width:100%;text-align:left;" data-bottle="${b.id}">
          <div class="list-row__icon">🍾</div>
          <div class="list-row__body">
            <div class="list-row__title">${b.name}</div>
            <div class="list-row__subtitle">${Math.round(state.wholesale.bottleInventory[b.id]?.quantity || 0)} on hand</div>
          </div>
        </button>
      `).join('');
      body.querySelectorAll('[data-bottle]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const result = acceptContract(state, offerId, btn.dataset.bottle);
          setState(() => {});
          if (result.success) {
            showToast('Contract accepted!', 'success');
            close();
            rerender();
          }
        });
      });
    },
  });
}

function openDeliverSheet(state, contractId, rerender) {
  const contract = state.wholesale.activeContracts.find((c) => c.id === contractId);
  if (!contract) return;
  const available = state.wholesale.bottleInventory[contract.bottleId]?.quantity || 0;
  const remaining = contract.quantity - contract.fulfilled;
  let qty = Math.min(available, remaining);

  openSheet({
    title: `Deliver to ${contract.clientName}`,
    render: (body, close) => {
      function refresh() {
        body.innerHTML = `
          <div class="stepper">
            <button class="stepper__btn" id="q-minus">−</button>
            <div class="stepper__value">${qty} bottles</div>
            <button class="stepper__btn" id="q-plus">+</button>
          </div>
          <div class="card__subtitle" style="text-align:center;margin-bottom:12px;">On hand: ${Math.round(available)} · Remaining on contract: ${Math.round(remaining)}</div>
          <button class="btn btn--primary btn--full" id="confirm-deliver" ${qty <= 0 ? 'disabled' : ''}>Deliver ${qty} Bottles</button>
        `;
        body.querySelector('#q-minus').addEventListener('click', () => { qty = Math.max(0, qty - 6); refresh(); });
        body.querySelector('#q-plus').addEventListener('click', () => { qty = Math.min(available, remaining, qty + 6); refresh(); });
        body.querySelector('#confirm-deliver')?.addEventListener('click', () => {
          const result = deliverContract(state, contractId, qty);
          setState(() => {});
          if (result.success) {
            showToast(result.completed ? `Contract complete! Paid ${formatMoney(result.payment)}.` : `Delivered ${result.delivered} bottles for ${formatMoney(result.payment)}.`, 'success');
            close();
            rerender();
          } else if (result.reason === 'quality-too-low') {
            showToast(`Your current quality (${formatPercent(result.quality)}) doesn't meet this contract's requirement.`, 'error');
          } else {
            showToast("Nothing to deliver.", 'error');
          }
        });
      }
      refresh();
    },
  });
}
