function getRoot() {
  return document.getElementById('overlay-root');
}

/**
 * Opens a bottom sheet. `render(container, close)` is called with the body
 * container so callers can wire up their own interactive controls.
 */
export function openSheet({ title, render, dismissible = true }) {
  const root = getRoot();
  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  if (title) sheet.setAttribute('aria-label', title);

  sheet.innerHTML = `
    <div class="sheet__handle"></div>
    ${title ? `<div class="modal__title">${title}</div>` : ''}
    <div class="sheet__body"></div>
  `;

  function close() {
    overlay.remove();
    document.removeEventListener('keydown', onKeydown);
  }
  function onKeydown(e) {
    if (e.key === 'Escape' && dismissible) close();
  }

  const body = sheet.querySelector('.sheet__body');
  render?.(body, close);

  overlay.appendChild(sheet);
  if (dismissible) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }
  document.addEventListener('keydown', onKeydown);
  root.appendChild(overlay);

  return close;
}
