export function initReviewFilters() {
  document.querySelectorAll("[data-review-filters]").forEach((filters) => {
    const list = document.querySelector("[data-review-list]");
    const empty = document.querySelector("[data-review-empty]");
    if (!list) return;
    filters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-filter]");
      if (!button) return;
      filters.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      const value = button.dataset.filter;
      let shown = 0;
      list.querySelectorAll("[data-review-category]").forEach((card) => {
        const match = value === "All" || card.dataset.reviewCategory === value;
        card.hidden = !match;
        if (match) shown += 1;
      });
      if (empty) empty.hidden = shown !== 0;
    });
  });
}
