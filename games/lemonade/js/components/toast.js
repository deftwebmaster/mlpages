import { onNotify } from '../systems/notification-system.js';
import { NOTIFICATION_DURATION_MS } from '../utils/constants.js';
import { playSound } from '../systems/audio-system.js';

let initialized = false;

const SOUND_BY_TOAST_TYPE = {
  success: 'success',
  achievement: 'achievement',
  milestone: 'milestone',
  error: 'error',
  info: 'info',
};

export function initToasts() {
  if (initialized) return;
  initialized = true;
  onNotify(({ message, type }) => showToast(message, type));
}

export function showToast(message, type = 'info') {
  playSound(SOUND_BY_TOAST_TYPE[type] || 'info');
  const root = document.getElementById('toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.setAttribute('role', 'status');
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 240ms ease, transform 240ms ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    setTimeout(() => el.remove(), 260);
  }, NOTIFICATION_DURATION_MS);
}
