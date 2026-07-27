import { clamp } from '../utils/math.js';

export function progressBarHtml(percent, { thin = false, label = '' } = {}) {
  const pct = Math.round(clamp(percent, 0, 1) * 100);
  return `
    <div class="progress-bar${thin ? ' progress-bar--thin' : ''}" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" ${label ? `aria-label="${label}"` : ''}>
      <div class="progress-bar__fill" style="width:${pct}%"></div>
    </div>
  `;
}
