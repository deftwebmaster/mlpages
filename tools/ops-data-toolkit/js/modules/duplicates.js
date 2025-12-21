/**
 * Duplicate Detection Module
 * Find exact and near-duplicate records
 */

import State from '../state.js';
import { exportData } from '../export.js';

export const DuplicatesModule = {
    name: 'Duplicate Detection',
    description: 'Find exact and near-duplicate records',
    
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
                <h3>Duplicate Detection</h3>
                <p>Find duplicate records based on one or more key columns.</p>
                
                <div class="control-row">
                    <div class="control-field">
                        <label>Primary Key Column</label>
                        <select id="dupKeyColumn" class="select-input">
                            ${sheet.columns.map(col => `
                                <option value="${col}" ${col === sheet.keyColumn ? 'selected' : ''}>
                                    ${col.replace(/_/g, ' ').toUpperCase()}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="control-field">
                        <label>Secondary Key (Optional)</label>
                        <select id="dupKeyColumn2" class="select-input">
                            <option value="">- None -</option>
                            ${sheet.columns.map(col => `
                                <option value="${col}">
                                    ${col.replace(/_/g, ' ').toUpperCase()}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="control-group">
                    <label>
                        <input type="radio" name="dupMode" value="exact" checked>
                        <strong>Exact Match</strong> — Find exact duplicates
                    </label>
                </div>
                
                <div class="control-group">
                    <label>
                        <input type="radio" name="dupMode" value="normalized">
                        <strong>Normalized Match</strong> — Ignore case and whitespace differences
                    </label>
                </div>
                
                <div class="control-group">
                    <label>
                        <input type="checkbox" id="dupShowAll">
                        Show all rows (not just duplicates)
                    </label>
                </div>
                
                <div style="margin-top: 20px;">
                    <button id="runDuplicates" class="btn-primary">Find Duplicates</button>
                    <button id="exportDuplicates" class="btn-secondary" disabled>Export Duplicates Only</button>
                    <button id="exportUnique" class="btn-secondary" disabled>Export Unique Only</button>
                </div>
            </div>
        `;
        
        // Attach event listeners
        document.getElementById('runDuplicates').addEventListener('click', () => {
            this.execute();
        });
        
        document.getElementById('exportDuplicates')?.addEventListener('click', () => {
            this.exportDuplicates();
        });
        
        document.getElementById('exportUnique')?.addEventListener('click', () => {
            this.exportUnique();
        });
    },
    
    /**
     * Get current options
     */
    getOptions() {
        return {
            keyColumn: document.getElementById('dupKeyColumn')?.value,
            keyColumn2: document.getElementById('dupKeyColumn2')?.value || null,
            mode: document.querySelector('input[name="dupMode"]:checked')?.value || 'exact',
            showAll: document.getElementById('dupShowAll')?.checked || false
        };
    },
    
    /**
     * Execute duplicate detection
     */
    execute() {
        const sheet = State.getActiveSheet();
        const options = this.getOptions();
        
        if (!sheet || !sheet.data) {
            return;
        }
        
        if (!options.keyColumn) {
            alert('Please select a key column');
            return;
        }
        
        const result = this.findDuplicates(sheet.data, options);
        
        // Enable export buttons
        document.getElementById('exportDuplicates').disabled = false;
        document.getElementById('exportUnique').disabled = false;
        
        State.setResults({
            data: result.display,
            columns: ['key_value', 'count', 'row_numbers', 'sample_data'],
            metrics: result.stats,
            explanation: this.getExplanation(options),
            _duplicateGroups: result.groups // Store for export
        });
        
        return result;
    },
    
    /**
     * Core duplicate finding logic
     */
    findDuplicates(data, options) {
        const groups = new Map();
        const stats = {
            total_rows: data.length,
            unique_keys: 0,
            duplicate_keys: 0,
            duplicate_rows: 0
        };
        
        // Build composite key for each row
        data.forEach((row, index) => {
            let key = this.buildKey(row, options);
            
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            
            groups.get(key).push({
                index: index,
                data: row
            });
        });
        
        // Analyze groups
        const duplicateGroups = [];
        
        for (const [key, rows] of groups) {
            if (rows.length > 1) {
                stats.duplicate_keys++;
                stats.duplicate_rows += rows.length;
                duplicateGroups.push({ key, rows });
            } else {
                stats.unique_keys++;
            }
        }
        
        // Sort by count descending
        duplicateGroups.sort((a, b) => b.rows.length - a.rows.length);
        
        // Build display data
        const display = duplicateGroups.map(group => {
            const rowNumbers = group.rows.map(r => r.index + 1).join(', ');
            const sampleRow = group.rows[0].data;
            
            // Build sample data string (first few columns)
            const sampleFields = Object.entries(sampleRow)
                .slice(0, 3)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' | ');
            
            return {
                key_value: group.key,
                count: group.rows.length,
                row_numbers: rowNumbers,
                sample_data: sampleFields
            };
        });
        
        return {
            groups: duplicateGroups,
            display,
            stats
        };
    },
    
    /**
     * Build composite key from row
     */
    buildKey(row, options) {
        let key = String(row[options.keyColumn] || '');
        
        if (options.keyColumn2) {
            key += '|' + String(row[options.keyColumn2] || '');
        }
        
        // Normalize if requested
        if (options.mode === 'normalized') {
            key = key.toLowerCase().trim().replace(/\s+/g, ' ');
        }
        
        return key;
    },
    
    /**
     * Export duplicates only
     */
    exportDuplicates() {
        const results = State.project.results;
        if (!results || !results._duplicateGroups) {
            return;
        }
        
        const sheet = State.getActiveSheet();
        
        // Flatten all duplicate rows
        const duplicateRows = [];
        results._duplicateGroups.forEach(group => {
            group.rows.forEach(item => {
                duplicateRows.push(item.data);
            });
        });
        
        // Export
        exportData(duplicateRows, sheet.columns, 'duplicates');
    },
    
    /**
     * Export unique only
     */
    exportUnique() {
        const results = State.project.results;
        if (!results || !results._duplicateGroups) {
            return;
        }
        
        const sheet = State.getActiveSheet();
        
        // Build set of duplicate indices
        const duplicateIndices = new Set();
        results._duplicateGroups.forEach(group => {
            group.rows.forEach(item => {
                duplicateIndices.add(item.index);
            });
        });
        
        // Filter to unique only
        const uniqueRows = sheet.data.filter((row, idx) => {
            return !duplicateIndices.has(idx);
        });
        
        // Export
        exportData(uniqueRows, sheet.columns, 'unique');
    },
    
    /**
     * Generate explanation
     */
    getExplanation(options) {
        const keyDescription = options.keyColumn2 
            ? `composite key (${options.keyColumn} + ${options.keyColumn2})`
            : `single key (${options.keyColumn})`;
        
        const matchMode = options.mode === 'exact' 
            ? 'Exact matching (case-sensitive, whitespace-sensitive)'
            : 'Normalized matching (case-insensitive, whitespace-insensitive)';
        
        return {
            description: `Duplicate detection groups records by ${keyDescription} and identifies rows that appear more than once. ${matchMode}.`,
            steps: [
                'Extract key value(s) from each row',
                options.mode === 'normalized' ? 'Normalize keys (lowercase, trim, collapse spaces)' : 'Use exact key values',
                'Group rows by identical keys',
                'Flag groups with 2+ rows as duplicates',
                'Sort by duplicate count (most duplicates first)'
            ],
            excelEquivalent: '=COUNTIF($A$2:$A$100, A2) > 1',
            sqlEquivalent: `SELECT key, COUNT(*) as count FROM table GROUP BY key HAVING count > 1`,
            why: 'Duplicates in warehouse data cause: (1) Inventory double-counting, (2) Location assignment conflicts, (3) Pick list errors, (4) Receiving discrepancies. Finding duplicates before import prevents these issues.',
            keyConfig: `Using ${keyDescription} with ${options.mode} matching`
        };
    }
};
