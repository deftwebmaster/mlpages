import { htmlFiles } from './issue.js';
import { buildReportData, toJson, toMarkdown } from './report.js';

function baseUrl(productionUrl) {
  if (!productionUrl) return 'https://example.com';
  return productionUrl.replace(/\/+$/, '');
}

function pageUrlPath(path) {
  if (path === 'index.html') return '/';
  if (path.endsWith('/index.html')) return `/${path.slice(0, -'index.html'.length)}`;
  return `/${path}`;
}

function generateRobotsTxt(vfs, ctx) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl(ctx.productionUrl)}/sitemap.xml\n`;
}

function generateSitemapXml(vfs, ctx) {
  const base = baseUrl(ctx.productionUrl);
  const urls = htmlFiles(vfs)
    .map((f) => `${base}${pageUrlPath(f.path)}`)
    .sort();
  const entries = urls.map((u) => `  <url>\n    <loc>${u}</loc>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

function generateHeaders() {
  return [
    '/*',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Permissions-Policy: geolocation=(), camera=(), microphone=()',
    "  Content-Security-Policy: default-src 'self'",
    '',
  ].join('\n');
}

function generateVercelJson() {
  return JSON.stringify({
    headers: [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), camera=(), microphone=()' },
          { key: 'Content-Security-Policy', value: "default-src 'self'" },
        ],
      },
    ],
  }, null, 2) + '\n';
}

function generate404Html(ctx) {
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Page not found</title>\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<style>body{font-family:system-ui,sans-serif;background:#0d0f12;color:#e5e7eb;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}main{text-align:center}a{color:#2df8e6}</style>\n</head>\n<body>\n<main>\n<h1>404 - Page not found</h1>\n<p>The page you're looking for doesn't exist.</p>\n<p><a href="${ctx.productionUrl || '/'}">Back to home</a></p>\n</main>\n</body>\n</html>\n`;
}

export function generateFixPackFiles(vfs, ctx, issues, score) {
  const reportData = buildReportData(vfs, ctx, issues, score);
  return {
    'robots.txt': generateRobotsTxt(vfs, ctx),
    'sitemap.xml': generateSitemapXml(vfs, ctx),
    '_headers': generateHeaders(),
    'vercel.json': generateVercelJson(),
    '404.html': generate404Html(ctx),
    'launch-report.md': toMarkdown(reportData),
    'launch-report.json': toJson(reportData),
  };
}

export async function buildFixPackZip(files) {
  const JSZip = window.JSZip;
  const zip = new JSZip();
  const readme = [
    '# Launch Doctor Fix Pack',
    '',
    'These are SUGGESTED files generated from your scan. Nothing in your original site was',
    'modified — review each file and merge what applies before deploying.',
    '',
    Object.keys(files).map((name) => `- ${name}`).join('\n'),
    '',
  ].join('\n');
  zip.file('README-fix-pack.txt', readme);
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content);
  }
  return zip.generateAsync({ type: 'blob' });
}
