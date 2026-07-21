export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

export function titleCase(value) {
  return String(value).replace(/\b\w/g, char => char.toUpperCase());
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}
