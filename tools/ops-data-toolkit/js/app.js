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

// Track active filter/highlight state for persistence
let activeFilterState = {
    metrics: new Set(),      // Currently active metric filters
    highlightIndices: [],    // Row indices to highlight
    highlightClass: '',      // CSS class for highlights
    targetSheet: null,       // Which sheet the highlights apply to
    filteredData: null,      // Currently filtered results data
    filteredColumns: null    // Columns for filtered data
};

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
    
    // Set up row click handler for results grid
    resultsGrid.setRowClickHandler((rowIndex) => {
        // Highlight and scroll to the row in the data grid
        dataGrid.clearHighlights();
        dataGrid.highlightRows([rowIndex], 'row-highlight');
        dataGrid.scrollToRow(rowIndex);
    });
    
    // Hide View Report button initially (only shown for reconcile results)
    document.getElementById('viewReport').style.display = 'none';
    
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
        btn.addEventListener('click', () => {
            hideLogicModal();
            hideReportModal();
        });
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            hideLogicModal();
            hideReportModal();
        });
    });
    
    // Report modal
    document.getElementById('viewReport')?.addEventListener('click', showReportModal);
    document.getElementById('copyReport')?.addEventListener('click', copyReportToClipboard);
    document.getElementById('exportPDF')?.addEventListener('click', exportReportToPDF);
    
    // Filter banner close button
    document.getElementById('clearFilterBanner')?.addEventListener('click', () => {
        clearAllFiltersAndHighlights();
    });
    
    // Escape key to clear filters and highlights
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            clearAllFiltersAndHighlights();
        }
    });
    
    // Listen for loadSample events from dynamically rendered grid empty state
    window.addEventListener('loadSample', (e) => {
        handleLoadSample(e.detail);
    });
}

/**
 * Clear all active filters, highlights, and banners
 */
