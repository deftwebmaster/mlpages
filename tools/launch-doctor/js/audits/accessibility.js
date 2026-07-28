import { SEVERITY, makeIssue, htmlFiles } from '../core/issue.js';
import { findLineForOuterHtml } from '../core/lineFinder.js';

function hasAccessibleText(el) {
  const text = (el.textContent || '').trim();
  if (text) return true;
  if ((el.getAttribute('aria-label') || '').trim()) return true;
  if ((el.getAttribute('aria-labelledby') || '').trim()) return true;
  if ((el.getAttribute('title') || '').trim()) return true;
  const img = el.querySelector('img[alt]');
  if (img && (img.getAttribute('alt') || '').trim()) return true;
  return false;
}

function auditPage(file) {
  const issues = [];
  const doc = file.dom;
  const text = file.text;

  doc.querySelectorAll('img').forEach((img) => {
    if (!img.hasAttribute('alt')) {
      issues.push(makeIssue({
        category: 'Accessibility', severity: SEVERITY.FAIL, title: 'Image missing alt attribute',
        file: file.path, line: findLineForOuterHtml(text, img.outerHTML),
        message: `<img src="${img.getAttribute('src') || ''}"> has no alt attribute, so screen readers can't describe it.`,
        fix: 'Add alt="" for decorative images, or a short descriptive alt text otherwise.',
      }));
    }
  });

  doc.querySelectorAll('input, textarea, select').forEach((input) => {
    const type = (input.getAttribute('type') || '').toLowerCase();
    if (['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) return;
    const id = input.getAttribute('id');
    const hasLabelFor = id && doc.querySelector(`label[for="${CSS.escape(id)}"]`);
    const wrappedInLabel = input.closest('label');
    const ariaLabel = (input.getAttribute('aria-label') || '').trim();
    const ariaLabelledby = (input.getAttribute('aria-labelledby') || '').trim();
    if (!hasLabelFor && !wrappedInLabel && !ariaLabel && !ariaLabelledby) {
      issues.push(makeIssue({
        category: 'Accessibility', severity: SEVERITY.WARN, title: 'Form input has no label',
        file: file.path, line: findLineForOuterHtml(text, input.outerHTML),
        message: `<${input.tagName.toLowerCase()}${id ? ` id="${id}"` : ''}> has no associated <label>, aria-label, or aria-labelledby.`,
        fix: 'Add a <label for="..."> pointing at the input\'s id, or an aria-label attribute.',
      }));
    }
  });

  doc.querySelectorAll('button, a').forEach((el) => {
    if (el.tagName === 'A' && !el.hasAttribute('href')) return;
    if (!hasAccessibleText(el)) {
      issues.push(makeIssue({
        category: 'Accessibility', severity: SEVERITY.FAIL, title: `${el.tagName === 'A' ? 'Link' : 'Button'} has no accessible text`,
        file: file.path, line: findLineForOuterHtml(text, el.outerHTML),
        message: 'Screen readers and voice control need visible or labeled text to announce this control.',
        fix: 'Add visible text, an aria-label, or an <img alt="..."> inside the element.',
      }));
    }
  });

  const seenIds = new Map();
  doc.querySelectorAll('[id]').forEach((el) => {
    const id = el.getAttribute('id');
    seenIds.set(id, (seenIds.get(id) || 0) + 1);
  });
  for (const [id, count] of seenIds) {
    if (count > 1) {
      issues.push(makeIssue({
        category: 'Accessibility', severity: SEVERITY.FAIL, title: 'Duplicate id attribute',
        file: file.path, line: null,
        message: `id="${id}" appears ${count} times. Duplicate ids break in-page anchors, labels, and ARIA references.`,
        fix: 'Make each id attribute unique within the page.',
      }));
    }
  }

  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let lastLevel = 0;
  for (const h of headings) {
    const level = Number(h.tagName[1]);
    if (lastLevel && level > lastLevel + 1) {
      issues.push(makeIssue({
        category: 'Accessibility', severity: SEVERITY.WARN, title: 'Heading level skipped',
        file: file.path, line: findLineForOuterHtml(text, h.outerHTML),
        message: `<h${level}> follows an <h${lastLevel}>, skipping level(s) in between. This confuses screen-reader page navigation.`,
        fix: `Use <h${lastLevel + 1}> here, or restructure the heading hierarchy.`,
      }));
    }
    lastLevel = level;
  }

  const viewport = doc.querySelector('meta[name="viewport" i]');
  if (!viewport) {
    issues.push(makeIssue({
      category: 'Accessibility', severity: SEVERITY.WARN, title: 'Missing viewport meta tag',
      file: file.path, line: null,
      message: 'Without a viewport meta tag, mobile browsers render at desktop width and users must pinch-zoom.',
      fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
    }));
  }

  doc.querySelectorAll('a[href="#"]').forEach((a) => {
    if (!a.hasAttribute('onclick')) {
      issues.push(makeIssue({
        category: 'Accessibility', severity: SEVERITY.WARN, title: 'Link points to href="#" with no visible behavior',
        file: file.path, line: findLineForOuterHtml(text, a.outerHTML),
        message: 'href="#" with no click handler acts as a dead link and jumps to the top of the page for keyboard/screen-reader users.',
        fix: 'Point to a real destination, use a <button> for JS-only actions, or wire up a click handler.',
      }));
    }
  });

  return issues;
}

export function auditAccessibility(vfs) {
  const issues = [];
  for (const file of htmlFiles(vfs)) {
    const doc = file.dom;
    const html = doc.documentElement;
    if (!html.getAttribute('lang')) {
      issues.push(makeIssue({
        category: 'Accessibility', severity: SEVERITY.FAIL, title: 'Missing lang attribute on <html>',
        file: file.path, line: 1,
        message: 'Screen readers use the lang attribute to choose pronunciation rules and voice.',
        fix: 'Add lang="en" (or the appropriate language code) to the <html> element.',
      }));
    }
    issues.push(...auditPage(file));
  }
  return issues;
}
