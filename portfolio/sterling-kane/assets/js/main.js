"use strict";

function initMobileNavigation() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const drawer = document.querySelector("[data-mobile-menu]");
  const close = document.querySelector("[data-menu-close]");
  if (!toggle || !drawer || !close) return;

  const focusableSelector = "a[href], button:not([disabled]), textarea, input, select";
  let lastFocused = null;

  function setOpen(isOpen) {
    toggle.setAttribute("aria-expanded", String(isOpen));
    drawer.setAttribute("aria-hidden", String(!isOpen));
    document.body.classList.toggle("nav-open", isOpen);
    if (isOpen) {
      lastFocused = document.activeElement;
      close.focus();
    } else if (lastFocused) {
      lastFocused.focus();
    }
  }

  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  close.addEventListener("click", () => setOpen(false));

  drawer.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") setOpen(false);
    if (event.key !== "Tab" || toggle.getAttribute("aria-expanded") !== "true") return;

    const focusable = Array.from(drawer.querySelectorAll(focusableSelector));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function initHeaderScrollState() {
  const header = document.querySelector("[data-site-header]");
  if (!header) return;

  const update = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 20);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}

function initInsightFilters() {
  const filterGroup = document.querySelector("[data-insight-filters]");
  const cards = Array.from(document.querySelectorAll("[data-insight-card]"));
  if (!filterGroup || !cards.length) return;

  filterGroup.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;

    const filter = button.getAttribute("data-filter");
    filterGroup.querySelectorAll("button[data-filter]").forEach((control) => {
      control.setAttribute("aria-pressed", String(control === button));
    });

    cards.forEach((card) => {
      const matches = filter === "all" || card.getAttribute("data-category") === filter;
      card.hidden = !matches;
    });
  });
}

function initInsightSummaries() {
  const dialog = document.querySelector("[data-insight-dialog]");
  if (!(dialog instanceof HTMLDialogElement)) return;

  const title = dialog.querySelector("[data-dialog-title]");
  const body = dialog.querySelector("[data-dialog-body]");
  const category = dialog.querySelector("[data-dialog-category]");
  const close = dialog.querySelector("[data-dialog-close]");

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-summary-trigger]");
    if (!button || !title || !body || !category) return;
    title.textContent = button.getAttribute("data-title") || "";
    body.textContent = button.getAttribute("data-summary") || "";
    category.textContent = button.getAttribute("data-category-label") || "Concept insight";
    dialog.showModal();
  });

  close?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function initAccordions() {
  document.querySelectorAll("[data-accordion]").forEach((group) => {
    group.querySelectorAll("summary").forEach((summary) => {
      summary.addEventListener("click", () => {
        group.querySelectorAll("details[open]").forEach((detail) => {
          if (detail !== summary.parentElement) detail.removeAttribute("open");
        });
      });
    });
  });
}

function initContactFormDemo() {
  const form = document.querySelector("[data-contact-form]");
  if (!(form instanceof HTMLFormElement)) return;
  const response = document.querySelector("[data-form-response]");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (response) {
      response.removeAttribute("hidden");
      response.textContent = "Portfolio demonstration complete. No information was transmitted or stored.";
      response.focus();
    }
    form.reset();
  });
}

function initScrollReveals() {
  const elements = document.querySelectorAll("[data-reveal]");
  if (!elements.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach((element) => observer.observe(element));
}

function initScrollToTop() {
  const control = document.querySelector("[data-scroll-top]");
  if (!control) return;

  const update = () => control.classList.toggle("is-visible", window.scrollY > 700);
  update();
  window.addEventListener("scroll", update, { passive: true });
  control.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function setCurrentNavigationState() {
  const current = document.body.getAttribute("data-page");
  if (!current) return;
  document.querySelectorAll("[data-nav-key]").forEach((link) => {
    if (link.getAttribute("data-nav-key") === current) link.setAttribute("aria-current", "page");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileNavigation();
  initHeaderScrollState();
  initInsightFilters();
  initInsightSummaries();
  initAccordions();
  initContactFormDemo();
  initScrollReveals();
  initScrollToTop();
  setCurrentNavigationState();
});
