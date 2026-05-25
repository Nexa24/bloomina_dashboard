# Bloomina Admin Dashboard Manual

> Print-ready learning, operations, and onboarding manual for the full admin panel.
>
> **Document type:** Internal handbook
> **Audience:** Admin staff, operators, leads, and new team members
> **Suggested export:** A4 portrait PDF with page numbers, running header, and section dividers
> **Version:** 1.0
> **Last updated:** May 24, 2026

---

## Table of Contents
1. [How to Use This Manual](#how-to-use-this-manual)
2. [Platform Overview](#platform-overview)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Architecture](#core-architecture)
6. [Authentication and Access Control](#authentication-and-access-control)
7. [Admin Layout and Navigation](#admin-layout-and-navigation)
8. [All Admin Pages](#all-admin-pages)
9. [Detailed Workflows](#detailed-workflows)
10. [Automated Demonstration Playbooks](#automated-demonstration-playbooks)
11. [Components and Contexts](#components-and-contexts)
12. [Database and Supabase Reference](#database-and-supabase-reference)
13. [Search, Filter, Sort, and Pagination](#search-filter-sort-and-pagination)
14. [Media and File Handling](#media-and-file-handling)
15. [Validation, Error Handling, and Alerts](#validation-error-handling-and-alerts)
16. [Security and Compliance](#security-and-compliance)
17. [Performance and Reliability](#performance-and-reliability)
18. [Daily Operations Checklist](#daily-operations-checklist)
19. [Weekly Audit Checklist](#weekly-audit-checklist)
20. [Incident Response Checklist](#incident-response-checklist)
21. [Troubleshooting Guide](#troubleshooting-guide)
22. [Glossary](#glossary)
23. [Appendices](#appendices)

---

## How to Use This Manual

This manual is designed to be both a **learning journal** and a **printed operational handbook**.

Use it in three ways:
- **Onboarding:** Read from top to bottom to understand the whole admin panel.
- **Reference:** Jump to a specific page, workflow, or troubleshooting section.
- **Printing/PDF:** Export to PDF for a physical desk manual or team handbook.

### Print recommendations
- Paper size: A4 portrait
- Margins: 18–22 mm
- Font: 10.5–11.5 pt body text
- Headings: 16–24 pt hierarchy
- Headers: manual title + section name
- Footers: page number + version + date
- Keep code blocks and tables on separate pages if possible

### What this manual includes
- Every major admin module
- Field-by-field workflows
- Step-by-step walkthroughs
- Automated demonstration playbooks
- Database and context reference
- Security and reliability notes
- Checklists for daily, weekly, and incident response operations

---

## Platform Overview

Bloomina Admin Dashboard is a **full e-commerce administration platform** built for store operations, order fulfillment, catalog management, analytics, customer support, marketing, finance, and system control.

### What the admin panel does
- Manages the product catalog from creation to publication
- Processes and tracks orders end-to-end
- Maintains inventory, materials, and size guides
- Reviews analytics, sales, and market trends
- Manages coupons, campaigns, hero content, and promotions
- Monitors customers, inquiries, and brand reviews
- Controls system status, settings, and operational health

### Business purpose
The dashboard is the internal control center for the store. It is used to:
- Keep products accurate and up to date
- Maintain order flow and customer satisfaction
- Monitor revenue and business health
- Reduce operational mistakes
- Support fast resolution of problems

### Primary user roles
- **Admin:** Full platform access
- **Operator:** Day-to-day management of catalog, orders, and support
- **Manager:** Analytics, approvals, audits, and escalations
- **Support staff:** Inquiries, reviews, and customer response

---

## Technology Stack

### Frontend
- React 19
- React Router DOM
- Vite
- Framer Motion
- Recharts

### Styling and UI
- Tailwind CSS
- PostCSS
- Autoprefixer
- Lucide React icons

### Backend and data
- Supabase
- PostgreSQL
- Supabase Auth
- Real-time subscriptions

### Supporting tools
- ESLint
- QRCode.React
- Browser localStorage/session usage

### Development and runtime patterns
- Component-driven pages
- Context-based global state
- Supabase table operations
- Real-time data updates
- Dark mode class toggling

---

## Project Structure

### Main source areas
- `src/App.jsx` — routing and app-level provider tree
- `src/pages/admin/` — admin modules/pages
- `src/components/admin/` — shared admin UI shell and notifications
- `src/contexts/` — auth, alerts, cart, compare, wishlist
- `src/hooks/` — custom notification hooks
- `src/lib/supabase.js` — Supabase client configuration

### Admin pages included
- Dashboard
- Login
- Products
- Categories
- Orders
- Customers
- Inventory
- Materials
- Finance
- Payments
- Analytics
- Market Analytics
- Marketing
- Coupons
- System
- Settings
- Size Guides
- Brand Reviews
- Hero
- Leads/Inquiries
- Help/Journal

### Supporting components
- AdminLayout
- OrderNotificationToast
- UniversalAlert
- CustomSelect and reusable form controls
- Search and toast components

---

## Core Architecture

### App flow
1. User visits the app.
2. Router resolves public or protected route.
3. Providers initialize auth, alerts, and admin session state.
4. AdminLayout renders shell UI for protected routes.
5. Each page fetches data from Supabase.
6. UI updates based on state, notifications, and interactions.

### Provider order
```jsx
<AuthProvider>
  <AdminAuthProvider>
    <AlertProvider>
      <Router>
        <Routes />
      </Router>
    </AlertProvider>
  </AdminAuthProvider>
</AuthProvider>
```

### Design principles
- Keep pages focused on a single business domain
- Reuse shared controls and alerts
- Use local state for page-specific behavior
- Use contexts only for cross-app concerns
- Prefer clear, traceable Supabase operations

---

## Authentication and Access Control

### Admin login flow
1. Open `/admin/login`
2. Enter email and password
3. Validate credentials through Supabase Auth
4. If 2FA is enabled, verify OTP
5. Confirm admin approval role
6. Redirect to `/admin`

### Session concepts
- `Bloomina_admin_session_id` — stable 2FA session key
- `Bloomina_admin_heartbeat_id` — session tracking heartbeat key
- `admin_approved` — profile flag for admin access
- `admin_2fa_sessions` — table used to track 2FA session records
- `user_sessions` — table used to track login activity and device info

### Protection methods
- 2FA enforcement for admin access
- Duplicate verification lock protection
- Session heartbeat tracking
- Auto-redirect on valid session
- Logout on invalid or expired session

### Good admin practice
- Never share admin credentials
- Verify device/session history periodically
- Log out after use on shared devices
- Review error messages without bypassing security checks

---

## Admin Layout and Navigation

### Main layout responsibilities
- Sidebar navigation
- Header actions
- Search
- Notifications
- Theme toggle
- Profile menu
- Store status
- Responsive mobile menu

### Sidebar groups
#### Core Operations
- Dashboard
- Orders
- Customers
- Inquiries

#### Catalog and Stock
- Products
- Categories
- Inventory
- Materials
- Size Guides

#### Finance and Growth
- Finance
- Payments
- Analytics
- Market Analytics
- Marketing
- Coupons

#### Storefront Control
- Hero
- Brand Reviews
- System
- Settings

#### Support and Learning
- Help / Journal

### Header utilities
- Global search shortcut
- Notifications bell
- Theme switch
- Profile dropdown
- Store online/offline indicator

---

## All Admin Pages

### 1. AdminDashboard
**Purpose:** Command center with KPIs and summaries.

**Shows:**
- Revenue
- Orders
- Customers
- Products
- New orders today
- Low stock count
- Active coupons
- Category distribution

**Data sources:**
- orders
- profiles
- products
- leads
- coupons
- categories

**Use when:**
- Starting the workday
- Checking business health
- Monitoring trends
- Jumping to urgent tasks

### 2. AdminLogin
**Purpose:** Secure access gateway.

**Includes:**
- Email/password login
- OTP verification
- Resend timer
- Redirect protection
- Loading/error states

### 3. AdminProducts
**Purpose:** Full product lifecycle management.

**Includes:**
- Search/filter/sort
- Create/edit products
- Upload images
- Manage variants
- Set category, price, SKU, stock, and status
- Publish or archive products

### 4. AdminCategories
**Purpose:** Product taxonomy and grouping.

**Includes:**
- Category creation and editing
- Parent-child hierarchy
- Template mapping
- Category visibility
- Product count awareness

### 5. AdminOrders
**Purpose:** Order processing and fulfillment.

**Includes:**
- Order search and list view
- Status updates
- Tracking updates
- Manual order creation
- Shipping and payment handling
- Notifications to customer

### 6. AdminCustomers
**Purpose:** Customer records and relationship history.

**Includes:**
- Customer lookup
- Orders per customer
- Contact details
- Segmentation clues
- Activity and communication context

### 7. AdminInventory
**Purpose:** Stock monitoring and restocking.

**Includes:**
- Current stock
- Low stock alerts
- Batch changes
- Reorder planning
- Movement tracking

### 8. AdminMaterials
**Purpose:** Material catalog and composition reference.

**Includes:**
- Material records
- Composition percentages
- Care instructions
- Supplier and cost context

### 9. AdminFinance
**Purpose:** Financial overview.

**Includes:**
- Revenue
- Costs
- Profit and loss signals
- Period comparisons
- Budget/expense visibility

### 10. AdminPayments
**Purpose:** Payment tracking and reconciliation.

**Includes:**
- Payment method breakdown
- Payment history
- Refund/dispute management
- Settlement progress

### 11. AdminAnalytics
**Purpose:** Business intelligence reporting.

**Includes:**
- Trend analysis
- Sales performance
- Customer behavior
- Conversion metrics
- Export-friendly views

### 12. AdminMarketAnalytics
**Purpose:** Market insight and external comparison.

**Includes:**
- Market trends
- Competitor context
- Seasonal behavior
- Price benchmarking

### 13. AdminMarketing
**Purpose:** Campaign creation and management.

**Includes:**
- Campaign setup
- Segmentation
- Scheduling
- Tracking performance
- Multi-channel planning

### 14. AdminCoupons
**Purpose:** Discount and promotion control.

**Includes:**
- Coupon creation
- Percentage/fixed discounts
- Usage restrictions
- Validity period
- Scope by product/category

### 15. AdminSystem
**Purpose:** System health and maintenance.

**Includes:**
- Store status control
- Logs
- Storage and database indicators
- Maintenance toggles

### 16. AdminSettings
**Purpose:** Admin and store settings.

**Includes:**
- Profile details
- Support contact info
- Store config
- Notification settings
- Timezone/currency

### 17. AdminSizeGuides
**Purpose:** Size chart management.

**Includes:**
- Category-specific charts
- Measurement definitions
- Visual previews
- Publishing controls

### 18. AdminBrandReviews
**Purpose:** Review moderation and brand trust.

**Includes:**
- Review filtering
- Responses
- Moderation tools
- Rating trends

### 19. AdminHero
**Purpose:** Homepage banner and hero content.

**Includes:**
- Banner blocks
- Featured sections
- Scheduling and visibility
- Link/image controls

### 20. AdminLeads
**Purpose:** Inquiry and lead handling.

**Includes:**
- New inquiries
- Status changes
- Assignments and follow-ups
- Search and filtering

### 21. AdminHelp
**Purpose:** In-app learning and manual.

**Includes:**
- Searchable help content
- Automated demos
- Detailed workflows
- Troubleshooting and quick reference

---

## Detailed Workflows

### Workflow 1: Create Product

#### Preconditions
- You are signed in as an admin
- You can access `/admin/products`
- Product data, images, and pricing are ready

#### Step-by-step
1. Open **Products**.
2. Click **Create Product** or **Add Product**.
3. Choose **Product Type**.
   - Examples: Apparel, Footwear, Accessories, Electronics, Home Decor.
4. Enter **Product Name**.
   - Use a customer-facing, readable title.
5. Select **Category**.
   - If applicable, choose subcategory.
6. Enter **SKU**.
   - Must be unique.
7. Fill **Price**.
8. Fill **Cost**.
9. Add **Discount** if used.
10. Add **Stock Quantity**.
11. Add **Product Attributes**.
    - Brand
    - Material
    - Fit
    - Dimensions
    - Weight
    - Special features
12. Add **Variants**.
    - Size
    - Color
    - Color config
13. Upload **Images**.
    - Cover image first
    - Gallery images after
14. Set **Status**.
    - Draft or Active
15. Save the product.
16. Verify product in list view.
17. Search by name or SKU to confirm publication.

#### Validation checks
- Product name is not empty
- SKU is unique
- Price is numeric and valid
- Stock is a non-negative integer
- At least one image exists if required by store policy
- Variants match category logic

#### Common errors
- Missing category
- Duplicate SKU
- Invalid image upload
- Price not set
- Stock below operational threshold

#### Rollback
- Save as Draft instead of Active
- Remove invalid images or variants
- Correct SKU and republish

---

### Workflow 2: Update Order

#### Preconditions
- Order exists in the system
- You have permission to edit order details

#### Step-by-step
1. Open **Orders**.
2. Search by order ID, email, or phone.
3. Open the order detail panel.
4. Review customer details.
5. Review payment status.
6. Review shipping address.
7. Enter or update **Delivery Method**.
8. Enter or update **Tracking Number**.
9. Move order status forward.
   - Processing → Shipped → Delivered
10. Add admin note if needed.
11. Notify the customer.
12. Save changes.
13. Re-open the order to confirm saved data.

#### Validation checks
- Tracking number format is correct
- Delivery method is selected
- Status change aligns with actual fulfillment stage
- No duplicate or conflicting updates exist

#### Common errors
- Wrong order selected
- Missing tracking number
- Payment incomplete
- Shipping address needs correction

#### Rollback
- Revert to previous status if shipment has not left
- Clear tracking number if entered incorrectly
- Add note describing the correction

---

### Workflow 3: Create Coupon or Campaign Offer

#### Preconditions
- You know the promo objective
- You know discount scope and duration

#### Step-by-step
1. Open **Coupons**.
2. Click **Create Coupon**.
3. Enter coupon code.
4. Choose discount type.
   - Percentage or fixed amount
5. Enter discount value.
6. Set usage rules.
   - Total usage limit
   - Per-customer limit
7. Set validity dates.
8. Scope coupon to products or categories.
9. Activate coupon.
10. Save.
11. Test it in a cart or manual order.
12. Confirm discount calculation is correct.

#### Validation checks
- Code is unique and readable
- Validity window is correct
- Discount type matches business plan
- Limits are not too high or too low

#### Rollback
- Disable the coupon
- Edit validity window
- Correct scope or discount value

---

### Workflow 4: Check Inventory and Restock

#### Step-by-step
1. Open **Inventory**.
2. Review low stock items.
3. Filter by category or threshold if needed.
4. Open a product to inspect current stock.
5. Plan restock quantity.
6. Save updated stock.
7. Confirm product no longer appears in urgent low-stock state.

#### Validation checks
- Stock update is reflected in list view
- Thresholds remain consistent
- Product status is not broken by the update

---

### Workflow 5: Answer an Inquiry

#### Step-by-step
1. Open **Inquiries**.
2. Find the lead by name, email, or date.
3. Open message details.
4. Review conversation context.
5. Set status to in-progress or resolved.
6. Assign follow-up if required.
7. Reply using template or custom note.
8. Save and verify status.

---

## Automated Demonstration Playbooks

These are simulation-style playbooks for training, onboarding, and printed reference.

### Playbook 1: Add Product Demo

#### Goal
Demonstrate full product creation without missing a field.

#### Steps
1. Open Products.
2. Click Create Product.
3. Select product type.
4. Enter product name.
5. Select category.
6. Add SKU.
7. Add price, cost, and discount.
8. Add stock.
9. Add attributes.
10. Add variants.
11. Upload images.
12. Set status.
13. Save.
14. Search to verify result.

#### Expected result
A live product appears in the catalog with correct metadata and images.

#### Field checklist
- Product type
- Product name
- Category
- SKU
- Price
- Cost
- Discount
- Stock
- Attributes
- Variants
- Images
- Status

#### QA checkpoint
- Search by name
- Search by SKU
- Open product and verify image gallery

#### Rollback
- Switch to Draft
- Correct fields
- Re-save and retest

---

### Playbook 2: Process Order Demo

#### Goal
Simulate the complete order update flow.

#### Steps
1. Open Orders.
2. Search order.
3. Open details.
4. Confirm customer and payment data.
5. Set delivery method.
6. Add tracking number.
7. Change status to shipped.
8. Notify customer.
9. Confirm delivery later.

#### Expected result
Order status and shipping data are recorded accurately.

#### Field checklist
- Order ID
- Delivery method
- Tracking number
- Status
- Admin note

#### QA checkpoint
- Re-open order
- Verify persistence
- Confirm timeline/history

#### Rollback
- Return to previous status if shipment not sent
- Remove incorrect tracking number

---

### Playbook 3: Coupon Campaign Demo

#### Goal
Create and validate a discount offer.

#### Steps
1. Open Coupons.
2. Create coupon.
3. Enter code.
4. Choose discount type and value.
5. Set usage limits.
6. Set validity window.
7. Select product/category scope.
8. Activate coupon.
9. Test in cart.

#### Expected result
Discount applies correctly at checkout.

#### Field checklist
- Code
- Type
- Value
- Usage limit
- Validity dates
- Scope
- Active status

#### QA checkpoint
- Test checkout discount
- Verify expiry handling

#### Rollback
- Deactivate coupon
- Adjust configuration

---

### Playbook 4: Inquiry Response Demo

#### Goal
Simulate support workflow.

#### Steps
1. Open Inquiries.
2. Select message.
3. Review issue.
4. Change status.
5. Respond.
6. Mark resolved.

#### Expected result
Lead moves through support pipeline cleanly.

---

## Components and Contexts

### Key components
- AdminLayout
- OrderNotificationToast
- UniversalAlert
- SearchModal
- CustomSelect
- FormInput
- FormCheckbox
- Toast

### Contexts
- AdminAuthContext
- AlertContext
- AuthContext
- CartContext
- CompareContext
- WishlistContext

### What each context does
- **AdminAuthContext:** admin access, 2FA, session state
- **AlertContext:** global toast and alert messages
- **AuthContext:** customer sign-in/session state
- **CartContext:** cart items and totals
- **CompareContext:** product comparison set
- **WishlistContext:** wishlist items

### Hook usage
- `useNotifications()` for live notifications
- Search and alert patterns should be reused consistently

---

## Database and Supabase Reference

### Core tables
#### profiles
- User profile records
- Admin approval flags
- Contact and identity data

#### products
- Catalog items
- Pricing and stock
- Variants and image references

#### orders
- Order records
- Status, totals, payment, shipping

#### categories
- Category hierarchy
- Parent-child relationships

#### coupons
- Promo code rules
- Usage and validity

#### leads
- Customer inquiries
- Support queue entries

#### admin_2fa_sessions
- 2FA session records

#### user_sessions
- Activity and heartbeat sessions

#### system_config
- Storefront and platform settings

#### system_logs
- Operational event history

### Typical queries
- Select with count for dashboard metrics
- Search with OR/ILIKE for products and customers
- Insert for create flows
- Update for status and stock changes
- Real-time subscription for live order/log updates

### Data handling best practices
- Select only needed columns
- Validate input before update/insert
- Handle empty and null states
- Keep queries small and targeted

---

## Search, Filter, Sort, and Pagination

### Search
- Use global search for fast navigation
- Use page-specific search for operational lists
- Search by name, SKU, email, phone, or ID depending on page

### Filter
- Filter by category, status, date, price, and stock
- Combine filters when needed
- Reset filters before re-testing edge cases

### Sort
- Sort by newest, oldest, price, stock, status, or name
- Use consistent sort state in list pages

### Pagination
- Default operational list size is 50 items per page in many pages
- Use pagination to avoid heavy data loads
- Keep page number visible and stable

---

## Media and File Handling

### Image upload rules
- Prefer optimized JPG/PNG/WebP
- Use one clear cover image
- Add supporting gallery images
- Confirm image order before publishing

### Common media tasks
- Replace image
- Delete bad upload
- Reorder gallery
- Confirm preview after upload
- Keep filenames understandable

### Validation checks
- File type supported
- File size acceptable
- Aspect ratio suitable for storefront
- Image loads correctly in preview

---

## Validation, Error Handling, and Alerts

### Validation examples
- Required fields must not be empty
- SKU must be unique
- Price and stock must be numeric
- Dates must be logically ordered
- Status transitions must match business flow

### Error handling patterns
- Show user-friendly alert messages
- Keep technical errors in console logs
- Preserve form state on validation failure
- Prevent partial save where possible

### Alerts
- Success: action completed
- Error: action failed
- Warning: action may need review
- Info: guidance or status update

---

## Security and Compliance

### Security essentials
- 2FA for admin login
- Role-based route protection
- Session heartbeat tracking
- RLS-backed data protection
- No sensitive values hardcoded in UI

### Admin best practices
- Use least privilege where possible
- Log out after shared-device use
- Review audit-related tables regularly
- Verify before bulk updating data

### Compliance-minded operations
- Maintain accurate records
- Keep order and refund history traceable
- Avoid unauthorized edits to financial records

---

## Performance and Reliability

### Performance practices
- Paginate large tables
- Limit query fields
- Debounce search input
- Use loading states
- Avoid unnecessary rerenders

### Reliability practices
- Check network errors before retrying
- Preserve user input on failed save
- Subscribe only to relevant realtime channels
- Validate data after updates

### Dashboard reliability checklist
- Dashboard loads metrics
- Notifications update correctly
- Search returns results
- Dark mode toggles correctly
- Each page can load empty and populated states

---

## Daily Operations Checklist

### Start of day
- Log in and confirm 2FA
- Review dashboard summary
- Check new orders
- Check inquiries
- Review low stock alerts
- Confirm store status

### During the day
- Process pending orders
- Update tracking numbers
- Answer inquiries
- Publish product updates
- Watch for payment issues
- Review analytics if campaign is live

### End of day
- Confirm unresolved orders
- Review alerts and notifications
- Check logs and system status
- Save notes for follow-up
- Log out of admin session

---

## Weekly Audit Checklist

- Review product catalog for outdated items
- Check stock thresholds and low stock trends
- Audit active coupons and expiration dates
- Review pending inquiries and response times
- Inspect financial and payment summaries
- Review analytics trends and campaign performance
- Check system logs for recurring issues
- Review admin settings and session history

---

## Incident Response Checklist

### If login fails
- Confirm credentials
- Confirm 2FA code
- Check admin approval flag
- Check session state
- Review console/network errors

### If data is wrong
- Confirm page filters
- Check source table record
- Verify save/update succeeded
- Refresh and re-check

### If site looks broken
- Check theme class and layout
- Refresh browser
- Check for console errors
- Verify current route and component state

### If a critical issue happens
- Stop risky edits
- Capture screenshots/logs
- Reproduce in a safe way
- Escalate to responsible admin/dev
- Restore or roll back if needed

---

## Troubleshooting Guide

### Login problems
- Wrong password
- Invalid OTP
- Admin not approved
- Session lock not cleared

### Product issues
- Duplicate SKU
- Missing category
- Invalid price or stock
- Bad image upload

### Order issues
- Wrong status transition
- Missing tracking number
- Payment mismatch
- Customer details incorrect

### Display issues
- Dark mode not applied
- Layout overflow on mobile
- Chart missing data
- Search modal not opening

### Data issues
- Empty query result
- RLS permission issue
- Network failure
- Realtime subscription not active

---

## Glossary

- **2FA:** Two-factor authentication
- **SKU:** Stock keeping unit
- **RLS:** Row-level security
- **OTP:** One-time password
- **KPI:** Key performance indicator
- **Draft:** Unpublished saved state
- **Active:** Live and visible state
- **Lead:** Incoming customer inquiry
- **Heartbeat:** Session activity update
- **Realtime:** Live database update channel

---

## Appendices

### Appendix A: Route Map
- `/admin`
- `/admin/login`
- `/admin/orders`
- `/admin/customers`
- `/admin/products`
- `/admin/categories`
- `/admin/inventory`
- `/admin/materials`
- `/admin/size-guides`
- `/admin/finance`
- `/admin/payments`
- `/admin/analytics`
- `/admin/market-analytics`
- `/admin/marketing`
- `/admin/coupons`
- `/admin/hero`
- `/admin/brand-reviews`
- `/admin/inquiries`
- `/admin/system`
- `/admin/settings`
- `/admin/help`

### Appendix B: Table Map
- `profiles` — user/admin profile records
- `products` — catalog and inventory data
- `orders` — order transactions and fulfillment
- `categories` — catalog hierarchy
- `coupons` — promotion rules
- `leads` — inquiry records
- `admin_2fa_sessions` — 2FA sessions
- `user_sessions` — session tracking
- `system_config` — config values
- `system_logs` — operational logs

### Appendix C: Keyboard Shortcuts
- Ctrl/Cmd + K — global search
- Esc — close dialogs/search
- Sidebar click — navigate modules
- Refresh button — reload data

### Appendix D: Daily Checklist Summary
- Login
- Review dashboard
- Process orders
- Answer inquiries
- Check inventory
- Monitor alerts
- Log out

### Appendix E: Weekly Checklist Summary
- Catalog audit
- Inventory audit
- Coupon audit
- Inquiry audit
- Finance audit
- Analytics review
- System log review

### Appendix F: Incident Quick Steps
- Pause changes
- Capture evidence
- Identify root cause
- Apply safe fix
- Verify recovery

---

## Export Notes for PDF/Printed Manual

### Best export workflow
1. Open this markdown in your editor.
2. Convert to PDF using your preferred markdown/PDF tool.
3. Ensure page numbers and headers/footers are enabled.
4. Print a proof copy before final distribution.

### Suggested enhancements for final PDF
- Add a cover page with logo
- Add page headers with section title
- Add footers with page number and version
- Insert page breaks before each major chapter
- Keep tables unbroken across pages when possible

---

## Final Summary

Bloomina Admin Dashboard is a complete internal operations system for catalog, orders, customers, analytics, marketing, finance, support, and platform control. This manual provides a full operational and learning reference for using, understanding, and training others on the entire admin panel.

**End of manual.**
