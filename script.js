


let rowCount = 1;
const maxRows = 100;
let selectedRowId = null;
let rowIds = [1];
let invoiceCounter = 1;
let savedInvoices = [];
let currentInvoiceIndex = -1;
let isNavigating = false; // Prevent multiple navigation clicks

// Initialize the system
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing system');
    
    // Load from localStorage
        loadInvoicesFromStorage();
        loadInvoiceCounterFromStorage();
        
    // Load customer list for autocomplete
    console.log('Loading customer list...');
    loadCustomerList();
    
    // Check if shared.js functions are available
    console.log('getAllCustomers function available:', typeof getAllCustomers);
    console.log('formatCurrency function available:', typeof formatCurrency);
    console.log('addCustomerDebt function available:', typeof addCustomerDebt);
    
    
    initializeInvoice();
    addEventListenersToRow(1);
    document.getElementById('discount').addEventListener('input', updateInvoiceSum);
    document.getElementById('discount-type').addEventListener('change', updateDiscountType);
    document.getElementById('currency').addEventListener('change', updateCurrencySymbol);
    document.getElementById('customer-account').addEventListener('input', updateCustomerInfoDisplay);
    // Customer account field now uses input-based search like item names
    const customerAccountInput = document.getElementById('customer-account');
    customerAccountInput.addEventListener('input', function(event) {
        const query = event.target.value.trim();
        if (query.length > 0) {
            showCustomerSuggestions(query);
        } else {
            hideCustomerSuggestions();
        }
    });
    
    // Add keydown events for customer account
    customerAccountInput.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            hideCustomerSuggestions();
        }
    });
    
    // Hide suggestions when clicking outside
    customerAccountInput.addEventListener('blur', function() {
        setTimeout(() => hideCustomerSuggestions(), 200);
    });
    document.getElementById('payment-method').addEventListener('change', updateCustomerInfoDisplay);
    document.getElementById('currency').addEventListener('change', handleCurrencyChange);
    document.getElementById('paid-amount').addEventListener('input', calculateRemainingBalance);
    
    
    updateNavigationButtons();
    
    // Force update totals on page load
    setTimeout(() => {
        updateInvoiceSum();
        console.log('Forced updateInvoiceSum on page load');
    }, 500);
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
    
    // Generate invoice number (don't increment on page load, only when creating new)
    const invoiceNumber = 'INV-' + String(invoiceCounter).padStart(4, '0');
    document.getElementById('invoice-number').textContent = invoiceNumber;
    
    // Initialize currency tracking and symbols
    document.getElementById('currency').setAttribute('data-previous', 'USD');
    updateCurrencySymbols();
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
        // Add keydown events for normal navigation
        itemNameInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                quantityInput.focus();
            }
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
    
    console.log(`updateRowTotal for row ${rowNumber}: quantity=${quantity}, price=${retailPrice}, total=${total}`);
    
    const totalElement = document.getElementById(`total-${rowNumber}`);
    if (totalElement) {
        totalElement.value = total.toFixed(2);
        console.log(`Set total-${rowNumber} to ${total.toFixed(2)}`);
    } else {
        console.error(`Total element not found for row ${rowNumber}`);
    }
    
    updateInvoiceSum();
}

