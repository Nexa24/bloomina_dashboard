import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Users, ShoppingBag, Settings, LogOut, Package, Menu, X, Bell, 
    BarChart2, MessageSquare, Headphones, Search, Mail, ChevronDown, CheckCircle2, 
    ChevronUp, Sun, Moon, Archive, Ticket, DollarSign, TrendingUp, Megaphone, 
    Palette, Code, Boxes, Gift, Heart, Image as ImageIcon, Scale, CreditCard, AlertTriangle,
    Ruler, BookOpen
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { supabase } from '../../lib/supabase';
import NotificationStack from './OrderNotificationToast';
import { useAlert } from '../../contexts/AlertContext';

const getGenericTour = (title) => [
    {
        title: `Welcome to ${title}`,
        description: `This interface provides detailed controls and operational configurations for managing your ${title.toLowerCase()} settings.`,
        tip: "Use the sidebar navigation to move between different catalog, finance, and system modules."
    }
];

const toursConfig = {
    '/admin': [
        {
            selector: '[data-tour="welcome-banner"]',
            title: "Welcome to Bloomina Atelier",
            description: "This is your starting workspace! It displays current alerts (like new orders today) and lets you launch order dispatches immediately.",
            tip: "Keep an eye on this banner every morning to plan your fulfillment schedule."
        },
        {
            selector: '[data-tour="stats-grid"]',
            title: "Real-Time Stats Tracker",
            description: "Audits your total business health by tracking Total Revenue (INR), Total Orders, Active Customers, and Live Catalog products.",
            tip: "These stats update automatically in real-time as customers place orders on the storefront."
        },
        {
            selector: '[data-tour="performance-chart"]',
            title: "Weekly Performance Trends",
            description: "Presents a visual area chart mapping sales trajectories over a 7-day window. Hovering over nodes shows daily totals.",
            tip: "Use these trends to schedule promotional campaigns during high-traffic weekdays."
        },
        {
            selector: '[data-tour="market-distribution"]',
            title: "Market Distribution Insights",
            description: "Displays your top category (e.g. Bralettes) and growth indicators to help you identify trending products.",
            tip: "Click on Categories at the bottom to rearrange public storefront displays."
        },
        {
            selector: '[data-tour="operational-insights"]',
            title: "Operational Warning Center",
            description: "Direct shortcuts detailing counts for low-stock items, new inquiries, active coupons, and payout statuses.",
            tip: "Low stock count highlights items with inventory below 10 that require urgent restock."
        },
        {
            selector: '[data-tour="customer-leads"]',
            title: "Recent Customer Leads",
            description: "Previews direct support messages sent by visitors. You can respond directly to these inquiries.",
            tip: "Answering customer queries within 24 hours boosts sales conversion rates by 25%."
        },
        {
            selector: '[data-tour="profile-widget"]',
            title: "Workspace Profile",
            description: "Displays your admin profile, email address, and provides access to account logs.",
            tip: "You can click here to check your logged-in administrator email."
        },
        {
            selector: '[data-tour="sidebar-nav"]',
            title: "Platform Navigation",
            description: "Your primary menu to jump between Catalog, Orders, Sizing, Finance, and Platform settings.",
            tip: "Hovering over links highlights the active workspace page."
        },
        {
            selector: '[data-tour="theme-toggle"]',
            title: "Interface Theme Switcher",
            description: "Switch between clean high-contrast Light Mode and dark mode options.",
            tip: "Bloomina supports automatic theme detection to matching your OS settings."
        },
        {
            selector: '[data-tour="global-search"]',
            title: "Global Search Engine",
            description: "Look up orders, products, and customer profiles instantly from anywhere in the app (Ctrl+K).",
            tip: "Type partial order IDs or customer emails for instant search matching."
        },
        {
            selector: '[data-tour="notification-bell"]',
            title: "Operational Alerts Inbox",
            description: "Logs real-time updates for incoming orders, low stock warnings, and customer inquiries.",
            tip: "Unread count indicator shows active alerts requiring review."
        },
        {
            selector: '[data-tour="tour-button"]',
            title: "Tour Guide Launcher",
            description: "You can click this BookOpen button at any time to re-run the interactive tour for the active page.",
            tip: "The tour updates dynamically matching the active workspace page."
        }
    ],
    '/admin/products': [
        {
            selector: '[data-tour="catalog-header"]',
            title: "Garment Catalog Workspace",
            description: "Welcome to your catalog inventory. Here, you manage all clothing items, their details, pricing, collections, and statuses.",
            tip: "You can track whether items are visible (Active) or hidden (Draft) from this central board."
        },
        {
            selector: '[data-tour="search-input"]',
            title: "Search & Filtering",
            description: "Look up products instantly by entering a partial product name, description keyword, or specific SKU.",
            tip: "Pressing clear or emptying the search bar restores the default page list."
        },
        {
            selector: '[data-tour="category-dropdown"]',
            title: "Category Segmenting",
            description: "Filter down the catalog to a specific product category such as Tops, Bralettes, or Accessories.",
            tip: "This is extremely helpful when managing stock or reviewing pricing for specific seasonal collections."
        },
        {
            selector: '[data-tour="status-filter-tabs"]',
            title: "Publication State Toggles",
            description: "Filter items by their publishing state: 'All', 'Active' (visible to store visitors), or 'Draft' (invisible, editing phase).",
            tip: "Moving items to Draft is a safe way to pause sales of a product without deleting it."
        },
        {
            selector: '[data-tour="add-product-btn"]',
            title: "Creating New Products",
            description: "Click here to open the product creator form. First, fill in the product name, descriptive story, and metadata details. Set standard sizes, select fabric material templates, and input base prices/compare pricing. Provide stock counts for variants, upload a primary cover image, add supplementary media to the gallery, and select whether to set the item as Active or Draft before hitting Save.",
            tip: "Make sure to double check standard details to maintain pricing consistency across the store."
        },
        {
            selector: '[data-tour="import-csv-btn"]',
            title: "Bulk CSV Import",
            description: "Use the Import CSV button to upload spreadsheet data containing dozens of products at once, dramatically speeding up launch schedules.",
            tip: "Make sure the file format exactly matches the layout defined in our sample template."
        },
        {
            selector: '[data-tour="template-csv-btn"]',
            title: "Download CSV Blueprint",
            description: "Obtain the exact CSV template required for bulk import. It has headers matching all database fields.",
            tip: "Open this file in Excel or Google Sheets, populate your catalog data, and export back as .csv."
        },
        {
            selector: '[data-tour="products-table"]',
            title: "Dynamic Catalog Ledger",
            description: "Displays SKU codes, primary thumbnail preview, current stocks, variant count, and pricing tags. Hovering on any row highlights operational options to either Edit details or delete the product permanently.",
            tip: "Deleting a product will permanently erase its reviews, sizing guides connection, and stock values."
        },
        {
            selector: '[data-tour="pagination-nav"]',
            title: "Catalog Pagination",
            description: "Move between pages of products. The default list loads 10 products per page to ensure fast dashboard load times.",
            tip: "The navigation shows total records found and current active page index."
        }
    ],
    '/admin/orders': [
        {
            selector: '[data-tour="orders-header"]',
            title: "Order Fulfillment Center",
            description: "Track and dispatch customer orders placed on the storefront. Displays current volumes and alerts for new payments.",
            tip: "A red badge next to the Orders sidebar tab indicates outstanding orders awaiting action."
        },
        {
            selector: '[data-tour="orders-search-input"]',
            title: "Locating Specific Orders",
            description: "Search for orders instantly by entering the unique Order ID, customer full name, email, or telephone number.",
            tip: "Great for answering support calls when a customer asks about their order status."
        },
        {
            selector: '[data-tour="create-order-btn"]',
            title: "Manual Order Overrides",
            description: "Allows you to create an order manually for custom offline sales, VIP customers, or direct WhatsApp purchases. Specify client details, purchase items, and shipping offsets.",
            tip: "You can assign custom pricing and tax offsets before finalized."
        },
        {
            selector: '[data-tour="export-sales-btn"]',
            title: "Exporting Financial Ledgers",
            description: "Generates a clean CSV file export of all transaction records, delivery addresses, and item details within your query results.",
            tip: "Send this exported CSV file directly to your logistics partner for shipping labels."
        },
        {
            selector: '[data-tour="orders-table"]',
            title: "Order Control Panel",
            description: "This grid shows status indicators, customer tags, payment methods, transaction values, and dates. Expand an order to review items, edit courier options, insert a tracking ID, and update status transitions (Pending -> Processing -> Shipped -> Delivered). Updating statuses will automatically trigger updates to the client. You can also cancel or delete orders here.",
            tip: "Always click save after inserting a tracking link to keep clients informed."
        },
        {
            selector: '[data-tour="orders-pagination"]',
            title: "Fulfillment Navigation",
            description: "Browse through paginated orders. The table groups orders in sets of 10 to keep system memory consumption low.",
            tip: "You can click on next or previous buttons to review historical client invoices."
        }
    ],
    '/admin/customers': [
        {
            selector: '[data-tour="customers-header"]',
            title: "Customer Database",
            description: "Audits all customer accounts registered on Bloomina. You can see when they joined, what they bought, and aggregate metrics.",
            tip: "Customer relationship management tools are located right here."
        },
        {
            selector: '[data-tour="customers-search-input"]',
            title: "Customer Search",
            description: "Search by user name, email, or phone number to find individual contact cards and purchase histories.",
            tip: "Type any partial query to instantly update the list results."
        },
        {
            selector: '[data-tour="customers-status-filters"]',
            title: "Segment Filters",
            description: "Filter down customer lists by accounts that are active, inactive, or restricted.",
            tip: "Excellent for identifying your most loyal or returning customers."
        },
        {
            selector: '[data-tour="customers-stats-grid"]',
            title: "Demographics KPI Dashboard",
            description: "Shows quick statistics on Total Customers, New Registrations (30 days), and Customer Lifetime Value (CLV).",
            tip: "A growing CLV metric shows high brand satisfaction and recurring sales."
        },
        {
            selector: '[data-tour="customers-table"]',
            title: "Accounts Ledger",
            description: "Lists names, emails, total purchases, and system role. You can edit customer information, change authorization levels, or ban accounts.",
            tip: "Use the action buttons on the right side of each customer row to configure account settings."
        }
    ],
    '/admin/inquiries': [
        {
            selector: '[data-tour="leads-header"]',
            title: "Contact Inquiries Feed",
            description: "Centralizes direct messages sent from the storefront contact form by visitors and potential partners.",
            tip: "Unread inquiries show up with high-priority visual flags so you never miss a lead."
        },
        {
            selector: '[data-tour="refresh-leads-btn"]',
            title: "Refresh Feed",
            description: "Click this to fetch the latest contact submissions from Supabase without page reload.",
            tip: "Keep this feed updated during peak sale hours to address customer questions immediately."
        },
        {
            selector: '[data-tour="leads-stats-grid"]',
            title: "Inquiry Performance Stats",
            description: "Tracks your response time, open issues, and resolved leads.",
            tip: "Aim for 100% resolved leads to keep customer satisfaction scores high."
        },
        {
            selector: '[data-tour="leads-table-container"]',
            title: "Inquiries Table Card",
            description: "Groups the search, status filters, and messages table together in a premium glassmorphic layout.",
            tip: "You can search by sender name or email address within this card."
        },
        {
            selector: '[data-tour="leads-table"]',
            title: "Inquiry Messages Ledger",
            description: "Displays inquiry subject, content, and sender email. You can reply directly to the customer or delete spam messages.",
            tip: "Clicking the reply icon copies the email address to your clipboard and opens your mail app."
        }
    ],
    '/admin/categories': [
        {
            selector: '[data-tour="categories-header"]',
            title: "Category Collections Editor",
            description: "Control catalog categories (e.g. Tops, Bottoms, Bralettes) that determine storefront menu layouts.",
            tip: "Categories can be reordered or toggled to hide seasonal lines."
        },
        {
            selector: '[data-tour="categories-sync-btn"]',
            title: "Quick Sync System",
            description: "Syncs the local category indexes with your web storefront caching server for instant updates.",
            tip: "Always click this sync button after introducing new product categories."
        },
        {
            selector: '[data-tour="categories-add-btn"]',
            title: "Add New Category",
            description: "Click to create a new category. Specify its display name, URL handle, and cover imagery.",
            tip: "Provide clean names and description summaries for better SEO rankings."
        },
        {
            selector: '[data-tour="categories-table"]',
            title: "Categories Tree List",
            description: "Audits current category nodes, product associations, handles, and thumbnail images.",
            tip: "You can delete categories without deleting their associated products; they will simply be unlisted from that category."
        }
    ],
    '/admin/inventory': [
        {
            selector: '[data-tour="inventory-header"]',
            title: "Inventory Controller",
            description: "Monitor real-time product availability and size variant stocks to prevent order cancellations.",
            tip: "A red alert will appear next to any variant whose stock falls below 5 units."
        },
        {
            selector: '[data-tour="refresh-stock-btn"]',
            title: "Refresh Stock Count",
            description: "Re-fetches active inventory levels from the server database.",
            tip: "Very useful after bulk fulfillment rounds to confirm exact warehouse counts."
        },
        {
            selector: '[data-tour="inventory-stats"]',
            title: "Inventory KPIs",
            description: "Summarizes total items in stock, total unique SKUs, and counts low-stock items that need restocking.",
            tip: "Check the low-stock counter daily to prevent popular items from selling out."
        },
        {
            selector: '[data-tour="inventory-table"]',
            title: "Stock Allocation Matrix",
            description: "Lists products, individual size variants (S, M, L), and stock amounts. You can edit numbers inline for quick updates.",
            tip: "Double-click stock counts to quickly modify inventory values."
        }
    ],
    '/admin/materials': [
        {
            selector: '[data-tour="materials-header"]',
            title: "Fabric & Materials Templates",
            description: "Create reusable material specifications, fabric details, and care instructions to show on product pages.",
            tip: "Assigning a materials template to a product displays premium details like fabric composition."
        },
        {
            selector: '[data-tour="create-material-btn"]',
            title: "Create Fabric Profile",
            description: "Click here to build a new material profile. Input details like composition, washing instructions, and fabric source.",
            tip: "Example: '100% Organic Silk' with specifications for density and elasticity."
        },
        {
            selector: '[data-tour="materials-table-card"]',
            title: "Materials Archive",
            description: "Browse and filter through your active materials library.",
            tip: "Keep descriptions detailed so clients understand the quality of your fabrics."
        }
    ],
    '/admin/size-guides': [
        {
            selector: '[data-tour="guides-table"]',
            title: "Interactive Sizing Grid",
            description: "Manage and preview all size guide charts configured for your garment collections.",
            tip: "Size guides automatically translate between Inches and Centimeters on the storefront."
        },
        {
            selector: '[data-tour="guides-search"]',
            title: "Filter Sizing Charts",
            description: "Quickly filter your sizing templates by keywords in the title or description.",
            tip: "Use clear keywords (e.g., Panty, Bra, Slip) to keep guides organized."
        },
        {
            selector: '[data-tour="create-guide-btn"]',
            title: "Create New Sizing Template",
            description: "Click this button to launch the visual Grid Builder, where you can customize table headers and size increments.",
            tip: "Suffix headers with '(in)' (e.g. Chest (in)) to enable dynamic centimeter conversion on the storefront."
        }
    ],
    '/admin/finance': [
        {
            selector: '[data-tour="finance-header"]',
            title: "Financial Control Board",
            description: "Monitor your store's financial health, gross sales, refunds, tax dues, and net payouts.",
            tip: "Data here is generated directly from paid Razorpay and COD order updates."
        },
        {
            selector: '[data-tour="finance-stats-grid"]',
            title: "Revenue Metrics Grid",
            description: "Highlights your Gross Sales, Average Order Revenue, Processing Fees, and Net Payouts.",
            tip: "Compare these figures against your banking ledger weekly to verify payouts."
        },
        {
            selector: '[data-tour="revenue-chart"]',
            title: "Monthly Inflow Trajectory",
            description: "Visual line chart showing gross revenue fluctuations month-over-month.",
            tip: "Peaks match promotional campaigns or coupon distribution periods."
        },
        {
            selector: '[data-tour="transactions-table"]',
            title: "Transaction Registry",
            description: "Lists every single transaction, invoice ID, date, billing customer, and payout status.",
            tip: "Use transaction IDs to check corresponding status entries in your Razorpay dashboard."
        }
    ],
    '/admin/payments': [
        {
            selector: '[data-tour="payments-header"]',
            title: "Secure Gateway Orchestrator",
            description: "Manage credit card processors, UPI routes, and Cash on Delivery rules.",
            tip: "Settings here take effect immediately on checkout screens."
        },
        {
            selector: '[data-tour="razorpay-config-card"]',
            title: "Razorpay Gateway Settings",
            description: "Enter your Razorpay Key ID and Key Secret. Switch between Test and Live modes with a single click.",
            tip: "Test Mode lets you make mock purchases with dummy cards to verify the checkout flow."
        },
        {
            selector: '[data-tour="upi-config-card"]',
            title: "Direct UPI Routes",
            description: "Configure your Business UPI ID and PhonePe Merchant accounts for instant customer bank transfers.",
            tip: "UPI payments have zero gateway processing fees, maximizing your profit margins."
        },
        {
            selector: '[data-tour="toggles-config-card"]',
            title: "Checkout Rules",
            description: "Toggle Cash on Delivery (COD) availability and set a minimum order requirement to cover return risks.",
            tip: "Setting a minimum order value (e.g. ₹500) prevents low-value checkout abuse."
        }
    ],
    '/admin/analytics': [
        {
            selector: '[data-tour="analytics-header"]',
            title: "Performance Dashboard",
            description: "Analyze high-level business indicators, sales trends, conversion funnels, and product performance.",
            tip: "Use the range selector to compare performance across different periods."
        },
        {
            selector: '[data-tour="analytics-kpi-grid"]',
            title: "Key Performance Indicators",
            description: "Displays total sales volume, order counts, average order values, and delivery rates.",
            tip: "Green percentage tags indicate positive growth compared to the previous period."
        },
        {
            selector: '[data-tour="revenue-trend-card"]',
            title: "Revenue Performance Chart",
            description: "Maps weekly gross sales inflow. Hovering over chart points displays exact daily totals.",
            tip: "Identify which days of the week generate the most revenue to plan promotions."
        },
        {
            selector: '[data-tour="top-products-card"]',
            title: "Best Sellers Chart",
            description: "Displays your top-selling products by quantity, helping you optimize inventory levels for high-demand items.",
            tip: "Keep your best sellers stocked to prevent missing out on potential sales."
        },
        {
            selector: '[data-tour="conversion-funnel-card"]',
            title: "Storefront Funnel Performance",
            description: "Visual representation of your conversion funnel from visits to checkout. Helps pinpoint drop-off points.",
            tip: "A significant drop-off at Checkout usually indicates shipping charges are too high."
        }
    ],
    '/admin/market-analytics': [
        {
            selector: '[data-tour="market-header"]',
            title: "Market Intelligence Dashboard",
            description: "Visualize where your orders are coming from and what items are trending locally.",
            tip: "Geographical data is extracted from shipping address fields at checkout."
        },
        {
            selector: '[data-tour="market-heatmap-card"]',
            title: "Geographic Order Heatmap",
            description: "Visual bar chart displaying the frequency of successful orders across states.",
            tip: "Use this map to focus social media ad budgets on high-performing regions."
        },
        {
            selector: '[data-tour="market-regions-card"]',
            title: "Top Revenue Regions",
            description: "Lists the top 5 states by sales revenue, complete with percentage share bars.",
            tip: "Promote free shipping zones in these regions to boost order volume."
        },
        {
            selector: '[data-tour="market-trending-card"]',
            title: "Local Trending Product",
            description: "Highlights the single product currently experiencing the highest purchase velocity.",
            tip: "Feature this trending item on your homepage banner to drive conversions."
        }
    ],
    '/admin/marketing': [
        {
            selector: '[data-tour="marketing-header"]',
            title: "Marketing Campaigns Hub",
            description: "Launch and track promotional campaigns across social media, email, and influencer networks.",
            tip: "Create specific campaigns for seasonal events like Valentine's or Winter sales."
        },
        {
            selector: '[data-tour="create-campaign-btn"]',
            title: "Deploy New Campaign",
            description: "Click here to configure a new marketing campaign. Set budget targets, type, and estimated CTR.",
            tip: "Start with a modest budget to test target audience response rates."
        },
        {
            selector: '[data-tour="campaign-grid"]',
            title: "Active Campaigns Board",
            description: "Displays status cards for all campaigns, showing budget expenditures, type, and CTR performance.",
            tip: "Deactivate low-performing campaigns early to preserve your ad budget."
        }
    ],
    '/admin/coupons': [
        {
            selector: '[data-tour="coupons-header"]',
            title: "Coupons & Deals Panel",
            description: "Create promotional coupon codes to incentivize checkout and boost sales.",
            tip: "Coupons can offer flat discounts, percentage discounts, or free shipping."
        },
        {
            selector: '[data-tour="create-coupon-btn"]',
            title: "Create New Coupon",
            description: "Launch the coupon builder to set the code name (e.g. SAVE20), discount percentage, and expiry date.",
            tip: "Add a minimum order constraint to protect profit margins."
        },
        {
            selector: '[data-tour="coupons-table-card"]',
            title: "Coupons Ledger Card",
            description: "Groups the coupon search, status filters, and table list in a clean, glassmorphic UI.",
            tip: "Easily search for specific coupon codes from this dashboard section."
        },
        {
            selector: '[data-tour="coupons-table"]',
            title: "Coupon Codes Table",
            description: "Lists codes, discount values, minimum orders, and active statuses. Toggle status or delete codes here.",
            tip: "Expired coupons automatically show up with red warning badges."
        }
    ],
    '/admin/hero': [
        {
            selector: '[data-tour="hero-header"]',
            title: "Hero Banner Director",
            description: "Manage the main rotating slideshow images on the public storefront homepage.",
            tip: "High-quality aesthetic banners drive first-impression click-through rates up by 40%."
        },
        {
            selector: '[data-tour="hero-add-btn"]',
            title: "Add Slideshow Banner",
            description: "Upload a new background image, set overlay text, configure action buttons, and set display order.",
            tip: "Use landscape-oriented images optimized for quick page loading."
        },
        {
            selector: '[data-tour="hero-grid"]',
            title: "Banners Sequence Editor",
            description: "Visual grid of active banners. Drag and drop to reorder, edit overlay text, or delete old promotions.",
            tip: "Keep text short and clear with a strong Call-To-Action (CTA)."
        }
    ],
    '/admin/brand-reviews': [
        {
            selector: '[data-tour="reviews-header"]',
            title: "Community Reviews Moderator",
            description: "Moderate and manage reviews submitted by customers for products and the Bloomina brand.",
            tip: "Approving review entries publishes them directly onto storefront product pages."
        },
        {
            selector: '[data-tour="reviews-type-filter"]',
            title: "Feedback Type Filtering",
            description: "Filter entries by 'Product' reviews (specific garments) or 'Brand' reviews (overall shopping experience).",
            tip: "Monitor overall brand feedback to identify general logistics or customer service issues."
        },
        {
            selector: '[data-tour="reviews-status-filter"]',
            title: "Moderation Status Filters",
            description: "Filter reviews by status: 'Pending' (needs approval), 'Approved' (published), or 'Rejected' (hidden).",
            tip: "Moderate reviews daily to keep storefront feedback current."
        },
        {
            selector: '[data-tour="reviews-stats-grid"]',
            title: "Sentiment Overview",
            description: "Displays your overall customer satisfaction rating, total reviews, and pending entries.",
            tip: "A rating above 4.5 is excellent and builds trust with new visitors."
        },
        {
            selector: '[data-tour="reviews-grid"]',
            title: "Reviews Board",
            description: "Displays reviewer name, rating stars, comment, submission date, and moderation dropdown.",
            tip: "You can delete inappropriate or spam reviews using the trash icon."
        }
    ],
    '/admin/system': [
        {
            selector: '[data-tour="system-header"]',
            title: "System Operations Desk",
            description: "Monitor server connections, API configurations, and system logs.",
            tip: "Used primarily for diagnostics and debugging by developers."
        },
        {
            selector: '[data-tour="sync-core-btn"]',
            title: "Core Re-Sync Override",
            description: "Forces a refresh of all configuration tables, clearing out outdated cache entries.",
            tip: "Use this if you notice configuration changes are not showing up on the public site."
        },
        {
            selector: '[data-tour="supabase-status-card"]',
            title: "Database Status Monitor",
            description: "Confirms real-time connectivity status to your Supabase backend service.",
            tip: "Green status indicates the database is connected and performing queries normally."
        },
        {
            selector: '[data-tour="security-api-card"]',
            title: "Security & API Keys",
            description: "Displays status information for active API connections, encryption keys, and webhook targets.",
            tip: "Keep webhooks verified to prevent payment reporting drops."
        },
        {
            selector: '[data-tour="system-logs-card"]',
            title: "Terminal Console Logs",
            description: "Real-time output stream showing database queries, API responses, and runtime warnings.",
            tip: "Helpful for troubleshooting checkout failures or database connection drops."
        }
    ],
    '/admin/settings': [
        {
            selector: '[data-tour="settings-header"]',
            title: "Global Platform Settings",
            description: "Configure store info, tax rates, checkout rules, and system behavior settings.",
            tip: "Settings updated here are applied storewide in real-time."
        },
        {
            selector: '[data-tour="settings-tabs"]',
            title: "Settings Sub-Sections",
            description: "Switch between different configuration tabs, including General, Shipping, Policies, and Security.",
            tip: "Grouped settings make it easy to locate specific checkout parameters."
        },
        {
            selector: '[data-tour="settings-content"]',
            title: "Configuration Card",
            description: "The main card displaying the fields of your selected settings tab.",
            tip: "Always double-check details like contact emails or bank accounts before saving."
        },
        {
            selector: '[data-tour="save-settings-btn"]',
            title: "Apply Global Settings",
            description: "Saves and commits all configuration changes to the database.",
            tip: "Always save your changes before switching tabs or navigating away."
        }
    ],
    '/admin/help': [
        {
            selector: '[data-tour="help-header"]',
            title: "Bloomina Atelier Journal",
            description: "Your central hub for platform documentation, operational blueprints, and system reference guides.",
            tip: "Reference this workspace if you need to onboard a new employee or clarify platform mechanics."
        },
        {
            selector: '[data-tour="help-search-input"]',
            title: "Documentation Lookup",
            description: "Search the help center database by keywords like 'orders', 'sizing', or 'gateway'.",
            tip: "Finds relevant guides and operational blueprints instantly."
        },
        {
            selector: '[data-tour="help-reference-cards"]',
            title: "Admin Reference Directory",
            description: "Quick links and reference cards summarizing the purpose and controls of every admin page.",
            tip: "Perfect for getting a quick overview of what each dashboard page manages."
        },
        {
            selector: '[data-tour="help-blueprints-container"]',
            title: "Fulfillment Blueprints",
            description: "Step-by-step guides for handling complex operations, such as return orders, coupon campaigns, and size chart setups.",
            tip: "Follow these blueprints exactly to ensure operational consistency."
        }
    ]
};

