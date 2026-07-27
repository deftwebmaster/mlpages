import { formatTime, clamp } from './utils.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

export class UI {
  constructor() {
    this.screens = {};
    $$('.screen').forEach(s => { this.screens[s.id] = s; });
    this.hullFill = $('#hullFill');
    this.heatFill = $('#heatFill');
    this.cargoCount = $('#cargoCount');
    this.cargoQuota = $('#cargoQuota');
    this.objectiveText = $('#objectiveText');
    this.timerReadout = $('#timerReadout');
    this.comboReadout = $('#comboReadout');
    this.extractionBanner = $('#extractionBanner');
    this.radarCanvas = $('#radarCanvas');
    this.radarCtx = this.radarCanvas.getContext('2d');
    this.pauseOverlay = $('#pauseOverlay');
    this.completeOverlay = $('#completeOverlay');
    this.failureOverlay = $('#failureOverlay');
  }

  showScreen(id) {
    for (const key in this.screens) this.screens[key].classList.toggle('active', key === id);
  }

  setLoadingProgress(pct, label) {
    const fill = $('#loadingFill');
    if (fill) fill.style.width = clamp(pct, 0, 100) + '%';
    if (label) $('.loading-label').textContent = label;
  }

  renderMenu(save) {
    $('#installBtn').hidden = !window.__deferredInstallPrompt;
    $('.menu-btn[data-action="continue"]').style.display = save.completed && Object.keys(save.completed).length ? '' : 'none';
  }

  renderMissionGrid(missionDefs, save, onSelect) {
    const grid = $('#missionGrid');
    grid.innerHTML = '';
    missionDefs.forEach((def, i) => {
      const unlocked = def.id <= save.unlockedMissions;
      const card = document.createElement('button');
      card.className = 'mission-card' + (unlocked ? '' : ' locked');
      const rank = save.bestRanks[def.id];
      const score = save.bestScores[def.id];
      card.innerHTML = `
        <div class="num">CONTRACT ${String(def.id).padStart(2, '0')}</div>
        <div class="name">${unlocked ? def.name : 'LOCKED'}</div>
        <div class="score">${unlocked && score ? 'Best: ' + score.toLocaleString() : (unlocked ? 'Not attempted' : '')}</div>
        ${rank ? `<div class="rank">${rank}</div>` : ''}
      `;
      if (unlocked) card.addEventListener('click', () => onSelect(def.id));
      grid.appendChild(card);
    });
  }

  renderStats(save) {
    const s = save.stats;
    const list = $('#statsList');
    const rows = [
      ['Total Salvage Value', s.totalSalvage.toLocaleString()],
      ['Contracts Completed', s.contractsCompleted + ' / 12'],
      ['Distance Flown', Math.round(s.distanceFlown).toLocaleString() + ' units'],
      ['Shots Fired', s.shotsFired.toLocaleString()],
      ['Accuracy', s.shotsFired ? Math.round((s.shotsHit / s.shotsFired) * 100) + '%' : '—'],
      ['Largest Combo', 'x' + s.largestCombo],
      ['Reactor Explosions', s.reactorExplosions],
      ['Play Time', formatTime(s.playTimeSec)],
    ];
    list.innerHTML = rows.map(([k, v]) => `<div class="stat-row"><span>${k}</span><span>${v}</span></div>`).join('');
  }

  bindSettings(save, onChange) {
    const sfx = $('#sfxVolume'), music = $('#musicVolume'), shake = $('#screenShake'),
      reduced = $('#reducedMotion'), contrast = $('#highContrast'), side = $('#controlSide');
    sfx.value = save.settings.sfxVolume;
    music.value = save.settings.musicVolume;
    shake.checked = save.settings.screenShake;
    reduced.checked = save.settings.reducedMotion;
    contrast.checked = save.settings.highContrast;
    side.value = save.settings.controlSide;
    const emit = () => onChange({
      sfxVolume: parseFloat(sfx.value), musicVolume: parseFloat(music.value),
      screenShake: shake.checked, reducedMotion: reduced.checked,
      highContrast: contrast.checked, controlSide: side.value,
    });
    [sfx, music, shake, reduced, contrast, side].forEach(el => el.addEventListener('input', emit));
  }

  applyAccessibility(settings) {
    document.body.classList.toggle('reduced-motion', settings.reducedMotion);
    document.body.classList.toggle('high-contrast', settings.highContrast);
    const controls = $('#mobileControls');
    controls.style.flexDirection = settings.controlSide === 'right' ? 'row-reverse' : 'row';
  }

  renderBrief(def, save) {
    $('#briefEyebrow').textContent = `CONTRACT ${String(def.id).padStart(2, '0')}`;
    $('#briefName').textContent = def.name;
    $('#briefText').textContent = def.brief;
    $('#briefQuota').textContent = def.quota + ' units';
    $('#briefTimer').textContent = def.timer ? formatTime(def.timer) : 'None';
    const best = save.bestScores[def.id];
    $('#briefBest').textContent = best ? best.toLocaleString() + (save.bestRanks[def.id] ? ' (' + save.bestRanks[def.id] + ')' : '') : '—';
    $('#briefOptional').innerHTML = def.optional.map(o => `<div>&#9671; ${o.label}</div>`).join('');
  }

