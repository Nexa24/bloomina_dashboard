import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Search,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BarChart2,
  Settings,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  CheckCircle2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  WandSparkles,
} from 'lucide-react';

const adminSections = [
  {
    title: 'Dashboard basics',
    icon: LayoutDashboard,
    summary: 'Start here to understand the home screen and daily admin flow.',
    items: [
      'Dashboard shows revenue, orders, customers, products, low stock, and inquiries.',
      'Use the quick cards to jump to the page you need the most.',
      'Check the last updated timestamp before making decisions.',
    ],
  },
  {
    title: 'Orders and fulfillment',
    icon: ShoppingBag,
    summary: 'Track orders, update tracking numbers, and manage manual orders.',
    items: [
      'Open Orders to search by order ID, phone, email, or payment status.',
      'Update delivery method, tracking number, and order status from the detail view.',
      'Use manual order creation when a customer places an order offline.',
    ],
  },
  {
    title: 'Catalog management',
    icon: Package,
    summary: 'Maintain products, categories, inventory, materials, and size guides.',
    items: [
      'Products is the main place to add, edit, publish, and archive items.',
      'Categories help organize the store and drive template-based attributes.',
      'Inventory and Materials keep stock, composition, and product data consistent.',
    ],
  },
  {
    title: 'Customers and engagement',
    icon: Users,
    summary: 'Review customer profiles, inquiries, reviews, and lead follow-up.',
    items: [
      'Customers shows order history, contact details, and account activity.',
      'Inquiries collects messages from forms and support requests.',
      'Brand Reviews and Hero help with trust-building and storefront promotion.',
    ],
  },
  {
    title: 'Analytics and finance',
    icon: BarChart2,
    summary: 'Use reports to understand performance and business health.',
    items: [
      'Analytics and Market Analytics show sales trends and market direction.',
      'Finance and Payments help reconcile income, refunds, and transaction flow.',
      'Coupons tracks promotions and discount performance.',
    ],
  },
  {
    title: 'System and settings',
    icon: Settings,
    summary: 'Control the platform, store status, and admin preferences.',
    items: [
      'System is used for health checks, logs, and storefront status.',
      'Settings stores admin profile, notification preferences, and store config.',
      'Use dark mode and notifications in the sidebar header for daily comfort.',
    ],
  },
];

const quickTasks = [
  {
    title: 'Add a new product',
    steps: ['Go to Products', 'Click Add/Create', 'Fill name, price, stock, category, and images', 'Save and publish when ready'],
  },
  {
    title: 'Update an order',
    steps: ['Open Orders', 'Search the order', 'Change tracking or status', 'Notify the customer if needed'],
  },
  {
    title: 'Check low stock',
    steps: ['Open Inventory or Dashboard', 'Review low stock items', 'Adjust quantities or plan restock', 'Save changes'],
  },
  {
    title: 'Reply to inquiries',
    steps: ['Open Inquiries', 'Read the message', 'Update status or assign follow-up', 'Use a response template if available'],
  },
];

const shortcuts = [
  { key: 'Ctrl / Cmd + K', value: 'Open global search' },
  { key: 'Esc', value: 'Close search or dialogs' },
  { key: 'Sidebar links', value: 'Jump between admin modules' },
  { key: 'Refresh button', value: 'Reload the current dataset' },
];

const troubleshooting = [
  {
    title: 'Login fails',
    text: 'Check the email, password, admin approval flag, and 2FA code. If needed, clear session locks and try again.',
    icon: AlertTriangle,
  },
  {
    title: 'Data looks stale',
    text: 'Use the refresh action on the page and confirm your Supabase connection and permissions are active.',
    icon: RefreshCw,
  },
  {
    title: 'Notification missing',
    text: 'Verify browser permissions, notification settings, and whether the event type is subscribed in the sidebar hook.',
    icon: HelpCircle,
  },
];

