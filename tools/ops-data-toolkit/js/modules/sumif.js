/**
 * SUMIF/COUNTIF Module
 * Conditional aggregation calculator
 */

import State from '../state.js';

export const SumIfModule = {
    name: 'SUMIF / COUNTIF',
    description: 'Conditional aggregation with filters',
    
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
                <h3>SUMIF / COUNTIF Calculator</h3>
                <p>Count rows or sum values based on conditions.</p>
                
                <div class="control-row">
                    <div class="control-field">
                        <label>Operation Type</label>
                        <select id="operationType" class="select-input">
                            <option value="count">COUNTIF - Count matching rows</option>
                            <option value="sum">SUMIF - Sum values from matching rows</option>
                        </select>
                    </div>
                </div>
                
                <h4 style="margin-top: 20px;">Condition</h4>
                
                <div class="control-row">
                    <div class="control-field">
                        <label>Column to Check</label>
                        <select id="conditionColumn" class="select-input">
                            ${sheet.columns.map(col => `
                                <option value="${col}">
                                    ${col.replace(/_/g, ' ').toUpperCase()}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="control-field">
                        <label>Operator</label>
                        <select id="conditionOperator" class="select-input">
                            <option value="=">=  (equals)</option>
                            <option value="!=">≠  (not equals)</option>
                            <option value=">">›  (greater than)</option>
                            <option value="<">‹  (less than)</option>
                            <option value=">=">&ge;  (greater or equal)</option>
                            <option value="<=">&le;  (less or equal)</option>
                            <option value="contains">contains</option>
                            <option value="starts">starts with</option>
                            <option value="ends">ends with</option>
                        </select>
                    </div>
                    
                    <div class="control-field">
                        <label>Value</label>
                        <input type="text" id="conditionValue" class="select-input" placeholder="Enter value">
                    </div>
                </div>
                
                <div id="sumColumnSection" style="display: none;">
                    <h4 style="margin-top: 20px;">Sum Column</h4>
                    <div class="control-row">
                        <div class="control-field">
                            <label>Column to Sum</label>
                            <select id="sumColumn" class="select-input">
                                ${sheet.columns.map(col => `
                                    <option value="${col}">
                                        ${col.replace(/_/g, ' ').toUpperCase()}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="control-group" style="margin-top: 20px;">
                    <label>
                        <input type="checkbox" id="groupBy">
                        <strong>Group Results By Column</strong>
                    </label>
                </div>
                
                <div id="groupBySection" style="display: none; margin-left: 25px;">
                    <div class="control-field">
                        <select id="groupByColumn" class="select-input">
                            ${sheet.columns.map(col => `
                                <option value="${col}">
                                    ${col.replace(/_/g, ' ').toUpperCase()}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <button id="runSumIf" class="btn-primary">Calculate</button>
                </div>
            </div>
        `;
        
        // Attach event listeners
        document.getElementById('operationType').addEventListener('change', (e) => {
            const sumSection = document.getElementById('sumColumnSection');
            sumSection.style.display = e.target.value === 'sum' ? 'block' : 'none';
        });
        
        document.getElementById('groupBy').addEventListener('change', (e) => {
            const groupSection = document.getElementById('groupBySection');
            groupSection.style.display = e.target.checked ? 'block' : 'none';
        });
        
        document.getElementById('runSumIf').addEventListener('click', () => {
            this.execute();
        });
    },
    
    /**
     * Get current options
     */
    getOptions() {
        return {
            operation: document.getElementById('operationType')?.value || 'count',
            conditionColumn: document.getElementById('conditionColumn')?.value,
            operator: document.getElementById('conditionOperator')?.value,
            conditionValue: document.getElementById('conditionValue')?.value,
            sumColumn: document.getElementById('sumColumn')?.value,
            groupBy: document.getElementById('groupBy')?.checked || false,
            groupByColumn: document.getElementById('groupByColumn')?.value
        };
    },
    
    /**
     * Execute calculation
     */
    execute() {
        const sheet = State.getActiveSheet();
        const options = this.getOptions();
        
        if (!sheet || !sheet.data) {
            return;
        }
        
        if (!options.conditionValue) {
            alert('Please enter a condition value');
            return;
        }
        
        const result = options.groupBy 
            ? this.calculateGrouped(sheet.data, options)
            : this.calculateSingle(sheet.data, options);
        
        State.setResults({
            data: result.display,
            columns: result.columns,
            metrics: result.stats,
            explanation: this.getExplanation(options)
        });
        
        return result;
    },
    
    /**
     * Calculate single result (no grouping)
     */
    calculateSingle(data, options) {
        const matchingRows = this.filterRows(data, options);
        
        let result;
        if (options.operation === 'count') {
            result = matchingRows.length;
        } else {
            result = matchingRows.reduce((sum, row) => {
                const value = parseFloat(row[options.sumColumn]);
                return sum + (isNaN(value) ? 0 : value);
            }, 0);
        }
        
        const display = [{
            condition: this.formatCondition(options),
            result: result,
            matching_rows: matchingRows.length,
            total_rows: data.length
        }];
        
        return {
            display,
            columns: ['condition', 'result', 'matching_rows', 'total_rows'],
            stats: {
                result: result,
                matching_rows: matchingRows.length,
                total_rows: data.length,
                match_rate: ((matchingRows.length / data.length) * 100).toFixed(1) + '%'
            }
        };
    },
    
    /**
     * Calculate grouped results
     */
    calculateGrouped(data, options) {
        const groups = new Map();
        
        // Filter rows first
        const matchingRows = this.filterRows(data, options);
        
        // Group matching rows
        matchingRows.forEach(row => {
            const groupKey = String(row[options.groupByColumn] || '(empty)');
            
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            
            groups.get(groupKey).push(row);
        });
        
        // Calculate for each group
        const display = [];
        let totalResult = 0;
        
        for (const [groupKey, rows] of groups) {
            let result;
            
            if (options.operation === 'count') {
                result = rows.length;
            } else {
                result = rows.reduce((sum, row) => {
                    const value = parseFloat(row[options.sumColumn]);
                    return sum + (isNaN(value) ? 0 : value);
                }, 0);
            }
            
            totalResult += result;
            
            display.push({
                group: groupKey,
                count: rows.length,
                result: result
            });
        }
        
        // Sort by result descending
        display.sort((a, b) => b.result - a.result);
        
        return {
            display,
            columns: ['group', 'count', 'result'],
            stats: {
                total_result: totalResult,
                groups: groups.size,
                matching_rows: matchingRows.length,
                total_rows: data.length
            }
        };
    },
    
    /**
     * Filter rows based on condition
     */
    filterRows(data, options) {
        return data.filter(row => {
            const value = row[options.conditionColumn];
            return this.evaluateCondition(value, options.operator, options.conditionValue);
        });
    },
    
    /**
     * Evaluate single condition
     */
    evaluateCondition(value, operator, conditionValue) {
        // Handle nulls
        if (value === null || value === undefined) {
            return false;
        }
        
        const strValue = String(value).toLowerCase();
        const strCondition = String(conditionValue).toLowerCase();
        
        switch (operator) {
            case '=':
                return strValue === strCondition;
            
            case '!=':
                return strValue !== strCondition;
            
            case '>':
                return parseFloat(value) > parseFloat(conditionValue);
            
            case '<':
                return parseFloat(value) < parseFloat(conditionValue);
            
            case '>=':
                return parseFloat(value) >= parseFloat(conditionValue);
            
            case '<=':
                return parseFloat(value) <= parseFloat(conditionValue);
            
            case 'contains':
                return strValue.includes(strCondition);
            
            case 'starts':
                return strValue.startsWith(strCondition);
            
            case 'ends':
                return strValue.endsWith(strCondition);
            
            default:
                return false;
        }
    },
    
    /**
     * Format condition for display
     */
    formatCondition(options) {
        return `${options.conditionColumn} ${options.operator} "${options.conditionValue}"`;
    },
    
    /**
     * Generate explanation
     */
    getExplanation(options) {
        const operation = options.operation === 'count' ? 'COUNTIF' : 'SUMIF';
        const condition = this.formatCondition(options);
        
        let excelFormula;
        if (options.operation === 'count') {
            excelFormula = `=COUNTIF(${options.conditionColumn}:${options.conditionColumn}, "${options.conditionValue}")`;
        } else {
            excelFormula = `=SUMIF(${options.conditionColumn}:${options.conditionColumn}, "${options.conditionValue}", ${options.sumColumn}:${options.sumColumn})`;
        }
        
        let sqlQuery;
        if (options.operation === 'count') {
            sqlQuery = `SELECT COUNT(*) FROM table WHERE ${condition}`;
        } else {
            sqlQuery = `SELECT SUM(${options.sumColumn}) FROM table WHERE ${condition}`;
        }
        
        if (options.groupBy) {
            sqlQuery += ` GROUP BY ${options.groupByColumn}`;
        }
        
        return {
            description: `${operation} finds rows matching "${condition}" and ${options.operation === 'count' ? 'counts them' : 'sums the ' + options.sumColumn + ' column'}. ${options.groupBy ? 'Results are grouped by ' + options.groupByColumn + '.' : ''}`,
            steps: [
                `Check each row's ${options.conditionColumn} value`,
                `Keep rows where ${condition}`,
                options.operation === 'count' 
                    ? 'Count matching rows'
                    : `Sum ${options.sumColumn} values from matching rows`,
                options.groupBy ? `Group results by ${options.groupByColumn}` : 'Return single result'
            ],
            excelEquivalent: excelFormula,
            sqlEquivalent: sqlQuery,
            why: 'Conditional aggregation answers questions like: How many items have qty < 10? What\'s the total value of items in Location A? What\'s the count by UOM? These insights help with reorder points, location analysis, and inventory valuation.'
        };
    }
};