function clearAllFiltersAndHighlights() {
    hideFilterBanner();
    dataGrid.clearHighlights();
    
    // Clear active metric state
    document.querySelectorAll('.metric-filterable').forEach(m => {
        m.classList.remove('metric-active');
    });
    
    // Reset filter state
    activeFilterState = {
        metrics: new Set(),
        highlightIndices: [],
        highlightClass: '',
        targetSheet: null,
        filteredData: null,
        filteredColumns: null
    };
    
    // Restore full results if we have them
    const results = State.project.results;
    if (results?.data) {
        resultsGrid.render(results.data, results.columns);
    }
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
    
    // Use filtered data if a filter is active, otherwise use all results
    const dataToExport = activeFilterState.filteredData || results.data;
    const columnsToExport = activeFilterState.filteredColumns || results.columns;
    
    const success = await exportToClipboard(dataToExport, columnsToExport);
    
    if (success) {
        const filterNote = activeFilterState.filteredData ? ' (filtered)' : '';
        showToast(`Copied ${dataToExport.length} rows to clipboard${filterNote}`, 'success');
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
        
        // Re-apply highlights if they belong to this sheet
        if (activeFilterState.targetSheet === project.activeSheet && 
            activeFilterState.highlightIndices.length > 0) {
            setTimeout(() => {
                dataGrid.highlightRows(activeFilterState.highlightIndices, activeFilterState.highlightClass);
            }, 50);
        }
    } else {
        dataGrid.clear();
        populateKeyColumnSelect([]);
    }
    
    // Update both sheet badges
    const sheetA = State.getSheet('A');
    const sheetB = State.getSheet('B');
    updateSheetBadge('A', sheetA?.data?.length || 0);
    updateSheetBadge('B', sheetB?.data?.length || 0);
    
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
    
    // Module list
    const moduleList = [
        { id: 'cleaning', module: modules.cleaning, icon: '🧹' },
        { id: 'validation', module: modules.validation, icon: '✓' },
        { id: 'duplicates', module: modules.duplicates, icon: '👯' },
        { id: 'sumif', module: modules.sumif, icon: '∑' },
        { id: 'reconcile', module: modules.reconcile, icon: '⚖️' },
        { id: 'lookup', module: modules.lookup, icon: '🔍' }
    ];
    
    nav.innerHTML = moduleList.map(mod => `
        <button 
            class="module-btn" 
            data-module="${mod.id}">
            ${mod.icon} ${mod.module.name}
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
    
    // Hide View Report button (only shown for reconcile module results)
    document.getElementById('viewReport').style.display = 'none';
    
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
    
    // Show/hide report button - only visible for reconciliation results
    const viewReportBtn = document.getElementById('viewReport');
    if (results._reconciliation) {
        viewReportBtn.style.display = '';
        viewReportBtn.disabled = false;
    } else {
        viewReportBtn.style.display = 'none';
    }
}

/**
 * Render metrics strip
 */
function renderMetrics(metrics) {
    const strip = document.getElementById('metricsStrip');
    
    // Metrics that can be clicked to filter results
    const filterableMetrics = {
        'missing_in_a': 'Missing in System',
        'missing_in_b': 'Missing in Physical',
        'variances': 'Variance',
        'perfect_matches': 'Match',
        'rows_with_errors': 'error',
        'duplicate_keys': 'duplicate'
    };
    
    // Skip metrics that are objects (like errors_by_severity)
    const displayableMetrics = Object.entries(metrics).filter(([key, value]) => {
        return typeof value !== 'object' || value === null;
    });
    
    const html = displayableMetrics.map(([key, value]) => {
        let valueClass = '';
        const isFilterable = filterableMetrics[key] && value > 0;
        
        if (typeof value === 'number') {
            if (key.includes('error') || key.includes('missing')) {
                valueClass = value > 0 ? 'danger' : 'success';
            }
        }
        
        if (isFilterable) {
            valueClass += ' clickable';
        }
        
        return `
            <div class="metric ${isFilterable ? 'metric-filterable' : ''}" 
                 ${isFilterable ? `data-filter="${filterableMetrics[key]}"` : ''}>
                <div class="metric-label">${key.replace(/_/g, ' ')}</div>
                <div class="metric-value ${valueClass}">${value}</div>
            </div>
        `;
    }).join('');
    
    strip.innerHTML = html;
    
    // Attach click handlers for filterable metrics (with shift support)
    strip.querySelectorAll('.metric-filterable').forEach(metric => {
        metric.addEventListener('click', (e) => {
            const filterValue = metric.dataset.filter;
            filterResultsByStatus(filterValue, metric, e.shiftKey);
        });
    });
}

/**
 * Filter results grid by status value and highlight source rows
 * @param {string} statusValue - The status to filter by
 * @param {HTMLElement} clickedMetric - The clicked metric element
 * @param {boolean} isShiftClick - Whether shift was held (multi-select)
 */
function filterResultsByStatus(statusValue, clickedMetric, isShiftClick = false) {
    const results = State.project.results;
    if (!results || !results.data) return;
    
    const strip = document.getElementById('metricsStrip');
    const isAlreadyActive = clickedMetric.classList.contains('metric-active');
    
    if (isShiftClick && !isAlreadyActive) {
        // Multi-select mode: add to existing selection
        activeFilterState.metrics.add(statusValue);
        clickedMetric.classList.add('metric-active');
    } else if (isAlreadyActive) {
        // Toggle off this metric
        activeFilterState.metrics.delete(statusValue);
        clickedMetric.classList.remove('metric-active');
    } else {
        // Single select: clear others and select this one
        strip.querySelectorAll('.metric-filterable').forEach(m => {
            m.classList.remove('metric-active');
        });
        activeFilterState.metrics.clear();
        activeFilterState.metrics.add(statusValue);
        clickedMetric.classList.add('metric-active');
    }
    
    // Clear any existing highlights
    dataGrid.clearHighlights();
    hideFilterBanner();
    
    // If no metrics selected, show all results
    if (activeFilterState.metrics.size === 0) {
        activeFilterState.highlightIndices = [];
        activeFilterState.highlightClass = '';
        activeFilterState.targetSheet = null;
        activeFilterState.filteredData = null;
        activeFilterState.filteredColumns = null;
        resultsGrid.render(results.data, results.columns);
        return;
    }
    
    // Filter to selected statuses
    const selectedStatuses = activeFilterState.metrics;
    const filtered = results.data.filter(row => {
        if (row.status) {
            return selectedStatuses.has(row.status);
        }
        if (row.severity) {
            return selectedStatuses.has(row.severity);
        }
        return false;
    });
    
    // Store filtered data for export
    activeFilterState.filteredData = filtered;
    activeFilterState.filteredColumns = results.columns;
    
    // Show filtered results or empty state
    if (filtered.length === 0) {
        resultsGrid.renderFilteredEmpty();
    } else {
        resultsGrid.render(filtered, results.columns);
    }
    
    // Collect all highlight indices from all selected metrics
    let allIndices = [];
    let highlightClass = 'row-highlight-warning';
    let targetSheet = State.project.activeSheet;
    
    // Now highlight the source rows in the data grid based on module type
    if (results._reconciliation) {
        const recon = results._reconciliation;
        
        for (const status of selectedStatuses) {
            const { indices, sheet, cssClass } = getReconciliationHighlightInfo(status, recon);
            allIndices = allIndices.concat(indices);
            if (cssClass === 'row-highlight-error') highlightClass = cssClass;
            if (sheet) targetSheet = sheet;
        }
        
        // Show banner for first/primary status
        const primaryStatus = [...selectedStatuses][0];
        showFilterBanner(primaryStatus, filtered, recon);
        
    } else if (results._duplicateData) {
        if (selectedStatuses.has('duplicate')) {
            allIndices = results._duplicateData.duplicateIndices || [];
            highlightClass = 'row-highlight-warning';
            showDuplicateBanner('duplicate', results._duplicateData);
        }
        
    } else if (results._validationData) {
        if (selectedStatuses.has('error')) {
            allIndices = results._validationData.allErrorIndices || [];
            highlightClass = 'row-highlight-error';
            showValidationBanner('error', results._validationData);
        }
    }
    
    // Store state for persistence across sheet switches
    activeFilterState.highlightIndices = allIndices;
    activeFilterState.highlightClass = highlightClass;
    activeFilterState.targetSheet = targetSheet;
    
    // Switch sheet if needed and apply highlights
    if (targetSheet !== State.project.activeSheet) {
        State.setActiveSheet(targetSheet);
    } else if (allIndices.length > 0) {
        setTimeout(() => {
            dataGrid.highlightRows(allIndices, highlightClass);
            if (allIndices.length > 0) {
                dataGrid.scrollToRow(allIndices[0]);
            }
        }, 50);
    }
}

/**
 * Get highlight info for reconciliation status
 */
function getReconciliationHighlightInfo(statusValue, reconciliation) {
    let items = [];
    let targetSheet = null;
    let highlightClass = 'row-highlight-warning';
    
    switch (statusValue) {
        case 'Missing in System':
            items = reconciliation.missingInA || [];
            targetSheet = 'B';
            highlightClass = 'row-highlight-error';
            break;
        case 'Missing in Physical':
            items = reconciliation.missingInB || [];
            targetSheet = 'A';
            highlightClass = 'row-highlight-error';
            break;
        case 'Variance':
            items = reconciliation.variances || [];
            targetSheet = State.project.activeSheet;
            highlightClass = 'row-highlight-warning';
            break;
        case 'Match':
            items = reconciliation.matched || [];
            targetSheet = State.project.activeSheet;
            highlightClass = 'row-highlight';
            break;
    }
    
    const indices = items.map(item => {
        if (targetSheet === 'A' && item.indexA !== undefined) return item.indexA;
        if (targetSheet === 'B' && item.indexB !== undefined) return item.indexB;
        if (item.indexA !== undefined) return item.indexA;
        if (item.indexB !== undefined) return item.indexB;
        return null;
    }).filter(i => i !== null);
    
    return { indices, sheet: targetSheet, cssClass: highlightClass };
}

/**
 * Get natural language explanation for a status
 */
function getStatusExplanation(statusValue, items, reconciliation) {
    const count = items.length;
    
    switch (statusValue) {
        case 'Missing in System':
            const missingAKeys = items.map(i => i.key).join(', ');
            return {
                icon: '🔍',
                title: `${count} item${count > 1 ? 's' : ''} found in physical count but missing from WMS`,
                description: `${missingAKeys} ${count > 1 ? 'were' : 'was'} counted in the warehouse but ${count > 1 ? "don't" : "doesn't"} exist in your system inventory. This could mean unreceived goods, a receiving error, or items that were never scanned in.`,
                type: 'error'
            };
        
        case 'Missing in Physical':
            const missingBKeys = items.map(i => i.key).join(', ');
            return {
                icon: '👻',
                title: `${count} item${count > 1 ? 's' : ''} in WMS but not found during physical count`,
                description: `${missingBKeys} ${count > 1 ? 'show' : 'shows'} inventory in the system but ${count > 1 ? 'were' : 'was'}n't found during the count. This could indicate shrinkage, theft, damage, or the item was missed during counting.`,
                type: 'error'
            };
        
        case 'Variance':
            const totalVariance = items.reduce((sum, i) => sum + Math.abs(i.variance || 0), 0);
            const overages = items.filter(i => (i.variance || 0) > 0).length;
            const shortages = items.filter(i => (i.variance || 0) < 0).length;
            return {
                icon: '⚖️',
                title: `${count} item${count > 1 ? 's' : ''} with quantity differences between system and count`,
                description: `Found ${shortages} shortage${shortages !== 1 ? 's' : ''} (system shows more than counted) and ${overages} overage${overages !== 1 ? 's' : ''} (counted more than system shows). Total variance: ${totalVariance} units.`,
                type: 'warning'
            };
        
        case 'Match':
            return {
                icon: '✅',
                title: `${count} item${count > 1 ? 's' : ''} match perfectly`,
                description: `These items have identical quantities in both the system and physical count. No action needed.`,
                type: 'info'
            };
        
        default:
            return {
                icon: '📋',
                title: `${count} item${count > 1 ? 's' : ''} selected`,
                description: `Showing filtered results.`,
                type: 'info'
            };
    }
}

