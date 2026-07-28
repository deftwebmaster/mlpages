// Path helpers for resolving relative links inside the in-memory virtual file system.

export function normalizePath(path) {
  return path.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
}

export function dirName(path) {
  const idx = path.lastIndexOf('/');
  return idx === -1 ? '' : path.slice(0, idx);
}

export function joinAndResolve(baseDir, relative) {
  const parts = baseDir ? baseDir.split('/') : [];
  const relParts = relative.split('/');
  for (const part of relParts) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  return parts.join('/');
}

// Splits a href into {path, hash, query}. Path is unresolved (still relative).
export function splitHref(href) {
  let path = href;
  let hash = '';
  let query = '';
  const hashIdx = path.indexOf('#');
  if (hashIdx !== -1) {
    hash = path.slice(hashIdx + 1);
    path = path.slice(0, hashIdx);
  }
  const qIdx = path.indexOf('?');
  if (qIdx !== -1) {
    query = path.slice(qIdx + 1);
    path = path.slice(0, qIdx);
  }
  return { path, hash, query };
}

export function isExternal(href) {
  if (!href) return false;
  return /^([a-z][a-z0-9+.-]*:)?\/\//i.test(href) || /^(mailto|tel|javascript|data):/i.test(href);
}

export function isHttpUrl(href) {
  return /^https?:\/\//i.test(href);
}

export function extOf(path) {
  const name = path.split('/').pop() || '';
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

// Resolves an href found inside `fromPath` against the virtual file system root.
// Returns null for hrefs that don't point at a local file (external, mailto, empty, hash-only).
export function resolveLocalPath(fromPath, href) {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed) return null;
  if (isExternal(trimmed)) return null;
  const { path } = splitHref(trimmed);
  if (!path) return null; // hash-only or query-only link
  if (path.startsWith('/')) {
    return normalizePath(path.slice(1));
  }
  const baseDir = dirName(fromPath);
  return joinAndResolve(baseDir, path);
}
