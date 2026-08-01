import { LEVELS } from './levels.js';

const STORAGE_KEY = 'paper-pilot:v2';
const PROGRESS_KEY = 'paper-pilot:progress';
const SETTINGS_KEY = 'paper-pilot:settings';
const TWO_PI = Math.PI * 2;
const MOBILE_QUERY = window.matchMedia('(max-width: 760px)');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const els = {
  body: document.body,
  menuButton: document.getElementById('menuBtn'),
  status: document.getElementById('statusPill'),
  altitude: document.getElementById('altitudeReadout'),
  speed: document.getElementById('speedReadout'),
  stars: document.getElementById('starReadout'),
  time: document.getElementById('timeReadout'),
  score: document.getElementById('scoreReadout'),
  levelSelect: document.getElementById('levelSelect'),
  objective: document.getElementById('objectiveText'),
  attempt: document.getElementById('attemptReadout'),
  best: document.getElementById('bestReadout'),
  launch: document.getElementById('launchBtn'),
  reset: document.getElementById('resetBtn'),
  retry: document.getElementById('retryBtn'),
  undo: document.getElementById('undoBtn'),
  redo: document.getElementById('redoBtn'),
  share: document.getElementById('shareBtn'),
  save: document.getElementById('saveBtn'),
  clear: document.getElementById('clearBtn'),
  hint: document.getElementById('hintPanel'),
  hintTitle: document.getElementById('hintTitle'),
  hintText: document.getElementById('hintText'),
  resultModal: document.getElementById('resultModal'),
  resultGrade: document.getElementById('resultGrade'),
  resultTitle: document.getElementById('resultTitle'),
  resultText: document.getElementById('resultText'),
  resultScore: document.getElementById('resultScore'),
  resultTime: document.getElementById('resultTime'),
  resultStars: document.getElementById('resultStars'),
  resultRetry: document.getElementById('resultRetry'),
  resultNext: document.getElementById('resultNext'),
  menuModal: document.getElementById('menuModal'),
  menuPlay: document.getElementById('menuPlay'),
  menuSettings: document.getElementById('menuSettings'),
  menuShare: document.getElementById('menuShare'),
  menuReset: document.getElementById('menuReset'),
  menuCompleted: document.getElementById('menuCompleted'),
  menuBest: document.getElementById('menuBest'),
  settingsModal: document.getElementById('settingsModal'),
  soundToggle: document.getElementById('soundToggle'),
  motionToggle: document.getElementById('motionToggle'),
  focusToggle: document.getElementById('focusToggle'),
  settingsClose: document.getElementById('settingsClose'),
  shareModal: document.getElementById('shareModal'),
  shareText: document.getElementById('shareText'),
  copyShare: document.getElementById('copyShare'),
  importShare: document.getElementById('importShare'),
  shareClose: document.getElementById('shareClose')
};

const state = {
  tool: 'draw',
  railType: 'lift',
  levelIndex: loadSavedLevelIndex(),
  level: null,
  strokes: [],
  redo: [],
  collected: new Set(),
  attempts: 0,
  flightTime: 0,
  score: 0,
  result: null,
  progress: loadProgress(),
  settings: loadSettings(),
  menuOpen: true,
  particles: [],
  currentStroke: null,
  drawing: false,
  panning: false,
  aiming: false,
  gesture: null,
  lastPointer: null,
  simRunning: false,
  savedAt: 0,
  camera: { x: 0, y: 0, zoom: 1 },
  launch: {
    pos: { x: 140, y: 420 },
    angle: -0.32,
    power: 420
  },
  plane: createPlane(),
  pointerMap: new Map()
};

let dpr = 1;
let view = { width: 0, height: 0 };
let lastTime = performance.now();
let toastTimer = 0;
let toastText = '';
let audioContext = null;

init();

function init() {
  applySettings();
  populateLevels();
  setupLevel(state.levelIndex);
  resize();
  bindUi();
  bindCanvas();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
  showToast('Collect every star, then land softly.');
  updateMenuStats();
}

function bindUi() {
  document.querySelectorAll('[data-tool]').forEach((button) => {
    button.addEventListener('click', () => setTool(button.dataset.tool));
  });
  document.querySelectorAll('[data-rail]').forEach((button) => {
    button.addEventListener('click', () => setRailType(button.dataset.rail));
  });

  els.levelSelect.addEventListener('change', () => setupLevel(Number(els.levelSelect.value)));
  els.launch.addEventListener('click', launchPlane);
  els.reset.addEventListener('click', () => {
    resetPlane();
    showToast('Plane reset.');
  });
  els.retry.addEventListener('click', retryChallenge);
  els.undo.addEventListener('click', undoStroke);
  els.redo.addEventListener('click', redoStroke);
  els.share.addEventListener('click', openShareModal);
  els.save.addEventListener('click', () => {
    saveSketch();
    showToast('Sketch saved locally.');
  });
  els.clear.addEventListener('click', clearSketch);
  els.resultRetry.addEventListener('click', retryChallenge);
  els.resultNext.addEventListener('click', nextChallenge);
  els.menuButton.addEventListener('click', openMenu);
  els.menuPlay.addEventListener('click', closeMenu);
  els.menuSettings.addEventListener('click', openSettings);
  els.menuShare.addEventListener('click', openShareModal);
  els.menuReset.addEventListener('click', resetProgress);
  els.settingsClose.addEventListener('click', closeSettings);
  els.soundToggle.addEventListener('change', () => updateSetting('soundEnabled', els.soundToggle.checked));
  els.motionToggle.addEventListener('change', () => updateSetting('reducedMotion', els.motionToggle.checked));
  els.focusToggle.addEventListener('change', () => updateSetting('focusMode', els.focusToggle.checked));
  els.copyShare.addEventListener('click', copyShareCode);
  els.importShare.addEventListener('click', importShareCode);
  els.shareClose.addEventListener('click', closeShareModal);

  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement) return;
    const key = event.key.toLowerCase();
    if (key === 'd') setTool('draw');
    if (key === 'e') setTool('erase');
    if (key === 'p') setTool('pan');
    if (key === 'escape') {
      if (!els.shareModal.hidden) closeShareModal();
      else if (!els.settingsModal.hidden) closeSettings();
      else if (!state.menuOpen) openMenu();
      else closeMenu();
    }
    if (key === 'r') retryChallenge();
    if (key === 'n' && state.result?.success) nextChallenge();
    if (key === ' ') {
      event.preventDefault();
      state.simRunning ? resetPlane() : launchPlane();
    }
    if ((event.metaKey || event.ctrlKey) && key === 'z') {
      event.preventDefault();
      event.shiftKey ? redoStroke() : undoStroke();
    }
    if ((event.metaKey || event.ctrlKey) && key === 's') {
      event.preventDefault();
      saveSketch();
      showToast('Sketch saved locally.');
    }
  });
}

