/**
 * Export Formatter
 * 
 * Formats validation results for various WMS platforms
 * and export scenarios.
 */

/**
 * Format results for WMS upload
 * 
 * @param {array} results - Validation results
 * @param {string} wmsType - WMS platform ('oracle-fusion', 'manhattan', 'sap-ewm', 'generic')
 * @param {object} options - Formatting options
 * @returns {string} Formatted export string
 */
export function formatForWMS(results, wmsType, options = {}) {
  const {
    validOnly = true,
    includeHeader = true,
    fileFormat = 'csv' // 'csv', 'tsv', 'pipe'
  } = options;

  // Filter to valid only if specified
  const dataToExport = validOnly ? results.filter(r => r.valid) : results;

  if (dataToExport.length === 0) {
    return ''; // No valid results to export
  }

  const wmsFormat = WMS_FORMATS[wmsType] || WMS_FORMATS['generic'];
  const delimiter = getDelimiter(fileFormat);

  // Build header
  const rows = [];
  if (includeHeader) {
    rows.push(wmsFormat.columns.join(delimiter));
  }

  // Build data rows
  dataToExport.forEach((result, index) => {
    const row = wmsFormat.rowBuilder(result, index, dataToExport.length);
    rows.push(row.join(delimiter));
  });

  return rows.join('\n');
}

/**
 * Get delimiter for file format
 */
function getDelimiter(fileFormat) {
  switch (fileFormat) {
    case 'tsv':
      return '\t';
    case 'pipe':
      return '|';
    case 'csv':
    default:
      return ',';
  }
}

/**
 * WMS format definitions
 */
export const WMS_FORMATS = {
  'oracle-fusion': {
    name: 'Oracle Fusion Cloud WMS',
    columns: ['Item_Number', 'Item_Barcode', 'Barcode_Type', 'Primary_Flag', 'Status'],
    rowBuilder: (result, index) => [
      `ITEM${String(index + 1).padStart(6, '0')}`, // Item_Number
      escapeField(result.code),                     // Item_Barcode
      mapSymbologyToOracle(result.symbology),      // Barcode_Type
      index === 0 ? 'Y' : 'N',                     // Primary_Flag (first is primary)
      'ACTIVE'                                      // Status
    ],
    notes: 'Oracle Fusion expects specific barcode type codes. Upload via Item Import template.'
  },

  'manhattan': {
    name: 'Manhattan WMS (SCALE/Active)',
    columns: ['SKU', 'UPC', 'Location', 'Status', 'Qty_On_Hand'],
    rowBuilder: (result, index) => [
      `SKU${String(index + 1).padStart(8, '0')}`, // SKU
      escapeField(result.code),                    // UPC
      '',                                          // Location (empty for item master)
      'VALID',                                     // Status
      '0'                                          // Qty_On_Hand
    ],
    notes: 'Manhattan format for item master UPC upload. Adjust SKU prefix as needed.'
  },

  'sap-ewm': {
    name: 'SAP Extended Warehouse Management',
    columns: ['Material', 'EAN', 'Barcode_Type', 'Valid_From', 'Valid_To'],
    rowBuilder: (result, index) => [
      `MAT${String(index + 1).padStart(10, '0')}`, // Material
      escapeField(result.code),                     // EAN
      mapSymbologyToSAP(result.symbology),         // Barcode_Type
      getCurrentDate(),                             // Valid_From
      '99991231'                                    // Valid_To (far future)
    ],
    notes: 'SAP EWM barcode master format. Date format: YYYYMMDD'
  },

  'generic': {
    name: 'Generic WMS Format',
    columns: ['Barcode', 'Type', 'Valid', 'Index'],
    rowBuilder: (result, index) => [
      escapeField(result.code),
      result.symbology || 'UNKNOWN',
      'TRUE',
      index + 1
    ],
    notes: 'Simple generic format. Customize for your WMS.'
  }
};

/**
 * Map symbology to Oracle Fusion barcode type codes
 */
function mapSymbologyToOracle(symbology) {
  const mapping = {
    'UPC-A': 'UPC_A',
    'UPC-E': 'UPC_E',
    'EAN-13': 'EAN_13',
    'EAN-8': 'EAN_8',
    'CODE128': 'CODE_128'
  };
  return mapping[symbology] || 'CODE_128';
}

/**
 * Map symbology to SAP barcode type
 */
