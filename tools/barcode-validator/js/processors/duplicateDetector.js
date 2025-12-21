/**
 * Duplicate Detector
 * 
 * Identifies duplicate barcodes in a batch and assesses collision risk.
 * Critical for WMS operations where duplicate barcodes cause receiving/picking errors.
 */

/**
 * Detect duplicate barcodes in a list
 * 
 * @param {string[]} codes - Array of barcode strings
 * @returns {Map<string, number[]>} Map of code -> array of indices where it appears
 */
export function detectDuplicates(codes) {
  const occurrences = new Map();

  codes.forEach((code, index) => {
    const normalized = code.trim();
    
    if (!occurrences.has(normalized)) {
      occurrences.set(normalized, []);
    }
    
    occurrences.get(normalized).push(index);
  });

  // Filter to only duplicates (appears more than once)
  const duplicates = new Map();
  
  occurrences.forEach((indices, code) => {
    if (indices.length > 1) {
      duplicates.set(code, indices);
    }
  });

  return duplicates;
}

/**
 * Flag duplicates in validation results
 * Adds 'duplicate' and 'duplicateInfo' fields to each result
 * 
 * @param {array} results - Validation results from bulkProcessor
 * @returns {array} Results with duplicate flags added
 */
export function flagDuplicatesInResults(results) {
  // Extract codes
  const codes = results.map(r => r.code);
  
  // Detect duplicates
  const duplicates = detectDuplicates(codes);

  // Flag each result
  results.forEach(result => {
    const code = result.code;
    
    if (duplicates.has(code)) {
      result.duplicate = true;
      result.duplicateInfo = {
        occurrences: duplicates.get(code).length,
        indices: duplicates.get(code),
        risk: assessDuplicateRisk(code, duplicates.get(code).length, result.symbology)
      };
    } else {
      result.duplicate = false;
      result.duplicateInfo = null;
    }
  });

  return results;
}

/**
 * Assess risk level of duplicate barcode
 * 
 * @param {string} code - The barcode
 * @param {number} occurrences - Number of times it appears
 * @param {string} symbology - Barcode symbology
 * @returns {object} { level: string, message: string, wmsImpact: string }
 */
function assessDuplicateRisk(code, occurrences, symbology) {
  let level = 'medium';
  let message = `Barcode appears ${occurrences} times`;
  let wmsImpact = '';

  // High risk scenarios
  if (occurrences >= 10) {
    level = 'high';
    message = `Critical: ${occurrences} duplicates detected`;
    wmsImpact = 'Will cause receiving errors and inventory discrepancies';
  } else if (symbology === 'UPC-A' || symbology === 'EAN-13') {
    // Product barcodes should be unique per item
    level = 'high';
    message = `${occurrences} items with same ${symbology}`;
    wmsImpact = 'Multiple SKUs sharing same barcode will confuse WMS';
  } else if (symbology === 'CODE128' && code.match(/^LOC-/i)) {
    // Location barcodes MUST be unique
    level = 'critical';
    message = `Location barcode duplicated ${occurrences} times`;
    wmsImpact = 'CRITICAL: Duplicate location labels will break putaway/picking';
  } else if (occurrences >= 5) {
    level = 'high';
    message = `${occurrences} duplicates`;
    wmsImpact = 'High risk of scanning errors';
  } else {
    // Medium risk (2-4 occurrences)
    level = 'medium';
    wmsImpact = 'May cause scanning confusion';
  }

  return { level, message, wmsImpact };
}

/**
 * Get duplicate summary statistics
 * 
 * @param {array} results - Results with duplicate flags
 * @returns {object} Summary statistics
 */
