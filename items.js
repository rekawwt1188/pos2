// Item Management System for SONIC COMPANY

let currentEditingItemId = null;
let itemsToDelete = null;

// Initialize the items page
document.addEventListener('DOMContentLoaded', function() {
    loadItems();
    updateStatistics();
    setupEventListeners();
});

function setupEventListeners() {
    // Search functionality
    document.getElementById('search-items').addEventListener('input', function(e) {
        filterItems(e.target.value);
    });
    
    // Form submission
    document.getElementById('item-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveItem();
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('item-modal');
        const deleteModal = document.getElementById('delete-modal');
        if (e.target === modal) {
            closeItemModal();
        }
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
}

function loadItems() {
    const items = getAllItems();
    const tbody = document.getElementById('items-tbody');
    
    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No items found. Click "Add New Item" to get started.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = items.map(item => `
        <tr>
            <td><strong>${item.barcode}</strong></td>
            <td>
                <div style="font-weight: 600;">${item.name}</div>
                <div style="font-size: 12px; color: #6b7280;">${item.description || 'No description'}</div>
            </td>
            <td>
                <span style="background: #e5e7eb; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                    ${item.category}
                </span>
            </td>
            <td>${formatCurrency(item.purchasePrice)}</td>
            <td><strong>${formatCurrency(item.retailPrice)}</strong></td>
            <td>
                <span class="${item.stockQuantity <= item.minStockLevel ? 'stock-low' : 'stock-ok'}">
                    ${item.stockQuantity}
                </span>
                ${item.stockQuantity <= item.minStockLevel ? '<i class="fas fa-exclamation-triangle" style="margin-left: 5px; color: #ef4444;"></i>' : ''}
            </td>
            <td>
                ${item.stockQuantity <= item.minStockLevel ? 
                    '<span style="background: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Low Stock</span>' :
                    '<span style="background: #f0fdf4; color: #16a34a; padding: 4px 8px; border-radius: 12px; font-size: 12px;">In Stock</span>'
                }
            </td>
            <td>
                <button class="btn btn-primary" onclick="editItem(${item.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteItem(${item.id})" style="padding: 5px 10px; font-size: 12px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function filterItems(query) {
    const items = query ? searchItems(query) : getAllItems();
    const tbody = document.getElementById('items-tbody');
    
    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No items found matching "${query}"
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = items.map(item => `
        <tr>
            <td><strong>${item.barcode}</strong></td>
            <td>
                <div style="font-weight: 600;">${item.name}</div>
                <div style="font-size: 12px; color: #6b7280;">${item.description || 'No description'}</div>
            </td>
            <td>
                <span style="background: #e5e7eb; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                    ${item.category}
                </span>
            </td>
            <td>${formatCurrency(item.purchasePrice)}</td>
            <td><strong>${formatCurrency(item.retailPrice)}</strong></td>
            <td>
                <span class="${item.stockQuantity <= item.minStockLevel ? 'stock-low' : 'stock-ok'}">
                    ${item.stockQuantity}
                </span>
                ${item.stockQuantity <= item.minStockLevel ? '<i class="fas fa-exclamation-triangle" style="margin-left: 5px; color: #ef4444;"></i>' : ''}
            </td>
            <td>
                ${item.stockQuantity <= item.minStockLevel ? 
                    '<span style="background: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Low Stock</span>' :
                    '<span style="background: #f0fdf4; color: #16a34a; padding: 4px 8px; border-radius: 12px; font-size: 12px;">In Stock</span>'
                }
            </td>
            <td>
                <button class="btn btn-primary" onclick="editItem(${item.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteItem(${item.id})" style="padding: 5px 10px; font-size: 12px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateStatistics() {
    const items = getAllItems();
    const lowStockItems = getLowStockItems();
    
    // Calculate total inventory value
    const totalValue = items.reduce((sum, item) => sum + (item.purchasePrice * item.stockQuantity), 0);
    
    // Get unique categories
    const categories = new Set(items.map(item => item.category));
    
    document.getElementById('total-items').textContent = items.length;
    document.getElementById('low-stock-items').textContent = lowStockItems.length;
    document.getElementById('total-value').textContent = formatCurrency(totalValue);
    document.getElementById('categories').textContent = categories.size;
}

function openAddItemModal() {
    currentEditingItemId = null;
    document.getElementById('modal-title').textContent = 'Add New Item';
    document.getElementById('item-form').reset();
    document.getElementById('item-modal').style.display = 'block';
}

function editItem(itemId) {
    const item = getItem(itemId);
    if (!item) {
        showNotification('Item not found', 'error');
        return;
    }
    
    currentEditingItemId = itemId;
    document.getElementById('modal-title').textContent = 'Edit Item';
    
    // Populate form with item data
    document.getElementById('item-barcode').value = item.barcode;
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-category').value = item.category;
    document.getElementById('item-supplier').value = item.supplier || '';
    document.getElementById('item-purchase-price').value = item.purchasePrice;
    document.getElementById('item-retail-price').value = item.retailPrice;
    document.getElementById('item-stock').value = item.stockQuantity;
    document.getElementById('item-min-stock').value = item.minStockLevel;
    document.getElementById('item-description').value = item.description || '';
    
    document.getElementById('item-modal').style.display = 'block';
}

function closeItemModal() {
    document.getElementById('item-modal').style.display = 'none';
    currentEditingItemId = null;
}

function saveItem() {
    const formData = {
        barcode: document.getElementById('item-barcode').value.trim(),
        name: document.getElementById('item-name').value.trim(),
        category: document.getElementById('item-category').value,
        supplier: document.getElementById('item-supplier').value.trim(),
        purchasePrice: parseFloat(document.getElementById('item-purchase-price').value),
        retailPrice: parseFloat(document.getElementById('item-retail-price').value),
        stockQuantity: parseInt(document.getElementById('item-stock').value),
        minStockLevel: parseInt(document.getElementById('item-min-stock').value) || 0,
        description: document.getElementById('item-description').value.trim()
    };
    
    // Validation
    if (!formData.barcode || !formData.name || formData.purchasePrice < 0 || formData.retailPrice < 0) {
        showNotification('Please fill in all required fields with valid values', 'error');
        return;
    }
    
    // Check for duplicate barcode (only for new items or when barcode is changed)
    if (!currentEditingItemId || formData.barcode !== getItem(currentEditingItemId).barcode) {
        const existingItems = getAllItems();
        if (existingItems.some(item => item.barcode === formData.barcode && item.id !== currentEditingItemId)) {
            showNotification('An item with this barcode already exists', 'error');
            return;
        }
    }
    
    try {
        if (currentEditingItemId) {
            // Update existing item
            updateItem(currentEditingItemId, formData);
            showNotification('Item updated successfully', 'success');
        } else {
            // Add new item
            addItem(formData);
            showNotification('Item added successfully', 'success');
        }
        
        loadItems();
        updateStatistics();
        closeItemModal();
    } catch (error) {
        console.error('Error saving item:', error);
        showNotification('Error saving item', 'error');
    }
}

function deleteItem(itemId) {
    const item = getItem(itemId);
    if (!item) {
        showNotification('Item not found', 'error');
        return;
    }
    
    itemsToDelete = itemId;
    document.getElementById('delete-modal').style.display = 'block';
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    itemsToDelete = null;
}

function confirmDeleteItem() {
    if (itemsToDelete) {
        try {
            deleteItem(itemsToDelete);
            showNotification('Item deleted successfully', 'success');
            loadItems();
            updateStatistics();
            closeDeleteModal();
        } catch (error) {
            console.error('Error deleting item:', error);
            showNotification('Error deleting item', 'error');
        }
    }
}

// Export functions for use in other modules
window.loadItems = loadItems;
window.updateStatistics = updateStatistics;
window.openAddItemModal = openAddItemModal;
window.editItem = editItem;
window.closeItemModal = closeItemModal;
window.saveItem = saveItem;
window.deleteItem = deleteItem;
window.closeDeleteModal = closeDeleteModal;
window.confirmDeleteItem = confirmDeleteItem;
