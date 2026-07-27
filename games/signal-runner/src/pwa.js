/**
 * pwa.js — Service worker registration, install prompt and update handling.
 *
 * Everything here resolves URLs against `document.baseURI` rather than the
 * site root. That is the whole trick to running unmodified from
 * https://user.github.io/signal-runner/ — a leading slash anywhere would
 * silently point at the user's root Pages site instead.
 */

export function registerServiceWorker(onUpdateReady) {
  if (!('serviceWorker' in navigator)) return;
  // file:// has no service worker support and throws noisily if you try.
  if (location.protocol === 'file:') return;

  window.addEventListener('load', async () => {
    try {
      const swUrl = new URL('sw.js', document.baseURI);
      const scope = new URL('./', document.baseURI);
      const registration = await navigator.serviceWorker.register(swUrl, { scope });

      // A worker already waiting means this tab is running old code.
      if (registration.waiting && navigator.serviceWorker.controller) {
        onUpdateReady(() => activate(registration));
      }

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            onUpdateReady(() => activate(registration));
          }
        });
      });

      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return;
        reloading = true;
        location.reload();
      });
    } catch {
      // An unregistered worker only costs offline support; the game still runs.
    }
  });
}

function activate(registration) {
  const worker = registration.waiting || registration.installing;
  if (worker) worker.postMessage({ type: 'SKIP_WAITING' });
}

/**
 * Install prompt. Chromium fires `beforeinstallprompt`; other browsers never
 * do, so the button simply stays hidden rather than lying about being able to
 * install.
 */
export function setupInstallPrompt(ui) {
  let deferred = null;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event;
    ui.showInstallButton(async () => {
      if (!deferred) return;
      deferred.prompt();
      try {
        await deferred.userChoice;
      } finally {
        deferred = null;
        ui.hideInstallButton();
      }
    });
  });

  window.addEventListener('appinstalled', () => {
    deferred = null;
    ui.hideInstallButton();
  });
}

