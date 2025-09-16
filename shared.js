// Shared Data Management System for SONIC COMPANY Shop Management

// Global Data Storage
let shopData = {
    items: {},
    customers: {},
    transactions: [],
    settings: {
        currency: 'USD',
        taxRate: 0,
        companyName: 'SONIC COMPANY',
        lastItemId: 0,
        lastCustomerId: 0,
        lastTransactionId: 0
    }
};

// Data Management Functions
function saveData() {
    try {
        localStorage.setItem('sonic_shop_data', JSON.stringify(shopData));
        console.log('✅ Shop data saved successfully');
        return true;
    } catch (error) {
        console.error('❌ Error saving shop data:', error);
        return false;
    }
}

function loadData() {
    try {
        const stored = localStorage.getItem('sonic_shop_data');
        if (stored) {
            shopData = JSON.parse(stored);
            console.log('✅ Shop data loaded successfully');
            console.log('📊 Data summary:', {
                items: Object.keys(shopData.items).length,
                customers: Object.keys(shopData.customers).length,
                transactions: shopData.transactions.length
            });
        } else {
            console.log('📝 No existing data found, starting fresh');
            initializeDefaultData();
        }
        return true;
    } catch (error) {
        console.error('❌ Error loading shop data:', error);
        initializeDefaultData();
        return false;
    }
}

function initializeDefaultData() {
    // Add some sample items with different starting letters
    addItem({
        barcode: 'ITEM001',
        name: 'Tablet Computer',
        description: 'High-quality tablet for business use',
        purchasePrice: 200.00,
        retailPrice: 300.00,
        stockQuantity: 15,
        minStockLevel: 5,
        category: 'Electronics',
        supplier: 'Tech Supplier'
    });
    
    addItem({
        barcode: 'ITEM002',
        name: 'T-Shirt',
        description: 'Cotton t-shirt in various sizes',
        purchasePrice: 8.00,
        retailPrice: 15.00,
        stockQuantity: 50,
        minStockLevel: 10,
        category: 'Clothing',
        supplier: 'Fashion Supplier'
    });
    
    addItem({
        barcode: 'ITEM003',
        name: 'Apple iPhone',
        description: 'Latest model smartphone',
        purchasePrice: 600.00,
        retailPrice: 800.00,
        stockQuantity: 8,
        minStockLevel: 3,
        category: 'Electronics',
        supplier: 'Tech Supplier'
    });
    
    addItem({
        barcode: 'ITEM004',
        name: 'Book - Programming Guide',
        description: 'Comprehensive programming tutorial',
        purchasePrice: 25.00,
        retailPrice: 40.00,
        stockQuantity: 20,
        minStockLevel: 5,
        category: 'Books',
        supplier: 'Book Supplier'
    });
    
    addItem({
        barcode: 'ITEM005',
        name: 'Samsung Monitor',
        description: '24-inch LED monitor',
        purchasePrice: 150.00,
        retailPrice: 220.00,
        stockQuantity: 12,
        minStockLevel: 4,
        category: 'Electronics',
        supplier: 'Tech Supplier'
    });
    
    addItem({
        barcode: 'ITEM006',
        name: 'Tool Set',
        description: 'Complete set of hand tools',
        purchasePrice: 45.00,
        retailPrice: 70.00,
        stockQuantity: 8,
        minStockLevel: 2,
        category: 'Tools',
        supplier: 'Hardware Supplier'
    });
    
    // Add sample customers with different starting letters
    addCustomer({
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        address: '123 Main St, City',
        creditLimit: 1000.00,
        paymentTerms: '30 days',
        discountRate: 5,
        currentBalance: 0.00, // Current debt/credit balance
        totalDebt: 0.00, // Total amount owed
        totalPaid: 0.00 // Total amount paid
    });
    
    addCustomer({
        name: 'Jane Smith',
        phone: '+1234567891',
        email: 'jane@example.com',
        address: '456 Oak Ave, Town',
        creditLimit: 1500.00,
        paymentTerms: '15 days',
        discountRate: 10,
        currentBalance: 0.00,
        totalDebt: 0.00,
        totalPaid: 0.00
    });
    
    addCustomer({
        name: 'Mike Johnson',
        phone: '+1234567892',
        email: 'mike@example.com',
        address: '789 Pine St, Village',
        creditLimit: 800.00,
        paymentTerms: '30 days',
        discountRate: 0,
        currentBalance: 0.00,
        totalDebt: 0.00,
        totalPaid: 0.00
    });
    
    addCustomer({
        name: 'Sarah Wilson',
        phone: '+1234567893',
        email: 'sarah@example.com',
        address: '321 Elm St, City',
        creditLimit: 2000.00,
        paymentTerms: '60 days',
        discountRate: 15,
        currentBalance: 500.00, // Give Sarah some debt for testing
        totalDebt: 500.00,
        totalPaid: 0.00
    });
    
    saveData();
}

