


let rowCount = 1;
const maxRows = 100;
let selectedRowId = null;
let rowIds = [1];
let invoiceCounter = 1;
let savedInvoices = [];
let currentInvoiceIndex = -1;

// Initialize the system
document.addEventListener('DOMContentLoaded', function() {
    // Load from localStorage
    loadInvoicesFromStorage();
    loadInvoiceCounterFromStorage();
    
    // Load customer list for autocomplete
    loadCustomerList();
    
    
    initializeInvoice();
    addEventListenersToRow(1);
    document.getElementById('discount').addEventListener('input', updateInvoiceSum);
    document.getElementById('discount-type').addEventListener('change', updateDiscountType);
    document.getElementById('currency').addEventListener('change', updateCurrencySymbol);
    document.getElementById('customer-account').addEventListener('input', updateCustomerInfoDisplay);
    document.getElementById('customer-account').addEventListener('keydown', function(event) {
        if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
            // Quick search functionality for customers
            event.preventDefault();
            
            const letter = event.key.toUpperCase();
            const matchingCustomers = getAllCustomers().filter(customer => 
                customer.name.toUpperCase().startsWith(letter)
            );
            
            if (matchingCustomers.length > 0) {
                showCustomerSearchResults(matchingCustomers, event.target);
            } else {
                showNotification(`No customers found starting with "${letter}"`, 'info');
            }
        }
    });
    document.getElementById('payment-method').addEventListener('change', updateCustomerInfoDisplay);
    document.getElementById('currency').addEventListener('change', updateCustomerInfoDisplay);
    
    
    updateNavigationButtons();
});

function initializeInvoice() {
    // Set current date
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('invoice-date').textContent = dateString;
    
    // Generate invoice number
    const invoiceNumber = 'INV-' + String(invoiceCounter).padStart(4, '0');
    document.getElementById('invoice-number').textContent = invoiceNumber;
}

function addEventListenersToRow(rowNumber) {
    const barcodeInput = document.getElementById(`barcode-${rowNumber}`);
    const itemNameInput = document.getElementById(`item-name-${rowNumber}`);
    const quantityInput = document.getElementById(`quantity-${rowNumber}`);
    const priceInput = document.getElementById(`retail-price-${rowNumber}`);
    const noteInput = document.getElementById(`note-${rowNumber}`);
    
    if (quantityInput && priceInput) {
        quantityInput.addEventListener('input', () => updateRowTotal(rowNumber));
        priceInput.addEventListener('input', () => updateRowTotal(rowNumber));
        quantityInput.addEventListener('focus', () => addLoadingEffect(quantityInput));
        priceInput.addEventListener('focus', () => addLoadingEffect(priceInput));
    }
    
    // Add Enter key navigation for all inputs
    if (barcodeInput) {
        barcodeInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                itemNameInput.focus();
            }
        });
    }
    
    if (itemNameInput) {
        // Add input event for search suggestions
        itemNameInput.addEventListener('input', (event) => {
            const query = event.target.value.trim();
            if (query.length > 0) {
                showItemSuggestions(query, rowNumber);
            } else {
                hideItemSuggestions(rowNumber);
            }
        });
        
        // Add keydown events
        itemNameInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                quantityInput.focus();
            } else if (event.key === 'Escape') {
                hideItemSuggestions(rowNumber);
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                navigateSuggestions(rowNumber, 'down');
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                navigateSuggestions(rowNumber, 'up');
            }
        });
        
        // Hide suggestions when clicking outside
        itemNameInput.addEventListener('blur', () => {
            setTimeout(() => hideItemSuggestions(rowNumber), 200);
        });
    }
    
    if (quantityInput) {
        quantityInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                priceInput.focus();
            }
        });
    }
    
    if (priceInput) {
        priceInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                noteInput.focus();
            }
        });
    }
    
    if (noteInput) {
        noteInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                addRow();
            }
        });
    }
}

function addLoadingEffect(element) {
    element.classList.add('loading');
    setTimeout(() => {
        element.classList.remove('loading');
    }, 1000);
}

function updateRowTotal(rowNumber) {
    const quantity = parseFloat(document.getElementById(`quantity-${rowNumber}`).value) || 0;
    const retailPrice = parseFloat(document.getElementById(`retail-price-${rowNumber}`).value) || 0;
    const total = quantity * retailPrice;
    document.getElementById(`total-${rowNumber}`).value = total.toFixed(2);
    updateInvoiceSum();
}

function updateInvoiceSum() {
    let subtotal = 0;
    let totalQuantity = 0;
    
    rowIds.forEach(rowId => {
        const totalElement = document.getElementById(`total-${rowId}`);
        const quantityElement = document.getElementById(`quantity-${rowId}`);
        if (totalElement && quantityElement) {
            const rowTotal = parseFloat(totalElement.value) || 0;
            const quantity = parseFloat(quantityElement.value) || 0;
            subtotal += rowTotal;
            totalQuantity += quantity;
        }
    });
    
    const discountType = document.getElementById('discount-type').value;
    const discountInput = parseFloat(document.getElementById('discount').value) || 0;
    
    let discount = 0;
    if (discountType === 'percentage') {
        discount = (subtotal * discountInput) / 100;
    } else {
        discount = discountInput;
    }
    
    const finalTotal = subtotal - discount;
    
    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('total-sum').textContent = Math.max(0, finalTotal).toFixed(2);
    document.getElementById('total-quantity').textContent = totalQuantity;
}

