export function initModals() {
  let lastFocus = null;
  const openModal = (modal) => {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    const close = modal.querySelector("[data-modal-close]");
    if (close) close.focus();
  };
  const closeModal = (modal) => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocus) lastFocus.focus();
  };

  document.addEventListener("click", (event) => {
    const openButton = event.target.closest("[data-modal-open]");
    if (openButton) {
      const modal = document.getElementById(openButton.dataset.modalOpen);
      if (modal) openModal(modal);
    }
    if (event.target.matches("[data-modal-close]") || event.target.classList.contains("modal")) {
      const modal = event.target.closest(".modal");
      if (modal) closeModal(modal);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document.querySelectorAll(".modal:not([hidden])").forEach(closeModal);
  });
}
