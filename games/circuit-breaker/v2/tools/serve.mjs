/**
 * Zero-dependency static server for local development.
 *
 *   npm start                                  → http://localhost:5173/
 *   node tools/serve.mjs 8080
 *   node tools/serve.mjs 5173 /circuit-breaker/  → serves under a sub-path,
 *       which is how GitHub Pages hosts a project site. Use this to confirm
 *       nothing depends on the app living at the domain root.
 *
 * Sends the right MIME types (including .webmanifest) and disables caching so a
 * reload always picks up your latest edit.
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2] || process.env.PORT || 5173);

// Optional sub-path, e.g. "/circuit-breaker/", to mimic GitHub Pages project hosting.
const RAW_BASE = process.argv[3] || process.env.BASE_PATH || '';
const BASE = RAW_BASE ? `/${RAW_BASE.replace(/^\/|\/$/g, '')}/` : '/';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);

  if (BASE !== '/') {
    if (pathname === BASE.slice(0, -1)) {
      res.writeHead(302, { Location: BASE }).end();
      return;
    }
    if (!pathname.startsWith(BASE)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        .end(`Not found. This server is hosting the app under ${BASE}`);
      return;
    }
    pathname = pathname.slice(BASE.length - 1);
  }

  if (pathname.endsWith('/')) pathname += 'index.html';

  const filePath = path.join(ROOT, pathname);
  // Never serve outside the project directory.
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Service-Worker-Allowed': '/',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
});

server.listen(PORT, () => {
  process.stdout.write(`Circuit Breaker dev server: http://localhost:${PORT}${BASE}\n`);
});
