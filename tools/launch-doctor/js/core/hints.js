// Lightweight, best-effort framework/host detection based on filenames and content signatures.
// These are hints for the report header, not audit findings.

const FRAMEWORK_SIGNATURES = [
  { name: 'Next.js (static export)', test: (vfs) => vfs.has('_next') || Array.from(vfs.keys()).some((p) => p.startsWith('_next/')) },
  { name: 'Astro', test: (vfs) => Array.from(vfs.keys()).some((p) => /\/_astro\//.test(p)) },
  { name: 'Vite', test: (vfs) => { const idx = vfs.get('index.html'); return idx && idx.text && /\/assets\/[^"']+\.js/.test(idx.text) && /type="module"/.test(idx.text); } },
  { name: 'Create React App', test: (vfs) => { const idx = vfs.get('index.html'); return idx && idx.text && /static\/js\/main\.[a-z0-9]+\.js/.test(idx.text); } },
  { name: 'Gatsby', test: (vfs) => vfs.has('page-data') || Array.from(vfs.keys()).some((p) => p.startsWith('page-data/')) },
  { name: 'Hugo', test: (vfs) => Array.from(vfs.values()).some((f) => f.text && /generator" content="Hugo/i.test(f.text)) },
  { name: 'Jekyll', test: (vfs) => Array.from(vfs.values()).some((f) => f.text && /generator" content="Jekyll/i.test(f.text)) },
  { name: 'WordPress export', test: (vfs) => Array.from(vfs.values()).some((f) => f.text && /generator" content="WordPress/i.test(f.text)) },
];

const HOST_SIGNATURES = [
  { name: 'GitHub Pages', test: (vfs) => vfs.has('cname') || vfs.has('.nojekyll') },
  { name: 'Netlify', test: (vfs) => vfs.has('netlify.toml') || vfs.has('_redirects') },
  { name: 'Vercel', test: (vfs) => vfs.has('vercel.json') },
  { name: 'Cloudflare Pages', test: (vfs) => vfs.has('_headers') && vfs.has('_redirects') },
];

function lowerKeyed(vfs) {
  const map = new Map();
  for (const [key, value] of vfs) map.set(key.toLowerCase(), value);
  return map;
}

export function detectHints(vfs) {
  const lower = lowerKeyed(vfs);
  const frameworks = FRAMEWORK_SIGNATURES.filter((sig) => sig.test(lower)).map((sig) => sig.name);
  const hosts = HOST_SIGNATURES.filter((sig) => sig.test(lower)).map((sig) => sig.name);
  return {
    framework: frameworks[0] || 'Unknown / plain HTML',
    host: hosts[0] || 'Unknown',
  };
}
