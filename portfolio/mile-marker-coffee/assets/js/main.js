const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

function setHeaderState() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

function trapFocus(event, container) {
  if (event.key !== "Tab") return;
  const items = Array.from(container.querySelectorAll(focusableSelector)).filter(
    (item) => item.offsetParent !== null
  );
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function initNavigation() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (!toggle || !nav) return;

  const openNav = () => {
    toggle.setAttribute("aria-expanded", "true");
    nav.classList.add("is-open");
    document.body.classList.add("no-scroll");
    const firstLink = nav.querySelector("a");
    if (firstLink) firstLink.focus();
  };

  const closeNav = () => {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    isOpen ? closeNav() : openNav();
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeNav();
  });

  document.addEventListener("keydown", (event) => {
    if (!nav.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      closeNav();
      toggle.focus();
    }
    trapFocus(event, nav);
  });

  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 800px)").matches) closeNav();
  });
}

function initFilters() {
  const filterBar = document.querySelector("[data-filter-bar]");
  const products = Array.from(document.querySelectorAll("[data-roast]"));
  if (!filterBar || !products.length) return;

  filterBar.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    const filter = button.dataset.filter;
    filterBar.querySelectorAll("[data-filter]").forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
    products.forEach((product) => {
      const shouldShow = filter === "all" || product.dataset.roast === filter;
      product.classList.toggle("is-hidden", !shouldShow);
    });
  });
}

function initLightbox() {
  const lightbox = document.querySelector("[data-lightbox]");
  const openButton = document.querySelector("[data-lightbox-open]");
  const closeButton = document.querySelector("[data-lightbox-close]");
  if (!lightbox || !openButton || !closeButton) return;
  let previousFocus = null;

  const open = () => {
    previousFocus = document.activeElement;
    lightbox.classList.add("is-open");
    lightbox.removeAttribute("hidden");
    document.body.classList.add("no-scroll");
    closeButton.focus();
  };

  const close = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("hidden", "");
    document.body.classList.remove("no-scroll");
    if (previousFocus) previousFocus.focus();
  };

  openButton.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });
  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") close();
    trapFocus(event, lightbox);
  });
}

function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;
  const status = form.querySelector("[data-form-status]");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    let isValid = true;
    form.querySelectorAll("[required]").forEach((field) => {
      const error = form.querySelector(`[data-error-for="${field.id}"]`);
      if (!field.value.trim()) {
        isValid = false;
        field.setAttribute("aria-invalid", "true");
        if (error) error.textContent = "This field is required.";
      } else if (field.type === "email" && !field.validity.valid) {
        isValid = false;
        field.setAttribute("aria-invalid", "true");
        if (error) error.textContent = "Enter a valid email address.";
      } else {
        field.removeAttribute("aria-invalid");
        if (error) error.textContent = "";
      }
    });

    if (!isValid) {
      status.textContent = "Please complete the highlighted fields.";
      return;
    }

    form.reset();
    status.textContent = "Demo message drafted. This portfolio form does not contact a real business.";
  });
}

function initReveals() {
  const revealItems = document.querySelectorAll(".reveal");
  if (!revealItems.length || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

document.addEventListener("DOMContentLoaded", () => {
  setHeaderState();
  initNavigation();
  initFilters();
  initLightbox();
  initContactForm();
  initReveals();
});

window.addEventListener("scroll", setHeaderState, { passive: true });
