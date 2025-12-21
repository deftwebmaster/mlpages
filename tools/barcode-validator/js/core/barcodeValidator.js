/**
 * Barcode Validator
 * 
 * Main validation engine. Coordinates symbology detection,
 * structure validation, and checksum verification.
 */

import { SYMBOLOGY_RULES, detectSymbology, getSymbologyRule, validateSymbologyForUseCase } from './symbologyRules.js';
import { validateChecksum, formatStepsForDisplay } from './checksumCalculator.js';

/**
 * Validate a barcode
 * 
 * @param {string} code - The barcode to validate
 * @param {object} options - Validation options
 * @param {string} options.expectedSymbology - Force specific symbology (optional)
 * @param {boolean} options.includeSteps - Include checksum calculation steps
 * @param {string} options.useCase - Expected use case for symbology matching
 * @returns {object} Validation result
 */
export function validate(code, options = {}) {
  const {
    expectedSymbology = null,
    includeSteps = false,
    useCase = null
  } = options;

  // Initialize result object
  const result = {
    code: code,
    valid: false,
    symbology: null,
    breakdown: null,
    error: null,
    warnings: [],
    checksumDetails: null
  };

  // Basic input validation
  if (!code || typeof code !== 'string') {
    result.error = 'Invalid input: code must be a non-empty string';
    return result;
  }

  // Trim whitespace
  code = code.trim();
  result.code = code;

  if (code.length === 0) {
    result.error = 'Empty barcode';
    return result;
  }

  // Determine symbology
  let symbologyToValidate;
  
  if (expectedSymbology) {
    // User specified symbology
    symbologyToValidate = expectedSymbology;
    
    // Verify it's supported
    if (!SYMBOLOGY_RULES[symbologyToValidate]) {
      result.error = `Unsupported symbology: ${expectedSymbology}`;
      return result;
    }
  } else {
    // Auto-detect symbology
    const candidates = detectSymbology(code);
    
    if (candidates.length === 0) {
      result.error = 'Unable to detect symbology (no matching patterns)';
      return result;
    }
    
    // Use first candidate (most likely)
    symbologyToValidate = candidates[0];
    
    // Add warning if multiple candidates
    if (candidates.length > 1) {
      result.warnings.push(
        `Multiple symbologies possible: ${candidates.join(', ')}. Using ${symbologyToValidate}.`
      );
    }
  }

  result.symbology = symbologyToValidate;
  const rule = getSymbologyRule(symbologyToValidate);

  // Validate length (if fixed-length symbology)
  if (rule.length !== null && code.length !== rule.length) {
    result.error = `Invalid length for ${symbologyToValidate}: expected ${rule.length}, got ${code.length}`;
    return result;
  }

  // Validate pattern (character set)
  if (!rule.pattern.test(code)) {
    result.error = `Invalid characters for ${symbologyToValidate}`;
    
    // Provide more detail for common issues
    if (symbologyToValidate === 'CODE128') {
      const invalidChars = code.match(/[^\x20-\x7F]/g);
      if (invalidChars) {
        result.error += `. Contains non-ASCII characters: ${[...new Set(invalidChars)].join(', ')}`;
      }
    } else {
      const invalidChars = code.match(/\D/g);
      if (invalidChars) {
        result.error += `. Contains non-numeric characters: ${[...new Set(invalidChars)].join(', ')}`;
      }
    }
    
    return result;
  }

  // Validate length range for variable-length symbologies
  if (symbologyToValidate === 'CODE128') {
    if (code.length < rule.minLength) {
      result.error = `Code 128 too short: minimum ${rule.minLength} characters, got ${code.length}`;
      return result;
    }
    if (code.length > rule.maxLength) {
      result.error = `Code 128 too long: maximum ${rule.maxLength} characters, got ${code.length}`;
      return result;
    }
  }

  // Validate checksum
  const checksumResult = validateChecksum(code, symbologyToValidate, includeSteps);
  
  if (!checksumResult.valid) {
    if (symbologyToValidate === 'CODE128') {
      // Code 128 structure check failed
      result.error = checksumResult.notes || 'Code 128 structure validation failed';
      result.checksumDetails = checksumResult;
    } else {
      // Check digit mismatch
      result.error = `Invalid check digit: expected ${checksumResult.expected}, got ${checksumResult.actual}`;
      result.checksumDetails = checksumResult;
    }
    return result;
  }

  // Success! Build breakdown
  result.valid = true;
  result.breakdown = buildBreakdown(code, rule);
  result.checksumDetails = checksumResult;

  // Add symbology-specific warnings
  if (rule.warnings) {
    result.warnings.push(...rule.warnings);
  }

  // Validate use case appropriateness
  if (useCase) {
    const useCaseValidation = validateSymbologyForUseCase(symbologyToValidate, useCase);
    if (!useCaseValidation.valid) {
      result.warnings.push(useCaseValidation.warning);
    }
  }

  return result;
}

/**
 * Build human-readable breakdown of barcode structure
 */
function buildBreakdown(code, rule) {
  const breakdown = {};

  Object.entries(rule.structure).forEach(([key, segment]) => {
    const value = segment.end !== null 
      ? code.slice(segment.start, segment.end)
      : code; // For CODE128 full code
    
    breakdown[key] = {
      label: segment.label,
      value: value,
      position: segment.end !== null ? `${segment.start + 1}-${segment.end}` : 'full'
    };
  });

  return breakdown;
}

/**
 * Batch validate multiple barcodes
 * Convenience function for validating arrays
 */
export function validateBatch(codes, options = {}) {
  if (!Array.isArray(codes)) {
    throw new Error('validateBatch expects an array of codes');
  }

  return codes.map(code => validate(code, options));
}

/**
 * Get validation summary for a code
 * Returns simplified pass/fail + primary error
 */
export function getValidationSummary(code, options = {}) {
  const result = validate(code, options);
  
  return {
    code: result.code,
    valid: result.valid,
    symbology: result.symbology,
    primaryError: result.error,
    warningCount: result.warnings.length
  };
}

/**
 * Quick validation check (boolean only)
 */
export function isValid(code, options = {}) {
  return validate(code, options).valid;
}

/**
 * Export breakdown as formatted text
 */
export function formatBreakdown(breakdown) {
  if (!breakdown) {
    return 'No breakdown available';
  }

  let formatted = '';
  Object.entries(breakdown).forEach(([key, segment]) => {
    formatted += `${segment.label}: ${segment.value} (position ${segment.position})\n`;
  });
  
  return formatted.trim();
}

/**
 * Export checksum details as formatted text
 */
export function formatChecksumDetails(checksumDetails) {
  if (!checksumDetails) {
    return 'No checksum details available';
  }

  if (checksumDetails.steps && checksumDetails.steps.length > 0) {
    return formatStepsForDisplay(checksumDetails.steps);
  }

  if (checksumDetails.expected !== undefined) {
    return `Expected: ${checksumDetails.expected}, Actual: ${checksumDetails.actual}`;
  }

  return checksumDetails.notes || 'Checksum validation complete';
}