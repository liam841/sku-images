// Global state
let linnworksData = null;
let shopifyData = null;
let outputData = null;

// DOM elements
const elements = {
    uploadLinnworks: () => document.getElementById('uploadLinnworks'),
    uploadShopify: () => document.getElementById('uploadShopify'),
    linnFileLabel: () => document.getElementById('linnFileLabel'),
    shopFileLabel: () => document.getElementById('shopFileLabel'),
    linnworksColumn: () => document.getElementById('linnworksColumn'),
    shopifyColumn: () => document.getElementById('shopifyColumn'),
    validateColumns: () => document.getElementById('validateColumns'),
    caseInsensitive: () => document.getElementById('caseInsensitive'),
    normalizeSpaces: () => document.getElementById('normalizeSpaces'),
    processBtn: () => document.getElementById('processBtn'),
    exportBtn: () => document.getElementById('exportBtn'),
    clearBtn: () => document.getElementById('clearBtn'),
    linnTable: () => document.getElementById('linnTable'),
    shopTable: () => document.getElementById('shopTable'),
    outputTable: () => document.getElementById('outputTable'),
    statusText: () => document.getElementById('statusText'),
    linnworksInput: () => document.getElementById('linnworksInput'),
    shopifyInput: () => document.getElementById('shopifyInput')
};

// Utility functions
function setStatus(text) {
    elements.statusText().textContent = text;
}

function shortenName(name, maxLen = 50) {
    if (name.length <= maxLen) return name;
    const head = Math.floor(maxLen / 2) - 2;
    const tail = maxLen - head - 3;
    return `${name.substring(0, head)}...${name.substring(name.length - tail)}`;
}

function normalizeValue(value, caseInsensitive, normalizeSpaces) {
    let normalized = String(value || '').replace(/\u200b/g, '');
    
    if (normalizeSpaces) {
        normalized = normalized.replace(/\s+/g, ' ').trim();
    } else {
        normalized = normalized.trim();
    }
    
    if (caseInsensitive) {
        normalized = normalized.toLowerCase();
    }
    
    return normalized;
}

function guessOrderColumn(columns) {
    const candidates = [
        'Order Number', 'OrderNumber', 'order_number',
        'Name', 'name', 'Order Id', 'OrderID', 'order_id',
        'Order', 'Id', 'ID'
    ];
    
    const lowerMap = {};
    columns.forEach(col => {
        lowerMap[col.toLowerCase()] = col;
    });
    
    for (const candidate of candidates) {
        if (lowerMap[candidate.toLowerCase()]) {
            return lowerMap[candidate.toLowerCase()];
        }
    }
    
    return columns[0] || '';
}

function populateSelect(selectElement, columns, selectedValue = '') {
    selectElement.innerHTML = '<option value="">Select column...</option>';
    
    columns.forEach(col => {
        const option = document.createElement('option');
        option.value = col;
        option.textContent = col;
        selectElement.appendChild(option);
    });
    
    if (selectedValue && columns.includes(selectedValue)) {
        selectElement.value = selectedValue;
    } else if (columns.length > 0) {
        const guessed = guessOrderColumn(columns);
        selectElement.value = guessed;
    }
}

function updateTablePreview(tableElement, data, maxRows = 10) {
    const thead = tableElement.querySelector('thead');
    const tbody = tableElement.querySelector('tbody');
    
    // Clear existing content
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    if (!data || data.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.textContent = 'No data';
        cell.colSpan = 1;
        return;
    }
    
    // Create header
    const headerRow = thead.insertRow();
    const columns = Object.keys(data[0]);
    
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
    });
    
    // Create data rows
    const previewData = data.slice(0, maxRows);
    previewData.forEach(rowData => {
        const row = tbody.insertRow();
        columns.forEach(col => {
            const cell = row.insertCell();
            cell.textContent = rowData[col] || '';
        });
    });
}

function updateProcessButtonState() {
    const hasLinnworks = linnworksData && linnworksData.length > 0;
    const hasShopify = shopifyData && shopifyData.length > 0;
    const hasLinnColumn = elements.linnworksColumn().value;
    const hasShopColumn = elements.shopifyColumn().value;
    
    elements.processBtn().disabled = !(hasLinnworks && hasShopify && hasLinnColumn && hasShopColumn);
}

function parseCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
                } else {
                    resolve(results.data);
                }
            },
            error: (error) => {
                reject(error);
            }
        });
    });
}

// Event handlers
async function handleFileUpload(type) {
    const input = type === 'linnworks' ? elements.linnworksInput() : elements.shopifyInput();
    const file = input.files[0];
    
    if (!file) {
        setStatus('File selection cancelled');
        return;
    }
    
    try {
        setStatus(`Loading ${type} CSV...`);
        const data = await parseCSV(file);
        
        if (data.length === 0) {
            setStatus(`${type} CSV is empty`);
            alert(`The selected ${type} CSV is empty.`);
            return;
        }
        
        if (type === 'linnworks') {
            linnworksData = data;
            updateTablePreview(elements.linnTable(), data);
            populateSelect(elements.linnworksColumn(), Object.keys(data[0]));
            elements.linnworksColumn().disabled = false;
            elements.linnFileLabel().textContent = `Linnworks: ${shortenName(file.name)}`;
            setStatus('Loaded Linnworks CSV');
        } else {
            shopifyData = data;
            updateTablePreview(elements.shopTable(), data);
            populateSelect(elements.shopifyColumn(), Object.keys(data[0]));
            elements.shopifyColumn().disabled = false;
            elements.shopFileLabel().textContent = `Shopify: ${shortenName(file.name)}`;
            setStatus('Loaded Shopify CSV');
        }
        
        updateProcessButtonState();
    } catch (error) {
        setStatus('Error loading CSV');
        alert(`Failed to load CSV: ${error.message}`);
    }
}

