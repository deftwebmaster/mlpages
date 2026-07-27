import { getState, setState } from '../state/game-store.js';
import { INGREDIENTS, getIngredient } from '../data/ingredients.js';
import { SUPPLIERS, getSupplier } from '../data/suppliers.js';
import { getStorageCapacity, getStorageUsed, getFreshnessLabel, purchaseIngredient } from '../systems/inventory-system.js';
import { formatMoney, formatNumber } from '../utils/format.js';
import { progressBarHtml } from '../components/progress-bar.js';
import { openSheet } from '../components/bottom-sheet.js';
import { showToast } from '../components/toast.js';
import { clamp } from '../utils/math.js';
import { advanceTutorial } from '../systems/tutorial-system.js';
import { tutorialBannerHtml, wireTutorialBanner } from '../components/tutorial-banner.js';

const FRESHNESS_LABELS = {
  fresh: 'Fresh', aging: 'Aging', 'use-soon': 'Use Soon', spoiled: 'Spoiled', none: 'Out of Stock',
};

export function renderSuppliesScreen(container) {
  const root = document.createElement('div');
  root.className = 'stack';
  container.appendChild(root);

  function rerender() {
    const state = getState();
    advanceTutorial(state, 'welcome');
    root.innerHTML = buildContent(state);
    wireEvents(state);
  }

  function wireEvents(state) {
    wireTutorialBanner(root, rerender);
    root.querySelectorAll('[data-buy]').forEach((btn) => {
      btn.addEventListener('click', () => openBuySheet(state, btn.dataset.buy, rerender));
    });
  }

  rerender();
  return () => { root.remove(); };
}

function buildContent(state) {
  const capacity = getStorageCapacity(state);
  const used = getStorageUsed(state);
  const unlocked = INGREDIENTS.filter((i) => state.unlockedIngredients.includes(i.id) || i.unlocked);
  const locked = INGREDIENTS.filter((i) => !state.unlockedIngredients.includes(i.id) && !i.unlocked);

  return `
    ${tutorialBannerHtml(state, 'supplies')}
    <div class="card">
      <div class="row row--between" style="margin-bottom:6px;">
        <span class="section-title" style="margin:0;">Storage</span>
        <span class="card__subtitle">${Math.round(used)} / ${Math.round(capacity)}</span>
      </div>
      ${progressBarHtml(used / capacity)}
    </div>

    <div class="section-title">Ingredients</div>
    <div class="stack--tight">
      ${unlocked.map((ing) => ingredientRow(state, ing)).join('')}
    </div>

    ${locked.length ? `
    <div class="section-title" style="margin-top:16px;">Unlocks Soon</div>
    <div class="stack--tight">
      ${locked.map((ing) => `
        <div class="list-row" style="opacity:0.5;">
          <div class="list-row__icon">🔒</div>
          <div class="list-row__body">
            <div class="list-row__title">${ing.name}</div>
            <div class="list-row__subtitle">Unlocks at ${ing.unlockRequirement.reputation} reputation</div>
          </div>
        </div>
      `).join('')}
    </div>` : ''}
  `;
}

function ingredientRow(state, ingredient) {
  const entry = state.inventory[ingredient.id];
  const qty = entry?.quantity || 0;
  const freshness = getFreshnessLabel(ingredient.id, state);
  return `
    <div class="list-row card">
      <div class="list-row__icon">${categoryIcon(ingredient.category)}</div>
      <div class="list-row__body">
        <div class="list-row__title">${ingredient.name}</div>
        <div class="list-row__subtitle">${formatNumber(Math.round(qty * 10) / 10)} ${ingredient.unit}${qty === 1 ? '' : 's'} ·
          <span class="freshness-dot freshness-${freshness}"></span> ${FRESHNESS_LABELS[freshness]}
        </div>
      </div>
      <button class="btn btn--secondary btn--sm" data-buy="${ingredient.id}">Buy</button>
    </div>
  `;
}

function categoryIcon(category) {
  return { produce: '🍋', pantry: '🧂', cooling: '🧊', packaging: '🥤' }[category] || '📦';
}

function openBuySheet(state, ingredientId, rerender) {
  const ingredient = getIngredient(ingredientId);
  const availableSuppliers = SUPPLIERS.filter((s) => s.unlocked || state.reputation.score >= (s.unlockRequirement?.reputation || 0));
  let packs = availableSuppliers[0]?.minOrderPacks || 1;
  let supplierId = availableSuppliers[0]?.id || 'corner-grocery';

  openSheet({
    title: `Buy ${ingredient.name}`,
    render: (body, close) => {
      function refresh() {
        const supplier = getSupplier(supplierId);
        packs = Math.max(packs, supplier.minOrderPacks);
        const unitPrice = ingredient.packPrice * supplier.priceMultiplier;
        const total = unitPrice * packs;
        body.innerHTML = `
          <div class="stack">
            ${availableSuppliers.length > 1 ? `
            <div class="segmented">
              ${availableSuppliers.map((s) => `<button type="button" class="segmented__option" data-supplier="${s.id}" aria-pressed="${s.id === supplierId}">${s.name}</button>`).join('')}
            </div>
            <div class="card__subtitle">${supplier.description}</div>
            ` : ''}

            <div class="stepper">
              <button class="stepper__btn" id="pack-minus">−</button>
              <div class="stepper__value">${packs} pack${packs === 1 ? '' : 's'}</div>
              <button class="stepper__btn" id="pack-plus">+</button>
            </div>
            <div class="card__subtitle">${ingredient.packLabel} · min order ${supplier.minOrderPacks}</div>

            <div class="row row--between">
              <span>Total</span>
              <span style="font-weight:800;">${formatMoney(total)}</span>
            </div>
            <button class="btn btn--primary btn--full" id="confirm-buy" ${total > state.finances.cash ? 'disabled' : ''}>
              ${total > state.finances.cash ? 'Not enough cash' : 'Confirm Purchase'}
            </button>
          </div>
        `;
        body.querySelectorAll('[data-supplier]').forEach((btn) => {
          btn.addEventListener('click', () => { supplierId = btn.dataset.supplier; refresh(); });
        });
        body.querySelector('#pack-minus')?.addEventListener('click', () => {
          packs = Math.max(supplier.minOrderPacks, packs - 1);
          refresh();
        });
        body.querySelector('#pack-plus')?.addEventListener('click', () => {
          packs = packs + 1;
          refresh();
        });
        body.querySelector('#confirm-buy')?.addEventListener('click', () => {
          const result = purchaseIngredient(state, ingredientId, packs, supplierId);
          setState(() => {});
          if (result.success) {
            showToast(`Bought ${result.quantityAdded} ${ingredient.unit}s of ${ingredient.name}.`, 'success');
            advanceTutorial(state, 'buy-ingredients');
            close();
            rerender();
          } else {
            showToast("You don't have enough cash for that.", 'error');
          }
        });
      }
      refresh();
    },
  });
}
