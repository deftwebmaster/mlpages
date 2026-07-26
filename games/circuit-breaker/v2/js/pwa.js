/**
 * PWA wiring: service-worker registration, update handling, install prompt.
 *
 * Every URL here is relative to the document, so the app works unchanged from a
 * GitHub Pages subdirectory (…/circuit-breaker/) as well as from a root domain.
 */

let deferredPrompt = null;

export function initPWA({ onInstallAvailable, onUpdateReady } = {}) {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    onInstallAvailable?.(true);
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    onInstallAvailable?.(false);
  });

  if (!('serviceWorker' in navigator)) return { promptInstall, isInstallAvailable };

  // file:// has no service-worker support; skip silently so local file testing works.
  if (location.protocol === 'file:') return { promptInstall, isInstallAvailable };

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');

      const notifyIfWaiting = () => {
        if (reg.waiting && navigator.serviceWorker.controller) {
          onUpdateReady?.(() => applyUpdate(reg));
        }
      };

      notifyIfWaiting();
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed') notifyIfWaiting();
        });
      });

      // Check for a newer build whenever the player comes back to the app, so a
      // cached build is never permanently sticky.
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) reg.update().catch(() => {});
      });
    } catch {
      /* Offline support is a bonus, never a requirement. */
    }
  });

  return { promptInstall, isInstallAvailable };
}

function applyUpdate(reg) {
  if (!reg.waiting) {
    location.reload();
    return;
  }
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    location.reload();
  });
  reg.waiting.postMessage({ type: 'SKIP_WAITING' });
}

export function isInstallAvailable() {
  return !!deferredPrompt;
}

export async function promptInstall() {
  if (!deferredPrompt) return false;
  const prompt = deferredPrompt;
  deferredPrompt = null;
  prompt.prompt();
  try {
    const { outcome } = await prompt.userChoice;
    return outcome === 'accepted';
  } catch {
    return false;
  }
}