function updateInvoiceSum() {
    let subtotal = 0;
    let totalQuantity = 0;
    
    console.log('updateInvoiceSum called, rowIds:', rowIds);
    
    rowIds.forEach(rowId => {
        const totalElement = document.getElementById(`total-${rowId}`);
        const quantityElement = document.getElementById(`quantity-${rowId}`);
        if (totalElement && quantityElement) {
            const rowTotal = parseFloat(totalElement.value) || 0;
            const quantity = parseFloat(quantityElement.value) || 0;
            console.log(`Row ${rowId}: total=${rowTotal}, quantity=${quantity}`);
            subtotal += rowTotal;
            totalQuantity += quantity;
        } else {
            console.log(`Row ${rowId}: elements not found`, { totalElement, quantityElement });
        }
    });
    
    const discountType = document.getElementById('discount-type').value;
    const discountInput = parseFloat(document.getElementById('discount').value) || 0;
    const paymentMethod = document.getElementById('payment-method').value;
    const paidAmount = paymentMethod === 'partial' ? parseFloat(document.getElementById('paid-amount').value) || 0 : 0;
    
    let discount = 0;
    if (discountType === 'percentage') {
        discount = (subtotal * discountInput) / 100;
    } else {
        discount = discountInput;
    }
    
    // Calculate final total: Subtotal - Discount - Amount Paid (for partial payments)
    let finalTotal = subtotal - discount;
    if (paymentMethod === 'partial') {
        finalTotal = finalTotal - paidAmount;
    }
    
    console.log('Calculated totals:', { subtotal, totalQuantity, discount, finalTotal });
    
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
    
    // Get customer data for balance display
    const customer = getCustomerByName(customerAccount);
    console.log('Customer for display:', customer);
    
    // Format payment method for display
    const paymentMethodText = {
        'on-account': 'On Account',
        'cash': 'Cash',
        'partial': 'Partial Payment',
        'card': 'Card',
        'check': 'Check',
        'bank-transfer': 'Bank Transfer'
    }[paymentMethod] || paymentMethod;
    
    // Format currency for display
    const currencyText = currency === 'IQD' ? 'IQD (د.ع)' : 'USD ($)';
    
    // Calculate totals for display
    const subtotalText = document.getElementById('subtotal').textContent;
    const totalSumText = document.getElementById('total-sum').textContent;
    const subtotal = parseFloat(subtotalText) || 0;
    const total = parseFloat(totalSumText) || 0;
    
    console.log('Display values:', { subtotalText, totalSumText, subtotal, total });
    
    document.getElementById('display-customer-account').textContent = customerAccount;
    document.getElementById('display-payment-method').textContent = paymentMethodText;
    document.getElementById('display-currency').textContent = currencyText;
    
    // Update balance display if customer exists
    if (customer) {
        const balance = customer.currentBalance || 0;
        const paid = customer.totalPaid || 0;
        console.log('Customer balance info:', { balance, paid });
        
        // Update balance display elements if they exist
        const balanceElement = document.getElementById('display-balance');
        const paidElement = document.getElementById('display-paid');
        
        if (balanceElement) {
            balanceElement.textContent = typeof formatCurrency === 'function' ? formatCurrency(balance) : `$${balance.toFixed(2)}`;
        }
        if (paidElement) {
            paidElement.textContent = typeof formatCurrency === 'function' ? formatCurrency(paid) : `$${paid.toFixed(2)}`;
        }
    }
}

function togglePartialPayment() {
    const paymentMethod = document.getElementById('payment-method').value;
    const partialPaymentGroup = document.getElementById('partial-payment-group');
    
    if (paymentMethod === 'partial') {
        partialPaymentGroup.style.display = 'block';
        calculateRemainingBalance();
    } else {
        partialPaymentGroup.style.display = 'none';
        document.getElementById('paid-amount').value = '';
    }
    
    updateCustomerInfoDisplay();
}

function calculateRemainingBalance() {
    const paymentMethod = document.getElementById('payment-method').value;
    
    if (paymentMethod !== 'partial') {
        return;
    }
    
    // Update the totals first to get the correct final total
    updateInvoiceSum();
    
    const totalSumText = document.getElementById('total-sum').textContent;
    const finalTotal = parseFloat(totalSumText.replace(/[^0-9.-]/g, '')) || 0;
    const paidAmount = parseFloat(document.getElementById('paid-amount').value) || 0;
    
    // The remaining amount is now the final total (which already has paid amount subtracted)
    const remaining = finalTotal;
    
    // Update the display to show partial payment info
    const customerAccount = document.getElementById('customer-account').value;
    if (customerAccount) {
        const currency = document.getElementById('currency').value;
        const currencySymbol = currency === 'IQD' ? 'د.ع' : '$';
        
        let paymentText = `Partial: ${currencySymbol}${paidAmount.toFixed(2)} paid`;
        if (remaining > 0) {
            paymentText += `, ${currencySymbol}${remaining.toFixed(2)} on account`;
        } else {
            paymentText += ` (Fully Paid)`;
        }
        
        document.getElementById('display-payment-method').textContent = paymentText;
    }
}

function handleCurrencyChange() {
    const currency = document.getElementById('currency').value;
    const previousCurrency = document.getElementById('currency').getAttribute('data-previous') || 'USD';
    
    // Store current currency for next change
    document.getElementById('currency').setAttribute('data-previous', currency);
    
    // Only convert if we have items with prices
    if (rowIds.length > 0) {
        if (currency === 'IQD' && previousCurrency === 'USD') {
            // Convert USD to IQD (multiply by 1400)
            convertPrices(1400);
        } else if (currency === 'USD' && previousCurrency === 'IQD') {
            // Convert IQD to USD (divide by 1400)
            convertPrices(1/1400);
        }
    }
    
    // Update currency symbols
    updateCurrencySymbols();
    
    // Update totals and display
    updateInvoiceSum();
    updateCustomerInfoDisplay();
}

