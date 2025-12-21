/**
 * Error Classifier
 * 
 * Maps technical validation errors to human-readable messages
 * with ops-friendly suggestions.
 */

/**
 * Classify validation error
 * 
 * @param {object} result - Validation result
 * @returns {object} { reason: string, category: string, suggestion: string, severity: string }
 */
export function classifyError(result) {
  if (result.valid) {
    return {
      reason: 'Valid',
      category: 'success',
      suggestion: null,
      severity: 'none'
    };
  }

  const error = result.error || 'Unknown error';
  const errorLower = error.toLowerCase();

  // Check digit errors
  if (errorLower.includes('check digit') || errorLower.includes('checksum')) {
    return {
      reason: 'Bad check digit',
      category: 'checksum_error',
      suggestion: 'Verify source data or reprint label. Check digit mismatch indicates data corruption.',
      severity: 'high',
      technicalDetail: error,
      wmsImpact: 'WMS will reject during receiving/putaway',
      commonCauses: [
        'Typo in master data',
        'Damaged/smudged barcode label',
        'Incorrect manual entry',
        'Data corruption during transfer'
      ]
    };
  }

  // Length errors
  if (errorLower.includes('length')) {
    return {
      reason: 'Wrong length',
      category: 'length_error',
      suggestion: 'Check symbology configuration. Verify this is the correct barcode type.',
      severity: 'high',
      technicalDetail: error,
      wmsImpact: 'Scanner may reject or misread',
      commonCauses: [
        'Wrong symbology selected',
        'Missing/extra digits in source data',
        'Truncated barcode',
        'Mixed barcode formats'
      ]
    };
  }

  // Character errors
  if (errorLower.includes('character') || errorLower.includes('invalid')) {
    const isNumericError = errorLower.includes('non-numeric');
    
    return {
      reason: 'Illegal characters',
      category: 'character_error',
      suggestion: isNumericError 
        ? 'Remove letters/symbols. UPC/EAN barcodes must be numeric only.'
        : 'Clean master data. Remove unprintable or special characters.',
      severity: 'high',
      technicalDetail: error,
      wmsImpact: 'Scanner will fail to read',
      commonCauses: [
        'Special characters in source data',
        'Copy/paste errors',
        'Encoding issues',
        'Non-ASCII characters'
      ]
    };
  }

  // Symbology errors
  if (errorLower.includes('symbology') || errorLower.includes('detect')) {
    return {
      reason: 'Symbology issue',
      category: 'symbology_error',
      suggestion: 'Verify barcode type matches use case. Check scanner configuration.',
      severity: 'medium',
      technicalDetail: error,
      wmsImpact: 'May scan incorrectly or not at all',
      commonCauses: [
        'Wrong barcode type for application',
        'Scanner not configured for this symbology',
        'Ambiguous barcode format'
      ]
    };
  }

  // Empty/missing
  if (errorLower.includes('empty') || errorLower.includes('missing')) {
    return {
      reason: 'Empty barcode',
      category: 'empty_error',
      suggestion: 'Ensure all required fields have barcodes.',
      severity: 'low',
      technicalDetail: error,
      wmsImpact: 'Record will be skipped during import',
      commonCauses: [
        'Missing data in source file',
        'Empty cells in spreadsheet',
        'Blank label printed'
      ]
    };
  }

  // Structure errors (Code 128)
  if (errorLower.includes('structure')) {
    return {
      reason: 'Invalid structure',
      category: 'structure_error',
      suggestion: 'Verify Code 128 encoding. Check for start/stop codes.',
      severity: 'medium',
      technicalDetail: error,
      wmsImpact: 'Scanner may reject',
      commonCauses: [
        'Incorrect encoding',
        'Missing start/stop pattern',
        'Character set switching error'
      ]
    };
  }

  // Default/unknown
  return {
    reason: 'Validation failed',
    category: 'unknown_error',
    suggestion: 'Manual review required. Check barcode against original source.',
    severity: 'medium',
    technicalDetail: error,
    wmsImpact: 'Unknown - verify before use',
    commonCauses: ['See technical detail']
  };
}

/**
 * Get WMS-specific fix suggestions
 * 
 * @param {object} result - Validation result
 * @param {string} wmsSystem - WMS type ('oracle', 'manhattan', 'sap', 'generic')
 * @returns {array} Array of fix suggestions
 */
export function getWMSFixSuggestions(result, wmsSystem = 'generic') {
  const classification = classifyError(result);
  const suggestions = [];

  switch (classification.category) {
    case 'checksum_error':
      suggestions.push('🔍 Verify in master data system');
      suggestions.push('🖨️ Reprint label if physical damage suspected');
      
      if (wmsSystem === 'oracle') {
        suggestions.push('Check Oracle Item Master UPC field');
      } else if (wmsSystem === 'manhattan') {
        suggestions.push('Verify SKU master in Manhattan');
      }
      break;

    case 'length_error':
      suggestions.push('⚙️ Check symbology configuration on RF devices');
      suggestions.push('📋 Verify barcode type matches item category');
      
      if (wmsSystem === 'oracle') {
        suggestions.push('Review Oracle barcode type settings');
      }
      break;

    case 'character_error':
      suggestions.push('🧹 Clean source data in ERP/master data');
      suggestions.push('🔤 Check for invisible characters or encoding issues');
      suggestions.push('💾 Re-export from source system');
      break;

    case 'symbology_error':
      suggestions.push('📱 Verify scanner profile settings');
      suggestions.push('🏷️ Confirm expected barcode type for this item class');
      break;

    case 'empty_error':
      suggestions.push('✏️ Populate missing barcode field in source');
      suggestions.push('🔄 Re-export data after fixing');
      break;
  }

  return suggestions;
}