function bindCanvas() {
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
}

function resize() {
  dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
  view.width = Math.max(1, window.innerWidth);
  view.height = Math.max(1, window.innerHeight);
  canvas.width = Math.round(view.width * dpr);
  canvas.height = Math.round(view.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!state.camera.ready) {
    state.camera.x = 36;
    state.camera.y = Math.max(90, view.height * 0.16);
    state.camera.ready = true;
  }
}

function frame(now) {
  const dt = Math.min(0.032, Math.max(0.001, (now - lastTime) / 1000));
  lastTime = now;
  if (state.simRunning) stepPlane(dt);
  updateParticles(dt);
  render();
  updateReadouts();
  updateChromeMode();
  requestAnimationFrame(frame);
}

function populateLevels() {
  els.levelSelect.innerHTML = LEVELS.map((level, index) => {
    const best = state.progress.bestScores?.[level.id];
    const locked = !isLevelUnlocked(index);
    return `<option value="${index}" ${locked ? 'disabled' : ''}>${index + 1}. ${level.name}${locked ? ' - locked' : best ? ` - best ${best}` : ''}</option>`;
  }).join('');
}

function setupLevel(index) {
  let boundedIndex = clamp(index, 0, LEVELS.length - 1);
  if (!isLevelUnlocked(boundedIndex)) {
    boundedIndex = highestUnlockedLevelIndex();
    showToast('Complete the previous challenge to unlock that route.');
  }
  const level = LEVELS[boundedIndex];
  const saved = loadLevelSketch(level.id);
  state.levelIndex = boundedIndex;
  state.level = level;
  state.strokes = saved?.strokes?.length ? saved.strokes : cloneStrokes(level.strokes);
  state.launch = saved?.launch?.pos ? cloneLaunch(saved.launch) : cloneLaunch(level.launch);
  state.camera = saved?.camera ? { ...level.camera, ...saved.camera, ready: true } : { ...level.camera, ready: true };
  state.redo = [];
  state.collected = new Set();
  state.attempts = 0;
  state.flightTime = 0;
  state.score = 0;
  state.result = null;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedLevel: level.id }));
  els.levelSelect.value = String(boundedIndex);
  hideResult();
  resetPlane();
  updateLevelUi();
}

function isLevelUnlocked(index) {
  if (index <= 0) return true;
  const previous = LEVELS[index - 1];
  return state.progress.completed?.includes(previous.id);
}

function highestUnlockedLevelIndex() {
  let highest = 0;
  for (let i = 1; i < LEVELS.length; i += 1) {
    if (isLevelUnlocked(i)) highest = i;
  }
  return highest;
}

function createPlane() {
  return {
    pos: { x: 140, y: 420 },
    vel: { x: 0, y: 0 },
    angle: -0.32,
    spin: 0,
    wind: 0,
    trail: [],
    grounded: false
  };
}

function resetPlane() {
  state.simRunning = false;
  state.plane = createPlane();
  state.plane.pos = { ...state.launch.pos };
  state.plane.angle = state.launch.angle;
  state.flightTime = 0;
  state.score = 0;
  state.result = null;
  state.collected = new Set();
  hideResult();
  els.launch.textContent = 'Launch';
  els.status.textContent = 'Editor';
  updateLevelUi();
}

function launchPlane() {
  resetPlane();
  playTone('launch');
  const angle = state.launch.angle;
  state.plane.vel.x = Math.cos(angle) * state.launch.power;
  state.plane.vel.y = Math.sin(angle) * state.launch.power;
  state.attempts += 1;
  state.flightTime = 0;
  state.simRunning = true;
  els.launch.textContent = 'Flying';
  els.status.textContent = 'In Flight';
  updateLevelUi();
  showToast('Airborne.');
}

