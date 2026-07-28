import { loadFromZip, loadFromFileList } from './core/fileLoader.js';
import { runAudits } from './core/audit.js';
import { detectHints } from './core/hints.js';
import { generateFixPackFiles, buildFixPackZip } from './core/fixpack.js';
import { buildReportData, toJson, toMarkdown } from './core/report.js';
import { CATEGORIES } from './core/issue.js';

const $ = (sel) => document.querySelector(sel);

const state = {
  vfs: null,
  ctx: null,
  issues: [],
  score: null,
  hints: null,
  fixPackFiles: null,
  activeCategory: 'All',
  activeSeverities: new Set(['fail', 'warn', 'info']),
};

const dropzone = $('#dropzone');
const statusLine = $('#status-line');
const scanBtn = $('#btn-scan');

function setStatus(message, isError = false) {
  statusLine.textContent = message;
  statusLine.classList.toggle('error', isError);
}

function fileCountLabel() {
  return state.vfs ? `${state.vfs.size} file${state.vfs.size === 1 ? '' : 's'} loaded` : '';
}

async function ingest(loaderPromise, label) {
  try {
    setStatus(`Reading ${label}…`);
    state.vfs = await loaderPromise;
    setStatus(fileCountLabel());
    scanBtn.disabled = state.vfs.size === 0;
    $('#dropzone-primary').textContent = fileCountLabel() || 'Drag a ZIP or folder here';
  } catch (err) {
    console.error(err);
    setStatus(`Could not read ${label}: ${err.message}`, true);
  }
}

// --- Input wiring -----------------------------------------------------

function bindPicker(buttonSelector, inputSelector) {
  $(buttonSelector).addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    $(inputSelector).click();
  });
}

bindPicker('#btn-pick-zip', '#input-zip');
bindPicker('#btn-pick-folder', '#input-folder');
bindPicker('#btn-pick-files', '#input-files');

dropzone.addEventListener('click', (e) => {
  if (e.target.closest('button')) return;
  $('#input-zip').click();
});

dropzone.addEventListener('keydown', (e) => {
  if (e.target.closest('button')) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    $('#input-zip').click();
  }
});

$('#btn-demo').addEventListener('click', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  await loadDemoReport();
});

$('#input-zip').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) ingest(loadFromZip(file), file.name);
});

$('#input-folder').addEventListener('change', (e) => {
  if (e.target.files.length) ingest(loadFromFileList(e.target.files), 'folder');
});

$('#input-files').addEventListener('change', (e) => {
  if (e.target.files.length) ingest(loadFromFileList(e.target.files), 'files');
});

['dragenter', 'dragover'].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
});
['dragleave', 'drop'].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
  });
});
dropzone.addEventListener('drop', async (e) => {
  const items = e.dataTransfer.items;
  if (items && items.length && items[0].webkitGetAsEntry) {
    const entry = items[0].webkitGetAsEntry();
    if (entry && entry.isDirectory) {
      const files = await readDirectoryEntry(entry);
      ingest(loadFromFileList(files), 'folder');
      return;
    }
  }
  const files = Array.from(e.dataTransfer.files || []);
  if (files.length === 1 && /\.zip$/i.test(files[0].name)) {
    ingest(loadFromZip(files[0]), files[0].name);
  } else if (files.length) {
    ingest(loadFromFileList(files), 'files');
  }
});

async function readDirectoryEntry(dirEntry) {
  const files = [];
  async function walk(entry, prefix) {
    if (entry.isFile) {
      const file = await new Promise((res, rej) => entry.file(res, rej));
      Object.defineProperty(file, 'webkitRelativePath', { value: prefix + entry.name });
      files.push(file);
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const entries = await new Promise((res, rej) => reader.readEntries(res, rej));
      for (const child of entries) {
        await walk(child, prefix + entry.name + '/');
      }
    }
  }
  await walk(dirEntry, '');
  return files;
}

// --- Scan ---------------------------------------------------------------

