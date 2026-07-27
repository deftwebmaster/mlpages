import { getState, setState } from '../state/game-store.js';
import { showToast } from '../components/toast.js';

export function renderSettingsScreen(container, { navigate }) {
  const root = document.createElement('div');
  root.className = 'stack';
  container.appendChild(root);

  function rerender() {
    const state = getState();
    root.innerHTML = buildContent(state);
    root.querySelector('#back-btn').addEventListener('click', () => navigate('/more'));

    bindToggle('#sound-toggle', (v) => { getState().settings.soundEnabled = v; });
    bindToggle('#music-toggle', (v) => { getState().settings.musicEnabled = v; });
    bindToggle('#reduced-motion-toggle', (v) => { getState().settings.reducedMotion = v; });
    bindToggle('#confirm-toggle', (v) => { getState().settings.confirmExpensivePurchases = v; });

    root.querySelector('#theme-select')?.addEventListener('change', (e) => {
      setState((s) => { s.settings.theme = e.target.value; });
    });
    root.querySelector('#speed-select')?.addEventListener('change', (e) => {
      setState((s) => { s.settings.defaultSimSpeed = Number(e.target.value); });
    });
    root.querySelector('#reset-tutorial')?.addEventListener('click', () => {
      setState((s) => {
        s.tutorial.enabled = true;
        s.tutorial.step = 'welcome';
        s.tutorial.completedSteps = [];
        s.settings.tutorialEnabled = true;
      });
      showToast('Tutorial reset. It will restart on the Stand screen.', 'success');
    });
  }

  function bindToggle(selector, apply) {
    root.querySelector(selector)?.addEventListener('change', (e) => {
      setState(() => apply(e.target.checked));
    });
  }

  rerender();
  return () => { root.remove(); };
}

function buildContent(state) {
  const s = state.settings;
  return `
    <div class="row"><button class="icon-btn" id="back-btn" aria-label="Back">←</button><div style="font-weight:800;font-size:1.2rem;">Settings</div></div>

    <div class="card stack">
      ${toggleRow('sound-toggle', 'Sound Effects', s.soundEnabled)}
      ${toggleRow('music-toggle', 'Music', s.musicEnabled)}
      ${toggleRow('reduced-motion-toggle', 'Reduce Motion', s.reducedMotion)}
      ${toggleRow('confirm-toggle', 'Confirm Expensive Purchases', s.confirmExpensivePurchases)}
    </div>

    <div class="card stack--tight">
      <div class="section-title">Theme</div>
      <select id="theme-select" style="width:100%;padding:12px;border-radius:12px;background:var(--bg-card-alt);">
        <option value="auto" ${s.theme === 'auto' ? 'selected' : ''}>Match Device</option>
        <option value="light" ${s.theme === 'light' ? 'selected' : ''}>Light</option>
        <option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>Dark</option>
      </select>
    </div>

    <div class="card stack--tight">
      <div class="section-title">Default Day Speed</div>
      <select id="speed-select" style="width:100%;padding:12px;border-radius:12px;background:var(--bg-card-alt);">
        <option value="1" ${s.defaultSimSpeed === 1 ? 'selected' : ''}>1×</option>
        <option value="2" ${s.defaultSimSpeed === 2 ? 'selected' : ''}>2×</option>
        <option value="4" ${s.defaultSimSpeed === 4 ? 'selected' : ''}>4×</option>
      </select>
    </div>

    <div class="card">
      <button class="btn btn--secondary btn--full" id="reset-tutorial">Reset Tutorial</button>
    </div>
  `;
}

function toggleRow(id, label, checked) {
  return `
    <label class="row row--between" style="cursor:pointer;">
      <span style="font-weight:600;">${label}</span>
      <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} style="width:24px;height:24px;" />
    </label>
  `;
}
