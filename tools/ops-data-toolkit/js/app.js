/**
 * Ops Data Toolkit - Main Application
 * Coordinates state, UI, and modules
 */

import State from './state.js';
import { DataGrid, ResultsGrid } from './grid.js';
import { parseCSV, parseClipboard, validateData, cleanData, generateSample, generateCountSample, getSampleScenario, SAMPLE_SCENARIOS } from './parser.js';
import { loadProject, saveProject, autoSave } from './storage.js';
import { exportData, exportToClipboard, showToast } from './export.js';

// Import modules
import { CleaningModule } from './modules/cleaning.js';
import { ValidationModule } from './modules/validation.js';
import { DuplicatesModule } from './modules/duplicates.js';
import { SumIfModule } from './modules/sumif.js';
import { ReconcileModule } from './modules/reconcile.js';
import { LookupModule } from './modules/lookup.js';

// UI Components
let dataGrid = null;
let resultsGrid = null;

// Module registry
const modules = {
    cleaning: CleaningModule,
    validation: ValidationModule,
    duplicates: DuplicatesModule,
    sumif: SumIfModule,
    reconcile: ReconcileModule,
    lookup: LookupModule
};

/**
 * Initialize application
 */
function init() {
    console.log('Initializing Ops Data Toolkit...');
    
    // Initialize grids
    dataGrid = new DataGrid(document.getElementById('dataGrid'));
    resultsGrid = new ResultsGrid(document.getElementById('resultsGrid'));
    
    // Set up event listeners
    setupEventListeners();
    
    // Subscribe to state changes
    State.subscribe(onStateChange);
    
    // Load saved project if exists
    const saved = loadProject();
    if (saved) {
        State.importProject(saved);
        console.log('Loaded saved project');
    }
    
    // Initialize module navigation
    renderModuleNav();
    
    console.log('App initialized');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const moduleRail = document.querySelector('.module-rail');
    const moduleOverlay = document.getElementById('moduleOverlay');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            moduleRail.classList.toggle('open');
            moduleOverlay.classList.toggle('show');
        });
    }
    
    if (moduleOverlay) {
        moduleOverlay.addEventListener('click', () => {
            moduleRail.classList.remove('open');
            moduleOverlay.classList.remove('show');
        });
    }
    
    // Close sidebar when selecting a module on mobile
    const closeSidebarOnMobile = () => {
        if (window.innerWidth <= 768) {
            moduleRail.classList.remove('open');
            moduleOverlay.classList.remove('show');
        }
    };
    
    // File import
    document.getElementById('importCSV').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    
    const importPromptBtn = document.getElementById('importPrompt');
    
    console.log('setupEventListeners - importPrompt:', importPromptBtn);
    
    if (importPromptBtn) {
        importPromptBtn.addEventListener('click', () => {
            console.log('importPrompt clicked from setupEventListeners');
            document.getElementById('fileInput').click();
        });
    }
    
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    
    // Paste from clipboard
    document.getElementById('pasteTable').addEventListener('click', handlePaste);
    
    // Load sample data dropdown
    const sampleBtn = document.getElementById('loadSample');
    const sampleMenu = document.getElementById('sampleMenu');
    
    if (sampleBtn && sampleMenu) {
        sampleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sampleMenu.classList.toggle('show');
            // Close inline menu if open
            document.getElementById('inlineSampleMenu')?.classList.remove('show');
        });
        
        // Handle sample selection
        sampleMenu.querySelectorAll('button[data-sample]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sampleKey = e.currentTarget.dataset.sample;
                handleLoadSample(sampleKey);
                sampleMenu.classList.remove('show');
            });
        });
    }
    
    // Inline sample dropdown (in empty state)
    const inlineSampleBtn = document.getElementById('inlineSampleBtn');
    const inlineSampleMenu = document.getElementById('inlineSampleMenu');
    
    if (inlineSampleBtn && inlineSampleMenu) {
        inlineSampleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            inlineSampleMenu.classList.toggle('show');
            // Close header menu if open
            sampleMenu?.classList.remove('show');
        });
        
        // Handle sample selection
        inlineSampleMenu.querySelectorAll('button[data-sample]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sampleKey = e.currentTarget.dataset.sample;
                handleLoadSample(sampleKey);
                inlineSampleMenu.classList.remove('show');
            });
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.sample-dropdown')) {
            sampleMenu?.classList.remove('show');
            inlineSampleMenu?.classList.remove('show');
        }
    });
    
    // Export
    document.getElementById('exportCSV').addEventListener('click', handleExport);
    document.getElementById('copyTSV').addEventListener('click', handleCopyTSV);
    
    // Reset
    document.getElementById('reset').addEventListener('click', handleReset);
    
    // Sheet tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const sheet = e.currentTarget.dataset.sheet;
            State.setActiveSheet(sheet);
        });
    });
    
    // Key column select
    document.getElementById('keyColumnSelect').addEventListener('change', (e) => {
        const sheet = State.getActiveSheet();
        if (sheet) {
            sheet.keyColumn = e.target.value;
            State.update(`sheets.${State.project.activeSheet}.keyColumn`, e.target.value);
        }
    });
    
    // Search
    const searchInput = document.getElementById('dataSearch');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            dataGrid.search(e.target.value);
        }, 300);
    });
    
    // Modal
    document.getElementById('showLogic').addEventListener('click', showLogicModal);
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', hideLogicModal);
    });
    document.querySelector('.modal-overlay')?.addEventListener('click', hideLogicModal);
    
    // Listen for loadSample events from dynamically rendered grid empty state
    window.addEventListener('loadSample', (e) => {
        handleLoadSample(e.detail);
    });
}

