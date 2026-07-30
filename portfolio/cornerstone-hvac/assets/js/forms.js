export function initForms() {
  const params = new URLSearchParams(window.location.search);
  const requestedService = params.get("service");
  if (requestedService) {
    const service = document.querySelector('select[name="service"]');
    if (service) service.value = requestedService;
  }

  document.querySelectorAll("form[data-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      let valid = true;
      form.querySelectorAll(".field-error").forEach((error) => error.textContent = "");
      form.querySelectorAll("[required]").forEach((field) => {
        const wrapper = field.closest(".field") || field.closest(".checkbox");
        const error = wrapper ? wrapper.querySelector(".field-error") : null;
        const emptyCheckbox = field.type === "checkbox" && !field.checked;
        const emptyValue = field.type !== "checkbox" && !String(field.value || "").trim();
        const badEmail = field.type === "email" && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
        if (emptyCheckbox || emptyValue || badEmail) {
          valid = false;
          field.setAttribute("aria-invalid", "true");
          if (error) error.textContent = badEmail ? "Enter a valid email address." : "This field is required.";
        } else {
          field.removeAttribute("aria-invalid");
        }
      });
      const date = form.querySelector('input[type="date"]');
      if (date && date.value) {
        const selected = new Date(date.value + "T00:00:00");
        const day = selected.getDay();
        if (day === 0) {
          valid = false;
          date.setAttribute("aria-invalid", "true");
          const error = date.closest(".field").querySelector(".field-error");
          if (error) error.textContent = "Sunday appointments are emergency-only. Choose another date or call.";
        }
      }
      if (!valid) {
        const firstBad = form.querySelector("[aria-invalid='true']");
        if (firstBad) firstBad.focus();
        return;
      }
      const success = form.querySelector(".form-success");
      if (success) {
        success.hidden = false;
        success.focus();
      }
      form.reset();
    });
  });
}
