import { getState, setState } from '../state/game-store.js';
import { getCurrentTutorialStep, skipTutorial } from '../systems/tutorial-system.js';

export function tutorialBannerHtml(state, screenId) {
  const step = getCurrentTutorialStep(state);
  if (!step || step.screen !== screenId) return '';
  return `
    <div class="card" style="border:2px solid var(--accent-primary-strong);" id="tutorial-banner" role="note">
      <div class="row row--between" style="align-items:flex-start;">
        <div>
          <div style="font-weight:800;margin-bottom:4px;">💡 ${step.title}</div>
          <div class="card__subtitle">${step.message}</div>
        </div>
        <button class="icon-btn" id="tutorial-skip" aria-label="Skip tutorial" title="Skip tutorial">✕</button>
      </div>
    </div>
  `;
}

export function wireTutorialBanner(root, rerender) {
  root.querySelector('#tutorial-skip')?.addEventListener('click', () => {
    setState((s) => skipTutorial(s));
    rerender();
  });
}

export function currentTutorialStepId() {
  const step = getCurrentTutorialStep(getState());
  return step?.id || null;
}