/**
 * Handle file selection
 */
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        showToast('Parsing file...', 'info');
        
        const parsed = await parseCSV(file);
        const validation = validateData(parsed);
        
        if (!validation.valid) {
            showToast(`Validation errors: ${validation.errors.join(', ')}`, 'error');
            return;
        }
        
        const cleaned = cleanData(parsed);
        
        // Determine which sheet to load into
        const targetSheet = State.hasData('A') ? 'B' : 'A';
        
        State.setSheet(targetSheet, cleaned);
        State.setActiveSheet(targetSheet);
        
        showToast(`Loaded ${cleaned.data.length} rows into Sheet ${targetSheet}`, 'success');
        
        // Auto-save
        autoSave(State.project);
        
    } catch (error) {
        showToast(`Failed to load file: ${error.message}`, 'error');
        console.error(error);
    }
    
    // Reset file input
    event.target.value = '';
}

/**
 * Handle paste from clipboard
 */
async function handlePaste() {
    try {
        const text = await navigator.clipboard.readText();
        
        if (!text) {
            showToast('No data in clipboard', 'error');
            return;
        }
        
        const parsed = await parseClipboard(text);
        const validation = validateData(parsed);
        
        if (!validation.valid) {
            showToast(`Validation errors: ${validation.errors.join(', ')}`, 'error');
            return;
        }
        
        const cleaned = cleanData(parsed);
        
        const targetSheet = State.hasData('A') ? 'B' : 'A';
        
        State.setSheet(targetSheet, cleaned);
        State.setActiveSheet(targetSheet);
        
        showToast(`Pasted ${cleaned.data.length} rows into Sheet ${targetSheet}`, 'success');
        
    } catch (error) {
        showToast(`Failed to paste: ${error.message}`, 'error');
        console.error(error);
    }
}

/**
 * Load sample data scenario
 */
function handleLoadSample(scenarioKey) {
    const scenario = getSampleScenario(scenarioKey);
    
    if (!scenario) {
        // Fallback to basic sample
        const sample = generateSample();
        State.setSheet('A', sample);
        State.setActiveSheet('A');
        
        const countSample = generateCountSample();
        State.setSheet('B', countSample);
        
        showToast('Sample data loaded', 'success');
        return;
    }
    
    // Load Sheet A
    if (scenario.sheetA) {
        State.setSheet('A', {
            data: scenario.sheetA.data,
            columns: scenario.sheetA.columns,
            name: scenario.sheetA.name,
            originalColumns: scenario.sheetA.columns.map(c => c.toUpperCase().replace(/_/g, ' '))
        });
    }
    
    // Load Sheet B if present
    if (scenario.sheetB) {
        State.setSheet('B', {
            data: scenario.sheetB.data,
            columns: scenario.sheetB.columns,
            name: scenario.sheetB.name,
            originalColumns: scenario.sheetB.columns.map(c => c.toUpperCase().replace(/_/g, ' '))
        });
    } else {
        // Clear Sheet B if scenario doesn't use it
        State.clearSheet('B');
    }
    
    State.setActiveSheet('A');
    
    // Auto-select suggested module if available
    if (scenario.suggestedModule && modules[scenario.suggestedModule]) {
        setTimeout(() => {
            switchModule(scenario.suggestedModule);
        }, 100);
    }
    
    showToast(`Loaded: ${scenario.name}`, 'success');
}

