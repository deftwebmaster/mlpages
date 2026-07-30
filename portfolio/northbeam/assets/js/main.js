function initMobileNavigation() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  const closeButton = document.querySelector("[data-menu-close]");
  const header = document.querySelector("[data-header]");

  if (!toggle || !nav || !closeButton || !header) return;

  const focusableSelector = "a[href], button:not([disabled])";
  let previousFocus = null;

  function closeNavigation() {
    nav.classList.remove("is-open");
    header.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
    if (previousFocus) previousFocus.focus();
  }

  function openNavigation() {
    previousFocus = document.activeElement;
    nav.classList.add("is-open");
    header.classList.add("is-open");
    document.body.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation");
    const firstFocusable = nav.querySelector(focusableSelector);
    if (firstFocusable) firstFocusable.focus();
  }

  toggle.addEventListener("click", () => {
    if (nav.classList.contains("is-open")) {
      closeNavigation();
    } else {
      openNavigation();
    }
  });

  closeButton.addEventListener("click", closeNavigation);

  nav.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (link) closeNavigation();
  });

  document.addEventListener("keydown", (event) => {
    if (!nav.classList.contains("is-open")) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeNavigation();
    }

    if (event.key === "Tab") {
      const focusable = Array.from(nav.querySelectorAll(focusableSelector));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}

function initHeaderScrollState() {
  const header = document.querySelector("[data-header]");
  if (!header) return;

  function updateHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

function initAnchorNavigation() {
  const links = Array.from(document.querySelectorAll('.site-nav a[href^="#"]:not(.nav-cta)'));
  const anchorLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
  const header = document.querySelector("[data-header]");
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let pendingSectionId = null;
  let pendingTimer = null;

  if (!links.length || !sections.length) return;

  function setCurrent(sectionId) {
    links.forEach((link) => {
      const isCurrent = link.getAttribute("href") === `#${sectionId}`;
      if (isCurrent) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function updateCurrentSection() {
    if (pendingSectionId) {
      setCurrent(pendingSectionId);
      return;
    }

    const headerHeight = header ? header.offsetHeight : 0;
    const marker = window.scrollY + headerHeight + Math.min(window.innerHeight * 0.3, 220);
    let current = sections[0];

    sections.forEach((section) => {
      if (section.offsetTop <= marker) {
        current = section;
      }
    });

    if (current) setCurrent(current.id);
  }

  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();

      const id = href.slice(1);
      const headerHeight = header ? header.offsetHeight : 0;
      const top = id === "top" ? 0 : target.getBoundingClientRect().top + window.scrollY - headerHeight + 1;

      pendingSectionId = sections.some((section) => section.id === id) ? id : pendingSectionId;
      if (pendingSectionId) setCurrent(pendingSectionId);

      window.clearTimeout(pendingTimer);
      pendingTimer = window.setTimeout(() => {
        pendingSectionId = null;
        updateCurrentSection();
      }, 950);

      window.history.pushState(null, "", href);
      window.scrollTo({
        top,
        behavior: reducedMotion.matches ? "auto" : "smooth"
      });
    });
  });

  updateCurrentSection();
  window.addEventListener("scroll", updateCurrentSection, { passive: true });
  window.addEventListener("resize", updateCurrentSection);
}

function initProductDialogs() {
  const triggers = document.querySelectorAll("[data-dialog-target]");
  const closeButtons = document.querySelectorAll("[data-dialog-close]");
  const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
  let activeTrigger = null;

  function trapFocus(event, dialog) {
    if (event.key !== "Tab") return;

    const focusable = Array.from(dialog.querySelectorAll(focusableSelector));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function closeDialog(dialog) {
    dialog.close();
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const dialog = document.getElementById(trigger.dataset.dialogTarget);
      if (!dialog || typeof dialog.showModal !== "function") return;

      activeTrigger = trigger;
      document.body.classList.add("dialog-open");
      dialog.showModal();
      dialog.scrollTop = 0;
      const content = dialog.querySelector(".dialog-content");
      if (content) content.scrollTop = 0;
      const closeButton = dialog.querySelector("[data-dialog-close]");
      if (closeButton) closeButton.focus();
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const dialog = button.closest("dialog");
      if (dialog) closeDialog(dialog);
    });
  });

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("keydown", (event) => trapFocus(event, dialog));
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
      if (activeTrigger) activeTrigger.focus();
    });
  });
}

function initDemoCartActions() {
  const toast = document.querySelector("[data-toast]");
  const buttons = document.querySelectorAll("[data-demo-cart]");
  let toastTimer = null;

  if (!toast || !buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      toast.textContent = "Demo interaction complete. No product was added and no purchase was created.";
      toast.classList.add("is-visible");
      clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast.classList.remove("is-visible");
      }, 4200);
    });
  });
}

function initComparisonHighlighting() {
  const controls = document.querySelectorAll("[data-compare]");
  const cells = document.querySelectorAll("[data-column]");

  if (!controls.length || !cells.length) return;

  controls.forEach((control) => {
    control.addEventListener("click", () => {
      const column = control.dataset.compare;
      const active = control.classList.contains("is-active");

      controls.forEach((button) => button.classList.remove("is-active"));
      cells.forEach((cell) => cell.classList.remove("is-highlighted"));

      if (!active) {
        control.classList.add("is-active");
        document.querySelectorAll(`[data-column="${column}"]`).forEach((cell) => {
          cell.classList.add("is-highlighted");
        });
      }
    });
  });
}

function initScrollReveals() {
  const elements = document.querySelectorAll(".reveal");

  if (!elements.length || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
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
    { threshold: 0.14 }
  );

  elements.forEach((element) => observer.observe(element));
}

function initScrollToTop() {
  const button = document.querySelector("[data-scroll-top]");
  if (!button) return;

  function updateVisibility() {
    button.classList.toggle("is-visible", window.scrollY > 700);
  }

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  updateVisibility();
  window.addEventListener("scroll", updateVisibility, { passive: true });
}

initMobileNavigation();
initHeaderScrollState();
initAnchorNavigation();
initProductDialogs();
initDemoCartActions();
initComparisonHighlighting();
initScrollReveals();
initScrollToTop();
