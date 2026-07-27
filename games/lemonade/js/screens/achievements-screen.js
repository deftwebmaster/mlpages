import { getState } from '../state/game-store.js';
import { getAchievementProgress } from '../systems/achievement-system.js';

export function renderAchievementsScreen(container, { navigate }) {
  const root = document.createElement('div');
  root.className = 'stack';
  const state = getState();
  const achievements = getAchievementProgress(state);

  root.innerHTML = `
    <div class="row"><button class="icon-btn" id="back-btn" aria-label="Back">←</button><div style="font-weight:800;font-size:1.2rem;">Achievements</div></div>
    <div class="card__subtitle">${achievements.filter((a) => a.earned).length} / ${achievements.length} earned</div>
    <div class="stack--tight">
      ${achievements.map((a) => `
        <div class="card achievement-card ${a.earned ? 'earned' : ''} row row--between">
          <div>
            <div style="font-weight:700;">${a.earned ? '🏆' : '🔒'} ${a.name}</div>
            <div class="card__subtitle">${a.description}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  root.querySelector('#back-btn').addEventListener('click', () => navigate('/more'));
  container.appendChild(root);
  return () => root.remove();
}
