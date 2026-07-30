export function initAccordions() {
  document.querySelectorAll("[data-accordion]").forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button[aria-controls]");
      if (!button) return;
      const panel = document.getElementById(button.getAttribute("aria-controls"));
      if (!panel) return;
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      panel.hidden = expanded;
    });
  });
}