const allPages = [
  { name: 'AdminDashboard', route: '/admin', purpose: 'KPI overview and quick actions' },
  { name: 'AdminLogin', route: '/admin/login', purpose: 'Secure login with 2FA' },
  { name: 'AdminOrders', route: '/admin/orders', purpose: 'Order lifecycle and fulfillment' },
  { name: 'AdminCustomers', route: '/admin/customers', purpose: 'Customer profiles and history' },
  { name: 'AdminProducts', route: '/admin/products', purpose: 'Product lifecycle management' },
  { name: 'AdminCategories', route: '/admin/categories', purpose: 'Category hierarchy and templates' },
  { name: 'AdminInventory', route: '/admin/inventory', purpose: 'Stock tracking and alerts' },
  { name: 'AdminMaterials', route: '/admin/materials', purpose: 'Materials and composition data' },
  { name: 'AdminSizeGuides', route: '/admin/size-guides', purpose: 'Size chart management' },
  { name: 'AdminFinance', route: '/admin/finance', purpose: 'Financial performance tracking' },
  { name: 'AdminPayments', route: '/admin/payments', purpose: 'Payment reconciliation and statuses' },
  { name: 'AdminAnalytics', route: '/admin/analytics', purpose: 'Business intelligence reporting' },
  { name: 'AdminMarketAnalytics', route: '/admin/market-analytics', purpose: 'Market trend insights' },
  { name: 'AdminMarketing', route: '/admin/marketing', purpose: 'Campaign management' },
  { name: 'AdminCoupons', route: '/admin/coupons', purpose: 'Discount and promo controls' },
  { name: 'AdminHero', route: '/admin/hero', purpose: 'Homepage hero management' },
  { name: 'AdminBrandReviews', route: '/admin/brand-reviews', purpose: 'Review moderation' },
  { name: 'AdminLeads', route: '/admin/inquiries', purpose: 'Inquiry and lead workflow' },
  { name: 'AdminSystem', route: '/admin/system', purpose: 'System health and logs' },
  { name: 'AdminSettings', route: '/admin/settings', purpose: 'Store and admin settings' },
  { name: 'AdminHelp', route: '/admin/help', purpose: 'Complete in-app learning journal' },
];

const extraSections = [
  {
    title: 'Components and contexts',
    items: [
      'AdminLayout, OrderNotificationToast, UniversalAlert, and reusable form/select components.',
      'AdminAuthContext for 2FA/admin checks, AlertContext for global feedback.',
      'AuthContext, CartContext, CompareContext, WishlistContext for storefront states.',
      'useNotifications for live toast/notification behavior.',
    ],
  },
  {
    title: 'Database and Supabase reference',
    items: [
      'Core tables: profiles, products, orders, categories, coupons, leads.',
      'Security/session tables: admin_2fa_sessions, user_sessions.',
      'System tables: system_config, system_logs.',
      'Patterns: paginated select, filtered search, insert/update with robust error handling.',
    ],
  },
  {
    title: 'Security, performance, and operations',
    items: [
      'Role + 2FA enforcement for admin routes and session heartbeat tracking.',
      'RLS-aware data operations with explicit error states and retries.',
      'Debounced search, paginated lists, limited query payloads for performance.',
      'Troubleshooting for auth failures, stale data, realtime issues, and theme/render issues.',
    ],
  },
];

