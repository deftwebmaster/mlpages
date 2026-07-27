import { openModal } from './modal.js';

/** Returns a Promise<boolean> resolved true if the user confirms. */
export function confirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    let resolved = false;
    const close = openModal({
      title,
      content: `<p>${message}</p>`,
      dismissible: true,
      actions: [
        {
          label: cancelLabel,
          variant: 'secondary',
          onClick: () => { resolved = true; resolve(false); },
        },
        {
          label: confirmLabel,
          variant: danger ? 'danger' : 'primary',
          onClick: () => { resolved = true; resolve(true); },
        },
      ],
    });
    // If dismissed via backdrop/escape without a button click, treat as cancel.
    const originalClose = close;
    setTimeout(() => {
      const observer = new MutationObserver(() => {
        if (!document.body.contains(document.querySelector('.modal')) && !resolved) {
          resolved = true;
          resolve(false);
          observer.disconnect();
        }
      });
      observer.observe(document.getElementById('overlay-root'), { childList: true });
    }, 0);
  });
}
