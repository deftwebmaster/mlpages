/**
 * Health Scorer
 * 
 * Calculates WMS integration readiness score and batch health metrics.
 * Provides actionable insights for ops teams.
 */

import { SYMBOLOGY_RULES } from '../core/symbologyRules.js';
import { getDuplicateSummary } from './duplicateDetector.js';

/**
 * Calculate overall batch health score
 * 
 * @param {array} results - Validation results (with duplicate flags)
 * @param {object} options - Scoring options
 * @param {string} options.useCase - Expected use case for context-aware scoring
 * @returns {object} Health score and detailed breakdown
 */
export function calculateHealthScore(results, options = {}) {
  const { useCase = null } = options;

  const metrics = {
    total: results.length,
    valid: results.filter(r => r.valid).length,
    invalid: results.filter(r => !r.valid).length,
    duplicates: results.filter(r => r.duplicate).length
  };

  // Calculate percentages
  const validPercent = metrics.total > 0 ? (metrics.valid / metrics.total) * 100 : 0;
  const duplicatePercent = metrics.total > 0 ? (metrics.duplicates / metrics.total) * 100 : 0;

  // Get duplicate risk info
  const duplicateSummary = getDuplicateSummary(results);

  // Calculate base score (0-100)
  let score = 100;
  const issues = [];
  const warnings = [];

  // Validity penalties
  if (validPercent < 100) {
    const invalidPercent = 100 - validPercent;
    score -= invalidPercent;
    issues.push({
      severity: invalidPercent > 10 ? 'high' : 'medium',
      message: `${metrics.invalid} invalid barcodes (${(100 - validPercent).toFixed(1)}%)`,
      impact: 'WMS will reject these codes during import'
    });
  }

  // Duplicate penalties
  if (duplicateSummary.hasCriticalDuplicates) {
    score -= 30;
    issues.push({
      severity: 'critical',
      message: 'Critical duplicate location labels detected',
      impact: 'BLOCKING: Will break putaway and picking operations'
    });
  } else if (duplicateSummary.hasHighRiskDuplicates) {
    score -= 20;
    issues.push({
      severity: 'high',
      message: `${duplicateSummary.uniqueDuplicateCodes} high-risk duplicate codes`,
      impact: 'Will cause inventory discrepancies and scanning errors'
    });
  } else if (duplicateSummary.uniqueDuplicateCodes > 0) {
    score -= 10;
    warnings.push({
      severity: 'medium',
      message: `${duplicateSummary.uniqueDuplicateCodes} duplicate codes detected`,
      impact: 'May cause scanning confusion'
    });
  }

  // Use case specific checks
  if (useCase) {
    const useCaseChecks = performUseCaseChecks(results, useCase);
    issues.push(...useCaseChecks.issues);
    warnings.push(...useCaseChecks.warnings);
    score -= useCaseChecks.penalty;
  }

  // Symbology distribution checks
  const symbologyChecks = checkSymbologyDistribution(results);
  warnings.push(...symbologyChecks.warnings);
  score -= symbologyChecks.penalty;

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  // Determine grade
  const grade = getGrade(score);

  return {
    score: Math.round(score),
    grade,
    metrics,
    validPercent: validPercent.toFixed(1),
    duplicatePercent: duplicatePercent.toFixed(1),
    issues,
    warnings,
    readiness: getReadinessLevel(score, issues),
    recommendation: getRecommendation(score, grade, issues)
  };
}

/**
 * Convert score to letter grade
 */
