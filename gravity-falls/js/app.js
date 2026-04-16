// app.js — Gravity Falls: Unlocked Archives
// Loads static JSON data, builds the archive UI, and wires interactions.

const App = (() => {
  const state = {
    eggs: [],
    ciphers: [],
    characters: [],
    marginalia: [],
    quotes: [],
    cipherhunt: [],
    zodiac: [],
    episodes: [],
    journals: [],
    theories: [],
    archiveEntries: [],
    eggFilter: { season: 'all', category: 'all', tier: 'all' },
  };

  const TIER_ORDER = { safe: 0, s1: 1, s2: 2, finale: 3 };
  const DATA_FILES = [
    ['eggs', 'data/eggs.json'],
    ['ciphers', 'data/ciphers.json'],
    ['characters', 'data/characters.json'],
    ['marginalia', 'data/marginalia.json'],
    ['quotes', 'data/quotes.json'],
    ['cipherhunt', 'data/cipherhunt.json'],
    ['zodiac', 'data/zodiac.json'],
    ['episodes', 'data/episodes.json'],
    ['journals', 'data/journals.json'],
    ['theories', 'data/theories.json'],
  ];

  async function init() {
    try {
      const results = await Promise.all(DATA_FILES.map(([, path]) => fetchJSON(path)));
      DATA_FILES.forEach(([key], index) => {
        state[key] = results[index];
      });

      state.archiveEntries = buildArchiveEntries();

      buildCipherReference();
      buildEggs();
      buildCharacters();
      buildMarginalia();
      buildBillQuotes();
      buildCipherHunt();
      buildZodiac();
      buildEpisodeIndex();
      buildJournals();
      buildTheories();
      wireArchiveExplorer();
      wireNav();
      wireCipherDecoder();
      wireEggFilters();
      wireReveals();
    } catch (error) {
      console.error('Failed to initialize archive', error);
      const status = document.getElementById('archive-search-status');
      if (status) {
        status.textContent = 'The archive failed to load. Check that the JSON files are available and reload.';
      }
    }
  }

  async function fetchJSON(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status}`);
    }
    return response.json();
  }

  function wireNav() {
    const links = document.querySelectorAll('nav a[data-section]');
    const header = document.querySelector('header');
    const navToggle = document.getElementById('nav-toggle');
    const mainNav = document.getElementById('main-nav');

    links.forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        scrollToSection(link.dataset.section);
      });
    });

    function updateActiveNav() {
      const headerH = header?.offsetHeight || 60;
      const scrollY = window.scrollY + headerH + 10;
      let current = 'hero';

      ['hero', 'cipher', 'cipherhunt', 'eggs', 'marginalia', 'episodes', 'journals', 'theories', 'zodiac', 'characters']
        .forEach(id => {
          const el = document.getElementById(id);
          if (el && el.offsetTop <= scrollY) current = id;
        });

      links.forEach(link => link.classList.toggle('active', link.dataset.section === current));
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();

    if (navToggle && mainNav) {
      navToggle.addEventListener('click', () => {
        const isOpen = mainNav.classList.toggle('nav-open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
      });

      mainNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          mainNav.classList.remove('nav-open');
          navToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  function wireCipherDecoder() {
    const select = document.getElementById('cipher-select');
    const input = document.getElementById('cipher-input');
    const keyRow = document.getElementById('vigenere-key-row');
    const keyInput = document.getElementById('vigenere-key');
    const button = document.getElementById('decode-btn');
    const result = document.getElementById('cipher-result-text');
    const empty = document.getElementById('cipher-result-empty');

    if (!select || !input || !keyRow || !button || !result || !empty) return;

    select.addEventListener('change', () => {
      keyRow.classList.toggle('visible', select.value === 'vigenere');
    });

    function decode() {
      const text = input.value.trim();
      if (!text) return;

      let output = '';
      switch (select.value) {
        case 'caesar':
          output = Decoders.caesar(text, 3);
          break;
        case 'atbash':
          output = Decoders.atbash(text);
          break;
        case 'a1z26':
          output = Decoders.a1z26(text);
          break;
        case 'vigenere':
          output = Decoders.vigenere(text, keyInput.value || 'STANFORD');
          break;
        case 'multilayer':
          output = Decoders.multilayer(text);
          break;
        default:
          output = text;
      }

      empty.style.display = 'none';
      result.style.display = 'block';
      result.textContent = output;
    }

    button.addEventListener('click', decode);
    input.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') decode();
    });
  }

  function buildCipherReference() {
    const list = document.getElementById('cipher-ref-list');
    if (!list) return;
    list.innerHTML = '';

    state.ciphers.forEach(cipher => {
      const li = document.createElement('li');
      li.className = 'cipher-ref-item';
      const seasonStr = cipher.seasons.map(season => `S${season}`).join(', ');

      li.innerHTML = `
        <div class="cipher-ref-name">${cipher.name}</div>
        <div class="cipher-ref-meta">${seasonStr} · <span>${cipher.example?.source || ''}</span></div>
        <div class="cipher-ref-desc">
          ${cipher.description}
          ${cipher.tip ? `<div style="margin-top:6px;font-style:italic;opacity:0.85">${cipher.tip}</div>` : ''}
          ${cipher.example ? `<div style="margin-top:8px;font-family:'Special Elite',monospace;font-size:0.75rem;opacity:0.7">e.g. "${cipher.example.encoded}" → ${cipher.example.decoded}</div>` : ''}
          ${cipher.id !== 'bill-wheel' ? `<button class="try-it-btn" data-cipher-id="${cipher.id}" data-example="${encodeURIComponent(cipher.example?.encoded || '')}">Try it ↗</button>` : ''}
        </div>
      `;

      li.addEventListener('click', event => {
        if (event.target.classList.contains('try-it-btn')) {
          loadCipherExample(event.target.dataset.cipherId, decodeURIComponent(event.target.dataset.example));
          return;
        }
        li.classList.toggle('expanded');
      });

      list.appendChild(li);
    });
  }

  function loadCipherExample(cipherId, exampleText) {
    loadCipherIntoDecoder({ cipherType: cipherId, encoded: exampleText });
  }

  function loadCipherIntoDecoder(item) {
    const select = document.getElementById('cipher-select');
    const input = document.getElementById('cipher-input');
    const keyRow = document.getElementById('vigenere-key-row');
    if (!select || !input || !keyRow) return;

    select.value = item.cipherType;
    input.value = item.encoded;
    keyRow.classList.toggle('visible', item.cipherType === 'vigenere');

    scrollToSection('cipher');
    window.setTimeout(() => document.getElementById('decode-btn')?.click(), 350);
  }

  function buildEggs() {
    const container = document.getElementById('eggs-grid');
    if (!container) return;
    container.innerHTML = '';

    state.eggs.forEach(egg => {
      const card = document.createElement('div');
      card.className = 'egg-card';
      card.dataset.season = String(egg.season);
      card.dataset.category = egg.category;
      card.dataset.tier = egg.spoilerTier;
      card.id = `egg-${egg.id}`;

      card.innerHTML = `
        <div class="egg-meta">
          <span class="badge badge-ep">S${egg.season}E${egg.episode}</span>
          <span class="badge badge-${egg.category === 'background' ? 'bg' : egg.category === 'cryptogram' ? 'crypt' : 'jour'}">${categoryLabel(egg.category)}</span>
          ${tierBadgeHTML(egg.spoilerTier)}
        </div>
        <div class="egg-title">${egg.title}</div>
        <div class="egg-hint">${egg.hint}</div>
        <div class="spoiler-toggle">
          <button class="spoiler-btn">Reveal spoiler</button>
        </div>
        <div class="spoiler-text" id="spoiler-${egg.id}">${egg.spoiler}</div>
      `;

      card.querySelector('.spoiler-btn').addEventListener('click', event => {
        const button = event.currentTarget;
        const spoiler = card.querySelector('.spoiler-text');
        const isOpen = spoiler.classList.toggle('open');
        button.textContent = isOpen ? 'Hide spoiler' : 'Reveal spoiler';
        button.classList.toggle('revealed', isOpen);
      });

      container.appendChild(card);
    });

    updateEggVisibility();
  }

  function wireEggFilters() {
    document.querySelectorAll('.filter-btn[data-season]').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn[data-season]').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        state.eggFilter.season = button.dataset.season;
        updateEggVisibility();
      });
    });

    document.querySelectorAll('.filter-btn[data-category]').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn[data-category]').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        state.eggFilter.category = button.dataset.category;
        updateEggVisibility();
      });
    });

    document.querySelectorAll('.tier-btn').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.tier-btn').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        state.eggFilter.tier = button.dataset.tier;
        updateEggVisibility();
      });
    });
  }

  function updateEggVisibility() {
    const selectedTierMax = TIER_ORDER[state.eggFilter.tier] ?? 99;

    document.querySelectorAll('.egg-card').forEach(card => {
      const seasonMatch = state.eggFilter.season === 'all' || card.dataset.season === state.eggFilter.season;
      const categoryMatch = state.eggFilter.category === 'all' || card.dataset.category === state.eggFilter.category;
      const eggTier = TIER_ORDER[card.dataset.tier] ?? 0;
      const tierMatch = state.eggFilter.tier === 'all' || eggTier <= selectedTierMax;
      card.classList.toggle('hidden', !(seasonMatch && categoryMatch && tierMatch));
    });
  }

  function buildCharacters() {
    const grid = document.getElementById('char-grid');
    if (!grid) return;
    grid.innerHTML = '';

    state.characters.forEach(char => {
      const card = document.createElement('div');
      card.className = 'char-card';
      card.id = `character-${char.id}`;

      const relatedEggsHTML = char.eggIds.map(id => {
        const egg = state.eggs.find(item => item.id === id);
        if (!egg) return '';
        return `<div class="related-egg-link" data-egg-id="${id}">→ ${egg.title}</div>`;
      }).join('');

      const hiddenFactsHTML = char.hiddenFacts
        .map(fact => `<div class="char-fact">${fact}</div>`)
        .join('');

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
          <button class="char-expand-btn">Read more ↓</button>
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
            </div>
          ` : ''}
        </div>
      `;

      card.querySelector('.char-expand-btn').addEventListener('click', event => {
        const full = card.querySelector('.char-full');
        const bio = card.querySelector('.char-bio');
        const button = event.currentTarget;
        const isOpen = full.classList.toggle('open');
        bio.style.display = isOpen ? 'none' : '';
        button.textContent = isOpen ? 'Show less ↑' : 'Read more ↓';
      });

      card.querySelectorAll('.related-egg-link').forEach(link => {
        link.addEventListener('click', () => jumpToEgg(link.dataset.eggId, '#7f3520'));
      });

      grid.appendChild(card);
    });
  }

  function buildMarginalia() {
    const grid = document.getElementById('marginalia-grid');
    if (!grid) return;
    grid.innerHTML = '';

    state.marginalia.forEach(item => {
      const card = document.createElement('div');
      card.className = 'marginalia-card';
      card.id = `marginalia-${item.id}`;
      card.innerHTML = `
        <div class="marginalia-meta">
          <span class="marginalia-location">${item.location}</span>
          <span class="marginalia-ep">${item.episodes}</span>
        </div>
        <div class="marginalia-text">${item.text}</div>
        <div class="marginalia-note">${item.note}</div>
      `;
      grid.appendChild(card);
    });
  }

  function buildBillQuotes() {
    const el = document.getElementById('bill-quote-text');
    if (!el || !state.quotes.length) return;

    let index = Math.floor(Math.random() * state.quotes.length);
    el.textContent = state.quotes[index].quote;

    window.setInterval(() => {
      el.classList.add('fading');
      window.setTimeout(() => {
        index = (index + 1) % state.quotes.length;
        el.textContent = state.quotes[index].quote;
        el.classList.remove('fading');
      }, 400);
    }, 7000);
  }

  function buildCipherHunt() {
    const seasonOneGrid = document.getElementById('hunt-grid-s1');
    const seasonTwoGrid = document.getElementById('hunt-grid-s2');
    if (!seasonOneGrid || !seasonTwoGrid) return;

    const storageKey = 'gf-cipher-hunt-solved';
    const solved = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'));

    function saveSolved() {
      localStorage.setItem(storageKey, JSON.stringify([...solved]));
    }

    function updateProgress() {
      const total = state.cipherhunt.length;
      const count = solved.size;
      const fill = document.getElementById('hunt-progress-fill');
      document.getElementById('hunt-solved-count').textContent = String(count);
      document.getElementById('hunt-total-count').textContent = String(total);
      if (fill) fill.style.width = `${total ? (count / total) * 100 : 0}%`;
    }

    state.cipherhunt.forEach(item => {
      const grid = item.season === 1 ? seasonOneGrid : seasonTwoGrid;
      const wrapper = document.createElement('div');

      const row = document.createElement('div');
      row.className = `hunt-row${solved.has(item.id) ? ' solved' : ''}`;
      row.innerHTML = `
        <span class="hunt-ep">S${item.season}E${item.episode}</span>
        <div class="hunt-main">
          <div class="hunt-title">${item.episodeTitle}</div>
          <div class="hunt-encoded">${item.encoded}</div>
        </div>
        <div class="hunt-actions">
          <button class="hunt-decode-btn" type="button">Decode ↗</button>
          <button class="hunt-reveal-btn" type="button">Answer</button>
        </div>
        <div class="hunt-check${solved.has(item.id) ? ' checked' : ''}" title="Mark as solved">✓</div>
      `;

      const answerRow = document.createElement('div');
      answerRow.className = 'hunt-answer-row';
      answerRow.innerHTML = `"${item.decoded}"<div class="hunt-hint">${item.hint}</div>`;

      row.querySelector('.hunt-decode-btn').addEventListener('click', () => loadCipherIntoDecoder(item));
      row.querySelector('.hunt-reveal-btn').addEventListener('click', event => {
        answerRow.classList.toggle('open');
        event.currentTarget.textContent = answerRow.classList.contains('open') ? 'Hide' : 'Answer';
      });
      row.querySelector('.hunt-check').addEventListener('click', event => {
        const check = event.currentTarget;
        if (solved.has(item.id)) {
          solved.delete(item.id);
          check.classList.remove('checked');
          row.classList.remove('solved');
        } else {
          solved.add(item.id);
          check.classList.add('checked');
          row.classList.add('solved');
        }
        saveSolved();
        updateProgress();
      });

      wrapper.appendChild(row);
      wrapper.appendChild(answerRow);
      grid.appendChild(wrapper);
    });

    document.getElementById('hunt-reset-btn')?.addEventListener('click', () => {
      if (!window.confirm('Reset all cipher hunt progress?')) return;
      solved.clear();
      saveSolved();
      document.querySelectorAll('.hunt-row').forEach(row => row.classList.remove('solved'));
      document.querySelectorAll('.hunt-check').forEach(check => check.classList.remove('checked'));
      document.querySelectorAll('.hunt-answer-row').forEach(answer => answer.classList.remove('open'));
      document.querySelectorAll('.hunt-reveal-btn').forEach(button => { button.textContent = 'Answer'; });
      updateProgress();
    });

    updateProgress();
  }

  function buildEpisodeIndex() {
    const seasonOneGrid = document.getElementById('ep-grid-s1');
    const seasonTwoGrid = document.getElementById('ep-grid-s2');
    if (!seasonOneGrid || !seasonTwoGrid) return;

    const eggsByEpisode = new Map();
    const ciphersByEpisode = new Map();

    state.eggs.forEach(egg => {
      const key = `${egg.season}-${egg.episode}`;
      eggsByEpisode.set(key, [...(eggsByEpisode.get(key) || []), egg]);
    });

    state.cipherhunt.forEach(cipher => {
      const key = `${cipher.season}-${cipher.episode}`;
      ciphersByEpisode.set(key, [...(ciphersByEpisode.get(key) || []), cipher]);
    });

    function buildGrid(season, gridEl) {
      gridEl.innerHTML = '';

      state.episodes
        .filter(episode => episode.season === season)
        .forEach(episode => {
          const key = `${episode.season}-${episode.episode}`;
          const linkedEggs = eggsByEpisode.get(key) || [];
          const linkedCiphers = ciphersByEpisode.get(key) || [];

          const row = document.createElement('div');
          row.className = 'ep-row';
          row.id = `episode-${episode.season}-${episode.episode}`;

          row.innerHTML = `
            <div class="ep-header">
              <span class="ep-num">S${episode.season}E${String(episode.episode).padStart(2, '0')}</span>
              <div class="ep-title-wrap">
                <div class="ep-title">${episode.title}</div>
              </div>
              <div class="ep-badges">
                ${linkedEggs.length ? `<span class="ep-badge-count ep-badge-egg">🥚 ${linkedEggs.length}</span>` : ''}
                ${linkedCiphers.length ? `<span class="ep-badge-count ep-badge-cipher">⌬ ${linkedCiphers.length}</span>` : ''}
                <span class="ep-chevron">▼</span>
              </div>
            </div>
            <div class="ep-body">
              <p class="ep-desc">${episode.description}</p>
              ${linkedEggs.length ? `
                <div class="ep-links-section">
                  <div class="ep-links-label">Easter Eggs (${linkedEggs.length})</div>
                  <div class="ep-links-list">
                    ${linkedEggs.map(egg => `
                      <span class="ep-link-item" data-scroll-to="${egg.id}">
                        <span class="ep-link-dot egg"></span>${egg.title}
                      </span>`).join('')}
                  </div>
                </div>` : ''}
              ${linkedCiphers.length ? `
                <div class="ep-links-section">
                  <div class="ep-links-label">End-Credits Cipher</div>
                  <div class="ep-links-list">
                    ${linkedCiphers.map(cipher => `
                      <span class="ep-link-item" data-load-cipher="${cipher.id}">
                        <span class="ep-link-dot cipher"></span>${cipher.encoded} → <em>load into decoder</em>
                      </span>`).join('')}
                  </div>
                </div>` : ''}
              ${!linkedEggs.length && !linkedCiphers.length ? '<p class="ep-empty">No linked entries yet for this episode.</p>' : ''}
            </div>
          `;

          row.querySelector('.ep-header').addEventListener('click', () => row.classList.toggle('open'));

          row.querySelectorAll('[data-scroll-to]').forEach(link => {
            link.addEventListener('click', event => {
              event.stopPropagation();
              jumpToEgg(link.dataset.scrollTo, '#4a8850');
            });
          });

          row.querySelectorAll('[data-load-cipher]').forEach(link => {
            link.addEventListener('click', event => {
              event.stopPropagation();
              const cipher = state.cipherhunt.find(item => item.id === link.dataset.loadCipher);
              if (cipher) loadCipherIntoDecoder(cipher);
            });
          });

          gridEl.appendChild(row);
        });
    }

    buildGrid(1, seasonOneGrid);
    buildGrid(2, seasonTwoGrid);

    document.querySelectorAll('.ep-tab').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.ep-tab').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        const season = button.dataset.season;
        seasonOneGrid.style.display = season === '1' ? '' : 'none';
        seasonTwoGrid.style.display = season === '2' ? '' : 'none';
      });
    });
  }

  function buildJournals() {
    const grid = document.getElementById('journals-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const spineColors = { blue: '#2a4a7a', red: '#7a2a2a', gold: '#8a6a10', all: '#4a3a1a' };
    const badgeColors = { blue: '#3a6aa8', red: '#a83a3a', gold: '#b88a20', all: '#6a5a2a' };

    state.journals.forEach(item => {
      const label = item.number ? `Journal ${item.number}` : 'The Three Combined';
      const card = document.createElement('div');
      card.className = `journal-card${item.color === 'all' ? ' journal-combined' : ''}`;
      card.id = `journal-${item.id}`;
      card.innerHTML = `
        <div class="journal-card-spine" style="background:${spineColors[item.color] || '#4a4a4a'}"></div>
        <div class="journal-card-header" style="background:rgba(255,255,255,0.3)">
          <div class="journal-number-badge" style="background:${badgeColors[item.color] || '#6a6a6a'};color:#f2e8d0">
            ${item.number || '∞'}
          </div>
          <div class="journal-card-meta">
            <div class="journal-title">${label}</div>
            <div class="journal-owner">${item.owner}</div>
          </div>
        </div>
        <div class="journal-card-body">
          <p class="journal-bio">${item.bio}</p>
          <div class="journal-contents-label">Key contents</div>
          <ul class="journal-contents-list">
            ${item.keyContents.map(content => `<li>${content}</li>`).join('')}
          </ul>
          <div class="journal-hidden-detail">${item.hiddenDetail}</div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function buildTheories() {
    const grid = document.getElementById('theories-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const labels = {
      unsolved: 'Unsolved',
      'partially-solved': 'Partially solved',
    };

    state.theories.forEach(item => {
      const card = document.createElement('div');
      card.className = 'theory-card';
      card.dataset.status = item.status;
      card.id = `theory-${item.id}`;

      card.innerHTML = `
        <div class="theory-header">
          <span class="theory-status-badge ${item.status === 'unsolved' ? 'unsolved' : 'partially-solved'}">${labels[item.status] || item.status}</span>
          <div class="theory-title">${item.title}</div>
          <span class="theory-chevron">▼</span>
        </div>
        <div class="theory-body">
          <p class="theory-summary">${item.summary}</p>
          <div class="theory-evidence-label">Evidence</div>
          <ul class="theory-evidence-list">
            ${item.evidence.map(evidence => `<li>${evidence}</li>`).join('')}
          </ul>
          <div class="theory-leading">
            <div class="theory-leading-label">Leading theory</div>
            ${item.leadingTheory}
          </div>
        </div>
      `;

      card.querySelector('.theory-header').addEventListener('click', () => card.classList.toggle('open'));
      grid.appendChild(card);
    });

    document.querySelectorAll('.theories-filter').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.theories-filter').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        const filter = button.dataset.filter;
        document.querySelectorAll('.theory-card').forEach(card => {
          card.classList.toggle('hidden', filter !== 'all' && card.dataset.status !== filter);
        });
      });
    });
  }

  function buildZodiac() {
    const detail = document.getElementById('zodiac-detail-inner');
    const nodes = document.querySelectorAll('.znode');
    if (!detail || !nodes.length || !state.zodiac.length) return;

    const finaleLabels = {
      active: 'Active in the finale',
      inactive: 'Did not reach the wheel',
      broken: 'Slot broken',
    };

    function showDetail(item) {
      detail.className = 'zodiac-detail-inner';
      detail.innerHTML = `
        <div class="zodiac-detail-symbol">${item.symbol}</div>
        <div class="zodiac-detail-label">${item.label}</div>
        <div class="zodiac-detail-character">${item.character}</div>
        <div class="zodiac-detail-desc">${item.description}</div>
        <div class="zodiac-finale-block ${item.finaleRole}">
          <div class="zodiac-finale-label">${finaleLabels[item.finaleRole] || item.finaleRole}</div>
          <div class="zodiac-finale-note">${item.finaleNote}</div>
        </div>
      `;
    }

    nodes.forEach((node, index) => {
      const item = state.zodiac[index];
      if (!item) return;

      node.addEventListener('click', () => {
        nodes.forEach(n => n.classList.remove('selected'));
        node.classList.add('selected');
        showDetail(item);
      });

      node.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          node.click();
        }
      });
    });
  }

  function wireArchiveExplorer() {
    const input = document.getElementById('archive-search');
    const results = document.getElementById('archive-search-results');
    const status = document.getElementById('archive-search-status');
    const randomBtn = document.getElementById('archive-random-btn');
    if (!input || !results || !status || !randomBtn) return;

    function renderEntries(entries, message) {
      results.innerHTML = '';
      status.textContent = message;

      entries.forEach(entry => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'archive-result';
        button.dataset.type = entry.type;
        button.innerHTML = `
          <span class="archive-result-mark" aria-hidden="true"></span>
          <span class="archive-result-body">
            <span class="archive-result-type">${entry.typeLabel}</span>
            <span class="archive-result-title">${entry.title}</span>
            <span class="archive-result-blurb">${entry.blurb}</span>
          </span>
          <span class="archive-result-jump">Open</span>
        `;
        button.addEventListener('click', () => openArchiveEntry(entry));
        results.appendChild(button);
      });
    }

    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      if (!query) {
        results.innerHTML = '';
        status.textContent = 'Start typing to search across the full archive.';
        return;
      }

      const ranked = state.archiveEntries
        .map(entry => ({ entry, score: scoreArchiveEntry(entry, query) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(item => item.entry);

      if (!ranked.length) {
        results.innerHTML = '';
        status.textContent = `No files matched "${input.value.trim()}". Try a character, object, or episode keyword.`;
        return;
      }

      renderEntries(ranked, `${ranked.length} file${ranked.length === 1 ? '' : 's'} found for "${input.value.trim()}".`);
    });

    randomBtn.addEventListener('click', () => {
      const randomEntry = state.archiveEntries[Math.floor(Math.random() * state.archiveEntries.length)];
      if (!randomEntry) return;
      renderEntries([randomEntry], 'Random file pulled from the archives.');
    });
  }

  function buildArchiveEntries() {
    const entries = [];

    state.eggs.forEach(egg => {
      entries.push({
        id: egg.id,
        type: 'egg',
        typeLabel: 'Easter egg',
        title: egg.title,
        blurb: `${egg.hint.slice(0, 116)}${egg.hint.length > 116 ? '…' : ''}`,
        searchText: `${egg.title} ${egg.hint} ${egg.spoiler} season ${egg.season} episode ${egg.episode} ${egg.category}`,
        open: () => jumpToEgg(egg.id, '#4a8850'),
      });
    });

    state.cipherhunt.forEach(cipher => {
      entries.push({
        id: cipher.id,
        type: 'cipher',
        typeLabel: 'Cipher',
        title: `${cipher.episodeTitle} cipher`,
        blurb: cipher.encoded,
        searchText: `${cipher.episodeTitle} ${cipher.encoded} ${cipher.decoded} ${cipher.hint} season ${cipher.season} episode ${cipher.episode}`,
        open: () => loadCipherIntoDecoder(cipher),
      });
    });

    state.characters.forEach(character => {
      entries.push({
        id: character.id,
        type: 'character',
        typeLabel: 'Character',
        title: character.name,
        blurb: character.role,
        searchText: `${character.name} ${character.role} ${character.bio} ${character.hiddenFacts.join(' ')}`,
        open: () => scrollToElement(`character-${character.id}`, 'characters'),
      });
    });

    state.episodes.forEach(episode => {
      entries.push({
        id: `${episode.season}-${episode.episode}`,
        type: 'episode',
        typeLabel: 'Episode',
        title: `S${episode.season}E${String(episode.episode).padStart(2, '0')} — ${episode.title}`,
        blurb: episode.description,
        searchText: `${episode.title} ${episode.description} ${episode.tags.join(' ')} season ${episode.season} episode ${episode.episode}`,
        open: () => openEpisode(episode.season, episode.episode),
      });
    });

    state.journals.forEach(journal => {
      const label = journal.number ? `Journal ${journal.number}` : 'The Three Combined';
      entries.push({
        id: journal.id,
        type: 'journal',
        typeLabel: 'Journal',
        title: label,
        blurb: journal.owner,
        searchText: `${label} ${journal.owner} ${journal.bio} ${journal.keyContents.join(' ')} ${journal.hiddenDetail}`,
        open: () => scrollToElement(`journal-${journal.id}`, 'journals'),
      });
    });

    state.marginalia.forEach(item => {
      entries.push({
        id: item.id,
        type: 'marginalia',
        typeLabel: 'Marginalia',
        title: item.location,
        blurb: item.text,
        searchText: `${item.location} ${item.episodes} ${item.text} ${item.note}`,
        open: () => scrollToElement(`marginalia-${item.id}`, 'marginalia'),
      });
    });

    state.theories.forEach(theory => {
      entries.push({
        id: theory.id,
        type: 'theory',
        typeLabel: 'Open case',
        title: theory.title,
        blurb: theory.summary,
        searchText: `${theory.title} ${theory.summary} ${theory.evidence.join(' ')} ${theory.leadingTheory}`,
        open: () => scrollToElement(`theory-${theory.id}`, 'theories'),
      });
    });

    return entries;
  }

  function scoreArchiveEntry(entry, query) {
    const words = query.split(/\s+/).filter(Boolean);
    if (!words.length) return 0;

    const haystack = entry.searchText.toLowerCase();
    const title = entry.title.toLowerCase();
    let score = 0;

    for (const word of words) {
      if (!haystack.includes(word)) return 0;
      score += title.includes(word) ? 5 : 2;
      if (title.startsWith(word)) score += 2;
    }

    return score;
  }

  function openArchiveEntry(entry) {
    entry.open();
  }

  function openEpisode(season, episode) {
    const tab = document.querySelector(`.ep-tab[data-season="${season}"]`);
    tab?.click();
    scrollToSection('episodes');
    window.setTimeout(() => {
      const row = document.getElementById(`episode-${season}-${episode}`);
      if (!row) return;
      row.classList.add('open');
      highlightElement(row, '#4a8850');
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
  }

  function jumpToEgg(eggId, color) {
    resetEggFilters();
    scrollToSection('eggs');
    window.setTimeout(() => {
      const egg = document.getElementById(`egg-${eggId}`);
      if (!egg) return;
      egg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(egg, color);
    }, 400);
  }

  function resetEggFilters() {
    state.eggFilter = { season: 'all', category: 'all', tier: 'all' };
    document.querySelectorAll('.filter-btn[data-season]').forEach(button => {
      button.classList.toggle('active', button.dataset.season === 'all');
    });
    document.querySelectorAll('.filter-btn[data-category]').forEach(button => {
      button.classList.toggle('active', button.dataset.category === 'all');
    });
    document.querySelectorAll('.tier-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.tier === 'all');
    });
    updateEggVisibility();
  }

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function scrollToElement(id, sectionId) {
    scrollToSection(sectionId);
    window.setTimeout(() => {
      const element = document.getElementById(id);
      if (!element) return;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(element, '#7f3520');
    }, 350);
  }

  function highlightElement(element, color) {
    element.style.outline = `2px solid ${color}`;
    element.style.outlineOffset = '4px';
    window.setTimeout(() => {
      element.style.outline = '';
      element.style.outlineOffset = '';
    }, 1800);
  }

  function categoryLabel(category) {
    return {
      background: 'Background detail',
      cryptogram: 'Cryptogram',
      journal: 'Journal page',
    }[category] || category;
  }

  function tierBadgeHTML(tier) {
    const labels = { safe: 'No spoilers', s1: 'After S1', s2: 'After S2', finale: 'Post-finale' };
    return `<span class="badge badge-tier-${tier}">${labels[tier] || tier}</span>`;
  }

  function wireReveals() {
    document.querySelectorAll('.reveal, .reveal-stagger').forEach(element => {
      element.classList.add('is-visible');
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