/**
 * Show the filter explanation banner
 */
function showFilterBanner(statusValue, filtered, reconciliation) {
    const banner = document.getElementById('filterBanner');
    const title = document.getElementById('filterBannerTitle');
    const desc = document.getElementById('filterBannerDesc');
    const icon = banner.querySelector('.filter-banner-icon');
    
    // Get items from reconciliation data
    let items = [];
    switch (statusValue) {
        case 'Missing in System':
            items = reconciliation.missingInA || [];
            break;
        case 'Missing in Physical':
            items = reconciliation.missingInB || [];
            break;
        case 'Variance':
            items = reconciliation.variances || [];
            break;
        case 'Match':
            items = reconciliation.matched || [];
            break;
    }
    
    const explanation = getStatusExplanation(statusValue, items, reconciliation);
    
    icon.textContent = explanation.icon;
    title.textContent = explanation.title;
    desc.textContent = explanation.description;
    
    // Set banner type
    banner.classList.remove('warning', 'info');
    if (explanation.type !== 'error') {
        banner.classList.add(explanation.type);
    }
    
    banner.classList.remove('hidden');
}

/**
 * Hide the filter explanation banner
 */
function hideFilterBanner() {
    const banner = document.getElementById('filterBanner');
    banner.classList.add('hidden');
}