function updateDiscountType() {
    const discountType = document.getElementById('discount-type').value;
    const discountInput = document.getElementById('discount');
    
    if (discountType === 'percentage') {
        discountInput.max = 100;
        discountInput.step = 0.01;
        discountInput.placeholder = '0.00';
    } else {
        discountInput.max = '';
        discountInput.step = 0.01;
        discountInput.placeholder = '0.00';
    }
    
    // Recalculate totals when discount type changes
    updateInvoiceSum();
}

function updateCurrencySymbol() {
    const currency = document.getElementById('currency').value;
    const symbol = currency === 'IQD' ? 'د.ع' : '$';
    document.getElementById('currency-symbol').textContent = symbol;
    document.getElementById('final-currency-symbol').textContent = symbol;
}

function updateCustomerInfoDisplay() {
    const customerAccount = document.getElementById('customer-account').value || '-';
    console.log('Customer Account:', document.getElementById('customer-account').value);
    const paymentMethod = document.getElementById('payment-method').value;
    const currency = document.getElementById('currency').value;
    
    // Format payment method for display
    const paymentMethodText = {
        'on-account': 'On Account',
        'cash': 'Cash',
        'card': 'Card',
        'check': 'Check',
        'bank-transfer': 'Bank Transfer'
    }[paymentMethod] || paymentMethod;
    
    // Format currency for display
    const currencyText = currency === 'IQD' ? 'IQD (د.ع)' : 'USD ($)';
    
    document.getElementById('display-customer-account').textContent = customerAccount;
    document.getElementById('display-payment-method').textContent = paymentMethodText;
    document.getElementById('display-currency').textContent = currencyText;
}

function selectRow(rowId) {
    const allRows = document.querySelectorAll('#invoice-tbody tr');
    allRows.forEach(row => row.classList.remove('selected'));
    
    const selectedRow = document.getElementById(`row-${rowId}`);
    if (selectedRow) {
        if (selectedRowId === rowId) {
            selectedRowId = null;
            document.getElementById('delete-selected-btn').disabled = true;
        } else {
            selectedRow.classList.add('selected');
            selectedRowId = rowId;
            document.getElementById('delete-selected-btn').disabled = false;
        }
    }
}

function deleteSelectedRow() {
    if (!selectedRowId) {
        showNotification("Please select a row to delete.", "warning");
        return;
    }

    if (rowIds.length <= 1) {
        showNotification("Cannot delete the last remaining row.", "error");
        return;
    }

    if (confirm(`Are you sure you want to delete row ${selectedRowId}?`)) {
        const rowToDelete = document.getElementById(`row-${selectedRowId}`);
        if (rowToDelete) {
            rowToDelete.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                rowToDelete.remove();
                const index = rowIds.indexOf(selectedRowId);
                if (index > -1) {
                    rowIds.splice(index, 1);
                }
                renumberRows();
                selectedRowId = null;
                document.getElementById('delete-selected-btn').disabled = true;
                updateInvoiceSum();
                showNotification("Row deleted successfully.", "success");
            }, 300);
        }
    }
}

function renumberRows() {
    const tbody = document.getElementById('invoice-tbody');
    const rows = tbody.querySelectorAll('tr');
    const newRowIds = [];
    
    rows.forEach((row, index) => {
        const newRowNumber = index + 1;
        row.id = `row-${newRowNumber}`;
        row.querySelector('.row-number').textContent = newRowNumber;
        
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            const inputType = input.id.split('-')[0];
            input.id = `${inputType}-${newRowNumber}`;
        });
        
        row.setAttribute('onclick', `selectRow(${newRowNumber})`);
        addEventListenersToRow(newRowNumber);
        newRowIds.push(newRowNumber);
    });
    
    rowIds = newRowIds;
    rowCount = rowIds.length;
}

function addRow() {
    if (rowIds.length >= maxRows) {
        showNotification(`Maximum ${maxRows} rows allowed.`, "warning");
        return false;
    }

    const newRowId = Math.max(...rowIds) + 1;
    rowIds.push(newRowId);
    rowCount = rowIds.length;
    
    const tbody = document.getElementById('invoice-tbody');
    const newRow = document.createElement('tr');
    newRow.id = `row-${newRowId}`;
    newRow.setAttribute('onclick', `selectRow(${newRowId})`);
    newRow.style.animation = 'slideIn 0.3s ease-out';
    
    newRow.innerHTML = `
        <td class="row-number">${newRowId}</td>
        <td><input type="text" id="barcode-${newRowId}" placeholder="Scan barcode" onclick="event.stopPropagation()"></td>
        <td>
            <div style="position: relative;">
                <input type="text" id="item-name-${newRowId}" placeholder="Enter item name" onclick="event.stopPropagation()" autocomplete="off">
                <div id="item-suggestions-${newRowId}" class="item-suggestions" style="display: none;"></div>
            </div>
        </td>
        <td><input type="number" id="quantity-${newRowId}" value="" min="0" step="1" onclick="event.stopPropagation()"></td>
        <td><input type="number" id="retail-price-${newRowId}" value="" min="0" step="0.01" onclick="event.stopPropagation()"></td>
        <td><input type="number" id="total-${newRowId}" value="" disabled onclick="event.stopPropagation()"></td>
        <td><input type="text" id="note-${newRowId}" placeholder="Add note" onclick="event.stopPropagation()"></td>
    `;
    
    tbody.appendChild(newRow);
    addEventListenersToRow(newRowId);
    updateInvoiceSum();
    
    setTimeout(() => {
        document.getElementById(`barcode-${newRowId}`).focus();
    }, 300);
    
    return true;
}

