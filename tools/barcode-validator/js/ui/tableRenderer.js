/**
 * Table Renderer
 * 
 * Generates and manages the results table with sorting, filtering,
 * and expandable rows for detailed information.
 */

import { formatBreakdown, formatChecksumDetails } from '../core/barcodeValidator.js';

/**
 * Render results table
 * 
 * @param {array} results - Validation results (with duplicate flags)
 * @param {HTMLElement} container - Container element
 * @param {object} options - Rendering options
 * @returns {HTMLElement} The created table element
 */
export function renderTable(results, container, options = {}) {
  const {
    showIndex = true,
    showBreakdown = false,
    allowExpand = true,
    initialFilter = 'all' // 'all', 'valid', 'invalid'
  } = options;

  // Clear container
  container.innerHTML = '';

  // Create table structure
  const table = document.createElement('table');
  table.className = 'results-table';
  table.setAttribute('role', 'table');
  table.setAttribute('aria-label', 'Barcode validation results');

  // Create header
  const thead = createTableHeader(showIndex);
  table.appendChild(thead);

  // Create body
  const tbody = document.createElement('tbody');
  tbody.className = 'results-table-body';
  
  results.forEach((result, idx) => {
    const row = createTableRow(result, idx, { showIndex, allowExpand });
    tbody.appendChild(row);
  });

  table.appendChild(tbody);

  // Add to container
  container.appendChild(table);

  // Apply initial filter
  if (initialFilter !== 'all') {
    filterTable(table, initialFilter);
  }

  // Make sortable
  makeSortable(table);

  return table;
}

/**
 * Create table header
 */
function createTableHeader(showIndex) {
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  const headers = [];

  if (showIndex) {
    headers.push({ text: '#', sortKey: 'index', width: '50px' });
  }

  headers.push(
    { text: 'Barcode', sortKey: 'code', width: 'auto' },
    { text: 'Type', sortKey: 'symbology', width: '120px' },
    { text: 'Status', sortKey: 'valid', width: '100px' },
    { text: 'Issue', sortKey: 'error', width: 'auto' },
    { text: 'Flags', sortKey: 'flags', width: '80px' }
  );

  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header.text;
    th.className = 'sortable';
    th.setAttribute('data-sort-key', header.sortKey);
    th.style.width = header.width;
    th.setAttribute('role', 'columnheader');
    th.setAttribute('tabindex', '0');
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  return thead;
}

/**
 * Create table row
 */
function createTableRow(result, index, options) {
  const { showIndex, allowExpand } = options;

  const row = document.createElement('tr');
  row.className = result.valid ? 'valid-row' : 'invalid-row';
  row.setAttribute('data-index', index);
  row.setAttribute('data-valid', result.valid);
  row.setAttribute('data-duplicate', result.duplicate || false);
  row.setAttribute('role', 'row');

  // Index column
  if (showIndex) {
    const indexCell = document.createElement('td');
    indexCell.textContent = index + 1;
    indexCell.className = 'index-cell';
    row.appendChild(indexCell);
  }

  // Barcode column
  const codeCell = document.createElement('td');
  codeCell.textContent = result.code;
  codeCell.className = 'code-cell';
  codeCell.setAttribute('data-code', result.code);
  row.appendChild(codeCell);

  // Type column
  const typeCell = document.createElement('td');
  typeCell.className = 'type-cell';
  if (result.symbology) {
    const badge = createSymbologyBadge(result.symbology);
    typeCell.appendChild(badge);
  } else {
    typeCell.textContent = '—';
  }
  row.appendChild(typeCell);

  // Status column
  const statusCell = document.createElement('td');
  statusCell.className = 'status-cell';
  const statusBadge = createStatusBadge(result.valid);
  statusCell.appendChild(statusBadge);
  row.appendChild(statusCell);

  // Issue column
  const issueCell = document.createElement('td');
  issueCell.className = 'issue-cell';
  issueCell.textContent = result.error || '—';
  row.appendChild(issueCell);

  // Flags column
  const flagsCell = document.createElement('td');
  flagsCell.className = 'flags-cell';
  
  if (result.duplicate) {
    const dupBadge = createDuplicateBadge(result.duplicateInfo);
    flagsCell.appendChild(dupBadge);
  }
  
  if (result.warnings && result.warnings.length > 0) {
    const warnBadge = createWarningBadge(result.warnings.length);
    flagsCell.appendChild(warnBadge);
  }

  if (!result.duplicate && (!result.warnings || result.warnings.length === 0)) {
    flagsCell.textContent = '—';
  }

  row.appendChild(flagsCell);

  // Make expandable
  if (allowExpand && (result.breakdown || result.checksumDetails || result.warnings)) {
    row.classList.add('expandable');
    row.setAttribute('tabindex', '0');
    row.setAttribute('aria-expanded', 'false');
    
    row.addEventListener('click', (e) => {
      // Don't expand if clicking a link or button
      if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
        return;
      }
      toggleRowExpansion(row, result);
    });

    row.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleRowExpansion(row, result);
      }
    });
  }

  return row;
}

