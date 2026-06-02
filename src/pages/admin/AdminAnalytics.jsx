import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Users, ShoppingBag, ArrowUpRight, ArrowDownRight, Activity, Calendar, MoreHorizontal, RefreshCw, Trash2 } from 'lucide-react';
import {
    PieChart, Pie, Cell,
    LineChart, Line,
    AreaChart, Area,
    BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';

const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 dark:bg-[#12131a]/80 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transform scale-100 transition-all">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-black mb-3 uppercase tracking-widest">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-4 mb-2 last:mb-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color || entry.fill }}></div>
                            <span className="text-slate-600 dark:text-slate-300 font-medium text-sm capitalize">{entry.name}</span>
                        </div>
                        <span className="text-slate-900 dark:text-white font-black text-sm ml-auto">
                            {prefix}{typeof entry.value === 'number' && entry.value > 1000 && prefix === '₹' ? (entry.value / 1000).toFixed(1) + 'k' : entry.value}{suffix}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const AdminAnalytics = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAnalyticsData = async () => {
        setIsLoading(true);
        try {
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*');

            if (!ordersError && ordersData) {
                setOrders(ordersData);
            }
        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const handleResetDatabase = async () => {
        showAlert({
            title: 'Security Verification',
            message: 'Enter admin password to proceed with financial reset:',
            type: 'warning',
            showInput: true,
            inputType: 'password',
            confirmText: 'Verify Password',
            onConfirm: (pass) => {
                if (pass === "appunandhu123*") {
                    showAlert({
                        title: 'Confirm Wipe',
                        message: 'WARNING: This will permanently wipe all financial data and existing orders. Continue?',
                        type: 'danger',
                        confirmText: 'Yes, Wipe Data',
                        onConfirm: () => {
                            showAlert({
                                title: 'FINAL WARNING',
                                message: 'Are you absolutely sure? This cannot be undone.',
                                type: 'danger',
                                confirmText: 'PERMANENTLY DELETE EVERYTHING',
                                onConfirm: async () => {
                                    try {
                                        setIsLoading(true);
                                        const { error } = await supabase.from('orders').delete().not('id', 'is', null);
                                        if (error) throw error;
                                        showAlert({ title: 'Success', message: 'Database reset successful. All orders and financial data deleted.', type: 'success' });
                                        setTimeout(() => window.location.reload(), 2000);
                                    } catch (err) {
                                        console.error(err);
                                        showAlert({ title: 'Reset Failed', message: err.message, type: 'danger' });
                                        setIsLoading(false);
                                    }
                                }
                            });
                        }
                    });
                } else {
                    showAlert({ title: 'Access Denied', message: 'Incorrect password. Reset aborted.', type: 'danger' });
                }
            }
        });
    };

    // Standard parsing for amounts
    const parseAmount = (val) => parseFloat(String(val || '0').replace(/,/g, '')) || 0;

    // Calculate aggregated real metrics from orders (excluding Cancelled/Refunded)
    const activeOrders = orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Refunded');
    const totalRevenue = activeOrders.reduce((sum, order) => sum + parseAmount(order.total || order.metadata?.total), 0);
    const avgOrderValue = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;
    const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;

    // --- TIMELINE CALCULATIONS ---
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();

    // 1. Last 7 Days Timeline (Revenue & Orders)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        last7Days.push({
            dateStr: date.toISOString().split('T')[0],
            name: dayNames[date.getDay()],
            revenue: 0,
            orders: 0
        });
    }

    // 2. Last 6 Months Timeline (Profit & Growth)
    const monthlyBuckets = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyBuckets.push({
            month: monthNames[date.getMonth()],
            monthIndex: date.getMonth(),
            year: date.getFullYear(),
            revenue: 0,
            refunds: 0,
            ordersCount: 0,
            newCustomers: 0,
            returningCustomers: 0
        });
    }

    // 3. Process Orders into Buckets
    const customerMemory = new Set();
    const sortedOrders = [...orders].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    orders.forEach(o => {
        const orderDate = new Date(o.created_at);
        const orderDateStr = orderDate.toISOString().split('T')[0];
        const amount = parseAmount(o.total || o.metadata?.total);

        // Fill 7 Days
        const dayBucket = last7Days.find(b => b.dateStr === orderDateStr);
        if (dayBucket) {
            dayBucket.orders++;
            if (o.status !== 'Cancelled' && o.status !== 'Refunded') {
                dayBucket.revenue += amount;
            }
        }

        // Fill 6 Months
        const monthBucket = monthlyBuckets.find(b => b.monthIndex === orderDate.getMonth() && b.year === orderDate.getFullYear());
        if (monthBucket) {
            monthBucket.ordersCount++;
            if (o.status === 'Refunded') {
                monthBucket.refunds += amount;
            } else if (o.status !== 'Cancelled') {
                monthBucket.revenue += amount;
            }

            const userId = o.user_id || o.metadata?.email || o.metadata?.phone || o.id;
            if (customerMemory.has(userId)) {
                monthBucket.returningCustomers++;
            } else {
                monthBucket.newCustomers++;
                customerMemory.add(userId);
            }
        } else {
            // Track customers even before the 6-month window for accurate "Returning" status
            customerMemory.add(o.user_id || o.metadata?.email || o.metadata?.phone || o.id);
        }
    });

    const revenueData = last7Days.map(b => ({ name: b.name, revenue: b.revenue }));
    const ordersData = last7Days.map(b => ({ name: b.name, orders: b.orders }));

    // 4. Parse Top Products from Order Items
    const productSales = {};
    orders.forEach(o => {
        // Handle both standard 'items' field and legacy metadata fields
        const cart = o.items || o.metadata?.cart || o.metadata?.products || [];
        cart.forEach(item => {
            const name = item.title || item.name || 'Product';
            productSales[name] = (productSales[name] || 0) + (item.quantity || item.qty || 1);
        });
    });

    let topProductsData = Object.keys(productSales)
        .map(name => ({ name: name.substring(0, 15), sales: productSales[name] }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

    // 5. Payment Methods Distribution
    const paymentCounts = {};
    orders.forEach(o => {
        const method = (o.payment_method || o.metadata?.payment_method || 'WhatsApp').split(' ')[0] || 'Direct';
        paymentCounts[method] = (paymentCounts[method] || 0) + 1;
    });

    let paymentMethodsData = Object.keys(paymentCounts).map(k => ({
        name: k,
        value: paymentCounts[k]
    }));

    // 6. Trend Data Derived from Timeline
    const profitTrendData = monthlyBuckets.map(b => ({
        month: b.month,
        profit: b.revenue * 0.4 
    }));

    const customerGrowthData = monthlyBuckets.map(b => ({
        month: b.month,
        new: b.newCustomers,
        returning: b.returningCustomers
    }));

    const returnRateData = monthlyBuckets.slice(-6).map(b => ({
        week: b.month,
        rate: b.revenue > 0 ? parseFloat(((b.refunds / b.revenue) * 100).toFixed(1)) : 0
    }));

    const funnelData = orders.length > 0 ? [
        { stage: 'Site Visits', count: Math.max(orders.length * 25, 150) },
        { stage: 'Product Views', count: Math.max(orders.length * 15, 80) },
        { stage: 'Add to Cart', count: Math.max(orders.length * 5, 25) },
        { stage: 'Checkout', count: Math.max(orders.length * 2, 10) },
        { stage: 'Purchased', count: orders.length },
    ] : [
        { stage: 'Site Visits', count: 0 },
        { stage: 'Product Views', count: 0 },
        { stage: 'Add to Cart', count: 0 },
        { stage: 'Checkout', count: 0 },
        { stage: 'Purchased', count: 0 },
    ];

    const COLORS = ['#944555', '#f472b6', '#3b82f6', '#10b981', '#f59e0b'];

    return (
        <div className="space-y-8 animate-fade-in pb-12">

            {/* Header section with Glassmorphism */}
            <div data-tour="analytics-header" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 dark:bg-[#1a1c23]/40 backdrop-blur-xl p-6 rounded-[32px] border border-white/60 dark:border-slate-800/60 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight">Analytics Overview</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Real-time metrics and deep insights</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button data-tour="reset-db-btn" onClick={handleResetDatabase} className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm">
                        <Trash2 className="w-4 h-4" /> Reset Database
                    </button>
                    <button
                        data-tour="refresh-analytics-btn"
                        onClick={fetchAnalyticsData}
                        disabled={isLoading}
                        className="bg-white/50 dark:bg-[#12131a]/50 hover:bg-white/80 dark:hover:bg-[#12131a]/80 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <div data-tour="analytics-range-selector" className="flex items-center gap-3 bg-white/50 dark:bg-[#12131a]/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md">
                        <div className="p-2 bg-white dark:bg-[#1a1c23] shadow-sm rounded-xl text-[#944555]"><Calendar className="w-4 h-4" /></div>
                        <select className="bg-transparent text-slate-700 dark:text-slate-300 pr-4 py-1 font-bold text-sm focus:outline-none cursor-pointer appearance-none">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                            <option>This Year</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Ultra-Modern KPI Cards */}
            <div data-tour="analytics-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: 'Total Revenue', value: '₹' + totalRevenue.toLocaleString('en-IN'), change: '+12.5%', isUp: true, icon: TrendingUp, color: 'from-[#944555] to-[#f472b6]' },
                    { title: 'Total Orders', value: orders.length, change: '+5.2%', isUp: true, icon: Activity, color: 'from-emerald-400 to-emerald-600' },
                    { title: 'Avg Order Value', value: '₹' + Math.round(avgOrderValue).toLocaleString('en-IN'), change: '-1.1%', isUp: false, icon: ShoppingBag, color: 'from-amber-400 to-orange-500' },
                    { title: 'Delivered', value: deliveredOrders, change: '+14.5%', isUp: true, icon: Users, color: 'from-blue-400 to-indigo-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-[#15171e] p-6 rounded-[32px] border border-slate-100/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full ${stat.isUp ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {stat.change}
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">{stat.title}</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Standard definitions for gradients & glows */}
            <svg style={{ height: 0, width: 0, position: 'absolute' }}>
                <defs>
                    <linearGradient id="gradientPurple" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#944555" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#944555" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="barGradient" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#944555" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#944555" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="barGradientBlue" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={1} />
                    </linearGradient>
                </defs>
            </svg>

            {/* --- Graphs Grid (Neumorphic / Highly Stylized) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* 1. Revenue Trend */}
                <div data-tour="revenue-trend-card" className="bg-white dark:bg-[#15171e] p-8 rounded-[32px] border border-slate-100/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex flex-col group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#944555] to-[#f472b6] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Revenue Trend</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Weekly cashflow</p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors bg-slate-50 dark:bg-[#1a1c23] p-2 rounded-xl"><MoreHorizontal className="w-5 h-5" /></button>
                    </div>
                    <div className="w-full flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.1} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                                <Tooltip content={<CustomTooltip prefix="₹" />} cursor={{ stroke: '#944555', strokeWidth: 1, strokeDasharray: '5 5' }} />
                                <Area type="monotone" dataKey="revenue" stroke="#944555" strokeWidth={4} fillOpacity={1} fill="url(#gradientPurple)" activeDot={{ r: 8, strokeWidth: 0, fill: '#944555' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Profit Trend */}
                <div data-tour="profit-trend-card" className="bg-white dark:bg-[#15171e] p-8 rounded-[32px] border border-slate-100/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex flex-col group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#10b981] to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Profit Trend</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Net margins</p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors bg-slate-50 dark:bg-[#1a1c23] p-2 rounded-xl"><MoreHorizontal className="w-5 h-5" /></button>
                    </div>
                    <div className="w-full flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={profitTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.1} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                                <Tooltip content={<CustomTooltip prefix="₹" />} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '5 5' }} />
                                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#gradientGreen)" activeDot={{ r: 8, strokeWidth: 0, fill: '#10b981' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Orders Trend */}
                <div data-tour="orders-volume-card" className="bg-white dark:bg-[#15171e] p-8 rounded-[32px] border border-slate-100/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex flex-col group relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Orders Volume</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Daily units sold</p>
                        </div>
                    </div>
                    <div className="w-full flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ordersData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.1} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.05 }} />
                                <Bar dataKey="orders" fill="url(#barGradientBlue)" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Customer Growth (Stacked Area) */}
                <div data-tour="customer-base-card" className="bg-white dark:bg-[#15171e] p-8 rounded-[32px] border border-slate-100/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex flex-col group relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Customer Base</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">New vs Returning</p>
                        </div>
                    </div>
                    <div className="w-full flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={customerGrowthData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.1} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f472b6', strokeWidth: 1, strokeDasharray: '5 5' }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', paddingTop: '20px' }} />
                                <Area type="monotone" dataKey="new" name="New" stackId="1" stroke="#f472b6" strokeWidth={3} fill="#f472b6" fillOpacity={0.2} activeDot={{ r: 6, strokeWidth: 0, fill: '#f472b6' }} />
                                <Area type="monotone" dataKey="returning" name="Returning" stackId="1" stroke="#944555" strokeWidth={3} fill="#944555" fillOpacity={0.2} activeDot={{ r: 6, strokeWidth: 0, fill: '#944555' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. Top Products (Horizontal Bar) */}
                <div data-tour="top-products-card" className="bg-white dark:bg-[#15171e] p-8 rounded-[32px] border border-slate-100/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex flex-col">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8">Top Products <span className="text-sm text-slate-400 ml-2 font-bold">(Units Sold)</span></h3>
                    <div className="w-full flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProductsData} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} width={120} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.05 }} />
                                <Bar dataKey="sales" fill="url(#barGradient)" radius={[0, 8, 8, 0]} barSize={20}>
                                    {topProductsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 6. Conversion Funnel (Horizontal Bar) */}
                <div data-tour="conversion-funnel-card" className="bg-white dark:bg-[#15171e] p-8 rounded-[32px] border border-slate-100/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex flex-col">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8">Conversion Funnel <span className="text-sm text-slate-400 ml-2 font-bold">(Dropout Rate)</span></h3>
                    <div className="w-full flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} width={110} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.05 }} />
                                <Bar dataKey="count" fill="#944555" radius={[0, 8, 8, 0]} barSize={20}>
                                    {funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={1 - (index * 0.15)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>



                {/* 8. Payment Methods (Pie) */}
                <div data-tour="payment-methods-card" className="bg-white dark:bg-[#15171e] p-8 rounded-[32px] border border-slate-100/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex flex-col items-center">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 w-full text-left">Payment Methods</h3>
                    <div className="w-full flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentMethodsData}
                                    cx="50%" cy="50%"
                                    outerRadius={120}
                                    innerRadius={40}
                                    dataKey="value"
                                    stroke="transparent"
                                    paddingAngle={2}
                                    cornerRadius={4}
                                >
                                    {['#944555', '#f472b6', '#3b82f6', '#10b981'].map((color, index) => (
                                        <Cell key={`cell-${index}`} fill={color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip suffix="%" />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 9. Return Rate */}
                <div data-tour="return-rate-card" className="bg-white dark:bg-[#15171e] p-8 rounded-[32px] border border-slate-100/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex flex-col relative overflow-hidden">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8">Return Rate <span className="text-sm text-slate-400 ml-2 font-bold">(%)</span></h3>
                    <div className="w-full flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={returnRateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.1} />
                                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} tickFormatter={(val) => `${val}%`} />
                                <Tooltip content={<CustomTooltip suffix="%" />} cursor={{ stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '5 5' }} />
                                <Line type="monotone" dataKey="rate" name="Returns" stroke="#f59e0b" strokeWidth={4} strokeLinecap="round" activeDot={{ r: 8, strokeWidth: 0, fill: '#f59e0b' }} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>



            </div>
        </div>
    );
};

export default AdminAnalytics;


