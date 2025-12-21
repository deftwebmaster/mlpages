/**
 * Chart Renderer
 * 
 * Creates visual representations of symbology distribution
 * and batch statistics. Uses CSS-based charts (no dependencies).
 */

/**
 * Render symbology distribution chart
 * 
 * @param {object} distribution - Distribution object from healthScorer
 * @param {HTMLElement} container - Container element
 * @param {object} options - Rendering options
 * @returns {HTMLElement} Chart element
 */
export function renderDistributionChart(distribution, container, options = {}) {
  const {
    chartType = 'bar', // 'bar' or 'text'
    showPercentages = true,
    showCounts = true
  } = options;

  // Clear container
  container.innerHTML = '';

  const chartContainer = document.createElement('div');
  chartContainer.className = 'distribution-chart';

  // Sort by count (descending)
  const entries = Object.entries(distribution).sort((a, b) => b[1].count - a[1].count);

  if (entries.length === 0) {
    chartContainer.innerHTML = '<p class="no-data">No data to display</p>';
    container.appendChild(chartContainer);
    return chartContainer;
  }

  // Find max for scaling
  const maxCount = Math.max(...entries.map(([_, data]) => data.count));

  entries.forEach(([symbology, data]) => {
    const item = document.createElement('div');
    item.className = 'distribution-item';

    // Label
    const label = document.createElement('div');
    label.className = 'distribution-label';
    label.textContent = symbology;
    item.appendChild(label);

    if (chartType === 'bar') {
      // Bar chart
      const barContainer = document.createElement('div');
      barContainer.className = 'distribution-bar-container';

      const bar = document.createElement('div');
      bar.className = `distribution-bar symbology-${symbology.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const widthPercent = (data.count / maxCount) * 100;
      bar.style.width = `${widthPercent}%`;
      
      barContainer.appendChild(bar);
      item.appendChild(barContainer);
    }

    // Value
    const value = document.createElement('div');
    value.className = 'distribution-value';
    
    let valueText = '';
    if (showCounts) {
      valueText += data.count;
    }
    if (showPercentages) {
      valueText += ` (${data.percentage}%)`;
    }
    
    value.textContent = valueText;
    item.appendChild(value);

    chartContainer.appendChild(item);
  });

  container.appendChild(chartContainer);
  return chartContainer;
}

/**
 * Render health score card
 * 
 * @param {object} healthScore - Health score from healthScorer
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement} Card element
 */
export function renderHealthScoreCard(healthScore, container) {
  // Clear container
  container.innerHTML = '';

  const card = document.createElement('div');
  card.className = `health-score-card grade-${healthScore.grade.toLowerCase()}`;

  // Grade display
  const gradeSection = document.createElement('div');
  gradeSection.className = 'health-grade-section';

  const gradeCircle = document.createElement('div');
  gradeCircle.className = 'grade-circle';
  gradeCircle.innerHTML = `
    <span class="grade-letter">${healthScore.grade}</span>
    <span class="grade-score">${healthScore.score}/100</span>
  `;
  gradeSection.appendChild(gradeCircle);

  const readinessLabel = document.createElement('div');
  readinessLabel.className = `readiness-label readiness-${healthScore.readiness.level}`;
  readinessLabel.textContent = healthScore.readiness.label;
  gradeSection.appendChild(readinessLabel);

  card.appendChild(gradeSection);

  // Metrics
  const metricsSection = document.createElement('div');
  metricsSection.className = 'health-metrics';

  const metrics = [
    { label: 'Total Codes', value: healthScore.metrics.total },
    { label: 'Valid', value: `${healthScore.metrics.valid} (${healthScore.validPercent}%)`, class: 'metric-valid' },
    { label: 'Invalid', value: `${healthScore.metrics.invalid}`, class: 'metric-invalid' },
    { label: 'Duplicates', value: healthScore.metrics.duplicates, class: 'metric-duplicate' }
  ];

  metrics.forEach(metric => {
    const metricItem = document.createElement('div');
    metricItem.className = `metric-item ${metric.class || ''}`;
    metricItem.innerHTML = `
      <span class="metric-label">${metric.label}</span>
      <span class="metric-value">${metric.value}</span>
    `;
    metricsSection.appendChild(metricItem);
  });

  card.appendChild(metricsSection);

  // Recommendation
  const recommendation = document.createElement('div');
  recommendation.className = 'health-recommendation';
  recommendation.innerHTML = `<p>${healthScore.recommendation}</p>`;
  card.appendChild(recommendation);

  container.appendChild(card);
  return card;
}

/**
 * Render issues and warnings list
 * 
 * @param {object} healthScore - Health score from healthScorer
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement} Issues container
 */
export function renderIssuesWarnings(healthScore, container) {
  // Clear container
  container.innerHTML = '';

  const issuesContainer = document.createElement('div');
  issuesContainer.className = 'issues-warnings-container';

  // Render issues
  if (healthScore.issues && healthScore.issues.length > 0) {
    const issuesSection = document.createElement('div');
    issuesSection.className = 'issues-section';

    const issuesTitle = document.createElement('h3');
    issuesTitle.textContent = '🚨 Issues';
    issuesSection.appendChild(issuesTitle);

    const issuesList = document.createElement('ul');
    issuesList.className = 'issues-list';

    healthScore.issues.forEach(issue => {
      const li = document.createElement('li');
      li.className = `issue-item severity-${issue.severity}`;
      li.innerHTML = `
        <div class="issue-message">
          <span class="severity-badge">${issue.severity.toUpperCase()}</span>
          ${issue.message}
        </div>
        <div class="issue-impact">${issue.impact}</div>
      `;
      issuesList.appendChild(li);
    });

    issuesSection.appendChild(issuesList);
    issuesContainer.appendChild(issuesSection);
  }

  // Render warnings
  if (healthScore.warnings && healthScore.warnings.length > 0) {
    const warningsSection = document.createElement('div');
    warningsSection.className = 'warnings-section';

    const warningsTitle = document.createElement('h3');
    warningsTitle.textContent = '⚠️ Warnings';
    warningsSection.appendChild(warningsTitle);

    const warningsList = document.createElement('ul');
    warningsList.className = 'warnings-list';

    healthScore.warnings.forEach(warning => {
      const li = document.createElement('li');
      li.className = `warning-item severity-${warning.severity}`;
      li.innerHTML = `
        <div class="warning-message">${warning.message}</div>
        <div class="warning-impact">${warning.impact}</div>
      `;
      warningsList.appendChild(li);
    });

    warningsSection.appendChild(warningsList);
    issuesContainer.appendChild(warningsSection);
  }

  // No issues or warnings
  if ((!healthScore.issues || healthScore.issues.length === 0) &&
      (!healthScore.warnings || healthScore.warnings.length === 0)) {
    const noIssues = document.createElement('div');
    noIssues.className = 'no-issues';
    noIssues.innerHTML = '<p>✅ No issues or warnings detected</p>';
    issuesContainer.appendChild(noIssues);
  }

  container.appendChild(issuesContainer);
  return issuesContainer;
}

/**
 * Render batch metadata
 * 
 * @param {object} metadata - Metadata from getBatchMetadata
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement} Metadata container
 */
export function renderBatchMetadata(metadata, container) {
  // Clear container
  container.innerHTML = '';

  const metadataContainer = document.createElement('div');
  metadataContainer.className = 'batch-metadata';

  // Timestamp
  const timestamp = new Date(metadata.timestamp);
  const timestampStr = timestamp.toLocaleString();

  const metadataItems = [
    { label: 'Processed', value: timestampStr },
    { label: 'Total Codes', value: metadata.totalCodes },
    { label: 'Processing Time', value: metadata.processingTime ? `${metadata.processingTime.toFixed(2)}ms` : 'N/A' }
  ];

  metadataItems.forEach(item => {
    const metaItem = document.createElement('div');
    metaItem.className = 'metadata-item';
    metaItem.innerHTML = `
      <span class="metadata-label">${item.label}:</span>
      <span class="metadata-value">${item.value}</span>
    `;
    metadataContainer.appendChild(metaItem);
  });

  container.appendChild(metadataContainer);
  return metadataContainer;
}

/**
 * Render top errors chart
 * 
 * @param {array} topErrors - Top errors from getTopFailureReasons
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement} Chart element
 */
export function renderTopErrorsChart(topErrors, container) {
  // Clear container
  container.innerHTML = '';

  if (!topErrors || topErrors.length === 0) {
    container.innerHTML = '<p class="no-data">No errors to display</p>';
    return container;
  }

  const chartContainer = document.createElement('div');
  chartContainer.className = 'top-errors-chart';

  const title = document.createElement('h3');
  title.textContent = 'Top Error Reasons';
  chartContainer.appendChild(title);

  const maxCount = Math.max(...topErrors.map(e => e.count));

  topErrors.forEach((error, index) => {
    const item = document.createElement('div');
    item.className = 'error-item';

    const rank = document.createElement('div');
    rank.className = 'error-rank';
    rank.textContent = `#${index + 1}`;
    item.appendChild(rank);

    const label = document.createElement('div');
    label.className = 'error-label';
    label.textContent = error.reason;
    item.appendChild(label);

    const barContainer = document.createElement('div');
    barContainer.className = 'error-bar-container';

    const bar = document.createElement('div');
    bar.className = 'error-bar';
    const widthPercent = (error.count / maxCount) * 100;
    bar.style.width = `${widthPercent}%`;
    barContainer.appendChild(bar);
    item.appendChild(barContainer);

    const value = document.createElement('div');
    value.className = 'error-value';
    value.textContent = `${error.count} (${error.percentage}%)`;
    item.appendChild(value);

    chartContainer.appendChild(item);
  });

  container.appendChild(chartContainer);
  return chartContainer;
}

/**
 * Render progress bar
 * 
 * @param {HTMLElement} container - Container element
 * @param {number} percent - Progress percentage (0-100)
 * @param {string} label - Progress label
 * @returns {HTMLElement} Progress bar element
 */
export function renderProgressBar(container, percent = 0, label = 'Processing...') {
  container.innerHTML = '';

  const progressContainer = document.createElement('div');
  progressContainer.className = 'progress-container';

  const progressLabel = document.createElement('div');
  progressLabel.className = 'progress-label';
  progressLabel.textContent = label;
  progressContainer.appendChild(progressLabel);

  const progressBarBg = document.createElement('div');
  progressBarBg.className = 'progress-bar-bg';

  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';
  progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  progressBar.setAttribute('role', 'progressbar');
  progressBar.setAttribute('aria-valuenow', percent);
  progressBar.setAttribute('aria-valuemin', '0');
  progressBar.setAttribute('aria-valuemax', '100');

  progressBarBg.appendChild(progressBar);
  progressContainer.appendChild(progressBarBg);

  const progressPercent = document.createElement('div');
  progressPercent.className = 'progress-percent';
  progressPercent.textContent = `${Math.round(percent)}%`;
  progressContainer.appendChild(progressPercent);

  container.appendChild(progressContainer);

  return progressContainer;
}

/**
 * Update progress bar
 * 
 * @param {HTMLElement} progressContainer - Progress container element
 * @param {number} percent - New percentage
 * @param {string} label - Optional new label
 */
export function updateProgressBar(progressContainer, percent, label = null) {
  const progressBar = progressContainer.querySelector('.progress-bar');
  const progressPercent = progressContainer.querySelector('.progress-percent');
  const progressLabel = progressContainer.querySelector('.progress-label');

  if (progressBar) {
    progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    progressBar.setAttribute('aria-valuenow', percent);
  }

  if (progressPercent) {
    progressPercent.textContent = `${Math.round(percent)}%`;
  }

  if (label && progressLabel) {
    progressLabel.textContent = label;
  }
}