// Item Management Functions
function addItem(itemData) {
    const itemId = ++shopData.settings.lastItemId;
    const item = {
        id: itemId,
        ...itemData,
        dateAdded: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };
    
    shopData.items[itemId] = item;
    saveData();
    return itemId;
}

function updateItem(itemId, itemData) {
    if (shopData.items[itemId]) {
        shopData.items[itemId] = {
            ...shopData.items[itemId],
            ...itemData,
            lastUpdated: new Date().toISOString()
        };
        saveData();
        return true;
    }
    return false;
}

function deleteItem(itemId) {
    if (shopData.items[itemId]) {
        delete shopData.items[itemId];
        saveData();
        return true;
    }
    return false;
}

function getItem(itemId) {
    return shopData.items[itemId] || null;
}

function getAllItems() {
    return Object.values(shopData.items);
}

function searchItems(query) {
    const items = getAllItems();
    const lowerQuery = query.toLowerCase();
    return items.filter(item => 
        item.name.toLowerCase().includes(lowerQuery) ||
        item.barcode.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery)
    );
}

function getLowStockItems() {
    return getAllItems().filter(item => item.stockQuantity <= item.minStockLevel);
}

// Customer Management Functions
function addCustomer(customerData) {
    const customerId = ++shopData.settings.lastCustomerId;
    const customer = {
        id: customerId,
        ...customerData,
        currentBalance: customerData.currentBalance || 0.00,
        totalDebt: customerData.totalDebt || 0.00,
        totalPaid: customerData.totalPaid || 0.00,
        totalSpent: 0,
        registrationDate: new Date().toISOString(),
        purchaseHistory: []
    };
    
    shopData.customers[customerId] = customer;
    saveData();
    return customerId;
}

function updateCustomer(customerId, customerData) {
    if (shopData.customers[customerId]) {
        shopData.customers[customerId] = {
            ...shopData.customers[customerId],
            ...customerData,
            lastUpdated: new Date().toISOString()
        };
        saveData();
        return true;
    }
    return false;
}

function deleteCustomer(customerId) {
    if (shopData.customers[customerId]) {
        delete shopData.customers[customerId];
        saveData();
        return true;
    }
    return false;
}

function getCustomer(customerId) {
    console.log('getCustomer called with:', customerId);
    console.log('Available customers:', Object.keys(shopData.customers));
    const customer = shopData.customers[customerId] || null;
    console.log('Customer found:', customer);
    return customer;
}

function getAllCustomers() {
    return Object.values(shopData.customers);
}

function searchCustomers(query) {
    const customers = getAllCustomers();
    const lowerQuery = query.toLowerCase();
    return customers.filter(customer => 
        customer.name.toLowerCase().includes(lowerQuery) ||
        customer.phone.includes(query) ||
        customer.email.toLowerCase().includes(lowerQuery)
    );
}

function updateCustomerBalance(customerId, amount, transactionType = 'purchase') {
    if (shopData.customers[customerId]) {
        const customer = shopData.customers[customerId];
        
        if (transactionType === 'purchase') {
            customer.currentBalance += amount;
            customer.totalSpent += amount;
        } else if (transactionType === 'payment') {
            customer.currentBalance -= amount;
        }
        
        saveData();
        return true;
    }
    return false;
}

// Transaction Management Functions
function addTransaction(transactionData) {
    const transactionId = ++shopData.settings.lastTransactionId;
    const transaction = {
        id: transactionId,
        ...transactionData,
        date: new Date().toISOString(),
        status: (transactionData.balance || transactionData.amount) > 0 ? 'partial' : 'paid'
    };
    
    shopData.transactions.push(transaction);
    
    // Update customer balance if customer is involved
    if (transactionData.customerId) {
        const amount = transactionData.balance || transactionData.amount || 0;
        updateCustomerBalance(transactionData.customerId, amount, 'purchase');
    }
    
    saveData();
    return transactionId;
}

function getAllTransactions() {
    return shopData.transactions;
}

function getCustomerTransactions(customerId) {
    return shopData.transactions.filter(transaction => transaction.customerId == customerId);
}

function getOutstandingTransactions() {
    return shopData.transactions.filter(transaction => 
        (transaction.balance || transaction.amount || 0) > 0 && 
        transaction.status !== 'completed'
    );
}