function removeLastRow() {
    if (rowIds.length <= 1) {
        showNotification("Cannot remove the last remaining row.", "error");
        return false;
    }

    const lastRowId = Math.max(...rowIds);
    const rowToRemove = document.getElementById(`row-${lastRowId}`);
    if (rowToRemove) {
        rowToRemove.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            rowToRemove.remove();
            const index = rowIds.indexOf(lastRowId);
            if (index > -1) {
                rowIds.splice(index, 1);
            }
            rowCount = rowIds.length;
            
            if (selectedRowId === lastRowId) {
                selectedRowId = null;
                document.getElementById('delete-selected-btn').disabled = true;
            }
            
            updateInvoiceSum();
            showNotification("Last row removed successfully.", "success");
        }, 300);
    }
    
    return true;
}

function saveInvoice() {
    // Use the enhanced save function with customer integration
    saveInvoiceWithCustomerIntegration();
}

function newInvoice() {
    // Save current invoice if it has data
    if (hasInvoiceData()) {
        saveInvoice();
    }
    
    // Slide animation to new invoice
    const container = document.querySelector('.invoice-container');
    container.style.animation = 'slideOutLeft 0.3s ease-in';
    
    setTimeout(() => {
        // Clear current invoice data
        clearCurrentInvoice();
        
        // Generate new invoice number
        const newInvoiceNumber = 'INV-' + String(invoiceCounter).padStart(4, '0');
        document.getElementById('invoice-number').textContent = newInvoiceNumber;
        
        // Reset current invoice index
        currentInvoiceIndex = -1;
        
        // Update navigation buttons
        updateNavigationButtons();
        
        // Slide in animation
        container.style.animation = 'slideInRight 0.3s ease-out';
        
        showNotification("New invoice created!", "success");
    }, 300);
}

function hasInvoiceData() {
    // Check if current invoice has any data
    const customerAccount = document.getElementById('customer-account').value;
    const hasItems = rowIds.some(rowId => {
        const barcode = document.getElementById(`barcode-${rowId}`).value;
        const itemName = document.getElementById(`item-name-${rowId}`).value;
        const quantity = parseFloat(document.getElementById(`quantity-${rowId}`).value) || 0;
        const price = parseFloat(document.getElementById(`retail-price-${rowId}`).value) || 0;
        return barcode || itemName || quantity > 0 || price > 0;
    });
    
    return customerAccount || hasItems;
}

function clearCurrentInvoice() {
    // Reset form fields
    document.getElementById('customer-account').value = '';
    document.getElementById('currency').value = 'USD';
    document.getElementById('payment-method').value = 'on-account';
    document.getElementById('discount-type').value = 'amount';
    document.getElementById('discount').value = '0.00';
    
    // Reset selection
    selectedRowId = null;
    document.getElementById('delete-selected-btn').disabled = true;
    
    // Remove all rows except the first one
    while (rowIds.length > 1) {
        removeLastRow();
    }
    
    // Clear the first row
    const firstRowId = rowIds[0];
    document.getElementById(`barcode-${firstRowId}`).value = '';
    document.getElementById(`item-name-${firstRowId}`).value = '';
    document.getElementById(`quantity-${firstRowId}`).value = '';
    document.getElementById(`retail-price-${firstRowId}`).value = '';
    document.getElementById(`total-${firstRowId}`).value = '';
    document.getElementById(`note-${firstRowId}`).value = '';
    
    updateCurrencySymbol();
    updateCustomerInfoDisplay();
    updateInvoiceSum();
}

function previousInvoice() {
    console.log(`Previous invoice clicked. Current index: ${currentInvoiceIndex}, Total invoices: ${savedInvoices.length}`);
    
    if (savedInvoices.length === 0) {
        showNotification("No saved invoices to navigate to.", "warning");
        return;
    }
    
    if (currentInvoiceIndex > 0) {
        currentInvoiceIndex--;
        loadInvoice(currentInvoiceIndex, 'previous');
        showNotification(`Loading invoice ${currentInvoiceIndex + 1} of ${savedInvoices.length}`, "info");
    } else if (currentInvoiceIndex === 0) {
        // Go to the last invoice (wrap around)
        currentInvoiceIndex = savedInvoices.length - 1;
        loadInvoice(currentInvoiceIndex, 'previous');
        showNotification(`Loading invoice ${currentInvoiceIndex + 1} of ${savedInvoices.length}`, "info");
    } else {
        // currentInvoiceIndex is -1 (new invoice), go to last saved invoice
        currentInvoiceIndex = savedInvoices.length - 1;
        loadInvoice(currentInvoiceIndex, 'previous');
        showNotification(`Loading invoice ${currentInvoiceIndex + 1} of ${savedInvoices.length}`, "info");
    }
}

