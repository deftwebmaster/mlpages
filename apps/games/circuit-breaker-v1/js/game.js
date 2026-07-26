import { CONFIG } from "./config.js";
import { BoardModel } from "./board.js";
import {
  chooseSpecialCreation,
  coolingForResolution,
  expandLineBreakerCells,
  findMatchGroups,
  findSpecialActivations,
  getMatchedCells,
  scoreGroups
} from "./matches.js";
import { areAdjacent, clamp, copyCell, sleep } from "./utils.js";
import { markTutorialComplete, saveRunResults, saveSetting } from "./storage.js";

export class CircuitBreakerGame {
  constructor({ renderer, audio, settings }) {
    this.renderer = renderer;
    this.audio = audio;
    this.settings = settings;
    this.boardModel = new BoardModel();
    this.state = CONFIG.states.menu;
    this.previousState = CONFIG.states.menu;
    this.selectedCell = null;
    this.confirmAction = null;
    this.deferredInstallPrompt = null;
    this.resetRunData();
  }

  resetRunData() {
    this.score = 0;
    this.heat = CONFIG.heat.starting;
    this.stats = {
      validMoves: 0,
      invalidSwaps: 0,
      nodesCleared: 0,
      largestMatch: 0,
      largestCascade: 0,
      specialCreated: 0,
      specialActivated: 0,
      highestHeat: CONFIG.heat.starting,
      totalHeatCooled: 0
    };
  }

  init() {
    this.renderer.syncToggles(this.settings);
    this.renderer.updateStats(this.snapshot());
    window.setTimeout(() => this.renderer.showScreen("menu"), 120);
  }

  startGame() {
    this.audio.play("button");
    this.resetRunData();
    this.selectedCell = null;
    this.boardModel.generate();
    this.setState(CONFIG.states.playerTurn);
    this.renderer.showOverlay("gameOver", false);
    this.renderer.showOverlay("pause", false);
    this.renderer.showScreen("game");
    this.renderer.renderBoard(this.boardModel.board, this.selectedCell);
    this.renderer.updateStats(this.snapshot());
    this.renderer.setRunStatus("Swap adjacent nodes to discharge the grid.");
    if (!this.settings.tutorialComplete) {
      this.renderer.showTutorial("Swap adjacent nodes to connect three");
    }
  }

  returnToMenu() {
    this.audio.play("button");
    this.renderer.showOverlay("pause", false);
    this.renderer.showOverlay("gameOver", false);
    this.renderer.showOverlay("confirm", false);
    this.renderer.showOverlay("help", false);
    this.renderer.showTutorial("", false);
    this.setState(CONFIG.states.menu);
    this.renderer.showScreen("menu");
    this.renderer.syncToggles(this.settings);
  }

  pause(auto = false) {
    if (this.state !== CONFIG.states.playerTurn) return;
    this.previousState = this.state;
    this.setState(CONFIG.states.paused);
    this.renderer.showOverlay("pause", true);
    this.renderer.setRunStatus(auto ? "System paused while away." : "System paused.");
  }

  resume() {
    if (this.state !== CONFIG.states.paused) return;
    this.audio.play("button");
    this.setState(CONFIG.states.playerTurn);
    this.renderer.showOverlay("pause", false);
    this.renderer.setRunStatus(this.statusForHeat());
  }

  requestAbandon(action) {
    if (this.state === CONFIG.states.playerTurn || this.state === CONFIG.states.paused) {
      this.confirmAction = action;
      this.renderer.showOverlay("confirm", true);
    } else {
      action();
    }
  }

  confirmAbandon(confirmed) {
    this.audio.play("button");
    this.renderer.showOverlay("confirm", false);
    if (confirmed && this.confirmAction) this.confirmAction();
    this.confirmAction = null;
  }

  showHelp() {
    this.audio.play("button");
    this.renderer.showOverlay("help", true);
    saveSetting("helpSeen", true);
    this.settings.helpSeen = true;
    if (this.state === CONFIG.states.playerTurn) this.pause(true);
  }

  closeHelp() {
    this.audio.play("button");
    this.renderer.showOverlay("help", false);
  }

