function getRoot() {
  return document.getElementById('overlay-root');
}

/**
 * Opens a centered modal. `content` may be an HTML string or a DOM node.
 * `actions`: [{ label, variant, onClick }]. Returns a close() function.
 */
export function openModal({ title, content, actions = [], dismissible = true }) {
  const root = getRoot();
  const overlay = document.createElement('div');
  overlay.className = 'overlay overlay--center';
  overlay.setAttribute('role', 'presentation');

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  if (title) modal.setAttribute('aria-label', title);

  const titleEl = title ? `<div class="modal__title">${title}</div>` : '';
  modal.innerHTML = `${titleEl}<div class="modal__body"></div><div class="modal__actions"></div>`;

  const body = modal.querySelector('.modal__body');
  if (typeof content === 'string') body.innerHTML = content;
  else if (content instanceof Node) body.appendChild(content);

  const actionsEl = modal.querySelector('.modal__actions');
  function close() {
    overlay.remove();
    document.removeEventListener('keydown', onKeydown);
  }
  function onKeydown(e) {
    if (e.key === 'Escape' && dismissible) close();
  }

  for (const action of actions) {
    const btn = document.createElement('button');
    btn.className = `btn btn--${action.variant || 'secondary'}`;
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      action.onClick?.();
      if (action.keepOpen !== true) close();
    });
    actionsEl.appendChild(btn);
  }

  overlay.appendChild(modal);
  if (dismissible) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }
  document.addEventListener('keydown', onKeydown);
  root.appendChild(overlay);

  return close;
}