/**
 * Get bulk fix recommendations
 * Analyzes entire batch for patterns
 * 
 * @param {array} results - All validation results
 * @returns {object} { patterns: [], recommendations: [] }
 */
export function getBulkFixRecommendations(results) {
  const invalidResults = results.filter(r => !r.valid);
  
  if (invalidResults.length === 0) {
    return {
      patterns: [],
      recommendations: ['✅ No errors detected - batch is clean']
    };
  }

  const patterns = [];
  const recommendations = [];

  // Analyze error patterns
  const errorsByCategory = {};
  invalidResults.forEach(result => {
    const classification = classifyError(result);
    const cat = classification.category;
    
    if (!errorsByCategory[cat]) {
      errorsByCategory[cat] = {
        count: 0,
        examples: []
      };
    }
    
    errorsByCategory[cat].count++;
    
    if (errorsByCategory[cat].examples.length < 3) {
      errorsByCategory[cat].examples.push(result.code);
    }
  });

  // Check digit errors pattern
  if (errorsByCategory['checksum_error']) {
    const count = errorsByCategory['checksum_error'].count;
    const percent = ((count / invalidResults.length) * 100).toFixed(0);
    
    patterns.push({
      type: 'Check digit errors',
      count: count,
      percentage: percent,
      severity: 'high'
    });

    if (count === invalidResults.length) {
      recommendations.push('🚨 ALL errors are check digit failures - likely systematic data corruption');
      recommendations.push('→ Verify source data export process');
      recommendations.push('→ Check if barcodes were manually modified');
    } else if (percent > 50) {
      recommendations.push('⚠️ Majority are check digit errors - investigate data source');
    }
  }

  // Length errors pattern
  if (errorsByCategory['length_error']) {
    const count = errorsByCategory['length_error'].count;
    
    patterns.push({
      type: 'Length errors',
      count: count,
      percentage: ((count / invalidResults.length) * 100).toFixed(0),
      severity: 'high'
    });

    if (count > 5) {
      recommendations.push('📏 Multiple length errors detected');
      recommendations.push('→ Verify symbology type matches data format');
      recommendations.push('→ Check if wrong barcode type was selected');
    }
  }

  // Character errors pattern
  if (errorsByCategory['character_error']) {
    const count = errorsByCategory['character_error'].count;
    
    patterns.push({
      type: 'Character errors',
      count: count,
      percentage: ((count / invalidResults.length) * 100).toFixed(0),
      severity: 'high'
    });

    recommendations.push('🔤 Invalid characters detected');
    recommendations.push('→ Clean master data before re-export');
    recommendations.push('→ Check for copy/paste encoding issues');
  }

  // Symbology pattern check
  const symbologies = {};
  invalidResults.forEach(r => {
    if (r.symbology) {
      symbologies[r.symbology] = (symbologies[r.symbology] || 0) + 1;
    }
  });

  if (Object.keys(symbologies).length === 1) {
    const symbology = Object.keys(symbologies)[0];
    patterns.push({
      type: `All errors are ${symbology}`,
      count: invalidResults.length,
      severity: 'medium'
    });
    
    recommendations.push(`🏷️ All invalid codes are ${symbology} type`);
    recommendations.push(`→ Review ${symbology} specific configuration`);
  }

  // High error rate warning
  const errorRate = (invalidResults.length / results.length) * 100;
  if (errorRate > 30) {
    recommendations.unshift('🚨 ERROR RATE EXCEEDS 30% - DO NOT UPLOAD TO WMS');
    recommendations.push('→ Perform comprehensive data cleanup before proceeding');
  } else if (errorRate > 10) {
    recommendations.unshift('⚠️ Error rate above 10% - review recommended');
  }

  return { patterns, recommendations };
}

/**
 * Format error summary for display
 * 
 * @param {object} classification - Error classification
 * @returns {string} Formatted HTML
 */
export function formatErrorSummary(classification) {
  const severityEmoji = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
    none: '✅'
  };

  return `
    <div class="error-summary">
      <div class="error-reason">
        ${severityEmoji[classification.severity]} <strong>${classification.reason}</strong>
      </div>
      <div class="error-suggestion">
        ${classification.suggestion}
      </div>
      ${classification.commonCauses ? `
        <details class="error-details">
          <summary>Common causes</summary>
          <ul>
            ${classification.commonCauses.map(cause => `<li>${cause}</li>`).join('')}
          </ul>
        </details>
      ` : ''}
    </div>
  `;
}