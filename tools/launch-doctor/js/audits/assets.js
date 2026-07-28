import { SEVERITY, makeIssue, htmlFiles } from '../core/issue.js';
import { findLineForOuterHtml } from '../core/lineFinder.js';
import { resolveLocalPath, isHttpUrl } from '../core/pathUtils.js';

const DEFAULT_IMAGE_THRESHOLD = 500 * 1024;

function imageEntries(vfs) {
  return Array.from(vfs.values()).filter((f) => f.isImage);
}

function formatKb(bytes) {
  return `${Math.round(bytes / 1024)}KB`;
}

export function auditAssets(vfs, ctx) {
  const issues = [];
  const threshold = (ctx.config && ctx.config.imageSizeThreshold) || DEFAULT_IMAGE_THRESHOLD;
  const pages = htmlFiles(vfs);

  const hasFaviconLink = pages.some((f) => f.dom.querySelector('link[rel~="icon" i]'));
  const hasFaviconFile = vfs.has('favicon.ico');
  if (!hasFaviconLink && !hasFaviconFile) {
    issues.push(makeIssue({
      category: 'Assets', severity: SEVERITY.WARN, title: 'Missing favicon',
      file: null, line: null,
      message: 'No <link rel="icon"> tag was found on any page, and no favicon.ico exists at the site root.',
      fix: 'Add a favicon.ico at the site root or a <link rel="icon" href="..."> in <head>.',
    }));
  }

  for (const file of pages) {
    const ogImage = file.dom.querySelector('meta[property="og:image"]');
    const content = ogImage ? (ogImage.getAttribute('content') || '').trim() : '';
    if (content && !isHttpUrl(content)) {
      const local = resolveLocalPath(file.path, content);
      if (local && !vfs.has(local)) {
        issues.push(makeIssue({
          category: 'Assets', severity: SEVERITY.FAIL, title: 'Open Graph image file is missing',
          file: file.path, line: findLineForOuterHtml(file.text, ogImage.outerHTML),
          message: `og:image points to "${content}", which was not found among the uploaded files.`,
          fix: 'Upload the referenced image, or point og:image at an existing file.',
        }));
      }
    }

    file.dom.querySelectorAll('img').forEach((img) => {
      if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
        issues.push(makeIssue({
          category: 'Assets', severity: SEVERITY.INFO, title: 'Image missing width/height attributes',
          file: file.path, line: findLineForOuterHtml(file.text, img.outerHTML),
          message: `<img src="${img.getAttribute('src') || ''}"> has no explicit width/height, which can cause layout shift while it loads.`,
          fix: 'Add width and height attributes matching the image\'s intrinsic size.',
        }));
      }
    });

    const imgs = Array.from(file.dom.querySelectorAll('img'));
    imgs.slice(3).forEach((img) => {
      if (!img.hasAttribute('loading')) {
        issues.push(makeIssue({
          category: 'Assets', severity: SEVERITY.INFO, title: 'Consider loading="lazy" for below-the-fold image',
          file: file.path, line: findLineForOuterHtml(file.text, img.outerHTML),
          message: 'Heuristic: this is the 4th+ image on the page and likely below the fold.',
          fix: 'Add loading="lazy" if this image is not visible on initial page load.',
        }));
      }
    });
  }

  const referenced = new Set();
  const referenceHay = [];
  for (const file of vfs.values()) {
    if (file.text && (file.ext === '.html' || file.ext === '.htm' || file.ext === '.css')) {
      referenceHay.push(file.text);
    }
  }
  const haystack = referenceHay.join('\n');
  for (const img of imageEntries(vfs)) {
    if (img.size > threshold) {
      issues.push(makeIssue({
        category: 'Assets', severity: SEVERITY.WARN, title: 'Image file exceeds size threshold',
        file: img.path, line: null,
        message: `${img.path} is ${formatKb(img.size)}, above the ${formatKb(threshold)} threshold. Large images slow down page load.`,
        fix: 'Compress or resize the image, and consider a modern format like WebP/AVIF.',
      }));
    }
    if (haystack.includes(img.path) || haystack.includes(img.name)) {
      referenced.add(img.path);
    }
  }
  for (const img of imageEntries(vfs)) {
    if (!referenced.has(img.path) && img.size > 100 * 1024) {
      issues.push(makeIssue({
        category: 'Assets', severity: SEVERITY.INFO, title: 'Possibly unused large image',
        file: img.path, line: null,
        message: `${img.path} (${formatKb(img.size)}) was not found referenced in any HTML or CSS file scanned. This heuristic can miss dynamic references.`,
        fix: 'Remove it from the deploy if unused, or confirm it\'s referenced dynamically.',
      }));
    }
  }

  return issues;
}
