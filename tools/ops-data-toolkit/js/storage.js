/**
 * LocalStorage Management
 * Persist project settings, rules, and configuration
 */

const STORAGE_KEY = 'ops_toolkit_project';
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
