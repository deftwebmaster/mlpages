import { SEVERITY, makeIssue, htmlFiles } from '../core/issue.js';
import { findLine } from '../core/lineFinder.js';
import { resolveLocalPath } from '../core/pathUtils.js';

function auditPage(file) {
  const issues = [];
  const doc = file.dom;
  const text = file.text;

  const title = doc.querySelector('title');
  const titleText = title ? title.textContent.trim() : '';
  if (!title || !titleText) {
    issues.push(makeIssue({
      category: 'SEO', severity: SEVERITY.FAIL, title: 'Missing or empty <title>',
      file: file.path, line: findLine(text, /<title/i),
      message: 'Search results and browser tabs need a page title.',
      fix: 'Add <title>Your Page Title</title> inside <head>.',
    }));
  } else if (titleText.length < 10 || titleText.length > 60) {
    issues.push(makeIssue({
      category: 'SEO', severity: SEVERITY.WARN, title: 'Title length is not ideal',
      file: file.path, line: findLine(text, /<title/i),
      message: `Title is ${titleText.length} characters; aim for 10-60 so it isn't truncated in search results.`,
      fix: 'Rewrite the <title> to be concise but descriptive (roughly 10-60 characters).',
    }));
  }

  const desc = doc.querySelector('meta[name="description" i]');
  const descContent = desc ? (desc.getAttribute('content') || '').trim() : '';
  if (!desc || !descContent) {
    issues.push(makeIssue({
      category: 'SEO', severity: SEVERITY.FAIL, title: 'Missing meta description',
      file: file.path, line: findLine(text, /<head/i),
      message: 'Search and social previews need a concise description.',
      fix: 'Add <meta name="description" content="..."> inside <head>.',
    }));
  } else if (descContent.length < 50 || descContent.length > 160) {
    issues.push(makeIssue({
      category: 'SEO', severity: SEVERITY.WARN, title: 'Meta description length is not ideal',
      file: file.path, line: findLine(text, /<meta[^>]+name=["']description["']/i),
      message: `Description is ${descContent.length} characters; aim for 50-160.`,
      fix: 'Adjust the meta description to fall between 50 and 160 characters.',
    }));
  }

  const canonical = doc.querySelector('link[rel="canonical" i]');
  if (!canonical || !(canonical.getAttribute('href') || '').trim()) {
    issues.push(makeIssue({
      category: 'SEO', severity: SEVERITY.WARN, title: 'Missing canonical link',
      file: file.path, line: null,
      message: 'A canonical URL helps avoid duplicate-content issues across trailing slashes, query params, or mirrors.',
      fix: 'Add <link rel="canonical" href="https://yourdomain.com/path/">.',
    }));
  }

  const ogFields = [
    ['og:title', 'Missing Open Graph title'],
    ['og:description', 'Missing Open Graph description'],
    ['og:image', 'Missing Open Graph image'],
  ];
  for (const [prop, label] of ogFields) {
    const el = doc.querySelector(`meta[property="${prop}"]`);
    if (!el || !(el.getAttribute('content') || '').trim()) {
      issues.push(makeIssue({
        category: 'SEO', severity: SEVERITY.WARN, title: label,
        file: file.path, line: null,
        message: 'Open Graph tags control how the page previews when shared on social platforms.',
        fix: `Add <meta property="${prop}" content="..."> inside <head>.`,
      }));
    }
  }

  const twitterCard = doc.querySelector('meta[name="twitter:card" i]');
  if (!twitterCard) {
    issues.push(makeIssue({
      category: 'SEO', severity: SEVERITY.INFO, title: 'Missing Twitter card meta',
      file: file.path, line: null,
      message: 'Twitter/X card tags improve link previews on that platform.',
      fix: 'Add <meta name="twitter:card" content="summary_large_image">.',
    }));
  }

  const h1s = doc.querySelectorAll('h1');
  if (h1s.length === 0) {
    issues.push(makeIssue({
      category: 'SEO', severity: SEVERITY.WARN, title: 'No <h1> found',
      file: file.path, line: null,
      message: 'Pages should have exactly one top-level heading describing the page.',
      fix: 'Add a single <h1> summarizing the page content.',
    }));
  } else if (h1s.length > 1) {
    issues.push(makeIssue({
      category: 'SEO', severity: SEVERITY.WARN, title: 'Multiple <h1> elements',
      file: file.path, line: null,
      message: `Found ${h1s.length} <h1> elements; search engines expect one primary heading per page.`,
      fix: 'Keep a single <h1> and demote the others to <h2>/<h3>.',
    }));
  }

  const robotsMeta = doc.querySelector('meta[name="robots" i]');
  if (robotsMeta && /noindex/i.test(robotsMeta.getAttribute('content') || '')) {
    issues.push(makeIssue({
      category: 'SEO', severity: SEVERITY.FAIL, title: 'Page marked noindex',
      file: file.path, line: findLine(text, /<meta[^>]+name=["']robots["']/i),
      message: 'This page will be excluded from search engines. Likely leftover from staging.',
      fix: 'Remove the noindex meta robots tag (or its content) before launch, unless intentional.',
    }));
  }

  return issues;
}

export function auditSeo(vfs, ctx) {
  const issues = [];
  for (const file of htmlFiles(vfs)) {
    issues.push(...auditPage(file));
  }

  const robots = vfs.get('robots.txt');
  if (!robots) {
    issues.push(makeIssue({
      category: 'SEO', severity: SEVERITY.FAIL, title: 'Missing robots.txt',
      file: null, line: null,
      message: 'robots.txt tells crawlers what they may index and where the sitemap lives.',
      fix: 'Add a robots.txt at the site root (see the generated Fix Pack).',
    }));
  }

  const sitemap = vfs.get('sitemap.xml');
  if (!sitemap) {
    issues.push(makeIssue({
      category: 'SEO', severity: SEVERITY.FAIL, title: 'Missing sitemap.xml',
      file: null, line: null,
      message: 'A sitemap helps search engines discover every page on the site.',
      fix: 'Add a sitemap.xml at the site root (see the generated Fix Pack).',
    }));
  } else if (ctx.productionUrl && sitemap.text) {
    try {
      const prodHost = new URL(ctx.productionUrl).host;
      const locs = Array.from(sitemap.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)).map((m) => m[1]);
      const mismatched = locs.filter((loc) => {
        try {
          return new URL(loc).host !== prodHost;
        } catch {
          return false;
        }
      });
      if (mismatched.length) {
        issues.push(makeIssue({
          category: 'SEO', severity: SEVERITY.WARN, title: 'Sitemap URLs do not match production URL',
          file: 'sitemap.xml', line: findLine(sitemap.text, new RegExp(mismatched[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))),
          message: `Found ${mismatched.length} <loc> entr${mismatched.length === 1 ? 'y' : 'ies'} pointing at a different host than ${prodHost}.`,
          fix: 'Update sitemap.xml <loc> entries to use the production domain.',
        }));
      }
    } catch {
      // ignore malformed production URL
    }
  }

  return issues;
}
