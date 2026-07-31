/**
 * Text fitting for generated SVG diagrams. SVG has no layout pass we can query
 * before the node is in the document, so labels are measured with a character
 * width table — approximate, but enough to break on a word instead of slicing
 * mid-syllable.
 */

/** Approximate rendered width of `value` in the diagram's sans stack. */
export function textWidth(value, fontSize) {
  let units = 0;
  for (const char of String(value)) {
    if (/[iIljt.,:;'!|]/.test(char)) units += 0.32;
    else if (/[A-Z@%&]/.test(char)) units += 0.68;
    else if (/[mwMW]/.test(char)) units += 0.85;
    else units += 0.54;
  }
  return units * fontSize;
}

/**
 * Truncate to `maxWidth`, preferring a word boundary and appending an ellipsis.
 * Returns the input untouched when it already fits.
 */
export function fitText(value, maxWidth, fontSize) {
  const text = String(value ?? "").trim();
  if (!text || textWidth(text, fontSize) <= maxWidth) return text;
  const budget = maxWidth - textWidth("…", fontSize);
  let out = "";
  for (const word of text.split(/\s+/)) {
    const candidate = out ? `${out} ${word}` : word;
    if (textWidth(candidate, fontSize) > budget) break;
    out = candidate;
  }
  if (!out) {
    // A single over-long word: fall back to a character cut.
    out = text;
    while (out && textWidth(out, fontSize) > budget) out = out.slice(0, -1);
  }
  return `${out.replace(/[,;:]$/, "")}…`;
}
