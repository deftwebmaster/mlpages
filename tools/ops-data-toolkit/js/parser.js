/**
 * CSV/TSV Parser
 * Wrapper around PapaParse with validation and type detection
 */

/**
 * Parse CSV file
 */
export function parseCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,  // Auto-convert numbers
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
            complete: (results) => {
                if (results.errors.length > 0) {
                    const criticalErrors = results.errors.filter(e => e.type === 'FieldMismatch');
                    if (criticalErrors.length > 0) {
                        reject(new Error(`Parse errors: ${criticalErrors.map(e => e.message).join(', ')}`));
                        return;
                    }
                }
                
                resolve({
                    data: results.data,
                    columns: results.meta.fields || [],
                    name: file.name,
                    parseErrors: results.errors
                });
            },
            error: (error) => {
                reject(new Error(`Failed to parse file: ${error.message}`));
            }
        });
    });
}

/**
 * Parse clipboard text (TSV or CSV)
 */
export function parseClipboard(text) {
    return new Promise((resolve, reject) => {
        // Detect delimiter (TSV more common from Excel copy/paste)
        const firstLine = text.split('\n')[0];
        const delimiter = firstLine.includes('\t') ? '\t' : ',';
        
        Papa.parse(text, {
            header: true,
            delimiter: delimiter,
            dynamicTyping: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
            complete: (results) => {
                if (results.data.length === 0) {
                    reject(new Error('No data found in clipboard'));
                    return;
                }
                
                resolve({
                    data: results.data,
                    columns: results.meta.fields || [],
                    name: 'Pasted Data',
                    parseErrors: results.errors
                });
            },
            error: (error) => {
                reject(new Error(`Failed to parse clipboard: ${error.message}`));
            }
        });
    });
}

/**
 * Validate parsed data structure
 */
export function validateData(parsed) {
    const errors = [];
    
    if (!parsed.data || parsed.data.length === 0) {
        errors.push('No data rows found');
    }
    
    if (!parsed.columns || parsed.columns.length === 0) {
        errors.push('No columns detected');
    }
    
    // Check for completely empty rows
    if (parsed.data) {
        const emptyRows = parsed.data.filter(row => {
            return Object.values(row).every(val => val === null || val === '' || val === undefined);
        });
        
        if (emptyRows.length > 0) {
            console.warn(`Found ${emptyRows.length} empty rows (will be filtered)`);
        }
    }
    
    // Check for duplicate column names
    if (parsed.columns) {
        const duplicates = parsed.columns.filter((col, idx) => {
            return parsed.columns.indexOf(col) !== idx;
        });
        
        if (duplicates.length > 0) {
            errors.push(`Duplicate column names: ${duplicates.join(', ')}`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Clean parsed data
 * - Remove empty rows
 * - Normalize column names
 * - Handle null values
 */
export function cleanData(parsed) {
    // Remove completely empty rows
    const cleanedData = parsed.data.filter(row => {
        return Object.values(row).some(val => val !== null && val !== '' && val !== undefined);
    });
    
    // Normalize column names (remove special chars, spaces -> underscores)
    const normalizedColumns = parsed.columns.map(col => {
        return col
            .replace(/[^\w\s]/g, '')  // Remove special chars
            .replace(/\s+/g, '_')      // Spaces to underscores
            .toLowerCase();
    });
    
    // Rebuild data with normalized column names
    const normalizedData = cleanedData.map(row => {
        const newRow = {};
        parsed.columns.forEach((oldCol, idx) => {
            newRow[normalizedColumns[idx]] = row[oldCol];
        });
        return newRow;
    });
    
    return {
        data: normalizedData,
        columns: normalizedColumns,
        name: parsed.name,
        originalColumns: parsed.columns
    };
}

/**
 * Detect column types
 * Returns map of column -> type (string, number, date, boolean, mixed)
 */
export function detectColumnTypes(data, columns) {
    const types = {};
    
    columns.forEach(col => {
        const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
        
        if (values.length === 0) {
            types[col] = 'empty';
            return;
        }
        
        const typeSet = new Set(values.map(v => typeof v));
        
        if (typeSet.size === 1) {
            types[col] = Array.from(typeSet)[0];
        } else if (typeSet.has('number') && typeSet.has('string')) {
            // Check if all strings are actually numbers with formatting
            const allNumeric = values.every(v => !isNaN(parseFloat(v)));
            types[col] = allNumeric ? 'number' : 'mixed';
        } else {
            types[col] = 'mixed';
        }
    });
    
    return types;
}

/**
 * Generate sample data for demo
 */
export function generateSample() {
    const data = [
        { sku: 'ABC-123', description: 'Widget Assembly', qty_on_hand: 144, uom: 'CS', unit_cost: 45.00, location: 'A-01-01' },
        { sku: 'DEF-456', description: 'Bracket Set', qty_on_hand: 12, uom: 'EA', unit_cost: 3.50, location: 'A-01-02' },
        { sku: 'GHI-789', description: 'Fastener Pack', qty_on_hand: 288, uom: 'CS', unit_cost: 12.00, location: 'A-02-01' },
        { sku: 'ABC-123', description: 'Widget Assembly', qty_on_hand: 144, uom: 'CS', unit_cost: 45.00, location: 'A-03-01' },
        { sku: 'JKL-012', description: 'Cable Bundle', qty_on_hand: null, uom: 'EA', unit_cost: 8.25, location: 'B-01-01' },
        { sku: 'MNO-345', description: 'Housing Unit', qty_on_hand: 48, uom: 'PLT', unit_cost: 125.00, location: 'B-02-01' },
        { sku: 'PQR-678', description: 'Connector Kit', qty_on_hand: 240, uom: 'CS', unit_cost: 18.50, location: 'B-03-01' },
        { sku: 'STU-901', description: 'Label Roll', qty_on_hand: 72, uom: 'EA', unit_cost: 2.25, location: 'C-01-01' },
    ];
    
    const columns = ['sku', 'description', 'qty_on_hand', 'uom', 'unit_cost', 'location'];
    
    return {
        data,
        columns,
        name: 'Sample Inventory Data',
        originalColumns: columns.map(c => c.toUpperCase().replace(/_/g, ' '))
    };
}

/**
 * Generate sample physical count data
 */
export function generateCountSample() {
    const data = [
        { sku: 'ABC-123', location: 'A-01-01', physical_qty: 132, uom: 'CS', count_date: '2024-12-19' },
        { sku: 'DEF-456', location: 'A-01-02', physical_qty: 12, uom: 'EA', count_date: '2024-12-19' },
        { sku: 'GHI-789', location: 'A-02-01', physical_qty: 300, uom: 'CS', count_date: '2024-12-19' },
        { sku: 'XYZ-999', location: 'B-03-01', physical_qty: 24, uom: 'EA', count_date: '2024-12-19' },
    ];
    
    const columns = ['sku', 'location', 'physical_qty', 'uom', 'count_date'];
    
    return {
        data,
        columns,
        name: 'Sample Physical Count',
        originalColumns: columns.map(c => c.toUpperCase().replace(/_/g, ' '))
    };
}
