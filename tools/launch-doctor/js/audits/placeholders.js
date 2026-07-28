import { SEVERITY, makeIssue } from '../core/issue.js';

const SKIP_FILES = new Set(['robots.txt', 'sitemap.xml', 'package.json', 'package-lock.json', '_headers', 'vercel.json', 'netlify.toml']);
const SCAN_EXTS = new Set(['.html', '.htm', '.txt', '.md', '.js', '.svg']);

const PATTERNS = [
  { name: 'Lorem ipsum placeholder text', re: /lorem ipsum/gi, severity: SEVERITY.FAIL,
    fix: 'Replace the placeholder copy with real content.' },
  { name: '"TODO" left in content', re: /\bTODO\b/g, severity: SEVERITY.WARN,
    fix: 'Resolve or remove the TODO before launch.' },
  { name: '"TBD" left in content', re: /\bTBD\b/g, severity: SEVERITY.WARN,
    fix: 'Fill in the TBD placeholder with final content.' },
  { name: '"Your Company" placeholder', re: /your company/gi, severity: SEVERITY.WARN,
    fix: 'Replace with the actual company/brand name.' },
  { name: '"Project Name" placeholder', re: /project name/gi, severity: SEVERITY.WARN,
    fix: 'Replace with the actual project/product name.' },
  { name: 'example.com mentioned in content', re: /example\.com/gi, severity: SEVERITY.WARN,
    fix: 'Replace example.com references with the real production domain.' },
  { name: 'test@test.com placeholder email', re: /test@test\.com/gi, severity: SEVERITY.WARN,
    fix: 'Replace with a real contact email address.' },
  { name: 'Placeholder phone number (555-555-...)', re: /555-555/g, severity: SEVERITY.WARN,
    fix: 'Replace with a real phone number.' },
];

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

export function auditPlaceholders(vfs) {
  const issues = [];
  for (const file of vfs.values()) {
    if (!file.text || SKIP_FILES.has(file.path) || !SCAN_EXTS.has(file.ext)) continue;

    for (const pattern of PATTERNS) {
      const matches = Array.from(file.text.matchAll(pattern.re));
      if (matches.length === 0) continue;
      issues.push(makeIssue({
        category: 'Placeholders', severity: pattern.severity, title: pattern.name,
        file: file.path, line: lineOf(file.text, matches[0].index),
        message: `Found ${matches.length} occurrence${matches.length === 1 ? '' : 's'} in ${file.path}.`,
        fix: pattern.fix,
      }));
    }

    const priceRe = /\$(19|49|149)\b/g;
    let priceMatch;
    while ((priceMatch = priceRe.exec(file.text))) {
      const windowStart = Math.max(0, priceMatch.index - 200);
      const windowEnd = Math.min(file.text.length, priceMatch.index + 200);
      const nearby = file.text.slice(windowStart, windowEnd);
      if (/starter|basic|plan/i.test(nearby)) {
        issues.push(makeIssue({
          category: 'Placeholders', severity: SEVERITY.INFO, title: 'Possible placeholder pricing',
          file: file.path, line: lineOf(file.text, priceMatch.index),
          message: `Found "$${priceMatch[1]}" near pricing-plan language, which is a common template placeholder price.`,
          fix: 'Confirm this is the real launch price, not template boilerplate.',
        }));
        break;
      }
    }
  }
  return issues;
}
