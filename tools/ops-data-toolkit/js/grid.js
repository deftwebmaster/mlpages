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
                <div class="empty-icon">📊</div>
                <h3>No Data Loaded</h3>
                <p>Import a CSV file or try a sample scenario</p>
                <div class="empty-actions">
                    <button id="importPrompt" class="btn-primary">Import CSV</button>
                    <span class="empty-or">or</span>
                    <div class="sample-dropdown inline-dropdown" id="inlineSampleDropdown">
                        <button id="inlineSampleBtn" class="btn-secondary">📋 Try Sample Data ▾</button>
                        <div class="sample-menu" id="inlineSampleMenu">
                            <div class="sample-menu-header">Load sample data to explore:</div>
                            <button data-sample="cycle-count">🔄 Cycle Count Reconciliation</button>
                            <button data-sample="receiving">📦 Receiving Discrepancies</button>
                            <button data-sample="duplicates">👯 Duplicate SKUs</button>
                            <button data-sample="validation">⚠️ Data Quality Issues</button>
                            <button data-sample="lookup">🔍 Price Lookup</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Attach event listeners for dynamically created elements
        document.getElementById('importPrompt')?.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        const inlineSampleBtn = document.getElementById('inlineSampleBtn');
        const inlineSampleMenu = document.getElementById('inlineSampleMenu');
        
        if (inlineSampleBtn && inlineSampleMenu) {
            inlineSampleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                inlineSampleMenu.classList.toggle('show');
            });
            
            // We need to import handleLoadSample or dispatch a custom event
            // For now, dispatch event that app.js listens for
            inlineSampleMenu.querySelectorAll('button[data-sample]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const sampleKey = e.currentTarget.dataset.sample;
                    // Dispatch custom event for app.js to handle
                    window.dispatchEvent(new CustomEvent('loadSample', { detail: sampleKey }));
                    inlineSampleMenu.classList.remove('show');
                });
            });
        }
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
        this.container.querySelectorAll('tr.row-highlight').forEach(row => {
            row.classList.remove('row-highlight');
        });
        
        // Add new highlights
        indices.forEach(idx => {
            const row = this.container.querySelector(`tr[data-index="${idx}"]`);
            if (row) {
                row.classList.add(className);
            }
        });
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
                                <td>${this.formatValue(row[col])}</td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        this.container.innerHTML = html;
    }
    
    renderEmpty() {
        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚙️</div>
                <h3>No Analysis Run</h3>
                <p>Select a module and run analysis to see results</p>
            </div>
        `;
    }
    
    formatColumnName(col) {
        return col
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    }
    
    formatValue(value) {
        if (value === null || value === undefined || value === '') {
            return '<span class="cell-null">—</span>';
        }
        
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        
        return String(value);
    }
}