/**
 * Export current sheet data
 */
function handleExport() {
    const sheet = State.getActiveSheet();
    
    if (!sheet || !sheet.data) {
        showToast('No data to export', 'error');
        return;
    }
    
    exportData(sheet.data, sheet.columns, sheet.name || 'export');
    showToast('Data exported', 'success');
}

/**
 * Copy results as TSV
 */
async function handleCopyTSV() {
    const results = State.project.results;
    
    if (!results || !results.data) {
        showToast('No results to copy', 'error');
        return;
    }
    
    const success = await exportToClipboard(results.data, results.columns);
    
    if (success) {
        showToast('Copied to clipboard - ready to paste into Excel', 'success');
    } else {
        showToast('Failed to copy to clipboard', 'error');
    }
}

/**
 * Reset application
 */
function handleReset() {
    if (!confirm('Clear all data and reset the application?')) {
        return;
    }
    
    State.reset();
    showToast('Application reset', 'success');
}

/**
 * State change handler - update UI
 */
function onStateChange(project, change) {
    // Update data grid
    const sheet = State.getActiveSheet();
    if (sheet && sheet.data) {
        dataGrid.render(sheet.data, sheet.columns);
        populateKeyColumnSelect(sheet.columns);
        updateSheetBadge(State.project.activeSheet, sheet.data.length);
    } else {
        dataGrid.clear();
        populateKeyColumnSelect([]);
        updateSheetBadge(State.project.activeSheet, 0);
    }
    
    // Update sheet tabs
    updateSheetTabs();
    
    // Update export button state
    document.getElementById('exportCSV').disabled = !sheet || !sheet.data;
    
    // Update results if present
    if (project.results) {
        updateResults(project.results);
    }
    
    // Re-render active module if sheet changed
    if (change?.path?.startsWith('sheets') && project.activeModule) {
        const module = modules[project.activeModule];
        if (module) {
            const controlsWrapper = document.querySelector('.module-controls-wrapper');
            if (controlsWrapper) {
                module.renderControls(controlsWrapper);
            }
        }
    }
}

/**
 * Update sheet tab states
 */
function updateSheetTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        const sheet = tab.dataset.sheet;
        tab.classList.toggle('active', sheet === State.project.activeSheet);
    });
}

/**
 * Update sheet badge (row count)
 */
function updateSheetBadge(sheet, count) {
    const badge = document.getElementById(`badge${sheet}`);
    if (badge) {
        badge.textContent = `${count} rows`;
    }
}

/**
 * Populate key column dropdown
 */
function populateKeyColumnSelect(columns) {
    const select = document.getElementById('keyColumnSelect');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">- None -</option>';
    
    columns.forEach(col => {
        const option = document.createElement('option');
        option.value = col;
        option.textContent = col.replace(/_/g, ' ').toUpperCase();
        select.appendChild(option);
    });
    
    // Restore selection if still valid
    if (columns.includes(currentValue)) {
        select.value = currentValue;
    } else {
        // Auto-select common key columns
        const commonKeys = ['sku', 'id', 'key', 'item', 'product'];
        for (const key of commonKeys) {
            if (columns.includes(key)) {
                select.value = key;
                const sheet = State.getActiveSheet();
                if (sheet) {
                    sheet.keyColumn = key;
                }
                break;
            }
        }
    }
}

/**
 * Render module navigation
 */
function renderModuleNav() {
    const nav = document.getElementById('moduleNav');
    
    // Module list with enabled state
    const moduleList = [
        { id: 'cleaning', module: modules.cleaning, icon: '🧹' },
        { id: 'validation', module: modules.validation, icon: '✓' },
        { id: 'duplicates', module: modules.duplicates, icon: '👯' },
        { id: 'sumif', module: modules.sumif, icon: '∑' },
        { id: 'reconcile', module: modules.reconcile, icon: '⚖️' },
        { id: 'lookup', module: modules.lookup, icon: '🔍' },
        { id: 'pivot', name: 'Pivot', icon: '📊', disabled: true },
        { id: 'uom', name: 'UOM', icon: '📏', disabled: true }
    ];
    
    nav.innerHTML = moduleList.map(mod => `
        <button 
            class="module-btn" 
            data-module="${mod.id}"
            ${mod.disabled ? 'disabled' : ''}>
            ${mod.icon} ${mod.module ? mod.module.name : mod.name}
        </button>
    `).join('');
    
    // Attach listeners
    nav.querySelectorAll('.module-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const moduleId = e.currentTarget.dataset.module;
            switchModule(moduleId);
        });
    });
}

