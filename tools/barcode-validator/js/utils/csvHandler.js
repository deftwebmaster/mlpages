/**
 * CSV Handler
 * 
 * Handles CSV import/export operations.
 * No external dependencies - pure JavaScript CSV parsing.
 */

/**
 * Parse CSV file content
 * Extracts barcodes from CSV (assumes barcodes are in first column by default)
 * 
 * @param {string} fileContent - Raw CSV file content
 * @param {object} options - Parsing options
 * @param {number} options.columnIndex - Which column contains barcodes (0-based)
 * @param {boolean} options.hasHeader - Whether first row is header
 * @param {string} options.delimiter - CSV delimiter (auto-detect if null)
 * @returns {object} { barcodes: [], metadata: {} }
 */
export function parseCSV(fileContent, options = {}) {
  const {
    columnIndex = 0,
    hasHeader = true,
    delimiter = null
  } = options;

  if (!fileContent || typeof fileContent !== 'string') {
    throw new Error('Invalid CSV content');
  }

  // Detect delimiter if not specified
  const detectedDelimiter = delimiter || detectDelimiter(fileContent);

  // Split into lines
  const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    return { barcodes: [], metadata: { rows: 0, columns: 0 } };
  }

  // Parse lines
  const rows = lines.map(line => parseCSVLine(line, detectedDelimiter));

  // Skip header if specified
  const startIndex = hasHeader ? 1 : 0;
  const dataRows = rows.slice(startIndex);

  // Extract barcodes from specified column
  const barcodes = dataRows
    .map(row => row[columnIndex])
    .filter(barcode => barcode && barcode.trim().length > 0)
    .map(barcode => barcode.trim());

  // Build metadata
  const metadata = {
    rows: dataRows.length,
    columns: rows[0] ? rows[0].length : 0,
    delimiter: detectedDelimiter,
    hasHeader: hasHeader,
    columnIndex: columnIndex
  };

  return { barcodes, metadata };
}

/**
 * Parse a single CSV line
 * Handles quoted fields and escaped quotes
 */