export function getDuplicateSummary(results) {
  const duplicateResults = results.filter(r => r.duplicate);
  
  // Count unique duplicate codes
  const uniqueDuplicateCodes = new Set(
    duplicateResults.map(r => r.code)
  );

  // Risk distribution
  const riskDistribution = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  duplicateResults.forEach(r => {
    if (r.duplicateInfo && r.duplicateInfo.risk) {
      const level = r.duplicateInfo.risk.level;
      riskDistribution[level] = (riskDistribution[level] || 0) + 1;
    }
  });

  // Most duplicated code
  let mostDuplicated = null;
  let maxOccurrences = 0;

  uniqueDuplicateCodes.forEach(code => {
    const result = duplicateResults.find(r => r.code === code);
    const occurrences = result.duplicateInfo.occurrences;
    
    if (occurrences > maxOccurrences) {
      maxOccurrences = occurrences;
      mostDuplicated = {
        code,
        occurrences,
        risk: result.duplicateInfo.risk
      };
    }
  });

  return {
    totalDuplicateEntries: duplicateResults.length,
    uniqueDuplicateCodes: uniqueDuplicateCodes.size,
    riskDistribution,
    mostDuplicated,
    hasCriticalDuplicates: riskDistribution.critical > 0,
    hasHighRiskDuplicates: riskDistribution.high > 0
  };
}

/**
 * Get list of all duplicate codes with details
 * Useful for displaying in UI
 * 
 * @param {array} results - Results with duplicate flags
 * @returns {array} Array of duplicate code objects
 */
export function getDuplicateCodesList(results) {
  const duplicates = new Map();

  results.forEach(result => {
    if (result.duplicate) {
      const code = result.code;
      
      if (!duplicates.has(code)) {
        duplicates.set(code, {
          code,
          symbology: result.symbology,
          occurrences: result.duplicateInfo.occurrences,
          indices: result.duplicateInfo.indices,
          risk: result.duplicateInfo.risk,
          valid: result.valid
        });
      }
    }
  });

  // Convert to array and sort by risk then occurrences
  const list = Array.from(duplicates.values());
  
  list.sort((a, b) => {
    // Sort priority: critical > high > medium > low
    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const aRisk = riskOrder[a.risk.level] || 999;
    const bRisk = riskOrder[b.risk.level] || 999;
    
    if (aRisk !== bRisk) {
      return aRisk - bRisk;
    }
    
    // If same risk, sort by occurrences (descending)
    return b.occurrences - a.occurrences;
  });

  return list;
}

/**
 * Check if batch has location barcode duplicates
 * Location duplicates are critical errors
 * 
 * @param {array} results - Results with duplicate flags
 * @returns {boolean} True if location duplicates found
 */
export function hasLocationDuplicates(results) {
  return results.some(r => 
    r.duplicate && 
    r.symbology === 'CODE128' && 
    r.code.match(/^LOC-/i)
  );
}

/**
 * Get recommended actions for duplicates
 * 
 * @param {object} duplicateSummary - Summary from getDuplicateSummary
 * @returns {array} Array of recommended action strings
 */
export function getRecommendedActions(duplicateSummary) {
  const actions = [];

  if (duplicateSummary.hasCriticalDuplicates) {
    actions.push('🚨 CRITICAL: Review location label duplicates immediately');
    actions.push('Stop printing until duplicates are resolved');
  }

  if (duplicateSummary.hasHighRiskDuplicates) {
    actions.push('⚠️ HIGH RISK: Verify master data for duplicate UPC/EAN codes');
    actions.push('Check if multiple SKUs incorrectly share the same barcode');
  }

  if (duplicateSummary.uniqueDuplicateCodes > 0) {
    actions.push('Review duplicate barcodes before uploading to WMS');
    actions.push('Consider regenerating labels with unique identifiers');
  }

  if (duplicateSummary.mostDuplicated && duplicateSummary.mostDuplicated.occurrences >= 10) {
    actions.push(`Code "${duplicateSummary.mostDuplicated.code}" appears ${duplicateSummary.mostDuplicated.occurrences} times - investigate source`);
  }

  if (actions.length === 0) {
    actions.push('✓ No duplicates detected - safe to proceed');
  }

  return actions;
}

/**
 * Export duplicates to CSV format
 * 
 * @param {array} duplicatesList - List from getDuplicateCodesList
 * @returns {string} CSV string
 */
export function exportDuplicatesToCSV(duplicatesList) {
  const headers = ['Barcode', 'Symbology', 'Occurrences', 'Risk Level', 'WMS Impact'];
  const rows = [headers];

  duplicatesList.forEach(dup => {
    rows.push([
      dup.code,
      dup.symbology || 'Unknown',
      dup.occurrences,
      dup.risk.level.toUpperCase(),
      dup.risk.wmsImpact
    ]);
  });

  return rows.map(row => row.join(',')).join('\n');
}