const detailedBlueprints = [
  {
    title: 'Detailed product creation blueprint',
    route: '/admin/products',
    steps: [
      'Step 1: Open Products and click Create / Add Product.',
      'Step 2: Product Type (example: Apparel, Footwear, Accessories, Electronics).',
      'Step 3: Product Name (clear customer-facing title).',
      'Step 4: Select Category and optional subcategory.',
      'Step 5: Add SKU / internal code (unique).',
      'Step 6: Add Price, Cost, and optional Discount values.',
      'Step 7: Add Stock / quantity and low-stock threshold.',
      'Step 8: Add Attributes (brand, material, dimensions, weight, fit, etc.).',
      'Step 9: Add Variants (size, color, color configs).',
      'Step 10: Upload images (cover + gallery), then reorder gallery.',
      'Step 11: Set Status (Draft or Active), then Save.',
      'Step 12: Verify product appears in list and search by name/SKU.',
    ],
  },
  {
    title: 'Detailed order update blueprint',
    route: '/admin/orders',
    steps: [
      'Step 1: Open Orders and search using Order ID / email / phone.',
      'Step 2: Open order detail and confirm customer + payment status.',
      'Step 3: Set delivery method (Courier / Local / etc.).',
      'Step 4: Enter tracking number and verify format.',
      'Step 5: Update status (Processing → Shipped → Delivered).',
      'Step 6: Add admin notes if exception/issue exists.',
      'Step 7: Send customer update and save changes.',
      'Step 8: Re-open the order to confirm persistence.',
    ],
  },
  {
    title: 'Detailed coupon setup blueprint',
    route: '/admin/coupons',
    steps: [
      'Step 1: Open Coupons and click Create Coupon.',
      'Step 2: Enter coupon code (example: FESTIVE15).',
      'Step 3: Choose discount type (percentage or fixed amount).',
      'Step 4: Add discount value and usage limits.',
      'Step 5: Set valid from and valid until dates.',
      'Step 6: Scope coupon to products/categories if needed.',
      'Step 7: Activate coupon and save.',
      'Step 8: Validate with a test cart/order flow.',
    ],
  },
];

const guidedFlows = [
  {
    id: 'product-onboarding',
    title: 'Automated Demo: Add New Product',
    route: '/admin/products',
    description: 'Field-by-field guided simulation for adding a product in production-safe order.',
    steps: [
      {
        title: 'Open Product Creation',
        instruction: 'Navigate to Products and click Create / Add Product.',
        fields: [
          'Navigation: Sidebar → Products',
          'Action: Create Product button',
        ],
      },
      {
        title: 'Core Identity',
        instruction: 'Fill identity fields first so every dependent section is valid.',
        fields: [
          'Product Type: Apparel',
          'Product Name: Bloomina Linen Co-ord Set',
          'Category: Women > Co-ords',
          'SKU: BLO-COORD-001',
        ],
      },
      {
        title: 'Pricing and Inventory',
        instruction: 'Set commercial data before status change.',
        fields: [
          'Price: 2499',
          'Cost: 1325',
          'Discount: 10% (optional)',
          'Stock: 120',
        ],
      },
      {
        title: 'Attributes and Variants',
        instruction: 'Configure product metadata for filtering and storefront accuracy.',
        fields: [
          'Material: Linen Blend',
          'Fit: Relaxed',
          'Sizes: S, M, L, XL',
          'Colors: Rose, Ivory',
        ],
      },
      {
        title: 'Media and Publish',
        instruction: 'Upload visuals, set status, save, and verify listing.',
        fields: [
          'Images: Cover + 4 gallery images',
          'Status: Active',
          'Save and search by name/SKU to verify',
        ],
      },
    ],
  },
  {
    id: 'order-fulfillment',
    title: 'Automated Demo: Process Order',
    route: '/admin/orders',
    description: 'Walkthrough for shipping workflow with tracking and status updates.',
    steps: [
      {
        title: 'Find Order',
        instruction: 'Search by order ID or customer email/phone.',
        fields: ['Search: #ORDER_ID / email / phone'],
      },
      {
        title: 'Verify Payment & Address',
        instruction: 'Confirm payment status and shipping details before dispatch.',
        fields: ['Payment Status: Paid/Processing', 'Address validation'],
      },
      {
        title: 'Assign Shipping Details',
        instruction: 'Add delivery method and tracking number.',
        fields: ['Delivery Method: Courier', 'Tracking Number: AWB123456789'],
      },
      {
        title: 'Status Transition',
        instruction: 'Move status from Processing to Shipped and notify customer.',
        fields: ['Order Status: Shipped', 'Optional note: Packed and dispatched'],
      },
      {
        title: 'Completion',
        instruction: 'Mark as Delivered after final confirmation.',
        fields: ['Order Status: Delivered', 'Internal note: POD confirmed'],
      },
    ],
  },
  {
    id: 'campaign-coupon',
    title: 'Automated Demo: Create Campaign Coupon',
    route: '/admin/coupons',
    description: 'Promotion setup flow from code creation to activation checks.',
    steps: [
      {
        title: 'Create Coupon Record',
        instruction: 'Open coupons and start a new coupon.',
        fields: ['Code: BLOOM15', 'Type: Percentage'],
      },
      {
        title: 'Set Rules',
        instruction: 'Apply discount and usage controls.',
        fields: ['Discount: 15%', 'Usage limit: 500', 'Per customer: 1'],
      },
      {
        title: 'Set Validity',
        instruction: 'Define campaign period and scope.',
        fields: ['Valid From: Today', 'Valid Until: +10 days', 'Scope: Selected categories'],
      },
      {
        title: 'Activate & Test',
        instruction: 'Save active coupon and validate in a cart flow.',
        fields: ['is_active: true', 'Test order: Discount applied'],
      },
    ],
  },
];

