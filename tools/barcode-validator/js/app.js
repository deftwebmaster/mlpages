/**
 * Barcode Validator - Main Application
 * 
 * Orchestrates all modules and manages application state.
 */

import { validate } from './core/barcodeValidator.js';
import { processBatch, processBatchAsync, parseInput } from './processors/bulkProcessor.js';
import { flagDuplicatesInResults, getDuplicateSummary } from './processors/duplicateDetector.js';
import { calculateHealthScore, getSymbologyDistribution, getBatchMetadata } from './processors/healthScorer.js';
import { renderTable, addTableFilters, exportTableToCSV } from './ui/tableRenderer.js';
import { 
  renderHealthScoreCard, 
  renderDistributionChart, 
  renderIssuesWarnings,
  renderBatchMetadata,
  renderProgressBar,
  updateProgressBar
} from './ui/chartRenderer.js';
import { openExportDialog, openHelpModal, showToast, openLearningMode } from './ui/modalManager.js';
import { parseCSV, readFileAsText, downloadCSV, validateCSVStructure } from './utils/csvHandler.js';
import { formatForWMS, getAvailableWMSFormats } from './utils/exportFormatter.js';
import { classifyError } from './utils/errorClassifier.js';

// Application state
const AppState = {
  currentResults: null,
  currentHealthScore: null,
  currentMetadata: null,
  selectedScenario: null,
  learningMode: false,
  scannerProfile: null
};

/**
 * Initialize application
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Barcode Validator initialized');
  
  // Setup event listeners
  setupInputHandlers();
  setupFileUpload();
  setupScenarioButtons();
  setupScannerProfiles();
  setupExportButtons();
  setupHelpButton();
  setupLearningModeToggle();
  
  // Load welcome message
  showWelcomeMessage();
  updateStatusStrip();
});

/**
 * Setup input handlers
 */
function setupInputHandlers() {
  const validateBtn = document.getElementById('validate-btn');
  const clearBtn = document.getElementById('clear-btn');
  const inputArea = document.getElementById('barcode-input');

  validateBtn.addEventListener('click', () => {
    const input = inputArea.value;
    
    if (!input || input.trim().length === 0) {
      showToast('Please enter barcodes to validate', 'warning');
      return;
    }

    processInput(input);
  });

  clearBtn.addEventListener('click', () => {
    inputArea.value = '';
    clearResults();
    updateStatusStrip();
    showToast('Input cleared', 'info');
  });

  inputArea.addEventListener('input', () => {
    updateStatusStrip();
  });

  // Allow Enter key to validate (with Ctrl/Cmd)
  inputArea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      validateBtn.click();
    }
  });
}

/**
 * Setup file upload
 */
function setupFileUpload() {
  const fileInput = document.getElementById('csv-file-input');
  const uploadBtn = document.getElementById('upload-csv-btn');

  uploadBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      return;
    }

    if (!file.name.endsWith('.csv')) {
      showToast('Please select a CSV file', 'error');
      return;
    }

    try {
      const content = await readFileAsText(file);
      
      // Validate CSV structure
      const validation = validateCSVStructure(content);
      
      if (!validation.valid) {
        showToast(`Invalid CSV: ${validation.error}`, 'error');
        return;
      }

      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          showToast(warning, 'warning', 4000);
        });
      }

      // Parse CSV
      const { barcodes, metadata } = parseCSV(content, {
        columnIndex: 0,
        hasHeader: true
      });

      if (barcodes.length === 0) {
        showToast('No barcodes found in CSV file', 'warning');
        return;
      }

      // Populate input area
      const inputArea = document.getElementById('barcode-input');
      inputArea.value = barcodes.join('\n');

      showToast(`Loaded ${barcodes.length} barcodes from CSV`, 'success');

      // Auto-validate
      setTimeout(() => {
        processInput(inputArea.value);
      }, 500);

    } catch (error) {
      console.error('CSV upload error:', error);
      showToast('Error reading CSV file', 'error');
    }

    // Reset file input
    fileInput.value = '';
  });
}

/**
 * Setup scenario template buttons
 */
