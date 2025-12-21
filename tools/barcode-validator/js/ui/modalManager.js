/**
 * Modal Manager
 * 
 * Manages modal dialogs for learning mode, export options,
 * help documentation, and other overlays.
 */

/**
 * Create modal backdrop and container
 */
function createModalBase(modalId) {
  // Check if modal already exists
  let modal = document.getElementById(modalId);
  if (modal) {
    return modal;
  }

  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = `${modalId}-backdrop`;
  backdrop.setAttribute('role', 'presentation');

  // Create modal
  modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = modalId;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  // Close on backdrop click
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closeModal(modalId);
    }
  });

  // Close on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('show')) {
      closeModal(modalId);
    }
  });

  return modal;
}

/**
 * Open modal
 */
function openModal(modalId) {
  const backdrop = document.getElementById(`${modalId}-backdrop`);
  if (backdrop) {
    backdrop.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    // Focus first focusable element in modal
    setTimeout(() => {
      const modal = document.getElementById(modalId);
      const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) {
        focusable.focus();
      }
    }, 100);
  }
}

/**
 * Close modal
 */
export function closeModal(modalId) {
  const backdrop = document.getElementById(`${modalId}-backdrop`);
  if (backdrop) {
    backdrop.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling
  }
}

/**
 * Open learning mode modal
 * Shows detailed checksum calculation for a specific barcode
 * 
 * @param {object} result - Validation result with checksumDetails
 */
export function openLearningMode(result) {
  const modalId = 'learning-mode-modal';
  const modal = createModalBase(modalId);

  // Build content
  const content = `
    <div class="modal-header">
      <h2>Learning Mode: ${result.code}</h2>
      <button class="modal-close" data-close-modal aria-label="Close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="learning-section">
        <h3>Symbology: ${result.symbology}</h3>
        ${renderSymbologyInfo(result.symbology)}
      </div>

      ${result.breakdown ? `
        <div class="learning-section">
          <h3>Structure Breakdown</h3>
          ${renderBreakdownTable(result.breakdown)}
        </div>
      ` : ''}

      ${result.checksumDetails && result.checksumDetails.steps ? `
        <div class="learning-section">
          <h3>Checksum Calculation</h3>
          <pre class="checksum-steps">${formatChecksumSteps(result.checksumDetails.steps)}</pre>
          ${renderChecksumExplanation(result.symbology)}
        </div>
      ` : ''}

      ${result.warnings && result.warnings.length > 0 ? `
        <div class="learning-section warnings">
          <h3>⚠️ Warnings</h3>
          <ul>
            ${result.warnings.map(w => `<li>${w}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" data-close-modal>Got it!</button>
    </div>
  `;

  modal.innerHTML = content;
  
  // Attach close event listeners
  modal.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(modalId));
  });
  
  openModal(modalId);
}

/**
 * Open export dialog
 * 
 * @param {array} results - Validation results to export
 * @param {function} onExport - Callback when export is confirmed
 */