const AdminHelp = () => {
  const [query, setQuery] = useState('');
  const [activeFlowId, setActiveFlowId] = useState(guidedFlows[0].id);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [autoDemoRunning, setAutoDemoRunning] = useState(false);

  const normalized = query.trim().toLowerCase();

  const activeFlow = useMemo(
    () => guidedFlows.find((flow) => flow.id === activeFlowId) || guidedFlows[0],
    [activeFlowId]
  );

  const activeStep = activeFlow.steps[activeStepIndex] || activeFlow.steps[0];

  useEffect(() => {
    setActiveStepIndex(0);
    setAutoDemoRunning(false);
  }, [activeFlowId]);

  useEffect(() => {
    if (!autoDemoRunning) return undefined;

    const timer = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev >= activeFlow.steps.length - 1) {
          setAutoDemoRunning(false);
          return prev;
        }
        return prev + 1;
      });
    }, 3200);

    return () => clearInterval(timer);
  }, [autoDemoRunning, activeFlow]);

  const filteredSections = useMemo(() => {
    if (!normalized) return [...adminSections, ...extraSections];
    return [...adminSections, ...extraSections].filter((section) =>
      section.title.toLowerCase().includes(normalized) ||
      (section.summary || '').toLowerCase().includes(normalized) ||
      (section.content || section.items || []).some((item) => item.toLowerCase().includes(normalized))
    );
  }, [normalized]);

  const filteredPages = useMemo(() => {
    if (!normalized) return allPages;
    return allPages.filter((page) =>
      page.name.toLowerCase().includes(normalized) ||
      page.route.toLowerCase().includes(normalized) ||
      page.purpose.toLowerCase().includes(normalized)
    );
  }, [normalized]);

  const filteredBlueprints = useMemo(() => {
    if (!normalized) return detailedBlueprints;
    return detailedBlueprints.filter((bp) =>
      bp.title.toLowerCase().includes(normalized) ||
      bp.route.toLowerCase().includes(normalized) ||
      bp.steps.some((step) => step.toLowerCase().includes(normalized))
    );
  }, [normalized]);

  const filteredFlows = useMemo(() => {
    if (!normalized) return guidedFlows;
    return guidedFlows.filter((flow) =>
      flow.title.toLowerCase().includes(normalized) ||
      flow.route.toLowerCase().includes(normalized) ||
      flow.description.toLowerCase().includes(normalized) ||
      flow.steps.some(
        (step) =>
          step.title.toLowerCase().includes(normalized) ||
          step.instruction.toLowerCase().includes(normalized) ||
          step.fields.some((field) => field.toLowerCase().includes(normalized))
      )
    );
  }, [normalized]);

  const progressPercent = Math.round(((activeStepIndex + 1) / activeFlow.steps.length) * 100);

  const goPrevStep = () => setActiveStepIndex((prev) => Math.max(0, prev - 1));
  const goNextStep = () => setActiveStepIndex((prev) => Math.min(activeFlow.steps.length - 1, prev + 1));
  const resetFlow = () => {
    setAutoDemoRunning(false);
    setActiveStepIndex(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f111a] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div data-tour="help-header" className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#15171e] shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 lg:p-10 bg-gradient-to-r from-[#944555] via-[#b35e71] to-[#6f3a47] text-white">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="max-w-4xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
                  <BookOpen className="w-4 h-4" />
                  Complete Admin Help / Learning Journal
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Everything inside one page</h1>
                <p className="text-white/90 text-sm sm:text-base leading-6">
                  This in-app journal now covers architecture, tech stack, all routes/pages, components, contexts,
                  database references, workflows, troubleshooting, security, and performance guidance.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/10 p-4 border border-white/15">
                  <div className="text-white/70 text-xs uppercase tracking-[0.2em]">Pages covered</div>
                  <div className="mt-2 text-2xl font-black">{allPages.length}</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 border border-white/15">
                  <div className="text-white/70 text-xs uppercase tracking-[0.2em]">Coverage</div>
                  <div className="mt-2 text-2xl font-black">Everything</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                data-tour="help-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anything in help journal..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1c23] pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#944555]/40"
              />
            </div>
          </div>
        </div>

        <section data-tour="help-reference-cards" className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#15171e] p-5 sm:p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Complete admin pages reference</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {filteredPages.map((page) => (
              <div key={page.route} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a1c23] p-4">
                <div className="font-bold text-slate-900 dark:text-white">{page.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{page.route}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mt-2">{page.purpose}</div>
              </div>
            ))}
          </div>
        </section>

        <section data-tour="help-demo-panel" className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#15171e] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <WandSparkles className="w-5 h-5 text-[#944555]" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Automated demonstration</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            Interactive auto-play simulation for real admin workflows. Select a flow and press Play to watch step-by-step execution.
          </p>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-3">
              {filteredFlows.map((flow) => (
                <button
                  key={flow.id}
                  type="button"
                  onClick={() => setActiveFlowId(flow.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${
                    flow.id === activeFlow.id
                      ? 'border-[#944555] bg-[#944555]/10'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a1c23]'
                  }`}
                >
                  <div className="font-bold text-slate-900 dark:text-white">{flow.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{flow.route}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 mt-2">{flow.description}</div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a1c23] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{activeFlow.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Step {activeStepIndex + 1} of {activeFlow.steps.length}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" onClick={goPrevStep} className="rounded-lg border border-slate-300 dark:border-slate-700 p-2">
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoDemoRunning((prev) => !prev)}
                    className="rounded-lg bg-[#944555] text-white p-2 hover:bg-[#803b4b]"
                  >
                    {autoDemoRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button type="button" onClick={goNextStep} className="rounded-lg border border-slate-300 dark:border-slate-700 p-2">
                    <SkipForward className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={resetFlow} className="rounded-lg border border-slate-300 dark:border-slate-700 p-2">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div className="h-2 bg-[#944555] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="mt-5 rounded-2xl bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800 p-4">
                <h3 className="font-bold text-slate-900 dark:text-white">{activeStep.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{activeStep.instruction}</p>

                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Fields / checklist</div>
                  <ul className="space-y-2">
                    {activeStep.fields.map((field) => (
                      <li key={field} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                        <span>{field}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section data-tour="help-blueprints-container" className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#15171e] p-5 sm:p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Detailed operational blueprints</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
            Expanded how-to checklists with exact field order and admin actions.
          </p>

          <div className="space-y-4">
            {filteredBlueprints.map((bp) => (
              <details key={bp.title} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a1c23] p-4" open={bp.title.includes('product')}>
                <summary className="cursor-pointer list-none">
                  <div className="font-bold text-slate-900 dark:text-white">{bp.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{bp.route}</div>
                </summary>

                <ol className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {bp.steps.map((step) => (
                    <li key={step} className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredSections.map((section) => {
            const Icon = section.icon || BookOpen;
            const rows = section.content || section.items || [];
            return (
              <article key={section.title} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#15171e] p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#944555]/10 text-[#944555] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{section.title}</h3>
                    {section.summary && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{section.summary}</p>}
                  </div>
                </div>

                <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {rows.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="leading-6">{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
};

export default AdminHelp;
