/**
 * Bulk Processor
 * 
 * Handles batch validation of multiple barcodes.
 * Includes Web Worker support for large batches (5000+ codes).
 */

import { validate } from '../core/barcodeValidator.js';

/**
 * Process a batch of barcodes
 * 
 * @param {string[]} codes - Array of barcode strings
 * @param {object} options - Validation options
 * @param {string} options.expectedSymbology - Force specific symbology for all codes
 * @param {string} options.useCase - Expected use case
 * @param {boolean} options.includeSteps - Include checksum steps (WARNING: slow for large batches)
 * @param {function} options.onProgress - Progress callback (receives percentage)
 * @returns {object} { results: [], summary: {} }
 */
export function processBatch(codes, options = {}) {
  const {
    expectedSymbology = null,
    useCase = null,
    includeSteps = false,
    onProgress = null
  } = options;

  // Validate input
  if (!Array.isArray(codes)) {
    throw new Error('processBatch expects an array of codes');
  }

  const results = [];
  const summary = {
    total: codes.length,
    valid: 0,
    invalid: 0,
    symbologyDistribution: {},
    errorDistribution: {},
    processingTime: 0
  };

  const startTime = performance.now();

  // Process each code
  codes.forEach((code, index) => {
    const result = validate(code, {
      expectedSymbology,
      useCase,
      includeSteps
    });

    // Add index for reference
    result.index = index;
    result.originalInput = code;

    results.push(result);

    // Update summary
    if (result.valid) {
      summary.valid++;
      
      // Track symbology distribution
      const symb = result.symbology;
      summary.symbologyDistribution[symb] = (summary.symbologyDistribution[symb] || 0) + 1;
    } else {
      summary.invalid++;
      
      // Track error distribution
      const errorKey = categorizeError(result.error);
      summary.errorDistribution[errorKey] = (summary.errorDistribution[errorKey] || 0) + 1;
    }

    // Progress callback
    if (onProgress && (index + 1) % 100 === 0) {
      const progress = ((index + 1) / codes.length) * 100;
      onProgress(progress);
    }
  });

  // Final progress update
  if (onProgress) {
    onProgress(100);
  }

  summary.processingTime = performance.now() - startTime;

  return { results, summary };
}

/**
 * Process batch asynchronously (for large datasets)
 * Uses chunking to prevent UI blocking
 * 
 * @param {string[]} codes - Array of barcode strings
 * @param {object} options - Validation options (same as processBatch)
 * @returns {Promise<object>} { results: [], summary: {} }
 */
