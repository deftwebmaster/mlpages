/* =========================================================================
   Pallet Calculator
   ========================================================================= */

(function () {
  'use strict';

  const INCH_TO_CM = 2.54;
  const LBS_TO_KG = 0.45359237;
  const CM_TO_INCH = 1 / INCH_TO_CM;
  const KG_TO_LBS = 1 / LBS_TO_KG;
  const PALLET_DECK_HEIGHT = 6;

  const PALLET_PRESETS = {
    '48x40': { length: 48, width: 40, tare: 40, name: 'GMA Standard' },
    '42x42': { length: 42, width: 42, tare: 38, name: 'Square' },
    '48x48': { length: 48, width: 48, tare: 50, name: 'Large Square' },
    EUR: { length: 47.24, width: 31.5, tare: 55, name: 'EUR' }
  };

  const BOX_PRESETS = {
    standard: { length: 18, width: 14, height: 12, weight: 25 },
    small: { length: 12, width: 8, height: 6, weight: 10 },
    large: { length: 24, width: 18, height: 16, weight: 40 },
    parcel: { length: 16, width: 12, height: 8, weight: 8 }
  };

  const state = {
    units: 'imperial',
    results: null,
    scene: null,
    camera: null,
    renderer: null,
    autoRotate: false,
    animationId: null,
    targetY: 18
  };

  const elements = {};

  function cacheElements() {
    [
      'boxLength', 'boxWidth', 'boxHeight', 'boxWeight', 'boxQuantity',
      'palletPreset', 'palletLength', 'palletWidth', 'maxHeight', 'maxWeight',
      'palletTare', 'overhang', 'patternStrategy', 'safetyBuffer',
      'calculateBtn', 'resetViewBtn', 'toggleRotateBtn', 'copyBtn', 'exportPdfBtn',
      'preview3d', 'topView', 'sideView', 'patternTable', 'recommendations',
      'resultPalletsNeeded', 'resultBoxesPerPallet', 'resultBoxesPerLayer',
      'resultLayers', 'resultCubeUtil', 'resultWeightUtil', 'cubeBar',
      'weightBar', 'heightBar', 'cubeBarValue', 'weightBarValue', 'heightBarValue',
      'heroPallets', 'heroPerPallet', 'heroLimiter', 'loadPlanTitle',
      'loadPlanSummary', 'loadScore', 'tooltip', 'toast'
    ].forEach((id) => {
      elements[id] = document.getElementById(id);
    });

    elements.customPalletDims = document.querySelector('.custom-pallet-dims');
  }

  function init() {
    cacheElements();
    setupEvents();
    setupTooltips();
    handlePalletPresetChange();
    init3DScene();
    calculate();
  }

  function setupEvents() {
    document.querySelectorAll('input, select').forEach((input) => {
      input.addEventListener('input', debounce(calculate, 80));
      input.addEventListener('change', calculate);
    });

    elements.calculateBtn.addEventListener('click', calculate);
    elements.palletPreset.addEventListener('change', handlePalletPresetChange);
    elements.resetViewBtn.addEventListener('click', resetCameraView);
    elements.toggleRotateBtn.addEventListener('click', toggleAutoRotate);
    elements.copyBtn.addEventListener('click', copySummary);
    elements.exportPdfBtn.addEventListener('click', exportReport);

    document.querySelectorAll('.preset-btn').forEach((button) => {
      button.addEventListener('click', () => applyBoxPreset(button.dataset.preset));
    });

    document.querySelectorAll('.unit-btn').forEach((button) => {
      button.addEventListener('click', () => changeUnits(button.dataset.unit));
    });
  }

  function setupTooltips() {
    document.querySelectorAll('.tooltip-trigger').forEach((trigger) => {
      trigger.addEventListener('mouseenter', showTooltip);
      trigger.addEventListener('mouseleave', hideTooltip);
      trigger.addEventListener('focus', showTooltip);
      trigger.addEventListener('blur', hideTooltip);
    });
  }

  function showTooltip(event) {
    const text = event.currentTarget.dataset.tooltip;
    if (!text || !elements.tooltip) return;

    elements.tooltip.textContent = text;
    elements.tooltip.classList.add('visible');

    const triggerRect = event.currentTarget.getBoundingClientRect();
    const tooltipRect = elements.tooltip.getBoundingClientRect();
    let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    let top = triggerRect.bottom + 8;

    left = Math.max(12, Math.min(left, window.innerWidth - tooltipRect.width - 12));
    if (top + tooltipRect.height > window.innerHeight - 12) {
      top = triggerRect.top - tooltipRect.height - 8;
    }

    elements.tooltip.style.left = `${left}px`;
    elements.tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    elements.tooltip.classList.remove('visible');
  }

  function handlePalletPresetChange() {
    const preset = PALLET_PRESETS[elements.palletPreset.value];
    elements.customPalletDims.classList.toggle('is-visible', !preset);

    if (!preset) {
      calculate();
      return;
    }

    const lengthFactor = state.units === 'metric' ? INCH_TO_CM : 1;
    const weightFactor = state.units === 'metric' ? LBS_TO_KG : 1;
    elements.palletLength.value = formatInput(preset.length * lengthFactor);
    elements.palletWidth.value = formatInput(preset.width * lengthFactor);
    elements.palletTare.value = formatInput(preset.tare * weightFactor, state.units === 'metric' ? 1 : 0);
    calculate();
  }

  function applyBoxPreset(name) {
    const preset = BOX_PRESETS[name];
    if (!preset) return;

    const lengthFactor = state.units === 'metric' ? INCH_TO_CM : 1;
    const weightFactor = state.units === 'metric' ? LBS_TO_KG : 1;
    elements.boxLength.value = formatInput(preset.length * lengthFactor);
    elements.boxWidth.value = formatInput(preset.width * lengthFactor);
    elements.boxHeight.value = formatInput(preset.height * lengthFactor);
    elements.boxWeight.value = formatInput(preset.weight * weightFactor, 1);
    calculate();
  }

  function changeUnits(nextUnit) {
    if (nextUnit === state.units) return;

    const toMetric = nextUnit === 'metric';
    const lengthFactor = toMetric ? INCH_TO_CM : CM_TO_INCH;
    const weightFactor = toMetric ? LBS_TO_KG : KG_TO_LBS;

    ['boxLength', 'boxWidth', 'boxHeight', 'palletLength', 'palletWidth', 'maxHeight', 'overhang'].forEach((id) => {
      elements[id].value = formatInput(toNumber(elements[id].value) * lengthFactor);
    });
    ['boxWeight', 'maxWeight', 'palletTare'].forEach((id) => {
      elements[id].value = formatInput(toNumber(elements[id].value) * weightFactor, toMetric ? 1 : 0);
    });

    state.units = nextUnit;
    document.querySelectorAll('.unit-btn').forEach((button) => {
      button.classList.toggle('active', button.dataset.unit === nextUnit);
    });
    document.querySelectorAll('.length-unit').forEach((unit) => {
      unit.textContent = toMetric ? 'cm' : 'in';
    });
    document.querySelectorAll('.weight-unit').forEach((unit) => {
      unit.textContent = toMetric ? 'kg' : 'lbs';
    });

    calculate();
  }

  function calculate() {
    const input = readInput();
    const validation = validateInput(input);

    if (!validation.ok) {
      state.results = null;
      renderEmpty(validation.message);
      clearScenes();
      return;
    }

    const patterns = calculatePatterns(input);
    if (!patterns.length) {
      state.results = null;
      renderEmpty('No feasible layer pattern fits inside the selected pallet footprint.');
      clearScenes();
      return;
    }

    const enrichedPatterns = patterns.map((pattern) => enrichPattern(pattern, input));
    const feasiblePatterns = enrichedPatterns.filter((pattern) => pattern.boxesPerPallet > 0);
    if (!feasiblePatterns.length) {
      const bestAttempt = enrichedPatterns[0];
      const reason = bestAttempt && bestAttempt.maxLayersByWeight < 1
        ? 'The weight limit is too low once pallet tare and buffer are included.'
        : 'The stack height is too low for one full case layer.';
      state.results = null;
      renderEmpty(reason);
      clearScenes();
      renderPatternTable(enrichedPatterns, null);
      return;
    }

    const best = feasiblePatterns.sort(comparePatterns)[0];
    state.results = buildResults(best, enrichedPatterns, input);
    renderResults();
    draw2DViews();
    update3DScene();
  }

  function readInput() {
    const isMetric = state.units === 'metric';
    const lengthFactor = isMetric ? CM_TO_INCH : 1;
    const weightFactor = isMetric ? KG_TO_LBS : 1;
    const overhang = Math.max(0, toNumber(elements.overhang.value) * lengthFactor);

    return {
      units: state.units,
      lengthUnit: isMetric ? 'cm' : 'in',
      weightUnit: isMetric ? 'kg' : 'lbs',
      box: {
        length: toNumber(elements.boxLength.value) * lengthFactor,
        width: toNumber(elements.boxWidth.value) * lengthFactor,
        height: toNumber(elements.boxHeight.value) * lengthFactor,
        weight: toNumber(elements.boxWeight.value) * weightFactor
      },
      pallet: {
        length: toNumber(elements.palletLength.value) * lengthFactor,
        width: toNumber(elements.palletWidth.value) * lengthFactor,
        tare: toNumber(elements.palletTare.value) * weightFactor
      },
      footprint: {
        length: toNumber(elements.palletLength.value) * lengthFactor + overhang * 2,
        width: toNumber(elements.palletWidth.value) * lengthFactor + overhang * 2,
        overhang
      },
      maxHeight: toNumber(elements.maxHeight.value) * lengthFactor,
      maxWeight: toNumber(elements.maxWeight.value) * weightFactor,
      totalQuantity: Math.floor(toNumber(elements.boxQuantity.value)),
      safetyBuffer: clamp(toNumber(elements.safetyBuffer.value), 0, 50),
      strategy: elements.patternStrategy.value
    };
  }

  function validateInput(input) {
    const values = [
      input.box.length, input.box.width, input.box.height, input.box.weight,
      input.pallet.length, input.pallet.width, input.maxHeight, input.maxWeight,
      input.pallet.tare, input.totalQuantity
    ];

    if (values.some((value) => Number.isNaN(value))) {
      return { ok: false, message: 'Enter valid numbers for every case, pallet, and constraint field.' };
    }
    if (input.box.length <= 0 || input.box.width <= 0 || input.box.height <= 0) {
      return { ok: false, message: 'Case dimensions must be greater than zero.' };
    }
    if (input.pallet.length <= 0 || input.pallet.width <= 0 || input.maxHeight <= 0 || input.maxWeight <= 0) {
      return { ok: false, message: 'Pallet dimensions, max height, and max weight must be greater than zero.' };
    }
    if (input.totalQuantity < 1) {
      return { ok: false, message: 'Total case quantity must be at least 1.' };
    }
    if (input.box.height > input.maxHeight) {
      return { ok: false, message: 'The case height exceeds the max stack height.' };
    }
    if (input.pallet.tare >= input.maxWeight) {
      return { ok: false, message: 'Pallet tare is greater than or equal to the max gross pallet weight.' };
    }

    return { ok: true };
  }

  function calculatePatterns(input) {
    const { box, footprint, strategy } = input;
    const patterns = [];

    if (strategy === 'best' || strategy === 'straight') {
      patterns.push(makeStraightPattern('Straight rows', box.length, box.width, footprint, false));
    }
    if (strategy === 'best' || strategy === 'rotated') {
      patterns.push(makeStraightPattern('Rotated rows', box.width, box.length, footprint, true));
    }
    if (strategy === 'best') {
      patterns.push(makeMixedPattern('Mixed rows', box.length, box.width, footprint, false));
      patterns.push(makeMixedPattern('Mixed rows, rotated base', box.width, box.length, footprint, true));
    }

    const seen = new Set();
    return patterns
      .filter((pattern) => pattern.boxesPerLayer > 0)
      .filter((pattern) => {
        const key = pattern.placements.map((p) => `${round(p.x)}:${round(p.y)}:${round(p.length)}:${round(p.width)}`).join('|');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function makeStraightPattern(name, caseLength, caseWidth, footprint, rotated) {
    const columns = Math.floor(footprint.length / caseLength);
    const rows = Math.floor(footprint.width / caseWidth);
    const placements = [];

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        placements.push({
          x: column * caseLength,
          y: row * caseWidth,
          length: caseLength,
          width: caseWidth,
          rotated
        });
      }
    }

    return {
      id: `${name}-${rotated ? 'rotated' : 'straight'}`,
      name,
      columns,
      rows,
      mixed: false,
      boxesPerLayer: placements.length,
      placements
    };
  }

  function makeMixedPattern(name, primaryLength, primaryWidth, footprint, baseRotated) {
    const primaryRowsLimit = Math.floor(footprint.width / primaryWidth);
    const primaryColumns = Math.floor(footprint.length / primaryLength);
    const secondaryColumns = Math.floor(footprint.length / primaryWidth);
    let best = {
      rows: 0,
      secondaryRows: 0,
      boxesPerLayer: 0,
      placements: []
    };

    for (let primaryRows = 0; primaryRows <= primaryRowsLimit; primaryRows += 1) {
      const remainingWidth = footprint.width - primaryRows * primaryWidth;
      const secondaryRows = Math.floor(remainingWidth / primaryLength);
      const placements = [];

      for (let row = 0; row < primaryRows; row += 1) {
        for (let column = 0; column < primaryColumns; column += 1) {
          placements.push({
            x: column * primaryLength,
            y: row * primaryWidth,
            length: primaryLength,
            width: primaryWidth,
            rotated: baseRotated
          });
        }
      }

      const secondaryStartY = primaryRows * primaryWidth;
      for (let row = 0; row < secondaryRows; row += 1) {
        for (let column = 0; column < secondaryColumns; column += 1) {
          placements.push({
            x: column * primaryWidth,
            y: secondaryStartY + row * primaryLength,
            length: primaryWidth,
            width: primaryLength,
            rotated: !baseRotated
          });
        }
      }

      if (placements.length > best.boxesPerLayer) {
        best = {
          rows: primaryRows,
          secondaryRows,
          boxesPerLayer: placements.length,
          placements
        };
      }
    }

    return {
      id: `${name}-${baseRotated ? 'rotated' : 'straight'}`,
      name,
      columns: Math.max(primaryColumns, secondaryColumns),
      rows: best.rows + best.secondaryRows,
      mixed: best.rows > 0 && best.secondaryRows > 0,
      boxesPerLayer: best.boxesPerLayer,
      placements: best.placements
    };
  }

  function enrichPattern(pattern, input) {
    const usableWeight = input.maxWeight * (1 - input.safetyBuffer / 100) - input.pallet.tare;
    const weightPerLayer = pattern.boxesPerLayer * input.box.weight;
    const maxLayersByHeight = Math.floor(input.maxHeight / input.box.height);
    const maxLayersByWeight = input.box.weight === 0 ? maxLayersByHeight : Math.floor(usableWeight / weightPerLayer);
    const layers = Math.min(maxLayersByHeight, maxLayersByWeight);
    const boxesPerPallet = Math.max(0, pattern.boxesPerLayer * layers);
    const stackHeight = layers * input.box.height;
    const grossWeight = boxesPerPallet * input.box.weight + input.pallet.tare;
    const cubeUtilization = boxesPerPallet * input.box.length * input.box.width * input.box.height /
      (input.footprint.length * input.footprint.width * input.maxHeight) * 100;
    const weightUtilization = grossWeight / input.maxWeight * 100;
    const heightUtilization = stackHeight / input.maxHeight * 100;

    return {
      ...pattern,
      usableWeight,
      maxLayersByHeight,
      maxLayersByWeight,
      layers: Math.max(0, layers),
      boxesPerPallet,
      stackHeight,
      grossWeight,
      cubeUtilization: Math.max(0, cubeUtilization),
      weightUtilization: Math.max(0, weightUtilization),
      heightUtilization: Math.max(0, heightUtilization),
      limitingFactor: getLimiter(maxLayersByHeight, maxLayersByWeight)
    };
  }

  function comparePatterns(a, b) {
    if (b.boxesPerPallet !== a.boxesPerPallet) return b.boxesPerPallet - a.boxesPerPallet;
    if (b.cubeUtilization !== a.cubeUtilization) return b.cubeUtilization - a.cubeUtilization;
    return a.weightUtilization - b.weightUtilization;
  }

  function buildResults(pattern, allPatterns, input) {
    const palletsNeeded = Math.ceil(input.totalQuantity / pattern.boxesPerPallet);
    const remainder = input.totalQuantity % pattern.boxesPerPallet;
    const fullPallets = remainder === 0 ? palletsNeeded : Math.floor(input.totalQuantity / pattern.boxesPerPallet);
    const partialCases = remainder;
    const partialLayers = partialCases === 0 ? 0 : Math.ceil(partialCases / pattern.boxesPerLayer);
    const partialWeight = partialCases === 0 ? 0 : partialCases * input.box.weight + input.pallet.tare;
    const score = calculateScore(pattern);

    return {
      ...pattern,
      input,
      allPatterns,
      palletsNeeded,
      fullPallets,
      partialCases,
      partialLayers,
      partialWeight,
      score
    };
  }

  function getLimiter(heightLayers, weightLayers) {
    if (weightLayers < heightLayers) return 'Weight';
    if (heightLayers < weightLayers) return 'Height';
    return 'Height + weight';
  }

  function calculateScore(result) {
    const cubeScore = clamp(result.cubeUtilization, 0, 95) * 0.55;
    const heightScore = clamp(result.heightUtilization, 0, 100) * 0.2;
    const weightTarget = result.weightUtilization <= 100 ? 100 - Math.abs(82 - result.weightUtilization) : 25;
    const weightScore = clamp(weightTarget, 0, 100) * 0.25;
    return clamp(Math.round(cubeScore + heightScore + weightScore), 1, 99);
  }

  function renderResults() {
    const r = state.results;
    const unitText = getUnitText();
    const fullGross = `${displayWeight(r.grossWeight)} ${unitText.weight}`;
    const stackHeight = displayLength(r.stackHeight);
    const grossHeight = displayLength(r.stackHeight + PALLET_DECK_HEIGHT);

    elements.heroPallets.textContent = String(r.palletsNeeded);
    elements.heroPerPallet.textContent = String(r.boxesPerPallet);
    elements.heroLimiter.textContent = r.limitingFactor;
    elements.loadScore.textContent = String(r.score);
    elements.loadPlanTitle.textContent = `${r.boxesPerPallet} cases per full pallet across ${r.layers} layers`;
    elements.loadPlanSummary.textContent = `${r.fullPallets} full pallet${plural(r.fullPallets)}${r.partialCases ? ` plus ${r.partialCases} cases on a final partial pallet` : ''}. Full pallet gross weight is ${fullGross}; stack height is ${stackHeight} ${unitText.length} (${grossHeight} ${unitText.length} including pallet deck).`;

    elements.resultPalletsNeeded.textContent = String(r.palletsNeeded);
    elements.resultBoxesPerPallet.textContent = String(r.boxesPerPallet);
    elements.resultBoxesPerLayer.textContent = String(r.boxesPerLayer);
    elements.resultLayers.textContent = String(r.layers);
    elements.resultCubeUtil.textContent = formatPercent(r.cubeUtilization);
    elements.resultWeightUtil.textContent = formatPercent(r.weightUtilization);

    updateBar(elements.cubeBar, elements.cubeBarValue, r.cubeUtilization);
    updateBar(elements.weightBar, elements.weightBarValue, r.weightUtilization, r.weightUtilization >= 95);
    updateBar(elements.heightBar, elements.heightBarValue, r.heightUtilization, r.heightUtilization >= 95);

    renderPatternTable(r.allPatterns, r.id);
    renderRecommendations(r, unitText);
  }

  function renderEmpty(message) {
    ['heroPallets', 'heroPerPallet', 'heroLimiter', 'resultPalletsNeeded', 'resultBoxesPerPallet',
      'resultBoxesPerLayer', 'resultLayers', 'resultCubeUtil', 'resultWeightUtil'].forEach((id) => {
      elements[id].textContent = '-';
    });
    elements.loadScore.textContent = '--';
    elements.loadPlanTitle.textContent = 'No feasible pallet plan';
    elements.loadPlanSummary.textContent = message;
    updateBar(elements.cubeBar, elements.cubeBarValue, 0);
    updateBar(elements.weightBar, elements.weightBarValue, 0);
    updateBar(elements.heightBar, elements.heightBarValue, 0);
    elements.patternTable.innerHTML = '';
    elements.recommendations.innerHTML = `<div class="note danger"><strong>Check inputs</strong>${escapeHtml(message)}</div>`;
    elements.topView.innerHTML = '<div class="view-placeholder">-</div>';
    elements.sideView.innerHTML = '<div class="view-placeholder">-</div>';
  }

  function updateBar(bar, label, value, isWarning) {
    const width = clamp(value, 0, 100);
    bar.style.width = `${width}%`;
    bar.classList.toggle('warning', Boolean(isWarning));
    label.textContent = formatPercent(value);
  }

  function renderPatternTable(patterns, bestId) {
    if (!patterns.length) {
      elements.patternTable.innerHTML = '<div class="note">No layer patterns fit the selected footprint.</div>';
      return;
    }

    const rows = patterns
      .slice()
      .sort(comparePatterns)
      .map((pattern) => `
        <tr class="${pattern.id === bestId ? 'is-best' : ''}">
          <td><strong>${escapeHtml(pattern.name)}</strong></td>
          <td>${pattern.boxesPerLayer}</td>
          <td>${pattern.layers}</td>
          <td>${pattern.boxesPerPallet}</td>
          <td>${formatPercent(pattern.cubeUtilization)}</td>
          <td>${pattern.limitingFactor}</td>
        </tr>
      `)
      .join('');

    elements.patternTable.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Pattern</th>
            <th>Layer</th>
            <th>Layers</th>
            <th>Pallet</th>
            <th>Cube</th>
            <th>Limit</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function renderRecommendations(r, unitText) {
    const notes = [];
    const bestAlternative = r.allPatterns.slice().sort((a, b) => b.boxesPerLayer - a.boxesPerLayer)[0];

    notes.push({
      title: `${r.name} is the best pattern`,
      body: `${r.boxesPerLayer} cases fit per layer with ${r.layers} layer${plural(r.layers)} under the current ${r.limitingFactor.toLowerCase()} limit.`
    });

    if (r.partialCases > 0) {
      notes.push({
        title: 'Final pallet is partial',
        body: `${r.partialCases} case${plural(r.partialCases)} remain after ${r.fullPallets} full pallet${plural(r.fullPallets)}. Plan about ${r.partialLayers} layer${plural(r.partialLayers)} on that last pallet.`
      });
    } else {
      notes.push({
        title: 'Quantity divides cleanly',
        body: `All ${r.input.totalQuantity} cases fill ${r.palletsNeeded} pallet${plural(r.palletsNeeded)} with no partial remainder.`
      });
    }

    if (r.weightUtilization >= 95) {
      notes.push({
        tone: 'warning',
        title: 'Weight is tight',
        body: `Full pallet gross weight uses ${formatPercent(r.weightUtilization)} of the max. Consider a buffer or fewer layers if handling equipment is variable.`
      });
    }

    if (r.heightUtilization < 72) {
      notes.push({
        title: 'Height capacity remains',
        body: `${displayLength(r.input.maxHeight - r.stackHeight)} ${unitText.length} of stack height is unused. Weight or carton footprint may be the practical constraint.`
      });
    }

    if (r.input.footprint.overhang > 0) {
      notes.push({
        tone: 'warning',
        title: 'Overhang included',
        body: `The pattern uses ${displayLength(r.input.footprint.overhang)} ${unitText.length} overhang per side. Confirm this is allowed for conveyors, trailers, and stretch wrap.`
      });
    }

    if (r.input.safetyBuffer > 0) {
      notes.push({
        title: 'Weight buffer applied',
        body: `${r.input.safetyBuffer}% of max gross weight was reserved before calculating layer capacity.`
      });
    }

    if (bestAlternative && bestAlternative.id !== r.id && bestAlternative.boxesPerLayer > r.boxesPerLayer) {
      notes.push({
        title: 'Pattern tradeoff',
        body: `${bestAlternative.name} fits more per layer, but the selected plan wins after height and weight constraints are applied.`
      });
    }

    elements.recommendations.innerHTML = notes.map((note) => `
      <div class="note ${note.tone || ''}">
        <strong>${escapeHtml(note.title)}</strong>
        ${escapeHtml(note.body)}
      </div>
    `).join('');
  }

  function draw2DViews() {
    drawTopView();
    drawSideView();
  }

  function drawTopView() {
    const r = state.results;
    if (!r) return;

    const canvas = makeCanvas(elements.topView);
    const ctx = canvas.getContext('2d');
    const pad = 26;
    const scale = Math.min(
      (canvas.width - pad * 2) / r.input.footprint.length,
      (canvas.height - pad * 2) / r.input.footprint.width
    );
    const originX = (canvas.width - r.input.footprint.length * scale) / 2;
    const originY = (canvas.height - r.input.footprint.width * scale) / 2;
    const palletX = originX + r.input.footprint.overhang * scale;
    const palletY = originY + r.input.footprint.overhang * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#070a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (r.input.footprint.overhang > 0) {
      ctx.strokeStyle = 'rgba(255, 204, 102, 0.55)';
      ctx.setLineDash([6, 5]);
      ctx.strokeRect(originX, originY, r.input.footprint.length * scale, r.input.footprint.width * scale);
      ctx.setLineDash([]);
    }

    ctx.fillStyle = 'rgba(155, 118, 83, 0.22)';
    ctx.strokeStyle = '#9b7653';
    ctx.lineWidth = 2;
    ctx.fillRect(palletX, palletY, r.input.pallet.length * scale, r.input.pallet.width * scale);
    ctx.strokeRect(palletX, palletY, r.input.pallet.length * scale, r.input.pallet.width * scale);

    r.placements.forEach((box, index) => {
      const x = originX + box.x * scale;
      const y = originY + box.y * scale;
      const hue = index % 2 ? '#70ff9c' : '#2df8e6';
      ctx.fillStyle = hue;
      ctx.globalAlpha = 0.78;
      ctx.fillRect(x + 1, y + 1, Math.max(1, box.length * scale - 2), Math.max(1, box.width * scale - 2));
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(4, 17, 15, 0.78)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, y + 1, Math.max(1, box.length * scale - 2), Math.max(1, box.width * scale - 2));
    });

    drawCanvasLabel(ctx, `${displayLength(r.input.pallet.length)} x ${displayLength(r.input.pallet.width)} ${getUnitText().length} pallet`, canvas.width / 2, canvas.height - 7, 'center');
  }

  function drawSideView() {
    const r = state.results;
    if (!r) return;

    const canvas = makeCanvas(elements.sideView);
    const ctx = canvas.getContext('2d');
    const pad = 28;
    const totalHeight = r.input.maxHeight + PALLET_DECK_HEIGHT;
    const scale = Math.min(
      (canvas.width - pad * 2) / r.input.footprint.length,
      (canvas.height - pad * 2) / totalHeight
    );
    const originX = (canvas.width - r.input.footprint.length * scale) / 2;
    const baseY = canvas.height - pad - PALLET_DECK_HEIGHT * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#070a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#9b7653';
    ctx.fillRect(originX, baseY, r.input.footprint.length * scale, PALLET_DECK_HEIGHT * scale);

    for (let layer = 0; layer < r.layers; layer += 1) {
      r.placements.forEach((box, index) => {
        const x = originX + box.x * scale;
        const y = baseY - (layer + 1) * r.input.box.height * scale;
        ctx.fillStyle = index % 2 ? '#70ff9c' : '#2df8e6';
        ctx.globalAlpha = 0.42;
        ctx.fillRect(x + 1, y + 1, Math.max(1, box.length * scale - 2), Math.max(1, r.input.box.height * scale - 2));
      });
    }
    ctx.globalAlpha = 1;

    const maxY = baseY - r.input.maxHeight * scale;
    ctx.strokeStyle = 'rgba(255, 107, 122, 0.78)';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(originX - 8, maxY);
    ctx.lineTo(originX + r.input.footprint.length * scale + 8, maxY);
    ctx.stroke();
    ctx.setLineDash([]);

    drawCanvasLabel(ctx, `${displayLength(r.stackHeight)} ${getUnitText().length} stack`, canvas.width - 10, baseY - r.stackHeight * scale / 2, 'right', true);
    drawCanvasLabel(ctx, `${displayLength(r.input.maxHeight)} ${getUnitText().length} max`, originX + 4, maxY - 7, 'left');
  }

  function makeCanvas(container) {
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    const rect = container.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width));
    canvas.height = Math.max(1, Math.floor(rect.height));
    container.appendChild(canvas);
    return canvas;
  }

  function drawCanvasLabel(ctx, text, x, y, align, vertical) {
    ctx.save();
    ctx.fillStyle = '#a8b3c5';
    ctx.font = '700 11px Inter, sans-serif';
    ctx.textAlign = align;
    if (vertical) {
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(text, 0, 0);
    } else {
      ctx.fillText(text, x, y);
    }
    ctx.restore();
  }

  function init3DScene() {
    if (typeof THREE === 'undefined' || !elements.preview3d) return;

    const container = elements.preview3d;
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x070a0f);
    state.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 2000);
    state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    state.renderer.setSize(container.clientWidth, container.clientHeight);

    state.scene.add(new THREE.AmbientLight(0xffffff, 0.64));

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.78);
    keyLight.position.set(70, 120, 80);
    state.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x2df8e6, 0.22);
    fillLight.position.set(-80, 50, -60);
    state.scene.add(fillLight);

    const grid = new THREE.GridHelper(90, 18, 0x273449, 0x172031);
    grid.userData.isStatic = true;
    state.scene.add(grid);

    setupMouseControls();
    window.addEventListener('resize', resizeRenderer);
    animate3D();
  }

  function setupMouseControls() {
    let isDragging = false;
    let previous = { x: 0, y: 0 };

    state.renderer.domElement.addEventListener('mousedown', (event) => {
      isDragging = true;
      previous = { x: event.clientX, y: event.clientY };
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    document.addEventListener('mousemove', (event) => {
      if (!isDragging || !state.camera) return;

      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      const spherical = new THREE.Spherical().setFromVector3(state.camera.position);
      spherical.theta -= dx * 0.01;
      spherical.phi = clamp(spherical.phi - dy * 0.01, 0.15, Math.PI - 0.15);
      state.camera.position.setFromSpherical(spherical);
      state.camera.lookAt(0, state.targetY, 0);
      previous = { x: event.clientX, y: event.clientY };
    });

    state.renderer.domElement.addEventListener('wheel', (event) => {
      event.preventDefault();
      const scale = event.deltaY > 0 ? 1.1 : 0.9;
      state.camera.position.multiplyScalar(scale);
      state.camera.position.setLength(clamp(state.camera.position.length(), 22, 220));
      state.camera.lookAt(0, state.targetY, 0);
    }, { passive: false });
  }

  function animate3D() {
    state.animationId = requestAnimationFrame(animate3D);
    if (state.autoRotate && state.camera) {
      const spherical = new THREE.Spherical().setFromVector3(state.camera.position);
      spherical.theta += 0.004;
      state.camera.position.setFromSpherical(spherical);
      state.camera.lookAt(0, state.targetY, 0);
    }
    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
  }

  function update3DScene() {
    const r = state.results;
    if (!r || !state.scene || !state.renderer) return;

    clearScenes();

    const container = elements.preview3d;
    const placeholder = container.querySelector('.preview-placeholder');
    if (placeholder) placeholder.style.display = 'none';
    if (!container.contains(state.renderer.domElement)) {
      container.appendChild(state.renderer.domElement);
    }

    const scale = 0.55;
    const palletTop = PALLET_DECK_HEIGHT * scale;
    const footprintL = r.input.footprint.length * scale;
    const footprintW = r.input.footprint.width * scale;
    const palletL = r.input.pallet.length * scale;
    const palletW = r.input.pallet.width * scale;
    const offsetX = -footprintL / 2;
    const offsetZ = -footprintW / 2;
    state.targetY = (palletTop + r.stackHeight * scale) / 2;

    const pallet = new THREE.Mesh(
      new THREE.BoxGeometry(palletL, PALLET_DECK_HEIGHT * scale, palletW),
      new THREE.MeshLambertMaterial({ color: 0x9b7653 })
    );
    pallet.position.set(0, PALLET_DECK_HEIGHT * scale / 2, 0);
    pallet.userData.isLoadPlan = true;
    state.scene.add(pallet);

    if (r.input.footprint.overhang > 0) {
      const frame = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(footprintL, 0.08, footprintW)),
        new THREE.LineDashedMaterial({ color: 0xffcc66, dashSize: 1.3, gapSize: 0.9 })
      );
      frame.computeLineDistances();
      frame.position.set(0, palletTop + 0.05, 0);
      frame.userData.isLoadPlan = true;
      state.scene.add(frame);
    }

    const totalBoxes = r.placements.length * r.layers;
    const maxBoxes = 520;
    const layersToDraw = Math.min(r.layers, Math.max(1, Math.floor(maxBoxes / r.placements.length)));
    const boxMaterial = new THREE.MeshLambertMaterial({ color: 0x2df8e6 });
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x087d75, transparent: true, opacity: 0.72 });

    let drawn = 0;
    for (let layer = 0; layer < layersToDraw; layer += 1) {
      r.placements.forEach((placement) => {
        if (drawn >= maxBoxes) return;
        const geometry = new THREE.BoxGeometry(
          Math.max(0.1, placement.length * scale - 0.18),
          Math.max(0.1, r.input.box.height * scale - 0.18),
          Math.max(0.1, placement.width * scale - 0.18)
        );
        const mesh = new THREE.Mesh(geometry, boxMaterial);
        mesh.position.set(
          offsetX + placement.x * scale + placement.length * scale / 2,
          palletTop + r.input.box.height * scale / 2 + layer * r.input.box.height * scale,
          offsetZ + placement.y * scale + placement.width * scale / 2
        );
        mesh.userData.isLoadPlan = true;
        state.scene.add(mesh);

        if (totalBoxes <= 220) {
          const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
          edge.position.copy(mesh.position);
          edge.userData.isLoadPlan = true;
          state.scene.add(edge);
        }
        drawn += 1;
      });
    }

    const limit = new THREE.Mesh(
      new THREE.PlaneGeometry(footprintL + 5, footprintW + 5),
      new THREE.MeshBasicMaterial({ color: 0xff6b7a, transparent: true, opacity: 0.16, side: THREE.DoubleSide })
    );
    limit.rotation.x = -Math.PI / 2;
    limit.position.set(0, palletTop + r.input.maxHeight * scale, 0);
    limit.userData.isLoadPlan = true;
    state.scene.add(limit);

    resetCameraView();
  }

  function clearScenes() {
    if (!state.scene) return;
    const remove = [];
    state.scene.traverse((object) => {
      if (object.userData.isLoadPlan) remove.push(object);
    });
    remove.forEach((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material.dispose();
      }
      state.scene.remove(object);
    });
  }

  function resetCameraView() {
    if (!state.camera) return;
    const r = state.results;
    const span = r ? Math.max(r.input.footprint.length, r.input.footprint.width, r.input.maxHeight) * 0.75 : 82;
    state.camera.position.set(span, span * 0.72, span);
    state.camera.lookAt(0, state.targetY, 0);
  }

  function toggleAutoRotate() {
    state.autoRotate = !state.autoRotate;
    elements.toggleRotateBtn.classList.toggle('active', state.autoRotate);
  }

  function resizeRenderer() {
    if (!state.renderer || !state.camera || !elements.preview3d) return;
    const { clientWidth, clientHeight } = elements.preview3d;
    state.camera.aspect = clientWidth / clientHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(clientWidth, clientHeight);
    if (state.results) draw2DViews();
  }

  function copySummary() {
    const text = buildSummaryText();
    if (!text) {
      showToast('Calculate a pallet load first.');
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast('Pallet summary copied.'))
        .catch(() => fallbackCopy(text));
      return;
    }
    fallbackCopy(text);
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    showToast('Pallet summary copied.');
  }

  function exportReport() {
    const r = state.results;
    if (!r) {
      showToast('Calculate a pallet load first.');
      return;
    }

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      showToast('Allow popups to print the report.');
      return;
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pallet Load Report</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0.5in; color: #111827; font: 12px/1.45 Inter, Arial, sans-serif; }
    h1 { margin: 0 0 4px; font-size: 24px; }
    h2 { margin: 20px 0 9px; padding-bottom: 6px; border-bottom: 1px solid #d1d5db; font-size: 14px; }
    .muted { color: #6b7280; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .card { padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #f9fafb; }
    .value { display: block; font-size: 22px; font-weight: 800; color: #0f766e; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; text-align: left; }
    th { color: #6b7280; font-size: 10px; text-transform: uppercase; }
    .footer { margin-top: 26px; padding-top: 10px; border-top: 1px solid #d1d5db; color: #6b7280; font-size: 10px; }
  </style>
</head>
<body>
  <h1>Pallet Load Report</h1>
  <div class="muted">Generated ${escapeHtml(new Date().toLocaleString())} from mattlivingston.com/tools/pallet-calculator</div>

  <h2>Summary</h2>
  <div class="grid">
    <div class="card"><span class="value">${r.palletsNeeded}</span>Pallets needed</div>
    <div class="card"><span class="value">${r.boxesPerPallet}</span>Cases per full pallet</div>
    <div class="card"><span class="value">${r.boxesPerLayer}</span>Cases per layer</div>
  </div>

  <h2>Load Plan</h2>
  <table>
    <tr><td>Pattern</td><td>${escapeHtml(r.name)}</td></tr>
    <tr><td>Layers</td><td>${r.layers}</td></tr>
    <tr><td>Full pallets</td><td>${r.fullPallets}</td></tr>
    <tr><td>Final partial pallet</td><td>${r.partialCases ? `${r.partialCases} cases across ${r.partialLayers} layers` : 'None'}</td></tr>
    <tr><td>Limiting factor</td><td>${r.limitingFactor}</td></tr>
    <tr><td>Stack height</td><td>${displayLength(r.stackHeight)} ${getUnitText().length}</td></tr>
    <tr><td>Full pallet gross weight</td><td>${displayWeight(r.grossWeight)} ${getUnitText().weight}</td></tr>
    <tr><td>Cube utilization</td><td>${formatPercent(r.cubeUtilization)}</td></tr>
    <tr><td>Weight utilization</td><td>${formatPercent(r.weightUtilization)}</td></tr>
  </table>

  <h2>Inputs</h2>
  <table>
    <tr><td>Case dimensions</td><td>${displayLength(r.input.box.length)} x ${displayLength(r.input.box.width)} x ${displayLength(r.input.box.height)} ${getUnitText().length}</td></tr>
    <tr><td>Case weight</td><td>${displayWeight(r.input.box.weight)} ${getUnitText().weight}</td></tr>
    <tr><td>Quantity</td><td>${r.input.totalQuantity}</td></tr>
    <tr><td>Pallet dimensions</td><td>${displayLength(r.input.pallet.length)} x ${displayLength(r.input.pallet.width)} ${getUnitText().length}</td></tr>
    <tr><td>Max stack height</td><td>${displayLength(r.input.maxHeight)} ${getUnitText().length}</td></tr>
    <tr><td>Max gross weight</td><td>${displayWeight(r.input.maxWeight)} ${getUnitText().weight}</td></tr>
    <tr><td>Pallet tare</td><td>${displayWeight(r.input.pallet.tare)} ${getUnitText().weight}</td></tr>
    <tr><td>Weight buffer</td><td>${r.input.safetyBuffer}%</td></tr>
  </table>

  <div class="footer">Pallet Calculator - mattlivingston.com/tools/pallet-calculator</div>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`;

    reportWindow.document.write(html);
    reportWindow.document.close();
  }

  function buildSummaryText() {
    const r = state.results;
    if (!r) return '';
    const units = getUnitText();
    return [
      'Pallet Load Summary',
      `Pattern: ${r.name}`,
      `Total quantity: ${r.input.totalQuantity} cases`,
      `Pallets needed: ${r.palletsNeeded}`,
      `Cases per full pallet: ${r.boxesPerPallet}`,
      `Cases per layer: ${r.boxesPerLayer}`,
      `Layers: ${r.layers}`,
      `Final partial pallet: ${r.partialCases || 'none'}`,
      `Stack height: ${displayLength(r.stackHeight)} ${units.length}`,
      `Gross weight per full pallet: ${displayWeight(r.grossWeight)} ${units.weight}`,
      `Cube utilization: ${formatPercent(r.cubeUtilization)}`,
      `Weight utilization: ${formatPercent(r.weightUtilization)}`,
      `Limiting factor: ${r.limitingFactor}`
    ].join('\n');
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('visible');
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => {
      elements.toast.classList.remove('visible');
    }, 2200);
  }

  function getUnitText() {
    return state.units === 'metric'
      ? { length: 'cm', weight: 'kg' }
      : { length: 'in', weight: 'lbs' };
  }

  function displayLength(valueInInches) {
    const value = state.units === 'metric' ? valueInInches * INCH_TO_CM : valueInInches;
    return formatNumber(value, state.units === 'metric' ? 1 : 1);
  }

  function displayWeight(valueInPounds) {
    const value = state.units === 'metric' ? valueInPounds * LBS_TO_KG : valueInPounds;
    return formatNumber(value, state.units === 'metric' ? 1 : 0);
  }

  function formatInput(value, decimals = 2) {
    if (!Number.isFinite(value)) return '';
    return value
      .toFixed(decimals)
      .replace(/(\.\d*?[1-9])0+$/, '$1')
      .replace(/\.0+$/, '')
      .replace(/\.$/, '');
  }

  function formatNumber(value, decimals = 1) {
    if (!Number.isFinite(value)) return '-';
    return Number(value.toFixed(decimals)).toLocaleString(undefined, {
      maximumFractionDigits: decimals
    });
  }

  function formatPercent(value) {
    if (!Number.isFinite(value)) return '-';
    return `${value.toFixed(1)}%`;
  }

  function toNumber(value) {
    return Number.parseFloat(value);
  }

  function round(value, decimals = 3) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function plural(value) {
    return value === 1 ? '' : 's';
  }

  function debounce(fn, wait) {
    let timeout;
    return function debounced(...args) {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
