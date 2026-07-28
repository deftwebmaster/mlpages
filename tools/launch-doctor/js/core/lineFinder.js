// Best-effort line lookup: finds the 1-indexed line of the first regex match in raw source text.
// Returns null when there's no match, since not every issue can be pinned to a line.

export function findLine(text, pattern) {
  if (!text) return null;
  const re = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  const match = re.exec(text);
  if (!match) return null;
  return text.slice(0, match.index).split('\n').length;
}

export function findLineForOuterHtml(text, outerHtml) {
  if (!text || !outerHtml) return null;
  // Match on a distinctive prefix of the element since whitespace/attribute order can differ
  // from the serialized DOM output.
  const snippet = outerHtml.slice(0, Math.min(40, outerHtml.length)).split('>')[0];
  if (!snippet) return null;
  const idx = text.indexOf(snippet);
  if (idx === -1) return null;
  return text.slice(0, idx).split('\n').length;
}
