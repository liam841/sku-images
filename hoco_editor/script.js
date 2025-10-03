// Global variables
let selectedFiles = [];
let processedFiles = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

function setupEventListeners() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    // File input change event
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Click to upload - prevent double triggering
    uploadArea.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    
    if (files.length > 0) {
        addFiles(files);
    } else {
        showMessage('Please select .xlsx files only.', 'error');
    }
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        addFiles(files);
    }
    // Clear the input so the same file can be selected again if needed
    e.target.value = '';
}

function addFiles(files) {
    const validFiles = files.filter(file => 
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    
    if (validFiles.length === 0) {
        showMessage('Please select valid .xlsx files.', 'error');
        return;
    }
    
    // Add files to the list
    validFiles.forEach(file => {
        if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.push(file);
        }
    });
    
    updateFileList();
    updateProcessButton();
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    updateProcessButton();
}

function clearFiles() {
    selectedFiles = [];
    updateFileList();
    updateProcessButton();
}

function updateFileList() {
    const fileList = document.getElementById('fileList');
    const fileListItems = document.getElementById('fileListItems');
    
    if (selectedFiles.length === 0) {
        fileList.style.display = 'none';
        return;
    }
    
    fileList.style.display = 'block';
    fileListItems.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${file.name} (${formatFileSize(file.size)})</span>
            <button class="remove-file" onclick="removeFile(${index})">Remove</button>
        `;
        fileListItems.appendChild(li);
    });
}

function updateProcessButton() {
    const processButton = document.getElementById('processButton');
    processButton.disabled = selectedFiles.length === 0;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function processFiles() {
    if (selectedFiles.length === 0) return;
    
    const processButton = document.getElementById('processButton');
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const results = document.getElementById('results');
    
    // Reset UI
    processedFiles = [];
    processButton.disabled = true;
    processButton.innerHTML = '<span class="loading"></span>Processing...';
    progressSection.style.display = 'block';
    results.style.display = 'none';
    
    try {
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            progressText.textContent = `Processing ${file.name}...`;
            
            // Process the file
            const processedData = await processExcelFile(file);
            processedFiles.push({
                name: file.name.replace('.xlsx', '_processed.csv'),
                data: processedData
            });
            
            // Update progress
            const progress = ((i + 1) / selectedFiles.length) * 100;
            progressFill.style.width = progress + '%';
        }
        
        // Show results
        showResults();
        
    } catch (error) {
        console.error('Processing error:', error);
        showMessage('Error processing files: ' + error.message, 'error');
    } finally {
        processButton.disabled = false;
        processButton.innerHTML = '🚀 Process Files';
        progressSection.style.display = 'none';
    }
}

async function processExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Get the first worksheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // Apply transformations
                const transformedData = applyTransformations(jsonData);
                
                // Convert back to CSV
                const csvData = arrayToCSV(transformedData);
                
                resolve(csvData);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

function applyTransformations(data) {
    if (!data || data.length === 0) return [];
    
    // Convert to array of objects for easier manipulation
    const headers = data[0];
    const rows = data.slice(1);
    
    // Delete columns A & C (indices 0 & 2)
    const filteredHeaders = headers.filter((_, index) => index !== 0 && index !== 2);
    const filteredRows = rows.map(row => 
        row.filter((_, index) => index !== 0 && index !== 2)
    );
    
    // Rename columns
    const newHeaders = [];
    if (filteredHeaders.length >= 1) newHeaders.push('SKU');
    if (filteredHeaders.length >= 2) newHeaders.push('Stock Level');
    
    // Add Location column
    newHeaders.push('Location');
    
    // Process rows
    const processedRows = filteredRows.map(row => {
        const newRow = [...row];
        
        // Add Location column
        newRow.push('Hoco Parts');
        
        // Process Stock Level column (remove commas)
        if (newRow.length >= 2 && newRow[1] !== undefined) {
            const stockLevel = newRow[1];
            if (typeof stockLevel === 'string' || typeof stockLevel === 'number') {
                const cleanValue = stockLevel.toString().replace(/,/g, '').replace(/\s/g, '');
                const numericValue = parseFloat(cleanValue);
                if (!isNaN(numericValue)) {
                    newRow[1] = numericValue;
                }
            }
        }
        
        return newRow;
    });
    
    return [newHeaders, ...processedRows];
}

function arrayToCSV(data) {
    return data.map(row => 
        row.map(cell => {
            if (cell === null || cell === undefined) return '';
            const str = String(cell);
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        }).join(',')
    ).join('\n');
}

function showResults() {
    const results = document.getElementById('results');
    const resultsText = document.getElementById('resultsText');
    const downloadSection = document.getElementById('downloadSection');
    
    resultsText.textContent = `Successfully processed ${processedFiles.length} file(s).`;
    
    // Create download buttons
    downloadSection.innerHTML = '';
    processedFiles.forEach(file => {
        const button = document.createElement('button');
        button.className = 'download-button';
        button.textContent = `📥 Download ${file.name}`;
        button.onclick = () => downloadFile(file.name, file.data);
        downloadSection.appendChild(button);
    });
    
    results.style.display = 'block';
}

function downloadFile(filename, data) {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function showMessage(message, type = 'info') {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
    `;
    
    if (type === 'error') {
        toast.style.backgroundColor = '#FF3B30';
    } else {
        toast.style.backgroundColor = '#007AFF';
    }
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// Add CSS animations for toast notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
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
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
