# 📚 Bloomina Admin Panel - Complete Learning Journal

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Core Architecture](#core-architecture)
5. [Authentication System](#authentication-system)
6. [Admin Pages & Features](#admin-pages--features)
7. [Components](#components)
8. [Context API & State Management](#context-api--state-management)
9. [Database & Supabase Integration](#database--supabase-integration)
10. [Key Features & Functionality](#key-features--functionality)
11. [Routing System](#routing-system)
12. [Styling & Theme](#styling--theme)

---

## Project Overview

**Bloomina Dashboard** is a comprehensive admin panel for an e-commerce platform. It's a full-featured React application built with Vite that allows administrators to manage products, orders, customers, inventory, analytics, marketing campaigns, and more.

### Key Characteristics:
- **Type**: React + Vite Admin Dashboard
- **Purpose**: Complete e-commerce management system
- **Target Users**: Admin staff and managers
- **Features**: Multi-page, real-time updates, role-based access, 2FA authentication
- **Current Version**: 0.0.0

---

## Tech Stack

### Frontend Framework
- **React** v19.2.0 - UI library
- **React Router DOM** v7.13.0 - Client-side routing
- **Vite** v7.2.4 - Build tool and dev server

### Styling & UI
- **Tailwind CSS** v3.4.17 - Utility-first CSS framework
- **PostCSS** v8.5.6 - CSS processing
- **Autoprefixer** v10.4.24 - Browser vendor prefixes
- **Framer Motion** v12.35.0 - Animation library

### Data & Backend
- **Supabase** v2.97.0 - Backend as a Service (PostgreSQL + Auth)
- **PostgreSQL (via pg)** v8.21.0 - Database driver
- **Recharts** v3.7.0 - Data visualization library

### Icons & UI Components
- **Lucide React** v0.563.0 - Icon library
- **QRCode.React** v4.2.0 - QR code generation

### Development Tools
- **ESLint** v9.39.1 - Code linting
- **Babel** - JavaScript compiler
- **TypeScript** (for types)

---

## Project Structure

```
src/
├── App.jsx                    # Main app component with routing
├── main.jsx                   # Entry point
├── styles.css                 # Global styles
│
├── pages/
│   └── admin/                 # Admin panel pages
│       ├── AdminDashboard.jsx         # Main dashboard with KPIs
│       ├── AdminLogin.jsx             # Login with 2FA
│       ├── AdminProducts.jsx          # Product management
│       ├── AdminCategories.jsx        # Category management
│       ├── AdminOrders.jsx            # Order management
│       ├── AdminCustomers.jsx         # Customer profiles
│       ├── AdminInventory.jsx         # Stock management
│       ├── AdminMaterials.jsx         # Material catalog
│       ├── AdminFinance.jsx           # Financial overview
│       ├── AdminPayments.jsx          # Payment tracking
│       ├── AdminAnalytics.jsx         # Analytics & reports
│       ├── AdminMarketAnalytics.jsx   # Market insights
│       ├── AdminMarketing.jsx         # Marketing campaigns
│       ├── AdminCoupons.jsx           # Coupon management
│       ├── AdminSystem.jsx            # System settings
│       ├── AdminSettings.jsx          # Admin preferences
│       ├── AdminSizeGuides.jsx        # Size guide management
│       ├── AdminBrandReviews.jsx      # Customer reviews
│       ├── AdminHero.jsx              # Hero section management
│       └── AdminLeads.jsx             # Customer inquiries
│
├── components/
│   ├── admin/
│   │   ├── AdminLayout.jsx            # Main layout wrapper
│   │   ├── OrderNotificationToast.jsx # Real-time notifications
│   │   └── UniversalAlert.jsx         # Alert component
│   │
│   ├── CategorySection.jsx
│   ├── CustomSelect.jsx
│   ├── FeaturedProducts.jsx
│   ├── FormCheckbox.jsx
│   ├── FormInput.jsx
│   ├── GoogleIcon.jsx
│   ├── ProductPage.jsx
│   ├── SearchModal.jsx
│   ├── Toast.jsx
│   └── TrustBar.jsx
│
├── contexts/
│   ├── AdminAuthContext.jsx   # Admin authentication & 2FA
│   ├── AuthContext.jsx        # User authentication
│   ├── AlertContext.jsx       # Alert/notification state
│   ├── CartContext.jsx        # Shopping cart state
│   ├── CompareContext.jsx     # Product comparison
│   └── WishlistContext.jsx    # Wishlist management
│
├── hooks/
│   └── useNotifications.js    # Real-time notifications hook
│
├── lib/
│   └── supabase.js            # Supabase client configuration
│
├── data/                      # Static data files
│
├── assets/                    # Images, fonts, static files
│
└── types/                     # TypeScript type definitions

public/
├── sw.js                      # Service worker for PWA
├── email_templates/           # Email templates
└── logo/                      # Logo assets
```

---

## Core Architecture

### Application Flow

```
User Visit
    ↓
App.jsx (Router Setup)
    ↓
├─ Public Routes:
│   └─ /admin/login → AdminLogin (Credentials + 2FA)
│
└─ Protected Routes (AdminLayout):
    ├─ Sidebar Navigation
    ├─ Header (with notifications, search, theme, profile)
    └─ Route Outlet → Specific Page Component
        ↓
        Page loads data from Supabase
        ↓
        User interactions trigger updates
        ↓
        Real-time notifications via hooks
```

### Context Providers (App.jsx)

```jsx
<AuthProvider>                    // User authentication
  <AdminAuthProvider>             // Admin authentication + 2FA
    <AlertProvider>               // Global alerts & toasts
      <Router>
        <Routes>
          {/* Admin routes */}
        </Routes>
      </Router>
    </AlertProvider>
  </AdminAuthProvider>
</AuthProvider>
```

---

## Authentication System

### AdminAuthContext Features

**Purpose**: Manages admin user authentication with 2FA (Two-Factor Authentication)

#### Key Concepts:

1. **Session Management**
   - Uses localStorage for session persistence
   - `Bloomina_admin_session_id` → 2FA session UUID
   - `Bloomina_admin_heartbeat_id` → Session tracking ID
   - Prevents session hijacking with stable keys

2. **2FA Flow**
   ```
   User enters email/password
         ↓
   Credentials validated with Supabase Auth
         ↓
   If 2FA enabled:
         ↓
   OTP sent to registered email
         ↓
   User enters OTP
         ↓
   Session created in admin_2fa_sessions table
         ↓
   User marked as admin (admin_approved = true)
         ↓
   Redirected to dashboard
   ```

3. **Role Verification**
   - Checks `admin_approved` flag in profiles table
   - Validates against admin_2fa_sessions
   - Prevents non-admin users from accessing admin panel

4. **Session Tracking**
   - Records all admin logins in user_sessions table
   - Tracks device info, user agent, last activity
   - Enables activity auditing

#### Key Functions:

```javascript
useAdminAuth() → {
  adminUser,           // Current admin user object
  loading,             // Authentication loading state
  authError,           // Error messages
  setAuthError(),      // Set custom error
  needs2FA,            // Whether 2FA is required
  verify2FA(),         // Verify OTP code
  resendOTP(),         // Resend OTP to email
  adminLogout(),       // Logout and clear session
  adminSignUp()        // Admin registration (restricted)
}
```

#### Protection Mechanisms:
- Module-level locks prevent duplicate OTP generation
- Prevents concurrent verification attempts
- Secure heartbeat system for session validity
- Automatic logout on session expiration

---

## Admin Pages & Features

### 1. **AdminDashboard** (Primary Statistics Hub)
**Route**: `/admin`

**Purpose**: Overview of all business metrics

**Key Metrics Displayed**:
- Total Revenue (YTD)
- Total Orders Count
- Total Customers
- Total Products
- New Orders Today
- Low Stock Items Count
- Active Coupons Count
- Category Distribution

**Components**:
- Revenue trend chart (Area chart using Recharts)
- Top-performing categories
- Recent customer inquiries
- Top products by sales
- Quick action cards
- Last updated timestamp

**Data Sources**:
- `orders` table → Total revenue, order count
- `profiles` table → Customer count
- `products` table → Product count, low stock
- `leads` table → Recent inquiries
- `coupons` table → Active coupon count
- `categories` table → Category count

**Features**:
- Real-time data refresh
- Responsive chart visualization
- Quick navigation to related pages
- Loading state management

---

### 2. **AdminLogin** (Authentication Gateway)
**Route**: `/admin/login`

**Purpose**: Secure admin authentication with 2FA

**Stages**:
1. **Credentials Entry**
   - Email input
   - Password input
   - "Sign In" button

2. **2FA Verification**
   - OTP delivery to registered email
   - 6-digit code input
   - "Verify" button
   - "Resend OTP" with countdown timer

**Features**:
- Error handling with user feedback
- Loading states with animations
- Session persistence check (auto-redirect if logged in)
- Lock/unlock logic to prevent race conditions
- Animated transitions between stages
- Resend OTP with 30-second cooldown

**Styling**:
- Shield alert icon for security messaging
- Gradient backgrounds
- Dark mode support
- Responsive mobile layout

---

### 3. **AdminProducts** (Product Catalog Management)
**Route**: `/admin/products`

**Purpose**: Complete product lifecycle management

**Core Features**:

**a) Product Listing**
- Search by name or SKU
- Filter by status, category, price range
- Sort by multiple fields
- Bulk actions (select multiple)
- Pagination (50 items per page)
- Grid/list view toggle
- Quick edit inline

**b) Product Creation/Editing**
- Product name, description
- SKU (unique identifier)
- Category selection
- Price, cost, discount
- Stock quantity
- Images upload (multiple)
- Status (Active/Inactive/Draft)
- Attributes:
  - Brand, Model, Material
  - Dimensions, Weight
  - Color configurations
  - Size variants

**c) Advanced Features**
- Category templates (auto-fill attributes)
- Bulk image upload
- Variant management (colors, sizes)
- Pricing templates
- Attribute presets
- Stock warnings for low inventory
- Image gallery management

**Database Tables Used**:
- `products` → Product data
- `categories` → Category info
- `product_variants` → Size/color options
- `product_images` → Image references

**Code Patterns**:
- CustomDropdown component for selections
- Form input components with validation
- Image preview system
- Async data loading with error handling
- State management for form data

---

### 4. **AdminOrders** (Order Management)
**Route**: `/admin/orders`

**Purpose**: Complete order lifecycle and fulfillment

**Core Features**:

**a) Order Listing**
- Search by order ID, customer email/phone
- Filter by status, date range, payment method
- Sort by date, amount, status
- Pagination (50 orders per page)
- Quick status badges
- Recent orders highlighted

**b) Order Details & Actions**
- Full order information display
- Customer contact details (phone, email, address)
- Itemized products with quantities
- Payment information
- Shipping address
- Order status tracking

**c) Order Management**
- Update tracking number and delivery method
- Change order status (Processing → Shipped → Delivered)
- Add admin notes
- Send notifications to customer
- Manual order creation
- Print order details
- Download invoice/receipt

**d) Manual Order Creation**
- Customer information form
- Product search and selection
- Variant selection (size, color)
- Quantity adjustment
- Discount/coupon application
- Shipping cost adjustment
- Payment method selection

**Status Workflow**:
```
Pending → Processing → Shipped → Delivered → Completed
   ↓                     ↓                        
Cancelled            Failed                    
```

**Database Tables Used**:
- `orders` → Order records
- `order_items` → Products in order
- `profiles` → Customer info
- `products` → Product catalog
- `payment_records` → Payment tracking
- `order_status_history` → Status changes

**Features**:
- Real-time notification system
- UPI payment details for COD/manual payments
- Bulk order selection
- Export capabilities
- Order history tracking

---

### 5. **AdminCategories** (Product Categories)
**Route**: `/admin/categories`

**Purpose**: Organize products into categories

**Features**:
- Create/edit/delete categories
- Category hierarchy (parent-child)
- Category-specific attributes template
- Product count per category
- Category images/icons
- SEO settings
- Active/inactive status

---

### 6. **AdminCustomers** (Customer Management)
**Route**: `/admin/customers`

**Purpose**: Manage customer profiles and relationships

**Features**:
- Customer list with search/filter
- Customer profile view
- Order history per customer
- Contact information
- Wishlist and compare items
- Activity timeline
- Customer segmentation
- Email/communication tools

---

### 7. **AdminInventory** (Stock Management)
**Route**: `/admin/inventory`

**Purpose**: Real-time stock tracking and management

**Features**:
- Stock levels by product
- Low stock alerts (threshold-based)
- Stock history/movements
- Warehouse management
- Batch operations
- Reorder tracking
- Stock adjustments
- Expiration date tracking (where applicable)

---

### 8. **AdminMaterials** (Material/Fabric Catalog)
**Route**: `/admin/materials`

**Purpose**: Manage product materials and compositions

**Features**:
- Material database
- Composition percentages
- Care instructions
- Availability by season
- Cost tracking
- Supplier information
- Bulk operations

---

### 9. **AdminFinance** (Financial Overview)
**Route**: `/admin/finance`

**Purpose**: Revenue and cost analysis

**Features**:
- Revenue trends
- Profit/loss calculations
- Cost breakdown
- Cash flow analysis
- Financial reports (PDF export)
- Period comparisons
- Budget tracking
- Expense management

---

### 10. **AdminPayments** (Payment Processing)
**Route**: `/admin/payments`

**Purpose**: Payment tracking and reconciliation

**Features**:
- Payment method breakdown
- Transaction history
- Payment status tracking
- Refund management
- Dispute handling
- Gateway integration status
- Settlement tracking
- Payment verification

---

### 11. **AdminAnalytics** (Business Intelligence)
**Route**: `/admin/analytics`

**Purpose**: Comprehensive business metrics and trends

**Features**:
- Revenue analytics
- Sales trends over time
- Product performance
- Customer demographics
- Geographic distribution
- Purchase patterns
- Conversion metrics
- Custom date ranges
- Data export (CSV, PDF)

---

### 12. **AdminMarketAnalytics** (Market Insights)
**Route**: `/admin/market-analytics`

**Purpose**: Competitive analysis and market trends

**Features**:
- Market comparison
- Competitor tracking
- Trend analysis
- Price benchmarking
- Market share insights
- Industry reports
- Seasonal trends

---

### 13. **AdminMarketing** (Marketing Campaigns)
**Route**: `/admin/marketing`

**Purpose**: Campaign management and execution

**Features**:
- Campaign creation/editing
- Email campaign builder
- SMS campaign management
- Push notification campaigns
- Campaign scheduling
- Performance tracking
- A/B testing
- Audience segmentation
- Template library

---

### 14. **AdminCoupons** (Discount Management)
**Route**: `/admin/coupons`

**Purpose**: Create and manage promotional codes

**Features**:
- Coupon creation
- Discount type (percentage, fixed amount)
- Usage limits (per customer, total)
- Validity period
- Applicable products/categories
- Performance tracking
- Code generation
- Coupon templates
- Archive/disable coupons

---

### 15. **AdminSystem** (System Management)
**Route**: `/admin/system`

**Purpose**: Platform configuration and maintenance

**Features**:
- Store status management
- Maintenance mode toggle
- Database backups
- System logs
- Error tracking
- Performance metrics
- API status
- Update management

---

### 16. **AdminSettings** (Admin Preferences)
**Route**: `/admin/settings`

**Purpose**: Personal admin account settings

**Features**:
- Profile information
- Password change
- 2FA settings
- Session management
- Activity log
- Preferences (theme, notifications)
- API keys
- Connected devices

---

### 17. **AdminSizeGuides** (Size Reference)
**Route**: `/admin/size-guides`

**Purpose**: Product size specification management

**Features**:
- Size chart creation
- Category-specific guides
- Measurement definitions
- Visual previews
- Multiple variants
- International size conversion
- Publishing/unpublishing

---

### 18. **AdminBrandReviews** (Customer Reviews)
**Route**: `/admin/brand-reviews`

**Purpose**: Monitor and manage customer reviews

**Features**:
- Review listing with filters
- Rating distribution
- Response management
- Moderation tools
- Featured review selection
- Review analytics
- Spam detection

---

### 19. **AdminHero** (Homepage Marketing)
**Route**: `/admin/hero`

**Purpose**: Manage homepage hero section and banners

**Features**:
- Hero banner management
- Featured product blocks
- Promotional sections
- Image uploads
- Link configuration
- Schedule display
- A/B testing variants
- Performance tracking

---

### 20. **AdminLeads** (Customer Inquiries)
**Route**: `/admin/inquiries`

**Purpose**: Track and manage customer inquiries and support

**Features**:
- Inquiry listing
- Status management (new, in-progress, resolved)
- Priority levels
- Assignment to team members
- Response templates
- Email integration
- Follow-up reminders
- Search and filtering
- Inquiry analytics

---

## Components

### AdminLayout.jsx
**Purpose**: Main layout wrapper for all admin pages

**Features**:
- Sidebar navigation
- Top header bar
- Notification center
- User profile menu
- Search functionality
- Theme switcher (light/dark)
- Mobile responsive menu
- Store status indicator
- Order notification toast

**Structure**:
```
AdminLayout
├─ Sidebar (Navigation)
├─ Header (Top bar)
│  ├─ Logo
│  ├─ Search bar
│  ├─ Notifications bell
│  ├─ Theme toggle
│  └─ Profile menu
├─ Main Content Area
│  └─ <Outlet /> (Current page)
└─ Notification Toast
```

**Navigation Items** (Categorized):
1. **General**
   - Dashboard
   - Orders
   - Customers

2. **Catalog & Stock**
   - Products
   - Categories
   - Inventory
   - Materials
   - Size Guides

3. **Finance & Analytics**
   - Finance
   - Payments
   - Analytics
   - Market Analytics

4. **Marketing & Comms**
   - Marketing
   - Coupons
   - Hero Section
   - Brand Reviews
   - Inquiries

5. **Platform**
   - System
   - Settings

**State Management**:
- Theme state (light/dark)
- Mobile menu open/closed
- Notifications open/closed
- Profile menu open/closed
- Search results
- Store status

---

### OrderNotificationToast.jsx
**Purpose**: Real-time order notifications

**Features**:
- Toast notifications for new orders
- Order status updates
- Stacking notifications
- Auto-dismiss with timer
- Click to navigate to order
- Unread count badge
- Notification history

---

### UniversalAlert.jsx
**Purpose**: Global alert/modal component

**Features**:
- Confirmation dialogs
- Error messages
- Success messages
- Custom actions
- Overlay backdrop
- Keyboard dismiss support

---

### CustomSelect.jsx
**Purpose**: Reusable dropdown/select component

**Features**:
- Click outside handling
- Keyboard navigation
- Search within options
- Multi-select support
- Custom styling
- Icon support

---

## Context API & State Management

### 1. AdminAuthContext
**Responsibility**: Admin authentication and 2FA

**Exported Functions**:
```javascript
const {
  adminUser,              // Current logged-in admin
  loading,                // Auth check in progress
  authError,              // Error message
  setAuthError(msg),      // Set error message
  needs2FA,               // Awaiting 2FA verification
  verify2FA(code),        // Verify OTP code
  resendOTP(),            // Resend OTP to email
  adminLogout(),          // Logout current session
  adminSignUp(data)       // Register new admin (restricted)
} = useAdminAuth();
```

**State Managed**:
- Current admin user
- Authentication loading state
- Authentication errors
- 2FA requirement flag
- Pending user (during 2FA)

---

### 2. AlertContext
**Responsibility**: Global alert and notification system

**Exported Functions**:
```javascript
const {
  showAlert(message, type, duration) // Show alert toast
} = useAlert();
```

**Types**:
- `success` - Green success message
- `error` - Red error message
- `warning` - Yellow warning message
- `info` - Blue info message

---

### 3. AuthContext
**Responsibility**: Regular user authentication

**Purpose**: Used for customer authentication in public pages

---

### 4. CartContext
**Responsibility**: Shopping cart state management

**Features**:
- Add/remove items
- Update quantities
- Calculate totals
- Persist to localStorage

---

### 5. CompareContext
**Responsibility**: Product comparison feature

**Features**:
- Compare products side-by-side
- Add/remove products
- Feature comparison

---

### 6. WishlistContext
**Responsibility**: Wishlist management

**Features**:
- Add/remove from wishlist
- Wishlist persistence
- Wishlist count

---

## Database & Supabase Integration

### Supabase Setup
**Location**: `src/lib/supabase.js`

**Connection**:
```javascript
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);
```

### Key Database Tables

#### 1. **profiles**
- `id` (UUID) - User ID
- `email` (text) - User email
- `admin_approved` (boolean) - Admin flag
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### 2. **products**
- `id` (UUID)
- `name` (text)
- `description` (text)
- `sku` (text) - Unique identifier
- `category_id` (UUID) - FK to categories
- `price` (decimal)
- `cost` (decimal)
- `stock` (integer)
- `images` (JSONB) - Array of image URLs
- `status` (text) - Active/Inactive/Draft
- `variants` (JSONB) - Size/color variants
- `colorConfigs` (JSONB) - Color information
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### 3. **orders**
- `id` (UUID)
- `user_id` (UUID) - FK to profiles
- `total` (decimal)
- `status` (text) - Pending/Processing/Shipped/Delivered
- `items` (JSONB) - Order items array
- `shipping_address` (JSONB)
- `payment_method` (text)
- `payment_status` (text)
- `tracking_number` (text)
- `delivery_method` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### 4. **categories**
- `id` (UUID)
- `name` (text)
- `parent_id` (UUID) - For hierarchies
- `created_at` (timestamp)

#### 5. **coupons**
- `id` (UUID)
- `code` (text) - Unique coupon code
- `discount_type` (text) - Percentage/Fixed
- `discount_value` (decimal)
- `is_active` (boolean)
- `usage_limit` (integer)
- `used_count` (integer)
- `valid_from` (timestamp)
- `valid_until` (timestamp)
- `created_at` (timestamp)

#### 6. **leads**
- `id` (UUID)
- `name` (text)
- `email` (text)
- `phone` (text)
- `message` (text)
- `status` (text)
- `created_at` (timestamp)

#### 7. **admin_2fa_sessions**
- `id` (UUID)
- `user_id` (UUID) - FK to profiles
- `session_token` (text) - Session identifier
- `created_at` (timestamp)
- `expires_at` (timestamp)

#### 8. **user_sessions**
- `id` (UUID)
- `user_id` (UUID) - FK to profiles
- `device_name` (text)
- `user_agent` (text)
- `last_seen_at` (timestamp)
- `created_at` (timestamp)

### Common Supabase Queries

**Fetch with count**:
```javascript
const { data, count } = await supabase
  .from('table')
  .select('*', { count: 'exact' })
  .limit(50);
```

**Search/Filter**:
```javascript
const { data } = await supabase
  .from('products')
  .select('*')
  .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
  .eq('status', 'Active');
```

**Insert**:
```javascript
const { data, error } = await supabase
  .from('table')
  .insert([{ field1: value1, field2: value2 }])
  .select();
```

**Update**:
```javascript
const { data, error } = await supabase
  .from('table')
  .update({ field: newValue })
  .eq('id', recordId);
```

**Real-time Subscriptions**:
```javascript
const subscription = supabase
  .channel('table-db-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => { /* Handle changes */ }
  )
  .subscribe();
```

---

## Key Features & Functionality

### 1. Real-Time Notifications
**Hook**: `useNotifications()`

**Features**:
- New order alerts
- Low stock warnings
- Inquiry notifications
- Delivery status updates
- Push notifications support
- Notification history
- Mark as read functionality

**Implementation**:
- Supabase real-time subscriptions
- Web push notifications
- LocalStorage persistence
- Unread count tracking

---

### 2. Search Functionality

**Global Search** (AdminLayout):
- Search across products, orders, customers
- Real-time results
- Keyboard shortcuts (Cmd+K or Ctrl+K)
- Quick navigation

**Page-Specific Search**:
- Products: Search by name/SKU
- Orders: Search by order ID/email/phone
- Customers: Search by name/email
- With debouncing to prevent excessive API calls

---

### 3. Data Filtering & Sorting

**Common Filter Patterns**:
- By date range
- By status
- By category
- By price range
- By stock level
- By customer segment

**Sorting**:
- Ascending/Descending
- Multiple column sort
- Persistent sort preference

---

### 4. Pagination
**Standard Pagination**:
- 50 items per page (configurable per page)
- Previous/Next buttons
- Page number display
- Jump to specific page
- Total count display

---

### 5. File Upload & Image Management
**Supported Formats**:
- JPEG, PNG, WebP for images
- SVG for icons
- CSV for bulk operations

**Features**:
- Drag-and-drop upload
- Multiple file selection
- Progress indication
- Error handling
- Image preview
- Crop/resize tools
- Batch upload

---

### 6. Dark Mode Support
**Implementation**:
- Tailwind dark mode (class-based)
- Theme preference storage
- System preference detection
- Smooth transitions
- Per-page persistence

**CSS Classes Used**:
```css
dark:bg-[#1a1c23]      /* Dark background */
dark:text-white        /* Dark text */
dark:border-slate-700  /* Dark borders */
```

---

### 7. Form Validation
**Input Components**:
- `FormInput` - Text/email/number inputs
- `FormCheckbox` - Checkbox inputs
- `CustomSelect` - Dropdown selects
- `CustomDropdown` - Advanced dropdown

**Validation Patterns**:
- Required field validation
- Email format validation
- Phone number validation
- Number range validation
- Custom validators

---

### 8. Error Handling
**Error Display**:
- Toast notifications
- Form field errors
- Modal error dialogs
- Inline error messages
- Error logging to console

**Error Types**:
- Network errors
- Validation errors
- Permission errors
- Database errors
- Timeout errors

---

## Routing System

### Route Structure
**Base Path**: `/admin`

**Authentication Routes**:
- `GET /admin/login` → AdminLogin (public)

**Protected Routes** (require AdminAuthContext.adminUser):
- `GET /admin` → AdminDashboard
- `GET /admin/orders` → AdminOrders
- `GET /admin/customers` → AdminCustomers
- `GET /admin/products` → AdminProducts
- `GET /admin/categories` → AdminCategories
- `GET /admin/inventory` → AdminInventory
- `GET /admin/materials` → AdminMaterials
- `GET /admin/finance` → AdminFinance
- `GET /admin/payments` → AdminPayments
- `GET /admin/analytics` → AdminAnalytics
- `GET /admin/market-analytics` → AdminMarketAnalytics
- `GET /admin/marketing` → AdminMarketing
- `GET /admin/coupons` → AdminCoupons
- `GET /admin/system` → AdminSystem
- `GET /admin/settings` → AdminSettings
- `GET /admin/size-guides` → AdminSizeGuides
- `GET /admin/brand-reviews` → AdminBrandReviews
- `GET /admin/hero` → AdminHero
- `GET /admin/inquiries` → AdminLeads

### Route Protection
```javascript
// AdminLayout wraps all protected routes
<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<AdminDashboard />} />
  {/* Protected child routes */}
</Route>

// Inside AdminLayout:
if (!adminUser && !loading) return <Navigate to="/admin/login" />;
```

### Programmatic Navigation
```javascript
const navigate = useNavigate();

// Navigate to order
navigate(`/admin/orders?id=${orderId}`);

// With replacement (replace history)
navigate('/admin', { replace: true });
```

---

## Styling & Theme

### Tailwind CSS Configuration
**Color Scheme**:
- Primary: `#944555` (Rose/burgundy)
- Background light: `white`
- Background dark: `#1a1c23`
- Text dark: `slate-900`
- Text light: `slate-300`

### Common Utility Classes
**Spacing**:
- `px-4`, `py-2` - Padding
- `mb-6`, `mt-4` - Margin
- `gap-4` - Gap between flex items

**Colors**:
- `bg-slate-50` - Light background
- `dark:bg-[#1a1c23]` - Dark background
- `text-slate-900` - Dark text
- `dark:text-white` - Light text

**Borders & Shadows**:
- `border border-slate-200` - Light border
- `dark:border-slate-700` - Dark border
- `shadow-lg` - Large shadow
- `rounded-xl` - Rounded corners

**Responsive**:
- `sm:`, `md:`, `lg:`, `xl:` - Breakpoints
- `hidden sm:block` - Show on desktop only
- `w-full sm:w-1/2` - Full width on mobile, half on desktop

### Dark Mode Variables
```css
:root {
  --color-primary: #944555;
  --color-dark-bg: #1a1c23;
  --color-dark-border: #374151;
}

.dark {
  background-color: var(--color-dark-bg);
  color: white;
}
```

### Animation Library (Framer Motion)
Used for:
- Page transitions
- Modal animations
- Hover effects
- Loading spinners
- Slide-in notifications

**Example**:
```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

---

## Development Notes

### Environment Variables Required
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Running the Application
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Development Workflow

1. **Create New Admin Page**
   - Create component in `src/pages/admin/`
   - Add route in `App.jsx`
   - Add navigation link in `AdminLayout.jsx`
   - Use `useAlert()` for notifications
   - Fetch data from Supabase using hooks

2. **Add New Feature**
   - Identify if it needs global state → Use/create Context
   - Identify if it's reusable → Create in `components/`
   - Use existing patterns (forms, tables, modals)
   - Add proper error handling
   - Test with different data states (loading, empty, error)

3. **Database Changes**
   - Create table/schema in Supabase
   - Update Supabase client if needed
   - Add type definitions if using TypeScript
   - Test queries in admin pages
   - Handle edge cases (null values, permissions)

### Common Patterns

**Data Fetching**:
```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const { showAlert } = useAlert();

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('table')
        .select('*');
      if (error) throw error;
      setData(data);
    } catch (e) {
      showAlert(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);
```

**Form Submission**:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const { error } = await supabase
      .from('table')
      .insert([formData]);
    if (error) throw error;
    showAlert('Success!', 'success');
    // Reset or navigate
  } catch (e) {
    showAlert(e.message, 'error');
  } finally {
    setLoading(false);
  }
};
```

---

## Performance Considerations

### Optimization Techniques

1. **Data Fetching**
   - Pagination to limit data per request
   - Debouncing search queries
   - Caching where appropriate
   - Only fetch needed columns

2. **Rendering**
   - Virtualization for long lists (if needed)
   - Memo for expensive components
   - Keys in lists to prevent re-renders
   - Lazy loading images

3. **State Management**
   - Keep local state when possible
   - Use context only for global state
   - Avoid deeply nested objects

4. **Bundle Size**
   - Tree-shaking unused imports
   - Code splitting for pages (Vite handles this)
   - Lucide icons are small
   - Tailwind CSS purges unused styles

---

## Security Considerations

### Authentication & Authorization
- 2FA mandatory for admin accounts
- Session tracking with heartbeat
- Secure localStorage keys
- Automatic logout on expiration
- Role-based access control

### Data Protection
- All requests go through Supabase Auth
- Row-level security (RLS) policies on tables
- Admin-only data endpoints
- Secure API key handling (env variables)

### Input Validation
- Sanitize user input
- Validate file uploads
- Check file size/type
- Escape data in displays

---

## Troubleshooting Guide

### Common Issues

**Admin can't login despite correct credentials**
- Check 2FA is enabled in database
- Verify `admin_approved` flag in profiles
- Check if admin_2fa_sessions has active session
- Review browser console for errors

**Data not updating in real-time**
- Verify Supabase subscription is active
- Check network tab for failed requests
- Ensure RLS policies allow the operation
- Restart development server

**Styles not applying**
- Check Tailwind class names
- Verify dark mode class on html element
- Clear browser cache
- Check PostCSS is running

**Charts not displaying**
- Verify Recharts library imported
- Check data format matches chart expectations
- Inspect browser console for errors
- Ensure responsive container has height

---

## Learning Resources

### Key Files to Understand First
1. `App.jsx` - Overall structure
2. `components/admin/AdminLayout.jsx` - Navigation & layout
3. `contexts/AdminAuthContext.jsx` - Authentication logic
4. `pages/admin/AdminDashboard.jsx` - Example page structure

### Documentation Links
- React: https://react.dev
- React Router: https://reactrouter.com
- Tailwind CSS: https://tailwindcss.com
- Supabase: https://supabase.com/docs
- Framer Motion: https://www.framer.com/motion
- Recharts: https://recharts.org

---

## Summary

The Bloomina Admin Panel is a comprehensive, well-structured React application that demonstrates:

✅ **Modern React patterns** - Hooks, Context API, custom hooks
✅ **Supabase integration** - Real-time databases, authentication, RLS
✅ **Complex state management** - Multiple contexts, local state, async operations
✅ **Professional UI/UX** - Dark mode, animations, responsive design
✅ **Security best practices** - 2FA, role-based access, secure sessions
✅ **Scalable architecture** - Organized folder structure, reusable components
✅ **Business logic** - E-commerce operations, financial tracking, analytics

This application serves as an excellent reference for building enterprise-level admin dashboards with React and Supabase!

---

**Document Version**: 1.0
**Last Updated**: May 24, 2026
**Total Pages**: 21
**Total Admin Pages**: 20
**Total Components**: 10+
**Total Contexts**: 6
