/**
 * Progressive Web App wiring.
 *
 * Every path is resolved relative to this module's own URL, so the app works
 * unchanged from a domain root or from a GitHub Pages project subdirectory.
 */

/** Directory that contains index.html (…/ or …/repo-name/). */
export const BASE = new URL('../', import.meta.url).pathname;

let deferredPrompt = null;

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return; // SW is unavailable on file://

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(new URL('../sw.js', import.meta.url), { scope: BASE })
      .then((reg) => {
        // Take the newest build as soon as it is ready.
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              sw.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(() => {
        /* offline support is optional */
      });

    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      location.reload();
    });
  });
}

export function setupInstall(onAvailable) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    onAvailable(true);
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    onAvailable(false);
  });
}

export async function promptInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice.catch(() => null);
  deferredPrompt = null;
  return choice?.outcome === 'accepted';
}

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