function stepPlane(dt) {
  const p = state.plane;
  const previous = { x: p.pos.x, y: p.pos.y };
  const lift = sampleWind(p.pos);
  const speed = len(p.vel);
  const forward = angleVector(p.angle);
  const desiredAngle = Math.atan2(p.vel.y, p.vel.x);
  const angleDelta = normalizeAngle(desiredAngle - p.angle);

  p.wind = lift.strength;
  p.vel.x += lift.x * dt;
  p.vel.y += (360 + lift.y) * dt;
  p.vel.x += forward.x * (18 + lift.strength * 16) * dt;
  p.vel.x *= 1 - Math.min(0.08, dt * 0.34);
  p.vel.y *= 1 - Math.min(0.06, dt * 0.2);
  p.spin += angleDelta * 8 * dt;
  p.spin += lift.roll * dt;
  p.spin += Math.sin(performance.now() * 0.012 + p.pos.x * 0.02) * lift.strength * 0.18 * dt;
  p.spin *= 1 - Math.min(0.25, dt * 2.4);
  p.angle += p.spin * dt;

  const stall = Math.max(0, 105 - speed) / 105;
  p.vel.y += stall * 170 * dt;

  p.pos.x += p.vel.x * dt;
  p.pos.y += p.vel.y * dt;
  state.flightTime += dt;
  collectStars();
  state.score = scoreFlight(false);

  if (checkLanding(previous)) return;
  if (state.flightTime > state.level.parTime + 22) {
    endFlight(false, 'Lost In The Breeze', 'The plane drifted past the scoring window. Adjust the wind and try a cleaner route.');
    return;
  }

  if (p.pos.y > 720) {
    p.pos.y = 720;
    p.vel.y *= -0.14;
    p.vel.x *= 0.76;
    p.spin *= 0.3;
    p.grounded = true;
    if (Math.abs(p.vel.x) < 18 && Math.abs(p.vel.y) < 18) {
      endFlight(false, 'Missed The Landing', 'The plane settled outside the landing zone. Pull the final rail toward the target.');
      return;
    }
  }

  p.trail.push({ x: p.pos.x, y: p.pos.y, a: 1, wind: p.wind || 0 });
  if (p.trail.length > 130) p.trail.shift();
  for (const point of p.trail) point.a *= 0.988;

  const screen = worldToScreen(p.pos);
  const margin = 180;
  if (screen.x > view.width - margin) state.camera.x -= (screen.x - (view.width - margin)) * 0.04;
  if (screen.x < margin) state.camera.x += (margin - screen.x) * 0.04;
  if (screen.y < margin) state.camera.y += (margin - screen.y) * 0.035;
  if (screen.y > view.height - margin) state.camera.y -= (screen.y - (view.height - margin)) * 0.035;
}

function sampleWind(pos) {
  const result = { x: 0, y: 0, roll: 0, strength: 0 };
  const maxSegments = 650;
  let sampled = 0;
  for (const stroke of state.strokes) {
    const points = stroke.points;
    for (let i = 1; i < points.length; i += 1) {
      sampled += 1;
      if (sampled > maxSegments) return result;
      const a = points[i - 1];
      const b = points[i];
      const closest = closestPointOnSegment(pos, a, b);
      const radius = stroke.type === 'gust' ? 58 : 48;
      if (closest.distance > radius) continue;
      const tangent = norm({ x: b.x - a.x, y: b.y - a.y });
      const falloff = (1 - closest.distance / radius) ** 2;
      const normal = { x: -tangent.y, y: tangent.x };
      const align = stroke.type === 'gust' ? 520 : 280;
      const lift = stroke.type === 'gust' ? -90 : -260;
      result.x += tangent.x * align * falloff + normal.x * lift * falloff;
      result.y += tangent.y * align * falloff + normal.y * lift * falloff;
      result.roll += (tangent.y * 2.4 + normal.x * 0.6) * falloff;
      result.strength = Math.max(result.strength, falloff);
    }
  }
  return result;
}

function onPointerDown(event) {
  canvas.setPointerCapture(event.pointerId);
  state.pointerMap.set(event.pointerId, { x: event.clientX, y: event.clientY });
  state.lastPointer = { x: event.clientX, y: event.clientY };
  const world = screenToWorld({ x: event.clientX, y: event.clientY });

  if (state.pointerMap.size === 2) {
    cancelActivePointerAction();
    startPinchGesture();
    return;
  }

  if (!state.simRunning && isNearLaunchHandle(world)) {
    state.aiming = true;
    updateLaunchFromPoint(world);
    els.status.textContent = 'Aiming';
  } else if (state.tool === 'draw') {
    state.drawing = true;
    state.currentStroke = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      type: state.railType,
      points: [world]
    };
    state.redo.length = 0;
  } else if (state.tool === 'erase') {
    eraseAt(world);
  } else {
    state.panning = true;
  }
}

function onPointerMove(event) {
  const previous = state.pointerMap.get(event.pointerId);
  state.pointerMap.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (state.gesture?.pinching && state.pointerMap.size >= 2) {
    updatePinchGesture();
    return;
  }
  const world = screenToWorld({ x: event.clientX, y: event.clientY });

  if (state.drawing && state.currentStroke) {
    const points = state.currentStroke.points;
    const last = points[points.length - 1];
    if (dist(last, world) > 7 / state.camera.zoom) {
      points.push(world);
    }
  } else if (state.aiming) {
    updateLaunchFromPoint(world);
  } else if (state.tool === 'erase' && event.buttons) {
    eraseAt(world);
  } else if (state.panning && previous) {
    state.camera.x += event.clientX - previous.x;
    state.camera.y += event.clientY - previous.y;
  }
}

function onPointerUp(event) {
  state.pointerMap.delete(event.pointerId);
  if (state.gesture?.pinching) {
    state.gesture = null;
    state.panning = false;
    return;
  }
  if (state.drawing && state.currentStroke) {
    const stroke = simplifyStroke(state.currentStroke);
    if (stroke.points.length > 1) state.strokes.push(stroke);
    state.currentStroke = null;
    state.drawing = false;
    saveSketch({ quiet: true });
  }
  state.panning = false;
  if (state.aiming) {
    state.aiming = false;
    els.status.textContent = state.simRunning ? 'In Flight' : 'Editor';
    saveSketch({ quiet: true });
  }
}

