import { AudioController } from "./audio.js";
import { CircuitBreakerGame } from "./game.js";
import { InputController } from "./input.js";
import { Renderer } from "./renderer.js";
import { bindInstallPrompt, registerServiceWorker } from "./pwa.js";
import { loadSettings } from "./storage.js";

const $ = (id) => document.getElementById(id);

const elements = {
  loadingScreen: $("loading-screen"),
  menuScreen: $("menu-screen"),
  gameScreen: $("game-screen"),
  board: $("board"),
  boardWrap: $("board-wrap"),
  scoreDisplay: $("score-display"),
  bestDisplay: $("best-display"),
  menuBestScore: $("menu-best-score"),
  heatLabel: $("heat-label"),
  heatFill: $("heat-fill"),
  heatMeter: document.querySelector(".heat-meter"),
  heatPanel: $("heat-panel"),
  statusText: $("status-text"),
  runStatus: $("run-status"),
  comboIndicator: $("combo-indicator"),
  tutorialTip: $("tutorial-tip"),
  pauseOverlay: $("pause-overlay"),
  helpOverlay: $("help-overlay"),
  confirmOverlay: $("confirm-overlay"),
  gameOverOverlay: $("game-over-overlay"),
  resultsGrid: $("results-grid"),
  newBestLabel: $("new-best-label"),
  soundToggle: $("sound-toggle"),
  pauseSoundToggle: $("pause-sound-toggle"),
  hapticsToggle: $("haptics-toggle"),
  pauseHapticsToggle: $("pause-haptics-toggle"),
  effectsToggle: $("effects-toggle")
};

const settings = loadSettings();
const renderer = new Renderer(elements);
const audio = new AudioController(settings);
const game = new CircuitBreakerGame({ renderer, audio, settings });

new InputController(elements.board, {
  onTap: (cell) => game.handleTap(cell),
  onSwipe: (from, to) => game.handleSwipe(from, to)
});

$("start-button").addEventListener("click", () => game.startGame());
$("pause-button").addEventListener("click", () => game.pause(false));
$("resume-button").addEventListener("click", () => game.resume());
$("restart-button").addEventListener("click", () => game.requestAbandon(() => game.startGame()));
$("pause-menu-button").addEventListener("click", () => game.requestAbandon(() => game.returnToMenu()));
$("reboot-button").addEventListener("click", () => game.startGame());
$("game-over-menu-button").addEventListener("click", () => game.returnToMenu());
$("help-button").addEventListener("click", () => game.showHelp());
$("close-help-button").addEventListener("click", () => game.closeHelp());
$("confirm-yes-button").addEventListener("click", () => game.confirmAbandon(true));
$("confirm-no-button").addEventListener("click", () => game.confirmAbandon(false));

for (const [id, settingName] of [
  ["sound-toggle", "soundEnabled"],
  ["pause-sound-toggle", "soundEnabled"],
  ["haptics-toggle", "hapticsEnabled"],
  ["pause-haptics-toggle", "hapticsEnabled"],
  ["effects-toggle", "effectsEnabled"]
]) {
  $(id).addEventListener("change", (event) => game.updateSetting(settingName, event.target.checked));
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) game.pause(true);
});

bindInstallPrompt($("install-button"), (ready) => {
  $("install-button").classList.toggle("is-hidden", !ready);
});
registerServiceWorker();
game.init();
