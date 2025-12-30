/**
 * LocalStorage Management
 * Persist project settings, rules, and configuration
 */

const STORAGE_KEY = 'ops_toolkit_project';
const COLUMN_MAPPINGS_KEY = 'ops_toolkit_column_mappings';
const VERSION = '1.0';

/**
 * Save project to LocalStorage
 */
export function saveProject(project) {
    try {
        const toSave = {
            version: VERSION,
            timestamp: new Date().toISOString(),
            rules: project.rules || {
                validation: [],
                conversions: [],
                computed: []
            },
            settings: {
                lastActiveModule: project.activeModule,
                defaultKeyColumns: {
                    A: project.sheets.A?.keyColumn || null,
                    B: project.sheets.B?.keyColumn || null
                }
            }
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        return true;
    } catch (error) {
        console.error('Failed to save project:', error);
        return false;
    }
}

/**
 * Load project from LocalStorage
 */
export function loadProject() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        
        if (!saved) {
            return null;
        }
        
        const project = JSON.parse(saved);
        
        // Version check
        if (project.version !== VERSION) {
            console.warn('Project version mismatch, attempting migration');
            return migrateVersion(project);
        }
        
        return project;
    } catch (error) {
        console.error('Failed to load project:', error);
        return null;
    }
}

/**
 * Clear saved project
 */
export function clearProject() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Failed to clear project:', error);
        return false;
    }
}

/**
 * Migrate project from older version
 */
function migrateVersion(project) {
    // Currently only version 1.0 exists
    // Future migrations would go here
    
    console.log('Migration not needed, using current version');
    return project;
}

// ============================================
// Column Mapping Memory
// ============================================

/**
 * Save column mappings for a module
 * @param {string} moduleId - The module identifier (e.g., 'reconcile', 'validation')
 * @param {object} mappings - Object mapping column names to their roles
 */
export function saveColumnMappings(moduleId, mappings) {
    try {
        const allMappings = getColumnMappings();
        allMappings[moduleId] = {
            ...allMappings[moduleId],
            ...mappings,
            lastUsed: new Date().toISOString()
        };
        localStorage.setItem(COLUMN_MAPPINGS_KEY, JSON.stringify(allMappings));
        return true;
    } catch (error) {
        console.error('Failed to save column mappings:', error);
        return false;
    }
}

/**
 * Get all saved column mappings
 */
export function getColumnMappings() {
    try {
        const saved = localStorage.getItem(COLUMN_MAPPINGS_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (error) {
        console.error('Failed to load column mappings:', error);
        return {};
    }
}

/**
 * Get column mappings for a specific module
 * @param {string} moduleId - The module identifier
 */
export function getModuleMappings(moduleId) {
    const allMappings = getColumnMappings();
    return allMappings[moduleId] || {};
}

/**
 * Auto-detect column mappings based on saved preferences
 * @param {string} moduleId - The module identifier
 * @param {string[]} availableColumns - Columns available in the current dataset
 * @param {object} roleDefinitions - Object defining the roles to map (e.g., {key: 'Key Column', qtyA: 'Quantity A'})
 * @returns {object} - Object with role keys mapped to column names, plus metadata
 */
export function autoMapColumns(moduleId, availableColumns, roleDefinitions) {
    const savedMappings = getModuleMappings(moduleId);
    const result = {
        mappings: {},
        autoMapped: [],
        unmapped: []
    };
    
    // Normalize column names for comparison (lowercase, no spaces/underscores)
    const normalizeCol = (col) => col.toLowerCase().replace(/[_\s-]/g, '');
    const normalizedAvailable = availableColumns.map(col => ({
        original: col,
        normalized: normalizeCol(col)
    }));
    
    for (const [role, label] of Object.entries(roleDefinitions)) {
        // Check if we have a saved mapping for this role
        const savedColName = savedMappings[role];
        
        if (savedColName) {
            // Try exact match first
            const exactMatch = availableColumns.find(col => col === savedColName);
            if (exactMatch) {
                result.mappings[role] = exactMatch;
                result.autoMapped.push({ role, column: exactMatch, label });
                continue;
            }
            
            // Try normalized match
            const normalizedSaved = normalizeCol(savedColName);
            const normalizedMatch = normalizedAvailable.find(c => c.normalized === normalizedSaved);
            if (normalizedMatch) {
                result.mappings[role] = normalizedMatch.original;
                result.autoMapped.push({ role, column: normalizedMatch.original, label });
                continue;
            }
        }
        
        // No saved mapping or no match found
        result.unmapped.push({ role, label });
    }
    
    return result;
}

/**
 * Clear column mappings for a module or all modules
 * @param {string} [moduleId] - Optional module ID. If omitted, clears all mappings.
 */
export function clearColumnMappings(moduleId) {
    try {
        if (moduleId) {
            const allMappings = getColumnMappings();
            delete allMappings[moduleId];
            localStorage.setItem(COLUMN_MAPPINGS_KEY, JSON.stringify(allMappings));
        } else {
            localStorage.removeItem(COLUMN_MAPPINGS_KEY);
        }
        return true;
    } catch (error) {
        console.error('Failed to clear column mappings:', error);
        return false;
    }
}

/**
 * Export project as JSON file
 */
export function exportProjectFile(project) {
    const exported = {
        version: VERSION,
        exportDate: new Date().toISOString(),
        rules: project.rules,
        settings: project.settings
    };
    
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ops-toolkit-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

/**
 * Import project from JSON file
 */
export function importProjectFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                
                if (!imported.version) {
                    reject(new Error('Invalid project file: missing version'));
                    return;
                }
                
                resolve(imported);
            } catch (error) {
                reject(new Error('Invalid JSON file'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
    });
}

/**
 * Check LocalStorage availability and quota
 */
export function checkStorage() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        
        // Estimate quota usage (rough approximation)
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
            }
        }
        
        return {
            available: true,
            usedBytes: totalSize,
            usedKB: (totalSize / 1024).toFixed(2)
        };
    } catch (error) {
        return {
            available: false,
            error: error.message
        };
    }
}

/**
 * Auto-save helper
 * Debounces saves to avoid excessive writes
 */
let saveTimeout = null;

export function autoSave(project, delay = 1000) {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    
    saveTimeout = setTimeout(() => {
        saveProject(project);
        console.log('Project auto-saved');
    }, delay);
}