function cancelActivePointerAction() {
  state.currentStroke = null;
  state.drawing = false;
  state.aiming = false;
  state.panning = false;
}

function startPinchGesture() {
  const points = [...state.pointerMap.values()];
  const center = midpoint(points[0], points[1]);
  state.gesture = {
    pinching: true,
    startDistance: Math.max(1, dist(points[0], points[1])),
    startZoom: state.camera.zoom,
    centerWorld: screenToWorld(center)
  };
}

function updatePinchGesture() {
  const points = [...state.pointerMap.values()];
  if (points.length < 2) return;
  const center = midpoint(points[0], points[1]);
  const distance = Math.max(1, dist(points[0], points[1]));
  const nextZoom = clamp(state.gesture.startZoom * (distance / state.gesture.startDistance), 0.45, 2.2);
  state.camera.zoom = nextZoom;
  const screenAfter = worldToScreen(state.gesture.centerWorld);
  state.camera.x += center.x - screenAfter.x;
  state.camera.y += center.y - screenAfter.y;
}

function onWheel(event) {
  event.preventDefault();
  const before = screenToWorld({ x: event.clientX, y: event.clientY });
  const factor = event.deltaY > 0 ? 0.9 : 1.1;
  state.camera.zoom = clamp(state.camera.zoom * factor, 0.45, 2.2);
  const after = worldToScreen(before);
  state.camera.x += event.clientX - after.x;
  state.camera.y += event.clientY - after.y;
}