/**
 * Highlight rows in data grid based on reconciliation status
 */
function highlightReconciliationRows(statusValue, reconciliation) {
    let items = [];
    let targetSheet = null;
    
    switch (statusValue) {
        case 'Missing in System':
            // These exist in B but not A - highlight in Sheet B
            items = reconciliation.missingInA || [];
            targetSheet = 'B';
            break;
        case 'Missing in Physical':
            // These exist in A but not B - highlight in Sheet A
            items = reconciliation.missingInB || [];
            targetSheet = 'A';
            break;
        case 'Variance':
            // These exist in both - highlight in current sheet
            items = reconciliation.variances || [];
            targetSheet = State.project.activeSheet;
            break;
        case 'Match':
            items = reconciliation.matched || [];
            targetSheet = State.project.activeSheet;
            break;
    }
    
    if (items.length === 0) return;
    
    // Switch to the appropriate sheet if needed
    if (targetSheet && targetSheet !== State.project.activeSheet) {
        State.setActiveSheet(targetSheet);
    }
    
    // Get the row indices to highlight
    const indices = items.map(item => {
        if (targetSheet === 'A' && item.indexA !== undefined) {
            return item.indexA;
        } else if (targetSheet === 'B' && item.indexB !== undefined) {
            return item.indexB;
        } else if (item.indexA !== undefined) {
            return item.indexA;
        } else if (item.indexB !== undefined) {
            return item.indexB;
        }
        return null;
    }).filter(i => i !== null);
    
    // Determine highlight class based on status
    let highlightClass = 'row-highlight-error';
    if (statusValue === 'Match') {
        highlightClass = 'row-highlight';
    } else if (statusValue === 'Variance') {
        highlightClass = 'row-highlight-warning';
    }
    
    // Highlight the rows
    setTimeout(() => {
        dataGrid.highlightRows(indices, highlightClass);
        
        // Scroll to first highlighted row
        if (indices.length > 0) {
            dataGrid.scrollToRow(indices[0]);
        }
    }, 100);
}

/**
 * Highlight rows in data grid for duplicate detection
 */
function highlightDuplicateRows(statusValue, duplicateData) {
    if (statusValue !== 'duplicate') return;
    
    const indices = duplicateData.duplicateIndices || [];
    
    if (indices.length === 0) return;
    
    // Highlight the rows
    setTimeout(() => {
        dataGrid.highlightRows(indices, 'row-highlight-warning');
        
        // Scroll to first highlighted row
        if (indices.length > 0) {
            dataGrid.scrollToRow(indices[0]);
        }
    }, 100);
}

/**
 * Show banner for duplicate detection
 */
function showDuplicateBanner(statusValue, duplicateData) {
    if (statusValue !== 'duplicate') return;
    
    const banner = document.getElementById('filterBanner');
    const title = document.getElementById('filterBannerTitle');
    const desc = document.getElementById('filterBannerDesc');
    const icon = banner.querySelector('.filter-banner-icon');
    
    const stats = duplicateData.stats;
    const groups = duplicateData.groups || [];
    
    // Get the top duplicate keys for display
    const topDupes = groups.slice(0, 3).map(g => g.key).join(', ');
    const moreCount = groups.length > 3 ? ` and ${groups.length - 3} more` : '';
    
    icon.textContent = '👯';
    title.textContent = `${stats.duplicate_rows} rows are duplicates across ${stats.duplicate_keys} keys`;
    desc.textContent = `Keys with duplicates: ${topDupes}${moreCount}. These rows share the same key value and may cause conflicts during import or processing.`;
    
    banner.classList.remove('hidden', 'banner-error', 'banner-warning', 'banner-info');
    banner.classList.add('banner-warning');
}

/**
 * Highlight rows in data grid for validation errors
 */
function highlightValidationRows(statusValue, validationData) {
    if (statusValue !== 'error') return;
    
    const indices = validationData.allErrorIndices || [];
    
    if (indices.length === 0) return;
    
    // Highlight the rows
    setTimeout(() => {
        dataGrid.highlightRows(indices, 'row-highlight-error');
        
        // Scroll to first highlighted row
        if (indices.length > 0) {
            dataGrid.scrollToRow(indices[0]);
        }
    }, 100);
}

/**
 * Show banner for validation errors
 */
