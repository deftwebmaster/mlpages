import { SEVERITY, makeIssue } from '../core/issue.js';

export function auditFiles(vfs) {
  const issues = [];
  const paths = Array.from(vfs.keys());

  if (!vfs.has('404.html')) {
    issues.push(makeIssue({
      category: 'Files', severity: SEVERITY.WARN, title: 'Missing 404.html',
      file: null, line: null,
      message: 'Most static hosts (GitHub Pages, Netlify, Vercel) show a custom 404 page automatically if one exists at the root.',
      fix: 'Add a 404.html at the site root. See the generated Fix Pack.',
    }));
  }

  const hasReadme = paths.some((p) => /^readme(\.md|\.txt)?$/i.test(p));
  if (!hasReadme) {
    issues.push(makeIssue({
      category: 'Files', severity: SEVERITY.INFO, title: 'No README or launch notes found',
      file: null, line: null,
      message: 'A short README documenting deploy steps and environment notes helps whoever launches or maintains this site next.',
      fix: 'Add a README.md with deploy instructions and any launch-day notes.',
    }));
  }

  const byLower = new Map();
  for (const p of paths) {
    const lower = p.toLowerCase();
    if (!byLower.has(lower)) byLower.set(lower, []);
    byLower.get(lower).push(p);
  }
  for (const [lower, variants] of byLower) {
    if (variants.length > 1) {
      issues.push(makeIssue({
        category: 'Files', severity: SEVERITY.WARN, title: 'Case-sensitive path collision',
        file: variants[0], line: null,
        message: `${variants.join(' and ')} differ only by case. Case-sensitive hosts will see these as different files, which is a common source of broken links after deploy.`,
        fix: 'Rename to a single, consistently-cased file and update any references.',
      }));
    }
  }

  const hiddenFiles = Array.from(vfs.values()).filter((f) => f.isHidden);
  for (const f of hiddenFiles) {
    issues.push(makeIssue({
      category: 'Files', severity: SEVERITY.WARN, title: 'Hidden/system file included in deploy',
      file: f.path, line: null,
      message: `${f.path} looks like an OS-generated file that shouldn't ship with the site.`,
      fix: 'Remove it from the deploy and add it to .gitignore.',
    }));
  }

  return issues;
}