scanBtn.addEventListener('click', () => {
  if (!state.vfs || state.vfs.size === 0) return;
  const productionUrl = $('#input-url').value.trim();
  const thresholdKb = Number($('#input-threshold').value) || 500;
  state.ctx = {
    productionUrl,
    config: { imageSizeThreshold: thresholdKb * 1024 },
  };
  setStatus('Scanning…');
  setTimeout(() => {
    const { issues, score } = runAudits(state.vfs, state.ctx);
    state.issues = issues;
    state.score = score;
    state.hints = detectHints(state.vfs);
    state.fixPackFiles = generateFixPackFiles(state.vfs, state.ctx, issues, score);
    state.activeCategory = 'All';
    renderSummary();
    renderTabs();
    renderIssues();
    renderFixPack();
    $('#summary-panel').classList.remove('hidden');
    $('#report-panel').classList.remove('hidden');
    $('#fixpack-panel').classList.remove('hidden');
    $('#export-panel').classList.remove('hidden');
    setStatus(`Scan complete — ${fileCountLabel()}`);
  }, 10);
});

async function runScan() {
  if (!state.vfs || state.vfs.size === 0) return;
  scanBtn.click();
}

async function loadDemoReport() {
  const files = createDemoFiles();
  $('#input-url').value = 'https://demo.launchdoctor.local';
  $('#input-threshold').value = '500';
  await ingest(loadFromFileList(files), 'demo static site');
  setStatus('Demo site loaded — generating report…');
  await runScan();
  setTimeout(() => {
    $('#summary-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

function demoFile(path, content, type = 'text/plain') {
  const file = new File([content], path.split('/').pop(), { type });
  Object.defineProperty(file, 'webkitRelativePath', { value: path });
  return file;
}

function createDemoFiles() {
  return [
    demoFile('demo-site/index.html', `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Demo Launch</title>
  <meta name="description" content="A demo site with a few launch issues so Launch Doctor can show a realistic report.">
  <meta property="og:title" content="Demo Launch">
  <meta property="og:description" content="A demo report generated locally in your browser.">
  <link rel="canonical" href="https://old-demo.example.com/">
  <link rel="stylesheet" href="assets/site.css">
</head>
<body>
  <header>
    <h1>Demo Launch</h1>
    <nav><a href="/pricing.html">Pricing</a><a href="#contact">Contact</a><a href="https://example.com">Example</a></nav>
  </header>
  <main>
    <section>
      <h3>Static site preflight</h3>
      <img src="assets/hero.png">
      <p>TODO: replace this placeholder copy before launch.</p>
      <a href="missing-page.html">Broken internal link</a>
    </section>
    <section id="contact">
      <form><input type="email" placeholder="Email"><button>Join</button></form>
    </section>
  </main>
  <script src="assets/app.js"></script>
</body>
</html>`, 'text/html'),
    demoFile('demo-site/about.html', `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>About Demo Launch</title>
</head>
<body>
  <h1>About</h1>
  <a href="/">Home</a>
</body>
</html>`, 'text/html'),
    demoFile('demo-site/robots.txt', `User-agent: *
Disallow: /
Sitemap: https://demo.launchdoctor.local/sitemap.xml
`, 'text/plain'),
    demoFile('demo-site/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://demo.launchdoctor.local/</loc></url>
  <url><loc>https://demo.launchdoctor.local/about.html</loc></url>
</urlset>`, 'application/xml'),
    demoFile('demo-site/assets/site.css', `body{font-family:system-ui,sans-serif;margin:0}img{max-width:100%}.hero{color:#111}`, 'text/css'),
    demoFile('demo-site/assets/app.js', `console.log('demo launch');`, 'text/javascript'),
    demoFile('demo-site/_headers', `/*
  X-Frame-Options: DENY
`, 'text/plain')
  ];
}

// --- Rendering: summary ---------------------------------------------------

function renderSummary() {
  const { total, categories, counts } = state.score;
  $('#score-value').textContent = total;
  const circumference = 377;
  const offset = circumference - (circumference * total) / 100;
  $('#score-arc').setAttribute('stroke-dashoffset', String(offset));
  $('#count-fail').textContent = counts.fail || 0;
  $('#count-warn').textContent = counts.warn || 0;
  $('#count-info').textContent = counts.info || 0;
  $('#count-files').textContent = state.vfs.size;
  $('#hint-framework').textContent = state.hints.framework;
  $('#hint-host').textContent = state.hints.host;
  $('#hint-url').textContent = state.ctx.productionUrl || '(not provided)';

  const barsEl = $('#category-bars');
  barsEl.innerHTML = '';
  for (const [category, data] of Object.entries(categories)) {
    const pct = Math.round((data.score / data.weight) * 100);
    const div = document.createElement('div');
    div.className = 'category-bar-item';
    div.innerHTML = `
      <div class="row1"><span>${category}</span><span>${data.score}/${data.weight}</span></div>
      <div class="track"><div class="fill" style="width:${pct}%"></div></div>
    `;
    barsEl.appendChild(div);
  }
}

// --- Rendering: tabs + chips ---------------------------------------------

function categoryCounts() {
  const counts = {};
  for (const cat of CATEGORIES) counts[cat] = 0;
  for (const issue of state.issues) counts[issue.category] = (counts[issue.category] || 0) + 1;
  return counts;
}

function renderTabs() {
  const tabbar = $('#tabbar');
  tabbar.innerHTML = '';
  const counts = categoryCounts();
  const all = document.createElement('button');
  const makeTab = (label, count, category) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (state.activeCategory === category ? ' active' : '');
    btn.innerHTML = `${label}<span class="count">${count}</span>`;
    btn.addEventListener('click', () => {
      state.activeCategory = category;
      renderTabs();
      renderIssues();
    });
    return btn;
  };
  tabbar.appendChild(makeTab('All', state.issues.length, 'All'));
  for (const cat of CATEGORIES) {
    tabbar.appendChild(makeTab(cat, counts[cat], cat));
  }
}

document.querySelectorAll('#chipbar .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const sev = chip.dataset.severity;
    if (state.activeSeverities.has(sev)) {
      state.activeSeverities.delete(sev);
      chip.classList.remove('active');
    } else {
      state.activeSeverities.add(sev);
      chip.classList.add('active');
    }
    renderIssues();
  });
});

// --- Rendering: issues -----------------------------------------------------

const SEVERITY_ORDER = { fail: 0, warn: 1, info: 2 };

function renderIssues() {
  const list = $('#issue-list');
  list.innerHTML = '';
  const filtered = state.issues
    .filter((i) => state.activeCategory === 'All' || i.category === state.activeCategory)
    .filter((i) => state.activeSeverities.has(i.severity))
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state">No issues match the current filters. 🎉</div>';
    return;
  }

  for (const issue of filtered) {
    const card = document.createElement('div');
    card.className = `issue-card ${issue.severity}`;
    const loc = issue.file ? `${issue.file}${issue.line ? `:${issue.line}` : ''}` : 'site-wide';
    card.innerHTML = `
      <div class="issue-problem">
        <span class="badge ${issue.severity}">${issue.severity}</span>
        <span style="font-size:11px;color:var(--text-faint)">${issue.category}</span>
        <div class="issue-title">${escapeHtml(issue.title)}</div>
        <div class="issue-loc">${escapeHtml(loc)}</div>
        <div class="issue-message">${escapeHtml(issue.message)}</div>
      </div>
      <div class="issue-fix-wrap">
        <div class="issue-fix-label">Suggested fix</div>
        <div class="issue-fix">${escapeHtml(issue.fix)}</div>
      </div>
    `;
    list.appendChild(card);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

// --- Fix pack ---------------------------------------------------------

function renderFixPack() {
  const grid = $('#filegrid');
  grid.innerHTML = '';
  const preview = $('#code-preview');
  preview.classList.add('hidden');
  for (const [name, content] of Object.entries(state.fixPackFiles)) {
    const chip = document.createElement('div');
    chip.className = 'file-chip';
    chip.innerHTML = `${name}<span class="tag">${content.length} bytes — click to preview</span>`;
    chip.addEventListener('click', () => {
      preview.textContent = content;
      preview.classList.remove('hidden');
    });
    grid.appendChild(chip);
  }
}

$('#btn-download-fixpack').addEventListener('click', async () => {
  const blob = await buildFixPackZip(state.fixPackFiles);
  downloadBlob(blob, 'launch-doctor-fix-pack.zip');
});

// --- Export -------------------------------------------------------------

$('#btn-export-json').addEventListener('click', () => {
  const reportData = buildReportData(state.vfs, state.ctx, state.issues, state.score);
  downloadText(toJson(reportData), 'launch-report.json', 'application/json');
});

$('#btn-export-md').addEventListener('click', () => {
  const reportData = buildReportData(state.vfs, state.ctx, state.issues, state.score);
  downloadText(toMarkdown(reportData), 'launch-report.md', 'text/markdown');
});

function downloadText(text, filename, mime) {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
