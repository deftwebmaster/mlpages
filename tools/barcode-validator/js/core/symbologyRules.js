/**
 * Symbology Rules & Definitions
 * 
 * Defines validation rules, structure, and metadata for supported barcode symbologies.
 * Used by barcodeValidator.js to determine validation logic.
 */

export const SYMBOLOGY_RULES = {
  'UPC-A': {
    name: 'UPC-A',
    length: 12,
    pattern: /^\d{12}$/,
    checksumType: 'mod10',
    weightPattern: [3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3], // 11 weights for first 11 digits
    structure: {
      prefix: { start: 0, end: 1, label: 'Number system' },
      manufacturer: { start: 1, end: 6, label: 'Manufacturer code' },
      product: { start: 6, end: 11, label: 'Product code' },
      checkDigit: { start: 11, end: 12, label: 'Check digit' }
    },
    commonUses: ['Retail products (US/Canada)', 'Point of sale scanning'],
    wmsNotes: 'Standard for consumer packaged goods. Well-supported across all WMS platforms.',
    quietZone: '9X (9 times the narrow bar width)',
    validPrefixes: ['0', '1', '6', '7', '8'] // Common number systems
  },

  'UPC-E': {
    name: 'UPC-E',
    length: 8,
    pattern: /^\d{8}$/,
    checksumType: 'mod10',
    weightPattern: [3, 1, 3, 1, 3, 1, 3], // 7 weights for first 7 digits
    structure: {
      prefix: { start: 0, end: 1, label: 'Number system' },
      compressed: { start: 1, end: 7, label: 'Compressed data' },
      checkDigit: { start: 7, end: 8, label: 'Check digit' }
    },
    commonUses: ['Small product packaging', 'Space-constrained labels'],
    wmsNotes: 'Some WMS systems struggle with UPC-E. Verify support before mass deployment.',
    quietZone: '9X minimum',
    validPrefixes: ['0', '1'], // UPC-E typically uses 0 or 1
    warnings: ['Not all scanners handle UPC-E reliably', 'Consider using UPC-A if space permits']
  },

  'EAN-13': {
    name: 'EAN-13',
    length: 13,
    pattern: /^\d{13}$/,
    checksumType: 'mod10',
    weightPattern: [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3], // 12 weights for first 12 digits
    structure: {
      prefix: { start: 0, end: 3, label: 'Country/GS1 prefix' },
      manufacturer: { start: 3, end: 8, label: 'Manufacturer code' },
      product: { start: 8, end: 12, label: 'Product code' },
      checkDigit: { start: 12, end: 13, label: 'Check digit' }
    },
    commonUses: ['International retail products', 'European markets'],
    wmsNotes: 'Global standard. Fully compatible with UPC-A systems.',
    quietZone: '11X minimum',
    commonPrefixes: {
      '00-13': 'USA & Canada',
      '20-29': 'Internal use',
      '30-37': 'France',
      '40-44': 'Germany',
      '45-49': 'Japan',
      '50': 'UK',
      '690-699': 'China'
    }
  },

  'EAN-8': {
    name: 'EAN-8',
    length: 8,
    pattern: /^\d{8}$/,
    checksumType: 'mod10',
    weightPattern: [3, 1, 3, 1, 3, 1, 3], // 7 weights for first 7 digits
    structure: {
      prefix: { start: 0, end: 3, label: 'Country prefix' },
      product: { start: 3, end: 7, label: 'Product code' },
      checkDigit: { start: 7, end: 8, label: 'Check digit' }
    },
    commonUses: ['Small products', 'Restricted space applications'],
    wmsNotes: 'Less common in warehouse operations. Verify scanner support.',
    quietZone: '7X minimum'
  },

  'CODE128': {
    name: 'Code 128',
    length: null, // Variable length
    pattern: /^[\x20-\x7F]+$/, // Printable ASCII (space through DEL)
    checksumType: 'mod103',
    weightPattern: null, // Uses position-based weighting
    structure: {
      // Code 128 structure is complex (start code, data, checksum, stop)
      // We'll do basic validation only
      full: { start: 0, end: null, label: 'Full code' }
    },
    commonUses: [
      'Warehouse location labels',
      'Serial numbers',
      'Internal SKUs',
      'Shipping labels',
      'GS1-128 (application identifiers)'
    ],
    wmsNotes: 'Most flexible symbology. Standard for internal warehouse labeling. Supports alphanumeric data.',
    quietZone: '10X minimum',
    minLength: 2,
    maxLength: 80, // Practical limit
    characterSet: 'Full ASCII (0-127)',
    warnings: [
      'Verify data encoding matches scanner configuration',
      'Some WMS require specific Code 128 subsets (A/B/C)'
    ]
  }
};

/**
 * Get symbology rule by type
 */
export function getSymbologyRule(type) {
  const rule = SYMBOLOGY_RULES[type];
  if (!rule) {
    throw new Error(`Unknown symbology type: ${type}`);
  }
  return rule;
}

/**
 * Detect symbology from barcode structure
 * Returns array of possible symbologies (ordered by likelihood)
 */
export function detectSymbology(code) {
  const candidates = [];

  // Numeric-only detection
  if (/^\d+$/.test(code)) {
    switch (code.length) {
      case 8:
        candidates.push('UPC-E', 'EAN-8');
        break;
      case 12:
        candidates.push('UPC-A');
        break;
      case 13:
        candidates.push('EAN-13');
        break;
      default:
        // Numeric Code 128 is possible but less common
        if (code.length >= 2 && code.length <= 80) {
          candidates.push('CODE128');
        }
    }
  } else {
    // Alphanumeric = Code 128
    if (SYMBOLOGY_RULES.CODE128.pattern.test(code) &&
        code.length >= SYMBOLOGY_RULES.CODE128.minLength &&
        code.length <= SYMBOLOGY_RULES.CODE128.maxLength) {
      candidates.push('CODE128');
    }
  }

  return candidates;
}

/**
 * Get expected symbology for common use cases
 */
export function getExpectedSymbologyForUseCase(useCase) {
  const useCaseMap = {
    'retail-product': ['UPC-A', 'EAN-13'],
    'warehouse-location': ['CODE128'],
    'internal-sku': ['CODE128'],
    'shipping-label': ['CODE128'],
    'small-product': ['UPC-E', 'EAN-8'],
    'international-product': ['EAN-13']
  };

  return useCaseMap[useCase] || [];
}

/**
 * Check if symbology is appropriate for use case
 */
export function validateSymbologyForUseCase(symbology, useCase) {
  const expected = getExpectedSymbologyForUseCase(useCase);
  
  if (expected.length === 0) {
    return { valid: true, warning: null };
  }

  if (!expected.includes(symbology)) {
    return {
      valid: false,
      warning: `${symbology} unusual for ${useCase}. Expected: ${expected.join(' or ')}`
    };
  }

  return { valid: true, warning: null };
}

/**
 * Get all supported symbologies
 */
export function getSupportedSymbologies() {
  return Object.keys(SYMBOLOGY_RULES);
}

/**
 * Check if a symbology requires check digit validation
 */
export function requiresCheckDigit(symbology) {
  const rule = SYMBOLOGY_RULES[symbology];
  return rule && rule.checksumType !== null;
}