function showValidationBanner(statusValue, validationData) {
    if (statusValue !== 'error') return;
    
    const banner = document.getElementById('filterBanner');
    const title = document.getElementById('filterBannerTitle');
    const desc = document.getElementById('filterBannerDesc');
    const icon = banner.querySelector('.filter-banner-icon');
    
    const stats = validationData.stats;
    const errors = validationData.errors || [];
    
    // Get unique columns with errors
    const errorColumns = [...new Set(errors.map(e => e.column))];
    const columnList = errorColumns.slice(0, 3).join(', ');
    const moreColumns = errorColumns.length > 3 ? ` and ${errorColumns.length - 3} more` : '';
    
    icon.textContent = '⚠️';
    title.textContent = `${stats.rows_with_errors} rows have validation errors`;
    desc.textContent = `${stats.total_errors} total errors found in columns: ${columnList}${moreColumns}. These rows fail one or more validation rules and should be corrected before import.`;
    
    banner.classList.remove('hidden', 'banner-error', 'banner-warning', 'banner-info');
    banner.classList.add('banner-error');
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

/**
 * Show reconciliation report modal
 */
function showReportModal() {
    const results = State.project.results;
    if (!results || !results._reconciliation) {
        showToast('No reconciliation data available', 'error');
        return;
    }
    
    const modal = document.getElementById('reportModal');
    const content = document.getElementById('reportContent');
    
    content.innerHTML = generateReconciliationReport(results._reconciliation, results.metrics);
    modal.classList.remove('hidden');
}

/**
 * Hide report modal
 */
function hideReportModal() {
    document.getElementById('reportModal').classList.add('hidden');
}

/**
 * Generate reconciliation report HTML
 */
function generateReconciliationReport(recon, metrics) {
    const sheetA = State.getSheet('A');
    
    // Calculate totals
    const totalDollarImpact = calculateTotalDollarImpact(recon);
    const varianceItems = recon.variances || [];
    const missingInA = recon.missingInA || [];
    const missingInB = recon.missingInB || [];
    const matched = recon.matched || [];
    
    // Build dollar impact breakdown
    const dollarBreakdown = buildDollarBreakdown(recon, sheetA);
    
    // Generate narrative
    const narrative = generateNarrative(recon, totalDollarImpact, dollarBreakdown);
    
    let html = `
        <!-- Executive Summary -->
        <div class="report-section">
            <h4>📋 Executive Summary</h4>
            <div class="report-narrative">
                ${narrative}
            </div>
        </div>
        
        <!-- Key Metrics -->
        <div class="report-section">
            <h4>📊 Key Metrics</h4>
            <div class="report-summary">
                <div class="report-stat">
                    <div class="report-stat-value">${matched.length}</div>
                    <div class="report-stat-label">Perfect Matches</div>
                </div>
                <div class="report-stat">
                    <div class="report-stat-value">${varianceItems.length}</div>
                    <div class="report-stat-label">Variances</div>
                </div>
                <div class="report-stat">
                    <div class="report-stat-value">${missingInB.length}</div>
                    <div class="report-stat-label">Missing in Count</div>
                </div>
                <div class="report-stat">
                    <div class="report-stat-value">${missingInA.length}</div>
                    <div class="report-stat-label">Found (Not in WMS)</div>
                </div>
                <div class="report-stat">
                    <div class="report-stat-value ${totalDollarImpact >= 0 ? 'positive' : 'negative'}">
                        ${formatCurrency(totalDollarImpact)}
                    </div>
                    <div class="report-stat-label">Net Dollar Impact</div>
                </div>
            </div>
        </div>
        
        <!-- Dollar Impact Breakdown -->
        <div class="report-section">
            <h4>💰 Dollar Impact Breakdown</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Description</th>
                        <th>Issue</th>
                        <th class="number">Variance</th>
                        <th class="number">Unit Cost</th>
                        <th class="number">Impact</th>
                    </tr>
                </thead>
                <tbody>
                    ${dollarBreakdown.items.map(item => `
                        <tr>
                            <td><strong>${item.sku}</strong></td>
                            <td>${item.description}</td>
                            <td>${item.issue}</td>
                            <td class="number ${item.variance > 0 ? 'positive' : 'negative'}">${item.variance > 0 ? '+' : ''}${item.variance}</td>
                            <td class="number">${formatCurrency(item.unitCost)}</td>
                            <td class="number ${item.impact > 0 ? 'positive' : 'negative'}">${formatCurrency(item.impact)}</td>
                        </tr>
                    `).join('')}
                    <tr class="total-row">
                        <td colspan="5"><strong>Net Total</strong></td>
                        <td class="number ${totalDollarImpact >= 0 ? 'positive' : 'negative'}">
                            <strong>${formatCurrency(totalDollarImpact)}</strong>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    // Add issues requiring attention if any
    if (missingInB.length > 0 || missingInA.length > 0) {
        html += `
            <div class="report-section">
                <h4>⚠️ Items Requiring Investigation</h4>
        `;
        
        if (missingInB.length > 0) {
            html += `
                <p style="color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: var(--space-sm);">
                    <strong>Ghost Inventory</strong> — In WMS but not found during count:
                </p>
                <ul class="report-list">
                    ${missingInB.map(item => {
                        const rowA = item.rowA || {};
                        const desc = rowA.description || 'Unknown';
                        const cost = item.unit_cost || 0;
                        const impact = -Math.abs(item.system_qty * cost);
                        return `
                            <li>
                                <div>
                                    <span class="item-name">${item.key}</span>
                                    <span class="item-detail"> — ${desc}</span>
                                </div>
                                <span class="item-value negative">${item.system_qty} units (${formatCurrency(impact)})</span>
                            </li>
                        `;
                    }).join('')}
                </ul>
            `;
        }
        
        if (missingInA.length > 0) {
            html += `
                <p style="color: var(--color-text-muted); font-size: 0.85rem; margin: var(--space-md) 0 var(--space-sm) 0;">
                    <strong>Found Inventory</strong> — Counted but not in WMS:
                </p>
                <ul class="report-list">
                    ${missingInA.map(item => `
                        <li>
                            <div>
                                <span class="item-name">${item.key}</span>
                                <span class="item-detail"> — Location: ${item.rowB?.location || 'Unknown'}</span>
                            </div>
                            <span class="item-value">${item.physical_qty} units found</span>
                        </li>
                    `).join('')}
                </ul>
            `;
        }
        
        html += `</div>`;
    }
    
    return html;
}

/**
 * Calculate total dollar impact from reconciliation
 */
function calculateTotalDollarImpact(recon) {
    let total = 0;
    
    // Variances
    (recon.variances || []).forEach(item => {
        if (item.dollar_impact !== null) {
            total += item.dollar_impact;
        }
    });
    
    // Missing in B (ghost inventory - negative impact)
    (recon.missingInB || []).forEach(item => {
        if (item.unit_cost) {
            total -= Math.abs(item.system_qty * item.unit_cost);
        }
    });
    
    return total;
}

/**
 * Build dollar breakdown items
 */
function buildDollarBreakdown(recon, sheetA) {
    const items = [];
    
    // Add variances with cost
    (recon.variances || []).forEach(item => {
        if (item.unit_cost !== null && item.variance !== 0) {
            const rowA = item.rowA || {};
            items.push({
                sku: item.key,
                description: rowA.description || 'Unknown',
                issue: item.variance > 0 ? 'Overage' : 'Shortage',
                variance: item.variance,
                unitCost: item.unit_cost,
                impact: item.dollar_impact || 0
            });
        }
    });
    
    // Add missing in B (ghost inventory)
    (recon.missingInB || []).forEach(item => {
        const rowA = item.rowA || {};
        const unitCost = item.unit_cost || 0;
        if (unitCost > 0) {
            items.push({
                sku: item.key,
                description: rowA.description || 'Unknown',
                issue: 'Not Found (Ghost)',
                variance: -item.system_qty,
                unitCost: unitCost,
                impact: -Math.abs(item.system_qty * unitCost)
            });
        }
    });
    
    // Sort by absolute impact descending
    items.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    
    return { items };
}

/**
 * Generate natural language narrative
 */
function generateNarrative(recon, totalImpact, breakdown) {
    const matched = recon.matched?.length || 0;
    const variances = recon.variances?.length || 0;
    const missingInB = recon.missingInB?.length || 0;
    const missingInA = recon.missingInA?.length || 0;
    const total = matched + variances + missingInB;
    
    let narrative = '';
    
    // Overall accuracy
    const accuracy = total > 0 ? ((matched / total) * 100).toFixed(0) : 0;
    narrative += `This cycle count reconciled <strong>${total} SKUs</strong> with an inventory accuracy of <strong>${accuracy}%</strong>. `;
    
    // Dollar impact
    if (totalImpact < 0) {
        narrative += `The count revealed a net <strong style="color: var(--color-danger);">shrinkage of ${formatCurrency(Math.abs(totalImpact))}</strong>. `;
    } else if (totalImpact > 0) {
        narrative += `The count revealed a net <strong style="color: var(--color-success);">overage of ${formatCurrency(totalImpact)}</strong>. `;
    } else {
        narrative += `The count shows <strong>no net dollar impact</strong>. `;
    }
    
    // Biggest issues
    if (breakdown.items.length > 0) {
        const biggest = breakdown.items[0];
        if (biggest.impact < -100) {
            narrative += `<br><br>The largest issue is <strong>${biggest.sku}</strong> (${biggest.description}) with a <strong>${formatCurrency(biggest.impact)}</strong> impact — this should be investigated first.`;
        }
    }
    
    // Ghost inventory callout
    if (missingInB > 0) {
        narrative += `<br><br>⚠️ <strong>${missingInB} item${missingInB > 1 ? 's' : ''}</strong> appear${missingInB === 1 ? 's' : ''} in the WMS but ${missingInB === 1 ? 'was' : 'were'}n't found during the physical count. These "ghost inventory" items need immediate investigation.`;
    }
    
    // Found inventory callout
    if (missingInA > 0) {
        narrative += `<br><br>📦 <strong>${missingInA} item${missingInA > 1 ? 's' : ''}</strong> ${missingInA === 1 ? 'was' : 'were'} found on the floor but ${missingInA === 1 ? "doesn't" : "don't"} exist in the WMS. These may be unreceived goods or receiving errors.`;
    }
    
    return narrative;
}