export function openExportDialog(results, onExport) {
  const modalId = 'export-modal';
  const modal = createModalBase(modalId);

  const content = `
    <div class="modal-header">
      <h2>Export Results</h2>
      <button class="modal-close" data-close-modal aria-label="Close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="export-options">
        <h3>Export Format</h3>
        <div class="export-format-options">
          <label class="radio-option">
            <input type="radio" name="export-format" value="csv-standard" checked>
            <span>Standard CSV</span>
            <small>All results with standard columns</small>
          </label>
          <label class="radio-option">
            <input type="radio" name="export-format" value="csv-wms">
            <span>WMS-Ready CSV</span>
            <small>Valid codes only, WMS upload format</small>
          </label>
          <label class="radio-option">
            <input type="radio" name="export-format" value="csv-errors">
            <span>Errors Only CSV</span>
            <small>Invalid codes with error details</small>
          </label>
        </div>

        <h3>Options</h3>
        <div class="export-checkboxes">
          <label>
            <input type="checkbox" id="export-include-index" checked>
            Include row numbers
          </label>
          <label>
            <input type="checkbox" id="export-include-breakdown">
            Include structure breakdown
          </label>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-close-modal>Cancel</button>
      <button class="btn btn-primary" id="confirm-export-btn">Download</button>
    </div>
  `;

  modal.innerHTML = content;
  
  // Attach close event listeners
  modal.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(modalId));
  });
  
  // Attach export handler
  setTimeout(() => {
    const exportBtn = document.getElementById('confirm-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const format = document.querySelector('input[name="export-format"]:checked').value;
        const includeIndex = document.getElementById('export-include-index').checked;
        const includeBreakdown = document.getElementById('export-include-breakdown').checked;
        
        if (onExport) {
          onExport({ format, includeIndex, includeBreakdown });
        }
        
        closeModal(modalId);
      });
    }
  }, 100);

  openModal(modalId);
}

/**
 * Open help modal
 * 
 * @param {string} section - Help section to show ('general', 'symbologies', 'errors')
 */
export function openHelpModal(section = 'general') {
  const modalId = 'help-modal';
  const modal = createModalBase(modalId);

  const helpContent = {
    general: `
      <h3>How to Use This Tool</h3>
      <ol>
        <li><strong>Paste Barcodes:</strong> Enter barcodes in the input area (one per line, or comma/tab separated)</li>
        <li><strong>Upload CSV:</strong> Or upload a CSV file with barcodes</li>
        <li><strong>Review Results:</strong> See validation results in the table below</li>
        <li><strong>Export:</strong> Download results as CSV for further analysis</li>
      </ol>
      <p><strong>Privacy:</strong> All processing happens in your browser. No data is sent to any server.</p>
    `,
    symbologies: `
      <h3>Supported Barcode Types</h3>
      <ul>
        <li><strong>UPC-A:</strong> 12-digit retail product barcodes (North America)</li>
        <li><strong>UPC-E:</strong> 8-digit compressed UPC (small products)</li>
        <li><strong>EAN-13:</strong> 13-digit international product barcodes</li>
        <li><strong>EAN-8:</strong> 8-digit international short barcodes</li>
        <li><strong>Code 128:</strong> Variable-length alphanumeric (warehouse locations, SKUs)</li>
      </ul>
    `,
    errors: `
      <h3>Common Error Messages</h3>
      <dl>
        <dt>Bad check digit</dt>
        <dd>The final digit doesn't match the calculated checksum. May indicate data corruption or typo.</dd>
        
        <dt>Wrong length</dt>
        <dd>Barcode doesn't have the correct number of digits for its type.</dd>
        
        <dt>Illegal characters</dt>
        <dd>Contains characters not allowed for this symbology type.</dd>
        
        <dt>Symbology mismatch</dt>
        <dd>Barcode type doesn't match expected use case.</dd>
      </dl>
    `
  };

  const content = `
    <div class="modal-header">
      <h2>Help</h2>
      <button class="modal-close" data-close-modal aria-label="Close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="help-tabs">
        <button class="help-tab ${section === 'general' ? 'active' : ''}" data-section="general">General</button>
        <button class="help-tab ${section === 'symbologies' ? 'active' : ''}" data-section="symbologies">Barcode Types</button>
        <button class="help-tab ${section === 'errors' ? 'active' : ''}" data-section="errors">Error Messages</button>
      </div>
      <div class="help-content" id="help-content">
        ${helpContent[section]}
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" data-close-modal>Close</button>
    </div>
  `;

  modal.innerHTML = content;
  
  // Attach close event listeners
  modal.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(modalId));
  });

  // Setup tab switching
  setTimeout(() => {
    const tabs = modal.querySelectorAll('.help-tab');
    const contentDiv = document.getElementById('help-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetSection = tab.getAttribute('data-section');
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update content
        contentDiv.innerHTML = helpContent[targetSection];
      });
    });
  }, 100);

  openModal(modalId);
}