function convertPrices(conversionRate) {
    rowIds.forEach(rowId => {
        const priceElement = document.getElementById(`retail-price-${rowId}`);
        const totalElement = document.getElementById(`total-${rowId}`);
        
        if (priceElement && priceElement.value) {
            const currentPrice = parseFloat(priceElement.value) || 0;
            const newPrice = currentPrice * conversionRate;
            priceElement.value = newPrice.toFixed(2);
            
            // Update the total for this row
            const quantity = parseFloat(document.getElementById(`quantity-${rowId}`).value) || 0;
            const newTotal = newPrice * quantity;
            if (totalElement) {
                totalElement.value = newTotal.toFixed(2);
            }
        }
    });
    
    // Convert discount if it exists
    const discountElement = document.getElementById('discount');
    if (discountElement && discountElement.value) {
        const currentDiscount = parseFloat(discountElement.value) || 0;
        const newDiscount = currentDiscount * conversionRate;
        discountElement.value = newDiscount.toFixed(2);
    }
    
    // Convert paid amount if it exists
    const paidAmountElement = document.getElementById('paid-amount');
    if (paidAmountElement && paidAmountElement.value) {
        const currentPaidAmount = parseFloat(paidAmountElement.value) || 0;
        const newPaidAmount = currentPaidAmount * conversionRate;
        paidAmountElement.value = newPaidAmount.toFixed(2);
    }
}

