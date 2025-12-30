/**
 * Data Grid Renderer
 * Efficient table rendering with virtual scrolling and sorting
 */

export class DataGrid {
    constructor(container, options = {}) {
        this.container = container;
        this.data = [];
        this.columns = [];
        this.filteredData = [];
        
        // Display options
        this.rowHeight = 32;
        this.visibleRows = 50;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.searchTerm = '';
        
        // Callbacks
        this.onSort = options.onSort || null;
        this.onSearch = options.onSearch || null;
        
        // State
        this.scrollTop = 0;
    }
    
    /**
     * Render grid with data
     */
    render(data, columns, options = {}) {
        if (!data || data.length === 0) {
            this.renderEmpty();
            return;
        }
        
        this.data = data;
        this.columns = columns;
        this.filteredData = [...data];
        
        // Apply search if exists
        if (this.searchTerm) {
            this.applySearch();
        }
        
        this.renderTable();
    }
    
    /**
     * Render empty state
     */
    renderEmpty() {
        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-hero">
                    <h2>What do you need to do?</h2>
                    <p class="empty-subtitle">Pick a task to get started, or import your own data</p>
                </div>
                
                <div class="task-cards">
                    <button class="task-card task-card-featured" data-task="reconcile">
                        <div class="task-card-icon">⚖️</div>
                        <div class="task-card-content">
                            <h3>Reconcile Cycle Count</h3>
                            <p>Match physical vs system inventory</p>
                        </div>
                        <span class="task-card-badge">Most Popular</span>
                    </button>
                    
                    <button class="task-card" data-task="duplicates">
                        <div class="task-card-icon">👯</div>
                        <div class="task-card-content">
                            <h3>Find Duplicates</h3>
                            <p>Detect duplicate SKUs in your data</p>
                        </div>
                    </button>
                    
                    <button class="task-card" data-task="validation">
                        <div class="task-card-icon">✓</div>
                        <div class="task-card-content">
                            <h3>Validate Data</h3>
                            <p>Check required fields before import</p>
                        </div>
                    </button>
                </div>
                
                <div class="empty-divider">
                    <span>or start with your own data</span>
                </div>
                
                <div class="empty-actions">
                    <button id="importPrompt" class="btn-primary">Import CSV</button>
                    <button id="pastePrompt" class="btn-secondary">Paste from Excel</button>
                </div>
            </div>
        `;
        
        // Attach event listeners
        document.getElementById('importPrompt')?.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        document.getElementById('pastePrompt')?.addEventListener('click', () => {
            document.getElementById('pasteTable').click();
        });
        
        // Task card clicks - load sample and switch to module
        this.container.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', () => {
                const task = card.dataset.task;
                // Map tasks to sample scenarios
                const taskToSample = {
                    'reconcile': 'cycle-count',
                    'duplicates': 'duplicates',
                    'validation': 'validation'
                };
                window.dispatchEvent(new CustomEvent('loadSample', { detail: taskToSample[task] }));
            });
        });
    }
    
    /**
     * Render table structure
     */
    renderTable() {
        const html = `
            <div class="grid-viewport" id="gridViewport">
                <table class="grid-table">
                    <thead class="grid-header">
                        ${this.renderHeader()}
                    </thead>
                    <tbody class="grid-body" id="gridBody">
                        ${this.renderRows()}
                    </tbody>
                </table>
            </div>
        `;
        
        this.container.innerHTML = html;
        
        // Attach event listeners
        this.attachHeaderListeners();
        this.attachScrollListener();
    }
    
    /**
     * Render table header
     */
    renderHeader() {
        return `
            <tr>
                <th class="row-index">#</th>
                ${this.columns.map(col => `
                    <th class="sortable ${this.sortColumn === col ? 'sorted-' + this.sortDirection : ''}" 
                        data-column="${col}">
                        ${this.formatColumnName(col)}
                    </th>
                `).join('')}
            </tr>
        `;
    }
    
    /**
     * Render visible rows (virtual scrolling)
     */
    renderRows() {
        const startIdx = 0;
        const endIdx = Math.min(this.visibleRows, this.filteredData.length);
        const rows = this.filteredData.slice(startIdx, endIdx);
        
        return rows.map((row, idx) => this.renderRow(row, startIdx + idx)).join('');
    }
    
    /**
     * Render single row
     */
    renderRow(row, index) {
        return `
            <tr data-index="${index}">
                <td class="row-index">${index + 1}</td>
                ${this.columns.map(col => `
                    <td class="${this.getCellClass(row[col])}">${this.formatCellValue(row[col])}</td>
                `).join('')}
            </tr>
        `;
    }
    
    /**
     * Format column name for display
     */
    formatColumnName(col) {
        return col
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    }
    
    /**
     * Format cell value for display
     */
    formatCellValue(value) {
        if (value === null || value === undefined || value === '') {
            return '<span class="cell-null">—</span>';
        }
        
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        
        return String(value);
    }
    
    /**
     * Get CSS class for cell based on value
     */
    getCellClass(value) {
        if (value === null || value === undefined || value === '') {
            return 'cell-null';
        }
        
        if (typeof value === 'number') {
            return 'cell-number';
        }
        
        return '';
    }
    
    /**
     * Attach header click listeners for sorting
     */
    attachHeaderListeners() {
        const headers = this.container.querySelectorAll('th.sortable');
        
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.column;
                this.sort(column);
            });
        });
    }
    
    /**
     * Attach scroll listener for virtual scrolling (future enhancement)
     */
    attachScrollListener() {
        const viewport = this.container.querySelector('#gridViewport');
        if (!viewport) return;
        
        viewport.addEventListener('scroll', () => {
            this.scrollTop = viewport.scrollTop;
            // Virtual scrolling can be implemented here for large datasets
        });
    }
    
    /**
     * Sort data by column
     */
    sort(column) {
        // Toggle direction if same column
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        // Sort filtered data
        this.filteredData.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];
            
            // Handle nulls
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;
            
            // Compare
            if (typeof valA === 'number' && typeof valB === 'number') {
                return this.sortDirection === 'asc' ? valA - valB : valB - valA;
            }
            
            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            
            if (this.sortDirection === 'asc') {
                return strA.localeCompare(strB);
            } else {
                return strB.localeCompare(strA);
            }
        });
        
        // Re-render
        this.renderTable();
        
        // Callback
        if (this.onSort) {
            this.onSort(column, this.sortDirection);
        }
    }
    
    /**
     * Search/filter data
     */
    search(term) {
        this.searchTerm = term.toLowerCase();
        this.applySearch();
        this.renderTable();
        
        if (this.onSearch) {
            this.onSearch(term, this.filteredData.length);
        }
    }
    
    /**
     * Apply search filter
     */
    applySearch() {
        if (!this.searchTerm) {
            this.filteredData = [...this.data];
            return;
        }
        
        this.filteredData = this.data.filter(row => {
            return Object.values(row).some(value => {
                if (value === null || value === undefined) return false;
                return String(value).toLowerCase().includes(this.searchTerm);
            });
        });
    }
    
    /**
     * Highlight specific rows
     */
    highlightRows(indices, className = 'row-highlight') {
        // Remove existing highlights
        this.clearHighlights();
        
        // Add new highlights
        indices.forEach(idx => {
            const row = this.container.querySelector(`tr[data-index="${idx}"]`);
            if (row) {
                row.classList.add(className);
            }
        });
        
        // Store highlighted indices for reference
        this.highlightedIndices = indices;
        this.highlightClass = className;
    }
    
    /**
     * Clear all row highlights
     */
    clearHighlights() {
        this.container.querySelectorAll('tr.row-highlight, tr.row-highlight-error, tr.row-highlight-warning').forEach(row => {
            row.classList.remove('row-highlight', 'row-highlight-error', 'row-highlight-warning');
        });
        this.highlightedIndices = [];
    }
    
    /**
     * Scroll to a specific row
     */
    scrollToRow(index) {
        const row = this.container.querySelector(`tr[data-index="${index}"]`);
        if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    /**
     * Get current filtered data
     */
    getFilteredData() {
        return this.filteredData;
    }
    
    /**
     * Clear grid
     */
    clear() {
        this.data = [];
        this.columns = [];
        this.filteredData = [];
        this.renderEmpty();
    }
}

/**
 * Simple results grid (no virtual scrolling needed)
 */
export class ResultsGrid {
    constructor(container) {
        this.container = container;
        this.onRowClick = null; // Callback for clickable rows
    }
    
    /**
     * Set callback for when a row number is clicked
     */
    setRowClickHandler(callback) {
        this.onRowClick = callback;
    }
    
    render(data, columns, title = 'Results') {
        if (!data || data.length === 0) {
            this.renderEmpty();
            return;
        }
        
        const html = `
            <table class="grid-table grid-compact">
                <thead class="grid-header">
                    <tr>
                        ${columns.map(col => `
                            <th>${this.formatColumnName(col)}</th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody class="grid-body">
                    ${data.map(row => `
                        <tr>
                            ${columns.map(col => `
                                <td>${this.formatValue(row[col], col, row)}</td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        this.container.innerHTML = html;
        
        // Attach click handlers for clickable row numbers
        this.attachRowClickHandlers();
    }
    
    /**
     * Render empty state for no results
     */
    renderEmpty() {
        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚙️</div>
                <h3>No Analysis Run</h3>
                <p>Select a module and run analysis to see results</p>
            </div>
        `;
    }
    
    /**
     * Render empty state specifically for filtered results
     */
    renderFilteredEmpty() {
        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No Items Match This Filter</h3>
                <p>Click the metric again to clear the filter and see all results</p>
            </div>
        `;
    }
    
    formatColumnName(col) {
        return col
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    }
    
    formatValue(value, column, row) {
        if (value === null || value === undefined || value === '') {
            return '<span class="cell-null">—</span>';
        }
        
        // Make row number columns clickable
        if (column === 'row' && typeof value === 'number') {
            const rowIndex = row.rowIndex !== undefined ? row.rowIndex : value - 1;
            return `<span class="clickable-row" data-row-index="${rowIndex}" title="Click to jump to row ${value}">${value}</span>`;
        }
        
        // Make row_numbers column clickable (for duplicates - comma separated)
        if (column === 'row_numbers' && typeof value === 'string') {
            const rowNums = value.split(',').map(n => n.trim());
            const clickableNums = rowNums.map(num => {
                const idx = parseInt(num) - 1;
                return `<span class="clickable-row" data-row-index="${idx}" title="Click to jump to row ${num}">${num}</span>`;
            });
            return clickableNums.join(', ');
        }
        
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        
        return String(value);
    }
    
    /**
     * Attach click handlers for clickable row numbers
     */
    attachRowClickHandlers() {
        this.container.querySelectorAll('.clickable-row').forEach(el => {
            el.addEventListener('click', (e) => {
                const rowIndex = parseInt(e.target.dataset.rowIndex);
                if (!isNaN(rowIndex) && this.onRowClick) {
                    this.onRowClick(rowIndex);
                }
            });
        });
    }
}
