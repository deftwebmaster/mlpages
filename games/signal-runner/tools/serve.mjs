/**
 * serve.mjs — Minimal static file server for local development.
 *
 * The game is plain static files, but ES modules and service workers both
 * need a real HTTP origin, so opening index.html from the filesystem will not
 * do. Any static server works; this one exists so the project has zero
 * dependencies to install.
 *
 * Run with:  npm start        (then open http://localhost:8123)
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 8123;

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
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';

    // Reject anything that tries to escape the project directory.
    const filePath = join(ROOT, normalize(pathname).replace(/^(\.\.[/\\])+/, ''));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const info = await stat(filePath);
    if (info.isDirectory()) {
      res.writeHead(301, { Location: `${pathname}/` }).end();
      return;
    }

    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(filePath)] || 'application/octet-stream',
      // Never cache during development, or the service worker will serve you
      // yesterday's build while you wonder why your edit did nothing.
      'Cache-Control': 'no-store',
      'Service-Worker-Allowed': '/',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Signal Runner dev server → http://localhost:${PORT}`);
});