const productFormTourSteps = [
    {
        selector: '[data-tour="product-form"]',
        title: "Product Atelier Workstation",
        description: "This workspace is where you design, modify, and publish specific catalog entries. Let's walk through every panel step by step so you know exactly what each section does.",
        tip: "You can re-launch this tour at any time by pressing the BookOpen icon in the top toolbar."
    },
    {
        selector: '[data-tour="product-basic-card"]',
        title: "Basic Information",
        description: "Set the public product title and write a descriptive story displayed on the storefront product detail page. A compelling title improves search discoverability. The description should highlight fabric feel, fit, and usage context to build customer trust and reduce pre-purchase hesitation.",
        tip: "Use keyword-rich titles (e.g. 'Lace Trim Padded Bralette') for better SEO rankings on Google."
    },
    {
        selector: '[data-tour="product-material-card"]',
        title: "Material Mastery Templates",
        description: "Link an existing fabric/materials profile to this product. Selecting a template automatically pulls in wash care instructions, fabric composition percentages, and premium quality descriptors that will render on the customer-facing storefront product page — no need to re-type the same details for every product made from the same fabric.",
        tip: "If you don't have a template yet, click 'Manage Templates' to open the Materials page in a new tab and create one first."
    },
    {
        selector: '[data-tour="product-media-card"]',
        title: "Primary Showcase & Media Gallery",
        description: "Upload your product visuals here. The first image becomes the main cover thumbnail shown in the catalog list and on storefront collection grids. Additional gallery images (up to 8 recommended) display in the storefront product image carousel. Drag-and-drop images directly onto the upload zones, or click to browse your files. You can reorder images after uploading by dragging them into place.",
        tip: "Use clean, square (1:1 ratio), high-resolution PNG or JPG images under 2 MB for the fastest page load times."
    },
    {
        selector: '[data-tour="product-color-card"]',
        title: "Color Management & Swatches",
        description: "Define the available color options for this garment. Click '+ Add Color' to create a new color entry — give it a name (e.g. Dusty Rose) and pick or type its exact hex color code (e.g. #D8A2A2). You can also attach a color-specific product image per swatch, so when customers click a color on the storefront, the main product photo switches to that color variant automatically. Existing colors appear as pill previews.",
        tip: "Use accurate hex codes that match the actual fabric dye to set correct customer expectations and reduce return rates."
    },
    {
        selector: '[data-tour="product-pricing-card"]',
        title: "Pricing Ledger",
        description: "Set the Selling Price (the amount customers pay at checkout). Optionally enter a Compare-At Price — if set higher than the selling price, it displays with a strikethrough next to the real price, creating a visible discount label (e.g. ₹799 ~~₹1,199~~). The Cost Per Item field is private — it's used internally to compute your gross profit margin and never shown to customers.",
        tip: "Enabling a Compare-At price triggers automatic 'Sale' badge display on the catalog grid, which consistently boosts click-through rates."
    },
    {
        selector: '[data-tour="product-sizing-card"]',
        title: "Sizing Charts Alignment",
        description: "Link a Size Guide template (e.g. 'Bralettes Sizing Chart') to this product from the dropdown. Once linked, a preview table of the first few rows of the guide appears below so you can confirm the correct chart is attached. The size guide renders as an interactive chart next to the size picker on the storefront, helping customers measure and select the right fit without guessing.",
        tip: "Linking an accurate guide reduces customer sizing returns by up to 80%. Create guides in the Size Guides page."
    },
    {
        selector: '[data-tour="product-variants-card"]',
        title: "Variants — Colors & Sizes",
        description: "This panel controls the purchasable option combinations customers will see. Colors displayed here are automatically synced from the Color Management panel above — every color profile you added appears here as a swatch pill. For Sizes, click the individual size buttons to toggle them on or off. The size options are smart-adaptive: assigning a Bra sub-category loads bra-cup sizes (32B, 34C, 36D, etc.); assigning a Panty/Brief sub-category loads extended waist sizes (S, M, L through 4XL). For all other categories, standard XS–3XL sizes display. Use 'Clear All' to deselect all sizes instantly.",
        tip: "Always select at least one size. Products with no sizes selected will show a broken size picker on the storefront."
    },
    {
        selector: '[data-tour="product-specs-card"]',
        title: "Technical Specifications Builder",
        description: "Add structured key-value specification rows here to display rich technical details on the product page (e.g. Brand → Bloomina Atelier, Closure Type → Hook & Eye, Fabric Composition → 80% Nylon 20% Spandex, Care → Hand Wash Cold). Click '+ Add Spec' to insert a new row. The Spec Label field has smart auto-complete suggestions based on your active category selection. Enter the label name on the left and its value on the right. Remove any row using the red trash icon.",
        tip: "A well-filled specification table (6–10 rows) dramatically reduces customer support queries and boosts purchase confidence."
    },
    {
        selector: '[data-tour="product-status-card"]',
        title: "Publication Status",
        description: "Controls whether this product is publicly visible and purchasable on the storefront. 'Active' publishes the product immediately — it appears in collections, search results, and is fully orderable. 'Draft' saves the complete configuration but hides it from customers — ideal for new arrivals not yet ready, products with incomplete photography, or seasonal items being prepared before a launch campaign. You can toggle between Active and Draft at any time without losing data.",
        tip: "New products default to 'Draft'. Remember to switch to 'Active' once ready to launch — forgetting this is the most common reason a product doesn't appear on the store!"
    },
    {
        selector: '[data-tour="product-inventory-card"]',
        title: "Inventory & Stock Tracking",
        description: "Manage all stock identification and quantity fields here. SKU (Stock Keeping Unit) is your internal product reference code — keep it short, consistent, and meaningful (e.g. BRA-34C-BLK for a Black 34C Bralette). Barcode supports standard formats like ISBN, UPC, and GTIN for compatibility with warehouse barcode scanner systems. Enable 'Track quantity' to activate live inventory counting — an 'Available Quantity' input then appears where you enter current stock units. When stock drops to 5 or fewer units, a 'Low Inventory!' warning badge appears automatically on the catalog table to alert you.",
        tip: "Always enable Track Quantity for limited-production garments to prevent overselling and protect customer satisfaction."
    },
    {
        selector: '[data-tour="product-org-card"]',
        title: "Organization & Categories",
        description: "Assign this product to the correct storefront categories. Step 1: Select a Main Category from the top dropdown (e.g. Tops, Bralettes, Bottoms, Accessories). Step 2: A sub-category checkbox panel expands automatically below — tick all applicable sub-collections (e.g. under 'Bralettes' you might select 'Padded Bralettes' and 'Lace Bralettes'). Step 3: The 'Other Tags' section below shows additional loose tags from your category database — toggle pills to attach or detach extra classification labels. Finally, the Supplier Reference field (optional) accepts an internal supplier code or vendor name for supply chain tracking and reorder management.",
        tip: "Correct category assignment is critical — it determines which storefront menus, filter dropdowns, and collection pages this product appears in."
    },
    {
        selector: '[data-tour="product-save-btn"]',
        title: "Publish & Save Master",
        description: "Click this button to commit all your product configuration — title, description, pricing, images, colors, sizes, inventory, categories, and specifications — to the database. For new products, this publishes the entry. For edits, it updates the existing record immediately. All connected storefront pages reflect the changes within seconds.",
        tip: "Double-check your pricing, variant swatches, and publication status before saving. These are the fields most commonly needing a quick correction after the first save."
    }
];

