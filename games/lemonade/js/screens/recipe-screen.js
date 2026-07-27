import { getState, setState } from '../state/game-store.js';
import {
  getRecipeDescriptor, costPerCup, qualityScore, setCurrentRecipe,
  saveRecipe, deleteSavedRecipe, getAvailableMenuItems,
} from '../systems/recipe-system.js';
import { formatMoney, formatPercent } from '../utils/format.js';
import { openSheet } from '../components/bottom-sheet.js';
import { showToast } from '../components/toast.js';
import { advanceTutorial } from '../systems/tutorial-system.js';

const SLIDER_LABELS = {
  lemon: ['Very Mild', 'Mild', 'Balanced', 'Strong', 'Very Strong'],
  sugar: ['Unsweet', 'Light', 'Balanced', 'Sweet', 'Very Sweet'],
  ice: ['No Ice', 'Light Ice', 'Normal', 'Extra Ice', 'Over-Iced'],
};

export function renderRecipeScreen(container, { navigate }) {
  const root = document.createElement('div');
  root.className = 'stack';
  container.appendChild(root);

  function rerender() {
    const state = getState();
    root.innerHTML = buildContent(state);
    wireEvents(state);
  }

  function wireEvents(state) {
    root.querySelector('#back-btn')?.addEventListener('click', () => navigate('/stand'));

    ['lemon', 'sugar', 'ice'].forEach((key) => {
      const input = root.querySelector(`#slider-${key}`);
      input?.addEventListener('input', () => {
        setCurrentRecipe(state, { [key]: Number(input.value) });
        advanceTutorial(state, 'set-recipe');
        setState(() => {});
        rerender();
      });
    });

    root.querySelector('#menu-select')?.addEventListener('change', (e) => {
      setState((s) => { s.recipes.activeMenuItemId = e.target.value; });
      rerender();
    });

    root.querySelector('#save-recipe')?.addEventListener('click', () => openSaveSheet(state, rerender));

    root.querySelectorAll('[data-load-recipe]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const recipe = state.recipes.saved.find((r) => r.id === btn.dataset.loadRecipe);
        if (!recipe) return;
        setState((s) => {
          s.recipes.current = { lemon: recipe.lemon, sugar: recipe.sugar, ice: recipe.ice };
          if (getAvailableMenuItems(s).some((m) => m.id === recipe.menuItemId)) {
            s.recipes.activeMenuItemId = recipe.menuItemId;
          }
        });
        rerender();
      });
    });

    root.querySelectorAll('[data-delete-recipe]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSavedRecipe(state, btn.dataset.deleteRecipe);
        setState(() => {});
        rerender();
      });
    });
  }

  rerender();
  return () => { root.remove(); };
}

function buildContent(state) {
  const recipe = state.recipes.current;
  const descriptor = getRecipeDescriptor(recipe);
  const menuItems = getAvailableMenuItems(state);
  const cupCost = costPerCup(state.recipes.activeMenuItemId, recipe);
  const quality = qualityScore(state.recipes.activeMenuItemId, recipe, state);
  const fillColor = descriptor === 'Sweet' ? 'var(--color-coral)' : descriptor === 'Tart' ? 'var(--color-leaf)' : 'var(--color-lemon)';

  return `
    <div class="row">
      <button class="icon-btn" id="back-btn" aria-label="Back">←</button>
      <div style="font-weight:800;font-size:1.2rem;">Recipe Builder</div>
    </div>

    <div class="recipe-glass">
      <div class="recipe-glass__fill" style="height:${40 + recipe.ice * 8}%;background:${fillColor};"></div>
    </div>

    <div class="card" style="text-align:center;">
      <div style="font-size:1.4rem;font-weight:800;">${descriptor}</div>
      <div class="card__subtitle">Cost per cup ${formatMoney(cupCost)} · Quality ${formatPercent(quality)}</div>
    </div>

    ${menuItems.length > 1 ? `
    <div class="card stack--tight">
      <div class="section-title">Menu Item</div>
      <select id="menu-select" style="width:100%;padding:12px;border-radius:12px;background:var(--bg-card-alt);">
        ${menuItems.map((m) => `<option value="${m.id}" ${m.id === state.recipes.activeMenuItemId ? 'selected' : ''}>${m.name}</option>`).join('')}
      </select>
    </div>` : ''}

    <div class="card stack">
      ${sliderRow('lemon', 'Lemon', recipe.lemon)}
      ${sliderRow('sugar', 'Sugar', recipe.sugar)}
      ${sliderRow('ice', 'Ice', recipe.ice)}
    </div>

    <div class="stack--tight">
      <div class="row row--between">
        <div class="section-title" style="margin:0;">Saved Recipes</div>
        <button class="btn btn--secondary btn--sm" id="save-recipe">Save Current</button>
      </div>
      <div class="stack--tight">
        ${state.recipes.saved.map((r) => `
          <button class="list-row" style="width:100%;text-align:left;" data-load-recipe="${r.id}">
            <div class="list-row__icon">🥤</div>
            <div class="list-row__body">
              <div class="list-row__title">${r.name}</div>
              <div class="list-row__subtitle">Lemon ${r.lemon} · Sugar ${r.sugar} · Ice ${r.ice}</div>
            </div>
            <button class="icon-btn" data-delete-recipe="${r.id}" aria-label="Delete recipe">🗑</button>
          </button>
        `).join('') || '<div class="empty-state card__subtitle">No saved recipes yet.</div>'}
      </div>
    </div>
  `;
}

function sliderRow(key, label, value) {
  return `
    <div>
      <div class="field-label"><span>${label}</span><span class="value">${SLIDER_LABELS[key][value - 1]}</span></div>
      <input type="range" min="1" max="5" step="1" value="${value}" id="slider-${key}" />
    </div>
  `;
}

function openSaveSheet(state, rerender) {
  openSheet({
    title: 'Save Recipe',
    render: (body, close) => {
      body.innerHTML = `
        <input id="recipe-name" type="text" placeholder="Recipe name" maxlength="24"
          style="width:100%;padding:14px;border-radius:12px;background:var(--bg-card-alt);margin-bottom:12px;" />
        <button class="btn btn--primary btn--full" id="confirm-save">Save</button>
      `;
      body.querySelector('#confirm-save').addEventListener('click', () => {
        const name = body.querySelector('#recipe-name').value.trim() || 'My Recipe';
        saveRecipe(state, name, state.recipes.activeMenuItemId, state.recipes.current);
        setState(() => {});
        showToast('Recipe saved!', 'success');
        close();
        rerender();
      });
    },
  });
}
