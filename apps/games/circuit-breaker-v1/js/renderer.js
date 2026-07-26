import { CONFIG } from "./config.js";
import { formatNumber } from "./utils.js";

const typeMeta = new Map(CONFIG.nodeTypes.map((type) => [type.id, type]));

export class Renderer {
  constructor(elements) {
    this.elements = elements;
    this.displayedScore = 0;
    this.scoreAnimation = null;
    this.scoreTimer = null;
  }

  showScreen(name) {
    for (const screen of [this.elements.loadingScreen, this.elements.menuScreen, this.elements.gameScreen]) {
      screen.classList.remove("is-active");
    }
    this.elements[`${name}Screen`]?.classList.add("is-active");
  }

  renderBoard(board, selectedCell = null, newCells = []) {
    const newSet = new Set(newCells.map((cell) => `${cell.row},${cell.column}`));
    const fragment = document.createDocumentFragment();
    for (let row = 0; row < CONFIG.rows; row += 1) {
      for (let column = 0; column < CONFIG.columns; column += 1) {
        const node = board[row][column];
        const button = document.createElement("button");
        button.className = "node";
        button.type = "button";
        button.dataset.row = String(row);
        button.dataset.column = String(column);
        button.setAttribute("role", "gridcell");
        button.setAttribute("tabindex", "0");
        if (node) {
          const meta = typeMeta.get(node.type);
          button.dataset.nodeId = node.id;
          button.classList.add(`type-${node.type}`, `shape-${meta.shape}`);
          button.setAttribute("aria-label", `${meta.label} node, row ${row + 1}, column ${column + 1}${node.specialType ? ", Line Breaker" : ""}`);
          if (node.specialType === "line") {
            button.classList.add("is-special");
            button.dataset.specialDirection = node.direction;
            const mark = document.createElement("span");
            mark.className = "special-mark";
            button.append(mark);
          }
        } else {
          button.setAttribute("aria-label", `Empty cell, row ${row + 1}, column ${column + 1}`);
        }
        if (selectedCell?.row === row && selectedCell?.column === column) button.classList.add("is-selected");
        if (newSet.has(`${row},${column}`)) button.classList.add("is-new");
        fragment.append(button);
      }
    }
    this.elements.board.replaceChildren(fragment);
  }

  markCells(cells, className) {
    for (const cell of cells) {
      const node = this.getNodeElement(cell);
      if (node) node.classList.add(className);
    }
  }

  getNodeElement(cell) {
    return this.elements.board.querySelector(`[data-row="${cell.row}"][data-column="${cell.column}"]`);
  }

  updateStats({ score, bestScore, heat, stateText }) {
    this.animateScore(score);
    this.elements.bestDisplay.textContent = formatNumber(bestScore);
    this.elements.menuBestScore.textContent = formatNumber(bestScore);
    this.elements.heatLabel.textContent = `${Math.round(heat)}%`;
    this.elements.heatFill.style.width = `${Math.min(100, Math.max(0, heat))}%`;
    this.elements.heatMeter.setAttribute("aria-valuenow", String(Math.round(heat)));
    this.elements.statusText.textContent = stateText;

    const panel = this.elements.heatPanel;
    panel.classList.remove("stable", "elevated", "critical", "imminent", "shutdown");
    this.elements.gameScreen.classList.toggle("high-heat", heat >= 75 && heat < 100);
    if (heat >= 100) panel.classList.add("shutdown");
    else if (heat >= 90) panel.classList.add("imminent");
    else if (heat >= 75) panel.classList.add("critical");
    else if (heat >= 50) panel.classList.add("elevated");
    else panel.classList.add("stable");
  }

  animateScore(target) {
    const start = this.displayedScore;
    const end = Math.round(target);
    if (this.scoreAnimation) cancelAnimationFrame(this.scoreAnimation);
    if (this.scoreTimer) window.clearTimeout(this.scoreTimer);
    const startedAt = performance.now();
    const duration = 320;
    this.scoreTimer = window.setTimeout(() => {
      this.displayedScore = end;
      this.elements.scoreDisplay.textContent = formatNumber(end);
      this.scoreTimer = null;
    }, duration + 40);
    const tick = (now) => {
      const progress = Math.max(0, Math.min(1, (now - startedAt) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      this.displayedScore = Math.round(start + (end - start) * eased);
      this.elements.scoreDisplay.textContent = formatNumber(this.displayedScore);
      if (progress < 1) this.scoreAnimation = requestAnimationFrame(tick);
    };
    this.scoreAnimation = requestAnimationFrame(tick);
  }

  showCombo(depth) {
    if (depth <= 0) return;
    const label = depth >= 3 ? `System Surge x${depth + 1}` : `Chain x${depth + 1}`;
    const element = this.elements.comboIndicator;
    element.textContent = label;
    element.classList.remove("show");
    void element.offsetWidth;
    element.classList.add("show");
  }

  showFloatingScore(points, cell = null) {
    if (!points) return;
    const score = document.createElement("div");
    score.className = "floating-score";
    score.textContent = `+${formatNumber(points)}`;
    const boardRect = this.elements.board.getBoundingClientRect();
    const x = cell ? ((cell.column + 0.5) / CONFIG.columns) * boardRect.width : boardRect.width / 2;
    const y = cell ? ((cell.row + 0.5) / CONFIG.rows) * boardRect.height : boardRect.height / 2;
    score.style.left = `${x}px`;
    score.style.top = `${y}px`;
    this.elements.boardWrap.append(score);
    score.addEventListener("animationend", () => score.remove(), { once: true });
  }

  setRunStatus(text) {
    this.elements.runStatus.textContent = text;
  }

  showTutorial(text, visible = true) {
    this.elements.tutorialTip.textContent = text;
    this.elements.tutorialTip.classList.toggle("is-hidden", !visible);
  }

  showOverlay(name, visible) {
    this.elements[`${name}Overlay`].classList.toggle("is-hidden", !visible);
  }

  showGameOver(results, isNewBest) {
    const rows = [
      ["Final score", formatNumber(results.score)],
      ["Best score", formatNumber(results.bestScore)],
      ["Valid moves", formatNumber(results.validMoves)],
      ["Largest chain", `x${results.largestCascade + 1}`],
      ["Longest match", formatNumber(results.longestMatch)]
    ];
    this.elements.resultsGrid.replaceChildren();
    for (const [label, value] of rows) {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = value;
      this.elements.resultsGrid.append(dt, dd);
    }
    this.elements.newBestLabel.classList.toggle("is-hidden", !isNewBest);
    this.showOverlay("gameOver", true);
  }

  syncToggles(settings) {
    document.documentElement.classList.toggle("manual-reduced-effects", !settings.effectsEnabled);
    for (const [name, value] of Object.entries({
      soundToggle: settings.soundEnabled,
      pauseSoundToggle: settings.soundEnabled,
      hapticsToggle: settings.hapticsEnabled,
      pauseHapticsToggle: settings.hapticsEnabled,
      effectsToggle: settings.effectsEnabled
    })) {
      if (this.elements[name]) this.elements[name].checked = value;
    }
  }

  flashDeadlock(on) {
    this.elements.board.classList.toggle("deadlock", on);
  }
}
