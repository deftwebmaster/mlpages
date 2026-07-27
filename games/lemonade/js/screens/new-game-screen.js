import { GAME_TITLE, GAME_SUBTITLE, DIFFICULTIES } from '../utils/constants.js';
import { sanitizeName } from '../utils/validation.js';
import { formatMoney } from '../utils/format.js';

export function renderNewGameScreen(container, { onComplete }) {
  const state = { businessName: '', ownerName: '', difficulty: 'standard', tutorialEnabled: true };

  const wrap = document.createElement('div');
  wrap.className = 'onboarding';
  wrap.innerHTML = `
    <div class="onboarding__brand">
      <div class="onboarding__logo">🍋</div>
      <div class="onboarding__title">${GAME_TITLE}</div>
      <div class="onboarding__subtitle">${GAME_SUBTITLE}</div>
    </div>

    <div class="stack">
      <p style="text-align:center;color:var(--color-charcoal);">
        You've got a folding table, a pitcher, and a few dollars in your pocket.
        Everything else is up to you.
      </p>

      <div class="card stack">
        <label class="stack--tight">
          <div class="section-title">Business name</div>
          <input id="ng-business" type="text" placeholder="Sunny Day Lemonade" maxlength="30"
            style="width:100%;padding:14px;border-radius:12px;background:var(--bg-card-alt);font-size:1rem;" />
        </label>
        <label class="stack--tight">
          <div class="section-title">Your name (optional)</div>
          <input id="ng-owner" type="text" placeholder="Owner" maxlength="20"
            style="width:100%;padding:14px;border-radius:12px;background:var(--bg-card-alt);font-size:1rem;" />
        </label>
      </div>

      <div class="stack--tight">
        <div class="section-title">Difficulty</div>
        <div class="stack" id="ng-difficulty"></div>
      </div>

      <label class="card row row--between" style="cursor:pointer;">
        <div>
          <div style="font-weight:700;">Tutorial</div>
          <div class="card__subtitle">Get contextual guidance for your first few days.</div>
        </div>
        <input id="ng-tutorial" type="checkbox" checked style="width:24px;height:24px;" />
      </label>

      <button class="btn btn--primary btn--lg btn--full" id="ng-start">Start My Empire</button>
    </div>
  `;

  const diffContainer = wrap.querySelector('#ng-difficulty');
  diffContainer.innerHTML = Object.entries(DIFFICULTIES).map(([key, d]) => `
    <button type="button" class="card difficulty-card" data-key="${key}" aria-pressed="${key === 'standard'}" style="text-align:left;width:100%;">
      <div class="row row--between">
        <div style="font-weight:800;">${d.label}</div>
        <div style="font-weight:700;color:var(--text-secondary);">${formatMoney(d.startingCash, { whole: true })} start</div>
      </div>
      <div class="card__subtitle">${describeDifficulty(key)}</div>
    </button>
  `).join('');

  diffContainer.querySelectorAll('.difficulty-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.difficulty = btn.dataset.key;
      diffContainer.querySelectorAll('.difficulty-card').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    });
  });

  wrap.querySelector('#ng-start').addEventListener('click', () => {
    state.businessName = sanitizeName(wrap.querySelector('#ng-business').value, 'Sunny Day Lemonade');
    state.ownerName = sanitizeName(wrap.querySelector('#ng-owner').value, '');
    state.tutorialEnabled = wrap.querySelector('#ng-tutorial').checked;
    onComplete({
      businessName: state.businessName,
      ownerName: state.ownerName,
      difficulty: state.difficulty,
      tutorialEnabled: state.tutorialEnabled,
    });
  });

  container.appendChild(wrap);
}

function describeDifficulty(key) {
  switch (key) {
    case 'relaxed': return 'More starting cash, forgiving demand, gentler competition.';
    case 'entrepreneur': return 'Tighter margins, sharper competition, real financial stakes.';
    default: return 'The intended, balanced experience.';
  }
}