function setupScenarioButtons() {
  // Load scenarios dynamically
  fetch('./js/data/scenarioTemplates.json')
    .then(response => response.json())
    .then(scenarios => {
      const container = document.getElementById('scenario-buttons');
      
      Object.entries(scenarios).forEach(([id, scenario]) => {
        const button = document.createElement('button');
        button.className = 'scenario-button';
        button.innerHTML = `${scenario.name}<br><small>${scenario.description}</small>`;
        button.title = scenario.notes;
        
        button.addEventListener('click', () => {
          loadScenario(id, scenario);
        });
        
        container.appendChild(button);
      });
    })
    .catch(error => {
      console.error('Error loading scenarios:', error);
    });
}

/**
 * Load scenario template
 */
function loadScenario(id, scenario) {
  const inputArea = document.getElementById('barcode-input');
  inputArea.value = scenario.sampleData;
  updateStatusStrip();
  
  AppState.selectedScenario = scenario;
  
  showToast(`Loaded scenario: ${stripScenarioIcon(scenario.name)}`, 'info');
  
  // Auto-validate after short delay
  setTimeout(() => {
    processInput(scenario.sampleData);
  }, 300);
}

/**
 * Setup scanner profile selector
 */
function setupScannerProfiles() {
  fetch('./js/data/scannerProfiles.json')
    .then(response => response.json())
    .then(profiles => {
      const select = document.getElementById('scanner-profile-select');
      
      // Add default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'No specific scanner';
      select.appendChild(defaultOption);
      
      // Add profiles
      Object.entries(profiles).forEach(([id, profile]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = profile.name;
        select.appendChild(option);
      });

      // Handle selection
      select.addEventListener('change', (e) => {
        const profileId = e.target.value;
        
        if (profileId) {
          AppState.scannerProfile = profiles[profileId];
          showScannerInfo(profiles[profileId]);
        } else {
          AppState.scannerProfile = null;
          hideScannerInfo();
        }
      });
    })
    .catch(error => {
      console.error('Error loading scanner profiles:', error);
    });
}

/**
 * Show scanner profile info
 */
