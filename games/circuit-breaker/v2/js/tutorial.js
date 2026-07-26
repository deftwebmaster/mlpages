/**
 * Lightweight first-run coaching. Three short messages, dismissible, shown once
 * and then remembered. The Help screen stays available regardless.
 */

import { CONFIG } from './config.js';
import { storage } from './storage.js';

const STEP = {
  SWAP: 'swap',
  HEAT: 'heat',
  COOL: 'cool',
  DONE: 'done',
};

export class Tutorial {
  constructor({ dom, renderer, board }) {
    this.dom = dom;
    this.renderer = renderer;
    this.board = board;
    this.step = STEP.DONE;
    this.dom.tutorialClose.addEventListener('click', () => this.hide(true));
  }

  get active() {
    return CONFIG.FEATURES.tutorial && this.step !== STEP.DONE;
  }

  startRun() {
    if (!CONFIG.FEATURES.tutorial || storage.tutorialDone) {
      this.step = STEP.DONE;
      this.hide();
      return;
    }
    this.step = STEP.SWAP;
    this.show('SWAP ADJACENT NODES TO CONNECT THREE');
    this.hintMove();
  }

  hintMove() {
    if (this.step !== STEP.SWAP) return;
    const move = this.board.findPossibleMove();
    if (move) this.renderer.showHint([move.a, move.b]);
  }

  /** Called after each resolved turn with that turn's shape. */
  onTurnResolved({ cascadeDepth, longestMatch }) {
    if (!this.active) return;
    this.renderer.clearHint();
    if (this.step === STEP.SWAP) {
      this.step = STEP.HEAT;
      this.show('VALID MOVES BUILD HEAT');
      return;
    }
    if (this.step === STEP.HEAT && (cascadeDepth >= 2 || longestMatch >= 4)) {
      this.step = STEP.COOL;
      this.show('LARGER MATCHES AND CHAINS COOL THE GRID');
      return;
    }
    if (this.step === STEP.COOL) {
      this.finish();
    }
  }

  finish() {
    this.step = STEP.DONE;
    storage.tutorialDone = true;
    this.hide();
  }

  show(text) {
    this.dom.tutorialText.textContent = text;
    this.dom.tutorial.hidden = false;
  }

  hide(userDismissed = false) {
    this.dom.tutorial.hidden = true;
    this.renderer.clearHint();
    if (userDismissed) this.finish();
  }
}
