/**
 * Checksum Calculation Functions
 * 
 * Implements checksum algorithms for barcode validation.
 * Returns both result and step-by-step explanation for learning mode.
 */

/**
 * Calculate MOD-10 checksum (used by UPC/EAN)
 * 
 * @param {string} digits - The barcode digits (excluding check digit)
 * @param {number[]} weightPattern - Alternating weight pattern (e.g., [3,1] or [1,3])
 * @param {boolean} includeSteps - Whether to include step-by-step calculation
 * @returns {object} { expected: number, steps: array }
 */
export function calculateMod10(digits, weightPattern, includeSteps = false) {
  const steps = [];
  let sum = 0;

  // Apply weights to each digit
  for (let i = 0; i < digits.length; i++) {
    const digit = parseInt(digits[i], 10);
    const weight = weightPattern[i % weightPattern.length];
    const product = digit * weight;
    sum += product;

    if (includeSteps) {
      steps.push({
        position: i + 1,
        digit: digit,
        weight: weight,
        product: product,
        runningSum: sum
      });
    }
  }

  // Calculate check digit
  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;

  if (includeSteps) {
    steps.push({
      operation: 'Final calculation',
      sum: sum,
      remainder: remainder,
      calculation: remainder === 0 ? '0' : `10 - ${remainder}`,
      checkDigit: checkDigit
    });
  }

  return {
    expected: checkDigit,
    sum: sum,
    steps: steps
  };
}

/**
 * Validate MOD-10 checksum for a complete barcode
 * 
 * @param {string} barcode - Full barcode including check digit
 * @param {number[]} weightPattern - Weight pattern to use
 * @param {boolean} includeSteps - Whether to include calculation steps
 * @returns {object} { valid: boolean, expected: number, actual: number, steps: array }
 */
export function validateMod10(barcode, weightPattern, includeSteps = false) {
  const dataDigits = barcode.slice(0, -1);
  const actualCheckDigit = parseInt(barcode.slice(-1), 10);

  const calculation = calculateMod10(dataDigits, weightPattern, includeSteps);

  return {
    valid: calculation.expected === actualCheckDigit,
    expected: calculation.expected,
    actual: actualCheckDigit,
    steps: calculation.steps
  };
}

/**
 * Calculate MOD-103 checksum (basic Code 128 validation)
 * 
 * Note: Full Code 128 validation requires decoding start/stop codes
 * and character set switching. This is a simplified structure check.
 * 
 * @param {string} code - The barcode data
 * @param {boolean} includeSteps - Whether to include calculation steps
 * @returns {object} { valid: boolean, notes: string }
 */
export function validateMod103(code, includeSteps = false) {
  const steps = [];

  // Basic structure validation for Code 128
  // We're doing simplified validation here since full Code 128 decoding
  // requires understanding start codes, character sets, and stop patterns
  
  if (includeSteps) {
    steps.push({
      check: 'Length validation',
      result: code.length >= 2 && code.length <= 80 ? 'PASS' : 'FAIL',
      detail: `Length: ${code.length} (valid range: 2-80)`
    });

    steps.push({
      check: 'Character set',
      result: /^[\x20-\x7F]+$/.test(code) ? 'PASS' : 'FAIL',
      detail: 'All characters must be printable ASCII'
    });

    // Check for illegal characters that commonly cause issues
    const illegalChars = code.match(/[^\x20-\x7F]/g);
    if (illegalChars) {
      steps.push({
        check: 'Illegal characters detected',
        result: 'FAIL',
        detail: `Found: ${[...new Set(illegalChars)].join(', ')}`
      });
    }
  }

  // For Code 128, we'll validate structure but note that full checksum
  // validation requires the actual encoded barcode data, not human-readable
  const valid = 
    code.length >= 2 && 
    code.length <= 80 && 
    /^[\x20-\x7F]+$/.test(code);

  return {
    valid: valid,
    notes: valid 
      ? 'Structure valid. Full checksum validation requires encoded barcode data.' 
      : 'Invalid structure for Code 128',
    steps: steps
  };
}

/**
 * Get human-readable explanation of checksum algorithm
 */
export function getChecksumExplanation(checksumType) {
  const explanations = {
    'mod10': {
      name: 'Modulo 10 (Luhn Algorithm)',
      description: 'Used by UPC and EAN barcodes',
      steps: [
        '1. Multiply each digit by its weight (alternating 3 and 1, or 1 and 3)',
        '2. Sum all the products',
        '3. Find the remainder when divided by 10',
        '4. Check digit = (10 - remainder) or 0 if remainder is 0'
      ],
      example: 'For UPC-A 03600029145[?], weights are [3,1,3,1,3,1,3,1,3,1,3]'
    },
    'mod103': {
      name: 'Modulo 103',
      description: 'Used by Code 128 barcodes',
      steps: [
        '1. Each character has a numeric value (0-102)',
        '2. Multiply each value by its position',
        '3. Sum all products',
        '4. Check character = sum MOD 103'
      ],
      note: 'Full validation requires access to encoded barcode data, not just human-readable text'
    }
  };

  return explanations[checksumType] || null;
}

/**
 * Format checksum steps for display
 * Converts calculation steps into human-readable format
 */
export function formatStepsForDisplay(steps) {
  if (!steps || steps.length === 0) {
    return 'No calculation steps available';
  }

  let formatted = '';

  steps.forEach((step, index) => {
    if (step.position) {
      // MOD-10 calculation step
      formatted += `Position ${step.position}: ${step.digit} × ${step.weight} = ${step.product} (sum: ${step.runningSum})\n`;
    } else if (step.operation) {
      // Final calculation
      formatted += `\n${step.operation}:\n`;
      formatted += `Sum: ${step.sum}\n`;
      formatted += `Remainder (sum % 10): ${step.remainder}\n`;
      formatted += `Check digit: ${step.calculation} = ${step.checkDigit}\n`;
    } else if (step.check) {
      // Code 128 validation step
      formatted += `${step.check}: ${step.result}\n`;
      if (step.detail) {
        formatted += `  ${step.detail}\n`;
      }
    }
  });

  return formatted;
}

/**
 * Validate checksum based on symbology type
 * Main entry point for checksum validation
 */
export function validateChecksum(barcode, symbology, includeSteps = false) {
  const symbologyUpper = symbology.toUpperCase().replace(/-/g, '');

  switch (symbologyUpper) {
    case 'UPCA':
      return validateMod10(barcode, [3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3], includeSteps);
    
    case 'UPCE':
      return validateMod10(barcode, [3, 1, 3, 1, 3, 1, 3], includeSteps);
    
    case 'EAN13':
      return validateMod10(barcode, [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3], includeSteps);
    
    case 'EAN8':
      return validateMod10(barcode, [3, 1, 3, 1, 3, 1, 3], includeSteps);
    
    case 'CODE128':
      return validateMod103(barcode, includeSteps);
    
    default:
      return {
        valid: false,
        error: `Checksum validation not implemented for ${symbology}`
      };
  }
}