function getGrade(score) {
  if (score >= 95) return 'A';
  if (score >= 85) return 'B';
  if (score >= 70) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Get WMS readiness level
 */
function getReadinessLevel(score, issues) {
  const hasCritical = issues.some(i => i.severity === 'critical');
  const hasHigh = issues.some(i => i.severity === 'high');

  if (hasCritical) {
    return {
      level: 'not-ready',
      label: '🚨 Not Ready',
      message: 'Critical issues must be resolved before WMS upload'
    };
  }

  if (hasHigh || score < 70) {
    return {
      level: 'needs-review',
      label: '⚠️ Needs Review',
      message: 'Review and fix issues before proceeding'
    };
  }

  if (score >= 95) {
    return {
      level: 'ready',
      label: '✅ Ready',
      message: 'Batch meets WMS integration standards'
    };
  }

  return {
    level: 'acceptable',
    label: '✓ Acceptable',
    message: 'Minor issues present but acceptable for WMS upload'
  };
}

/**
 * Get recommendation based on health score
 */
function getRecommendation(score, grade, issues) {
  if (grade === 'A') {
    return 'Excellent batch quality. Safe to proceed with WMS upload.';
  }

  if (grade === 'B') {
    return 'Good batch quality. Review warnings and proceed if acceptable.';
  }

  const hasCritical = issues.some(i => i.severity === 'critical');
  if (hasCritical) {
    return 'STOP: Fix critical issues before uploading to WMS. Current state will cause operational failures.';
  }

  if (grade === 'C') {
    return 'Moderate quality. Fix high-priority issues before WMS upload to avoid complications.';
  }

  return 'Poor batch quality. Comprehensive review and remediation required before WMS upload.';
}

/**
 * Perform use-case specific checks
 */
function performUseCaseChecks(results, useCase) {
  const issues = [];
  const warnings = [];
  let penalty = 0;

  switch (useCase) {
    case 'receiving-po':
      // Expect mostly UPC-A/EAN-13
      const retailSymbologies = results.filter(r => 
        r.symbology === 'UPC-A' || r.symbology === 'EAN-13'
      ).length;
      const retailPercent = (retailSymbologies / results.length) * 100;

      if (retailPercent < 80) {
        warnings.push({
          severity: 'low',
          message: `Only ${retailPercent.toFixed(0)}% retail barcodes (UPC/EAN)`,
          impact: 'Verify these are consumer products, not internal SKUs'
        });
        penalty += 5;
      }
      break;

    case 'location-labels':
      // Expect Code 128, no duplicates
      const nonCode128 = results.filter(r => r.symbology !== 'CODE128').length;
      
      if (nonCode128 > 0) {
        issues.push({
          severity: 'high',
          message: `${nonCode128} non-Code128 barcodes in location batch`,
          impact: 'Location labels should use Code 128 format'
        });
        penalty += 15;
      }
      break;

    case 'label-print-qa':
      // Check for consistent symbology
      const symbologies = new Set(results.map(r => r.symbology));
      
      if (symbologies.size > 1) {
        warnings.push({
          severity: 'low',
          message: `Mixed symbologies in print batch (${symbologies.size} types)`,
          impact: 'Verify printer configuration supports all types'
        });
        penalty += 3;
      }
      break;
  }

  return { issues, warnings, penalty };
}

/**
 * Check symbology distribution for issues
 */
function checkSymbologyDistribution(results) {
  const warnings = [];
  let penalty = 0;

  const distribution = getSymbologyDistribution(results);

  // Check for UPC-E overuse (some WMS hate it)
  if (distribution['UPC-E']) {
    const upcePercent = (distribution['UPC-E'].count / results.length) * 100;
    
    if (upcePercent > 20) {
      warnings.push({
        severity: 'medium',
        message: `High UPC-E usage (${upcePercent.toFixed(0)}%)`,
        impact: 'Some WMS systems have limited UPC-E support. Consider UPC-A if possible.'
      });
      penalty += 5;
    }
  }

  // Check for EAN-8 (less common, verify scanner support)
  if (distribution['EAN-8']) {
    warnings.push({
      severity: 'low',
      message: 'EAN-8 barcodes present',
      impact: 'Verify scanner configuration supports EAN-8'
    });
    penalty += 2;
  }

  return { warnings, penalty };
}

/**
 * Get symbology distribution
 * 
 * @param {array} results - Validation results
 * @returns {object} Distribution object with counts and percentages
 */
export function getSymbologyDistribution(results) {
  const distribution = {};
  const total = results.length;

  results.forEach(result => {
    if (result.symbology) {
      if (!distribution[result.symbology]) {
        distribution[result.symbology] = {
          count: 0,
          percentage: 0,
          valid: 0,
          invalid: 0
        };
      }

      distribution[result.symbology].count++;
      
      if (result.valid) {
        distribution[result.symbology].valid++;
      } else {
        distribution[result.symbology].invalid++;
      }
    }
  });

  // Calculate percentages
  Object.keys(distribution).forEach(symbology => {
    distribution[symbology].percentage = total > 0 
      ? ((distribution[symbology].count / total) * 100).toFixed(1)
      : 0;
  });

  return distribution;
}

/**
 * Get top failure reasons
 * 
 * @param {array} results - Validation results
 * @param {number} topN - Number of top reasons to return
 * @returns {array} Top failure reasons
 */
export function getTopFailureReasons(results, topN = 3) {
  const errorCounts = {};

  results.forEach(result => {
    if (!result.valid && result.error) {
      // Categorize error
      let category;
      const errorLower = result.error.toLowerCase();

      if (errorLower.includes('check digit')) {
        category = 'Bad check digit';
      } else if (errorLower.includes('length')) {
        category = 'Wrong length';
      } else if (errorLower.includes('character')) {
        category = 'Illegal characters';
      } else if (errorLower.includes('symbology')) {
        category = 'Symbology issue';
      } else {
        category = 'Other error';
      }

      errorCounts[category] = (errorCounts[category] || 0) + 1;
    }
  });

  // Convert to array and sort
  const errorArray = Object.entries(errorCounts).map(([reason, count]) => ({
    reason,
    count,
    percentage: ((count / results.filter(r => !r.valid).length) * 100).toFixed(1)
  }));

  errorArray.sort((a, b) => b.count - a.count);

  return errorArray.slice(0, topN);
}

/**
 * Get batch metadata summary
 * 
 * @param {array} results - Validation results
 * @param {object} processSummary - Summary from bulkProcessor
 * @returns {object} Metadata for display
 */
export function getBatchMetadata(results, processSummary = null) {
  const distribution = getSymbologyDistribution(results);
  
  return {
    timestamp: new Date().toISOString(),
    totalCodes: results.length,
    validCodes: results.filter(r => r.valid).length,
    invalidCodes: results.filter(r => !r.valid).length,
    duplicateCodes: results.filter(r => r.duplicate).length,
    symbologyBreakdown: distribution,
    processingTime: processSummary ? processSummary.processingTime : null
  };
}

/**
 * Format health score for display
 */
export function formatHealthScoreForDisplay(healthScore) {
  const { grade, score, readiness, recommendation } = healthScore;

  const gradeEmoji = {
    'A': '🟢',
    'B': '🔵',
    'C': '🟡',
    'D': '🟠',
    'F': '🔴'
  };

  return {
    display: `${gradeEmoji[grade] || ''} Grade ${grade} (${score}/100)`,
    readiness: readiness.label,
    recommendation
  };
}