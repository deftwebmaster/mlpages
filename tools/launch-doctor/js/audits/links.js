import { SEVERITY, makeIssue, htmlFiles } from '../core/issue.js';
import { findLineForOuterHtml } from '../core/lineFinder.js';
import { resolveLocalPath, isHttpUrl, splitHref } from '../core/pathUtils.js';

const PLACEHOLDER_HOSTS = /(^|\/\/)(www\.)?(example\.(com|org|net)|localhost|127\.0\.0\.1)([:/]|$)/i;

function findVfsEntry(vfs, path) {
  if (vfs.has(path)) return vfs.get(path);
  // Try treating it as a directory index.
  if (vfs.has(`${path}/index.html`)) return vfs.get(`${path}/index.html`);
  if (path === '' && vfs.has('index.html')) return vfs.get('index.html');
  return null;
}

function findCaseInsensitive(vfs, path) {
  const lower = path.toLowerCase();
  for (const key of vfs.keys()) {
    if (key.toLowerCase() === lower) return key;
  }
  return null;
}

function checkLocalTarget(vfs, file, href, attrLabel, text, elOuterHtml) {
  const local = resolveLocalPath(file.path, href);
  if (local === null) return null;
  const { hash } = splitHref(href);
  const target = findVfsEntry(vfs, local);
  if (!target) {
    const caseMatch = findCaseInsensitive(vfs, local);
    if (caseMatch) {
      return makeIssue({
        category: 'Links', severity: SEVERITY.FAIL, title: 'Link path differs only by case',
        file: file.path, line: findLineForOuterHtml(text, elOuterHtml),
        message: `${attrLabel}="${href}" resolves to "${local}", but the actual file is "${caseMatch}". Case-sensitive hosts (most static hosts) will 404 this.`,
        fix: `Fix the path casing to match "${caseMatch}" exactly.`,
      });
    }
    return makeIssue({
      category: 'Links', severity: SEVERITY.FAIL, title: 'Broken internal link',
      file: file.path, line: findLineForOuterHtml(text, elOuterHtml),
      message: `${attrLabel}="${href}" points to "${local}", which was not found in the uploaded files.`,
      fix: 'Fix the path, or add the missing file.',
    });
  }
  if (hash && target.dom) {
    const idExists = target.dom.getElementById(hash) || target.dom.querySelector(`a[name="${CSS.escape(hash)}"]`);
    if (!idExists) {
      return makeIssue({
        category: 'Links', severity: SEVERITY.WARN, title: 'Broken anchor link',
        file: file.path, line: findLineForOuterHtml(text, elOuterHtml),
        message: `${attrLabel}="${href}" links to an element with id="${hash}" in "${target.path}", but no such id exists there.`,
        fix: `Add id="${hash}" to the intended target element, or fix the anchor.`,
      });
    }
  }
  return null;
}

function auditPage(vfs, file, ctx) {
  const issues = [];
  const doc = file.dom;
  const text = file.text;
  const prodIsHttps = ctx.productionUrl ? ctx.productionUrl.startsWith('https://') : true;

  doc.querySelectorAll('a').forEach((a) => {
    if (!a.hasAttribute('href')) {
      issues.push(makeIssue({
        category: 'Links', severity: SEVERITY.WARN, title: 'Anchor with no href',
        file: file.path, line: findLineForOuterHtml(text, a.outerHTML),
        message: '<a> without an href is not a real link and is skipped by keyboard navigation.',
        fix: 'Add a real href, or use a <button> if this is a script-driven action.',
      }));
      return;
    }
    const href = a.getAttribute('href').trim();
    if (href === '' ) {
      issues.push(makeIssue({
        category: 'Links', severity: SEVERITY.WARN, title: 'Empty link href',
        file: file.path, line: findLineForOuterHtml(text, a.outerHTML),
        message: 'An empty href reloads the current page when clicked.',
        fix: 'Point the link at a real destination.',
      }));
      return;
    }
    if (PLACEHOLDER_HOSTS.test(href)) {
      issues.push(makeIssue({
        category: 'Links', severity: SEVERITY.FAIL, title: 'Link points to a placeholder host',
        file: file.path, line: findLineForOuterHtml(text, a.outerHTML),
        message: `href="${href}" still points at example.com/localhost/127.0.0.1.`,
        fix: 'Replace with the real production URL.',
      }));
      return;
    }
    if (isHttpUrl(href) && !href.startsWith('https://') && prodIsHttps) {
      issues.push(makeIssue({
        category: 'Links', severity: SEVERITY.WARN, title: 'Mixed content: plain http:// link on an https site',
        file: file.path, line: findLineForOuterHtml(text, a.outerHTML),
        message: `href="${href}" uses http:// while the production site is https.`,
        fix: 'Use https:// (or a protocol-relative/relative URL) instead.',
      }));
    }
    const issue = checkLocalTarget(vfs, file, href, 'href', text, a.outerHTML);
    if (issue) {
      if (a.hasAttribute('download') && issue.title === 'Broken internal link') {
        issue.title = 'Download link points to a missing file';
        issue.message = `download href="${href}" was not found among the uploaded files.`;
      }
      issues.push(issue);
    }
  });

  return issues;
}

export function auditLinks(vfs, ctx) {
  const issues = [];
  for (const file of htmlFiles(vfs)) {
    issues.push(...auditPage(vfs, file, ctx));
  }
  return issues;
}
