/* =========================================================================
   Pallet Load Calculator - JavaScript
   ========================================================================= */

(function() {
    'use strict';

    // =========================================================================
    // State
    // =========================================================================

    let state = {
        units: 'imperial', // 'imperial' or 'metric'
        results: null,
        scene: null,
        camera: null,
        renderer: null,
        autoRotate: false,
        animationId: null
    };

    // Conversion factors
    const INCH_TO_CM = 2.54;
    const LBS_TO_KG = 0.453592;
    const CM_TO_INCH = 1 / INCH_TO_CM;
    const KG_TO_LBS = 1 / LBS_TO_KG;

    // Pallet presets (in inches)
    const PALLET_PRESETS = {
        '48x40': { length: 48, width: 40, name: 'GMA Standard' },
        '42x42': { length: 42, width: 42, name: 'Square' },
        '48x48': { length: 48, width: 48, name: 'Large Square' },
        'EUR': { length: 47.24, width: 31.5, name: 'EUR' }
    };

    // Box presets (in inches, lbs)
    const BOX_PRESETS = {
        'standard': { length: 18, width: 14, height: 12, weight: 25, name: 'Standard Case' },
        'small': { length: 12, width: 8, height: 6, weight: 10, name: 'Small Box' },
        'large': { length: 24, width: 18, height: 16, weight: 40, name: 'Master Case' }
    };

    // =========================================================================
    // DOM Elements
    // =========================================================================

    const elements = {};

    function cacheElements() {
        // Box inputs
        elements.boxLength = document.getElementById('boxLength');
        elements.boxWidth = document.getElementById('boxWidth');
        elements.boxHeight = document.getElementById('boxHeight');
        elements.boxWeight = document.getElementById('boxWeight');
        elements.boxQuantity = document.getElementById('boxQuantity');
        
        // Pallet inputs
        elements.palletPreset = document.getElementById('palletPreset');
        elements.palletLength = document.getElementById('palletLength');
        elements.palletWidth = document.getElementById('palletWidth');
        elements.maxHeight = document.getElementById('maxHeight');
        elements.maxWeight = document.getElementById('maxWeight');
        elements.customPalletDims = document.querySelector('.custom-pallet-dims');
        
        // Controls
        elements.calculateBtn = document.getElementById('calculateBtn');
        elements.resetViewBtn = document.getElementById('resetViewBtn');
        elements.toggleRotateBtn = document.getElementById('toggleRotateBtn');
        elements.exportPdfBtn = document.getElementById('exportPdfBtn');
        elements.printBtn = document.getElementById('printBtn');
        
        // Outputs
        elements.preview3d = document.getElementById('preview3d');
        elements.topView = document.getElementById('topView');
        elements.sideView = document.getElementById('sideView');
        
        // Results
        elements.resultPalletsNeeded = document.getElementById('resultPalletsNeeded');
        elements.resultBoxesPerPallet = document.getElementById('resultBoxesPerPallet');
        elements.resultBoxesPerLayer = document.getElementById('resultBoxesPerLayer');
        elements.resultLayers = document.getElementById('resultLayers');
        elements.resultCubeUtil = document.getElementById('resultCubeUtil');
        elements.resultWeightUtil = document.getElementById('resultWeightUtil');
        
        // Notes
        elements.optimizationNote = document.getElementById('optimizationNote');
        elements.noteText = document.getElementById('noteText');
        elements.constraintInfo = document.getElementById('constraintInfo');
        elements.heightConstraint = document.getElementById('heightConstraint');
        elements.weightConstraint = document.getElementById('weightConstraint');
        elements.orientationNote = document.getElementById('orientationNote');
        elements.orientationText = document.getElementById('orientationText');
        
        // Tooltip
        elements.tooltip = document.getElementById('tooltip');
    }

    // =========================================================================
    // Initialization
    // =========================================================================

    function init() {
        cacheElements();
        setupEventListeners();
        setupTooltips();
        init3DScene();
    }

    function setupEventListeners() {
        // Calculate button
        elements.calculateBtn.addEventListener('click', calculate);
        
        // Enter key triggers calculate
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') calculate();
            });
        });
        
        // Pallet preset change
        elements.palletPreset.addEventListener('change', handlePalletPresetChange);
        
        // Box presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => handleBoxPreset(btn.dataset.preset));
        });
        
        // Unit toggle
        document.querySelectorAll('.unit-btn').forEach(btn => {
            btn.addEventListener('click', () => handleUnitChange(btn.dataset.unit));
        });
        
        // 3D controls
        elements.resetViewBtn.addEventListener('click', resetCameraView);
        elements.toggleRotateBtn.addEventListener('click', toggleAutoRotate);
        
        // Export
        elements.exportPdfBtn.addEventListener('click', exportPDF);
        elements.printBtn.addEventListener('click', () => window.print());
    }

    function setupTooltips() {
        document.querySelectorAll('.tooltip-trigger').forEach(trigger => {
            trigger.addEventListener('mouseenter', showTooltip);
            trigger.addEventListener('mouseleave', hideTooltip);
            trigger.addEventListener('focus', showTooltip);
            trigger.addEventListener('blur', hideTooltip);
        });
    }

    function showTooltip(e) {
        const trigger = e.target;
        const text = trigger.dataset.tooltip;
        if (!text) return;
        
        elements.tooltip.textContent = text;
        elements.tooltip.classList.add('visible');
        
        const rect = trigger.getBoundingClientRect();
        const tooltipRect = elements.tooltip.getBoundingClientRect();
        
        let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        let top = rect.bottom + 8;
        
        // Keep on screen
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top + tooltipRect.height > window.innerHeight - 10) {
            top = rect.top - tooltipRect.height - 8;
        }
        
        elements.tooltip.style.left = `${left}px`;
        elements.tooltip.style.top = `${top}px`;
    }

    function hideTooltip() {
        elements.tooltip.classList.remove('visible');
    }

    // =========================================================================
    // Event Handlers
    // =========================================================================

    function handlePalletPresetChange() {
        const value = elements.palletPreset.value;
        
        if (value === 'custom') {
            elements.customPalletDims.style.display = '';
        } else {
            elements.customPalletDims.style.display = 'none';
            
            if (PALLET_PRESETS[value]) {
                const preset = PALLET_PRESETS[value];
                let length = preset.length;
                let width = preset.width;
                
                if (state.units === 'metric') {
                    length = length * INCH_TO_CM;
                    width = width * INCH_TO_CM;
                }
                
                elements.palletLength.value = Math.round(length * 100) / 100;
                elements.palletWidth.value = Math.round(width * 100) / 100;
            }
        }
    }

    function handleBoxPreset(presetName) {
        const preset = BOX_PRESETS[presetName];
        if (!preset) return;
        
        let { length, width, height, weight } = preset;
        
        if (state.units === 'metric') {
            length = length * INCH_TO_CM;
            width = width * INCH_TO_CM;
            height = height * INCH_TO_CM;
            weight = weight * LBS_TO_KG;
        }
        
        elements.boxLength.value = Math.round(length * 100) / 100;
        elements.boxWidth.value = Math.round(width * 100) / 100;
        elements.boxHeight.value = Math.round(height * 100) / 100;
        elements.boxWeight.value = Math.round(weight * 10) / 10;
    }

    function handleUnitChange(newUnit) {
        if (newUnit === state.units) return;
        
        // Update active button
        document.querySelectorAll('.unit-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.unit === newUnit);
        });
        
        // Convert current values
        const factor = newUnit === 'metric' 
            ? { length: INCH_TO_CM, weight: LBS_TO_KG }
            : { length: CM_TO_INCH, weight: KG_TO_LBS };
        
        // Convert box dimensions
        elements.boxLength.value = round(parseFloat(elements.boxLength.value) * factor.length);
        elements.boxWidth.value = round(parseFloat(elements.boxWidth.value) * factor.length);
        elements.boxHeight.value = round(parseFloat(elements.boxHeight.value) * factor.length);
        elements.boxWeight.value = round(parseFloat(elements.boxWeight.value) * factor.weight, 1);
        
        // Convert pallet dimensions
        elements.palletLength.value = round(parseFloat(elements.palletLength.value) * factor.length);
        elements.palletWidth.value = round(parseFloat(elements.palletWidth.value) * factor.length);
        elements.maxHeight.value = round(parseFloat(elements.maxHeight.value) * factor.length);
        elements.maxWeight.value = round(parseFloat(elements.maxWeight.value) * factor.weight);
        
        // Update unit labels
        const lengthUnit = newUnit === 'metric' ? 'cm' : 'in';
        const weightUnit = newUnit === 'metric' ? 'kg' : 'lbs';
        
        document.querySelectorAll('.unit').forEach(el => {
            if (el.id && el.id.toLowerCase().includes('weight')) {
                el.textContent = weightUnit;
            } else {
                el.textContent = lengthUnit;
            }
        });
        
        state.units = newUnit;
    }

    function round(value, decimals = 2) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    // =========================================================================
    // Calculation Engine
    // =========================================================================

    function calculate() {
        // Get inputs (convert to inches/lbs for internal calculation)
        const isMetric = state.units === 'metric';
        const lengthFactor = isMetric ? CM_TO_INCH : 1;
        const weightFactor = isMetric ? KG_TO_LBS : 1;
        
        const box = {
            length: parseFloat(elements.boxLength.value) * lengthFactor,
            width: parseFloat(elements.boxWidth.value) * lengthFactor,
            height: parseFloat(elements.boxHeight.value) * lengthFactor,
            weight: parseFloat(elements.boxWeight.value) * weightFactor
        };
        
        const pallet = {
            length: parseFloat(elements.palletLength.value) * lengthFactor,
            width: parseFloat(elements.palletWidth.value) * lengthFactor
        };
        
        const maxHeight = parseFloat(elements.maxHeight.value) * lengthFactor;
        const maxWeight = parseFloat(elements.maxWeight.value) * weightFactor;
        const totalQuantity = parseInt(elements.boxQuantity.value);
        const optimizeFor = document.querySelector('input[name="optimizeFor"]:checked').value;
        
        // Validate inputs
        if (!validateInputs(box, pallet, maxHeight, maxWeight, totalQuantity)) {
            return;
        }
        
        // Calculate both orientations
        const orientation1 = calculateOrientation(box.length, box.width, pallet.length, pallet.width);
        const orientation2 = calculateOrientation(box.width, box.length, pallet.length, pallet.width);
        
        // Choose best orientation
        let bestOrientation;
        let rotated = false;
        
        if (orientation1.boxesPerLayer >= orientation2.boxesPerLayer) {
            bestOrientation = orientation1;
        } else {
            bestOrientation = orientation2;
            rotated = true;
        }
        
        // Calculate layers based on height
        const maxLayersByHeight = Math.floor(maxHeight / box.height);
        
        // Calculate layers based on weight
        const weightPerLayer = bestOrientation.boxesPerLayer * box.weight;
        let maxLayersByWeight = Math.floor(maxWeight / weightPerLayer);
        
        // Apply optimization mode
        let effectiveMaxWeight = maxWeight;
        if (optimizeFor === 'weight') {
            effectiveMaxWeight = maxWeight * 0.8; // 80% capacity for safety
            maxLayersByWeight = Math.floor(effectiveMaxWeight / weightPerLayer);
        }
        
        // Determine actual layers (limited by height or weight)
        const layers = Math.min(maxLayersByHeight, maxLayersByWeight);
        const limitedBy = maxLayersByWeight < maxLayersByHeight ? 'weight' : 'height';
        
        // Calculate boxes per pallet
        const boxesPerPallet = bestOrientation.boxesPerLayer * layers;
        
        // Calculate pallets needed
        const palletsNeeded = Math.ceil(totalQuantity / boxesPerPallet);
        
        // Calculate utilization
        const boxVolume = box.length * box.width * box.height;
        const palletVolume = pallet.length * pallet.width * maxHeight;
        const usedVolume = boxesPerPallet * boxVolume;
        const cubeUtilization = (usedVolume / palletVolume) * 100;
        
        const palletWeight = boxesPerPallet * box.weight;
        const weightUtilization = (palletWeight / maxWeight) * 100;
        
        // Store results
        state.results = {
            box,
            pallet,
            maxHeight,
            maxWeight,
            totalQuantity,
            optimizeFor,
            
            orientation: bestOrientation,
            rotated,
            layers,
            limitedBy,
            maxLayersByHeight,
            maxLayersByWeight,
            
            boxesPerLayer: bestOrientation.boxesPerLayer,
            boxesPerPallet,
            palletsNeeded,
            
            cubeUtilization,
            weightUtilization,
            palletWeight
        };
        
        // Update UI
        displayResults();
        draw2DViews();
        update3DScene();
    }

    function calculateOrientation(boxL, boxW, palletL, palletW) {
        const boxesAlongLength = Math.floor(palletL / boxL);
        const boxesAlongWidth = Math.floor(palletW / boxW);
        const boxesPerLayer = boxesAlongLength * boxesAlongWidth;
        
        return {
            boxLength: boxL,
            boxWidth: boxW,
            boxesAlongLength,
            boxesAlongWidth,
            boxesPerLayer
        };
    }

    function validateInputs(box, pallet, maxHeight, maxWeight, quantity) {
        // Check for valid numbers
        if (isNaN(box.length) || isNaN(box.width) || isNaN(box.height) || 
            isNaN(box.weight) || isNaN(pallet.length) || isNaN(pallet.width) ||
            isNaN(maxHeight) || isNaN(maxWeight) || isNaN(quantity)) {
            alert('Please enter valid numbers for all fields.');
            return false;
        }
        
        // Check box fits on pallet
        const boxFits = (box.length <= pallet.length && box.width <= pallet.width) ||
                       (box.width <= pallet.length && box.length <= pallet.width);
        
        if (!boxFits) {
            alert('Box dimensions are too large to fit on the pallet.');
            return false;
        }
        
        // Check box height vs max height
        if (box.height > maxHeight) {
            alert('Box height exceeds maximum stack height.');
            return false;
        }
        
        // Check single box weight vs max weight
        if (box.weight > maxWeight) {
            alert('Single box weight exceeds maximum pallet weight.');
            return false;
        }
        
        return true;
    }

    // =========================================================================
    // Display Results
    // =========================================================================

    function displayResults() {
        const r = state.results;
        if (!r) return;
        
        // Main results
        elements.resultPalletsNeeded.textContent = r.palletsNeeded;
        elements.resultBoxesPerPallet.textContent = r.boxesPerPallet;
        elements.resultBoxesPerLayer.textContent = r.boxesPerLayer;
        elements.resultLayers.textContent = r.layers;
        elements.resultCubeUtil.textContent = `${r.cubeUtilization.toFixed(1)}%`;
        elements.resultWeightUtil.textContent = `${r.weightUtilization.toFixed(1)}%`;
        
        // Optimization note
        if (r.optimizeFor === 'weight') {
            elements.optimizationNote.style.display = 'flex';
            elements.noteText.textContent = 'Weight Safety mode: Limited to 80% of max weight capacity.';
        } else if (r.optimizeFor === 'pallets') {
            elements.optimizationNote.style.display = 'flex';
            elements.noteText.textContent = `Optimized for minimum pallets. Total boxes: ${r.totalQuantity}, using ${r.palletsNeeded} pallets.`;
        } else {
            elements.optimizationNote.style.display = 'none';
        }
        
        // Constraint info
        elements.constraintInfo.style.display = 'flex';
        
        const heightText = elements.heightConstraint.querySelector('.constraint-text');
        heightText.textContent = `Height: ${r.maxLayersByHeight} layers possible (${r.box.height.toFixed(1)}" × ${r.maxLayersByHeight} = ${(r.box.height * r.maxLayersByHeight).toFixed(1)}" of ${r.maxHeight}" max)`;
        
        const weightText = elements.weightConstraint.querySelector('.constraint-text');
        const weightPerPallet = (r.boxesPerLayer * r.layers * r.box.weight).toFixed(0);
        weightText.textContent = `Weight: ${r.maxLayersByWeight} layers possible (${weightPerPallet} lbs of ${r.maxWeight} lbs max)`;
        
        // Highlight limiting factor
        elements.heightConstraint.style.opacity = r.limitedBy === 'height' ? '1' : '0.6';
        elements.weightConstraint.style.opacity = r.limitedBy === 'weight' ? '1' : '0.6';
        
        // Orientation note
        if (r.rotated) {
            elements.orientationNote.style.display = 'flex';
            const originalOrientation = calculateOrientation(r.box.length, r.box.width, r.pallet.length, r.pallet.width);
            const improvement = r.orientation.boxesPerLayer - originalOrientation.boxesPerLayer;
            elements.orientationText.textContent = `Best orientation: rotated 90° (+${improvement} boxes/layer)`;
        } else {
            elements.orientationNote.style.display = 'none';
        }
    }

    // =========================================================================
    // 2D Views
    // =========================================================================

    function draw2DViews() {
        drawTopView();
        drawSideView();
    }

    function drawTopView() {
        const r = state.results;
        if (!r) return;
        
        const container = elements.topView;
        container.innerHTML = '';
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Size canvas to container
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Calculate scale
        const padding = 20;
        const availableWidth = canvas.width - padding * 2;
        const availableHeight = canvas.height - padding * 2;
        const scale = Math.min(
            availableWidth / r.pallet.length,
            availableHeight / r.pallet.width
        );
        
        // Center offset
        const offsetX = (canvas.width - r.pallet.length * scale) / 2;
        const offsetY = (canvas.height - r.pallet.width * scale) / 2;
        
        // Draw pallet outline
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 2;
        ctx.strokeRect(offsetX, offsetY, r.pallet.length * scale, r.pallet.width * scale);
        
        // Draw boxes
        ctx.fillStyle = '#3b82f6';
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 1;
        
        const boxL = r.orientation.boxLength * scale;
        const boxW = r.orientation.boxWidth * scale;
        
        for (let i = 0; i < r.orientation.boxesAlongLength; i++) {
            for (let j = 0; j < r.orientation.boxesAlongWidth; j++) {
                const x = offsetX + i * boxL;
                const y = offsetY + j * boxW;
                ctx.fillRect(x + 1, y + 1, boxL - 2, boxW - 2);
                ctx.strokeRect(x + 1, y + 1, boxL - 2, boxW - 2);
            }
        }
        
        // Draw dimensions
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        
        // Pallet length
        ctx.fillText(`${r.pallet.length.toFixed(1)}"`, canvas.width / 2, canvas.height - 4);
        
        // Pallet width (rotated)
        ctx.save();
        ctx.translate(12, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${r.pallet.width.toFixed(1)}"`, 0, 0);
        ctx.restore();
        
        container.appendChild(canvas);
    }

    function drawSideView() {
        const r = state.results;
        if (!r) return;
        
        const container = elements.sideView;
        container.innerHTML = '';
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Size canvas to container
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Calculate scale
        const padding = 20;
        const palletHeight = 6; // Pallet deck height in inches
        const totalHeight = r.maxHeight + palletHeight;
        const availableWidth = canvas.width - padding * 2;
        const availableHeight = canvas.height - padding * 2;
        const scale = Math.min(
            availableWidth / r.pallet.length,
            availableHeight / totalHeight
        );
        
        // Center offset
        const offsetX = (canvas.width - r.pallet.length * scale) / 2;
        const offsetY = canvas.height - padding - palletHeight * scale;
        
        // Draw pallet deck
        ctx.fillStyle = '#78716c';
        ctx.fillRect(offsetX, offsetY, r.pallet.length * scale, palletHeight * scale);
        
        // Draw boxes
        ctx.fillStyle = '#3b82f6';
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 1;
        
        const boxL = r.orientation.boxLength * scale;
        const boxH = r.box.height * scale;
        
        for (let layer = 0; layer < r.layers; layer++) {
            for (let i = 0; i < r.orientation.boxesAlongLength; i++) {
                const x = offsetX + i * boxL;
                const y = offsetY - (layer + 1) * boxH;
                ctx.fillRect(x + 1, y + 1, boxL - 2, boxH - 2);
                ctx.strokeRect(x + 1, y + 1, boxL - 2, boxH - 2);
            }
        }
        
        // Draw max height line
        const maxHeightY = offsetY - r.maxHeight * scale;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(offsetX - 10, maxHeightY);
        ctx.lineTo(offsetX + r.pallet.length * scale + 10, maxHeightY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw dimensions
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        
        // Stack height
        const stackHeight = r.layers * r.box.height;
        ctx.save();
        ctx.translate(canvas.width - 8, offsetY - stackHeight * scale / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${stackHeight.toFixed(1)}" stack`, 0, 0);
        ctx.restore();
        
        // Max height label
        ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.textAlign = 'left';
        ctx.fillText(`${r.maxHeight}" max`, offsetX + r.pallet.length * scale + 15, maxHeightY + 4);
        
        container.appendChild(canvas);
    }

    // =========================================================================
    // 3D Scene (Three.js)
    // =========================================================================

    function init3DScene() {
        const container = elements.preview3d;
        
        // Create scene
        state.scene = new THREE.Scene();
        state.scene.background = new THREE.Color(0x0f172a);
        
        // Create camera
        const aspect = container.clientWidth / container.clientHeight;
        state.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        state.camera.position.set(80, 60, 80);
        state.camera.lookAt(0, 20, 0);
        
        // Create renderer
        state.renderer = new THREE.WebGLRenderer({ antialias: true });
        state.renderer.setSize(container.clientWidth, container.clientHeight);
        state.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        state.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        state.scene.add(directionalLight);
        
        // Add grid helper
        const gridHelper = new THREE.GridHelper(100, 20, 0x334155, 0x1e293b);
        state.scene.add(gridHelper);
        
        // Mouse controls
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        state.renderer.domElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;
            
            // Rotate camera around center
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(state.camera.position);
            
            spherical.theta -= deltaX * 0.01;
            spherical.phi -= deltaY * 0.01;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
            
            state.camera.position.setFromSpherical(spherical);
            state.camera.lookAt(0, 20, 0);
            
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        // Zoom with scroll
        state.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            const direction = e.deltaY > 0 ? 1 : -1;
            
            state.camera.position.multiplyScalar(1 + direction * zoomSpeed);
            
            // Clamp zoom
            const distance = state.camera.position.length();
            if (distance < 30) state.camera.position.setLength(30);
            if (distance > 200) state.camera.position.setLength(200);
        });
        
        // Handle resize
        window.addEventListener('resize', () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            
            state.camera.aspect = width / height;
            state.camera.updateProjectionMatrix();
            state.renderer.setSize(width, height);
        });
        
        // Start render loop
        function animate() {
            state.animationId = requestAnimationFrame(animate);
            
            if (state.autoRotate) {
                const spherical = new THREE.Spherical();
                spherical.setFromVector3(state.camera.position);
                spherical.theta += 0.005;
                state.camera.position.setFromSpherical(spherical);
                state.camera.lookAt(0, 20, 0);
            }
            
            state.renderer.render(state.scene, state.camera);
        }
        animate();
    }

    function update3DScene() {
        const r = state.results;
        if (!r) return;
        
        // Remove existing boxes and pallet
        const toRemove = [];
        state.scene.traverse((obj) => {
            if (obj.userData.isBox || obj.userData.isPallet || obj.userData.isHeightLimit) {
                toRemove.push(obj);
            }
        });
        toRemove.forEach(obj => state.scene.remove(obj));
        
        // Scale factor (1 inch = 0.5 units for good view)
        const scale = 0.5;
        
        // Create pallet
        const palletGeom = new THREE.BoxGeometry(
            r.pallet.length * scale,
            6 * scale, // 6 inch pallet height
            r.pallet.width * scale
        );
        const palletMat = new THREE.MeshLambertMaterial({ color: 0x78716c });
        const palletMesh = new THREE.Mesh(palletGeom, palletMat);
        palletMesh.position.set(0, 3 * scale, 0);
        palletMesh.userData.isPallet = true;
        state.scene.add(palletMesh);
        
        // Create boxes
        const boxGeom = new THREE.BoxGeometry(
            r.orientation.boxLength * scale - 0.3,
            r.box.height * scale - 0.3,
            r.orientation.boxWidth * scale - 0.3
        );
        const boxMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
        const boxEdgeMat = new THREE.LineBasicMaterial({ color: 0x1e40af });
        
        const palletTop = 6 * scale;
        const startX = -r.pallet.length * scale / 2 + r.orientation.boxLength * scale / 2;
        const startZ = -r.pallet.width * scale / 2 + r.orientation.boxWidth * scale / 2;
        
        for (let layer = 0; layer < r.layers; layer++) {
            for (let i = 0; i < r.orientation.boxesAlongLength; i++) {
                for (let j = 0; j < r.orientation.boxesAlongWidth; j++) {
                    const boxMesh = new THREE.Mesh(boxGeom, boxMat);
                    boxMesh.position.set(
                        startX + i * r.orientation.boxLength * scale,
                        palletTop + r.box.height * scale / 2 + layer * r.box.height * scale,
                        startZ + j * r.orientation.boxWidth * scale
                    );
                    boxMesh.userData.isBox = true;
                    state.scene.add(boxMesh);
                    
                    // Add edges
                    const edges = new THREE.EdgesGeometry(boxGeom);
                    const line = new THREE.LineSegments(edges, boxEdgeMat);
                    line.position.copy(boxMesh.position);
                    line.userData.isBox = true;
                    state.scene.add(line);
                }
            }
        }
        
        // Add height limit plane
        const limitGeom = new THREE.PlaneGeometry(r.pallet.length * scale + 10, r.pallet.width * scale + 10);
        const limitMat = new THREE.MeshBasicMaterial({ 
            color: 0xef4444, 
            transparent: true, 
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        const limitMesh = new THREE.Mesh(limitGeom, limitMat);
        limitMesh.rotation.x = -Math.PI / 2;
        limitMesh.position.set(0, palletTop + r.maxHeight * scale, 0);
        limitMesh.userData.isHeightLimit = true;
        state.scene.add(limitMesh);
        
        // Show the canvas, hide placeholder
        const container = elements.preview3d;
        const placeholder = container.querySelector('.preview-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        if (!container.contains(state.renderer.domElement)) {
            container.appendChild(state.renderer.domElement);
        }
        
        // Reset camera to good viewing angle
        resetCameraView();
    }

    function resetCameraView() {
        if (!state.camera) return;
        
        state.camera.position.set(80, 60, 80);
        state.camera.lookAt(0, 20, 0);
    }

    function toggleAutoRotate() {
        state.autoRotate = !state.autoRotate;
        elements.toggleRotateBtn.classList.toggle('active', state.autoRotate);
    }

    // =========================================================================
    // Export Functions
    // =========================================================================

    function exportPDF() {
        const r = state.results;
        if (!r) {
            alert('Please calculate a pallet load first.');
            return;
        }
        
        // Create a printable report
        const reportWindow = window.open('', '_blank');
        if (!reportWindow) {
            alert('Please allow popups to export PDF.');
            return;
        }
        
        const isMetric = state.units === 'metric';
        const lengthUnit = isMetric ? 'cm' : 'in';
        const weightUnit = isMetric ? 'kg' : 'lbs';
        
        // Convert values for display
        const displayFactor = isMetric ? INCH_TO_CM : 1;
        const weightDisplayFactor = isMetric ? LBS_TO_KG : 1;
        
        const boxL = (r.box.length * displayFactor).toFixed(1);
        const boxW = (r.box.width * displayFactor).toFixed(1);
        const boxH = (r.box.height * displayFactor).toFixed(1);
        const boxWt = (r.box.weight * weightDisplayFactor).toFixed(1);
        const palletL = (r.pallet.length * displayFactor).toFixed(1);
        const palletW = (r.pallet.width * displayFactor).toFixed(1);
        const maxH = (r.maxHeight * displayFactor).toFixed(1);
        const maxWt = (r.maxWeight * weightDisplayFactor).toFixed(0);
        const palletWt = (r.palletWeight * weightDisplayFactor).toFixed(0);
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Pallet Load Report</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #1f2937;
            padding: 0.5in;
        }
        .header { 
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .header h1 { 
            font-size: 20px;
            color: #1f2937;
            margin-bottom: 4px;
        }
        .header p { 
            color: #6b7280;
            font-size: 11px;
        }
        .section {
            margin-bottom: 20px;
        }
        .section h2 {
            font-size: 14px;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 6px;
            margin-bottom: 10px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
        }
        .grid-2 {
            grid-template-columns: repeat(2, 1fr);
        }
        .stat {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
            text-align: center;
        }
        .stat.primary {
            background: #eff6ff;
            border-color: #bfdbfe;
        }
        .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
        }
        .stat.primary .stat-value {
            color: #2563eb;
        }
        .stat-label {
            font-size: 10px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 6px 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-table td:first-child {
            color: #6b7280;
            width: 40%;
        }
        .info-table td:last-child {
            font-weight: 500;
        }
        .note {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 6px;
            padding: 10px 12px;
            font-size: 11px;
            margin-top: 12px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 10px;
            text-align: center;
        }
        @media print {
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Pallet Load Report</h1>
        <p>Generated ${new Date().toLocaleString()} • mattlivingston.com/tools/pallet-calculator</p>
    </div>
    
    <div class="section">
        <h2>Summary</h2>
        <div class="grid">
            <div class="stat primary">
                <div class="stat-value">${r.palletsNeeded}</div>
                <div class="stat-label">Pallets Needed</div>
            </div>
            <div class="stat primary">
                <div class="stat-value">${r.boxesPerPallet}</div>
                <div class="stat-label">Boxes per Pallet</div>
            </div>
            <div class="stat">
                <div class="stat-value">${r.totalQuantity}</div>
                <div class="stat-label">Total Boxes</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>Configuration</h2>
        <div class="grid grid-2">
            <div>
                <h3 style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">Box Dimensions</h3>
                <table class="info-table">
                    <tr><td>Size (L×W×H)</td><td>${boxL} × ${boxW} × ${boxH} ${lengthUnit}</td></tr>
                    <tr><td>Weight</td><td>${boxWt} ${weightUnit}</td></tr>
                    <tr><td>Quantity</td><td>${r.totalQuantity} boxes</td></tr>
                </table>
            </div>
            <div>
                <h3 style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">Pallet Configuration</h3>
                <table class="info-table">
                    <tr><td>Pallet Size</td><td>${palletL} × ${palletW} ${lengthUnit}</td></tr>
                    <tr><td>Max Height</td><td>${maxH} ${lengthUnit}</td></tr>
                    <tr><td>Max Weight</td><td>${maxWt} ${weightUnit}</td></tr>
                </table>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>Results Detail</h2>
        <div class="grid">
            <div class="stat">
                <div class="stat-value">${r.boxesPerLayer}</div>
                <div class="stat-label">Boxes per Layer</div>
            </div>
            <div class="stat">
                <div class="stat-value">${r.layers}</div>
                <div class="stat-label">Layers</div>
            </div>
            <div class="stat">
                <div class="stat-value">${palletWt}</div>
                <div class="stat-label">Pallet Weight (${weightUnit})</div>
            </div>
            <div class="stat">
                <div class="stat-value">${r.cubeUtilization.toFixed(1)}%</div>
                <div class="stat-label">Cube Utilization</div>
            </div>
            <div class="stat">
                <div class="stat-value">${r.weightUtilization.toFixed(1)}%</div>
                <div class="stat-label">Weight Utilization</div>
            </div>
            <div class="stat">
                <div class="stat-value">${r.limitedBy === 'weight' ? 'Weight' : 'Height'}</div>
                <div class="stat-label">Limiting Factor</div>
            </div>
        </div>
        ${r.rotated ? `
        <div class="note">
            <strong>Optimization Applied:</strong> Boxes rotated 90° for better fit.
        </div>
        ` : ''}
    </div>
    
    <div class="footer">
        Pallet Load Calculator • mattlivingston.com/tools/pallet-calculator
    </div>
    
    <script>
        window.onload = function() {
            window.print();
        };
    <\/script>
</body>
</html>
        `;
        
        reportWindow.document.write(html);
        reportWindow.document.close();
    }

    // =========================================================================
    // Initialize
    // =========================================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
