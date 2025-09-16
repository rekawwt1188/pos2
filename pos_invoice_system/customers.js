// Customer Management System for SONIC COMPANY

let currentEditingCustomerId = null;
let customerToDelete = null;
let currentCustomerForPayment = null;

// Initialize the customers page
document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
    updateStatistics();
    setupEventListeners();
});

function setupEventListeners() {
    // Search functionality
    document.getElementById('search-customers').addEventListener('input', function(e) {
        filterCustomers(e.target.value);
    });
    
    // Form submission
    document.getElementById('customer-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCustomer();
    });
    
    // Payment form submission
    document.getElementById('payment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        savePayment();
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        const modals = ['customer-modal', 'customer-details-modal', 'payment-modal', 'delete-modal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (e.target === modal) {
                closeModal(modalId);
            }
        });
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    if (modalId === 'customer-modal') {
        currentEditingCustomerId = null;
    } else if (modalId === 'payment-modal') {
        currentCustomerForPayment = null;
    } else if (modalId === 'delete-modal') {
        customerToDelete = null;
    }
}

function loadCustomers() {
    const customers = getAllCustomers();
    const tbody = document.getElementById('customers-tbody');
    
    if (customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-users" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No customers found. Click "Add New Customer" to get started.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>
                <div style="font-weight: 600;">${customer.name}</div>
                <div style="font-size: 12px; color: #6b7280;">ID: ${customer.id}</div>
            </td>
            <td>
                <div style="font-weight: 500;">${customer.phone}</div>
                <div style="font-size: 12px; color: #6b7280;">${customer.email || 'No email'}</div>
            </td>
            <td>${formatCurrency(customer.creditLimit)}</td>
            <td>
                <span class="${getBalanceClass(customer.currentBalance)}">
                    ${formatCurrency(customer.currentBalance)}
                </span>
            </td>
            <td>${formatCurrency(customer.totalSpent)}</td>
            <td>
                ${getCustomerStatus(customer)}
            </td>
            <td>
                <button class="btn btn-primary" onclick="viewCustomerDetails(${customer.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-warning" onclick="editCustomer(${customer.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteCustomer(${customer.id})" style="padding: 5px 10px; font-size: 12px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function filterCustomers(query) {
    const customers = query ? searchCustomers(query) : getAllCustomers();
    const tbody = document.getElementById('customers-tbody');
    
    if (customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No customers found matching "${query}"
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>
                <div style="font-weight: 600;">${customer.name}</div>
                <div style="font-size: 12px; color: #6b7280;">ID: ${customer.id}</div>
            </td>
            <td>
                <div style="font-weight: 500;">${customer.phone}</div>
                <div style="font-size: 12px; color: #6b7280;">${customer.email || 'No email'}</div>
            </td>
            <td>${formatCurrency(customer.creditLimit)}</td>
            <td>
                <span class="${getBalanceClass(customer.currentBalance)}">
                    ${formatCurrency(customer.currentBalance)}
                </span>
            </td>
            <td>${formatCurrency(customer.totalSpent)}</td>
            <td>
                ${getCustomerStatus(customer)}
            </td>
            <td>
                <button class="btn btn-primary" onclick="viewCustomerDetails(${customer.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-warning" onclick="editCustomer(${customer.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteCustomer(${customer.id})" style="padding: 5px 10px; font-size: 12px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getBalanceClass(balance) {
    if (balance > 0) return 'balance-negative';
    if (balance < 0) return 'balance-positive';
    return 'balance-zero';
}

function getCustomerStatus(customer) {
    if (customer.currentBalance > customer.creditLimit) {
        return '<span style="background: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Over Limit</span>';
    } else if (customer.currentBalance > 0) {
        return '<span style="background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Has Balance</span>';
    } else {
        return '<span style="background: #f0fdf4; color: #16a34a; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Paid Up</span>';
    }
}

function updateStatistics() {
    const customers = getAllCustomers();
    const customersWithBalance = customers.filter(c => c.currentBalance > 0);
    const totalOutstanding = customers.reduce((sum, c) => sum + Math.max(0, c.currentBalance), 0);
    const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    
    document.getElementById('total-customers').textContent = customers.length;
    document.getElementById('customers-with-balance').textContent = customersWithBalance.length;
    document.getElementById('total-outstanding').textContent = formatCurrency(totalOutstanding);
    document.getElementById('total-spent').textContent = formatCurrency(totalSpent);
}

function openAddCustomerModal() {
    currentEditingCustomerId = null;
    document.getElementById('modal-title').textContent = 'Add New Customer';
    document.getElementById('customer-form').reset();
    document.getElementById('customer-modal').style.display = 'block';
}

function editCustomer(customerId) {
    const customer = getCustomer(customerId);
    if (!customer) {
        showNotification('Customer not found', 'error');
        return;
    }
    
    currentEditingCustomerId = customerId;
    document.getElementById('modal-title').textContent = 'Edit Customer';
    
    // Populate form with customer data
    document.getElementById('customer-name').value = customer.name;
    document.getElementById('customer-phone').value = customer.phone;
    document.getElementById('customer-email').value = customer.email || '';
    document.getElementById('customer-credit-limit').value = customer.creditLimit;
    document.getElementById('customer-payment-terms').value = customer.paymentTerms || '30 days';
    document.getElementById('customer-discount').value = customer.discountRate || 0;
    document.getElementById('customer-address').value = customer.address || '';
    
    document.getElementById('customer-modal').style.display = 'block';
}

function closeCustomerModal() {
    document.getElementById('customer-modal').style.display = 'none';
    currentEditingCustomerId = null;
}

function saveCustomer() {
    const formData = {
        name: document.getElementById('customer-name').value.trim(),
        phone: document.getElementById('customer-phone').value.trim(),
        email: document.getElementById('customer-email').value.trim(),
        creditLimit: parseFloat(document.getElementById('customer-credit-limit').value) || 0,
        paymentTerms: document.getElementById('customer-payment-terms').value,
        discountRate: parseFloat(document.getElementById('customer-discount').value) || 0,
        address: document.getElementById('customer-address').value.trim()
    };
    
    // Validation
    if (!formData.name || !formData.phone) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        if (currentEditingCustomerId) {
            // Update existing customer
            updateCustomer(currentEditingCustomerId, formData);
            showNotification('Customer updated successfully', 'success');
        } else {
            // Add new customer
            addCustomer(formData);
            showNotification('Customer added successfully', 'success');
        }
        
        loadCustomers();
        updateStatistics();
        closeCustomerModal();
    } catch (error) {
        console.error('Error saving customer:', error);
        showNotification('Error saving customer', 'error');
    }
}

function viewCustomerDetails(customerId) {
    const customer = getCustomer(customerId);
    if (!customer) {
        showNotification('Customer not found', 'error');
        return;
    }
    
    const transactions = getCustomerTransactions(customerId);
    
    document.getElementById('customer-details-title').textContent = `${customer.name} - Details`;
    
    document.getElementById('customer-details-content').innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
            <div>
                <h4>Contact Information</h4>
                <p><strong>Name:</strong> ${customer.name}</p>
                <p><strong>Phone:</strong> ${customer.phone}</p>
                <p><strong>Email:</strong> ${customer.email || 'Not provided'}</p>
                <p><strong>Address:</strong> ${customer.address || 'Not provided'}</p>
            </div>
            <div>
                <h4>Account Information</h4>
                <p><strong>Credit Limit:</strong> ${formatCurrency(customer.creditLimit)}</p>
                <p><strong>Current Balance:</strong> <span class="${getBalanceClass(customer.currentBalance)}">${formatCurrency(customer.currentBalance)}</span></p>
                <p><strong>Total Spent:</strong> ${formatCurrency(customer.totalSpent)}</p>
                <p><strong>Payment Terms:</strong> ${customer.paymentTerms}</p>
                <p><strong>Discount Rate:</strong> ${customer.discountRate}%</p>
            </div>
        </div>
        
        <div>
            <h4>Payment History</h4>
            <div class="payment-history">
                ${transactions.length === 0 ? 
                    '<p style="text-align: center; color: #6b7280; padding: 20px;">No transactions found</p>' :
                    transactions.map(transaction => `
                        <div class="payment-entry">
                            <div>
                                <strong>${transaction.invoiceNumber}</strong><br>
                                <small>${formatDate(transaction.date)}</small>
                            </div>
                            <div style="text-align: right;">
                                <div><strong>${formatCurrency(transaction.totalAmount)}</strong></div>
                                <div style="font-size: 12px; color: #6b7280;">
                                    Paid: ${formatCurrency(transaction.paidAmount)} | 
                                    Balance: <span class="${getBalanceClass(transaction.balance)}">${formatCurrency(transaction.balance)}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `;
    
    currentCustomerForPayment = customerId;
    document.getElementById('customer-details-modal').style.display = 'block';
}

function closeCustomerDetailsModal() {
    document.getElementById('customer-details-modal').style.display = 'none';
    currentCustomerForPayment = null;
}

function addPayment() {
    if (!currentCustomerForPayment) {
        showNotification('No customer selected for payment', 'error');
        return;
    }
    
    const customer = getCustomer(currentCustomerForPayment);
    if (!customer) {
        showNotification('Customer not found', 'error');
        return;
    }
    
    document.getElementById('payment-amount').max = customer.currentBalance;
    document.getElementById('payment-amount').placeholder = `Max: ${formatCurrency(customer.currentBalance)}`;
    document.getElementById('payment-form').reset();
    document.getElementById('payment-modal').style.display = 'block';
}

function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
    currentCustomerForPayment = null;
}

function savePayment() {
    if (!currentCustomerForPayment) {
        showNotification('No customer selected for payment', 'error');
        return;
    }
    
    const amount = parseFloat(document.getElementById('payment-amount').value);
    const method = document.getElementById('payment-method').value;
    const notes = document.getElementById('payment-notes').value.trim();
    
    if (!amount || amount <= 0) {
        showNotification('Please enter a valid payment amount', 'error');
        return;
    }
    
    const customer = getCustomer(currentCustomerForPayment);
    if (amount > customer.currentBalance) {
        showNotification('Payment amount cannot exceed current balance', 'error');
        return;
    }
    
    try {
        // Update customer balance
        updateCustomerBalance(currentCustomerForPayment, amount, 'payment');
        
        // Add payment transaction
        addTransaction({
            customerId: currentCustomerForPayment,
            invoiceNumber: `PAY-${Date.now()}`,
            items: [],
            totalAmount: 0,
            paidAmount: amount,
            balance: -amount, // Negative balance for payments
            paymentMethod: method,
            notes: notes
        });
        
        showNotification('Payment recorded successfully', 'success');
        loadCustomers();
        updateStatistics();
        closePaymentModal();
        
        // Refresh customer details if modal is open
        if (document.getElementById('customer-details-modal').style.display === 'block') {
            viewCustomerDetails(currentCustomerForPayment);
        }
    } catch (error) {
        console.error('Error recording payment:', error);
        showNotification('Error recording payment', 'error');
    }
}

function deleteCustomer(customerId) {
    const customer = getCustomer(customerId);
    if (!customer) {
        showNotification('Customer not found', 'error');
        return;
    }
    
    if (customer.currentBalance > 0) {
        showNotification('Cannot delete customer with outstanding balance', 'error');
        return;
    }
    
    customerToDelete = customerId;
    document.getElementById('delete-modal').style.display = 'block';
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    customerToDelete = null;
}

function confirmDeleteCustomer() {
    if (customerToDelete) {
        try {
            deleteCustomer(customerToDelete);
            showNotification('Customer deleted successfully', 'success');
            loadCustomers();
            updateStatistics();
            closeDeleteModal();
        } catch (error) {
            console.error('Error deleting customer:', error);
            showNotification('Error deleting customer', 'error');
        }
    }
}

// Export functions for use in other modules
window.loadCustomers = loadCustomers;
window.updateStatistics = updateStatistics;
window.openAddCustomerModal = openAddCustomerModal;
window.editCustomer = editCustomer;
window.closeCustomerModal = closeCustomerModal;
window.saveCustomer = saveCustomer;
window.viewCustomerDetails = viewCustomerDetails;
window.closeCustomerDetailsModal = closeCustomerDetailsModal;
window.addPayment = addPayment;
window.closePaymentModal = closePaymentModal;
window.savePayment = savePayment;
window.deleteCustomer = deleteCustomer;
window.closeDeleteModal = closeDeleteModal;
window.confirmDeleteCustomer = confirmDeleteCustomer;