function mapSymbologyToSAP(symbology) {
  const mapping = {
    'UPC-A': 'UC',
    'UPC-E': 'UC',
    'EAN-13': 'E3',
    'EAN-8': 'E8',
    'CODE128': 'C1'
  };
  return mapping[symbology] || 'C1';
}

/**
 * Get current date in YYYYMMDD format
 */
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Escape field for CSV/TSV
 */
function escapeField(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);
  
  // If contains delimiter characters, wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\t')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Get available WMS formats
 * 
 * @returns {array} Array of { id: string, name: string, notes: string }
 */
export function getAvailableWMSFormats() {
  return Object.entries(WMS_FORMATS).map(([id, format]) => ({
    id,
    name: format.name,
    notes: format.notes
  }));
}

/**
 * Create location barcode upload format
 * Special format for warehouse location labels
 * 
 * @param {array} results - Validation results (should be Code 128 location codes)
 * @param {object} options - Options
 * @returns {string} Formatted CSV
 */
export function formatLocationBarcodes(results, options = {}) {
  const {
    warehouseId = 'WH01',
    zonePrefix = 'ZONE-',
    includeCoordinates = false
  } = options;

  const validLocations = results.filter(r => 
    r.valid && r.symbology === 'CODE128'
  );

  const headers = ['Location_ID', 'Barcode', 'Warehouse', 'Zone', 'Status'];
  if (includeCoordinates) {
    headers.push('Aisle', 'Bay', 'Level');
  }

  const rows = [headers];

  validLocations.forEach((result, index) => {
    const locationId = result.code;
    const row = [
      escapeField(locationId),
      escapeField(locationId),
      warehouseId,
      zonePrefix + (index % 10), // Simple zone assignment
      'ACTIVE'
    ];

    if (includeCoordinates) {
      // Extract coordinates if format is like "LOC-A01-02-03"
      const parts = locationId.split('-');
      row.push(
        parts[1] || '',  // Aisle
        parts[2] || '',  // Bay
        parts[3] || ''   // Level
      );
    }

    rows.push(row);
  });

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Create barcode label print file
 * Generates ZPL (Zebra) or similar format for direct printing
 * 
 * @param {array} results - Validation results
 * @param {string} printerFormat - 'zpl', 'epl', 'csv-for-print'
 * @returns {string} Print file content
 */
export function formatForPrinting(results, printerFormat = 'csv-for-print') {
  const validResults = results.filter(r => r.valid);

  if (printerFormat === 'zpl') {
    return formatAsZPL(validResults);
  } else if (printerFormat === 'epl') {
    return formatAsEPL(validResults);
  } else {
    // CSV format for label printing software
    return formatAsCSVForPrint(validResults);
  }
}

/**
 * Format as ZPL (Zebra Programming Language)
 * Basic template - customize for specific label sizes
 */
function formatAsZPL(results) {
  let zpl = '';

  results.forEach(result => {
    zpl += `^XA\n`; // Start label
    zpl += `^FO50,50\n`; // Field origin
    zpl += `^BY2,3,100\n`; // Barcode parameters (width, ratio, height)
    
    // Barcode type
    if (result.symbology === 'CODE128') {
      zpl += `^BCN,100,Y,N,N\n`; // Code 128
    } else if (result.symbology === 'UPC-A') {
      zpl += `^BUN,100,Y,N,N\n`; // UPC-A
    } else if (result.symbology === 'EAN-13') {
      zpl += `^BEN,100,Y,N\n`; // EAN-13
    }
    
    zpl += `^FD${result.code}^FS\n`; // Field data
    zpl += `^XZ\n`; // End label
  });

  return zpl;
}

/**
 * Format as EPL (Eltron Programming Language)
 */
function formatAsEPL(results) {
  let epl = '';

  results.forEach(result => {
    epl += `N\n`; // Clear buffer
    epl += `q400\n`; // Set label width
    epl += `Q200,25\n`; // Set label height
    epl += `B50,50,0,3,2,5,100,N,"${result.code}"\n`; // Barcode
    epl += `P1\n`; // Print
  });

  return epl;
}

/**
 * Format as CSV for label printing software
 */
function formatAsCSVForPrint(results) {
  const headers = ['Barcode', 'Type', 'Human_Readable'];
  const rows = [headers];

  results.forEach(result => {
    rows.push([
      escapeField(result.code),
      result.symbology,
      escapeField(result.code) // Duplicate for human-readable line
    ]);
  });

  return rows.map(row => row.join(',')).join('\n');
}