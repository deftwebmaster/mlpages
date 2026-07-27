// Minimal hash-based router. Each registered route's renderFn(container, ctx)
// may return a destroy() cleanup function, called automatically before the
// next navigation (used to unsubscribe store listeners / stop rAF loops).

const routes = new Map();
let container = null;
let currentDestroy = null;
let currentPath = null;
const navListeners = new Set();

export function registerRoute(path, renderFn) {
  routes.set(path, renderFn);
}

export function initRouter(containerEl, defaultPath = '/stand') {
  container = containerEl;
  window.addEventListener('hashchange', () => renderRoute());
  renderRoute(parseHash() || defaultPath);
}

export function navigate(path) {
  if (window.location.hash.slice(1) === path) {
    renderRoute(path);
  } else {
    window.location.hash = path;
  }
}

export function getCurrentPath() {
  return currentPath;
}

export function onNavigate(listener) {
  navListeners.add(listener);
  return () => navListeners.delete(listener);
}

function parseHash() {
  return window.location.hash.slice(1) || null;
}

function renderRoute(forcedPath) {
  const path = forcedPath || parseHash() || '/stand';
  const topLevel = `/${path.split('/')[1]}`;
  const renderFn = routes.get(path) || routes.get(topLevel);
  if (!renderFn) return;

  if (currentDestroy) {
    currentDestroy();
    currentDestroy = null;
  }
  container.innerHTML = '';
  currentPath = path;

  const result = renderFn(container, { navigate, path });
  if (typeof result === 'function') currentDestroy = result;

  const screenEl = container.firstElementChild;
  if (screenEl) screenEl.classList.add('screen-enter');

  for (const listener of navListeners) listener(path, topLevel);
}