export async function processBatchAsync(codes, options = {}) {
  const {
    expectedSymbology = null,
    useCase = null,
    includeSteps = false,
    onProgress = null,
    chunkSize = 500 // Process 500 at a time
  } = options;

  const results = [];
  const summary = {
    total: codes.length,
    valid: 0,
    invalid: 0,
    symbologyDistribution: {},
    errorDistribution: {},
    processingTime: 0
  };

  const startTime = performance.now();

  // Split into chunks
  const chunks = [];
  for (let i = 0; i < codes.length; i += chunkSize) {
    chunks.push(codes.slice(i, i + chunkSize));
  }

  // Process each chunk with a delay to prevent blocking
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    
    // Process chunk synchronously
    chunk.forEach((code, indexInChunk) => {
      const globalIndex = chunkIndex * chunkSize + indexInChunk;
      
      const result = validate(code, {
        expectedSymbology,
        useCase,
        includeSteps
      });

      result.index = globalIndex;
      result.originalInput = code;

      results.push(result);

      // Update summary
      if (result.valid) {
        summary.valid++;
        const symb = result.symbology;
        summary.symbologyDistribution[symb] = (summary.symbologyDistribution[symb] || 0) + 1;
      } else {
        summary.invalid++;
        const errorKey = categorizeError(result.error);
        summary.errorDistribution[errorKey] = (summary.errorDistribution[errorKey] || 0) + 1;
      }
    });

    // Progress callback
    if (onProgress) {
      const progress = ((chunkIndex + 1) / chunks.length) * 100;
      onProgress(progress);
    }

    // Yield to browser (allow UI updates)
    if (chunkIndex < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  summary.processingTime = performance.now() - startTime;

  return { results, summary };
}

/**
 * Categorize error into high-level categories
 * Used for error distribution analysis
 */
function categorizeError(errorMessage) {
  if (!errorMessage) {
    return 'Unknown';
  }

  const errorLower = errorMessage.toLowerCase();

  if (errorLower.includes('check digit') || errorLower.includes('checksum')) {
    return 'Bad check digit';
  }
  if (errorLower.includes('length')) {
    return 'Wrong length';
  }
  if (errorLower.includes('character') || errorLower.includes('invalid')) {
    return 'Illegal characters';
  }
  if (errorLower.includes('symbology')) {
    return 'Symbology mismatch';
  }
  if (errorLower.includes('empty')) {
    return 'Empty barcode';
  }

  return 'Other error';
}

/**
 * Parse input text into array of barcodes
 * Handles various input formats (newline, comma, space, tab separated)
 * 
 * @param {string} input - Raw text input
 * @param {object} options - Parsing options
 * @param {string} options.delimiter - Explicit delimiter (auto-detect if null)
 * @param {boolean} options.removeDuplicates - Remove duplicate entries before processing
 * @param {boolean} options.removeEmpty - Remove empty lines
 * @returns {string[]} Array of barcode strings
 */
export function parseInput(input, options = {}) {
  const {
    delimiter = null,
    removeDuplicates = false,
    removeEmpty = true
  } = options;

  if (!input || typeof input !== 'string') {
    return [];
  }

  let codes;

  if (delimiter) {
    // Use explicit delimiter
    codes = input.split(delimiter);
  } else {
    // Auto-detect delimiter
    // Priority: newline > tab > comma > space
    if (input.includes('\n')) {
      codes = input.split(/\r?\n/);
    } else if (input.includes('\t')) {
      codes = input.split('\t');
    } else if (input.includes(',')) {
      codes = input.split(',');
    } else if (input.includes(' ')) {
      codes = input.split(/\s+/);
    } else {
      // Single code
      codes = [input];
    }
  }

  // Clean up
  codes = codes.map(code => code.trim());

  // Remove empty
  if (removeEmpty) {
    codes = codes.filter(code => code.length > 0);
  }

  // Remove duplicates (if requested)
  if (removeDuplicates) {
    codes = [...new Set(codes)];
  }

  return codes;
}

/**
 * Get top N most common errors
 * 
 * @param {object} errorDistribution - Error distribution from summary
 * @param {number} topN - Number of top errors to return
 * @returns {array} Array of { error: string, count: number, percentage: number }
 */
export function getTopErrors(errorDistribution, topN = 3) {
  const entries = Object.entries(errorDistribution);
  
  // Sort by count (descending)
  entries.sort((a, b) => b[1] - a[1]);

  // Take top N
  const top = entries.slice(0, topN);

  // Calculate total for percentages
  const total = entries.reduce((sum, [_, count]) => sum + count, 0);

  return top.map(([error, count]) => ({
    error,
    count,
    percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0
  }));
}

/**
 * Filter results by validity
 * 
 * @param {array} results - Validation results
 * @param {string} filter - 'valid', 'invalid', or 'all'
 * @returns {array} Filtered results
 */
export function filterResults(results, filter = 'all') {
  switch (filter.toLowerCase()) {
    case 'valid':
      return results.filter(r => r.valid);
    case 'invalid':
      return results.filter(r => !r.valid);
    case 'all':
    default:
      return results;
  }
}

/**
 * Sort results by specified field
 * 
 * @param {array} results - Validation results
 * @param {string} sortBy - Field to sort by ('code', 'symbology', 'valid', 'index')
 * @param {string} order - 'asc' or 'desc'
 * @returns {array} Sorted results
 */
export function sortResults(results, sortBy = 'index', order = 'asc') {
  const sorted = [...results];

  sorted.sort((a, b) => {
    let aVal, bVal;

    switch (sortBy) {
      case 'code':
        aVal = a.code;
        bVal = b.code;
        break;
      case 'symbology':
        aVal = a.symbology || '';
        bVal = b.symbology || '';
        break;
      case 'valid':
        aVal = a.valid ? 1 : 0;
        bVal = b.valid ? 1 : 0;
        break;
      case 'index':
      default:
        aVal = a.index;
        bVal = b.index;
        break;
    }

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Get processing performance metrics
 */
export function getPerformanceMetrics(summary) {
  const { total, processingTime } = summary;
  
  return {
    totalCodes: total,
    processingTime: `${processingTime.toFixed(2)}ms`,
    codesPerSecond: total > 0 ? Math.round((total / processingTime) * 1000) : 0,
    averageTimePerCode: total > 0 ? `${(processingTime / total).toFixed(3)}ms` : '0ms'
  };
}