// Utility Functions
function formatCurrency(amount, currency = 'USD') {
    const symbol = currency === 'IQD' ? 'د.ع' : '$';
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type = 'info') {
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
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize data when script loads
document.addEventListener('DOMContentLoaded', function() {
    loadData();
});

// Export functions for use in other modules
window.shopData = shopData;
window.addItem = addItem;
window.updateItem = updateItem;
window.deleteItem = deleteItem;
window.getItem = getItem;
window.getAllItems = getAllItems;
window.searchItems = searchItems;
window.getLowStockItems = getLowStockItems;

window.addCustomer = addCustomer;
window.updateCustomer = updateCustomer;
window.deleteCustomer = deleteCustomer;
window.getCustomer = getCustomer;
window.getAllCustomers = getAllCustomers;
window.searchCustomers = searchCustomers;
window.updateCustomerBalance = updateCustomerBalance;

window.addTransaction = addTransaction;
window.getAllTransactions = getAllTransactions;
window.getCustomerTransactions = getCustomerTransactions;
window.getOutstandingTransactions = getOutstandingTransactions;

// Debt Management Functions
function addCustomerDebt(customerId, amount, description = '') {
    console.log('addCustomerDebt called with:', { customerId, amount, description });
    
    const customer = getCustomer(customerId);
    if (!customer) {
        console.error('Customer not found:', customerId);
        return false;
    }
    
    console.log('Customer found:', customer);
    console.log('Total debt before:', customer.totalDebt);
    console.log('Total paid before:', customer.totalPaid);
    
    // Ensure the customer has the required fields
    if (typeof customer.totalDebt === 'undefined') {
        customer.totalDebt = 0;
    }
    if (typeof customer.totalPaid === 'undefined') {
        customer.totalPaid = 0;
    }
    
    // Add to total debt
    customer.totalDebt += amount;
    
    console.log('Total debt after:', customer.totalDebt);
    console.log('New remaining balance:', customer.totalDebt - customer.totalPaid);
    
    // Add transaction record
    try {
        addTransaction({
            type: 'debt',
            customerId: customerId,
            amount: amount,
            description: description || 'Debt added',
            date: new Date().toISOString(),
            status: 'pending'
        });
        console.log('Transaction added successfully');
    } catch (transactionError) {
        console.error('Error adding transaction:', transactionError);
    }
    
    try {
        saveData();
        console.log(`✅ Debt of ${formatCurrency(amount)} added to ${customer.name}`);
        return true;
    } catch (saveError) {
        console.error('Error saving data:', saveError);
        return false;
    }
}

function addCustomerPayment(customerId, amount, description = '') {
    console.log('addCustomerPayment called with:', { customerId, amount, description });
    
    const customer = getCustomer(customerId);
    if (!customer) {
        console.error('Customer not found:', customerId);
        return false;
    }
    
    console.log('Customer found:', customer);
    console.log('Total debt before payment:', customer.totalDebt);
    console.log('Total paid before payment:', customer.totalPaid);
    
    // Ensure the customer has the required fields
    if (typeof customer.totalDebt === 'undefined') {
        customer.totalDebt = 0;
    }
    if (typeof customer.totalPaid === 'undefined') {
        customer.totalPaid = 0;
    }
    
    // Calculate current balance before payment
    const oldBalance = customer.totalDebt - customer.totalPaid;
    
    // Add payment to total paid
    customer.totalPaid += amount;
    
    // Calculate new balance after payment
    const newBalance = customer.totalDebt - customer.totalPaid;
    const paymentApplied = Math.min(amount, oldBalance);
    const creditAmount = amount - paymentApplied;
    
    console.log('Payment applied to debt:', paymentApplied);
    console.log('New balance after payment:', newBalance);
    console.log('Total paid after payment:', customer.totalPaid);
    
    // Add transaction record
    addTransaction({
        type: 'payment',
        customerId: customerId,
        amount: amount,
        description: description || 'Payment received',
        date: new Date().toISOString(),
        status: 'completed'
    });
    
    saveData();
    
    if (creditAmount > 0) {
        console.log(`✅ Payment of ${formatCurrency(amount)} received from ${customer.name}. ${formatCurrency(paymentApplied)} applied to debt, ${formatCurrency(creditAmount)} as credit.`);
    } else {
        console.log(`✅ Payment of ${formatCurrency(amount)} received from ${customer.name}. Debt reduced by ${formatCurrency(paymentApplied)}.`);
    }
    
    return {
        paymentApplied: paymentApplied,
        remainingDebt: newBalance,
        creditAmount: creditAmount
    };
}

function getCustomerBalance(customerId) {
    const customer = getCustomer(customerId);
    if (!customer) {
        return null;
    }
    
    const totalDebt = customer.totalDebt || 0;
    const totalPaid = customer.totalPaid || 0;
    const creditLimit = customer.creditLimit || 0;
    
    // Calculate remaining balance: Total Debt - Total Paid
    const currentBalance = totalDebt - totalPaid;
    
    return {
        currentBalance: currentBalance,
        totalDebt: totalDebt,
        totalPaid: totalPaid,
        creditLimit: creditLimit,
        availableCredit: creditLimit - currentBalance
    };
}

function getCustomerDebtTransactions(customerId) {
    return shopData.transactions.filter(transaction => 
        transaction.customerId === customerId && 
        (transaction.type === 'debt' || transaction.type === 'payment')
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
}

window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.showNotification = showNotification;
window.saveData = saveData;
window.loadData = loadData;

// Export debt management functions
window.addCustomerDebt = addCustomerDebt;
window.addCustomerPayment = addCustomerPayment;
window.getCustomerBalance = getCustomerBalance;
window.getCustomerDebtTransactions = getCustomerDebtTransactions;
