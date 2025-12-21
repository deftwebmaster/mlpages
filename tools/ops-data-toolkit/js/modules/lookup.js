/**
 * Lookup Lab Module
 * VLOOKUP / XLOOKUP Simulator
 */

import State from '../state.js';
import { exportData } from '../export.js';

export const LookupModule = {
    name: 'Lookup Lab',
    description: 'VLOOKUP/XLOOKUP simulator',
    
    /**
     * Render module controls
     */
    renderControls(container) {
        const sheetA = State.getSheet('A');
        const sheetB = State.getSheet('B');
        
        if (!sheetA || !sheetA.data) {
            container.innerHTML = `
                <div class="module-controls">
                    <p>No data loaded. Import a CSV file to get started.</p>
                </div>
            `;
            return;
        }
        
        const hasSheetB = sheetB && sheetB.data;
        
        container.innerHTML = `
            <div class="module-controls">
                <h3>Lookup Configuration</h3>
                <p>Pull values from a lookup table based on a key match.</p>
                
                <h4>Target Sheet (where to add lookup values)</h4>
                <div class="control-row">
                    <div class="control-field">
                        <label>
                            <input type="radio" name="lookupTarget" value="A" checked>
                            Sheet A (${sheetA.data.length} rows)
                        </label>
                    </div>
                    ${hasSheetB ? `
                    <div class="control-field">
                        <label>
                            <input type="radio" name="lookupTarget" value="B">
                            Sheet B (${sheetB.data.length} rows)
                        </label>
                    </div>
                    ` : ''}
                </div>
                
                <h4 style="margin-top: 20px;">Lookup Source</h4>
                <div class="control-row">
                    <div class="control-field">
                        <label>Lookup Table</label>
                        <select id="lookupSource" class="select-input">
                            ${hasSheetB ? '<option value="B">Sheet B</option>' : ''}
                            <option value="A">Sheet A (self-lookup)</option>
                        </select>
                    </div>
                </div>
                
                <h4 style="margin-top: 20px;">Match Configuration</h4>
                
                <div class="control-row">
                    <div class="control-field">
                        <label>Lookup Key Column (in target)</label>
                        <select id="lookupKeyTarget" class="select-input">
                            ${sheetA.columns.map(col => `
                                <option value="${col}">
                                    ${col.replace(/_/g, ' ').toUpperCase()}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="control-field">
                        <label>Match Column (in lookup table)</label>
                        <select id="lookupKeySource" class="select-input">
                            ${(hasSheetB ? sheetB.columns : sheetA.columns).map(col => `
                                <option value="${col}">
                                    ${col.replace(/_/g, ' ').toUpperCase()}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="control-row">
                    <div class="control-field">
                        <label>Return Column (value to fetch)</label>
                        <select id="lookupReturnColumn" class="select-input">
                            ${(hasSheetB ? sheetB.columns : sheetA.columns).map(col => `
                                <option value="${col}">
                                    ${col.replace(/_/g, ' ').toUpperCase()}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="control-group" style="margin-top: 16px;">
                    <label>
                        <input type="checkbox" id="lookupCaseInsensitive">
                        Case-insensitive matching
                    </label>
                </div>
                
                <div style="margin-top: 20px;">
                    <button id="runLookup" class="btn-primary">Run Lookup</button>
                    <button id="exportWithLookup" class="btn-secondary" disabled>Export with Lookup Column</button>
                </div>
            </div>
        `;
        
        // Update source columns when source changes
        document.getElementById('lookupSource')?.addEventListener('change', (e) => {
            const source = e.target.value;
            const sourceSheet = State.getSheet(source);
            
            if (sourceSheet) {
                const keySourceSelect = document.getElementById('lookupKeySource');
                const returnSelect = document.getElementById('lookupReturnColumn');
                
                const options = sourceSheet.columns.map(col => `
                    <option value="${col}">
                        ${col.replace(/_/g, ' ').toUpperCase()}
                    </option>
                `).join('');
                
                keySourceSelect.innerHTML = options;
                returnSelect.innerHTML = options;
            }
        });
        
        // Attach event listeners
        document.getElementById('runLookup')?.addEventListener('click', () => {
            this.execute();
        });
        
        document.getElementById('exportWithLookup')?.addEventListener('click', () => {
            this.exportWithLookup();
        });
    },
    
    /**
     * Get current options
     */
    getOptions() {
        return {
            targetSheet: document.querySelector('input[name="lookupTarget"]:checked')?.value || 'A',
            sourceSheet: document.getElementById('lookupSource')?.value || 'A',
            keyTarget: document.getElementById('lookupKeyTarget')?.value,
            keySource: document.getElementById('lookupKeySource')?.value,
            returnColumn: document.getElementById('lookupReturnColumn')?.value,
            caseInsensitive: document.getElementById('lookupCaseInsensitive')?.checked || false
        };
    },
    
    /**
     * Execute lookup
     */
    execute() {
        const options = this.getOptions();
        const targetSheet = State.getSheet(options.targetSheet);
        const sourceSheet = State.getSheet(options.sourceSheet);
        
        if (!targetSheet || !sourceSheet) {
            alert('Sheet not loaded');
            return;
        }
        
        const result = this.performLookup(targetSheet, sourceSheet, options);
        
        // Enable export
        document.getElementById('exportWithLookup').disabled = false;
        
        State.setResults({
            data: result.display,
            columns: result.columns,
            metrics: result.stats,
            explanation: this.getExplanation(options),
            _lookupResult: result
        });
        
        return result;
    },
    
    /**
     * Perform lookup operation
     */
    performLookup(targetSheet, sourceSheet, options) {
        // Build lookup map from source
        const lookupMap = new Map();
        
        sourceSheet.data.forEach(row => {
            let key = String(row[options.keySource] || '');
            if (options.caseInsensitive) {
                key = key.toLowerCase();
            }
            
            // Store first match (VLOOKUP behavior)
            if (!lookupMap.has(key)) {
                lookupMap.set(key, row[options.returnColumn]);
            }
        });
        
        // Perform lookup
        const stats = {
            total_rows: targetSheet.data.length,
            matches_found: 0,
            not_found: 0
        };
        
        const display = targetSheet.data.map((row, idx) => {
            let targetKey = String(row[options.keyTarget] || '');
            if (options.caseInsensitive) {
                targetKey = targetKey.toLowerCase();
            }
            
            const lookupValue = lookupMap.get(targetKey);
            const found = lookupValue !== undefined;
            
            if (found) {
                stats.matches_found++;
            } else {
                stats.not_found++;
            }
            
            return {
                row: idx + 1,
                key: row[options.keyTarget],
                lookup_result: found ? lookupValue : '#N/A',
                status: found ? 'Found' : 'Not Found'
            };
        });
        
        return {
            display,
            columns: ['row', 'key', 'lookup_result', 'status'],
            stats,
            lookupMap
        };
    },
    
    /**
     * Export with lookup column added
     */
    exportWithLookup() {
        const results = State.project.results;
        if (!results || !results._lookupResult) {
            return;
        }
        
        const options = this.getOptions();
        const targetSheet = State.getSheet(options.targetSheet);
        const lookupMap = results._lookupResult.lookupMap;
        
        // Add lookup column to data
        const withLookupData = targetSheet.data.map(row => {
            let targetKey = String(row[options.keyTarget] || '');
            if (options.caseInsensitive) {
                targetKey = targetKey.toLowerCase();
            }
            
            const lookupValue = lookupMap.get(targetKey);
            
            return {
                ...row,
                [`lookup_${options.returnColumn}`]: lookupValue !== undefined ? lookupValue : '#N/A'
            };
        });
        
        exportData(withLookupData, Object.keys(withLookupData[0]), 'with_lookup');
    },
    
    /**
     * Generate explanation
     */
    getExplanation(options) {
        return {
            description: `Lookup finds values from ${options.sourceSheet === options.targetSheet ? 'the same sheet' : 'Sheet ' + options.sourceSheet} by matching ${options.keyTarget} with ${options.keySource}, then returns the value from ${options.returnColumn}.`,
            steps: [
                `Build lookup table from Sheet ${options.sourceSheet}`,
                `For each row in target sheet, extract key from ${options.keyTarget}`,
                options.caseInsensitive ? 'Convert keys to lowercase for matching' : 'Use exact key matching',
                `Search for key in lookup table's ${options.keySource} column`,
                `If found, return value from ${options.returnColumn} column`,
                'If not found, return #N/A'
            ],
            excelEquivalent: `=XLOOKUP(${options.keyTarget}, ${options.keySource}:${options.keySource}, ${options.returnColumn}:${options.returnColumn}, "#N/A")`,
            vlookupEquivalent: 'If source table is A:Z, =VLOOKUP(key, A:Z, col_index, FALSE)',
            sqlEquivalent: `SELECT target.*, source.${options.returnColumn}
FROM target_table target
LEFT JOIN source_table source ON target.${options.keyTarget} = source.${options.keySource}`,
            why: 'Lookups enrich data by pulling related information from reference tables. Common use cases: (1) Add item descriptions from SKU master, (2) Pull pricing from price list, (3) Add location names from location codes, (4) Append vendor info from vendor master.'
        };
    }
};