/**
 * Switch active module
 */
function switchModule(moduleId) {
    const module = modules[moduleId];
    
    if (!module) {
        showToast(`Module "${moduleId}" not yet implemented`, 'warning');
        return;
    }
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        document.querySelector('.module-rail')?.classList.remove('open');
        document.getElementById('moduleOverlay')?.classList.remove('show');
    }
    
    // Update active state
    document.querySelectorAll('.module-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.module === moduleId);
    });
    
    State.setActiveModule(moduleId);
    
    // Clear previous results
    resultsGrid.renderEmpty();
    document.getElementById('metricsStrip').innerHTML = '';
    document.getElementById('copyTSV').disabled = true;
    document.getElementById('showLogic').disabled = true;
    
    // Render module controls in results panel
    const resultsPanel = document.querySelector('.results-panel');
    const existingControls = resultsPanel.querySelector('.module-controls-wrapper');
    
    if (existingControls) {
        existingControls.remove();
    }
    
    const controlsWrapper = document.createElement('div');
    controlsWrapper.className = 'module-controls-wrapper';
    
    // Insert after panel header
    const panelHeader = resultsPanel.querySelector('.panel-header');
    panelHeader.after(controlsWrapper);
    
    // Render module UI
    module.renderControls(controlsWrapper);
}

/**
 * Update results display
 */
function updateResults(results) {
    if (!results) {
        resultsGrid.renderEmpty();
        return;
    }
    
    // Render results grid
    if (results.data && results.columns) {
        resultsGrid.render(results.data, results.columns);
    }
    
    // Update metrics
    if (results.metrics) {
        renderMetrics(results.metrics);
    }
    
    // Enable actions
    document.getElementById('copyTSV').disabled = false;
    document.getElementById('showLogic').disabled = !results.explanation;
}

/**
 * Render metrics strip
 */
function renderMetrics(metrics) {
    const strip = document.getElementById('metricsStrip');
    
    const html = Object.entries(metrics).map(([key, value]) => {
        let valueClass = '';
        if (typeof value === 'number') {
            if (key.includes('error') || key.includes('missing')) {
                valueClass = value > 0 ? 'danger' : 'success';
            }
        }
        
        return `
            <div class="metric">
                <div class="metric-label">${key.replace(/_/g, ' ')}</div>
                <div class="metric-value ${valueClass}">${value}</div>
            </div>
        `;
    }).join('');
    
    strip.innerHTML = html;
}

/**
 * Show logic explanation modal
 */
function showLogicModal() {
    const results = State.project.results;
    if (!results || !results.explanation) return;
    
    const modal = document.getElementById('logicModal');
    const explanation = document.getElementById('logicExplanation');
    
    const exp = results.explanation;
    
    let html = '';
    
    if (exp.description) {
        html += `<div class="logic-section">
            <h4>What This Does</h4>
            <p class="logic-description">${exp.description}</p>
        </div>`;
    }
    
    if (exp.steps && exp.steps.length > 0) {
        html += `<div class="logic-section">
            <h4>Steps</h4>
            <ol class="logic-steps">
                ${exp.steps.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>`;
    }
    
    if (exp.excelEquivalent || exp.sqlEquivalent) {
        html += `<div class="logic-section">
            <h4>Equivalent Operations</h4>
            <div class="logic-equivalent">`;
        
        if (exp.excelEquivalent) {
            html += `
                <div class="logic-equivalent-item">
                    <div class="logic-equivalent-label">Excel:</div>
                    <div class="logic-equivalent-value">${exp.excelEquivalent}</div>
                </div>`;
        }
        
        if (exp.sqlEquivalent) {
            html += `
                <div class="logic-equivalent-item">
                    <div class="logic-equivalent-label">SQL:</div>
                    <div class="logic-equivalent-value">${exp.sqlEquivalent}</div>
                </div>`;
        }
        
        html += `</div></div>`;
    }
    
    if (exp.why) {
        html += `<div class="logic-section">
            <h4>Why This Matters</h4>
            <p class="logic-description">${exp.why}</p>
        </div>`;
    }
    
    explanation.innerHTML = html;
    modal.classList.remove('hidden');
}

/**
 * Hide logic modal
 */
function hideLogicModal() {
    document.getElementById('logicModal').classList.add('hidden');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