  updateSetting(name, value) {
    this.settings[name] = value;
    saveSetting(name, value);
    if (name === "soundEnabled") this.audio.setSoundEnabled(value);
    if (name === "hapticsEnabled") this.audio.setHapticsEnabled(value);
    this.renderer.syncToggles(this.settings);
  }

  async handleTap(cell) {
    if (this.state !== CONFIG.states.playerTurn) return;
    this.audio.unlock();
    if (!this.boardModel.isInside(cell.row, cell.column)) return;

    if (this.selectedCell?.row === cell.row && this.selectedCell?.column === cell.column) {
      this.selectedCell = null;
      this.renderer.renderBoard(this.boardModel.board, this.selectedCell);
      return;
    }

    if (!this.selectedCell) {
      this.selectedCell = copyCell(cell);
      this.audio.play("select");
      this.renderer.renderBoard(this.boardModel.board, this.selectedCell);
      return;
    }

    if (!areAdjacent(this.selectedCell, cell)) {
      this.selectedCell = copyCell(cell);
      this.audio.play("select");
      this.renderer.renderBoard(this.boardModel.board, this.selectedCell);
      return;
    }

    const from = copyCell(this.selectedCell);
    this.selectedCell = null;
    await this.attemptSwap(from, cell);
  }

  async handleSwipe(from, to) {
    if (this.state !== CONFIG.states.playerTurn) return;
    this.audio.unlock();
    if (!this.boardModel.isInside(to.row, to.column)) return;
    this.selectedCell = null;
    await this.attemptSwap(from, to);
  }

  async attemptSwap(from, to) {
    if (!areAdjacent(from, to)) return;
    this.setState(CONFIG.states.swapping);
    this.boardModel.swap(from, to);
    this.renderer.renderBoard(this.boardModel.board, null);
    await sleep(CONFIG.timings.swap);

    const groups = findMatchGroups(this.boardModel.board);
    if (groups.length === 0) {
      this.stats.invalidSwaps += 1;
      this.audio.play("invalid");
      this.audio.vibrate(30);
      this.renderer.markCells([from, to], "is-invalid");
      await sleep(CONFIG.timings.invalid);
      this.boardModel.swap(from, to);
      this.renderer.renderBoard(this.boardModel.board, null);
      this.setState(CONFIG.states.playerTurn);
      this.renderer.setRunStatus("No circuit formed.");
      return;
    }

    this.stats.validMoves += 1;
    this.adjustHeat(CONFIG.heat.validMove);
    this.audio.play("swap");
    this.renderer.updateStats(this.snapshot());
    await this.resolveBoard(to);
  }

