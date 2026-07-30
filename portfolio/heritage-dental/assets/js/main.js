(function () {
  document.documentElement.classList.add("js");

  function getFocusable(container) {
    return Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  function initMobileNavigation() {
    const toggle = document.querySelector("[data-nav-toggle]");
    const nav = document.querySelector("[data-site-nav]");
    if (!toggle || !nav) return;

    let lastFocus = null;

    function closeNav() {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      if (lastFocus) lastFocus.focus();
    }

    function openNav() {
      lastFocus = document.activeElement;
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close navigation");
      nav.classList.add("is-open");
      document.body.classList.add("nav-open");
      const focusable = getFocusable(nav);
      if (focusable.length) focusable[0].focus();
    }

    toggle.addEventListener("click", function () {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      isOpen ? closeNav() : openNav();
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeNav();
    });

    document.addEventListener("keydown", function (event) {
      if (toggle.getAttribute("aria-expanded") !== "true") return;

      if (event.key === "Escape") {
        closeNav();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = getFocusable(nav);
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

    function setState() {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    }

    setState();
    window.addEventListener("scroll", setState, { passive: true });
  }

  function initAccordions() {
    document.querySelectorAll("[data-accordion]").forEach(function (accordion) {
      accordion.querySelectorAll(".faq-question").forEach(function (button) {
        button.addEventListener("click", function () {
          const expanded = button.getAttribute("aria-expanded") === "true";
          button.setAttribute("aria-expanded", String(!expanded));
        });
      });
    });
  }

  function initAppointmentForm() {
    const form = document.querySelector("[data-appointment-form]");
    if (!form) return;

    const success = form.querySelector("[data-form-success]");
    const summary = form.querySelector("[data-error-summary]");

    function setError(field, message) {
      const error = form.querySelector("#" + field.id + "-error");
      field.setAttribute("aria-invalid", message ? "true" : "false");
      if (error) error.textContent = message || "";
    }

    function validateEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function validateField(field) {
      if (field.type === "checkbox" && field.required && !field.checked) {
        setError(field, "Please confirm the demonstration notice.");
        return false;
      }

      if (field.required && !field.value.trim()) {
        setError(field, "Please complete this field.");
        return false;
      }

      if (field.type === "email" && field.value && !validateEmail(field.value)) {
        setError(field, "Enter a valid email address.");
        return false;
      }

      setError(field, "");
      return true;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (success) success.classList.remove("is-visible");

      const fields = Array.from(form.querySelectorAll("[required]"));
      const valid = fields.map(validateField).every(Boolean);

      if (!valid) {
        if (summary) summary.classList.add("is-visible");
        const firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (summary) summary.classList.remove("is-visible");
      if (success) {
        success.classList.add("is-visible");
        success.focus();
      }
    });

    form.addEventListener("input", function (event) {
      if (event.target.matches("input, select, textarea")) validateField(event.target);
    });
  }

  function initScrollReveals() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  function initScrollToTop() {
    const button = document.querySelector("[data-scroll-top]");
    if (!button) return;

    function setVisibility() {
      button.classList.toggle("is-visible", window.scrollY > 700);
    }

    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    setVisibility();
    window.addEventListener("scroll", setVisibility, { passive: true });
  }

  function setCurrentNavigationState() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    const inServicesDirectory = window.location.pathname.includes("/services/");
    document.querySelectorAll(".nav-link, .side-nav a").forEach(function (link) {
      const href = link.getAttribute("href") || "";
      const target = href.split("/").pop() || "index.html";
      if (target === path || (inServicesDirectory && href.includes("services.html"))) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileNavigation();
    initHeaderScrollState();
    initAccordions();
    initAppointmentForm();
    initScrollReveals();
    initScrollToTop();
    setCurrentNavigationState();
  });
})();