function setTool(tool) {
  state.tool = tool;
  document.querySelectorAll('[data-tool]').forEach((button) => {
    const active = button.dataset.tool === tool;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  canvas.style.cursor = tool === 'pan' ? 'grab' : tool === 'erase' ? 'cell' : 'crosshair';
}

function setRailType(type) {
  state.railType = type;
  document.querySelectorAll('[data-rail]').forEach((button) => {
    const active = button.dataset.rail === type;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function undoStroke() {
  const stroke = state.strokes.pop();
  if (!stroke) return;
  state.redo.push(stroke);
  saveSketch({ quiet: true });
  showToast('Undid last rail.');
}

function redoStroke() {
  const stroke = state.redo.pop();
  if (!stroke) return;
  state.strokes.push(stroke);
  saveSketch({ quiet: true });
  showToast('Redid rail.');
}

function retryChallenge() {
  hideResult();
  closeMenu();
  resetPlane();
  showToast('Attempt reset.');
}

function nextChallenge() {
  const nextIndex = (state.levelIndex + 1) % LEVELS.length;
  setupLevel(nextIndex);
  showToast(`Loaded ${state.level.name}.`);
}

function clearSketch() {
  if (!state.strokes.length) return;
  state.redo.push(...state.strokes.splice(0));
  saveSketch({ quiet: true });
  resetPlane();
  showToast('Sketch cleared. Redo restores rails one at a time.');
}

function collectStars() {
  state.level.stars.forEach((star, index) => {
    if (state.collected.has(index)) return;
    if (dist(state.plane.pos, star) < 34) {
      state.collected.add(index);
      spawnBurst(star.x, star.y, '#f5b83b', 18, 150);
      playTone('star');
      showToast('Star collected.');
    }
  });
}

function checkLanding(previous) {
  const pad = state.level.landing;
  const p = state.plane;
  const crossedPad = previous.y <= pad.y && p.pos.y >= pad.y - 2;
  const onPad = Math.abs(p.pos.x - pad.x) <= pad.width / 2;
  if (!crossedPad || !onPad || p.vel.y < 0) return false;

  p.pos.y = pad.y;
  const speed = len(p.vel);
  const angleOk = Math.abs(normalizeAngle(p.angle - pad.angle)) < 0.72;
  const soft = speed < 260 && p.vel.y < 220 && angleOk;
  if (state.collected.size < state.level.stars.length) {
    endFlight(false, 'Cargo Missing', 'You reached the pad, but every star has to be collected before landing.');
  } else if (!soft) {
    endFlight(false, 'Hard Landing', 'The plane found the pad, but came in too hot. Use a lift rail to bleed speed.');
  } else {
    endFlight(true, 'Clean Landing', 'Route complete. The paper plane touched down with every star collected.');
  }
  return true;
}

function endFlight(success, title, message) {
  state.simRunning = false;
  state.result = { success, title, message };
  state.score = scoreFlight(success);
  els.launch.textContent = 'Launch';
  els.status.textContent = success ? 'Complete' : 'Try Again';
  if (success) {
    spawnBurst(state.plane.pos.x, state.plane.pos.y - 8, '#48aa68', 30, 210);
    playTone('success');
  } else {
    spawnBurst(state.plane.pos.x, state.plane.pos.y - 8, '#d94d5c', 18, 120);
    playTone('fail');
  }
  if (success) recordBestScore();
  showResult(success, title, message);
  updateLevelUi();
}

function scoreFlight(success) {
  const starScore = state.collected.size * 1000;
  const timeBonus = Math.max(0, Math.round((state.level?.parTime || 0) * 80 - state.flightTime * 80));
  const attemptPenalty = Math.max(0, state.attempts - 1) * 120;
  const landingBonus = success ? 1400 : 0;
  return Math.max(0, starScore + timeBonus + landingBonus - attemptPenalty);
}

function recordBestScore() {
  const id = state.level.id;
  const current = state.progress.bestScores[id] || 0;
  if (!state.progress.completed.includes(id)) state.progress.completed.push(id);
  if (state.score > current) {
    state.progress.bestScores[id] = state.score;
  }
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
  populateLevels();
  els.levelSelect.value = String(state.levelIndex);
  updateMenuStats();
}

function showResult(success, title, message) {
  const grade = resultGrade(success);
  const finalChallenge = state.levelIndex >= LEVELS.length - 1;
  els.resultGrade.textContent = grade;
  els.resultTitle.textContent = title;
  els.resultText.textContent = message;
  els.resultScore.textContent = `Score ${state.score}`;
  els.resultTime.textContent = `${state.flightTime.toFixed(1)}s`;
  els.resultStars.textContent = `${state.collected.size} / ${state.level.stars.length} stars`;
  els.resultNext.hidden = !success;
  els.resultNext.textContent = finalChallenge ? 'Replay First' : 'Next Challenge';
  els.resultModal.hidden = false;
}

function hideResult() {
  els.resultModal.hidden = true;
}

function resultGrade(success) {
  if (!success) return 'D';
  if (state.score >= state.level.stars.length * 1000 + 2300) return 'S';
  if (state.score >= state.level.stars.length * 1000 + 1600) return 'A';
  if (state.score >= state.level.stars.length * 1000 + 900) return 'B';
  return 'C';
}

function updateLevelUi() {
  const best = state.progress.bestScores?.[state.level.id] || 0;
  els.objective.textContent = state.level.brief;
  els.attempt.textContent = `Attempt ${Math.max(1, state.attempts || 1)}`;
  els.best.textContent = best ? `Best ${best}` : 'Best --';
  const hint = tutorialHint();
  els.hintTitle.textContent = hint.title;
  els.hintText.textContent = hint.text;
  updateMenuStats();
}

function tutorialHint() {
  const completed = LEVELS.filter((level) => state.progress.completed?.includes(level.id)).length;
  if (completed === 0 && state.attempts === 0) {
    return {
      title: 'First Flight',
      text: 'Draw or reshape wind rails, drag the launch arrow to aim, collect every star, then land on the target.'
    };
  }
  if (state.simRunning) {
    return {
      title: 'In Flight',
      text: 'Watch the paper trail: blue-tinted sections show where wind is influencing the plane.'
    };
  }
  if (state.result?.success) {
    const finalChallenge = state.levelIndex >= LEVELS.length - 1;
    return {
      title: finalChallenge ? 'Campaign Complete' : 'Route Complete',
      text: finalChallenge
        ? 'You cleared every route. Replay for cleaner lines, faster times, and higher scores.'
        : 'Try for a cleaner score, or continue to the next unlocked challenge.'
    };
  }
  return {
    title: 'Tune The Route',
    text: 'Small rail edits matter. Use lift to slow and shape the glide, and gusts to cross longer gaps.'
  };
}

function openMenu() {
  state.menuOpen = true;
  updateMenuStats();
  els.menuModal.hidden = false;
}

function closeMenu() {
  state.menuOpen = false;
  els.menuModal.hidden = true;
}

function updateMenuStats() {
  const completed = LEVELS.filter((level) => state.progress.completed?.includes(level.id)).length;
  const best = Math.max(0, ...Object.values(state.progress.bestScores || {}));
  els.menuCompleted.textContent = `${completed} / ${LEVELS.length} complete`;
  els.menuBest.textContent = best ? `Best score ${best}` : 'Best score --';
}

function openSettings() {
  closeMenu();
  els.soundToggle.checked = state.settings.soundEnabled;
  els.motionToggle.checked = state.settings.reducedMotion;
  els.focusToggle.checked = state.settings.focusMode;
  els.settingsModal.hidden = false;
}

function closeSettings() {
  els.settingsModal.hidden = true;
}

function updateSetting(key, value) {
  state.settings[key] = value;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  applySettings();
}

function applySettings() {
  els.body.classList.toggle('reduced-motion', state.settings.reducedMotion);
  els.body.classList.toggle('focus-disabled', !state.settings.focusMode);
}

function openShareModal() {
  closeMenu();
  els.shareText.value = buildShareCode();
  els.shareModal.hidden = false;
}

function closeShareModal() {
  els.shareModal.hidden = true;
}

async function copyShareCode() {
  els.shareText.select();
  try {
    await navigator.clipboard.writeText(els.shareText.value);
    showToast('Share code copied.');
  } catch {
    document.execCommand('copy');
    showToast('Share code selected.');
  }
}

function importShareCode() {
  try {
    const payload = parseShareCode(els.shareText.value.trim());
    if (!payload?.strokes?.length || !payload.launch?.pos) throw new Error('Invalid route.');
    const targetIndex = LEVELS.findIndex((level) => level.id === payload.levelId);
    if (targetIndex >= 0 && targetIndex !== state.levelIndex) {
      if (!isLevelUnlocked(targetIndex)) throw new Error('Locked level.');
      setupLevel(targetIndex);
    }
    state.strokes = payload.strokes;
    state.launch = cloneLaunch(payload.launch);
    state.redo = [];
    saveSketch({ quiet: true });
    resetPlane();
    closeShareModal();
    showToast('Route imported.');
  } catch {
    showToast('That route code could not be imported.');
  }
}

function buildShareCode() {
  const payload = {
    v: 1,
    levelId: state.level.id,
    launch: state.launch,
    strokes: state.strokes
  };
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

function parseShareCode(code) {
  const payload = JSON.parse(decodeURIComponent(atob(code)));
  return {
    ...payload,
    strokes: payload.strokes.filter((stroke) => Array.isArray(stroke.points) && stroke.points.length > 1)
  };
}

function resetProgress() {
  const ok = window.confirm('Reset best scores, unlocks, and saved wind sketches?');
  if (!ok) return;
  localStorage.removeItem(PROGRESS_KEY);
  for (const level of LEVELS) localStorage.removeItem(levelStorageKey(level.id));
  state.progress = { bestScores: {}, completed: [] };
  populateLevels();
  setupLevel(0);
  openMenu();
  showToast('Progress reset.');
}

function updateParticles(dt) {
  for (const particle of state.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += particle.gravity * dt;
    particle.vx *= 1 - Math.min(0.1, dt * 0.55);
    particle.vy *= 1 - Math.min(0.08, dt * 0.3);
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);
}

function spawnBurst(x, y, color, count, force) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * TWO_PI;
    const speed = force * (0.35 + Math.random() * 0.85);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - force * 0.18,
      gravity: 260,
      life: 0.45 + Math.random() * 0.45,
      maxLife: 0.9,
      size: 3 + Math.random() * 5,
      color
    });
  }
}

function playTone(type) {
  if (!state.settings.soundEnabled) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const now = audioContext.currentTime;
    const gain = audioContext.createGain();
    const osc = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();
    const settings = {
      launch: [260, 420, 0.11, 'triangle'],
      star: [720, 1080, 0.12, 'sine'],
      success: [520, 880, 0.22, 'triangle'],
      fail: [190, 120, 0.24, 'sawtooth']
    }[type] || [360, 420, 0.1, 'sine'];
    osc.type = settings[3];
    osc.frequency.setValueAtTime(settings[0], now);
    osc.frequency.exponentialRampToValueAtTime(settings[1], now + settings[2]);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'fail' ? 600 : 1800, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(type === 'fail' ? 0.035 : 0.05, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + settings[2]);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + settings[2] + 0.03);
  } catch {
    // Sound is optional; browsers can block or omit Web Audio in restricted contexts.
  }
}