function nextInvoice() {
    console.log(`Next invoice clicked. Current index: ${currentInvoiceIndex}, Total invoices: ${savedInvoices.length}`);
    
    if (savedInvoices.length === 0) {
        showNotification("No saved invoices to navigate to.", "warning");
        return;
    }
    
    if (currentInvoiceIndex < savedInvoices.length - 1) {
        currentInvoiceIndex++;
        loadInvoice(currentInvoiceIndex, 'next');
        showNotification(`Loading invoice ${currentInvoiceIndex + 1} of ${savedInvoices.length}`, "info");
    } else if (currentInvoiceIndex === savedInvoices.length - 1) {
        // Go to the first invoice (wrap around)
        currentInvoiceIndex = 0;
        loadInvoice(currentInvoiceIndex, 'next');
        showNotification(`Loading invoice ${currentInvoiceIndex + 1} of ${savedInvoices.length}`, "info");
    } else {
        // currentInvoiceIndex is -1 (new invoice), go to first saved invoice
        currentInvoiceIndex = 0;
        loadInvoice(currentInvoiceIndex, 'next');
        showNotification(`Loading invoice ${currentInvoiceIndex + 1} of ${savedInvoices.length}`, "info");
    }
}


function loadInvoice(index, direction = 'next') {
    if (index < 0 || index >= savedInvoices.length) {
        console.error(`Invalid invoice index: ${index}. Total invoices: ${savedInvoices.length}`);
        showNotification("Error: Invalid invoice index.", "error");
        return;
    }
    
    console.log(`Loading invoice at index ${index}, direction: ${direction}`);
    const invoice = savedInvoices[index];
    
    // Validate invoice data
    if (!invoice) {
        console.error(`Invoice at index ${index} is null or undefined`);
        showNotification("Error: Invoice data is corrupted.", "error");
        return;
    }
    
    // Directional slide animation
    const container = document.querySelector('.invoice-container');
    if (!container) {
        console.error('Invoice container not found');
        showNotification("Error: Invoice container not found.", "error");
        return;
    }
    
    // Determine slide direction
    if (direction === 'previous') {
        container.style.animation = 'slideOutRight 0.3s ease-in';
    } else {
        container.style.animation = 'slideOutLeft 0.3s ease-in';
    }
    
    setTimeout(() => {
        try {
            // Load invoice data with null checks
            const invoiceNumberEl = document.getElementById('invoice-number');
            const customerAccountEl = document.getElementById('customer-account');
            const currencyEl = document.getElementById('currency');
            const paymentMethodEl = document.getElementById('payment-method');
            const discountTypeEl = document.getElementById('discount-type');
            const discountEl = document.getElementById('discount');
            
            if (invoiceNumberEl) invoiceNumberEl.textContent = invoice.invoiceNumber || 'INV-0000';
            if (customerAccountEl) customerAccountEl.value = invoice.customerAccount || '';
            if (currencyEl) currencyEl.value = invoice.currency || 'USD';
            if (paymentMethodEl) paymentMethodEl.value = invoice.paymentMethod || 'on-account';
            if (discountTypeEl) discountTypeEl.value = invoice.discountType || 'amount';
            if (discountEl) discountEl.value = invoice.discountInput || 0;
        
            // Clear current rows
            while (rowIds.length > 0) {
                if (rowIds.length === 1) {
                    clearFirstRow();
                } else {
                    removeLastRow();
                }
            }
            
            // Add rows for invoice items with error handling
            if (invoice.items && Array.isArray(invoice.items)) {
                invoice.items.forEach((item, idx) => {
                    if (idx === 0) {
                        // Use first row
                        rowIds = [1];
                        loadRowData(1, item);
                    } else {
                        // Add new rows
                        addRow();
                        loadRowData(rowIds[rowIds.length - 1], item);
                    }
                });
            } else {
                console.warn('Invoice items is not an array or is missing');
            }
            
            // If no items, ensure we have at least one empty row
            if (!invoice.items || invoice.items.length === 0) {
                rowIds = [1];
                clearFirstRow();
            }
            
            updateCurrencySymbol();
            updateCustomerInfoDisplay();
            updateInvoiceSum();
            updateNavigationButtons();
            
            // Directional slide in animation
            if (direction === 'previous') {
                container.style.animation = 'slideInLeft 0.3s ease-out';
            } else {
                container.style.animation = 'slideInRight 0.3s ease-out';
            }
        } catch (error) {
            console.error('Error loading invoice:', error);
            showNotification('Error loading invoice: ' + error.message, 'error');
            
            // Reset to safe state
            currentInvoiceIndex = -1;
            updateNavigationButtons();
        }
    }, 300);
}

