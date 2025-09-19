# 🏪 SONIC COMPANY - Complete Shop Management System

A comprehensive online shop management system with customer accounts, inventory tracking, payment management, and advanced data export capabilities.

## 🚀 Features

### 📦 **Item Management**
- Complete inventory tracking with barcodes
- Stock level monitoring with low stock alerts
- Purchase and retail price management
- Category and supplier organization
- Search and filter capabilities
- **NEW:** CSV and Excel export functionality

### 👥 **Customer Account System**
- Customer registration and profile management
- Credit limit and balance tracking
- Payment history and transaction records
- Outstanding balance monitoring
- Customer search and filtering
- **NEW:** CSV and Excel export functionality

### 💰 **Payment & Transaction Management**
- Full payment (Cash/Card)
- Partial payment (On Account)
- Credit sales tracking
- Payment history
- Outstanding balance management
- Receipt generation
- **NEW:** Debt management with payment tracking

### 📊 **Business Dashboard**
- Real-time business statistics
- Low stock item alerts
- Outstanding balance overview
- Recent transaction history
- Quick action buttons
- **NEW:** Complete data export (CSV/Excel)

### 🧾 **POS Invoice System**
- Professional invoice creation
- Multiple payment methods
- Customer account integration
- Invoice navigation and management
- Print-ready invoices
- **NEW:** Invoice search by number
- **NEW:** Smooth navigation with slide animations
- **NEW:** CSV and Excel export functionality

### 🔐 **Security & Login System**
- Secure login with session management
- User authentication
- Session timeout protection
- **NEW:** Complete data clearing functionality

### 💾 **Data Management & Backup**
- **NEW:** CSV export for all data types
- **NEW:** Excel export with formatting
- **NEW:** Complete system backup
- **NEW:** Data restore functionality
- **NEW:** Clear all data option
- Local data storage with localStorage

## 📁 File Structure

```
pos_invoice_system/
├── index.html              # Home Page & Main Menu
├── home.html               # Home Page (Alternative)
├── login.html              # Login Page
├── login.js                # Login Logic
├── sale.html               # Main POS Interface
├── script.js               # Core POS Logic
├── script_backup.js        # Backup Script
├── styles.css              # Main Styling
├── shared.js               # Shared Data Management
├── items.html              # Item Management Interface
├── items.js                # Item Management Logic
├── customers.html          # Customer Management Interface
├── customers.js            # Customer Management Logic
├── dashboard.html          # Business Dashboard
├── dashboard.js            # Dashboard Logic
├── debt-management.html    # Debt Management Interface
├── clear-data.html         # Clear Data Page
├── manifest.json           # PWA Manifest
├── sw.js                   # Service Worker
├── sonic logo.png          # Company Logo
├── files-checklist.md      # Deployment Checklist
├── PWA_INSTRUCTIONS.md     # PWA Setup Guide
├── QUICK_START.md          # Quick Start Guide
├── SECURITY_FEATURES.md    # Security Documentation
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
- Open `index.html` to access the login page
- Login with your credentials to access the main system
- The system will automatically initialize with sample data
- Use the navigation buttons to access different modules

### 2. **Managing Items**
- Click the **"Items"** button to open Item Management
- Add new items with barcodes, prices, and stock levels
- Monitor low stock items and update inventory
- Search and filter items by name, barcode, or category
- **NEW:** Export items to CSV or Excel format

### 3. **Managing Customers**
- Click the **"Customers"** button to open Customer Management
- Add new customers with contact information and credit limits
- Track customer balances and payment history
- Record payments and manage outstanding balances
- **NEW:** Export customer data to CSV or Excel format

### 4. **Creating Invoices**
- Use the main POS interface to create invoices
- Select customers from the dropdown (auto-populated from customer database)
- Add items with quantities and prices
- Choose payment method (Cash, Card, On Account)
- Save invoices and print receipts
- **NEW:** Search for invoices by number using the search box
- **NEW:** Navigate between invoices with smooth slide animations
- **NEW:** Export invoices to CSV or Excel format

### 5. **Monitoring Business**
- Click the **"Dashboard"** button to view business overview
- Monitor key statistics and performance metrics
- View low stock alerts and outstanding balances
- Access quick actions for common tasks
- **NEW:** Export complete business data to CSV or Excel

### 6. **Data Management & Backup**
- **Backup to File:** Choose CSV or Excel format from home page
- **Export Individual Data:** Use CSV/Excel buttons on each page
- **Clear All Data:** Use the red "Clear All Data" button on home page
- **Restore Data:** Use the "Restore from Backup" option

### 7. **Advanced Features**
- **Invoice Search:** Type invoice number in search box (e.g., "1", "INV-0001")
- **Navigation:** Use arrow buttons to browse through saved invoices
- **Print Invoices:** Professional print-ready invoice format
- **Debt Management:** Track customer payments and outstanding balances

## 💾 Data Management

### **Data Storage**
- All data is stored in browser localStorage
- Data persists between browser sessions
- No external database required
- Data is automatically backed up locally

### **Export & Backup Features**
- **CSV Export:** Compatible with Excel, Google Sheets, and other spreadsheet applications
- **Excel Export:** Native Excel format with proper formatting and headers
- **Individual Exports:** Export invoices, customers, or items separately
- **Complete Data Export:** Export all system data in one file
- **Automatic File Naming:** Files include current date for easy organization
- **Data Backup:** Complete system backup with restore functionality
- **Clear Data:** Complete system reset with confirmation dialogs

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
- **NEW:** Advanced data export capabilities

### ✅ **User-Friendly Interface**
- Intuitive design with modern UI
- Responsive layout for different screen sizes
- Professional appearance suitable for business use
- **NEW:** Smooth animations and transitions
- **NEW:** Invoice search functionality

### ✅ **Comprehensive Features**
- Inventory management with stock tracking
- Customer relationship management
- Financial tracking and reporting
- Professional invoice generation
- **NEW:** Debt management and payment tracking
- **NEW:** Multiple export formats (CSV/Excel)
- **NEW:** Complete data backup and restore

### ✅ **Scalable Architecture**
- Modular design for easy expansion
- Clean code structure for maintenance
- Extensible data model for future features
- **NEW:** PWA support for mobile devices
- **NEW:** Service worker for offline functionality

### ✅ **Data Management**
- **NEW:** Export data in multiple formats
- **NEW:** Complete system backup
- **NEW:** Easy data restoration
- **NEW:** Clear all data functionality
- **NEW:** Automatic file naming with dates

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

## 🚀 Recent Updates & Future Enhancements

### **Recently Added Features**
- ✅ **Invoice Search:** Search invoices by number with smart formatting
- ✅ **Data Export:** CSV and Excel export for all data types
- ✅ **Smooth Navigation:** Slide animations for invoice browsing
- ✅ **Complete Backup:** Full system backup and restore functionality
- ✅ **Clear Data:** Complete system reset with confirmation
- ✅ **Login System:** Secure authentication with session management
- ✅ **PWA Support:** Progressive Web App capabilities
- ✅ **Debt Management:** Enhanced customer payment tracking

### **Potential Future Additions**
- Barcode scanner integration
- Cloud storage synchronization
- Advanced reporting and analytics
- Multi-location support
- Employee management
- Tax calculation and reporting
- Email notifications
- Mobile app version
- Real-time inventory updates
- Advanced search filters
- Automated backup scheduling

## 📝 License

This system is provided as-is for business use. Feel free to modify and customize according to your needs.

---

**SONIC COMPANY Shop Management System** - Complete business solution for modern retail operations.
