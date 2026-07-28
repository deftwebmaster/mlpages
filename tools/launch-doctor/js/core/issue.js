export const SEVERITY = { FAIL: 'fail', WARN: 'warn', INFO: 'info' };

export const CATEGORIES = [
  'SEO',
  'Accessibility',
  'Links',
  'Assets',
  'Security',
  'Files',
  'Placeholders',
];

let counter = 0;

export function makeIssue({ category, severity, title, file = null, line = null, message, fix }) {
  counter += 1;
  return { id: `iss-${counter}`, category, severity, title, file, line, message, fix };
}

export function htmlFiles(vfs) {
  return Array.from(vfs.values()).filter((f) => (f.ext === '.html' || f.ext === '.htm') && f.dom);
}
