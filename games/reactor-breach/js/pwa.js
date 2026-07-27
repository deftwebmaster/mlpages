let deferredPrompt = null;

export function initPwa({ onInstallAvailable } = {}) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = new URL('service-worker.js', document.baseURI).href;
      navigator.serviceWorker.register(swUrl).catch((err) => {
        console.warn('[pwa] Service worker registration failed', err);
      });
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    onInstallAvailable?.(true);
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    onInstallAvailable?.(false);
  });
}

export async function promptInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return choice.outcome === 'accepted';
}

export function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}
