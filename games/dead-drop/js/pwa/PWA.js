export class PWA {
  constructor() {
    this.deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      document.getElementById('btn-install').hidden = false;
    });
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      document.getElementById('btn-install').hidden = true;
    });
  }

  register() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
        // offline/PWA support degrades gracefully if registration fails
      });
    });
  }

  async promptInstall() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    document.getElementById('btn-install').hidden = true;
  }

  isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }
}
