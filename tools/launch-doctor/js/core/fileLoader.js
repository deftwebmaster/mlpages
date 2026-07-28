import { normalizePath, extOf } from './pathUtils.js';

export const TEXT_EXTS = new Set(['.html', '.htm', '.css', '.js', '.mjs', '.cjs', '.json', '.xml', '.txt', '.svg', '.md', '.toml', '.yml', '.yaml']);
export const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico']);
export const HIDDEN_NAMES = new Set(['.ds_store', 'thumbs.db']);

const MAX_TEXT_BYTES = 3 * 1024 * 1024; // don't try to parse huge text blobs as source

function isHiddenPath(path) {
  const base = path.split('/').pop().toLowerCase();
  if (HIDDEN_NAMES.has(base)) return true;
  return base.startsWith('.') && base !== '.well-known';
}

function stripCommonRoot(paths) {
  if (paths.length < 2) return '';
  const first = paths[0].split('/');
  if (first.length < 2) return '';
  const candidate = first[0];
  const allShare = paths.every((p) => p === candidate || p.startsWith(candidate + '/'));
  return allShare ? candidate + '/' : '';
}

function makeEntry(path, size, arrayBuffer) {
  const ext = extOf(path);
  const isImage = IMAGE_EXTS.has(ext);
  const isText = TEXT_EXTS.has(ext) && size <= MAX_TEXT_BYTES;
  let text = null;
  if (isText && arrayBuffer) {
    try {
      text = new TextDecoder('utf-8').decode(arrayBuffer);
    } catch {
      text = null;
    }
  }
  return {
    path,
    name: path.split('/').pop(),
    ext,
    size,
    isImage,
    isBinary: !isText,
    isHidden: isHiddenPath(path),
    text,
    dom: null, // populated later for HTML files
  };
}

export async function loadFromZip(file) {
  const JSZip = window.JSZip;
  const zip = await JSZip.loadAsync(file);
  const entries = [];
  const names = [];
  zip.forEach((relPath, zipEntry) => {
    if (!zipEntry.dir) names.push(normalizePath(relPath));
  });
  const root = stripCommonRoot(names);
  const tasks = [];
  zip.forEach((relPath, zipEntry) => {
    if (zipEntry.dir) return;
    const path = normalizePath(relPath).slice(root.length);
    if (!path) return;
    tasks.push(
      zipEntry.async('arraybuffer').then((buf) => {
        entries.push(makeEntry(path, buf.byteLength, buf));
      })
    );
  });
  await Promise.all(tasks);
  return buildVfs(entries);
}

function stripWebkitRoot(files) {
  const paths = files.map((f) => normalizePath(f.webkitRelativePath || f.name));
  return stripCommonRoot(paths);
}

export async function loadFromFileList(fileList) {
  const files = Array.from(fileList);
  const root = stripWebkitRoot(files);
  const entries = await Promise.all(
    files.map(async (f) => {
      const relPath = normalizePath(f.webkitRelativePath || f.name).slice(root.length);
      const buf = await f.arrayBuffer();
      return makeEntry(relPath, f.size, buf);
    })
  );
  return buildVfs(entries);
}

function buildVfs(entries) {
  const files = new Map();
  for (const entry of entries) {
    if (!entry.path) continue;
    files.set(entry.path, entry);
  }
  // Parse HTML documents once, up front, and record source line offsets for common patterns.
  for (const entry of files.values()) {
    if (entry.ext === '.html' || entry.ext === '.htm') {
      if (entry.text != null) {
        entry.dom = new DOMParser().parseFromString(entry.text, 'text/html');
      }
    }
  }
  return files;
}
