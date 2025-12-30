/**
 * Validation Module
 * Rule-based data validation engine
 */

import State from '../state.js';

export const ValidationModule = {
    name: 'Data Validation',
    description: 'Validate data against configurable rules',
    
    // Rule types and validators
    ruleTypes: {
        required: {
            label: 'Required',
            validate: (value) => value !== null && value !== undefined && value !== '',
            message: (field) => `${field} is required`
        },
        numeric: {
            label: 'Must be Numeric',
            validate: (value) => !isNaN(parseFloat(value)) && isFinite(value),
            message: (field) => `${field} must be a number`
        },
        integer: {
            label: 'Must be Integer',
            validate: (value) => Number.isInteger(Number(value)),
            message: (field) => `${field} must be a whole number`
        },
        positive: {
            label: 'Must be Positive',
            validate: (value) => parseFloat(value) > 0,
            message: (field) => `${field} must be positive`
        },
        min: {
            label: 'Minimum Value',
            hasThreshold: true,
            validate: (value, threshold) => parseFloat(value) >= parseFloat(threshold),
            message: (field, threshold) => `${field} must be >= ${threshold}`
        },
        max: {
            label: 'Maximum Value',
            hasThreshold: true,
            validate: (value, threshold) => parseFloat(value) <= parseFloat(threshold),
            message: (field, threshold) => `${field} must be <= ${threshold}`
        },
        length: {
            label: 'Exact Length',
            hasThreshold: true,
            validate: (value, threshold) => String(value).length === parseInt(threshold),
            message: (field, threshold) => `${field} must be exactly ${threshold} characters`
        },
        minLength: {
            label: 'Minimum Length',
            hasThreshold: true,
            validate: (value, threshold) => String(value).length >= parseInt(threshold),
            message: (field, threshold) => `${field} must be at least ${threshold} characters`
        },
        pattern: {
            label: 'Matches Pattern',
            hasThreshold: true,
            validate: (value, pattern) => {
                try {
                    return new RegExp(pattern).test(String(value));
                } catch {
                    return false;
                }
            },
            message: (field, pattern) => `${field} must match pattern: ${pattern}`
        },
        oneOf: {
            label: 'One Of (comma-separated)',
            hasThreshold: true,
            validate: (value, allowed) => {
                const list = allowed.split(',').map(v => v.trim());
                return list.includes(String(value));
            },
            message: (field, allowed) => `${field} must be one of: ${allowed}`
        }
    },
    
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
        
        // Get existing rules from state
        const rules = State.project.rules.validation || [];
        
        container.innerHTML = `
            <div class="module-controls">
                <h3>Validation Rules</h3>
                <p>Define rules to validate data quality. Errors will be flagged for review.</p>
                
                <div class="rule-builder">
                    <div class="rule-builder-header">
                        <h4>Active Rules</h4>
                        <span id="ruleCount">${rules.length} rules</span>
                    </div>
                    
                    <div class="rule-list" id="ruleList">
                        ${this.renderRuleList(rules, sheet.columns)}
                    </div>
                    
                    <button id="addRule" class="rule-add">+ Add Validation Rule</button>
                </div>
                
                <div style="margin-top: 20px;">
                    <button id="runValidation" class="btn-primary">Run Validation</button>
                    <button id="clearRules" class="btn-secondary">Clear All Rules</button>
                </div>
            </div>
        `;
        
        // Attach event listeners
        document.getElementById('runValidation').addEventListener('click', () => {
            this.execute();
        });
        
        document.getElementById('addRule').addEventListener('click', () => {
            this.addRule();
        });
        
        document.getElementById('clearRules').addEventListener('click', () => {
            if (confirm('Clear all validation rules?')) {
                State.update('rules.validation', []);
                this.renderControls(container);
            }
        });
        
        // Attach remove listeners
        this.attachRuleListeners();
    },
    
    /**
     * Render rule list
     */
    renderRuleList(rules, columns) {
        if (rules.length === 0) {
            return '<p style="color: var(--color-text-muted); font-size: 13px;">No rules defined yet. Click "Add Validation Rule" to create one.</p>';
        }
        
        return rules.map((rule, idx) => `
            <div class="rule-item" data-rule-index="${idx}">
                <select class="rule-column" data-rule-index="${idx}">
                    <option value="">- Column -</option>
                    ${columns.map(col => `
                        <option value="${col}" ${rule.column === col ? 'selected' : ''}>
                            ${col.replace(/_/g, ' ').toUpperCase()}
                        </option>
                    `).join('')}
                </select>
                
                <select class="rule-type" data-rule-index="${idx}">
                    ${Object.entries(this.ruleTypes).map(([key, type]) => `
                        <option value="${key}" ${rule.type === key ? 'selected' : ''}>
                            ${type.label}
                        </option>
                    `).join('')}
                </select>
                
                ${this.ruleTypes[rule.type]?.hasThreshold ? `
                    <input 
                        type="text" 
                        class="rule-threshold" 
                        data-rule-index="${idx}"
                        value="${rule.threshold || ''}"
                        placeholder="Value">
                ` : ''}
                
                <select class="rule-severity" data-rule-index="${idx}">
                    <option value="error" ${rule.severity === 'error' ? 'selected' : ''}>Error</option>
                    <option value="warning" ${rule.severity === 'warning' ? 'selected' : ''}>Warning</option>
                </select>
                
                <button class="rule-remove" data-rule-index="${idx}">×</button>
            </div>
        `).join('');
    },
    
    /**
     * Attach rule listeners
     */
    attachRuleListeners() {
        // Change listeners
        document.querySelectorAll('.rule-column, .rule-type, .rule-threshold, .rule-severity').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateRule(parseInt(e.target.dataset.ruleIndex));
            });
        });
        
        // Remove listeners
        document.querySelectorAll('.rule-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.removeRule(parseInt(e.target.dataset.ruleIndex));
            });
        });
    },
    
    /**
     * Add new rule
     */
    addRule() {
        const rules = State.project.rules.validation || [];
        const sheet = State.getActiveSheet();
        
        rules.push({
            column: sheet.columns[0] || '',
            type: 'required',
            threshold: '',
            severity: 'error'
        });
        
        State.update('rules.validation', rules);
        
        // Re-render
        const container = document.querySelector('.module-controls').parentElement;
        this.renderControls(container);
    },
    
    /**
     * Update rule
     */
    updateRule(index) {
        const rules = State.project.rules.validation || [];
        
        const column = document.querySelector(`.rule-column[data-rule-index="${index}"]`).value;
        const type = document.querySelector(`.rule-type[data-rule-index="${index}"]`).value;
        const thresholdInput = document.querySelector(`.rule-threshold[data-rule-index="${index}"]`);
        const threshold = thresholdInput ? thresholdInput.value : '';
        const severity = document.querySelector(`.rule-severity[data-rule-index="${index}"]`).value;
        
        rules[index] = { column, type, threshold, severity };
        
        State.update('rules.validation', rules, { saveHistory: false });
    },
    
    /**
     * Remove rule
     */
    removeRule(index) {
        const rules = State.project.rules.validation || [];
        rules.splice(index, 1);
        
        State.update('rules.validation', rules);
        
        // Re-render
        const container = document.querySelector('.module-controls').parentElement;
        this.renderControls(container);
    },
    
    /**
     * Execute validation
     */
    execute() {
        const sheet = State.getActiveSheet();
        const rules = State.project.rules.validation || [];
        
        if (!sheet || !sheet.data) {
            return;
        }
        
        if (rules.length === 0) {
            alert('No validation rules defined. Add rules first.');
            return;
        }
        
        const result = this.validate(sheet.data, rules);
        
        State.setResults({
            data: result.errors,
            columns: ['row', 'column', 'value', 'rule', 'severity', 'message'],
            metrics: result.stats,
            explanation: this.getExplanation(rules),
            _validationData: result // Store full result for highlighting
        });
        
        return result;
    },
    
    /**
     * Core validation logic
     */
    validate(data, rules) {
        const errors = [];
        const stats = {
            total_rows: data.length,
            rows_with_errors: 0,
            total_errors: 0,
            errors_by_severity: { error: 0, warning: 0 }
        };
        
        const rowsWithErrors = new Set();
        const errorIndices = []; // Track row indices with errors
        const warningIndices = []; // Track row indices with warnings
        
        data.forEach((row, rowIndex) => {
            let rowHasError = false;
            let rowHasWarning = false;
            
            rules.forEach(rule => {
                const value = row[rule.column];
                const validator = this.ruleTypes[rule.type];
                
                if (!validator) {
                    console.error('Unknown rule type:', rule.type);
                    return;
                }
                
                // Run validation
                const isValid = validator.validate(value, rule.threshold);
                
                if (!isValid) {
                    errors.push({
                        row: rowIndex + 1,
                        rowIndex: rowIndex, // Store actual index for highlighting
                        column: rule.column,
                        value: value === null || value === undefined ? '(null)' : String(value),
                        rule: validator.label,
                        severity: rule.severity,
                        message: validator.message(rule.column, rule.threshold)
                    });
                    
                    stats.total_errors++;
                    stats.errors_by_severity[rule.severity]++;
                    rowsWithErrors.add(rowIndex);
                    
                    if (rule.severity === 'error') {
                        rowHasError = true;
                    } else {
                        rowHasWarning = true;
                    }
                }
            });
            
            if (rowHasError) {
                errorIndices.push(rowIndex);
            } else if (rowHasWarning) {
                warningIndices.push(rowIndex);
            }
        });
        
        stats.rows_with_errors = rowsWithErrors.size;
        stats.error_rate = ((stats.rows_with_errors / stats.total_rows) * 100).toFixed(1) + '%';
        
        return {
            errors,
            stats,
            errorIndices,
            warningIndices,
            allErrorIndices: [...rowsWithErrors] // All rows with any issue
        };
    },
    
    /**
     * Generate explanation
     */
    getExplanation(rules) {
        const ruleDescriptions = rules.map(rule => {
            const validator = this.ruleTypes[rule.type];
            const threshold = rule.threshold ? ` (${rule.threshold})` : '';
            return `${rule.column}: ${validator.label}${threshold}`;
        });
        
        return {
            description: 'Validation checks data quality by applying rules to each row. This catches data entry errors, formatting issues, and missing required fields before they cause problems in downstream systems.',
            steps: [
                'For each row in the dataset',
                'Apply all validation rules to specified columns',
                'Flag violations with severity level (error or warning)',
                'Generate error report with row number and details'
            ],
            excelEquivalent: 'Data Validation (Data tab) + Conditional Formatting for highlighting',
            sqlEquivalent: 'CASE WHEN validation_condition THEN "valid" ELSE "error" END',
            why: 'Pre-import validation prevents: (1) WMS import failures, (2) Negative inventory from bad quantities, (3) Orphaned records from invalid keys, (4) System crashes from malformed data. Catching errors here saves hours of troubleshooting later.',
            activeRules: ruleDescriptions
        };
    }
};