function loadRowData(rowId, item) {
    try {
        if (!item) {
            console.warn(`Item data is null for row ${rowId}`);
            return;
        }
        
        const barcodeEl = document.getElementById(`barcode-${rowId}`);
        const itemNameEl = document.getElementById(`item-name-${rowId}`);
        const quantityEl = document.getElementById(`quantity-${rowId}`);
        const priceEl = document.getElementById(`retail-price-${rowId}`);
        const totalEl = document.getElementById(`total-${rowId}`);
        const noteEl = document.getElementById(`note-${rowId}`);
        
        if (barcodeEl) barcodeEl.value = item.barcode || '';
        if (itemNameEl) itemNameEl.value = item.itemName || '';
        if (quantityEl) quantityEl.value = item.quantity || 0;
        if (priceEl) priceEl.value = item.retailPrice || 0;
        if (totalEl) totalEl.value = item.total || 0;
        if (noteEl) noteEl.value = item.note || '';
    } catch (error) {
        console.error(`Error loading row data for row ${rowId}:`, error);
    }
}

function clearFirstRow() {
    try {
        if (rowIds.length === 0) {
            console.warn('No rows to clear');
            return;
        }
        
        const firstRowId = rowIds[0];
        const barcodeEl = document.getElementById(`barcode-${firstRowId}`);
        const itemNameEl = document.getElementById(`item-name-${firstRowId}`);
        const quantityEl = document.getElementById(`quantity-${firstRowId}`);
        const priceEl = document.getElementById(`retail-price-${firstRowId}`);
        const totalEl = document.getElementById(`total-${firstRowId}`);
        const noteEl = document.getElementById(`note-${firstRowId}`);
        
        if (barcodeEl) barcodeEl.value = '';
        if (itemNameEl) itemNameEl.value = '';
        if (quantityEl) quantityEl.value = '';
        if (priceEl) priceEl.value = '';
        if (totalEl) totalEl.value = '';
        if (noteEl) noteEl.value = '';
    } catch (error) {
        console.error('Error clearing first row:', error);
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const counter = document.getElementById('invoice-counter');
    
    console.log(`Updating navigation buttons. Current index: ${currentInvoiceIndex}, Total invoices: ${savedInvoices.length}`);
    
    // Always enable navigation buttons if we have saved invoices (with wrap-around)
    prevBtn.disabled = savedInvoices.length === 0;
    nextBtn.disabled = savedInvoices.length === 0;
    
    // Update counter display with more detailed information
    if (savedInvoices.length === 0) {
        counter.textContent = "New Invoice";
        counter.title = "No saved invoices available";
        prevBtn.disabled = true;
        nextBtn.disabled = true;
    } else if (currentInvoiceIndex === -1) {
        const newInvoiceNumber = `INV-${String(invoiceCounter).padStart(4, '0')}`;
        counter.textContent = `New (${newInvoiceNumber}) / ${savedInvoices.length}`;
        counter.title = `Creating new invoice ${newInvoiceNumber}. ${savedInvoices.length} saved invoices available.`;
        // Enable both buttons when on new invoice
        prevBtn.disabled = false;
        nextBtn.disabled = false;
    } else {
        const current = currentInvoiceIndex + 1;
        const total = savedInvoices.length;
        const currentInvoiceNumber = savedInvoices[currentInvoiceIndex].invoiceNumber;
        counter.textContent = `${currentInvoiceNumber} (${current}/${total})`;
        counter.title = `Currently viewing ${currentInvoiceNumber}. ${current} of ${total} saved invoices.`;
        // Enable both buttons for navigation with wrap-around
        prevBtn.disabled = false;
        nextBtn.disabled = false;
    }
    
    // Add visual indicators for current position
    if (savedInvoices.length > 0) {
        prevBtn.title = currentInvoiceIndex === -1 ? 
            `Go to last invoice (${savedInvoices[savedInvoices.length - 1].invoiceNumber})` : 
            `Go to previous invoice (${currentInvoiceIndex > 0 ? savedInvoices[currentInvoiceIndex - 1].invoiceNumber : savedInvoices[savedInvoices.length - 1].invoiceNumber})`;
        nextBtn.title = currentInvoiceIndex === -1 ? 
            `Go to first invoice (${savedInvoices[0].invoiceNumber})` : 
            `Go to next invoice (${currentInvoiceIndex < savedInvoices.length - 1 ? savedInvoices[currentInvoiceIndex + 1].invoiceNumber : savedInvoices[0].invoiceNumber})`;
    }
}

// Function to jump to a specific invoice by number
function jumpToInvoice(invoiceNumber) {
    if (savedInvoices.length === 0) {
        showNotification("No saved invoices to navigate to.", "warning");
        return;
    }
    
    // Find the invoice by number
    const index = savedInvoices.findIndex(invoice => 
        invoice.invoiceNumber === invoiceNumber || 
        invoice.invoiceNumber === `INV-${String(invoiceNumber).padStart(4, '0')}`
    );
    
    if (index !== -1) {
        currentInvoiceIndex = index;
        loadInvoice(currentInvoiceIndex, 'next');
        showNotification(`Jumped to invoice ${invoiceNumber}`, "success");
    } else {
        showNotification(`Invoice ${invoiceNumber} not found.`, "error");
    }
}

// Function to show invoice list for quick navigation
function showInvoiceList() {
    console.log('Invoice list requested. Current state:', {
        savedInvoicesLength: savedInvoices.length,
        currentInvoiceIndex: currentInvoiceIndex,
        savedInvoices: savedInvoices
    });
    
    if (savedInvoices.length === 0) {
        showNotification("No saved invoices to display.", "warning");
        return;
    }
    
    let message = "Saved Invoices:\n";
    savedInvoices.forEach((invoice, index) => {
        const isCurrent = index === currentInvoiceIndex ? " ← Current" : "";
        message += `${index + 1}. ${invoice.invoiceNumber} - ${invoice.customerAccount || 'No customer'}${isCurrent}\n`;
    });
    
    alert(message);
}




function printInvoice() {
    // Update customer info display before printing
    updateCustomerInfoDisplay();
    setTimeout(() => {
        window.print();
    }, 1000);
}

function cancelInvoice() {
    if (confirm("Are you sure you want to cancel this invoice? All data will be lost.")) {
        // Reset form fields
        document.getElementById('customer-account').value = '';
        document.getElementById('currency').value = 'USD';
        document.getElementById('payment-method').value = 'on-account';
        document.getElementById('discount-type').value = 'amount';
        document.getElementById('discount').value = '0.00';
        
        // Reset selection
        selectedRowId = null;
        document.getElementById('delete-selected-btn').disabled = true;
        
        // Remove all rows except the first one
        while (rowIds.length > 1) {
            removeLastRow();
        }
        
        // Clear the first row
        const firstRowId = rowIds[0];
        document.getElementById(`barcode-${firstRowId}`).value = '';
        document.getElementById(`item-name-${firstRowId}`).value = '';
        document.getElementById(`quantity-${firstRowId}`).value = '';
        document.getElementById(`retail-price-${firstRowId}`).value = '';
        document.getElementById(`total-${firstRowId}`).value = '';
        document.getElementById(`note-${firstRowId}`).value = '';
        
        updateCurrencySymbol();
        updateCustomerInfoDisplay();
        updateInvoiceSum();
        showNotification("Invoice cancelled successfully.", "info");
    }
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    
    // Set color based on type
    switch(type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            break;
        case 'info':
            notification.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
            break;
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        saveInvoice();
    }
    
    if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        addRow();
    }
    
    
    if (event.key === 'Delete' && selectedRowId) {
        event.preventDefault();
        deleteSelectedRow();
    }
});

