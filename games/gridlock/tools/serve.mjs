/**
 * tools/serve.mjs — a zero-dependency static server for local playtesting.
 *
 * Gridlock ships as plain static files, so any static host works; this exists
 * purely so `node tools/serve.mjs` gives you the game on http://localhost:4173
 * with correct MIME types (ES modules and the manifest both need them).
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 4173);

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
  '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith('/')) path += 'index.html';

    // Reject anything that tries to climb out of the project directory.
    const target = join(ROOT, normalize(path));
    if (!target.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const info = await stat(target);
    const file = await readFile(info.isDirectory() ? join(target, 'index.html') : target);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Service-Worker-Allowed': '/',
    });
    res.end(file);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
}).listen(PORT, () => {
  console.log(`Gridlock → http://localhost:${PORT}`);
});
