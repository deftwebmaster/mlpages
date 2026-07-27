import { navigate, onNavigate, getCurrentPath } from '../router.js';

export const TABS = [
  { id: 'stand', path: '/stand', label: 'Stand', icon: '🍋' },
  { id: 'supplies', path: '/supplies', label: 'Supplies', icon: '🧺' },
  { id: 'business', path: '/business', label: 'Business', icon: '📈' },
  { id: 'reports', path: '/reports', label: 'Reports', icon: '📊' },
  { id: 'more', path: '/more', label: 'More', icon: '☰' },
];

export function mountBottomNav(root) {
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'Primary');
  nav.innerHTML = TABS.map(
    (tab) => `
    <button class="bottom-nav__item${tab.id === 'stand' ? ' bottom-nav__item--primary' : ''}" data-path="${tab.path}" aria-label="${tab.label}">
      <span class="icon" aria-hidden="true">${tab.icon}</span>
      <span>${tab.label}</span>
    </button>
  `
  ).join('');

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.bottom-nav__item');
    if (btn) navigate(btn.dataset.path);
  });

  function updateActive(path) {
    const topLevel = `/${(path || getCurrentPath() || '/stand').split('/')[1]}`;
    nav.querySelectorAll('.bottom-nav__item').forEach((btn) => {
      if (btn.dataset.path === topLevel) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
  }

  onNavigate((path, topLevel) => updateActive(topLevel));
  updateActive(getCurrentPath());

  root.appendChild(nav);
  return nav;
}