// localStorage functions for permanent data storage
function saveInvoicesToStorage() {
    try {
        localStorage.setItem('sonic_invoices', JSON.stringify(savedInvoices));
        console.log('Invoices saved to localStorage');
    } catch (error) {
        console.error('Error saving invoices to localStorage:', error);
        showNotification('Error saving invoices to storage', 'error');
    }
}

function loadInvoicesFromStorage() {
    try {
        const stored = localStorage.getItem('sonic_invoices');
        if (stored) {
            savedInvoices = JSON.parse(stored);
            console.log('Invoices loaded from localStorage:', savedInvoices.length);
        }
    } catch (error) {
        console.error('Error loading invoices from localStorage:', error);
        savedInvoices = [];
    }
}

function saveInvoiceCounterToStorage() {
    try {
        localStorage.setItem('sonic_invoice_counter', invoiceCounter.toString());
    } catch (error) {
        console.error('Error saving invoice counter:', error);
    }
}

function loadInvoiceCounterFromStorage() {
    try {
        const stored = localStorage.getItem('sonic_invoice_counter');
        if (stored) {
            invoiceCounter = parseInt(stored);
        }
    } catch (error) {
        console.error('Error loading invoice counter:', error);
    }
}

// Function to clear all saved data (for testing/reset)
function clearAllData() {
    if (confirm('Are you sure you want to clear all saved invoices? This cannot be undone.')) {
        localStorage.removeItem('sonic_invoices');
        localStorage.removeItem('sonic_invoice_counter');
        savedInvoices = [];
        invoiceCounter = 1;
        currentInvoiceIndex = -1;
        clearCurrentInvoice();
        updateNavigationButtons();
        showNotification('All data cleared', 'info');
    }
}

// Navigation functions for the integrated system
function openItemManagement() {
    window.open('items.html', '_blank');
}

function openCustomerManagement() {
    window.open('customers.html', '_blank');
}

function openDashboard() {
    window.open('dashboard.html', '_blank');
}

// Customer management integration
function loadCustomerList() {
    const customers = getAllCustomers();
    const datalist = document.getElementById('customer-list');
    
    datalist.innerHTML = customers.map(customer => 
        `<option value="${customer.name}" data-customer-id="${customer.id}">${customer.name} - ${customer.phone}</option>`
    ).join('');
}

function getCustomerByName(name) {
    const customers = getAllCustomers();
    return customers.find(customer => customer.name.toLowerCase() === name.toLowerCase());
}

