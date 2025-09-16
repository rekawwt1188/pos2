# 🏪 SONIC COMPANY - Complete Shop Management System

A comprehensive online shop management system with customer accounts, inventory tracking, and payment management.

## 🚀 Features

### 📦 **Item Management**
- Complete inventory tracking with barcodes
- Stock level monitoring with low stock alerts
- Purchase and retail price management
- Category and supplier organization
- Search and filter capabilities

### 👥 **Customer Account System**
- Customer registration and profile management
- Credit limit and balance tracking
- Payment history and transaction records
- Outstanding balance monitoring
- Customer search and filtering

### 💰 **Payment & Transaction Management**
- Full payment (Cash/Card)
- Partial payment (On Account)
- Credit sales tracking
- Payment history
- Outstanding balance management
- Receipt generation

### 📊 **Business Dashboard**
- Real-time business statistics
- Low stock item alerts
- Outstanding balance overview
- Recent transaction history
- Quick action buttons

### 🧾 **POS Invoice System**
- Professional invoice creation
- Multiple payment methods
- Customer account integration
- Invoice navigation and management
- Print-ready invoices

## 📁 File Structure

```
pos_invoice_system/
├── index.html              # Main POS Interface
├── script.js               # Core POS Logic
├── styles.css              # Main Styling
├── shared.js               # Shared Data Management
├── items.html              # Item Management Interface
├── items.js                # Item Management Logic
├── customers.html          # Customer Management Interface
├── customers.js            # Customer Management Logic
├── dashboard.html          # Business Dashboard
├── dashboard.js            # Dashboard Logic
├── SYSTEM_DESIGN.md        # System Architecture Documentation
└── README.md               # This file
```

## 🛠️ Installation & Setup

1. **Download all files** to a local directory
2. **Open `index.html`** in a web browser
3. **Start using the system** - no additional setup required!

The system uses **localStorage** for data persistence, so all data is stored locally in your browser.

## 📖 How to Use

### 1. **Getting Started**
- Open `index.html` to access the main POS system
- The system will automatically initialize with sample data
- Use the navigation buttons to access different modules

### 2. **Managing Items**
- Click the **"Items"** button to open Item Management
- Add new items with barcodes, prices, and stock levels
- Monitor low stock items and update inventory
- Search and filter items by name, barcode, or category

### 3. **Managing Customers**
- Click the **"Customers"** button to open Customer Management
- Add new customers with contact information and credit limits
- Track customer balances and payment history
- Record payments and manage outstanding balances

### 4. **Creating Invoices**
- Use the main POS interface to create invoices
- Select customers from the dropdown (auto-populated from customer database)
- Add items with quantities and prices
- Choose payment method (Cash, Card, On Account)
- Save invoices and print receipts

### 5. **Monitoring Business**
- Click the **"Dashboard"** button to view business overview
- Monitor key statistics and performance metrics
- View low stock alerts and outstanding balances
- Access quick actions for common tasks

## 💾 Data Management

### **Data Storage**
- All data is stored in browser localStorage
- Data persists between browser sessions
- No external database required
- Data is automatically backed up locally

### **Data Structure**
```javascript
// Items Database
{
  itemId: {
    barcode: "string",
    name: "string",
    description: "string",
    purchasePrice: number,
    retailPrice: number,
    stockQuantity: number,
    minStockLevel: number,
    category: "string",
    supplier: "string"
  }
}

// Customers Database
{
  customerId: {
    name: "string",
    phone: "string",
    email: "string",
    address: "string",
    creditLimit: number,
    currentBalance: number,
    paymentTerms: "string",
    discountRate: number
  }
}

// Transactions Database
[
  {
    customerId: "string",
    invoiceNumber: "string",
    date: "date",
    totalAmount: number,
    paidAmount: number,
    balance: number,
    paymentMethod: "string",
    status: "string"
  }
]
```

## 🎯 Key Benefits

### ✅ **Complete Solution**
- All-in-one shop management system
- No external dependencies or setup required
- Works offline with local data storage

### ✅ **User-Friendly Interface**
- Intuitive design with modern UI
- Responsive layout for different screen sizes
- Professional appearance suitable for business use

### ✅ **Comprehensive Features**
- Inventory management with stock tracking
- Customer relationship management
- Financial tracking and reporting
- Professional invoice generation

### ✅ **Scalable Architecture**
- Modular design for easy expansion
- Clean code structure for maintenance
- Extensible data model for future features

## 🔧 Technical Details

### **Technologies Used**
- **HTML5** - Structure and markup
- **CSS3** - Styling and responsive design
- **JavaScript (ES6+)** - Functionality and data management
- **localStorage** - Data persistence
- **Font Awesome** - Icons and visual elements

### **Browser Compatibility**
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Any modern browser with localStorage support

### **Performance**
- Fast loading and responsive interface
- Efficient data management with localStorage
- Optimized for small to medium businesses
- Handles thousands of records efficiently

## 📞 Support & Customization

### **Customization Options**
- Modify company branding and colors in `styles.css`
- Add new item categories in the item management system
- Customize payment terms and methods
- Extend the data model for additional fields

### **Data Export/Import**
- Data can be exported from browser localStorage
- JSON format for easy backup and migration
- Import functionality can be added for data migration

## 🚀 Future Enhancements

### **Potential Additions**
- Barcode scanner integration
- Cloud storage synchronization
- Advanced reporting and analytics
- Multi-location support
- Employee management
- Tax calculation and reporting
- Email notifications
- Mobile app version

## 📝 License

This system is provided as-is for business use. Feel free to modify and customize according to your needs.

---

**SONIC COMPANY Shop Management System** - Complete business solution for modern retail operations.