const orderModalTourSteps = [
    {
        selector: '[data-tour="order-modal"]',
        title: "Manual Order Creation Override",
        description: "Allows you to bypass the public storefront to generate transactions for custom bank transfers, phone sales, or VIP gifts.",
        tip: "Fulfillment rules and notifications are automatically triggered upon creation."
    },
    {
        selector: '[data-tour="order-customer-card"]',
        title: "Customer Profile Details",
        description: "Enter full name, customer email, and mobile terminals. This connects the purchase to their account history and sends receipts.",
        tip: "Providing a correct email is critical for dispatching delivery alerts."
    },
    {
        selector: '[data-tour="order-shipping-card"]',
        title: "Shipping Coordinates",
        description: "Provide exact delivery street address, city, state, ZIP/postal code, and country for routing sheets.",
        tip: "Double check postal codes to avoid logistics carrier return issues."
    },
    {
        selector: '[data-tour="order-logistics-card"]',
        title: "Payment Channels & Initial State",
        description: "Select COD, Razorpay, or manual Bank/WhatsApp routes, and specify the starting payment/fulfillment state.",
        tip: "Setting initial state to 'Payment Pending' is perfect when generating custom invoices."
    },
    {
        selector: '[data-tour="order-add-items-card"]',
        title: "Product Catalog Search",
        description: "Query live products, select color/size variants, input item count, and append them directly to this order's cart.",
        tip: "The system automatically references current stock levels and deducts them upon save."
    },
    {
        selector: '[data-tour="order-cart-card"]',
        title: "Order Items Cart",
        description: "Audits all added items. You can adjust quantities, remove items, or verify selected sizing variables.",
        tip: "Keep quantities matched to the physical order inventory."
    },
    {
        selector: '[data-tour="order-pricing-card"]',
        title: "Custom Offsets & Calculations",
        description: "Apply arbitrary flat discount values or insert custom shipping costs to determine the total checkout invoice amount.",
        tip: "The calculated sum represents the net transaction value saved to records."
    },
    {
        selector: '[data-tour="order-submit-btn"]',
        title: "Create and Dispatch Order",
        description: "Finalizes the transaction, updates inventory, and registers the order in the database.",
        tip: "An automated invoice receipt email is generated immediately after clicking Create."
    }
];