/**
 * Toggle row expansion to show details
 */
function toggleRowExpansion(row, result) {
  const isExpanded = row.getAttribute('aria-expanded') === 'true';
  
  if (isExpanded) {
    // Collapse
    const detailRow = row.nextElementSibling;
    if (detailRow && detailRow.classList.contains('detail-row')) {
      detailRow.remove();
    }
    row.setAttribute('aria-expanded', 'false');
    row.classList.remove('expanded');
  } else {
    // Expand
    const detailRow = createDetailRow(result, row.children.length);
    row.parentNode.insertBefore(detailRow, row.nextSibling);
    row.setAttribute('aria-expanded', 'true');
    row.classList.add('expanded');
  }
}

/**
 * Create detail row with expanded information
 */
function createDetailRow(result, colspan) {
  const detailRow = document.createElement('tr');
  detailRow.className = 'detail-row';

  const detailCell = document.createElement('td');
  detailCell.setAttribute('colspan', colspan);
  detailCell.className = 'detail-cell';

  const detailContent = document.createElement('div');
  detailContent.className = 'detail-content';

  // Breakdown section
  if (result.breakdown) {
    const breakdownSection = document.createElement('div');
    breakdownSection.className = 'detail-section';
    
    const breakdownTitle = document.createElement('h4');
    breakdownTitle.textContent = 'Barcode Structure';
    breakdownSection.appendChild(breakdownTitle);

    const breakdownTable = document.createElement('table');
    breakdownTable.className = 'breakdown-table';

    Object.entries(result.breakdown).forEach(([key, segment]) => {
      const tr = document.createElement('tr');
      
      const labelTd = document.createElement('td');
      labelTd.textContent = segment.label;
      labelTd.className = 'breakdown-label';
      
      const valueTd = document.createElement('td');
      valueTd.textContent = segment.value;
      valueTd.className = 'breakdown-value';
      
      const posTd = document.createElement('td');
      posTd.textContent = `(${segment.position})`;
      posTd.className = 'breakdown-position';
      
      tr.appendChild(labelTd);
      tr.appendChild(valueTd);
      tr.appendChild(posTd);
      breakdownTable.appendChild(tr);
    });

    breakdownSection.appendChild(breakdownTable);
    detailContent.appendChild(breakdownSection);
  }

  // Checksum details section
  if (result.checksumDetails && result.checksumDetails.steps) {
    const checksumSection = document.createElement('div');
    checksumSection.className = 'detail-section checksum-section';
    
    const checksumTitle = document.createElement('h4');
    checksumTitle.textContent = 'Checksum Calculation';
    checksumSection.appendChild(checksumTitle);

    const checksumPre = document.createElement('pre');
    checksumPre.className = 'checksum-steps';
    checksumPre.textContent = formatChecksumDetails(result.checksumDetails);
    checksumSection.appendChild(checksumPre);

    detailContent.appendChild(checksumSection);
  }

  // Warnings section
  if (result.warnings && result.warnings.length > 0) {
    const warningsSection = document.createElement('div');
    warningsSection.className = 'detail-section warnings-section';
    
    const warningsTitle = document.createElement('h4');
    warningsTitle.textContent = 'Warnings';
    warningsSection.appendChild(warningsTitle);

    const warningsList = document.createElement('ul');
    warningsList.className = 'warnings-list';
    
    result.warnings.forEach(warning => {
      const li = document.createElement('li');
      li.textContent = warning;
      warningsList.appendChild(li);
    });

    warningsSection.appendChild(warningsList);
    detailContent.appendChild(warningsSection);
  }

  // Duplicate info section
  if (result.duplicateInfo) {
    const dupSection = document.createElement('div');
    dupSection.className = 'detail-section duplicate-section';
    
    const dupTitle = document.createElement('h4');
    dupTitle.textContent = 'Duplicate Information';
    dupSection.appendChild(dupTitle);

    const dupInfo = document.createElement('div');
    dupInfo.className = 'duplicate-info';
    
    dupInfo.innerHTML = `
      <p><strong>Occurrences:</strong> ${result.duplicateInfo.occurrences}</p>
      <p><strong>Risk Level:</strong> ${result.duplicateInfo.risk.level.toUpperCase()}</p>
      <p><strong>Impact:</strong> ${result.duplicateInfo.risk.wmsImpact}</p>
      <p><strong>Found at indices:</strong> ${result.duplicateInfo.indices.join(', ')}</p>
    `;

    dupSection.appendChild(dupInfo);
    detailContent.appendChild(dupSection);
  }

  detailCell.appendChild(detailContent);
  detailRow.appendChild(detailCell);

  return detailRow;
}

