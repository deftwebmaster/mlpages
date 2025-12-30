/**
 * Reconciliation Module
 * System vs Physical Count Reconciliation
 * THE SHOWCASE FEATURE
 */

import State from '../state.js';
import { exportData } from '../export.js';
import { generateSample, generateCountSample } from '../parser.js';

export const ReconcileModule = {
    name: 'Reconcile',
    description: 'Compare system inventory vs physical counts',
    
    /**
     * Render module controls
     */
    renderControls(container) {
        const sheetA = State.getSheet('A');
        const sheetB = State.getSheet('B');
        
        // Require both sheets
        if (!sheetA || !sheetA.data || !sheetB || !sheetB.data) {
            container.innerHTML = `
                <div class="module-controls">
                    <h3>Reconciliation Requires Two Sheets</h3>
                    <p style="color: var(--color-text-muted); margin-bottom: 20px;">
                        Load data into both Sheet A and Sheet B to reconcile them.
                    </p>
                    
                    <div style="background: var(--color-bg-alt); padding: 16px; border-radius: 6px; margin-bottom: 16px;">
                        <h4 style="margin-bottom: 8px;">Typical Setup:</h4>
                        <ul style="margin-left: 20px; color: var(--color-text-muted);">
                            <li><strong>Sheet A:</strong> System inventory (from WMS/ERP)</li>
                            <li><strong>Sheet B:</strong> Physical count (from cycle count)</li>
                        </ul>
                    </div>
                    
                    <p>
                        Current status:<br>
                        Sheet A: ${sheetA && sheetA.data ? `✓ ${sheetA.data.length} rows loaded` : '✗ No data'}<br>
                        Sheet B: ${sheetB && sheetB.data ? `✓ ${sheetB.data.length} rows loaded` : '✗ No data'}
                    </p>
                    
                    ${!sheetA || !sheetA.data ? '<button id="loadSampleA" class="btn-secondary">Load Sample into Sheet A</button>' : ''}
                    ${!sheetB || !sheetB.data ? '<button id="loadSampleB" class="btn-secondary">Load Sample into Sheet B</button>' : ''}
                </div>
            `;
            
            // Attach sample loaders
            document.getElementById('loadSampleA')?.addEventListener('click', () => {
                State.setSheet('A', generateSample());
            });
            
            document.getElementById('loadSampleB')?.addEventListener('click', () => {
                State.setSheet('B', generateCountSample());
            });
            
            return;
        }
        
        // Find common columns for key selection
        const commonColumns = sheetA.columns.filter(col => sheetB.columns.includes(col));
        
        container.innerHTML = `
            <div class="module-controls">
                <h3>Reconciliation Setup</h3>
                <p>Compare Sheet A (${sheetA.data.length} rows) vs Sheet B (${sheetB.data.length} rows)</p>
                
                <div class="control-row">
                    <div class="control-field">
                        <label>Key Column (must exist in both sheets)</label>
                        <select id="reconKeyColumn" class="select-input">
                            ${commonColumns.length > 0 ? commonColumns.map(col => `
                                <option value="${col}" ${col === 'sku' ? 'selected' : ''}>
                                    ${col.replace(/_/g, ' ').toUpperCase()}
                                </option>
                            `).join('') : '<option value="">No common columns found</option>'}
                        </select>
                    </div>
                </div>
                
                <h4 style="margin-top: 20px;">Quantity Comparison</h4>
                
                <div class="control-row">
                    <div class="control-field">
                        <label>Sheet A Quantity Column</label>
                        <select id="reconQtyA" class="select-input">
                            ${sheetA.columns.map(col => `
                                <option value="${col}" ${col.toLowerCase().includes('qty') ? 'selected' : ''}>
                                    ${col.replace(/_/g, ' ').toUpperCase()}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="control-field">
                        <label>Sheet B Quantity Column</label>
                        <select id="reconQtyB" class="select-input">
                            ${sheetB.columns.map(col => `
                                <option value="${col}" ${col.toLowerCase().includes('qty') || col.toLowerCase().includes('physical') ? 'selected' : ''}>
                                    ${col.replace(/_/g, ' ').toUpperCase()}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <h4 style="margin-top: 20px;">Cost Analysis (Optional)</h4>
                
                <div class="control-row">
                    <div class="control-field">
                        <label>Unit Cost Column (Sheet A)</label>
                        <select id="reconCost" class="select-input">
                            <option value="">- None -</option>
                            ${sheetA.columns.map(col => `
                                <option value="${col}" ${col.toLowerCase().includes('cost') || col.toLowerCase().includes('price') ? 'selected' : ''}>
                                    ${col.replace(/_/g, ' ').toUpperCase()}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="control-group" style="margin-top: 20px;">
                    <label>
                        <input type="checkbox" id="reconShowMatches">
                        Include perfect matches in results (not just discrepancies)
                    </label>
                </div>
                
                <div style="margin-top: 20px;">
                    <button id="runReconcile" class="btn-primary">Run Reconciliation</button>
                    <button id="exportVariances" class="btn-secondary" disabled>Export Variances Only</button>
                    <button id="exportAdjustments" class="btn-secondary" disabled>Export Adjustment Upload</button>
                </div>
            </div>
        `;
        
        // Attach event listeners
        document.getElementById('runReconcile').addEventListener('click', () => {
            this.execute();
        });
        
        document.getElementById('exportVariances')?.addEventListener('click', () => {
            this.exportVariances();
        });
        
        document.getElementById('exportAdjustments')?.addEventListener('click', () => {
            this.exportAdjustments();
        });
    },
    
    /**
     * Get current options
     */
    getOptions() {
        return {
            keyColumn: document.getElementById('reconKeyColumn')?.value,
            qtyColumnA: document.getElementById('reconQtyA')?.value,
            qtyColumnB: document.getElementById('reconQtyB')?.value,
            costColumn: document.getElementById('reconCost')?.value || null,
            showMatches: document.getElementById('reconShowMatches')?.checked || false
        };
    },
    
    /**
     * Execute reconciliation
     */
    execute() {
        const sheetA = State.getSheet('A');
        const sheetB = State.getSheet('B');
        const options = this.getOptions();
        
        if (!sheetA || !sheetB) {
            alert('Both sheets must be loaded');
            return;
        }
        
        if (!options.keyColumn) {
            alert('Please select a key column');
            return;
        }
        
        const result = this.reconcile(sheetA, sheetB, options);
        
        // Enable export buttons
        document.getElementById('exportVariances').disabled = false;
        document.getElementById('exportAdjustments').disabled = false;
        
        State.setResults({
            data: result.display,
            columns: result.columns,
            metrics: result.stats,
            explanation: this.getExplanation(options),
            _reconciliation: result // Store full results for export
        });
        
        return result;
    },
    
    /**
     * Core reconciliation logic
     */
    reconcile(sheetA, sheetB, options) {
        const keyCol = options.keyColumn;
        const qtyA = options.qtyColumnA;
        const qtyB = options.qtyColumnB;
        const costCol = options.costColumn;
        
        // Build maps for fast lookup - store index for highlighting
        const mapA = new Map();
        const mapB = new Map();
        
        sheetA.data.forEach((row, index) => {
            const key = String(row[keyCol] || '');
            mapA.set(key, { row, index });
        });
        
        sheetB.data.forEach((row, index) => {
            const key = String(row[keyCol] || '');
            mapB.set(key, { row, index });
        });
        
        // Results
        const matched = [];
        const missingInB = [];
        const missingInA = [];
        const variances = [];
        
        // Stats
        const stats = {
            total_in_a: sheetA.data.length,
            total_in_b: sheetB.data.length,
            matched: 0,
            perfect_matches: 0,
            variances: 0,
            missing_in_a: 0,
            missing_in_b: 0,
            total_variance_qty: 0,
            total_dollar_impact: 0
        };
        
        // Check all items in A
        for (const [key, itemA] of mapA) {
            const rowA = itemA.row;
            const indexA = itemA.index;
            
            if (!mapB.has(key)) {
                // Missing in B (physical count)
                missingInB.push({
                    key,
                    status: 'Missing in Physical',
                    system_qty: this.parseQty(rowA[qtyA]),
                    physical_qty: 0,
                    variance: -this.parseQty(rowA[qtyA]),
                    unit_cost: costCol ? this.parseQty(rowA[costCol]) : null,
                    dollar_impact: null,
                    rowA,
                    indexA,
                    sourceSheet: 'A'
                });
                stats.missing_in_b++;
            } else {
                // Exists in both - check quantity
                const itemB = mapB.get(key);
                const rowB = itemB.row;
                const indexB = itemB.index;
                const systemQty = this.parseQty(rowA[qtyA]);
                const physicalQty = this.parseQty(rowB[qtyB]);
                const variance = physicalQty - systemQty;
                const unitCost = costCol ? this.parseQty(rowA[costCol]) : null;
                const dollarImpact = unitCost !== null ? variance * unitCost : null;
                
                const item = {
                    key,
                    status: variance === 0 ? 'Match' : 'Variance',
                    system_qty: systemQty,
                    physical_qty: physicalQty,
                    variance: variance,
                    unit_cost: unitCost,
                    dollar_impact: dollarImpact,
                    rowA,
                    rowB,
                    indexA,
                    indexB,
                    sourceSheet: 'both'
                };
                
                if (variance === 0) {
                    matched.push(item);
                    stats.perfect_matches++;
                } else {
                    variances.push(item);
                    stats.variances++;
                    stats.total_variance_qty += Math.abs(variance);
                    
                    if (dollarImpact !== null) {
                        stats.total_dollar_impact += dollarImpact;
                    }
                }
                
                stats.matched++;
            }
        }
        
        // Check for items in B but not in A
        for (const [key, itemB] of mapB) {
            if (!mapA.has(key)) {
                const rowB = itemB.row;
                const indexB = itemB.index;
                // Missing in A (system)
                const physicalQty = this.parseQty(rowB[qtyB]);
                
                missingInA.push({
                    key,
                    status: 'Missing in System',
                    system_qty: 0,
                    physical_qty: physicalQty,
                    variance: physicalQty,
                    unit_cost: null,
                    dollar_impact: null,
                    rowB,
                    indexB,
                    sourceSheet: 'B'
                });
                stats.missing_in_a++;
            }
        }
        
        // Sort variances by absolute dollar impact (or qty if no cost)
        variances.sort((a, b) => {
            if (a.dollar_impact !== null && b.dollar_impact !== null) {
                return Math.abs(b.dollar_impact) - Math.abs(a.dollar_impact);
            }
            return Math.abs(b.variance) - Math.abs(a.variance);
        });
        
        // Build display data
        const display = [];
        
        // Add variances first
        variances.forEach(item => {
            display.push(this.formatDisplayRow(item, costCol));
        });
        
        // Add missing items
        missingInB.forEach(item => {
            display.push(this.formatDisplayRow(item, costCol));
        });
        
        missingInA.forEach(item => {
            display.push(this.formatDisplayRow(item, costCol));
        });
        
        // Add matches if requested
        if (options.showMatches) {
            matched.forEach(item => {
                display.push(this.formatDisplayRow(item, costCol));
            });
        }
        
        // Determine columns
        const columns = ['key', 'status', 'system_qty', 'physical_qty', 'variance'];
        if (costCol) {
            columns.push('unit_cost', 'dollar_impact');
        }
        
        return {
            display,
            columns,
            stats,
            variances,
            missingInA,
            missingInB,
            matched
        };
    },
    
    /**
     * Parse quantity safely
     */
    parseQty(value) {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    },
    
    /**
     * Format row for display
     */
    formatDisplayRow(item, hasCost) {
        const row = {
            key: item.key,
            status: item.status,
            system_qty: item.system_qty,
            physical_qty: item.physical_qty,
            variance: item.variance
        };
        
        if (hasCost) {
            row.unit_cost = item.unit_cost !== null ? item.unit_cost.toFixed(2) : '—';
            row.dollar_impact = item.dollar_impact !== null ? item.dollar_impact.toFixed(2) : '—';
        }
        
        return row;
    },
    
    /**
     * Export variances only
     */
    exportVariances() {
        const results = State.project.results;
        if (!results || !results._reconciliation) {
            return;
        }
        
        const recon = results._reconciliation;
        const options = this.getOptions();
        
        // Combine variances and missing items
        const varianceRows = [
            ...recon.variances,
            ...recon.missingInA,
            ...recon.missingInB
        ];
        
        // Build export data
        const exportRows = varianceRows.map(item => ({
            [options.keyColumn]: item.key,
            status: item.status,
            system_qty: item.system_qty,
            physical_qty: item.physical_qty,
            variance: item.variance,
            unit_cost: item.unit_cost,
            dollar_impact: item.dollar_impact
        }));
        
        exportData(exportRows, Object.keys(exportRows[0] || {}), 'variance_report');
    },
    
    /**
     * Export adjustment upload format
     */
    exportAdjustments() {
        const results = State.project.results;
        if (!results || !results._reconciliation) {
            return;
        }
        
        const recon = results._reconciliation;
        const options = this.getOptions();
        
        // Build adjustment file (only items with variances)
        const adjustments = [
            ...recon.variances,
            ...recon.missingInA,
            ...recon.missingInB
        ].filter(item => item.variance !== 0);
        
        const exportRows = adjustments.map(item => ({
            [options.keyColumn]: item.key,
            adjustment_qty: item.variance,
            reason: item.status === 'Missing in System' ? 'Found in physical count' :
                    item.status === 'Missing in Physical' ? 'Not found in physical count' :
                    'Quantity discrepancy',
            current_system_qty: item.system_qty,
            counted_qty: item.physical_qty
        }));
        
        exportData(exportRows, Object.keys(exportRows[0] || {}), 'adjustments_upload');
    },
    
    /**
     * Generate explanation
     */
    getExplanation(options) {
        const hasCost = options.costColumn !== null;
        
        return {
            description: `Reconciliation compares system inventory (Sheet A) against physical counts (Sheet B) using ${options.keyColumn} as the matching key. Items are matched, and quantity variances are calculated. ${hasCost ? 'Dollar impact is computed using unit cost.' : ''}`,
            steps: [
                'Build lookup maps for both sheets using key column',
                'For each item in Sheet A, check if it exists in Sheet B',
                'Calculate variance: Physical Qty - System Qty',
                hasCost ? 'Calculate dollar impact: Variance × Unit Cost' : null,
                'Identify missing items (in one sheet but not the other)',
                'Rank variances by dollar impact (or absolute quantity)',
                'Generate variance report and adjustment file'
            ].filter(Boolean),
            excelEquivalent: '=VLOOKUP() + IF() statements with variance calculations',
            sqlEquivalent: `SELECT a.sku, a.qty as system_qty, b.qty as physical_qty, 
       (b.qty - a.qty) as variance, 
       (b.qty - a.qty) * a.cost as dollar_impact
FROM system_inventory a
FULL OUTER JOIN physical_count b ON a.sku = b.sku
WHERE a.qty != b.qty OR a.sku IS NULL OR b.sku IS NULL`,
            why: 'Reconciliation is critical for inventory accuracy. It identifies: (1) Shrinkage and loss (negative variances), (2) Receiving errors (positive variances), (3) Misplaced inventory (missing in physical), (4) Ghost inventory (missing in system). The dollar impact prioritization helps focus on high-value discrepancies first.',
            keyInsights: [
                'Perfect matches indicate accurate inventory',
                'Negative variances suggest theft, damage, or receiving errors',
                'Positive variances suggest unreported receipts or mis-counts',
                'Items missing in physical require investigation',
                'Dollar impact helps prioritize which discrepancies to resolve first'
            ]
        };
    }
};
