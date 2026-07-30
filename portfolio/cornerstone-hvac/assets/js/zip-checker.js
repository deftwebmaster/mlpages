const primary = new Set(["75024", "75025", "75093", "75034", "75035", "75013", "75070", "75071", "75080", "75081", "75082", "75010", "75056", "75078", "75248", "75252"]);
const nearby = new Set(["75023", "75074", "75075", "75036", "75068", "75069", "75287", "75006"]);

export function initZipChecker() {
  document.querySelectorAll("[data-zip-checker]").forEach((checker) => {
    const input = checker.querySelector("input");
    const button = checker.querySelector("[data-zip-submit]");
    const result = checker.querySelector("[data-zip-result]");
    if (!input || !button || !result) return;
    const run = () => {
      const value = input.value.trim();
      if (!/^\d{5}$/.test(value)) {
        result.dataset.state = "error";
        result.innerHTML = "<p>Enter a five-digit ZIP code.</p>";
      } else if (primary.has(value)) {
        result.dataset.state = "good";
        result.innerHTML = "<p>You're in our primary service area.</p>";
      } else if (nearby.has(value)) {
        result.dataset.state = "near";
        result.innerHTML = "<p>You're near our service area. Call to confirm availability.</p>";
      } else {
        result.dataset.state = "outside";
        result.innerHTML = "<p>This ZIP code is currently outside our listed service area.</p>";
      }
    };
    button.addEventListener("click", run);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") run();
    });
  });
}