function updateCurrencySymbols() {
    const currency = document.getElementById('currency').value;
    const currencySymbol = currency === 'IQD' ? 'د.ع' : '$';
    
    // Update currency symbols in the totals section
    document.getElementById('currency-symbol').textContent = currencySymbol;
    document.getElementById('final-currency-symbol').textContent = currencySymbol;
    
    // Update placeholder text for paid amount
    const paidAmountElement = document.getElementById('paid-amount');
    if (paidAmountElement) {
        paidAmountElement.placeholder = `0.00 ${currencySymbol}`;
    }
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

function createInvoiceRow(rowId) {
    const tbody = document.getElementById('invoice-tbody');
    const newRow = document.createElement('tr');
    newRow.id = `row-${rowId}`;
    newRow.setAttribute('onclick', `selectRow(${rowId})`);
    
    newRow.innerHTML = `
        <td class="row-number">${rowId}</td>
        <td><input type="text" id="barcode-${rowId}" placeholder="Scan barcode" onclick="event.stopPropagation()"></td>
        <td>
            <div style="display: flex; gap: 4px; align-items: center;">
                <input type="text" id="item-name-${rowId}" placeholder="Enter item name" onclick="event.stopPropagation()" autocomplete="off" style="flex: 1;">
                <button type="button" onclick="openItemQuickSearch(${rowId})" class="quick-search-btn" title="Quick Search">
                    🔍
                </button>
            </div>
        </td>
        <td><input type="number" id="quantity-${rowId}" value="" min="0" step="1" onclick="event.stopPropagation()"></td>
        <td><input type="number" id="retail-price-${rowId}" value="" min="0" step="0.01" onclick="event.stopPropagation()"></td>
        <td><input type="number" id="total-${rowId}" value="" disabled onclick="event.stopPropagation()"></td>
        <td><input type="text" id="note-${rowId}" placeholder="Add note" onclick="event.stopPropagation()"></td>
    `;
    
    tbody.appendChild(newRow);
    addEventListenersToRow(rowId);
}

function addRow() {
    if (rowIds.length >= maxRows) {
        showNotification(`Maximum ${maxRows} rows allowed.`, "warning");
        return false;
    }

    const newRowId = Math.max(...rowIds) + 1;
    rowIds.push(newRowId);
    rowCount = rowIds.length;
    
    createInvoiceRow(newRowId);
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

async function saveInvoice() {
    console.log('Save invoice function called');
    
    // Check if we have any data to save
    const hasData = hasInvoiceData();
    console.log('Has invoice data:', hasData);
    
    if (!hasData) {
        showNotification('No invoice data to save', 'error');
        return;
    }
    
    try {
        // Use the enhanced save function with customer integration
        await saveInvoiceWithCustomerIntegration();
        console.log('Invoice saved successfully');
    } catch (error) {
        console.error('Error saving invoice:', error);
        showNotification('Error saving invoice: ' + error.message, 'error');
    }
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
        
        // Increment invoice counter for new invoice
        invoiceCounter++;
        saveInvoiceCounterToStorage();
        
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
    document.getElementById('currency').setAttribute('data-previous', 'USD');
    document.getElementById('payment-method').value = 'on-account';
    document.getElementById('discount-type').value = 'amount';
    document.getElementById('discount').value = '0.00';
    document.getElementById('paid-amount').value = '';
    document.getElementById('partial-payment-group').style.display = 'none';
    
    // Update currency symbols
    updateCurrencySymbols();
    
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
    if (isNavigating) {
        console.log('Navigation already in progress, ignoring click');
        return;
    }
    
    console.log(`Previous invoice clicked. Current index: ${currentInvoiceIndex}, Total invoices: ${savedInvoices.length}`);
    
    if (savedInvoices.length === 0) {
        showNotification("No saved invoices to navigate to.", "warning");
        return;
    }
    
    isNavigating = true;
    
    if (currentInvoiceIndex > 0) {
        currentInvoiceIndex--;
        loadInvoice(currentInvoiceIndex, 'previous');
    } else if (currentInvoiceIndex === 0) {
        // Go to the last invoice (wrap around)
        currentInvoiceIndex = savedInvoices.length - 1;
        loadInvoice(currentInvoiceIndex, 'previous');
    } else {
        // currentInvoiceIndex is -1 (new invoice), go to last saved invoice
        currentInvoiceIndex = savedInvoices.length - 1;
        loadInvoice(currentInvoiceIndex, 'previous');
    }
}

function nextInvoice() {
    if (isNavigating) {
        console.log('Navigation already in progress, ignoring click');
        return;
    }
    
    console.log(`Next invoice clicked. Current index: ${currentInvoiceIndex}, Total invoices: ${savedInvoices.length}`);
    
    if (savedInvoices.length === 0) {
        showNotification("No saved invoices to navigate to.", "warning");
        return;
    }
    
    isNavigating = true;
    
    if (currentInvoiceIndex < savedInvoices.length - 1) {
        currentInvoiceIndex++;
        loadInvoice(currentInvoiceIndex, 'next');
    } else if (currentInvoiceIndex === savedInvoices.length - 1) {
        // Go to the first invoice (wrap around)
        currentInvoiceIndex = 0;
        loadInvoice(currentInvoiceIndex, 'next');
    } else {
        // currentInvoiceIndex is -1 (new invoice), go to first saved invoice
        currentInvoiceIndex = 0;
        loadInvoice(currentInvoiceIndex, 'next');
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
        
            // Clear current rows synchronously
            const tbody = document.getElementById('invoice-tbody');
            if (tbody) {
                tbody.innerHTML = '';
            }
            rowIds = [];
            rowCount = 0;
            
            // Add rows for invoice items with error handling
            if (invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
                invoice.items.forEach((item, idx) => {
                    if (idx === 0) {
                        // Create first row
                        createInvoiceRow(1);
                        rowIds = [1];
                        loadRowData(1, item);
                    } else {
                        // Create additional rows
                        const newRowId = idx + 1;
                        createInvoiceRow(newRowId);
                        rowIds.push(newRowId);
                        loadRowData(newRowId, item);
                    }
                });
            } else {
                // If no items, ensure we have at least one empty row
                createInvoiceRow(1);
                rowIds = [1];
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
            
            // Reset navigation lock after animation completes
            setTimeout(() => {
                isNavigating = false;
            }, 300);
        } catch (error) {
            console.error('Error loading invoice:', error);
            showNotification('Error loading invoice: ' + error.message, 'error');
            
            // Reset to safe state
            currentInvoiceIndex = -1;
            updateNavigationButtons();
            isNavigating = false;
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

// Function to search for invoice by number
function searchInvoice() {
    const searchInput = document.getElementById('invoice-search-input');
    if (!searchInput) {
        console.error('Invoice search input not found');
        return;
    }
    
    const searchValue = searchInput.value.trim();
    if (!searchValue) {
        showNotification("Please enter an invoice number to search.", "warning");
        return;
    }
    
    // Normalize the search value
    let searchNumber = searchValue;
    if (!searchNumber.startsWith('INV-')) {
        // If user enters just the number, add INV- prefix
        const number = parseInt(searchNumber);
        if (!isNaN(number)) {
            searchNumber = `INV-${String(number).padStart(4, '0')}`;
        } else {
            searchNumber = `INV-${searchNumber}`;
        }
    }
    
    // Find the invoice
    const index = savedInvoices.findIndex(invoice => 
        invoice.invoiceNumber === searchNumber ||
        invoice.invoiceNumber === searchValue
    );
    
    if (index !== -1) {
        currentInvoiceIndex = index;
        loadInvoice(currentInvoiceIndex, 'next');
        showNotification(`Found invoice ${searchNumber}`, "success");
        searchInput.value = ''; // Clear the search input
    } else {
        showNotification(`Invoice ${searchNumber} not found.`, "error");
    }
}

// Function to handle Enter key press in search input
function handleInvoiceSearch(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        searchInvoice();
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
        document.getElementById('currency').setAttribute('data-previous', 'USD');
        document.getElementById('payment-method').value = 'on-account';
        document.getElementById('discount-type').value = 'amount';
        document.getElementById('discount').value = '0.00';
        document.getElementById('paid-amount').value = '';
        document.getElementById('partial-payment-group').style.display = 'none';
        
        // Update currency symbols
        updateCurrencySymbols();
        
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

// Function to clear ALL system data (invoices, customers, items)
function clearAllSystemData() {
    if (confirm('⚠️ WARNING: This will clear ALL system data including:\n\n• All saved invoices\n• All customer data\n• All item data\n• All transaction history\n\nThis action CANNOT be undone!\n\nAre you sure you want to continue?')) {
        try {
            // Clear all localStorage data
            localStorage.removeItem('sonic_invoices');
            localStorage.removeItem('sonic_invoice_counter');
            localStorage.removeItem('sonic_shop_data');
            localStorage.removeItem('sonic_security_state');
            
            // Clear session storage
            sessionStorage.removeItem('sonic_logged_in');
            sessionStorage.removeItem('sonic_username');
            sessionStorage.removeItem('sonic_login_time');
            
            // Reset all variables
            savedInvoices = [];
            invoiceCounter = 1;
            currentInvoiceIndex = -1;
            
            // Clear current invoice
            clearCurrentInvoice();
            updateNavigationButtons();
            
            // Reload the page to reinitialize with default data
            showNotification('All system data cleared! Reloading page...', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Error clearing system data:', error);
            showNotification('Error clearing data: ' + error.message, 'error');
        }
    }
}

// Function to force reload all data from localStorage
function forceReloadData() {
    try {
        // Reload invoices
        loadInvoicesFromStorage();
        loadInvoiceCounterFromStorage();
        
        // Reload shared data if available
        if (typeof loadData === 'function') {
            loadData();
        }
        
        // Update UI
        updateNavigationButtons();
        updateInvoiceSum();
        
        showNotification('Data reloaded successfully!', 'success');
    } catch (error) {
        console.error('Error reloading data:', error);
        showNotification('Error reloading data: ' + error.message, 'error');
    }
}

// Global clear data function - can be called from anywhere
function clearAllDataGlobal() {
    if (confirm('⚠️ WARNING: This will clear ALL system data including:\n\n• All saved invoices\n• All customer data\n• All item data\n• All transaction history\n• All debt records\n\nThis action CANNOT be undone!\n\nAre you sure you want to continue?')) {
        try {
            // Clear all localStorage data
            localStorage.removeItem('sonic_invoices');
            localStorage.removeItem('sonic_invoice_counter');
            localStorage.removeItem('sonic_shop_data');
            localStorage.removeItem('sonic_security_state');
            
            // Clear session storage
            sessionStorage.removeItem('sonic_logged_in');
            sessionStorage.removeItem('sonic_username');
            sessionStorage.removeItem('sonic_login_time');
            
            // Show success message
            showNotification('All system data cleared! Redirecting to login...', 'success');
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } catch (error) {
            console.error('Error clearing data:', error);
            showNotification('Error clearing data: ' + error.message, 'error');
        }
    }
}

// Navigation functions for the integrated system
function goToHome() {
    window.location.href = 'index.html';
}





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
    console.log('loadCustomerList called');
    const customers = getAllCustomers();
    console.log('Customers loaded:', customers);
    const datalist = document.getElementById('customer-list');
    
    if (datalist) {
        datalist.innerHTML = customers.map(customer => 
            `<option value="${customer.name}" data-customer-id="${customer.id}">${customer.name} - ${customer.phone}</option>`
        ).join('');
        console.log('Customer datalist updated with', customers.length, 'customers');
    } else {
        console.error('Customer datalist element not found');
    }
}

function getCustomerByName(name) {
    console.log('getCustomerByName called with:', name);
    const customers = getAllCustomers();
    console.log('All customers:', customers);
    const customer = customers.find(customer => customer.name.toLowerCase() === name.toLowerCase());
    console.log('Customer found by name:', customer);
    return customer;
}

// Enhanced save function to integrate with customer system
async function saveInvoiceWithCustomerIntegration() {
    console.log('Starting saveInvoiceWithCustomerIntegration');
    console.log('formatCurrency function available:', typeof formatCurrency);
    console.log('addCustomerDebt function available:', typeof addCustomerDebt);
    try {
        // Update customer info display before saving
        updateCustomerInfoDisplay();
    
    const customerName = document.getElementById('customer-account').value.trim();
    const customer = getCustomerByName(customerName);
    
    // Get total values with debugging
    const totalQuantityText = document.getElementById('total-quantity').textContent;
    const subtotalText = document.getElementById('subtotal').textContent;
    const totalSumText = document.getElementById('total-sum').textContent;
    const discountValue = document.getElementById('discount').value;
    
    console.log('Total calculation values:', {
        totalQuantityText,
        subtotalText,
        totalSumText,
        discountValue,
        customerName,
        customer
    });
    
    // Handle partial payment
    const paymentMethod = document.getElementById('payment-method').value;
    const paidAmount = paymentMethod === 'partial' ? parseFloat(document.getElementById('paid-amount').value) || 0 : 0;
    // For partial payments, the remaining amount is the final total (which already has paid amount subtracted)
    const remainingAmount = paymentMethod === 'partial' ? (parseFloat(totalSumText) || 0) : 0;

    const invoiceData = {
        invoiceNumber: document.getElementById('invoice-number').textContent,
        date: document.getElementById('invoice-date').textContent,
        customerAccount: customerName,
        customerId: customer ? customer.id : null,
        currency: document.getElementById('currency').value,
        paymentMethod: paymentMethod,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
        items: [],
        totalQuantity: parseInt(totalQuantityText) || 0,
        discountType: document.getElementById('discount-type').value,
        discountInput: parseFloat(discountValue) || 0,
        discount: parseFloat(discountValue) || 0,
        subtotal: parseFloat(subtotalText) || 0,
        total: parseFloat(totalSumText) || 0
    };
    
    console.log('Invoice data calculated:', invoiceData);

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
    
    // Handle debt management based on payment method
    try {
        console.log('Customer found:', customer);
        console.log('Payment method:', document.getElementById('payment-method').value);
        console.log('addCustomerDebt function available:', typeof addCustomerDebt);
        
        if (customer && paymentMethod === 'partial') {
            // Partial payment - add remaining amount to customer debt
            if (typeof addCustomerDebt === 'function' && remainingAmount > 0) {
                console.log('Adding partial payment debt for customer:', customer.id, 'Amount:', remainingAmount);
                try {
                    const debtResult = addCustomerDebt(customer.id, remainingAmount, `Invoice ${invoiceData.invoiceNumber} - Partial Payment (${paidAmount} paid, ${remainingAmount} remaining)`);
                    console.log('Debt result:', debtResult);
                    if (debtResult) {
                        const paidAmountFormatted = typeof formatCurrency === 'function' ? formatCurrency(paidAmount) : `$${paidAmount.toFixed(2)}`;
                        const remainingAmountFormatted = typeof formatCurrency === 'function' ? formatCurrency(remainingAmount) : `$${remainingAmount.toFixed(2)}`;
                        const saveLocation = 'Local Storage';
                        showNotification(`Invoice ${invoiceData.invoiceNumber} saved to ${saveLocation}! ${paidAmountFormatted} paid, ${remainingAmountFormatted} added to ${customer.name}'s account.`, 'success');
                    } else {
                        console.error('Failed to add debt - addCustomerDebt returned false');
                        const saveLocation = 'Local Storage';
                        showNotification(`Invoice ${invoiceData.invoiceNumber} saved to ${saveLocation}! (Debt tracking failed)`, 'warning');
                    }
                } catch (debtError) {
                    console.error('Error calling addCustomerDebt:', debtError);
                    showNotification(`Invoice ${invoiceData.invoiceNumber} saved! (Debt tracking error: ${debtError.message})`, 'warning');
                }
            } else if (remainingAmount <= 0) {
                // Full payment made
                const saveLocation = 'Local Storage';
                showNotification(`Invoice ${invoiceData.invoiceNumber} saved to ${saveLocation} and fully paid!`, 'success');
            } else {
                console.warn('addCustomerDebt function not available, saving without debt tracking');
                const saveLocation = 'Local Storage';
                showNotification(`Invoice ${invoiceData.invoiceNumber} saved to ${saveLocation}!`, 'success');
            }
        } else if (customer && paymentMethod !== 'cash' && paymentMethod !== 'partial') {
            // Non-cash payment - add full amount to customer debt
            if (typeof addCustomerDebt === 'function') {
                console.log('Adding debt for customer:', customer.id, 'Amount:', invoiceData.total);
                try {
                    const debtResult = addCustomerDebt(customer.id, invoiceData.total, `Invoice ${invoiceData.invoiceNumber} - ${paymentMethod}`);
                    console.log('Debt result:', debtResult);
                    if (debtResult) {
                        const debtAmount = typeof formatCurrency === 'function' ? formatCurrency(invoiceData.total) : `$${invoiceData.total.toFixed(2)}`;
                        const saveLocation = 'Local Storage';
                        showNotification(`Invoice ${invoiceData.invoiceNumber} saved to ${saveLocation}! Debt of ${debtAmount} added to ${customer.name}'s account.`, 'success');
                    } else {
                        console.error('Failed to add debt - addCustomerDebt returned false');
                        const saveLocation = 'Local Storage';
                        showNotification(`Invoice ${invoiceData.invoiceNumber} saved to ${saveLocation}! (Debt tracking failed)`, 'warning');
                    }
                } catch (debtError) {
                    console.error('Error calling addCustomerDebt:', debtError);
                    showNotification(`Invoice ${invoiceData.invoiceNumber} saved! (Debt tracking error: ${debtError.message})`, 'warning');
                }
            } else {
                console.warn('addCustomerDebt function not available, saving without debt tracking');
                const saveLocation = 'Local Storage';
                showNotification(`Invoice ${invoiceData.invoiceNumber} saved to ${saveLocation}!`, 'success');
            }
        } else if (customer && paymentMethod === 'cash') {
            // Cash payment - no debt added
            const saveLocation = 'Local Storage';
            showNotification(`Invoice ${invoiceData.invoiceNumber} saved to ${saveLocation} and paid in cash!`, 'success');
        } else {
            const saveLocation = 'Local Storage';
            showNotification(`Invoice saved to ${saveLocation}! Items: ${invoiceData.items.length}, Total: ${invoiceData.total.toFixed(2)}`, "success");
        }
    } catch (debtError) {
        console.error('Error handling debt management:', debtError);
        console.error('Error details:', debtError.stack);
        const saveLocation = 'Local Storage';
        showNotification(`Invoice ${invoiceData.invoiceNumber} saved to ${saveLocation}! (Debt tracking error)`, 'success');
    }

    console.log('Invoice Data:', invoiceData);
    
    // Update navigation buttons after saving
    updateNavigationButtons();
    
    } catch (error) {
        console.error('Error in saveInvoiceWithCustomerIntegration:', error);
        showNotification('Error saving invoice: ' + error.message, 'error');
    }
}


// Removed old function - replaced with new dropdown search
function showItemSearchResults_OLD(items, targetInput) {
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
                            <div style="font-weight: 600; color: ${customer.currentBalance > 0 ? '#ef4444' : '#10b981'};">
                                ${customer.currentBalance > 0 ? 'Remaining:' : (customer.currentBalance < 0 ? 'Credit:' : 'Paid in Full')} ${formatCurrency(customer.currentBalance)}
                            </div>
                            <div style="font-size: 12px; color: #6b7280;">Credit Limit: ${formatCurrency(customer.creditLimit)}</div>
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

// Quick Search functionality
function openItemQuickSearch(rowNumber) {
    const allItems = getAllItems();
    
    // Create search overlay
    const overlay = document.createElement('div');
    overlay.id = 'item-quick-search-overlay';
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
        max-width: 700px;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
    `;
    
    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #1f2937;">Quick Search Items</h3>
            <button onclick="closeItemQuickSearch()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
        </div>
        <div style="margin-bottom: 15px;">
            <input type="text" id="item-quick-filter" placeholder="Filter by name, barcode, or category..." 
                   style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" autocomplete="off">
        </div>
        <div id="item-quick-results" style="flex: 1; overflow-y: auto; max-height: 400px;">
            ${allItems.map(item => `
                <div class="item-quick-result" onclick="selectItemFromQuickSearch('${item.name}', '${item.barcode}', '${item.retailPrice}', ${rowNumber})" style="
                    padding: 15px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${item.name}</div>
                            <div style="font-size: 12px; color: #6b7280;">Barcode: ${item.barcode} | Stock: ${item.stockQuantity} | Category: ${item.category}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600; color: #10b981; font-size: 16px;">${formatCurrency(item.retailPrice)}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add filter functionality
    const filterInput = document.getElementById('item-quick-filter');
    const resultsContainer = document.getElementById('item-quick-results');
    
    filterInput.addEventListener('input', function(event) {
        const filterQuery = event.target.value.toLowerCase();
        const filteredItems = allItems.filter(item => 
            item.name.toLowerCase().includes(filterQuery) ||
            item.barcode.toLowerCase().includes(filterQuery) ||
            item.category.toLowerCase().includes(filterQuery)
        );
        
        resultsContainer.innerHTML = filteredItems.map(item => `
            <div class="item-quick-result" onclick="selectItemFromQuickSearch('${item.name}', '${item.barcode}', '${item.retailPrice}', ${rowNumber})" style="
                padding: 15px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${item.name}</div>
                        <div style="font-size: 12px; color: #6b7280;">Barcode: ${item.barcode} | Stock: ${item.stockQuantity} | Category: ${item.category}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; color: #10b981; font-size: 16px;">${formatCurrency(item.retailPrice)}</div>
                    </div>
                </div>
            </div>
        `).join('');
        
        if (filteredItems.length === 0) {
            resultsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #6b7280; font-style: italic;">No items match your search</div>';
        }
    });
    
    // Add hover effects
    const addHoverEffects = () => {
        const resultItems = resultsContainer.querySelectorAll('.item-quick-result');
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
    };
    
    addHoverEffects();
    
    // Re-add hover effects after filtering
    filterInput.addEventListener('input', () => {
        setTimeout(addHoverEffects, 10);
    });
    
    // Close on escape key
    overlay.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeItemQuickSearch();
        }
    });
    
    // Close on click outside
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeItemQuickSearch();
        }
    });
    
    // Focus the filter input
    setTimeout(() => filterInput.focus(), 100);
}

function closeItemQuickSearch() {
    const overlay = document.getElementById('item-quick-search-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function selectItemFromQuickSearch(itemName, barcode, price, rowNumber) {
    // Fill in the item details
    document.getElementById(`item-name-${rowNumber}`).value = itemName;
    document.getElementById(`barcode-${rowNumber}`).value = barcode;
    document.getElementById(`retail-price-${rowNumber}`).value = price;
    
    // Close the overlay
    closeItemQuickSearch();
    
    // Update the row total
    updateRowTotal(rowNumber);
    
    // Move focus to quantity field
    document.getElementById(`quantity-${rowNumber}`).focus();
    
    showNotification(`Item "${itemName}" selected`, 'success');
}

// Customer suggestions functionality
function showCustomerSuggestions(query) {
    const allCustomers = getAllCustomers();
    const matchingCustomers = allCustomers.filter(customer => 
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.phone.toLowerCase().includes(query.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(query.toLowerCase()))
    );
    
    const suggestionsContainer = document.getElementById('customer-suggestions');
    
    if (matchingCustomers.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    suggestionsContainer.innerHTML = matchingCustomers.slice(0, 5).map(customer => {
        const balance = customer.currentBalance || 0;
        const balanceText = typeof formatCurrency === 'function' ? formatCurrency(balance) : `$${balance.toFixed(2)}`;
        const balanceLabel = balance > 0 ? 'Remaining:' : (balance < 0 ? 'Credit:' : 'Paid in Full');
        return `
            <div class="customer-suggestion" onclick="selectCustomerFromSuggestion('${customer.name}')">
                <div class="customer-suggestion-name">${customer.name}</div>
                <div class="customer-suggestion-details">Phone: ${customer.phone} | Email: ${customer.email || 'No email'}</div>
                <div class="customer-suggestion-balance">${balanceLabel} ${balanceText}</div>
            </div>
        `;
    }).join('');
    
    suggestionsContainer.style.display = 'block';
}

function hideCustomerSuggestions() {
    const suggestionsContainer = document.getElementById('customer-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

function selectCustomerFromSuggestion(customerName) {
    // Fill in the customer name
    document.getElementById('customer-account').value = customerName;
    
    // Hide suggestions
    hideCustomerSuggestions();
    
    // Update customer info display
    updateCustomerInfoDisplay();
    
    showNotification(`Customer "${customerName}" selected`, 'success');
}

// Function to refresh customer balance display in real-time
function refreshCustomerBalance() {
    const customerName = document.getElementById('customer-account').value.trim();
    if (customerName) {
        updateCustomerInfoDisplay();
    }
}

// Add periodic refresh for customer balance (every 5 seconds)
setInterval(refreshCustomerBalance, 5000);

// Debug function to manually test total calculation
function debugTotals() {
    console.log('=== DEBUG TOTALS ===');
    console.log('rowIds:', rowIds);
    
    rowIds.forEach(rowId => {
        const quantityEl = document.getElementById(`quantity-${rowId}`);
        const priceEl = document.getElementById(`retail-price-${rowId}`);
        const totalEl = document.getElementById(`total-${rowId}`);
        
        console.log(`Row ${rowId}:`, {
            quantity: quantityEl ? quantityEl.value : 'NOT FOUND',
            price: priceEl ? priceEl.value : 'NOT FOUND',
            total: totalEl ? totalEl.value : 'NOT FOUND'
        });
    });
    
    updateInvoiceSum();
    console.log('=== END DEBUG ===');
}