function showScannerInfo(profile) {
  const infoDiv = document.getElementById('scanner-info');
  
  infoDiv.innerHTML = `
    <div class="scanner-info-content">
      <h4>${profile.name}</h4>
      <div class="scanner-issues">
        <strong>Common Issues:</strong>
        <ul>
          ${profile.commonIssues.map(issue => `<li>${issue}</li>`).join('')}
        </ul>
      </div>
      <div class="scanner-recommendations">
        <strong>Recommendations:</strong>
        <ul>
          ${profile.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
  
  infoDiv.style.display = 'block';
}

/**
 * Hide scanner info
 */
function hideScannerInfo() {
  const infoDiv = document.getElementById('scanner-info');
  infoDiv.style.display = 'none';
}

/**
 * Setup export buttons
 */
function setupExportButtons() {
  const exportBtn = document.getElementById('export-btn');
  
  exportBtn.addEventListener('click', () => {
    if (!AppState.currentResults) {
      showToast('No results to export', 'warning');
      return;
    }

    openExportDialog(AppState.currentResults, handleExport);
  });
}

/**
 * Handle export
 */
function handleExport(options) {
  const { format, includeIndex, includeBreakdown } = options;

  let csvContent;
  let filename;

  switch (format) {
    case 'csv-standard':
      csvContent = exportTableToCSV(AppState.currentResults, {
        includeIndex,
        includeBreakdown,
        filterValid: 'all'
      });
      filename = 'barcode-validation-results.csv';
      break;

    case 'csv-wms':
      csvContent = formatForWMS(AppState.currentResults, 'generic', {
        validOnly: true,
        includeHeader: true
      });
      filename = 'wms-ready-barcodes.csv';
      break;

    case 'csv-errors':
      csvContent = exportTableToCSV(AppState.currentResults, {
        includeIndex,
        includeBreakdown: false,
        filterValid: 'invalid'
      });
      filename = 'barcode-errors.csv';
      break;

    default:
      showToast('Unknown export format', 'error');
      return;
  }

  downloadCSV(csvContent, filename);
  showToast('Export downloaded successfully!', 'success');
}

/**
 * Setup help button
 */
function setupHelpButton() {
  const helpBtn = document.getElementById('help-btn');
  
  helpBtn.addEventListener('click', () => {
    openHelpModal('general');
  });
}

/**
 * Setup learning mode toggle
 */
function setupLearningModeToggle() {
  const toggle = document.getElementById('learning-mode-toggle');
  
  toggle.addEventListener('change', (e) => {
    AppState.learningMode = e.target.checked;
    
    if (AppState.learningMode) {
      showToast('Learning mode enabled - click any row for details', 'info', 4000);
    }
  });
}

/**
 * Process input and validate
 */
async function processInput(input) {
  // Parse input
  const codes = parseInput(input, {
    removeDuplicates: false,
    removeEmpty: true
  });

  if (codes.length === 0) {
    showToast('No valid barcodes found in input', 'warning');
    return;
  }

  // Show loading
  showLoadingState(codes.length);

  try {
    // Get use case from scenario
    const useCase = AppState.selectedScenario ? AppState.selectedScenario.useCase : null;

    // Process batch
    let batchResult;
    
    if (codes.length > 5000) {
      // Use async processing for large batches
      batchResult = await processBatchAsync(codes, {
        useCase,
        includeSteps: AppState.learningMode,
        onProgress: (percent) => {
          updateProgressBar(
            document.getElementById('progress-container'),
            percent,
            `Processing ${codes.length} barcodes...`
          );
        }
      });
    } else {
      // Synchronous processing for smaller batches
      batchResult = processBatch(codes, {
        useCase,
        includeSteps: AppState.learningMode,
        onProgress: (percent) => {
          updateProgressBar(
            document.getElementById('progress-container'),
            percent,
            `Processing ${codes.length} barcodes...`
          );
        }
      });
    }

    const { results, summary } = batchResult;

    // Flag duplicates
    flagDuplicatesInResults(results);

    // Calculate health score
    const healthScore = calculateHealthScore(results, { useCase });

    // Store in state
    AppState.currentResults = results;
    AppState.currentHealthScore = healthScore;
    AppState.currentMetadata = getBatchMetadata(results, summary);
    updateStatusStrip(results, healthScore);

    // Render results
    renderResults(results, healthScore, summary);

    // Hide loading
    hideLoadingState();

    // Show success toast
    const validCount = results.filter(r => r.valid).length;
    showToast(
      `Processed ${codes.length} barcodes: ${validCount} valid, ${codes.length - validCount} invalid`,
      validCount === codes.length ? 'success' : 'warning',
      4000
    );

  } catch (error) {
    console.error('Processing error:', error);
    showToast('Error processing barcodes', 'error');
    hideLoadingState();
  }
}

/**
 * Render results
 */
function renderResults(results, healthScore, summary) {
  // Render health score card
  const healthContainer = document.getElementById('health-score-card');
  renderHealthScoreCard(healthScore, healthContainer);

  // Render symbology distribution
  const distribution = getSymbologyDistribution(results);
  const distributionContainer = document.getElementById('symbology-distribution');
  renderDistributionChart(distribution, distributionContainer, {
    chartType: 'bar',
    showPercentages: true,
    showCounts: true
  });

  // Render issues and warnings
  const issuesContainer = document.getElementById('issues-warnings');
  renderIssuesWarnings(healthScore, issuesContainer);

  // Render batch metadata
  const metadataContainer = document.getElementById('batch-metadata');
  renderBatchMetadata(AppState.currentMetadata, metadataContainer);

  // Render results table
  const tableContainer = document.getElementById('results-table-container');
  const table = renderTable(results, tableContainer, {
    showIndex: true,
    allowExpand: true,
    initialFilter: 'all'
  });

  // Add table filters
  const filterContainer = document.getElementById('table-filters');
  filterContainer.innerHTML = ''; // Clear existing
  addTableFilters(filterContainer, table);

  // Add visible count display
  const countDisplay = document.createElement('div');
  countDisplay.id = 'visible-count';
  countDisplay.className = 'visible-count';
  countDisplay.textContent = `Showing ${results.length} of ${results.length} results`;
  filterContainer.appendChild(countDisplay);

  // Listen for filter changes
  table.addEventListener('filterchange', (e) => {
    const { visible, total } = e.detail;
    countDisplay.textContent = `Showing ${visible} of ${total} results`;
  });

  // Show results section
  document.getElementById('results-section').style.display = 'block';
  updateStatusStrip(results, healthScore);

  // Scroll to results
  setTimeout(() => {
    document.getElementById('results-section').scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, 100);
}

/**
 * Clear results
 */
function clearResults() {
  AppState.currentResults = null;
  AppState.currentHealthScore = null;
  AppState.currentMetadata = null;
  AppState.selectedScenario = null;
  updateStatusStrip();

  document.getElementById('results-section').style.display = 'none';
  document.getElementById('health-score-card').innerHTML = '';
  document.getElementById('symbology-distribution').innerHTML = '';
  document.getElementById('issues-warnings').innerHTML = '';
  document.getElementById('batch-metadata').innerHTML = '';
  document.getElementById('results-table-container').innerHTML = '';
  document.getElementById('table-filters').innerHTML = '';
}

/**
 * Show loading state
 */
function showLoadingState(count) {
  const progressContainer = document.getElementById('progress-container');
  progressContainer.style.display = 'block';
  
  renderProgressBar(
    progressContainer,
    0,
    `Preparing to process ${count} barcodes...`
  );

  // Disable inputs
  document.getElementById('validate-btn').disabled = true;
  document.getElementById('barcode-input').disabled = true;
}

/**
 * Hide loading state
 */
function hideLoadingState() {
  const progressContainer = document.getElementById('progress-container');
  progressContainer.style.display = 'none';

  // Re-enable inputs
  document.getElementById('validate-btn').disabled = false;
  document.getElementById('barcode-input').disabled = false;
}

/**
 * Show welcome message
 */
function showWelcomeMessage() {
  const welcomeDiv = document.getElementById('welcome-message');
  
  welcomeDiv.innerHTML = `
    <div class="welcome-content">
      <p class="section-kicker">Warehouse scan preflight</p>
      <h2>Catch bad barcodes before they hit the floor.</h2>
      <p>Validate UPC, EAN, Code 128, duplicate risk, scanner readiness, and WMS upload quality in one local browser workflow.</p>
      <ul>
        <li><span class="trust-chip"><strong>UPC/EAN</strong> check digits</span></li>
        <li><span class="trust-chip"><strong>Code 128</strong> structure checks</span></li>
        <li><span class="trust-chip"><strong>Bulk</strong> CSV-ready validation</span></li>
        <li><span class="trust-chip"><strong>WMS</strong> readiness scoring</span></li>
        <li><span class="trust-chip"><strong>Local</strong> no uploads</span></li>
      </ul>
      <p class="welcome-cta">Paste barcodes below or load a scenario to start the preflight.</p>
    </div>
  `;
}

function updateStatusStrip(results = AppState.currentResults, healthScore = AppState.currentHealthScore) {
  const inputStat = document.getElementById('input-count-stat');
  const validStat = document.getElementById('valid-count-stat');
  const issueStat = document.getElementById('issue-count-stat');
  const readinessStat = document.getElementById('readiness-stat');

  if (!inputStat || !validStat || !issueStat || !readinessStat) return;

  const inputArea = document.getElementById('barcode-input');
  const inputCodes = inputArea
    ? parseInput(inputArea.value, { removeDuplicates: false, removeEmpty: true })
    : [];

  inputStat.textContent = String(inputCodes.length);

  if (!results || !healthScore) {
    validStat.textContent = '0';
    issueStat.textContent = '0';
    readinessStat.textContent = 'Not run';
    return;
  }

  const validCount = results.filter(result => result.valid).length;
  const issueCount = (healthScore.issues?.length || 0) + (healthScore.warnings?.length || 0);

  validStat.textContent = String(validCount);
  issueStat.textContent = String(issueCount);
  readinessStat.textContent = healthScore.readiness?.label || `${healthScore.score}/100`;
}

function stripScenarioIcon(name) {
  return name.replace(/^[^\w]+/, '').trim();
}

// Make app state accessible for debugging
if (typeof window !== 'undefined') {
  window.BarcodeValidatorApp = AppState;
}