function validateColumns() {
    if (!linnworksData || !shopifyData) {
        alert('Please upload both Linnworks and Shopify CSV files first.');
        return;
    }
    
    const linnColumn = elements.linnworksColumn().value;
    const shopColumn = elements.shopifyColumn().value;
    
    if (!linnColumn || !shopColumn) {
        alert('Please select matching columns for both files.');
        return;
    }
    
    const linnColumns = Object.keys(linnworksData[0]);
    const shopColumns = Object.keys(shopifyData[0]);
    
    if (!linnColumns.includes(linnColumn)) {
        alert(`Linnworks column '${linnColumn}' not found.`);
        return;
    }
    
    if (!shopColumns.includes(shopColumn)) {
        alert(`Shopify column '${shopColumn}' not found.`);
        return;
    }
    
    alert('Matching columns are valid. You can Process now.');
    setStatus('Columns validated');
    updateProcessButtonState();
}

function processOrders() {
    if (!linnworksData || !shopifyData) {
        alert('Please upload both Linnworks and Shopify CSV files first.');
        return;
    }
    
    const linnColumn = elements.linnworksColumn().value;
    const shopColumn = elements.shopifyColumn().value;
    
    if (!linnColumn || !shopColumn) {
        alert('Please select matching columns for both files.');
        return;
    }
    
    try {
        setStatus('Processing orders...');
        
        const caseInsensitive = elements.caseInsensitive().checked;
        const normalizeSpaces = elements.normalizeSpaces().checked;
        
        // Normalize Shopify keys
        const shopifyKeys = new Set();
        shopifyData.forEach(row => {
            const value = normalizeValue(row[shopColumn], caseInsensitive, normalizeSpaces);
            if (value) shopifyKeys.add(value);
        });
        
        // Find Linnworks orders not in Shopify
        const results = linnworksData.filter(row => {
            const value = normalizeValue(row[linnColumn], caseInsensitive, normalizeSpaces);
            return value && !shopifyKeys.has(value);
        });
        
        if (results.length === 0) {
            alert('No Linnworks orders eligible to process were found.');
            outputData = null;
            elements.exportBtn().disabled = true;
            updateTablePreview(elements.outputTable(), []);
            setStatus('No eligible orders found');
            return;
        }
        
        outputData = results;
        elements.exportBtn().disabled = false;
        updateTablePreview(elements.outputTable(), results);
        
        alert(`Found ${results.length} Linnworks orders not in Shopify unfulfilled list.`);
        setStatus(`Processed: ${results.length} orders ready to export`);
    } catch (error) {
        setStatus('Error during processing');
        alert(`Failed to process orders: ${error.message}`);
    }
}

function exportCSV() {
    if (!outputData || outputData.length === 0) {
        alert('Please process first; no results to export.');
        return;
    }
    
    try {
        const csv = Papa.unparse(outputData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', 'output.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setStatus('Exported CSV successfully');
    } catch (error) {
        setStatus('Error saving CSV');
        alert(`Failed to save CSV: ${error.message}`);
    }
}

function clearState() {
    // Reset data
    linnworksData = null;
    shopifyData = null;
    outputData = null;
    
    // Reset file labels
    elements.linnFileLabel().textContent = 'Linnworks: (no file)';
    elements.shopFileLabel().textContent = 'Shopify: (no file)';
    
    // Reset dropdowns
    elements.linnworksColumn().innerHTML = '<option value="">Select column...</option>';
    elements.shopifyColumn().innerHTML = '<option value="">Select column...</option>';
    elements.linnworksColumn().disabled = true;
    elements.shopifyColumn().disabled = true;
    
    // Reset previews
    updateTablePreview(elements.linnTable(), []);
    updateTablePreview(elements.shopTable(), []);
    updateTablePreview(elements.outputTable(), []);
    
    // Reset buttons
    elements.processBtn().disabled = true;
    elements.exportBtn().disabled = true;
    
    // Reset options
    elements.caseInsensitive().checked = true;
    elements.normalizeSpaces().checked = true;
    
    // Clear file inputs
    elements.linnworksInput().value = '';
    elements.shopifyInput().value = '';
    
    setStatus('Cleared state');
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Upload buttons
    elements.uploadLinnworks().addEventListener('click', () => {
        elements.linnworksInput().click();
    });
    
    elements.uploadShopify().addEventListener('click', () => {
        elements.shopifyInput().click();
    });
    
    // File inputs
    elements.linnworksInput().addEventListener('change', () => {
        handleFileUpload('linnworks');
    });
    
    elements.shopifyInput().addEventListener('change', () => {
        handleFileUpload('shopify');
    });
    
    // Column validation
    elements.validateColumns().addEventListener('click', validateColumns);
    
    // Process and export
    elements.processBtn().addEventListener('click', processOrders);
    elements.exportBtn().addEventListener('click', exportCSV);
    elements.clearBtn().addEventListener('click', clearState);
    
    // Update process button state when columns change
    elements.linnworksColumn().addEventListener('change', updateProcessButtonState);
    elements.shopifyColumn().addEventListener('change', updateProcessButtonState);
    
    setStatus('Ready');
});
