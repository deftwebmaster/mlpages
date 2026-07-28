// Wires the DOM HUD (top bar + bottom toolbar) to game callbacks. Per Part 4,
// UI is DOM, not canvas, and sits on top of the render pipeline.

export class UI {
  constructor({
    onSelectTool, onRotate, onUndo, onRedo, onTogglePause,
    onToggleAnalysis, onSaveBlueprint, onLoadBlueprint, onDeleteBlueprint,
  }) {
    this.onSelectTool = onSelectTool;
    this.onRotate = onRotate;
    this.onUndo = onUndo;
    this.onRedo = onRedo;
    this.onTogglePause = onTogglePause;
    this.onToggleAnalysis = onToggleAnalysis;
    this.onSaveBlueprint = onSaveBlueprint;
    this.onLoadBlueprint = onLoadBlueprint;
    this.onDeleteBlueprint = onDeleteBlueprint;

    this.toolButtons = Array.from(document.querySelectorAll('[data-tool]'));
    this.rotateBtn = document.getElementById('btn-rotate');
    this.undoBtn = document.getElementById('btn-undo');
    this.redoBtn = document.getElementById('btn-redo');
    this.pauseBtn = document.getElementById('btn-pause');
    this.analysisBtn = document.getElementById('btn-analysis');
    this.factoryNameEl = document.getElementById('factory-name');
    this.powerReadoutEl = document.getElementById('power-readout');
    this.objectiveReadoutEl = document.getElementById('objective-readout');
    this.sessionStatsEl = document.getElementById('session-stats');

    this.blueprintsBtn = document.getElementById('btn-blueprints');
    this.blueprintPanel = document.getElementById('blueprint-panel');
    this.blueprintCloseBtn = document.getElementById('btn-close-blueprints');
    this.blueprintNameInput = document.getElementById('blueprint-name-input');
    this.blueprintSaveBtn = document.getElementById('btn-save-blueprint');
    this.blueprintListEl = document.getElementById('blueprint-list');

    for (const btn of this.toolButtons) {
      btn.addEventListener('click', () => this.onSelectTool(btn.dataset.tool));
    }
    this.rotateBtn.addEventListener('click', () => this.onRotate());
    this.undoBtn.addEventListener('click', () => this.onUndo());
    this.redoBtn.addEventListener('click', () => this.onRedo());
    this.pauseBtn.addEventListener('click', () => this.onTogglePause());
    this.analysisBtn.addEventListener('click', () => this.onToggleAnalysis());

    this.blueprintsBtn.addEventListener('click', () => this.setBlueprintPanelOpen(true));
    this.blueprintCloseBtn.addEventListener('click', () => this.setBlueprintPanelOpen(false));
    this.blueprintSaveBtn.addEventListener('click', () => {
      const name = this.blueprintNameInput.value.trim() || `Layout ${new Date().toLocaleString()}`;
      this.onSaveBlueprint(name);
      this.blueprintNameInput.value = '';
    });
  }

  setFactoryName(name) {
    this.factoryNameEl.textContent = name;
  }

  setActiveTool(toolId) {
    for (const btn of this.toolButtons) {
      btn.classList.toggle('active', btn.dataset.tool === toolId);
    }
  }

  setHistoryState({ canUndo, canRedo }) {
    this.undoBtn.disabled = !canUndo;
    this.redoBtn.disabled = !canRedo;
  }

  setPaused(paused) {
    this.pauseBtn.innerHTML = paused ? '&#9654;' : '&#10074;&#10074;'; // play : pause
    this.pauseBtn.title = paused ? 'Resume simulation' : 'Pause simulation';
    this.pauseBtn.classList.toggle('active', paused);
  }

  setPowerStats({ supply, demand }) {
    if (!this.powerReadoutEl) return;
    this.powerReadoutEl.textContent = `⚡ ${Math.round(demand)}/${Math.round(supply)} kW`;
    this.powerReadoutEl.classList.toggle('warning', demand > supply);
  }

  setObjective({ label, current, target, complete }) {
    if (!this.objectiveReadoutEl) return;
    const prefix = complete ? '✓ ' : '';
    this.objectiveReadoutEl.textContent = `${prefix}${label}: ${current}/${target}`;
    this.objectiveReadoutEl.classList.toggle('complete', complete);
  }

  setAnalysisMode(active) {
    this.analysisBtn.classList.toggle('active', active);
    this.analysisBtn.title = active ? 'Exit Analysis Mode' : 'Enter Analysis Mode';
    if (this.sessionStatsEl) this.sessionStatsEl.classList.toggle('hidden', !active);
  }

  setSessionStats({ itemsExported, itemsProduced, beltsPlaced, machinesPlaced, uptimeSeconds }) {
    if (!this.sessionStatsEl) return;
    const mins = Math.floor(uptimeSeconds / 60);
    const secs = uptimeSeconds % 60;
    this.sessionStatsEl.textContent =
      `Produced ${itemsProduced} · Exported ${itemsExported} · Belts ${beltsPlaced} · Machines ${machinesPlaced} · Uptime ${mins}:${String(secs).padStart(2, '0')}`;
  }

  setBlueprintPanelOpen(open) {
    this.blueprintPanel.classList.toggle('hidden', !open);
  }

  setBlueprintList(blueprints) {
    this.blueprintListEl.innerHTML = '';
    if (!blueprints.length) {
      const empty = document.createElement('p');
      empty.className = 'blueprint-empty';
      empty.textContent = 'No saved layouts yet.';
      this.blueprintListEl.appendChild(empty);
      return;
    }
    for (const bp of blueprints) {
      const row = document.createElement('div');
      row.className = 'blueprint-row';

      const info = document.createElement('span');
      info.className = 'blueprint-info';
      info.textContent = `${bp.name} — ${new Date(bp.savedAt).toLocaleString()}`;
      row.appendChild(info);

      const loadBtn = document.createElement('button');
      loadBtn.textContent = 'Load';
      loadBtn.addEventListener('click', () => this.onLoadBlueprint(bp.id));
      row.appendChild(loadBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => this.onDeleteBlueprint(bp.id));
      row.appendChild(deleteBtn);

      this.blueprintListEl.appendChild(row);
    }
  }
}
