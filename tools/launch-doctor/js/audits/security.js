import { SEVERITY, makeIssue, htmlFiles } from '../core/issue.js';
import { findLineForOuterHtml } from '../core/lineFinder.js';
import { isHttpUrl } from '../core/pathUtils.js';

const REQUIRED_HEADERS = [
  'content-security-policy',
  'referrer-policy',
  'x-content-type-options',
  'permissions-policy',
];

function collectHeaderValues(vfs) {
  // Returns a lowercase header-name -> value map merged across whichever deploy config exists.
  const values = new Map();

  const headersFile = vfs.get('_headers');
  if (headersFile && headersFile.text) {
    for (const line of headersFile.text.split('\n')) {
      const m = /^\s+([A-Za-z-]+)\s*:\s*(.+)$/.exec(line);
      if (m) values.set(m[1].toLowerCase(), m[2].trim());
    }
  }

  const vercel = vfs.get('vercel.json');
  if (vercel && vercel.text) {
    try {
      const json = JSON.parse(vercel.text);
      for (const rule of json.headers || []) {
        for (const h of rule.headers || []) {
          values.set(h.key.toLowerCase(), h.value);
        }
      }
    } catch {
      // malformed JSON is reported separately by the Files audit's parse checks, if any
    }
  }

  const netlifyToml = vfs.get('netlify.toml');
  if (netlifyToml && netlifyToml.text) {
    const re = /\[headers\.values\][^[]*/gi;
    let match;
    while ((match = re.exec(netlifyToml.text))) {
      const block = match[0];
      const lineRe = /([A-Za-z-]+)\s*=\s*["']([^"']+)["']/g;
      let lm;
      while ((lm = lineRe.exec(block))) {
        values.set(lm[1].toLowerCase(), lm[2]);
      }
    }
  }

  return values;
}

export function auditSecurity(vfs, ctx) {
  const issues = [];
  const hasHeadersFile = vfs.has('_headers');
  const hasNetlifyToml = vfs.has('netlify.toml');
  const hasVercelJson = vfs.has('vercel.json');

  if (!hasHeadersFile && !hasNetlifyToml && !hasVercelJson) {
    issues.push(makeIssue({
      category: 'Security', severity: SEVERITY.WARN, title: 'No deploy header config found',
      file: null, line: null,
      message: 'No _headers, netlify.toml, or vercel.json was found, so security headers likely rely on host defaults.',
      fix: 'Add a _headers (Netlify/Cloudflare Pages) or vercel.json with security headers. See the generated Fix Pack.',
    }));
  } else {
    const values = collectHeaderValues(vfs);
    for (const header of REQUIRED_HEADERS) {
      if (!values.has(header)) {
        issues.push(makeIssue({
          category: 'Security', severity: SEVERITY.WARN, title: `Missing ${header.replace(/(^|-)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase())} header`,
          file: hasHeadersFile ? '_headers' : hasVercelJson ? 'vercel.json' : 'netlify.toml',
          line: null,
          message: `The deploy config doesn't set a ${header} header.`,
          fix: `Add a ${header} header to your deploy config.`,
        }));
      }
    }
    const csp = values.get('content-security-policy');
    if (csp && (/unsafe-inline/i.test(csp) || /unsafe-eval/i.test(csp) || /(^|\s)\*(\s|;|$)/.test(csp))) {
      issues.push(makeIssue({
        category: 'Security', severity: SEVERITY.WARN, title: 'CSP contains an unsafe pattern',
        file: hasHeadersFile ? '_headers' : hasVercelJson ? 'vercel.json' : 'netlify.toml',
        line: null,
        message: `Content-Security-Policy includes 'unsafe-inline', 'unsafe-eval', or a wildcard source, which weakens XSS protection.`,
        fix: 'Tighten the CSP to specific sources/hashes/nonces instead of unsafe-inline, unsafe-eval, or *.',
      }));
    }
  }

  for (const file of htmlFiles(vfs)) {
    const doc = file.dom;
    const text = file.text;

    doc.querySelectorAll('form').forEach((form) => {
      if (!form.hasAttribute('action') || !form.getAttribute('action').trim()) {
        issues.push(makeIssue({
          category: 'Security', severity: SEVERITY.WARN, title: 'Form has no explicit action',
          file: file.path, line: findLineForOuterHtml(text, form.outerHTML),
          message: 'Without an explicit action, the form submits to the current URL, which is easy to get wrong after moving pages.',
          fix: 'Add an explicit action="..." attribute to the form.',
        }));
      }
    });

    doc.querySelectorAll('script[src]').forEach((script) => {
      const src = script.getAttribute('src');
      if (isHttpUrl(src) && !script.hasAttribute('defer') && !script.hasAttribute('async') && script.getAttribute('type') !== 'module') {
        issues.push(makeIssue({
          category: 'Security', severity: SEVERITY.INFO, title: 'External script without defer/async',
          file: file.path, line: findLineForOuterHtml(text, script.outerHTML),
          message: `<script src="${src}"> blocks HTML parsing while it downloads and executes.`,
          fix: 'Add defer (or async, if execution order doesn\'t matter) to the script tag.',
        }));
      }
    });

    doc.querySelectorAll('a[target="_blank"]').forEach((a) => {
      const rel = (a.getAttribute('rel') || '').toLowerCase();
      if (!rel.includes('noopener') || !rel.includes('noreferrer')) {
        issues.push(makeIssue({
          category: 'Security', severity: SEVERITY.WARN, title: 'target="_blank" missing rel="noopener noreferrer"',
          file: file.path, line: findLineForOuterHtml(text, a.outerHTML),
          message: 'Without noopener, the new tab can access window.opener and redirect the original page (reverse tabnabbing).',
          fix: 'Add rel="noopener noreferrer" to links that open in a new tab.',
        }));
      }
    });
  }

  return issues;
}
