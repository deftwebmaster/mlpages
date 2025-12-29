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

/**
 * Sample Data Scenarios for Demo
 * Each returns { sheetA, sheetB, description, suggestedModule }
 */
export const SAMPLE_SCENARIOS = {
    'cycle-count': {
        name: 'Cycle Count Reconciliation',
        description: 'Compare WMS inventory against physical counts to find variances',
        suggestedModule: 'reconcile',
        sheetA: {
            name: 'WMS Inventory',
            columns: ['sku', 'description', 'location', 'wms_qty', 'uom', 'unit_cost'],
            data: [
                { sku: 'WGT-1001', description: 'Industrial Widget Standard', location: 'A-12-01', wms_qty: 144, uom: 'EA', unit_cost: 12.50 },
                { sku: 'WGT-1002', description: 'Industrial Widget Heavy', location: 'A-12-02', wms_qty: 96, uom: 'EA', unit_cost: 18.75 },
                { sku: 'BRK-2001', description: 'Mounting Bracket Set', location: 'A-15-01', wms_qty: 288, uom: 'EA', unit_cost: 4.25 },
                { sku: 'FST-3001', description: 'Fastener Assortment Box', location: 'B-03-01', wms_qty: 48, uom: 'CS', unit_cost: 32.00 },
                { sku: 'CBL-4001', description: 'Power Cable 6ft', location: 'B-05-02', wms_qty: 500, uom: 'EA', unit_cost: 8.50 },
                { sku: 'HSG-5001', description: 'Equipment Housing Large', location: 'C-01-01', wms_qty: 24, uom: 'EA', unit_cost: 145.00 },
                { sku: 'LBL-6001', description: 'Shipping Label Roll', location: 'D-02-01', wms_qty: 36, uom: 'RL', unit_cost: 22.00 },
                { sku: 'CON-7001', description: 'Electrical Connector Kit', location: 'D-04-03', wms_qty: 72, uom: 'KT', unit_cost: 15.25 },
            ]
        },
        sheetB: {
            name: 'Physical Count',
            columns: ['sku', 'location', 'counted_qty', 'counted_by', 'count_date'],
            data: [
                { sku: 'WGT-1001', location: 'A-12-01', counted_qty: 132, counted_by: 'J.Smith', count_date: '2024-12-28' },
                { sku: 'WGT-1002', location: 'A-12-02', counted_qty: 96, counted_by: 'J.Smith', count_date: '2024-12-28' },
                { sku: 'BRK-2001', location: 'A-15-01', counted_qty: 312, counted_by: 'M.Johnson', count_date: '2024-12-28' },
                { sku: 'FST-3001', location: 'B-03-01', counted_qty: 48, counted_by: 'M.Johnson', count_date: '2024-12-28' },
                { sku: 'CBL-4001', location: 'B-05-02', counted_qty: 487, counted_by: 'R.Davis', count_date: '2024-12-28' },
                { sku: 'HSG-5001', location: 'C-01-01', counted_qty: 24, counted_by: 'R.Davis', count_date: '2024-12-28' },
                { sku: 'LBL-6001', location: 'D-02-01', counted_qty: 42, counted_by: 'A.Wilson', count_date: '2024-12-28' },
                { sku: 'PKG-9001', location: 'E-01-01', counted_qty: 18, counted_by: 'A.Wilson', count_date: '2024-12-28' },
            ]
        }
    },
    
    'receiving': {
        name: 'Receiving Discrepancies',
        description: 'Compare PO expected quantities against actual received quantities',
        suggestedModule: 'reconcile',
        sheetA: {
            name: 'PO Expected',
            columns: ['po_number', 'sku', 'vendor', 'expected_qty', 'uom', 'unit_cost'],
            data: [
                { po_number: 'PO-2024-5678', sku: 'ACM-1001', vendor: 'Acme Supply Co', expected_qty: 500, uom: 'EA', unit_cost: 3.25 },
                { po_number: 'PO-2024-5678', sku: 'ACM-1002', vendor: 'Acme Supply Co', expected_qty: 250, uom: 'EA', unit_cost: 5.50 },
                { po_number: 'PO-2024-5678', sku: 'ACM-1003', vendor: 'Acme Supply Co', expected_qty: 100, uom: 'CS', unit_cost: 48.00 },
                { po_number: 'PO-2024-5679', sku: 'GLB-2001', vendor: 'Global Parts Inc', expected_qty: 1000, uom: 'EA', unit_cost: 1.25 },
                { po_number: 'PO-2024-5679', sku: 'GLB-2002', vendor: 'Global Parts Inc', expected_qty: 200, uom: 'EA', unit_cost: 8.75 },
                { po_number: 'PO-2024-5680', sku: 'PRO-3001', vendor: 'ProSupply LLC', expected_qty: 48, uom: 'CS', unit_cost: 125.00 },
            ]
        },
        sheetB: {
            name: 'Received',
            columns: ['po_number', 'sku', 'received_qty', 'received_date', 'receiver'],
            data: [
                { po_number: 'PO-2024-5678', sku: 'ACM-1001', received_qty: 500, received_date: '2024-12-27', receiver: 'Dock A' },
                { po_number: 'PO-2024-5678', sku: 'ACM-1002', received_qty: 248, received_date: '2024-12-27', receiver: 'Dock A' },
                { po_number: 'PO-2024-5678', sku: 'ACM-1003', received_qty: 100, received_date: '2024-12-27', receiver: 'Dock A' },
                { po_number: 'PO-2024-5679', sku: 'GLB-2001', received_qty: 1000, received_date: '2024-12-28', receiver: 'Dock B' },
                { po_number: 'PO-2024-5679', sku: 'GLB-2002', received_qty: 200, received_date: '2024-12-28', receiver: 'Dock B' },
                { po_number: 'PO-2024-5679', sku: 'GLB-2003', received_qty: 50, received_date: '2024-12-28', receiver: 'Dock B' },
            ]
        }
    },
    
    'duplicates': {
        name: 'Duplicate SKUs',
        description: 'Find duplicate entries in inventory data that need consolidation',
        suggestedModule: 'duplicates',
        sheetA: {
            name: 'Inventory Export',
            columns: ['sku', 'description', 'location', 'qty_on_hand', 'uom', 'last_updated'],
            data: [
                { sku: 'TOOL-001', description: 'Power Drill 18V', location: 'A-01-01', qty_on_hand: 24, uom: 'EA', last_updated: '2024-12-15' },
                { sku: 'TOOL-002', description: 'Impact Driver Set', location: 'A-01-02', qty_on_hand: 12, uom: 'EA', last_updated: '2024-12-15' },
                { sku: 'TOOL-001', description: 'Power Drill 18V', location: 'A-03-01', qty_on_hand: 18, uom: 'EA', last_updated: '2024-12-20' },
                { sku: 'TOOL-003', description: 'Circular Saw 7.25in', location: 'A-02-01', qty_on_hand: 8, uom: 'EA', last_updated: '2024-12-18' },
                { sku: 'TOOL-002', description: 'Impact Driver Set', location: 'B-01-01', qty_on_hand: 6, uom: 'EA', last_updated: '2024-12-22' },
                { sku: 'TOOL-004', description: 'Jigsaw Variable Speed', location: 'A-02-02', qty_on_hand: 15, uom: 'EA', last_updated: '2024-12-19' },
                { sku: 'TOOL-001', description: 'Power Drill 18V', location: 'C-01-01', qty_on_hand: 6, uom: 'EA', last_updated: '2024-12-25' },
                { sku: 'TOOL-005', description: 'Orbital Sander', location: 'A-03-02', qty_on_hand: 20, uom: 'EA', last_updated: '2024-12-17' },
                { sku: 'TOOL-003', description: 'Circular Saw 7.25in', location: 'B-02-01', qty_on_hand: 4, uom: 'EA', last_updated: '2024-12-23' },
            ]
        },
        sheetB: null
    },
    
    'validation': {
        name: 'Data Quality Issues',
        description: 'Sample data with common issues: nulls, invalid formats, outliers',
        suggestedModule: 'validation',
        sheetA: {
            name: 'Raw Import',
            columns: ['sku', 'description', 'qty', 'uom', 'cost', 'location', 'vendor_code'],
            data: [
                { sku: 'PROD-001', description: 'Standard Widget', qty: 100, uom: 'EA', cost: 12.50, location: 'A-01-01', vendor_code: 'VND-100' },
                { sku: 'PROD-002', description: '', qty: 50, uom: 'EA', cost: 8.25, location: 'A-01-02', vendor_code: 'VND-100' },
                { sku: 'PROD-003', description: 'Premium Widget', qty: null, uom: 'EA', cost: 24.00, location: 'A-02-01', vendor_code: 'VND-101' },
                { sku: '', description: 'Mystery Item', qty: 25, uom: 'CS', cost: 45.00, location: 'A-02-02', vendor_code: 'VND-102' },
                { sku: 'PROD-005', description: 'Bulk Component', qty: 10000, uom: 'EA', cost: 0.05, location: 'B-01-01', vendor_code: '' },
                { sku: 'PROD-006', description: 'Special Order', qty: -5, uom: 'EA', cost: 150.00, location: 'B-01-02', vendor_code: 'VND-103' },
                { sku: 'PROD-007', description: 'Clearance Item', qty: 200, uom: '', cost: 3.00, location: 'C-01-01', vendor_code: 'VND-100' },
                { sku: 'PROD-008', description: 'Test Product', qty: 75, uom: 'EA', cost: null, location: 'C-01-02', vendor_code: 'VND-104' },
                { sku: 'PROD-009', description: 'Sample Unit', qty: 10, uom: 'EA', cost: 99999.99, location: '', vendor_code: 'VND-105' },
            ]
        },
        sheetB: null
    },
    
    'lookup': {
        name: 'Price Lookup',
        description: 'Match order lines against master price list',
        suggestedModule: 'lookup',
        sheetA: {
            name: 'Order Lines',
            columns: ['order_id', 'sku', 'qty_ordered', 'customer'],
            data: [
                { order_id: 'ORD-10001', sku: 'SKU-A100', qty_ordered: 10, customer: 'ABC Corp' },
                { order_id: 'ORD-10001', sku: 'SKU-B200', qty_ordered: 5, customer: 'ABC Corp' },
                { order_id: 'ORD-10001', sku: 'SKU-C300', qty_ordered: 20, customer: 'ABC Corp' },
                { order_id: 'ORD-10002', sku: 'SKU-A100', qty_ordered: 25, customer: 'XYZ Inc' },
                { order_id: 'ORD-10002', sku: 'SKU-D400', qty_ordered: 8, customer: 'XYZ Inc' },
                { order_id: 'ORD-10003', sku: 'SKU-B200', qty_ordered: 15, customer: '123 Ltd' },
                { order_id: 'ORD-10003', sku: 'SKU-E500', qty_ordered: 3, customer: '123 Ltd' },
                { order_id: 'ORD-10004', sku: 'SKU-Z999', qty_ordered: 100, customer: 'Test Co' },
            ]
        },
        sheetB: {
            name: 'Price List',
            columns: ['sku', 'description', 'list_price', 'cost', 'category'],
            data: [
                { sku: 'SKU-A100', description: 'Widget Alpha', list_price: 25.00, cost: 12.50, category: 'Widgets' },
                { sku: 'SKU-B200', description: 'Widget Beta', list_price: 35.00, cost: 17.50, category: 'Widgets' },
                { sku: 'SKU-C300', description: 'Widget Gamma', list_price: 45.00, cost: 22.50, category: 'Widgets' },
                { sku: 'SKU-D400', description: 'Bracket Standard', list_price: 8.50, cost: 4.25, category: 'Hardware' },
                { sku: 'SKU-E500', description: 'Bracket Heavy Duty', list_price: 15.00, cost: 7.50, category: 'Hardware' },
                { sku: 'SKU-F600', description: 'Connector Basic', list_price: 3.25, cost: 1.60, category: 'Electrical' },
            ]
        }
    }
};

/**
 * Get sample scenario by key
 */
export function getSampleScenario(key) {
    return SAMPLE_SCENARIOS[key] || null;
}