  updateHUD(mission, ship) {
    const hullPct = clamp((ship.hull / ship.maxHull) * 100, 0, 100);
    this.hullFill.style.width = hullPct + '%';
    this.hullFill.className = 'bar-fill' + (hullPct < 25 ? ' warn' : '');

    this.heatFill.style.width = ship.heat + '%';
    this.heatFill.className = 'bar-fill' + (ship.heat >= 100 ? ' critical' : ship.heat >= 70 ? ' hot' : '');

    this.cargoCount.textContent = mission.cargoCollected;
    this.cargoQuota.textContent = mission.quota;

    if (mission.timer) {
      this.timerReadout.hidden = false;
      this.timerReadout.textContent = formatTime(mission.timeRemaining);
    } else {
      this.timerReadout.hidden = true;
    }

    if (mission.gate.active) {
      this.objectiveText.textContent = 'Quota met — proceed to the extraction gate.';
      this.extractionBanner.hidden = false;
    } else {
      this.objectiveText.textContent = `Recover salvage: ${mission.cargoCollected}/${mission.quota}`;
      this.extractionBanner.hidden = true;
    }

    if (mission.combo.mult > 1 && mission.combo.timer > 0) {
      this.comboReadout.hidden = false;
      this.comboReadout.textContent = `${mission.combo.mult}x COMBO`;
    } else {
      this.comboReadout.hidden = true;
    }
  }

  drawRadar(mission, ship) {
    const ctx = this.radarCtx;
    const w = this.radarCanvas.width, h = this.radarCanvas.height;
    const cx = w / 2, cy = h / 2, R = w / 2 - 4;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(139,152,165,0.4)'; ctx.stroke();

    const scale = R / (Math.max(mission.worldW, mission.worldH) * 0.55);
    const plot = (wx, wy, color, size) => {
      let dx = wx - ship.x, dy = wy - ship.y;
      if (dx > mission.worldW / 2) dx -= mission.worldW; if (dx < -mission.worldW / 2) dx += mission.worldW;
      if (dy > mission.worldH / 2) dy -= mission.worldH; if (dy < -mission.worldH / 2) dy += mission.worldH;
      const px = cx + dx * scale, py = cy + dy * scale;
      const d = Math.hypot(px - cx, py - cy);
      if (d > R) return;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2); ctx.fill();
    };

    for (const w2 of mission.wrecks) {
      if (!w2.alive) continue;
      if (w2.level === 0) plot(w2.x, w2.y, w2.def.reactor ? '#ff4d4d' : 'rgba(139,152,165,0.8)', w2.def.reactor ? 2.6 : 2);
    }
    for (const s of mission.salvage) {
      if (s.collected) continue;
      if (s.kind === 'rare' || s.kind === 'blackbox') plot(s.x, s.y, '#c58bff', 2.2);
    }
    if (mission.gate.active) plot(mission.gate.x, mission.gate.y, '#4fd8e8', 3.2);

    ctx.fillStyle = '#eef4f8';
    ctx.beginPath(); ctx.arc(cx, cy, 2.6, 0, Math.PI * 2); ctx.fill();
  }

  showPause(visible) { this.pauseOverlay.hidden = !visible; }

  showComplete(result) {
    $('#rankBadge').textContent = result.rank;
    const rows = [
      ['Salvage Collected', result.cargoValue.toLocaleString()],
      ['Hull Remaining', Math.round(result.hullPct) + '%'],
      ['Mission Time', formatTime(result.time)],
      ['Largest Combo', 'x' + result.largestCombo],
      ['Optional Objectives', `${result.optionalDone}/${result.optionalTotal}`],
      ['Score', result.score.toLocaleString()],
    ];
    $('#resultList').innerHTML = rows.map(([k, v]) => `<div class="row"><span>${k}</span><span class="hi">${v}</span></div>`).join('');
    $('#nextBtn');
    const nextBtn = document.querySelector('[data-action="next-mission"]');
    nextBtn.style.display = result.hasNext ? '' : 'none';
    this.completeOverlay.hidden = false;
  }
  hideComplete() { this.completeOverlay.hidden = true; }

  showFailure(title, reason) {
    $('#failureTitle').textContent = title;
    $('#failureReason').textContent = reason;
    this.failureOverlay.hidden = false;
  }
  hideFailure() { this.failureOverlay.hidden = true; }
}

export function computeScore(mission, ship) {
  let score = mission.cargoValue * 4;
  score += Math.round(mission.wrecksDestroyedTotal * 25);
  score += Math.round(ship.hull * 8);
  score += mission.largestCombo * 60;
  if (mission.shotsFired > 0) {
    score += Math.round((mission.shotsHit / mission.shotsFired) * 400);
  }
  score = Math.max(0, Math.round(score));
  return score;
}

export function computeRank(score, thresholds) {
  if (score >= thresholds['S+']) return 'S+';
  if (score >= thresholds['S']) return 'S';
  if (score >= thresholds['A']) return 'A';
  if (score >= thresholds['B']) return 'B';
  return 'C';
}