function eraseAt(world) {
  const radius = 24 / state.camera.zoom;
  const before = state.strokes.length;
  state.strokes = state.strokes.filter((stroke) => {
    for (let i = 1; i < stroke.points.length; i += 1) {
      if (closestPointOnSegment(world, stroke.points[i - 1], stroke.points[i]).distance < radius) return false;
    }
    return true;
  });
  if (state.strokes.length !== before) {
    state.redo.length = 0;
    saveSketch({ quiet: true });
  }
}

function saveSketch(options = {}) {
  if (!state.level) return;
  const payload = {
    version: 1,
    savedAt: Date.now(),
    levelId: state.level.id,
    strokes: state.strokes,
    camera: state.camera,
    launch: state.launch
  };
  localStorage.setItem(levelStorageKey(state.level.id), JSON.stringify(payload));
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedLevel: state.level.id }));
  state.savedAt = payload.savedAt;
  if (!options.quiet) showToast('Sketch saved locally.');
}

function loadLevelSketch(levelId) {
  try {
    const raw = localStorage.getItem(levelStorageKey(levelId));
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (!Array.isArray(payload.strokes)) return null;
    return {
      ...payload,
      strokes: payload.strokes.filter((stroke) => Array.isArray(stroke.points) && stroke.points.length > 1)
    };
  } catch (error) {
    console.warn('Could not load Paper Pilot sketch.', error);
    return null;
  }
}

function loadSavedLevelIndex() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const selectedLevel = raw ? JSON.parse(raw).selectedLevel : null;
    const index = LEVELS.findIndex((level) => level.id === selectedLevel);
    return index >= 0 ? index : 0;
  } catch {
    return 0;
  }
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const progress = raw ? JSON.parse(raw) : {};
    return { bestScores: {}, completed: [], ...progress };
  } catch {
    return { bestScores: {}, completed: [] };
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const settings = raw ? JSON.parse(raw) : {};
    return { soundEnabled: true, reducedMotion: false, focusMode: true, ...settings };
  } catch {
    return { soundEnabled: true, reducedMotion: false, focusMode: true };
  }
}

function levelStorageKey(levelId) {
  return `${STORAGE_KEY}:${levelId}`;
}

function cloneStrokes(strokes) {
  return strokes.map((stroke) => makeStroke(
    stroke.type,
    stroke.points.map((point) => (Array.isArray(point) ? point : [point.x, point.y]))
  ));
}

function cloneLaunch(launch) {
  return {
    pos: { ...launch.pos },
    angle: launch.angle,
    power: launch.power
  };
}

function makeStroke(type, rawPoints) {
  return {
    id: String(Date.now() + Math.random()),
    type,
    points: rawPoints.map(([x, y]) => ({ x, y }))
  };
}

function simplifyStroke(stroke) {
  const result = [stroke.points[0]];
  for (let i = 1; i < stroke.points.length; i += 1) {
    const point = stroke.points[i];
    if (dist(point, result[result.length - 1]) >= 4 / state.camera.zoom) result.push(point);
  }
  return { ...stroke, points: result };
}

function render() {
  ctx.clearRect(0, 0, view.width, view.height);
  drawBackground();
  ctx.save();
  applyCamera();
  drawWorldGrid();
  drawObjectives();
  drawLaunchPad();
  drawStrokes();
  if (state.currentStroke) drawStroke(state.currentStroke, 0.9);
  drawParticles();
  drawPlaneTrail();
  drawPlane();
  drawGround();
  ctx.restore();
  drawToast();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, view.height);
  gradient.addColorStop(0, '#7bc8e8');
  gradient.addColorStop(0.55, '#d7f1fb');
  gradient.addColorStop(1, '#fff4cb');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, view.width, view.height);

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = '#3f6b9b';
  ctx.lineWidth = 1;
  for (let x = (state.camera.x % 36); x < view.width; x += 36) line(x, 0, x, view.height);
  for (let y = (state.camera.y % 36); y < view.height; y += 36) line(0, y, view.width, y);
  ctx.restore();
}