// Enhanced save function to integrate with customer system
function saveInvoiceWithCustomerIntegration() {
    // Update customer info display before saving
    updateCustomerInfoDisplay();
    
    const customerName = document.getElementById('customer-account').value.trim();
    const customer = getCustomerByName(customerName);
    
    const invoiceData = {
        invoiceNumber: document.getElementById('invoice-number').textContent,
        date: document.getElementById('invoice-date').textContent,
        customerAccount: customerName,
        customerId: customer ? customer.id : null,
        currency: document.getElementById('currency').value,
        paymentMethod: document.getElementById('payment-method').value,
        items: [],
        totalQuantity: parseInt(document.getElementById('total-quantity').textContent) || 0,
        discountType: document.getElementById('discount-type').value,
        discountInput: parseFloat(document.getElementById('discount').value) || 0,
        discount: parseFloat(document.getElementById('discount').value) || 0,
        subtotal: parseFloat(document.getElementById('subtotal').textContent) || 0,
        total: parseFloat(document.getElementById('total-sum').textContent) || 0
    };

    rowIds.forEach(rowId => {
        const barcodeElement = document.getElementById(`barcode-${rowId}`);
        const itemNameElement = document.getElementById(`item-name-${rowId}`);
        const quantityElement = document.getElementById(`quantity-${rowId}`);
        const priceElement = document.getElementById(`retail-price-${rowId}`);
        const totalElement = document.getElementById(`total-${rowId}`);
        const noteElement = document.getElementById(`note-${rowId}`);

        if (barcodeElement && itemNameElement && quantityElement && priceElement && totalElement && noteElement) {
            const quantity = parseFloat(quantityElement.value) || 0;
            const price = parseFloat(priceElement.value) || 0;
            
            if (quantity > 0 || price > 0 || barcodeElement.value || itemNameElement.value) {
                invoiceData.items.push({
                    rowNumber: rowId,
                    barcode: barcodeElement.value,
                    itemName: itemNameElement.value,
                    quantity: quantity,
                    retailPrice: price,
                    total: parseFloat(totalElement.value) || 0,
                    note: noteElement.value
                });
            }
        }
    });

    // Save to savedInvoices array
    if (currentInvoiceIndex >= 0) {
        savedInvoices[currentInvoiceIndex] = invoiceData;
    } else {
        savedInvoices.push(invoiceData);
        currentInvoiceIndex = savedInvoices.length - 1;
    }

    // Save to localStorage
    saveInvoicesToStorage();
    saveInvoiceCounterToStorage();
    
    // If customer exists and payment method is "on-account", add to transaction system
    if (customer && document.getElementById('payment-method').value === 'on-account') {
        const paidAmount = 0; // On account means no immediate payment
        const balance = invoiceData.total;
        
        addTransaction({
            customerId: customer.id,
            invoiceNumber: invoiceData.invoiceNumber,
            items: invoiceData.items,
            totalAmount: invoiceData.total,
            paidAmount: paidAmount,
            balance: balance,
            paymentMethod: 'on-account',
            notes: `Invoice ${invoiceData.invoiceNumber}`
        });
        
        showNotification(`Invoice saved and added to ${customer.name}'s account`, 'success');
    } else {
        showNotification(`Invoice Saved! Items: ${invoiceData.items.length}, Total: ${invoiceData.total.toFixed(2)}`, "success");
    }

    console.log('Invoice Data:', invoiceData);
    
    // Generate new invoice number for next invoice
    invoiceCounter++;
    const newInvoiceNumber = 'INV-' + String(invoiceCounter).padStart(4, '0');
    document.getElementById('invoice-number').textContent = newInvoiceNumber;
    
    // Update navigation buttons after saving
    updateNavigationButtons();
}


function showItemSearchResults(items, targetInput) {
    // Create search overlay
    const overlay = document.createElement('div');
    overlay.id = 'item-search-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 20px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;
    
    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #1f2937;">Items Starting with "${items[0].name.charAt(0).toUpperCase()}"</h3>
            <button onclick="closeSearchOverlay()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
        </div>
        <div style="max-height: 400px; overflow-y: auto;">
            ${items.map(item => `
                <div class="search-result-item" style="
                    padding: 15px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onclick="selectItem('${item.name}', '${item.barcode}', '${item.retailPrice}', '${targetInput.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; color: #1f2937;">${item.name}</div>
                            <div style="font-size: 12px; color: #6b7280;">Barcode: ${item.barcode} | Stock: ${item.stockQuantity}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600; color: #10b981;">${formatCurrency(item.retailPrice)}</div>
                            <div style="font-size: 12px; color: #6b7280;">${item.category}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add hover effects
    const resultItems = modal.querySelectorAll('.search-result-item');
    resultItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.background = '#f8fafc';
            this.style.borderColor = '#4f46e5';
        });
        item.addEventListener('mouseleave', function() {
            this.style.background = 'white';
            this.style.borderColor = '#e5e7eb';
        });
    });
    
    // Close on escape key
    overlay.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSearchOverlay();
        }
    });
    
    // Close on click outside
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeSearchOverlay();
        }
    });
}

function showCustomerSearchResults(customers, targetInput) {
    // Create search overlay
    const overlay = document.createElement('div');
    overlay.id = 'customer-search-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 20px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;
    
    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #1f2937;">Customers Starting with "${customers[0].name.charAt(0).toUpperCase()}"</h3>
            <button onclick="closeSearchOverlay()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
        </div>
        <div style="max-height: 400px; overflow-y: auto;">
            ${customers.map(customer => `
                <div class="search-result-item" style="
                    padding: 15px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onclick="selectCustomer('${customer.name}', '${targetInput.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; color: #1f2937;">${customer.name}</div>
                            <div style="font-size: 12px; color: #6b7280;">${customer.phone} | ${customer.email || 'No email'}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600; color: ${customer.currentBalance > 0 ? '#ef4444' : '#10b981'};">${formatCurrency(customer.currentBalance)}</div>
                            <div style="font-size: 12px; color: #6b7280;">Credit: ${formatCurrency(customer.creditLimit)}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add hover effects
    const resultItems = modal.querySelectorAll('.search-result-item');
    resultItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.background = '#f8fafc';
            this.style.borderColor = '#4f46e5';
        });
        item.addEventListener('mouseleave', function() {
            this.style.background = 'white';
            this.style.borderColor = '#e5e7eb';
        });
    });
    
    // Close on escape key
    overlay.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSearchOverlay();
        }
    });
    
    // Close on click outside
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeSearchOverlay();
        }
    });
}