  async resolveBoard(movedCell = null) {
    this.setState(CONFIG.states.resolving);
    let cascadeDepth = 0;
    let anyResolution = false;

    while (true) {
      const groups = findMatchGroups(this.boardModel.board);
      if (groups.length === 0) break;
      anyResolution = true;
      const matched = getMatchedCells(groups);
      let activations = findSpecialActivations(this.boardModel.board, matched);
      let expanded = expandLineBreakerCells(matched, activations);

      let newActivations = findSpecialActivations(this.boardModel.board, expanded).filter((activation) =>
        !activations.some((existing) => existing.row === activation.row && existing.column === activation.column)
      );
      while (newActivations.length > 0) {
        activations = activations.concat(newActivations);
        expanded = expandLineBreakerCells(expanded, newActivations);
        newActivations = findSpecialActivations(this.boardModel.board, expanded).filter((activation) =>
          !activations.some((existing) => existing.row === activation.row && existing.column === activation.column)
        );
      }

      const cells = [...expanded.values()];
      const specialCreation = chooseSpecialCreation(groups, movedCell, cascadeDepth);
      const score = scoreGroups(groups, cells.length, activations.length, activations.length, cascadeDepth);
      const cooling = coolingForResolution(groups, activations.length, cascadeDepth, cells.length);

      this.stats.nodesCleared += cells.length;
      this.stats.longestMatch = Math.max(this.stats.longestMatch, score.longest, cells.length);
      this.stats.largestCascade = Math.max(this.stats.largestCascade, cascadeDepth);
      this.stats.specialActivated += activations.length;
      if (specialCreation) this.stats.specialCreated += 1;

      this.score += score.points;
      if (cooling > 0) this.adjustHeat(-cooling);
      this.renderer.updateStats(this.snapshot());
      this.renderer.showFloatingScore(score.points, cells[0]);
      if (cascadeDepth > 0) this.renderer.showCombo(cascadeDepth);

      if (activations.length) {
        this.audio.play("special");
        this.audio.vibrate([18, 24, 18]);
      } else if (score.longest >= 4) {
        this.audio.play("large");
        this.audio.vibrate(18);
      } else {
        this.audio.play(cascadeDepth > 0 ? "cascade" : "match");
      }
      if (specialCreation) this.audio.play("specialCreate");

      this.renderer.markCells(cells, "is-clearing");
      await sleep(CONFIG.timings.matchCharge + CONFIG.timings.discharge);
      this.boardModel.removeCells(cells, specialCreation);
      const newCells = this.boardModel.applyGravityAndRefill();
      this.renderer.renderBoard(this.boardModel.board, null, newCells);
      await sleep(CONFIG.timings.gravity);
      cascadeDepth += 1;
      movedCell = null;
      await sleep(CONFIG.timings.cascadePause);
    }

    if (anyResolution && !this.settings.tutorialComplete) {
      markTutorialComplete();
      this.settings.tutorialComplete = true;
      this.renderer.showTutorial("Valid moves build heat. Larger matches and chains cool the grid.");
      window.setTimeout(() => this.renderer.showTutorial("", false), 2800);
    }

    if (this.heat >= 100) {
      await this.gameOver();
      return;
    }

    if (!this.boardModel.hasPossibleMove()) {
      await this.reshuffleDeadlock();
      return;
    }

    this.setState(CONFIG.states.playerTurn);
    this.renderer.setRunStatus(this.statusForHeat());
    this.renderer.updateStats(this.snapshot());
  }

  async reshuffleDeadlock() {
    this.setState(CONFIG.states.reshuffling);
    this.renderer.setRunStatus("Grid deadlock.");
    this.renderer.flashDeadlock(true);
    await sleep(CONFIG.timings.deadlock);
    this.boardModel.reshuffle();
    this.renderer.flashDeadlock(false);
    this.renderer.renderBoard(this.boardModel.board, null);
    this.setState(CONFIG.states.playerTurn);
    this.renderer.setRunStatus("Grid rerouted.");
  }

  async gameOver() {
    this.setState(CONFIG.states.gameOver);
    this.renderer.setRunStatus("System overload.");
    this.renderer.updateStats(this.snapshot());
    this.audio.play("gameOver");
    this.audio.vibrate([70, 60, 120]);
    await sleep(CONFIG.timings.gameOver);
    const saved = saveRunResults(this.score);
    this.settings.bestScore = saved.bestScore;
    this.renderer.showGameOver({ ...this.stats, score: this.score, bestScore: saved.bestScore }, saved.isNewBest);
    this.renderer.updateStats(this.snapshot());
  }

  adjustHeat(amount) {
    const previous = this.heat;
    this.heat = clamp(this.heat + amount, 0, 100);
    this.stats.highestHeat = Math.max(this.stats.highestHeat, this.heat);
    if (this.heat < previous) this.stats.totalHeatCooled += previous - this.heat;
    if (previous < 90 && this.heat >= 90) {
      this.audio.play("warning");
      this.audio.vibrate([24, 30, 24]);
    }
  }

  snapshot() {
    return {
      score: this.score,
      bestScore: Math.max(this.settings.bestScore, this.score),
      heat: this.heat,
      stateText: this.statusForHeat()
    };
  }

  statusForHeat() {
    if (this.heat >= 100) return "Shutdown";
    if (this.heat >= 90) return "Overload imminent";
    if (this.heat >= 75) return "Critical load";
    if (this.heat >= 50) return "Heat rising";
    return "System stable";
  }

  setState(nextState) {
    this.state = nextState;
  }
}
