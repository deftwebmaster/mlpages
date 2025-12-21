/**
 * Data Cleaning Module
 * Normalize and clean data columns
 */

import State from '../state.js';

export const CleaningModule = {
    name: 'Data Cleaning',
    description: 'Normalize and clean data columns for consistency',
    
    /**
     * Render module controls
     */
    renderControls(container) {
        const sheet = State.getActiveSheet();
        
        if (!sheet || !sheet.data) {
            container.innerHTML = `
                <div class="module-controls">
                    <p>No data loaded. Import a CSV file to get started.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="module-controls">
                <h3>Data Cleaning Options</h3>
                <p>Clean and normalize data to prevent matching failures and improve data quality.</p>
                
                <div class="control-group">
                    <label>
                        <input type="checkbox" id="cleanTrim" checked>
                        <strong>Trim Whitespace</strong> — Remove leading/trailing spaces
                    </label>
                </div>
                
                <div class="control-group">
                    <label>
                        <input type="checkbox" id="cleanCollapseSpaces" checked>
                        <strong>Collapse Spaces</strong> — Replace multiple spaces with one
                    </label>
                </div>
                
                <div class="control-group">
                    <label>
                        <input type="checkbox" id="cleanUppercase">
                        <strong>Uppercase</strong> — Convert text to UPPERCASE
                    </label>
                </div>
                
                <div class="control-group">
                    <label>
                        <input type="checkbox" id="cleanLowercase">
                        <strong>Lowercase</strong> — Convert text to lowercase
                    </label>
                </div>
                
                <div class="control-group">
                    <label>
                        <input type="checkbox" id="cleanRemoveSpecial">
                        <strong>Remove Special Characters</strong> — Keep only letters, numbers, spaces
                    </label>
                </div>
                
                <div class="control-group">
                    <label>
                        <input type="checkbox" id="cleanStandardizeNulls" checked>
                        <strong>Standardize Nulls</strong> — Convert "NULL", "N/A", empty strings to actual null
                    </label>
                </div>
                
                <div class="control-group">
                    <label>
                        <input type="checkbox" id="cleanConvertNumbers">
                        <strong>Convert to Numbers</strong> — Try to convert numeric strings to numbers
                    </label>
                </div>
                
                <div style="margin-top: 20px;">
                    <button id="runCleaning" class="btn-primary">Clean Data</button>
                    <button id="previewCleaning" class="btn-secondary">Preview Changes</button>
                </div>
            </div>
        `;
        
        // Attach event listeners
        document.getElementById('runCleaning').addEventListener('click', () => {
            this.execute(false);
        });
        
        document.getElementById('previewCleaning').addEventListener('click', () => {
            this.execute(true);
        });
        
        // Mutual exclusivity for case options
        document.getElementById('cleanUppercase').addEventListener('change', (e) => {
            if (e.target.checked) {
                document.getElementById('cleanLowercase').checked = false;
            }
        });
        
        document.getElementById('cleanLowercase').addEventListener('change', (e) => {
            if (e.target.checked) {
                document.getElementById('cleanUppercase').checked = false;
            }
        });
    },
    
    /**
     * Get current cleaning options
     */
    getOptions() {
        return {
            trim: document.getElementById('cleanTrim')?.checked || false,
            collapseSpaces: document.getElementById('cleanCollapseSpaces')?.checked || false,
            uppercase: document.getElementById('cleanUppercase')?.checked || false,
            lowercase: document.getElementById('cleanLowercase')?.checked || false,
            removeSpecial: document.getElementById('cleanRemoveSpecial')?.checked || false,
            standardizeNulls: document.getElementById('cleanStandardizeNulls')?.checked || false,
            convertNumbers: document.getElementById('cleanConvertNumbers')?.checked || false
        };
    },
    
    /**
     * Execute cleaning
     */
    execute(previewOnly = false) {
        const sheet = State.getActiveSheet();
        
        if (!sheet || !sheet.data) {
            return;
        }
        
        const options = this.getOptions();
        const result = this.clean(sheet.data, sheet.columns, options);
        
        // If not preview, update the actual data
        if (!previewOnly) {
            State.setSheet(State.project.activeSheet, {
                ...sheet,
                data: result.data
            });
        }
        
        // Set results for display
        State.setResults({
            data: result.preview,
            columns: ['column', 'before', 'after', 'changed'],
            metrics: result.stats,
            explanation: this.getExplanation(options)
        });
        
        return result;
    },
    
    /**
     * Core cleaning logic
     */
    clean(data, columns, options) {
        const changes = {
            totalCells: 0,
            cellsChanged: 0,
            rowsAffected: 0,
            byColumn: {}
        };
        
        const preview = [];
        
        // Track sample changes for preview
        const sampleChanges = {};
        
        const cleaned = data.map((row, rowIndex) => {
            const cleanedRow = { ...row };
            let rowChanged = false;
            
            for (const col of columns) {
                const original = row[col];
                let value = original;
                
                // Skip nulls unless standardizing
                if (value === null || value === undefined) {
                    continue;
                }
                
                changes.totalCells++;
                
                // Convert to string for text operations
                const wasString = typeof value === 'string';
                if (wasString || options.convertNumbers) {
                    value = String(value);
                }
                
                // Apply cleaning operations
                if (typeof value === 'string') {
                    // Standardize nulls first
                    if (options.standardizeNulls) {
                        const nullValues = ['null', 'n/a', 'na', 'none', '-', ''];
                        if (nullValues.includes(value.toLowerCase().trim())) {
                            cleanedRow[col] = null;
                            changes.cellsChanged++;
                            rowChanged = true;
                            this.trackChange(sampleChanges, col, original, null);
                            continue;
                        }
                    }
                    
                    // Trim
                    if (options.trim) {
                        value = value.trim();
                    }
                    
                    // Collapse spaces
                    if (options.collapseSpaces) {
                        value = value.replace(/\s+/g, ' ');
                    }
                    
                    // Case conversion (mutually exclusive)
                    if (options.uppercase) {
                        value = value.toUpperCase();
                    } else if (options.lowercase) {
                        value = value.toLowerCase();
                    }
                    
                    // Remove special characters
                    if (options.removeSpecial) {
                        value = value.replace(/[^a-zA-Z0-9\s]/g, '');
                    }
                    
                    // Try number conversion
                    if (options.convertNumbers && !wasString) {
                        const num = parseFloat(value);
                        if (!isNaN(num) && isFinite(num)) {
                            value = num;
                        }
                    }
                }
                
                // Check if changed
                if (value !== original) {
                    cleanedRow[col] = value;
                    changes.cellsChanged++;
                    rowChanged = true;
                    
                    // Track for preview
                    this.trackChange(sampleChanges, col, original, value);
                    
                    // Track by column
                    if (!changes.byColumn[col]) {
                        changes.byColumn[col] = 0;
                    }
                    changes.byColumn[col]++;
                }
            }
            
            if (rowChanged) {
                changes.rowsAffected++;
            }
            
            return cleanedRow;
        });
        
        // Build preview data
        for (const [col, samples] of Object.entries(sampleChanges)) {
            const sample = samples[0]; // First example
            preview.push({
                column: col,
                before: this.formatValue(sample.before),
                after: this.formatValue(sample.after),
                changed: changes.byColumn[col] || 0
            });
        }
        
        return {
            data: cleaned,
            preview: preview,
            stats: {
                total_cells: changes.totalCells,
                cells_changed: changes.cellsChanged,
                rows_affected: changes.rowsAffected,
                change_rate: ((changes.cellsChanged / changes.totalCells) * 100).toFixed(1) + '%'
            }
        };
    },
    
    /**
     * Track sample changes for preview
     */
    trackChange(tracker, column, before, after) {
        if (!tracker[column]) {
            tracker[column] = [];
        }
        
        // Keep only first 3 examples per column
        if (tracker[column].length < 3) {
            tracker[column].push({ before, after });
        }
    },
    
    /**
     * Format value for display
     */
    formatValue(value) {
        if (value === null || value === undefined) {
            return '(null)';
        }
        if (value === '') {
            return '(empty)';
        }
        return String(value);
    },
    
    /**
     * Generate explanation
     */
    getExplanation(options) {
        const steps = [];
        const activeOptions = [];
        
        if (options.trim) {
            steps.push('Remove leading and trailing whitespace from all text fields');
            activeOptions.push('TRIM()');
        }
        
        if (options.collapseSpaces) {
            steps.push('Replace multiple consecutive spaces with a single space');
            activeOptions.push('SUBSTITUTE() or regex');
        }
        
        if (options.uppercase) {
            steps.push('Convert all text to UPPERCASE');
            activeOptions.push('UPPER()');
        }
        
        if (options.lowercase) {
            steps.push('Convert all text to lowercase');
            activeOptions.push('LOWER()');
        }
        
        if (options.removeSpecial) {
            steps.push('Remove special characters, keeping only letters, numbers, and spaces');
            activeOptions.push('SUBSTITUTE() with regex');
        }
        
        if (options.standardizeNulls) {
            steps.push('Convert common null representations (NULL, N/A, empty) to actual null values');
            activeOptions.push('IF() with multiple conditions');
        }
        
        if (options.convertNumbers) {
            steps.push('Convert numeric strings to actual number values');
            activeOptions.push('VALUE()');
        }
        
        return {
            description: 'Data cleaning normalizes text fields to ensure consistency and prevent matching failures caused by hidden formatting issues.',
            steps: steps.length > 0 ? steps : ['No cleaning options selected'],
            excelEquivalent: activeOptions.length > 0 
                ? `Combine: ${activeOptions.join(', ')}` 
                : 'No operations applied',
            sqlEquivalent: 'TRIM(UPPER(REGEXP_REPLACE(column, pattern, replacement)))',
            why: 'Warehouse data often has inconsistent formatting from different sources (WMS, Excel, vendor files). Cleaning prevents: (1) Failed lookups due to extra spaces, (2) Duplicate records with different cases, (3) Import errors from special characters, (4) Sorting issues from mixed data types.'
        };
    }
};