const AdminLayout = () => {
    const { adminUser, loading, adminLogout } = useAdminAuth();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('admin_theme') || 'light');
    const [storeStatus, setStoreStatus] = useState({ online: true, loading: true });

    const notificationRef = useRef(null);
    const profileRef = useRef(null);
    const popoverRef = useRef(null);
    const { notifications, toasts, unreadCount, pushPermission, enablePushNotifications, markAllRead, markRead, markTypeAsRead, removeToast } = useNotifications();

    const sidebarSections = [
        {
            title: "Core Operations",
            links: [
                { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
                { path: '/admin/orders', label: 'Orders', icon: ShoppingBag, badge: (notifications || []).filter(n => n.type === 'order' && !n.read).length },
                { path: '/admin/customers', label: 'Customers', icon: Users },
                { path: '/admin/inquiries', label: 'Contact Inquiries', icon: Mail, badge: (notifications || []).filter(n => n.type === 'lead' && !n.read).length },
            ]
        },
        {
            title: "Catalog & Stock",
            links: [
                { path: '/admin/products', label: 'Products', icon: Package },
                { path: '/admin/categories', label: 'Categories', icon: Archive },
                { path: '/admin/inventory', label: 'Inventory', icon: Boxes },
                { path: '/admin/materials', label: 'Material Templates', icon: Palette },
                { path: '/admin/size-guides', label: 'Size Guides', icon: Ruler },
            ]
        },
        {
            title: "Finance & Growth",
            links: [
                { path: '/admin/finance', label: 'Financial Overview', icon: DollarSign },
                { path: '/admin/analytics', label: 'Performance', icon: BarChart2 },
                { path: '/admin/marketing', label: 'Campaigns', icon: Megaphone },
                { path: '/admin/coupons', label: 'Coupons & Deals', icon: Ticket },
            ]
        },
        {
            title: "Storefront Control",
            links: [
                { path: '/admin/hero', label: 'Hero Slideshow', icon: ImageIcon },
                { path: '/admin/brand-reviews', label: 'Brand Reviews', icon: MessageSquare },
                { path: '/admin/system', label: 'System Health', icon: Headphones },
                { path: '/admin/settings', label: 'Global Settings', icon: Settings },
            ]
        },
        {
            title: "Support & Learning",
            links: [
                { path: '/admin/help', label: 'Help / Journal', icon: BookOpen },
            ]
        }
    ];

    const [isTourOpen, setIsTourOpen] = useState(false);
    const [tourStep, setTourStep] = useState(0);
    const [tourSteps, setTourSteps] = useState([]);
    const [popoverStyle, setPopoverStyle] = useState({ display: 'none' });
    const [highlightStyle, setHighlightStyle] = useState({ display: 'none' });
    const [arrowClass, setArrowClass] = useState('none');
    const { showAlert } = useAlert();

    useEffect(() => {
        // Scheduled full reload: reloads the page every 1 minute
        const reloadInterval = setInterval(() => {
            // Check if the user is performing a function (e.g. adding, editing, or filling a form)
            const hasCancelButton = Array.from(document.querySelectorAll('button'))
                .some(btn => btn.textContent?.trim().toLowerCase() === 'cancel');
            const hasActiveModal = document.querySelector('.backdrop-blur-sm, [class*="backdrop-blur"]') !== null;
            const isWorking = hasCancelButton || hasActiveModal;

            if (isWorking) {
                console.log('[Watchdog] User is actively adding/editing. Skipping scheduled reload.');
                return;
            }

            console.log('[Watchdog] 1-minute interval reached. Reloading page...');
            window.location.reload();
        }, 60 * 1000);

        return () => clearInterval(reloadInterval);
    }, []);

    const getPageTitle = () => {
        if (!sidebarSections) return 'Admin Portal';
        for (const sec of sidebarSections) {
            const match = sec.links.find(l => l.path === location.pathname || (l.path !== '/admin' && location.pathname.startsWith(l.path)));
            if (match) return match.label;
        }
        return 'Admin Portal';
    };

    const updateTourPositions = (shouldScroll = false) => {
        if (!isTourOpen || tourSteps.length === 0) {
            setPopoverStyle({ display: 'none' });
            setHighlightStyle({ display: 'none' });
            return;
        }

        const step = tourSteps[tourStep];
        const selector = step?.selector;
        const targetElement = selector ? document.querySelector(selector) : null;

        if (targetElement) {
            const calculateAndApply = () => {
                const rect = targetElement.getBoundingClientRect();
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

                setHighlightStyle({
                    position: 'absolute',
                    top: `${rect.top + scrollTop - 6}px`,
                    left: `${rect.left + scrollLeft - 6}px`,
                    width: `${rect.width + 12}px`,
                    height: `${rect.height + 12}px`,
                    border: '3px solid #944555',
                    borderRadius: '16px',
                    boxShadow: '0 0 0 9999px rgba(15, 17, 26, 0.5)',
                    pointerEvents: 'none',
                    zIndex: 190,
                    transition: 'all 0.3s ease',
                });

                let popoverHeight = 320;
                const popoverEl = document.querySelector('.tour-popover-box') || popoverRef.current;
                if (popoverEl) {
                    popoverHeight = popoverEl.offsetHeight || popoverEl.getBoundingClientRect().height || 320;
                }

                const popoverWidth = 360;
                const margin = 16;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                const rLeft = rect.left;
                const rRight = rect.right;
                const rTop = rect.top;
                const rBottom = rect.bottom;

                // Candidates: bottom, top, right, left
                const candidates = [
                    {
                        name: 'bottom',
                        proposedTop: rBottom + 12,
                        proposedLeft: rLeft + rect.width / 2 - popoverWidth / 2,
                        arrow: 'up'
                    },
                    {
                        name: 'top',
                        proposedTop: rTop - popoverHeight - 12,
                        proposedLeft: rLeft + rect.width / 2 - popoverWidth / 2,
                        arrow: 'down'
                    },
                    {
                        name: 'right',
                        proposedTop: rTop + rect.height / 2 - popoverHeight / 2,
                        proposedLeft: rRight + 12,
                        arrow: 'left'
                    },
                    {
                        name: 'left',
                        proposedTop: rTop + rect.height / 2 - popoverHeight / 2,
                        proposedLeft: rLeft - popoverWidth - 12,
                        arrow: 'right'
                    }
                ];

                const evaluated = candidates.map(c => {
                    const clampedTop = Math.max(margin, Math.min(c.proposedTop, viewportHeight - popoverHeight - margin));
                    const clampedLeft = Math.max(margin, Math.min(c.proposedLeft, viewportWidth - popoverWidth - margin));

                    const pLeft = clampedLeft;
                    const pRight = clampedLeft + popoverWidth;
                    const pTop = clampedTop;
                    const pBottom = clampedTop + popoverHeight;

                    const overlapWidth = Math.max(0, Math.min(pRight, rRight) - Math.max(pLeft, rLeft));
                    const overlapHeight = Math.max(0, Math.min(pBottom, rBottom) - Math.max(pTop, rTop));
                    const overlapArea = overlapWidth * overlapHeight;
                    const overlaps = overlapArea > 0;

                    const shift = Math.abs(clampedTop - c.proposedTop) + Math.abs(clampedLeft - c.proposedLeft);

                    return {
                        ...c,
                        clampedTop,
                        clampedLeft,
                        overlapArea,
                        overlaps,
                        shift
                    };
                });

                const nonOverlapping = evaluated.filter(e => !e.overlaps);
                let chosen;

                if (nonOverlapping.length > 0) {
                    nonOverlapping.sort((a, b) => a.shift - b.shift);
                    chosen = nonOverlapping[0];
                } else {
                    evaluated.sort((a, b) => a.overlapArea - b.overlapArea);
                    chosen = evaluated[0];
                }

                const isMobile = viewportWidth < 768;
                const arrowDirection = (chosen.overlapArea > 0 || isMobile) ? 'none' : chosen.arrow;

                setPopoverStyle({
                    position: 'absolute',
                    top: `${chosen.clampedTop + scrollTop}px`,
                    left: `${isMobile ? scrollLeft + 16 : chosen.clampedLeft + scrollLeft}px`,
                    width: isMobile ? 'calc(100% - 32px)' : '360px',
                    maxWidth: '360px',
                    zIndex: 200,
                    transition: 'all 0.3s ease',
                });
                setArrowClass(arrowDirection);
            };

            if (shouldScroll) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(calculateAndApply, 250);
            } else {
                calculateAndApply();
            }
        } else {
            setHighlightStyle({ display: 'none' });
            const isMobile = window.innerWidth < 768;
            setPopoverStyle(isMobile ? {
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 32px)',
                maxWidth: '360px',
                zIndex: 200,
            } : {
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '360px',
                zIndex: 200,
            });
            setArrowClass('none');
        }
    };

    useEffect(() => {
        updateTourPositions(true);
        
        const handleScrollResize = () => {
            updateTourPositions(false);
        };

        window.addEventListener('resize', handleScrollResize);
        window.addEventListener('scroll', handleScrollResize);
        return () => {
            window.removeEventListener('resize', handleScrollResize);
            window.removeEventListener('scroll', handleScrollResize);
        };
    }, [isTourOpen, tourStep, tourSteps, location.pathname]);

    const resolveTourSteps = (pathname) => {
        const pageTitle = getPageTitle();
        if (pathname === '/admin/products') {
            const hasForm = document.querySelector('[data-tour="product-form"]');
            if (hasForm) return productFormTourSteps;
        }
        if (pathname === '/admin/orders') {
            const hasOrderModal = document.querySelector('[data-tour="order-modal"]');
            if (hasOrderModal) return orderModalTourSteps;
        }
        return toursConfig[pathname] || getGenericTour(pageTitle);
    };

    useEffect(() => {
        const cleanPath = location.pathname;
        const steps = resolveTourSteps(cleanPath);
        setTourSteps(steps);
        setTourStep(0);

        const hasSeenKey = `bloomina_tour_seen_${cleanPath}`;
        const hasSeen = localStorage.getItem(hasSeenKey);
        if (!hasSeen) {
            setIsTourOpen(true);
            localStorage.setItem(hasSeenKey, 'true');
        } else {
            setIsTourOpen(false);
        }
    }, [location.pathname]);

    const handleStartTour = () => {
        const steps = resolveTourSteps(location.pathname);
        setTourSteps(steps);
        setTourStep(0);
        setIsTourOpen(true);
        localStorage.setItem(`bloomina_tour_seen_${location.pathname}`, 'true');
    };

    const isNewTourAvailable = !localStorage.getItem(`bloomina_tour_seen_${location.pathname}`);

    useEffect(() => {
        // Delay the read update slightly to prevent collision with page transition
        const timer = setTimeout(() => {
            if (location.pathname === '/admin/orders') {
                markTypeAsRead('order');
            } else if (location.pathname === '/admin/inquiries') {
                markTypeAsRead('lead');
            } else if (location.pathname === '/admin/inventory') {
                markTypeAsRead('inventory');
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [location.pathname, markTypeAsRead]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('admin_theme', theme);
    }, [theme]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);



    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        fetchStatus();
        
        // Subscribe to status changes
        const statusSubscription = supabase
            .channel('status_sync')
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'system_config',
                filter: 'key=eq.storefront_status'
            }, (payload) => {
                if (payload.new?.value) {
                    setStoreStatus({ online: payload.new.value.online, loading: false });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(statusSubscription);
        };
    }, []);

    const fetchStatus = async () => {
        try {
            const { data } = await supabase
                .from('system_config')
                .select('value')
                .eq('key', 'storefront_status')
                .maybeSingle();
            
            if (data?.value) {
                setStoreStatus({ online: !!data.value.online, loading: false });
            }
        } catch (err) {
            setStoreStatus(prev => ({ ...prev, loading: false }));
        }
    };



    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
    
    const handleLogout = async () => {
        await adminLogout();
    };

    const handleEnablePush = async () => {
        await enablePushNotifications();
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim()) {
                performGlobalSearch();
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const performGlobalSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const query = searchQuery.trim().toLowerCase();
            const [productsRes, customersRes, ordersRes] = await Promise.all([
                supabase.from('products').select('id, name, sku').or(`name.ilike.%${query}%,sku.ilike.%${query}%`).limit(3),
                supabase.from('profiles').select('id, full_name, email').or(`full_name.ilike.%${query}%,email.ilike.%${query}%`).neq('role', 'admin').limit(3),
                supabase.from('orders').select('id, total, status').ilike('id', `%${query}%`).limit(3)
            ]);

            const products = productsRes.data || [];
            const profiles = customersRes.data || [];
            const orders = ordersRes.data || [];

            const combined = [
                ...products.map(p => ({ type: 'Product', name: p.name, preview: `SKU: ${p.sku}`, icon: Package, link: `/admin/products?search=${p.id}` })),
                ...profiles.map(c => ({ type: 'Customer', name: c.full_name || 'Anonymous', preview: c.email, icon: Users, link: `/admin/customers?search=${c.id}` })),
                ...orders.map(o => ({ type: 'Order', name: `#${o.id.slice(0, 8)}`, preview: `₹${o.total} • ${o.status}`, icon: ShoppingBag, link: `/admin/orders?search=${o.id}` }))
            ];
            setSearchResults(combined);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setIsSearching(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#0f111a]">
                <div className="flex flex-col items-center gap-6">
                    <img src="/logo/BLO_TRNSP_LOVE_ICON.png" alt="Loading..." className="w-24 h-24 object-contain animate-pulse" />
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#944555] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-[#944555] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-[#944555] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!adminUser) {
        return <Navigate to="/admin/login" replace />;
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f111a] flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-[#1a1c23] p-4 flex items-center justify-between z-50 shadow-sm border-b border-slate-200 dark:border-slate-800">
                <img src="/logo/BLO_TRNSP_PINK_LRG.png" alt="Bloomina" className="h-8 w-auto object-contain" />
                <div className="flex items-center gap-3">
                    <button onClick={toggleTheme} className="p-2 text-slate-500 rounded-lg">
                        {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-400" />}
                    </button>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-500 rounded-lg">
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </header>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 bg-white dark:bg-[#15171e] w-64 md:w-72 border-r border-slate-200 dark:border-slate-800 shadow-sm z-40 transform transition-all duration-300 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="hidden md:flex items-center justify-center p-6 pb-2">
                    <img src="/logo/BLO_TRNSP_PINK_LRG.png" alt="Bloomina" className="h-10 w-auto object-contain" />
                </div>
                {/* Profile Widget */}
                <div className="px-6 mb-6 mt-2">
                    <button data-tour="profile-widget" className="w-full flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#1a1c23]">
                        <div className="flex items-center gap-3 w-full">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-[#944555] uppercase shrink-0">
                                {(adminUser?.email?.charAt(0) || 'A').toUpperCase()}
                            </div>
                            <div className="text-left overflow-hidden flex-1">
                                <p className="text-sm font-bold truncate">Workspace</p>
                                <p className="text-xs text-slate-400 truncate">{adminUser?.email || 'admin@bloomina.in'}</p>
                            </div>
                        </div>
                    </button>
                </div>

                <div data-tour="sidebar-nav" className="flex-1 overflow-y-auto px-6 space-y-8 pb-6 mt-2 hide-scrollbar">
                    {sidebarSections.map((section, idx) => (
                        <div key={idx}>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-2">{section.title}</p>
                            <div className="space-y-1">
                                {section.links.map((link) => {
                                    const Icon = link.icon;
                                    const isActive = location.pathname === link.path || (link.path !== '/admin' && location.pathname.startsWith(link.path));
                                    return (
                                        <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all font-bold text-sm ${isActive ? 'bg-[#fff5f6] dark:bg-[#944555]/10 text-[#944555] dark:text-[#f191a1]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                            <div className="flex items-center gap-3">
                                                <Icon className={`w-4 h-4 ${isActive ? 'text-[#944555] dark:text-[#f191a1]' : 'text-slate-400'}`} />
                                                {link.label}
                                            </div>
                                            {link.badge > 0 && (
                                                <span className="bg-[#944555] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg shadow-[#944555]/20 animate-pulse">
                                                    {link.badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-6 pb-6 mt-auto">
                    <div className="bg-slate-900 dark:bg-[#1a1c23] rounded-2xl p-4 relative overflow-hidden border border-slate-800">
                        <h4 className="font-bold text-white text-xs mb-0.5">System Status</h4>
                        <p className="text-[10px] text-slate-400 mb-3">{storeStatus.online ? 'Online' : 'Maintenance'}</p>
                        <button onClick={handleLogout} className="w-full bg-white/10 text-white text-[11px] font-bold py-2 rounded-lg flex items-center justify-center gap-2">
                            <LogOut className="w-3.5 h-3.5" /> Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

            <main className="flex-1 w-full min-h-screen md:ml-72 flex flex-col bg-[#f8fafc] dark:bg-[#0f111a] pt-16 md:pt-0 overflow-x-hidden">
                <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }` }} />
                
                <div className="px-6 py-4 flex justify-between items-center bg-[#f8fafc]/80 dark:bg-[#0f111a]/80 backdrop-blur-md sticky top-0 z-20">
                    <div className="hidden md:block">
                        <p className="text-slate-500 font-medium text-sm">Welcome back,</p>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Administrator</h1>
                    </div>
                    <div className="flex items-center gap-4 ml-auto">
                        <button data-tour="theme-toggle" onClick={toggleTheme} className="hidden md:flex w-10 h-10 rounded-full bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800 items-center justify-center">
                            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-slate-400" />}
                        </button>
                        <button data-tour="global-search" onClick={() => setIsSearchOpen(true)} className="w-10 h-10 rounded-full bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                            <Search className="w-5 h-5 text-slate-400" />
                        </button>
                        <button 
                            data-tour="tour-button"
                            onClick={handleStartTour} 
                            className="w-10 h-10 rounded-full bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800 flex items-center justify-center relative group hover:border-[#944555] transition-all"
                            title="Start Guided Tour"
                        >
                            <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-[#944555] transition-colors" />
                            {isNewTourAvailable && (
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#944555] rounded-full border-2 border-white dark:border-[#1a1c23] animate-pulse" />
                            )}
                        </button>

                        <div className="relative" ref={notificationRef}>
                            <button data-tour="notification-bell" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="w-10 h-10 rounded-full bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800 flex items-center justify-center relative">
                                <Bell className="w-5 h-5 text-slate-400" />
                                {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] text-white font-black">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                            </button>
                            {isNotificationsOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#1a1c23] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="font-bold">Notifications</h3>
                                        <button className="text-xs text-[#944555] font-bold" onClick={markAllRead}>Mark all read</button>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="text-center py-10 text-slate-400"><p className="text-sm">No notifications</p></div>
                                        ) : (
                                            notifications.map(notif => {
                                                const Icon = notif.type === 'order' ? ShoppingBag : notif.type === 'lead' ? Mail : notif.type === 'inventory' ? AlertTriangle : Bell;
                                                return (
                                                    <div 
                                                        key={notif.id} 
                                                        onClick={() => markRead(notif.id)}
                                                        className={`p-4 border-b border-slate-50 dark:border-slate-800/50 flex gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!notif.read ? 'bg-[#fff5f6]/40 dark:bg-[#944555]/5' : ''}`}
                                                    >
                                                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${!notif.read ? 'bg-[#944555] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className={`text-sm leading-tight ${!notif.read ? 'font-black' : 'font-bold'} truncate`}>{notif.title}</h4>
                                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.body}</p>
                                                            <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-wider">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                        {!notif.read && <div className="w-2 h-2 rounded-full bg-[#944555] shrink-0 mt-1"></div>}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={profileRef}>
                            <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                <div className="w-9 h-9 rounded-full bg-[#fff5f6] text-[#944555] font-bold flex items-center justify-center">{(adminUser?.email?.charAt(0) || 'A').toUpperCase()}</div>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </div>
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#1a1c23] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800"><p className="text-sm font-bold truncate">{adminUser?.email}</p></div>
                                    <div className="p-2">
                                        <Link to="/admin/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"><Settings className="w-4 h-4" /> Settings</Link>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 text-left"><LogOut className="w-4 h-4" /> Logout</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 h-full w-full">
                    <Outlet key={location.pathname} />
                </div>
                <NotificationStack notifications={toasts} onClose={removeToast} />

                {/* Tour Spotlight Overlay */}
                {isTourOpen && tourSteps.length > 0 && highlightStyle.display !== 'none' && (
                    <div style={highlightStyle} className="transition-all duration-300 pointer-events-none select-none" />
                )}

                {/* Interactive Guided Tour Pop-up Tooltip */}
                {isTourOpen && tourSteps.length > 0 && (
                    <div 
                        ref={popoverRef}
                        style={popoverStyle} 
                        className="tour-popover-box bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-[28px] shadow-2xl p-6 flex flex-col space-y-4 animate-fade-in-up select-none"
                    >
                        {/* Little triangle arrow pointing to target element */}
                        {arrowClass === 'up' && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-[#1a1c23] rotate-45 border-t border-l border-slate-200 dark:border-slate-850 z-10" />
                        )}
                        {arrowClass === 'down' && (
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-[#1a1c23] rotate-45 border-b border-r border-slate-200 dark:border-slate-850 z-10" />
                        )}
                        {arrowClass === 'left' && (
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-[#1a1c23] rotate-45 border-b border-l border-slate-200 dark:border-slate-850 z-10" />
                        )}
                        {arrowClass === 'right' && (
                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-[#1a1c23] rotate-45 border-t border-r border-slate-200 dark:border-slate-850 z-10" />
                        )}

                        {/* Header */}
                        <div className="flex justify-between items-center relative z-20">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-[#944555]/10 flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-[#944555]" />
                                </div>
                                <span className="text-[10px] font-black text-[#944555] uppercase tracking-wider">Atelier Guide</span>
                            </div>
                            <button 
                                onClick={() => setIsTourOpen(false)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-400"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Step Title & Description */}
                        <div className="space-y-1.5 relative z-20">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                                {tourSteps[tourStep]?.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                {tourSteps[tourStep]?.description}
                            </p>
                        </div>

                        {/* Tip Container */}
                        {tourSteps[tourStep]?.tip && (
                            <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 text-amber-600 dark:text-amber-400 flex items-start gap-2.5 relative z-20">
                                <span className="text-[10px] font-black uppercase shrink-0 mt-0.5 bg-amber-500/10 dark:bg-amber-500/20 px-1.5 py-0.5 rounded">Tip</span>
                                <p className="text-[10px] font-medium leading-relaxed">{tourSteps[tourStep].tip}</p>
                            </div>
                        )}

                        {/* Footer / Controls */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 relative z-20">
                            {/* Progress Dots */}
                            <div className="flex gap-1.5">
                                {tourSteps.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setTourStep(idx)}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                            tourStep === idx ? 'w-4 bg-[#944555]' : 'w-1.5 bg-slate-200 dark:bg-slate-700'
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex gap-2">
                                {tourStep > 0 && (
                                    <button
                                        onClick={() => setTourStep(prev => prev - 1)}
                                        className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        Back
                                    </button>
                                )}

                                {tourStep < tourSteps.length - 1 ? (
                                    <button
                                        onClick={() => setTourStep(prev => prev + 1)}
                                        className="px-3.5 py-1.5 text-[10px] font-black uppercase bg-[#944555] hover:bg-[#7d3a47] text-white rounded-lg transition-colors shadow-sm"
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsTourOpen(false)}
                                        className="px-3.5 py-1.5 text-[10px] font-black uppercase bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-sm"
                                    >
                                        Finish
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {isSearchOpen && (
                    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}></div>
                        <div className="relative w-full max-w-2xl bg-white dark:bg-[#1a1c23] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center px-4 py-4 border-b border-slate-100 dark:border-slate-800">
                                <Search className="w-5 h-5 text-slate-400" />
                                <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products, customers, orders... (Ctrl+K)" className="flex-1 bg-transparent px-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none" />
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto p-2">
                                {isSearching ? (
                                    <div className="p-4 text-center text-slate-500">Searching...</div>
                                ) : searchResults.length === 0 ? (
                                    <div className="p-4 text-center text-slate-400">{searchQuery ? 'No results found' : 'Start typing to search...'}</div>
                                ) : (
                                    searchResults.map((item, i) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link key={i} to={item.link} onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center"><Icon className="w-4 h-4 text-slate-500" /></div>
                                                    <div>
                                                        <h5 className="font-bold text-sm">{item.name}</h5>
                                                        <p className="text-xs text-slate-500">{item.preview}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">{item.type}</span>
                                            </Link>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminLayout;