/**
 * Format number as currency
 */
function formatCurrency(value) {
    if (value === null || value === undefined) return '—';
    const absValue = Math.abs(value);
    const formatted = absValue.toLocaleString('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 2
    });
    return value < 0 ? `-${formatted}` : formatted;
}

/**
 * Copy report to clipboard as text
 */
async function copyReportToClipboard() {
    const results = State.project.results;
    if (!results || !results._reconciliation) return;
    
    const recon = results._reconciliation;
    const totalImpact = calculateTotalDollarImpact(recon);
    const breakdown = buildDollarBreakdown(recon, State.getSheet('A'));
    
    let text = `CYCLE COUNT RECONCILIATION REPORT\n`;
    text += `${'='.repeat(50)}\n\n`;
    
    text += `SUMMARY\n`;
    text += `Perfect Matches: ${recon.matched?.length || 0}\n`;
    text += `Variances: ${recon.variances?.length || 0}\n`;
    text += `Missing in Count: ${recon.missingInB?.length || 0}\n`;
    text += `Found (Not in WMS): ${recon.missingInA?.length || 0}\n`;
    text += `Net Dollar Impact: ${formatCurrency(totalImpact)}\n\n`;
    
    text += `DOLLAR IMPACT BREAKDOWN\n`;
    text += `${'-'.repeat(50)}\n`;
    breakdown.items.forEach(item => {
        text += `${item.sku.padEnd(15)} ${item.issue.padEnd(15)} ${String(item.variance).padStart(6)} × ${formatCurrency(item.unitCost).padStart(10)} = ${formatCurrency(item.impact).padStart(12)}\n`;
    });
    text += `${'-'.repeat(50)}\n`;
    text += `${'NET TOTAL'.padEnd(48)} ${formatCurrency(totalImpact).padStart(12)}\n`;
    
    try {
        await navigator.clipboard.writeText(text);
        showToast('Report copied to clipboard', 'success');
    } catch (err) {
        showToast('Failed to copy report', 'error');
    }
}