/**
 * Show toast notification
 * 
 * @param {string} message - Message to display
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in ms (default 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
  // Create toast container if doesn't exist
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  // Create toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');

  const icon = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  }[type] || 'ℹ';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  toastContainer.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Helper functions for learning mode

function renderSymbologyInfo(symbology) {
  const info = {
    'UPC-A': 'Standard retail product barcode used in North America. 12 digits total.',
    'UPC-E': 'Compressed version of UPC-A for small products. 8 digits total.',
    'EAN-13': 'International product barcode. 13 digits total. Superset of UPC-A.',
    'EAN-8': 'Short international barcode for small products. 8 digits total.',
    'CODE128': 'Variable-length alphanumeric barcode. Used for warehouse locations and internal SKUs.'
  };

  return `<p>${info[symbology] || 'Unknown symbology'}</p>`;
}

function renderBreakdownTable(breakdown) {
  let html = '<table class="breakdown-table">';
  
  Object.entries(breakdown).forEach(([key, segment]) => {
    html += `
      <tr>
        <td class="breakdown-label">${segment.label}</td>
        <td class="breakdown-value"><code>${segment.value}</code></td>
        <td class="breakdown-position">${segment.position}</td>
      </tr>
    `;
  });
  
  html += '</table>';
  return html;
}

function formatChecksumSteps(steps) {
  if (!steps || steps.length === 0) {
    return 'No calculation steps available';
  }

  let formatted = '';

  steps.forEach((step, index) => {
    if (step.position) {
      formatted += `Position ${step.position}: ${step.digit} × ${step.weight} = ${step.product} (sum: ${step.runningSum})\n`;
    } else if (step.operation) {
      formatted += `\n${step.operation}:\n`;
      formatted += `Sum: ${step.sum}\n`;
      formatted += `Remainder (sum % 10): ${step.remainder}\n`;
      formatted += `Check digit: ${step.calculation} = ${step.checkDigit}\n`;
    } else if (step.check) {
      formatted += `${step.check}: ${step.result}\n`;
      if (step.detail) {
        formatted += `  ${step.detail}\n`;
      }
    }
  });

  return formatted;
}

function renderChecksumExplanation(symbology) {
  const explanations = {
    'UPC-A': `
      <div class="checksum-explanation">
        <h4>How UPC-A Check Digit Works:</h4>
        <ol>
          <li>Multiply odd-position digits (1st, 3rd, 5th...) by 3</li>
          <li>Multiply even-position digits (2nd, 4th, 6th...) by 1</li>
          <li>Add all products together</li>
          <li>Find remainder when divided by 10</li>
          <li>Check digit = (10 - remainder) or 0 if remainder is 0</li>
        </ol>
      </div>
    `,
    'EAN-13': `
      <div class="checksum-explanation">
        <h4>How EAN-13 Check Digit Works:</h4>
        <ol>
          <li>Multiply odd-position digits by 1</li>
          <li>Multiply even-position digits by 3</li>
          <li>Add all products together</li>
          <li>Find remainder when divided by 10</li>
          <li>Check digit = (10 - remainder) or 0 if remainder is 0</li>
        </ol>
      </div>
    `,
    'CODE128': `
      <div class="checksum-explanation">
        <h4>Code 128 Structure Check:</h4>
        <p>Full checksum validation requires encoded barcode data. This tool validates:</p>
        <ul>
          <li>Length (2-80 characters)</li>
          <li>Character set (printable ASCII only)</li>
          <li>Basic structure integrity</li>
        </ul>
      </div>
    `
  };

  return explanations[symbology] || '';
}

// Export for global access
if (typeof window !== 'undefined') {
  window.modalManager = {
    openLearningMode,
    openExportDialog,
    openHelpModal,
    closeModal,
    showToast
  };
}