function parseCSVLine(line, delimiter = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

/**
 * Detect CSV delimiter
 * Checks for comma, semicolon, tab, pipe
 */
function detectDelimiter(content) {
  const firstLine = content.split(/\r?\n/)[0];
  
  const delimiters = [',', ';', '\t', '|'];
  const counts = delimiters.map(delim => ({
    delimiter: delim,
    count: (firstLine.match(new RegExp(`\\${delim}`, 'g')) || []).length
  }));

  // Sort by count (descending)
  counts.sort((a, b) => b.count - a.count);

  // Return delimiter with highest count (default to comma)
  return counts[0].count > 0 ? counts[0].delimiter : ',';
}

/**
 * Export results to CSV
 * 
 * @param {array} results - Validation results
 * @param {object} options - Export options
 * @returns {string} CSV string
 */
export function exportToCSV(results, options = {}) {
  const {
    format = 'standard', // 'standard', 'wms', 'errors-only'
    includeIndex = true,
    includeBreakdown = false,
    wmsFormat = 'generic' // 'generic', 'oracle', 'manhattan'
  } = options;

  switch (format) {
    case 'wms':
      return exportWMSFormat(results, wmsFormat);
    case 'errors-only':
      return exportErrorsOnly(results, includeIndex);
    case 'standard':
    default:
      return exportStandardFormat(results, includeIndex, includeBreakdown);
  }
}

/**
 * Export standard format CSV
 */
function exportStandardFormat(results, includeIndex, includeBreakdown) {
  const headers = [];
  
  if (includeIndex) {
    headers.push('Index');
  }
  
  headers.push(
    'Barcode',
    'Symbology',
    'Valid',
    'Error',
    'Duplicate',
    'Duplicate_Count',
    'Warnings'
  );

  if (includeBreakdown) {
    headers.push('Structure_Breakdown');
  }

  const rows = [headers];

  results.forEach((result, idx) => {
    const row = [];

    if (includeIndex) {
      row.push(idx + 1);
    }

    row.push(
      escapeCSVField(result.code),
      result.symbology || '',
      result.valid ? 'Yes' : 'No',
      escapeCSVField(result.error || ''),
      result.duplicate ? 'Yes' : 'No',
      result.duplicate ? result.duplicateInfo.occurrences : '',
      result.warnings ? result.warnings.length : 0
    );

    if (includeBreakdown && result.breakdown) {
      const breakdownStr = Object.entries(result.breakdown)
        .map(([key, seg]) => `${seg.label}: ${seg.value}`)
        .join(' | ');
      row.push(escapeCSVField(breakdownStr));
    }

    rows.push(row);
  });

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Export WMS-ready format
 * Only includes valid barcodes in WMS upload format
 */
function exportWMSFormat(results, wmsFormat) {
  // Filter to valid only
  const validResults = results.filter(r => r.valid);

  let headers, rowBuilder;

  switch (wmsFormat) {
    case 'oracle':
      headers = ['Item_Number', 'Item_Barcode', 'Barcode_Type', 'Status'];
      rowBuilder = (r, idx) => [
        `ITEM_${idx + 1}`,
        escapeCSVField(r.code),
        r.symbology,
        'ACTIVE'
      ];
      break;

    case 'manhattan':
      headers = ['SKU', 'UPC', 'Location', 'Status'];
      rowBuilder = (r, idx) => [
        `SKU_${idx + 1}`,
        escapeCSVField(r.code),
        '',
        'VALID'
      ];
      break;

    case 'generic':
    default:
      headers = ['Barcode', 'Type', 'Valid'];
      rowBuilder = (r) => [
        escapeCSVField(r.code),
        r.symbology,
        'TRUE'
      ];
      break;
  }

  const rows = [headers];
  validResults.forEach((result, idx) => {
    rows.push(rowBuilder(result, idx));
  });

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Export errors only
 */
function exportErrorsOnly(results, includeIndex) {
  const invalidResults = results.filter(r => !r.valid);

  const headers = [];
  if (includeIndex) {
    headers.push('Original_Index');
  }
  headers.push('Barcode', 'Symbology', 'Error_Type', 'Error_Message', 'Suggested_Action');

  const rows = [headers];

  invalidResults.forEach(result => {
    const row = [];

    if (includeIndex) {
      row.push(result.index + 1);
    }

    row.push(
      escapeCSVField(result.code),
      result.symbology || 'Unknown',
      categorizeError(result.error),
      escapeCSVField(result.error || ''),
      escapeCSVField(getSuggestedAction(result.error))
    );

    rows.push(row);
  });

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Escape CSV field (handle quotes and commas)
 */
function escapeCSVField(field) {
  if (field === null || field === undefined) {
    return '';
  }

  const stringField = String(field);

  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }

  return stringField;
}

/**
 * Categorize error for export
 */
function categorizeError(error) {
  if (!error) return 'Unknown';

  const errorLower = error.toLowerCase();

  if (errorLower.includes('check digit')) return 'Check_Digit_Error';
  if (errorLower.includes('length')) return 'Length_Error';
  if (errorLower.includes('character')) return 'Character_Error';
  if (errorLower.includes('symbology')) return 'Symbology_Error';
  if (errorLower.includes('empty')) return 'Empty_Input';

  return 'Other_Error';
}

/**
 * Get suggested action for error
 */
function getSuggestedAction(error) {
  if (!error) return 'Review barcode';

  const errorLower = error.toLowerCase();

  if (errorLower.includes('check digit')) {
    return 'Verify source data or reprint label';
  }
  if (errorLower.includes('length')) {
    return 'Check symbology configuration';
  }
  if (errorLower.includes('character')) {
    return 'Clean master data - remove invalid characters';
  }
  if (errorLower.includes('symbology')) {
    return 'Verify expected barcode type';
  }

  return 'Manual review required';
}

/**
 * Read file as text
 * Helper for file upload
 * 
 * @param {File} file - File object from input
 * @returns {Promise<string>} File content as text
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Download CSV as file
 * Triggers browser download
 * 
 * @param {string} csvContent - CSV string
 * @param {string} filename - Desired filename
 */
export function downloadCSV(csvContent, filename = 'export.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Validate CSV structure
 * Checks if CSV appears valid before parsing
 * 
 * @param {string} content - CSV content
 * @returns {object} { valid: boolean, error: string|null, warnings: [] }
 */
export function validateCSVStructure(content) {
  const result = {
    valid: true,
    error: null,
    warnings: []
  };

  if (!content || content.trim().length === 0) {
    result.valid = false;
    result.error = 'CSV file is empty';
    return result;
  }

  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    result.valid = false;
    result.error = 'No valid rows found in CSV';
    return result;
  }

  if (lines.length === 1) {
    result.warnings.push('Only one row found - might be missing data');
  }

  // Check if all rows have similar column counts
  const delimiter = detectDelimiter(content);
  const columnCounts = lines.slice(0, 10).map(line => 
    line.split(delimiter).length
  );

  const uniqueCounts = [...new Set(columnCounts)];
  if (uniqueCounts.length > 2) {
    result.warnings.push('Inconsistent column counts detected - CSV might be malformed');
  }

  return result;
}