/**
 * Create symbology badge
 */
function createSymbologyBadge(symbology) {
  const badge = document.createElement('span');
  badge.className = `badge symbology-badge symbology-${symbology.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  badge.textContent = symbology;
  return badge;
}

/**
 * Create status badge
 */
function createStatusBadge(isValid) {
  const badge = document.createElement('span');
  badge.className = `badge status-badge ${isValid ? 'status-valid' : 'status-invalid'}`;
  badge.textContent = isValid ? '✓ Valid' : '✗ Invalid';
  badge.setAttribute('aria-label', isValid ? 'Valid barcode' : 'Invalid barcode');
  return badge;
}

/**
 * Create duplicate badge
 */
function createDuplicateBadge(duplicateInfo) {
  const badge = document.createElement('span');
  badge.className = `badge duplicate-badge duplicate-${duplicateInfo.risk.level}`;
  badge.textContent = `DUP×${duplicateInfo.occurrences}`;
  badge.title = duplicateInfo.risk.message;
  badge.setAttribute('aria-label', `Duplicate: ${duplicateInfo.risk.message}`);
  return badge;
}

/**
 * Create warning badge
 */
function createWarningBadge(count) {
  const badge = document.createElement('span');
  badge.className = 'badge warning-badge';
  badge.textContent = `⚠ ${count}`;
  badge.title = `${count} warning${count > 1 ? 's' : ''}`;
  badge.setAttribute('aria-label', `${count} warnings`);
  return badge;
}

/**
 * Add filter controls to table
 * 
 * @param {HTMLElement} container - Container to add controls to
 * @param {HTMLElement} table - Table element to filter
 * @returns {HTMLElement} Filter controls container
 */
export function addTableFilters(container, table) {
  const filterContainer = document.createElement('div');
  filterContainer.className = 'table-filters';

  const filters = [
    { label: 'All', value: 'all', icon: '📋' },
    { label: 'Valid Only', value: 'valid', icon: '✓' },
    { label: 'Invalid Only', value: 'invalid', icon: '✗' },
    { label: 'Duplicates', value: 'duplicates', icon: '⚠' }
  ];

  filters.forEach(filter => {
    const button = document.createElement('button');
    button.className = 'filter-button';
    button.setAttribute('data-filter', filter.value);
    button.innerHTML = `${filter.icon} ${filter.label}`;
    
    if (filter.value === 'all') {
      button.classList.add('active');
    }

    button.addEventListener('click', () => {
      // Remove active from all buttons
      filterContainer.querySelectorAll('.filter-button').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Add active to clicked button
      button.classList.add('active');
      
      // Apply filter
      filterTable(table, filter.value);
    });

    filterContainer.appendChild(button);
  });

  container.appendChild(filterContainer);
  return filterContainer;
}

/**
 * Filter table rows
 */
function filterTable(table, filter) {
  const tbody = table.querySelector('tbody');
  const rows = tbody.querySelectorAll('tr:not(.detail-row)');

  rows.forEach(row => {
    const isValid = row.getAttribute('data-valid') === 'true';
    const isDuplicate = row.getAttribute('data-duplicate') === 'true';
    
    let show = false;

    switch (filter) {
      case 'all':
        show = true;
        break;
      case 'valid':
        show = isValid;
        break;
      case 'invalid':
        show = !isValid;
        break;
      case 'duplicates':
        show = isDuplicate;
        break;
    }

    if (show) {
      row.style.display = '';
      // Also show associated detail row if expanded
      const detailRow = row.nextElementSibling;
      if (detailRow && detailRow.classList.contains('detail-row')) {
        detailRow.style.display = '';
      }
    } else {
      row.style.display = 'none';
      // Hide associated detail row
      const detailRow = row.nextElementSibling;
      if (detailRow && detailRow.classList.contains('detail-row')) {
        detailRow.style.display = 'none';
      }
    }
  });

  // Update visible count
  updateVisibleCount(table);
}

/**
 * Make table sortable
 */
function makeSortable(table) {
  const headers = table.querySelectorAll('th.sortable');
  
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const sortKey = header.getAttribute('data-sort-key');
      const currentOrder = header.getAttribute('data-sort-order') || 'asc';
      const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
      
      // Clear all other headers
      headers.forEach(h => {
        h.removeAttribute('data-sort-order');
        h.classList.remove('sort-asc', 'sort-desc');
      });

      // Set new sort
      header.setAttribute('data-sort-order', newOrder);
      header.classList.add(`sort-${newOrder}`);
      
      sortTable(table, sortKey, newOrder);
    });
  });
}

/**
 * Sort table by column
 */
function sortTable(table, sortKey, order) {
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr:not(.detail-row)'));

  rows.sort((a, b) => {
    let aVal, bVal;

    switch (sortKey) {
      case 'index':
        aVal = parseInt(a.getAttribute('data-index'), 10);
        bVal = parseInt(b.getAttribute('data-index'), 10);
        break;
      case 'code':
        aVal = a.querySelector('.code-cell').textContent;
        bVal = b.querySelector('.code-cell').textContent;
        break;
      case 'symbology':
        aVal = a.querySelector('.type-cell').textContent;
        bVal = b.querySelector('.type-cell').textContent;
        break;
      case 'valid':
        aVal = a.getAttribute('data-valid') === 'true' ? 1 : 0;
        bVal = b.getAttribute('data-valid') === 'true' ? 1 : 0;
        break;
      case 'error':
        aVal = a.querySelector('.issue-cell').textContent;
        bVal = b.querySelector('.issue-cell').textContent;
        break;
      case 'flags':
        aVal = a.getAttribute('data-duplicate') === 'true' ? 1 : 0;
        bVal = b.getAttribute('data-duplicate') === 'true' ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  // Re-append rows in sorted order
  rows.forEach(row => {
    // Collapse expanded rows during sort
    if (row.classList.contains('expanded')) {
      const detailRow = row.nextElementSibling;
      if (detailRow && detailRow.classList.contains('detail-row')) {
        detailRow.remove();
      }
      row.classList.remove('expanded');
      row.setAttribute('aria-expanded', 'false');
    }
    tbody.appendChild(row);
  });
}

/**
 * Update visible row count
 */
function updateVisibleCount(table) {
  const tbody = table.querySelector('tbody');
  const allRows = tbody.querySelectorAll('tr:not(.detail-row)');
  const visibleRows = tbody.querySelectorAll('tr:not(.detail-row):not([style*="display: none"])');
  
  // Dispatch custom event with counts
  table.dispatchEvent(new CustomEvent('filterchange', {
    detail: {
      total: allRows.length,
      visible: visibleRows.length
    }
  }));
}

/**
 * Export table to CSV
 * 
 * @param {array} results - Validation results
 * @param {object} options - Export options
 * @returns {string} CSV string
 */
export function exportTableToCSV(results, options = {}) {
  const {
    includeIndex = true,
    includeBreakdown = false,
    filterValid = 'all' // 'all', 'valid', 'invalid'
  } = options;

  // Filter results
  let filtered = results;
  if (filterValid === 'valid') {
    filtered = results.filter(r => r.valid);
  } else if (filterValid === 'invalid') {
    filtered = results.filter(r => !r.valid);
  }

  // Build headers
  const headers = [];
  if (includeIndex) headers.push('Index');
  headers.push('Barcode', 'Type', 'Valid', 'Error', 'Duplicate', 'Duplicate_Count');
  
  if (includeBreakdown) {
    headers.push('Breakdown');
  }

  const rows = [headers];

  // Build rows
  filtered.forEach((result, idx) => {
    const row = [];
    
    if (includeIndex) row.push(idx + 1);
    
    row.push(
      `"${result.code}"`,
      result.symbology || '',
      result.valid ? 'Yes' : 'No',
      result.error ? `"${result.error}"` : '',
      result.duplicate ? 'Yes' : 'No',
      result.duplicate ? result.duplicateInfo.occurrences : ''
    );

    if (includeBreakdown && result.breakdown) {
      const breakdownStr = formatBreakdown(result.breakdown).replace(/\n/g, ' | ');
      row.push(`"${breakdownStr}"`);
    }

    rows.push(row);
  });

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Clear table
 */
export function clearTable(container) {
  container.innerHTML = '';
}