function selectItem(itemName, barcode, price, targetInputId) {
    // Find the row number from the target input ID
    const rowNumber = targetInputId.split('-')[1];
    
    // Fill in the item details
    document.getElementById(`item-name-${rowNumber}`).value = itemName;
    document.getElementById(`barcode-${rowNumber}`).value = barcode;
    document.getElementById(`retail-price-${rowNumber}`).value = price;
    
    // Update the row total
    updateRowTotal(rowNumber);
    
    // Close the overlay
    closeSearchOverlay();
    
    // Move focus to quantity field
    document.getElementById(`quantity-${rowNumber}`).focus();
    
    showNotification(`Item "${itemName}" selected`, 'success');
}

function selectCustomer(customerName, targetInputId) {
    // Fill in the customer name
    document.getElementById(targetInputId).value = customerName;
    
    // Update customer info display
    updateCustomerInfoDisplay();
    
    // Close the overlay
    closeSearchOverlay();
    
    showNotification(`Customer "${customerName}" selected`, 'success');
}

function closeSearchOverlay() {
    const overlay = document.getElementById('item-search-overlay') || document.getElementById('customer-search-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Item suggestions functionality
function showItemSuggestions(query, rowNumber) {
    const allItems = getAllItems();
    const matchingItems = allItems.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.barcode.toLowerCase().includes(query.toLowerCase())
    );
    
    const suggestionsContainer = document.getElementById(`item-suggestions-${rowNumber}`);
    
    if (matchingItems.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    suggestionsContainer.innerHTML = matchingItems.slice(0, 5).map(item => `
        <div class="item-suggestion" onclick="selectItemFromSuggestion('${item.name}', '${item.barcode}', '${item.retailPrice}', ${rowNumber})">
            <div class="item-suggestion-name">${item.name}</div>
            <div class="item-suggestion-details">Barcode: ${item.barcode} | Stock: ${item.stockQuantity}</div>
            <div class="item-suggestion-price">${formatCurrency(item.retailPrice)}</div>
        </div>
    `).join('');
    
    suggestionsContainer.style.display = 'block';
}

function hideItemSuggestions(rowNumber) {
    const suggestionsContainer = document.getElementById(`item-suggestions-${rowNumber}`);
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

function selectItemFromSuggestion(itemName, barcode, price, rowNumber) {
    // Fill in the item details
    document.getElementById(`item-name-${rowNumber}`).value = itemName;
    document.getElementById(`barcode-${rowNumber}`).value = barcode;
    document.getElementById(`retail-price-${rowNumber}`).value = price;
    
    // Hide suggestions
    hideItemSuggestions(rowNumber);
    
    // Update the row total
    updateRowTotal(rowNumber);
    
    // Move focus to quantity field
    document.getElementById(`quantity-${rowNumber}`).focus();
    
    showNotification(`Item "${itemName}" selected`, 'success');
}

function navigateSuggestions(rowNumber, direction) {
    const suggestionsContainer = document.getElementById(`item-suggestions-${rowNumber}`);
    const suggestions = suggestionsContainer.querySelectorAll('.item-suggestion');
    
    if (suggestions.length === 0) return;
    
    let currentIndex = -1;
    suggestions.forEach((suggestion, index) => {
        if (suggestion.classList.contains('selected')) {
            currentIndex = index;
        }
    });
    
    // Remove current selection
    suggestions.forEach(suggestion => suggestion.classList.remove('selected'));
    
    if (direction === 'down') {
        currentIndex = (currentIndex + 1) % suggestions.length;
    } else {
        currentIndex = currentIndex <= 0 ? suggestions.length - 1 : currentIndex - 1;
    }
    
    // Add selection to new item
    suggestions[currentIndex].classList.add('selected');
    suggestions[currentIndex].style.backgroundColor = '#e5e7eb';
}


