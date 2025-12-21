/**
 * Export Utilities
 * CSV, TSV, and clipboard export functions
 */

/**
 * Convert data to CSV format
 */
export function toCSV(data, columns) {
    if (!data || data.length === 0) {
        return '';
    }
    
    // Use columns if provided, otherwise use keys from first row
    const cols = columns || Object.keys(data[0]);
    
    return Papa.unparse(data, {
        columns: cols,
        header: true
    });
}

/**
 * Convert data to TSV format (for Excel paste)
 */
export function toTSV(data, columns) {
    if (!data || data.length === 0) {
        return '';
    }
    
    const cols = columns || Object.keys(data[0]);
    
    return Papa.unparse(data, {
        columns: cols,
        header: true,
        delimiter: '\t'
    });
}

/**
 * Download file to user's computer
 */
export function downloadFile(content, filename, mimeType = 'text/csv') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        // Fallback for older browsers
        return copyToClipboardFallback(text);
    }
}

/**
 * Fallback clipboard copy using textarea
 */
function copyToClipboardFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    
    textarea.select();
    
    let success = false;
    try {
        success = document.execCommand('copy');
    } catch (error) {
        console.error('Fallback copy failed:', error);
    }
    
    document.body.removeChild(textarea);
    return success;
}

/**
 * Generate timestamp for filenames
 */
export function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}_${hours}${minutes}`;
}

/**
 * Export data with automatic filename
 */
export function exportData(data, columns, baseName = 'export') {
    const csv = toCSV(data, columns);
    const filename = `${baseName}_${getTimestamp()}.csv`;
    downloadFile(csv, filename, 'text/csv');
}

/**
 * Export as TSV and copy to clipboard
 */
export async function exportToClipboard(data, columns) {
    const tsv = toTSV(data, columns);
    const success = await copyToClipboard(tsv);
    return success;
}

/**
 * Format data for display in modal or alert
 */
export function formatForDisplay(data, maxRows = 10) {
    if (!data || data.length === 0) {
        return 'No data to display';
    }
    
    const displayData = data.slice(0, maxRows);
    const columns = Object.keys(displayData[0]);
    
    // Create ASCII table
    let output = columns.join('\t') + '\n';
    output += columns.map(() => '---').join('\t') + '\n';
    
    displayData.forEach(row => {
        output += columns.map(col => row[col] ?? '').join('\t') + '\n';
    });
    
    if (data.length > maxRows) {
        output += `\n... and ${data.length - maxRows} more rows`;
    }
    
    return output;
}

/**
 * Show success/error toast notification
 */
export function showToast(message, type = 'success') {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background-color: ${type === 'success' ? '#16a34a' : '#dc2626'};
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add CSS animations if not already present
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}
