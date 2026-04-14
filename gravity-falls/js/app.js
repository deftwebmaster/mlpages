// app.js — Gravity Falls Companion
// Loads all JSON data, builds UI, wires interactions

const App = (() => {

  // ── State ──
  let eggs = [];
  let ciphers = [];
  let characters = [];

  let eggFilter = { season: 'all', category: 'all', tier: 'all' };

  // ── Boot ──
  async function init() {
    [eggs, ciphers, characters] = await Promise.all([
      fetchJSON('data/eggs.json'),
      fetchJSON('data/ciphers.json'),
      fetchJSON('data/characters.json'),
    ]);
    buildCipherReference();
    buildEggs();
    buildCharacters();
    wireNav();
    wireCipherDecoder();
    wireEggFilters();
    wireReveals();
  }

  async function fetchJSON(path) {
    const res = await fetch(path);
    return res.json();
  }

  // ── Navigation ──
  function wireNav() {
    const links = document.querySelectorAll('nav a[data-section]');
    links.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = link.dataset.section;
        document.getElementById(target).scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Active state on scroll
    const sections = ['cipher', 'eggs', 'characters'];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          const active = document.querySelector(`nav a[data-section="${entry.target.id}"]`);
          if (active) active.classList.add('active');
        }
      });
    }, { threshold: 0.3 });

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  // ── Cipher Decoder ──
  function wireCipherDecoder() {
    const select = document.getElementById('cipher-select');
    const input  = document.getElementById('cipher-input');
    const keyRow = document.getElementById('vigenere-key-row');
    const keyIn  = document.getElementById('vigenere-key');
    const btn    = document.getElementById('decode-btn');
    const result = document.getElementById('cipher-result-text');
    const empty  = document.getElementById('cipher-result-empty');

    select.addEventListener('change', () => {
      if (select.value === 'vigenere') {
        keyRow.classList.add('visible');
      } else {
        keyRow.classList.remove('visible');
      }
    });

    btn.addEventListener('click', () => decode());
    input.addEventListener('keydown', e => { if (e.ctrlKey && e.key === 'Enter') decode(); });

    function decode() {
      const text = input.value.trim();
      if (!text) return;
      const type = select.value;
      let out = '';

      switch (type) {
        case 'caesar':    out = Decoders.caesar(text, 3);               break;
        case 'atbash':    out = Decoders.atbash(text);                  break;
        case 'a1z26':     out = Decoders.a1z26(text);                   break;
        case 'vigenere':  out = Decoders.vigenere(text, keyIn.value || 'STANFORD'); break;
        case 'multilayer':out = Decoders.multilayer(text);              break;
      }

      empty.style.display = 'none';
      result.style.display = 'block';
      result.textContent = out;
    }
  }

  // ── Cipher Reference List ──
  function buildCipherReference() {
    const list = document.getElementById('cipher-ref-list');
    list.innerHTML = '';

    ciphers.forEach(c => {
      const li = document.createElement('li');
      li.className = 'cipher-ref-item';

      const seasonStr = c.seasons.map(s => `S${s}`).join(', ');

      li.innerHTML = `
        <div class="cipher-ref-name">${c.name}</div>
        <div class="cipher-ref-meta">${seasonStr} · <span>${c.example?.source || ''}</span></div>
        <div class="cipher-ref-desc">
          ${c.description}
          ${c.tip ? `<div style="margin-top:6px;font-style:italic;opacity:0.85">${c.tip}</div>` : ''}
          ${c.example ? `<div style="margin-top:8px;font-family:'Special Elite',monospace;font-size:0.75rem;opacity:0.7">e.g. "${c.example.encoded}" → ${c.example.decoded}</div>` : ''}
          ${c.id !== 'bill-wheel' ? `<button class="try-it-btn" data-cipher-id="${c.id}" data-example="${encodeURIComponent(c.example?.encoded || '')}">Try it ↗</button>` : ''}
        </div>
      `;

      li.addEventListener('click', e => {
        if (e.target.classList.contains('try-it-btn')) {
          loadCipherExample(e.target.dataset.cipherId, decodeURIComponent(e.target.dataset.example));
          return;
        }
        li.classList.toggle('expanded');
      });

      list.appendChild(li);
    });
  }

  function loadCipherExample(cipherId, exampleText) {
    const select = document.getElementById('cipher-select');
    const input  = document.getElementById('cipher-input');
    const keyRow = document.getElementById('vigenere-key-row');

    select.value = cipherId;
    input.value = exampleText;

    if (cipherId === 'vigenere') {
      keyRow.classList.add('visible');
    } else {
      keyRow.classList.remove('visible');
    }

    document.getElementById('cipher').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => document.getElementById('decode-btn').click(), 400);
  }

  // ── Easter Eggs ──
  function buildEggs() {
    const container = document.getElementById('eggs-grid');
    container.innerHTML = '';

    eggs.forEach(egg => {
      const card = document.createElement('div');
      card.className = 'egg-card';
      card.dataset.season = egg.season;
      card.dataset.category = egg.category;
      card.dataset.tier = egg.spoilerTier;
      card.id = `egg-${egg.id}`;

      const catLabel  = categoryLabel(egg.category);
      const tierBadge = tierBadgeHTML(egg.spoilerTier);

      card.innerHTML = `
        <div class="egg-meta">
          <span class="badge badge-ep">S${egg.season}E${egg.episode}</span>
          <span class="badge badge-${egg.category === 'background' ? 'bg' : egg.category === 'cryptogram' ? 'crypt' : 'jour'}">${catLabel}</span>
          ${tierBadge}
        </div>
        <div class="egg-title">${egg.title}</div>
        <div class="egg-hint">${egg.hint}</div>
        <div class="spoiler-toggle">
          <button class="spoiler-btn" data-egg-id="${egg.id}">Reveal spoiler</button>
        </div>
        <div class="spoiler-text" id="spoiler-${egg.id}">${egg.spoiler}</div>
      `;

      card.querySelector('.spoiler-btn').addEventListener('click', e => {
        const btn = e.currentTarget;
        const text = document.getElementById(`spoiler-${egg.id}`);
        const isOpen = text.classList.toggle('open');
        btn.textContent = isOpen ? 'Hide spoiler' : 'Reveal spoiler';
        btn.classList.toggle('revealed', isOpen);
      });

      container.appendChild(card);
    });

    updateEggVisibility();
  }

  function wireEggFilters() {
    document.querySelectorAll('.filter-btn[data-season]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn[data-season]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        eggFilter.season = btn.dataset.season;
        updateEggVisibility();
      });
    });

    document.querySelectorAll('.filter-btn[data-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn[data-category]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        eggFilter.category = btn.dataset.category;
        updateEggVisibility();
      });
    });

    document.querySelectorAll('.tier-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        eggFilter.tier = btn.dataset.tier;
        updateEggVisibility();
      });
    });
  }

  const TIER_ORDER = { safe: 0, s1: 1, s2: 2, finale: 3 };

  function updateEggVisibility() {
    const selectedTierMax = TIER_ORDER[eggFilter.tier] ?? 99;

    document.querySelectorAll('.egg-card').forEach(card => {
      const seasonMatch   = eggFilter.season === 'all' || card.dataset.season === eggFilter.season;
      const categoryMatch = eggFilter.category === 'all' || card.dataset.category === eggFilter.category;
      const eggTier       = TIER_ORDER[card.dataset.tier] ?? 0;
      const tierMatch     = eggFilter.tier === 'all' || eggTier <= selectedTierMax;

      card.classList.toggle('hidden', !(seasonMatch && categoryMatch && tierMatch));
    });
  }

  // ── Characters ──
  function buildCharacters() {
    const grid = document.getElementById('char-grid');
    grid.innerHTML = '';

    characters.forEach(char => {
      const card = document.createElement('div');
      card.className = 'char-card';

      const relatedEggsHTML = char.eggIds.map(id => {
        const egg = eggs.find(e => e.id === id);
        if (!egg) return '';
        return `<div class="related-egg-link" data-egg-id="${id}">→ ${egg.title}</div>`;
      }).join('');

      const hiddenFactsHTML = char.hiddenFacts.map(f =>
        `<div class="char-fact">${f}</div>`
      ).join('');

      card.innerHTML = `
        <div class="char-card-header">
          <div class="char-avatar ${char.color}">${char.initial}</div>
          <div>
            <div class="char-name">${char.name}</div>
            <div class="char-role">${char.role}</div>
          </div>
        </div>
        <div class="char-card-body">
          <div class="char-bio">${char.bio}</div>
          <button class="char-expand-btn" data-char-id="${char.id}">Read more ↓</button>
        </div>
        <div class="char-full" id="char-full-${char.id}">
          <div class="char-full-bio">${char.bio}</div>
          <div class="char-facts">
            <h4>Hidden details</h4>
            ${hiddenFactsHTML}
          </div>
          ${char.eggIds.length ? `
          <div class="char-related-eggs">
            <h4>Related easter eggs</h4>
            ${relatedEggsHTML}
          </div>` : ''}
        </div>
      `;

      card.querySelector('.char-expand-btn').addEventListener('click', e => {
        const full = document.getElementById(`char-full-${char.id}`);
        const bio  = card.querySelector('.char-bio');
        const btn  = e.currentTarget;
        const isOpen = full.classList.toggle('open');
        bio.style.display = isOpen ? 'none' : '';
        btn.textContent = isOpen ? 'Show less ↑' : 'Read more ↓';
      });

      card.querySelectorAll('.related-egg-link').forEach(link => {
        link.addEventListener('click', () => {
          const eggId = link.dataset.eggId;
          const eggCard = document.getElementById(`egg-${eggId}`);
          if (!eggCard) return;
          // Reset filters
          eggFilter = { season: 'all', category: 'all', tier: 'all' };
          document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          document.querySelector('.filter-btn[data-season="all"]')?.classList.add('active');
          document.querySelector('.filter-btn[data-category="all"]')?.classList.add('active');
          document.querySelector('.tier-btn[data-tier="all"]')?.classList.add('active');
          updateEggVisibility();
          document.getElementById('eggs').scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => {
            eggCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            eggCard.style.outline = '2px solid #7f3520';
            setTimeout(() => eggCard.style.outline = '', 1800);
          }, 500);
        });
      });

      grid.appendChild(card);
    });
  }

  // ── Helpers ──
  function categoryLabel(cat) {
    return { background: 'Background detail', cryptogram: 'Cryptogram', journal: 'Journal page' }[cat] || cat;
  }

  function tierBadgeHTML(tier) {
    const labels = { safe: 'No spoilers', s1: 'After S1', s2: 'After S2', finale: 'Post-finale' };
    return `<span class="badge badge-tier-${tier}">${labels[tier] || tier}</span>`;
  }

  function wireReveals() {
    const targets = document.querySelectorAll('.reveal, .reveal-stagger');
    if (!targets.length) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(target => observer.observe(target));
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