/**
 * Export reconciliation report as PDF
 */
function exportReportToPDF() {
    const results = State.project.results;
    if (!results || !results._reconciliation) {
        showToast('No reconciliation data available', 'error');
        return;
    }
    
    const recon = results._reconciliation;
    const totalImpact = calculateTotalDollarImpact(recon);
    const breakdown = buildDollarBreakdown(recon, State.getSheet('A'));
    
    const matched = recon.matched?.length || 0;
    const variances = recon.variances?.length || 0;
    const missingInB = recon.missingInB?.length || 0;
    const missingInA = recon.missingInA?.length || 0;
    const total = matched + variances + missingInB;
    const accuracy = total > 0 ? ((matched / total) * 100).toFixed(0) : 0;
    
    // Access jsPDF from window (loaded via CDN)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Colors as RGB arrays
    const primaryColor = [37, 99, 235];    // Blue
    const dangerColor = [239, 68, 68];     // Red
    const successColor = [16, 185, 129];   // Green
    const textColor = [30, 41, 59];        // Dark slate
    const mutedColor = [100, 116, 139];    // Muted
    const warningColor = [245, 158, 11];   // Amber
    
    // Helper functions to set colors (jsPDF needs separate r,g,b args)
    const setTextRGB = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    const setFillRGB = (rgb) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    
    let yPos = 20;
    
    // Header
    setFillRGB(primaryColor);
    doc.rect(0, 0, 220, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Cycle Count Reconciliation Report', 14, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    doc.text(`Generated: ${today}`, 14, 28);
    
    yPos = 45;
    
    // Executive Summary Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, yPos, 182, 35, 3, 3, 'F');
    
    setTextRGB(textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, yPos + 10);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    setTextRGB(mutedColor);
    
    let summaryText = `This cycle count reconciled ${total} SKUs with an inventory accuracy of ${accuracy}%. `;
    if (totalImpact < 0) {
        summaryText += `The count revealed a net shrinkage of ${formatCurrency(Math.abs(totalImpact))}.`;
    } else if (totalImpact > 0) {
        summaryText += `The count revealed a net overage of ${formatCurrency(totalImpact)}.`;
    } else {
        summaryText += `The count shows no net dollar impact.`;
    }
    
    const splitSummary = doc.splitTextToSize(summaryText, 170);
    doc.text(splitSummary, 20, yPos + 20);
    
    yPos += 45;
    
    // Key Metrics
    setTextRGB(textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Metrics', 14, yPos);
    yPos += 8;
    
    // Metrics boxes
    const metrics = [
        { label: 'Perfect Matches', value: matched, color: successColor },
        { label: 'Variances', value: variances, color: [245, 158, 11] },
        { label: 'Missing in Count', value: missingInB, color: dangerColor },
        { label: 'Found (Not in WMS)', value: missingInA, color: primaryColor },
    ];
    
    const boxWidth = 42;
    const boxSpacing = 4;
    
    metrics.forEach((metric, i) => {
        const xPos = 14 + (i * (boxWidth + boxSpacing));
        
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(xPos, yPos, boxWidth, 25, 2, 2, 'F');
        
        setTextRGB(metric.color);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(String(metric.value), xPos + boxWidth/2, yPos + 12, { align: 'center' });
        
        setTextRGB(mutedColor);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(metric.label.toUpperCase(), xPos + boxWidth/2, yPos + 20, { align: 'center' });
    });
    
    yPos += 35;
    
    // Net Dollar Impact (large callout)
    doc.setFillColor(totalImpact >= 0 ? 236 : 254, totalImpact >= 0 ? 253 : 242, totalImpact >= 0 ? 245 : 242);
    doc.roundedRect(14, yPos, 182, 20, 3, 3, 'F');
    
    setTextRGB(totalImpact >= 0 ? successColor : dangerColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Net Dollar Impact: ${formatCurrency(totalImpact)}`, 105, yPos + 13, { align: 'center' });
    
    yPos += 30;
    
    // Dollar Impact Table
    setTextRGB(textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Dollar Impact Breakdown', 14, yPos);
    yPos += 5;
    
    if (breakdown.items.length > 0) {
        const tableData = breakdown.items.map(item => [
            item.sku,
            item.description.length > 25 ? item.description.substring(0, 25) + '...' : item.description,
            item.issue,
            (item.variance > 0 ? '+' : '') + item.variance,
            formatCurrency(item.unitCost),
            formatCurrency(item.impact)
        ]);
        
        // Add total row
        tableData.push([
            { content: 'NET TOTAL', colSpan: 5, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
            { content: formatCurrency(totalImpact), styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: totalImpact >= 0 ? successColor : dangerColor } }
        ]);
        
        doc.autoTable({
            startY: yPos,
            head: [['SKU', 'Description', 'Issue', 'Var', 'Unit $', 'Impact']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8
            },
            bodyStyles: {
                fontSize: 8,
                textColor: textColor
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 22 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 28 },
                3: { halign: 'right', cellWidth: 16 },
                4: { halign: 'right', cellWidth: 22 },
                5: { halign: 'right', cellWidth: 24 }
            },
            margin: { left: 14, right: 14 },
            tableWidth: 'auto',
            didParseCell: function(data) {
                // Color variance and impact columns
                if (data.section === 'body' && data.row.index < breakdown.items.length) {
                    const item = breakdown.items[data.row.index];
                    if (data.column.index === 3 || data.column.index === 5) {
                        if (item.impact < 0) {
                            data.cell.styles.textColor = dangerColor;
                        } else if (item.impact > 0) {
                            data.cell.styles.textColor = successColor;
                        }
                    }
                }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
    }
    
    // Items Requiring Investigation
    if (missingInB > 0 || missingInA > 0) {
        // Check if we need a new page
        if (yPos > 230) {
            doc.addPage();
            yPos = 20;
        }
        
        setTextRGB(textColor);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Items Requiring Investigation', 14, yPos);
        yPos += 8;
        
        if (missingInB > 0) {
            doc.setFillColor(254, 242, 242);
            doc.roundedRect(14, yPos, 182, 8 + (missingInB * 6), 2, 2, 'F');
            
            setTextRGB(dangerColor);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Ghost Inventory (In WMS but not found):', 18, yPos + 6);
            
            doc.setFont('helvetica', 'normal');
            setTextRGB(textColor);
            doc.setFontSize(8);
            
            recon.missingInB.forEach((item, i) => {
                const rowA = item.rowA || {};
                const desc = rowA.description || 'Unknown';
                const cost = item.unit_cost || 0;
                const impact = -Math.abs(item.system_qty * cost);
                doc.text(`• ${item.key} — ${desc} (${item.system_qty} units, ${formatCurrency(impact)})`, 20, yPos + 12 + (i * 6));
            });
            
            yPos += 12 + (missingInB * 6);
        }
        
        if (missingInA > 0) {
            doc.setFillColor(254, 249, 195);
            doc.roundedRect(14, yPos, 182, 8 + (missingInA * 6), 2, 2, 'F');
            
            doc.setTextColor(161, 98, 7);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Found Inventory (Counted but not in WMS):', 18, yPos + 6);
            
            doc.setFont('helvetica', 'normal');
            setTextRGB(textColor);
            doc.setFontSize(8);
            
            recon.missingInA.forEach((item, i) => {
                const loc = item.rowB?.location || 'Unknown';
                doc.text(`• ${item.key} — Location: ${loc} (${item.physical_qty} units found)`, 20, yPos + 12 + (i * 6));
            });
        }
    }
    
    // Footer on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        setTextRGB(mutedColor);
        doc.text(`Generated by Ops Data Toolkit | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }
    
    // Save the PDF
    const timestamp = new Date().toISOString().slice(0, 10);
    doc.save(`reconciliation-report-${timestamp}.pdf`);
    
    showToast('PDF report downloaded', 'success');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