function drawWorldGrid() {
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = '#2b496c';
  ctx.lineWidth = 1 / state.camera.zoom;
  for (let x = -400; x < 2600; x += 120) line(x, -500, x, 900);
  for (let y = -400; y < 900; y += 120) line(-400, y, 2600, y);
  ctx.restore();
}

function drawLaunchPad() {
  const p = state.launch.pos;
  const length = state.launch.power / 5.6;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(state.launch.angle);
  ctx.fillStyle = 'rgba(33, 48, 71, 0.16)';
  roundedRect(-42, 18, 86, 12, 8, true);
  ctx.strokeStyle = 'rgba(33, 48, 71, 0.42)';
  ctx.lineWidth = 3 / state.camera.zoom;
  line(-32, 0, length, 0);
  ctx.strokeStyle = 'rgba(75, 163, 255, 0.42)';
  ctx.lineWidth = 15 / state.camera.zoom;
  line(10, 0, length, 0);
  ctx.fillStyle = '#213047';
  ctx.beginPath();
  ctx.moveTo(length + 10, 0);
  ctx.lineTo(length - 8, -9);
  ctx.lineTo(length - 8, 9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawObjectives() {
  const allStars = state.collected.size === state.level.stars.length;
  drawLandingPad(allStars);
  state.level.stars.forEach((star, index) => drawStar(star, state.collected.has(index)));
}

function drawLandingPad(active) {
  const pad = state.level.landing;
  ctx.save();
  ctx.translate(pad.x, pad.y);
  ctx.rotate(pad.angle);
  ctx.fillStyle = active ? 'rgba(72, 170, 104, 0.22)' : 'rgba(33, 48, 71, 0.11)';
  ctx.strokeStyle = active ? '#48aa68' : 'rgba(33, 48, 71, 0.32)';
  ctx.lineWidth = 3 / state.camera.zoom;
  roundedRect(-pad.width / 2, -7, pad.width, 14, 999, true);
  roundedRect(-pad.width / 2, -7, pad.width, 14, 999, false);
  ctx.fillStyle = active ? '#2c7f4a' : 'rgba(33, 48, 71, 0.58)';
  ctx.font = `${Math.max(12, 14 / state.camera.zoom)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(active ? 'LAND HERE' : 'COLLECT STARS FIRST', 0, -16 / state.camera.zoom);
  ctx.restore();
}

function drawStar(star, collected) {
  ctx.save();
  ctx.translate(star.x, star.y);
  ctx.globalAlpha = collected ? 0.24 : 1;
  ctx.fillStyle = collected ? 'rgba(33, 48, 71, 0.22)' : '#f5b83b';
  ctx.strokeStyle = '#213047';
  ctx.lineWidth = collected ? 1 / state.camera.zoom : 2 / state.camera.zoom;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = (i % 2 === 0 ? 18 : 8) / state.camera.zoom;
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (!collected) {
    ctx.globalAlpha = 0.14;
    ctx.beginPath();
    ctx.arc(0, 0, 35 / state.camera.zoom, 0, TWO_PI);
    ctx.fill();
  }
  ctx.restore();
}

function drawStrokes() {
  for (const stroke of state.strokes) drawStroke(stroke, 1);
}

function drawStroke(stroke, alpha) {
  if (stroke.points.length < 2) return;
  const color = stroke.type === 'gust' ? '#f5b83b' : '#4ba3ff';
  const pulse = 0.72 + Math.sin(performance.now() * 0.004 + stroke.points[0].x * 0.01) * 0.12;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.12 * alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = (stroke.type === 'gust' ? 46 : 38) / state.camera.zoom;
  pathStroke(stroke.points);
  ctx.globalAlpha = 0.78 * alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = (stroke.type === 'gust' ? 9 : 7) / state.camera.zoom;
  pathStroke(stroke.points);
  ctx.globalAlpha = pulse * alpha;
  ctx.setLineDash([18 / state.camera.zoom, 18 / state.camera.zoom]);
  ctx.lineDashOffset = -performance.now() * (stroke.type === 'gust' ? 0.08 : 0.045) / state.camera.zoom;
  ctx.strokeStyle = 'rgba(255,255,255,0.78)';
  ctx.lineWidth = 2.4 / state.camera.zoom;
  pathStroke(stroke.points);
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.55 * alpha;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2 / state.camera.zoom;
  pathStroke(stroke.points);
  drawRailArrows(stroke, color, alpha);
  ctx.restore();
}

function drawParticles() {
  if (!state.particles.length) return;
  ctx.save();
  for (const particle of state.particles) {
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size / state.camera.zoom, 0, TWO_PI);
    ctx.fill();
  }
  ctx.restore();
}

function drawRailArrows(stroke, color, alpha) {
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.5 * alpha;
  for (let i = 14; i < stroke.points.length; i += 20) {
    const a = stroke.points[i - 1];
    const b = stroke.points[i];
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(8 / state.camera.zoom, 0);
    ctx.lineTo(-7 / state.camera.zoom, -5 / state.camera.zoom);
    ctx.lineTo(-7 / state.camera.zoom, 5 / state.camera.zoom);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawPlaneTrail() {
  const trail = state.plane.trail;
  if (trail.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 1; i < trail.length; i += 1) {
    const wind = trail[i].wind || 0;
    ctx.strokeStyle = wind > 0.2
      ? `rgba(75, 163, 255, ${trail[i].a * (0.28 + wind * 0.34)})`
      : `rgba(255, 255, 255, ${trail[i].a * 0.55})`;
    ctx.lineWidth = (1 + i / trail.length * 4) / state.camera.zoom;
    line(trail[i - 1].x, trail[i - 1].y, trail[i].x, trail[i].y);
  }
  ctx.restore();
}

function drawPlane() {
  const p = state.plane;
  ctx.save();
  ctx.translate(p.pos.x, p.pos.y);
  ctx.rotate(p.angle);
  const wobble = Math.sin(performance.now() * 0.014) * (p.wind || 0) * 3;
  ctx.fillStyle = 'rgba(33, 48, 71, 0.18)';
  ctx.beginPath();
  ctx.ellipse(-4, 10, 32, 8, 0, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = '#fffdf6';
  ctx.strokeStyle = '#213047';
  ctx.lineWidth = 2.2 / state.camera.zoom;
  ctx.beginPath();
  ctx.moveTo(34, 0);
  ctx.lineTo(-28, -18 - wobble);
  ctx.lineTo(-12, 0);
  ctx.lineTo(-28, 18 + wobble);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d7f1fb';
  ctx.beginPath();
  ctx.moveTo(34, 0);
  ctx.lineTo(-12, 0);
  ctx.lineTo(-2, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawGround() {
  ctx.save();
  ctx.fillStyle = 'rgba(89, 133, 91, 0.18)';
  ctx.fillRect(-600, 720, 3600, 300);
  ctx.strokeStyle = 'rgba(33, 48, 71, 0.18)';
  ctx.lineWidth = 2 / state.camera.zoom;
  line(-600, 720, 3600, 720);
  ctx.restore();
}

function drawToast() {
  if (performance.now() > toastTimer) return;
  const width = Math.min(420, view.width - 32);
  const x = (view.width - width) / 2;
  const y = Math.max(88, view.height - 182);
  ctx.save();
  ctx.fillStyle = 'rgba(33, 48, 71, 0.9)';
  roundedRect(x, y, width, 42, 999, true);
  ctx.fillStyle = '#fffaf1';
  ctx.font = '800 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(toastText, view.width / 2, y + 21);
  ctx.restore();
}

function updateReadouts() {
  const altitude = Math.max(0, Math.round((720 - state.plane.pos.y) / 4));
  const speed = Math.round(len(state.plane.vel) / 8);
  els.altitude.textContent = `${altitude} ft`;
  els.speed.textContent = `${speed} kt`;
  els.stars.textContent = `${state.collected.size} / ${state.level.stars.length}`;
  els.time.textContent = `${state.flightTime.toFixed(1)}s`;
  els.score.textContent = String(state.score);
}

function updateChromeMode() {
  const focus = MOBILE_QUERY.matches && (state.simRunning || state.drawing || state.aiming);
  document.body.classList.toggle('focus-mode', focus);
  document.body.classList.toggle('is-flying', state.simRunning);
  document.body.classList.toggle('is-drawing', state.drawing || state.aiming);
}

function isNearLaunchHandle(world) {
  const handle = {
    x: state.launch.pos.x + Math.cos(state.launch.angle) * (state.launch.power / 5.6 + 10),
    y: state.launch.pos.y + Math.sin(state.launch.angle) * (state.launch.power / 5.6 + 10)
  };
  return dist(world, handle) < 42 / state.camera.zoom || dist(world, state.launch.pos) < 30 / state.camera.zoom;
}

function updateLaunchFromPoint(world) {
  const dx = world.x - state.launch.pos.x;
  const dy = world.y - state.launch.pos.y;
  state.launch.angle = clamp(Math.atan2(dy, dx), -1.35, 0.32);
  state.launch.power = clamp(Math.hypot(dx, dy) * 5.6, 230, 680);
  resetPlane();
  els.status.textContent = 'Aiming';
}

function showToast(text) {
  toastText = text;
  toastTimer = performance.now() + 1900;
}

function screenToWorld(point) {
  return {
    x: (point.x - state.camera.x) / state.camera.zoom,
    y: (point.y - state.camera.y) / state.camera.zoom
  };
}

function worldToScreen(point) {
  return {
    x: point.x * state.camera.zoom + state.camera.x,
    y: point.y * state.camera.zoom + state.camera.y
  };
}

function applyCamera() {
  ctx.translate(state.camera.x, state.camera.y);
  ctx.scale(state.camera.zoom, state.camera.zoom);
}

function pathStroke(points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
}

function closestPointOnSegment(p, a, b) {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const ap = { x: p.x - a.x, y: p.y - a.y };
  const abLenSq = ab.x * ab.x + ab.y * ab.y || 1;
  const t = clamp((ap.x * ab.x + ap.y * ab.y) / abLenSq, 0, 1);
  const point = { x: a.x + ab.x * t, y: a.y + ab.y * t };
  return { point, distance: dist(p, point), t };
}

function angleVector(angle) {
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function norm(v) {
  const length = len(v) || 1;
  return { x: v.x / length, y: v.y / length };
}

function len(v) {
  return Math.hypot(v.x, v.y);
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= TWO_PI;
  while (angle < -Math.PI) angle += TWO_PI;
  return angle;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function line(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function roundedRect(x, y, width, height, radius, fill) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  if (fill) ctx.fill();
  else ctx.stroke();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
