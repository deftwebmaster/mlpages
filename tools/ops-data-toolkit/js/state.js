/**
 * State Management
 * Single source of truth for application data with pub/sub pattern
 */

const State = {
    // Core data
    project: {
        sheets: {
            A: null,  // { name, data, columns, keyColumn }
            B: null
        },
        activeSheet: 'A',
        activeModule: null,
        rules: {
            validation: [],
            conversions: [],
            computed: []
        },
        results: null,
        history: []
    },
    
    // Subscribers for reactive updates
    listeners: [],
    
    /**
     * Subscribe to state changes
     */
    subscribe(listener) {
        this.listeners.push(listener);
    },
    
    /**
     * Notify all subscribers of state change
     */
    notify(change) {
        this.listeners.forEach(listener => {
            try {
                listener(this.project, change);
            } catch (error) {
                console.error('Listener error:', error);
            }
        });
    },
    
    /**
     * Update state and notify listeners
     */
    update(path, value, meta = {}) {
        // Save to history before changing
        if (meta.saveHistory !== false) {
            this.saveToHistory();
        }
        
        // Update nested property
        const keys = path.split('.');
        let current = this.project;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        
        // Notify subscribers
        this.notify({ path, value, meta });
    },
    
    /**
     * Get value from state
     */
    get(path) {
        const keys = path.split('.');
        let current = this.project;
        
        for (const key of keys) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[key];
        }
        
        return current;
    },
    
    /**
     * Get sheet data by name
     */
    getSheet(name) {
        return this.project.sheets[name];
    },
    
    /**
     * Get active sheet
     */
    getActiveSheet() {
        return this.getSheet(this.project.activeSheet);
    },
    
    /**
     * Set sheet data
     */
    setSheet(name, data) {
        this.update(`sheets.${name}`, data);
    },
    
    /**
     * Clear sheet data
     */
    clearSheet(name) {
        this.update(`sheets.${name}`, null);
    },
    
    /**
     * Set active sheet
     */
    setActiveSheet(name) {
        if (name !== 'A' && name !== 'B') {
            console.error('Invalid sheet name:', name);
            return;
        }
        this.update('activeSheet', name);
    },
    
    /**
     * Set active module
     */
    setActiveModule(moduleId) {
        this.update('activeModule', moduleId);
    },
    
    /**
     * Set results from module execution
     */
    setResults(results) {
        this.update('results', results);
    },
    
    /**
     * Clear all data
     */
    reset() {
        this.project = {
            sheets: { A: null, B: null },
            activeSheet: 'A',
            activeModule: null,
            rules: {
                validation: [],
                conversions: [],
                computed: []
            },
            results: null,
            history: []
        };
        this.notify({ type: 'reset' });
    },
    
    /**
     * Save current state to history
     */
    saveToHistory() {
        const snapshot = JSON.stringify(this.project);
        this.project.history.push(snapshot);
        
        // Keep only last 20 states
        if (this.project.history.length > 20) {
            this.project.history.shift();
        }
    },
    
    /**
     * Undo last change
     */
    undo() {
        if (this.project.history.length === 0) {
            return false;
        }
        
        const previous = this.project.history.pop();
        this.project = JSON.parse(previous);
        this.notify({ type: 'undo' });
        return true;
    },
    
    /**
     * Get statistics about current data
     */
    getStats() {
        const sheet = this.getActiveSheet();
        
        if (!sheet || !sheet.data) {
            return {
                rows: 0,
                columns: 0,
                hasData: false
            };
        }
        
        return {
            rows: sheet.data.length,
            columns: sheet.columns.length,
            hasData: true,
            keyColumn: sheet.keyColumn || null,
            sheetName: sheet.name || 'Untitled'
        };
    },
    
    /**
     * Check if sheet has data
     */
    hasData(sheetName) {
        const sheet = this.getSheet(sheetName);
        return sheet && sheet.data && sheet.data.length > 0;
    },
    
    /**
     * Export project for persistence
     */
    exportProject() {
        return {
            version: '1.0',
            timestamp: new Date().toISOString(),
            rules: this.project.rules,
            settings: {
                lastActiveModule: this.project.activeModule
            }
        };
    },
    
    /**
     * Import project settings
     */
    importProject(saved) {
        if (saved.version !== '1.0') {
            console.warn('Version mismatch, attempting migration');
        }
        
        this.update('rules', saved.rules || {
            validation: [],
            conversions: [],
            computed: []
        });
        
        if (saved.settings?.lastActiveModule) {
            this.update('activeModule', saved.settings.lastActiveModule);
        }
    }
};

export default State;
