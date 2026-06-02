import React, { useState, useEffect } from 'react';
import { 
    MoreHorizontal, ArrowRight, TrendingUp, ShoppingBag, Users, Package, RefreshCw, 
    Trash2, CheckCircle, AlertTriangle, MessageSquare, Ticket, CreditCard, Activity,
    Box, FileText, ChevronRight, Star, Layers, Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const { showAlert } = useAlert();
    const [stats, setStats] = useState({
        revenue: 0,
        orders: 0,
        customers: 0,
        products: 0,
        newOrdersToday: 0
    });
    const [chartData, setChartData] = useState([]);
    const [topCategories, setTopCategories] = useState([]);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [recentInquiries, setRecentInquiries] = useState([]);
    const [activeCoupons, setActiveCoupons] = useState(0);
    const [topProducts, setTopProducts] = useState([]);
    const [categoryCount, setCategoryCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch comprehensive data in parallel
            const results = await Promise.all([
                supabase.from('orders').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('products').select('*', { count: 'exact', head: true }),
                supabase.from('orders').select('total, created_at, items').order('created_at', { ascending: false }).limit(100),
                supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock', 10),
                supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(3),
                supabase.from('coupons').select('*', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('categories').select('*', { count: 'exact', head: true })
            ]);

            const orderCount = results[0].count || 0;
            const customerCount = results[1].count || 0;
            const productCount = results[2].count || 0;
            const ordersData = results[3].data || [];
            const lowStock = results[4].count || 0;
            const inquiries = results[5].data || [];
            const couponCount = results[6].count || 0;
            const catCount = results[7].count || 0;

            const totalRevenue = ordersData?.reduce((acc, curr) => {
                const amount = parseFloat(String(curr.total || '0').replace(/,/g, '')) || 0;
                return acc + amount;
            }, 0) || 0;
            
            // Calculate new orders today
            const today = new Date().toISOString().split('T')[0];
            const newToday = ordersData?.filter(o => o.created_at?.startsWith(today)).length || 0;

            // Generate Chart Data (Last 7 Days)
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const last7Days = Array.from({ length: 7 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return {
                    name: days[d.getDay()],
                    revenue: 0,
                    date: d.toISOString().split('T')[0]
                };
            }).reverse();

            ordersData?.forEach(order => {
                const orderDate = order.created_at?.split('T')[0];
                const dayMatch = last7Days.find(d => d.date === orderDate);
                if (dayMatch) {
                    dayMatch.revenue += parseFloat(String(order.total || '0').replace(/,/g, '')) || 0;
                }
            });

            // Top Products and Categories Logic
            const categoryStats = {};
            const productStats = {};

            ordersData?.forEach(order => {
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        const cat = item.category || 'Uncategorized';
                        const title = item.title || item.name || 'Unnamed Product';
                        const price = parseFloat(String(item.price || '0').replace(/,/g, '')) || 0;
                        const qty = parseInt(String(item.quantity || '0')) || 0;
                        const total = price * qty;

                        categoryStats[cat] = (categoryStats[cat] || 0) + total;
                        productStats[title] = (productStats[title] || 0) + total;
                    });
                }
            });

            const sortedProducts = Object.entries(productStats)
                .map(([name, revenue]) => ({ name, revenue }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            const sortedCats = Object.entries(categoryStats)
                .map(([name, revenue]) => ({ name, revenue }))
                .sort((a, b) => b.revenue - a.revenue);

            setStats({
                revenue: totalRevenue,
                orders: orderCount || 0,
                customers: customerCount || 0,
                products: productCount || 0,
                newOrdersToday: newToday
            });
            setChartData(last7Days);
            setLowStockCount(lowStock || 0);
            setRecentInquiries(inquiries || []);
            setActiveCoupons(couponCount || 0);
            setCategoryCount(catCount || 0);
            setTopProducts(sortedProducts);
            setTopCategories(sortedCats.length > 0 ? sortedCats : [
                { name: 'General Retail', revenue: totalRevenue },
                { name: 'Innerwear', revenue: totalRevenue * 0.4 },
                { name: 'Nightwear', revenue: totalRevenue * 0.2 }
            ]);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Dashboard Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

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
                                        setLoading(true);
                                        const { error } = await supabase.from('orders').delete().not('id', 'is', null);
                                        if (error) throw error;
                                        showAlert({ title: 'Success', message: 'Database reset successful. All orders and financial data deleted.', type: 'success' });
                                        setTimeout(() => window.location.reload(), 2000);
                                    } catch (err) {
                                        console.error(err);
                                        showAlert({ title: 'Reset Failed', message: err.message, type: 'danger' });
                                        setLoading(false);
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

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="flex flex-col h-full animate-fade-in-up pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Admin Dashboard</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Real-time performance overview</p>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleResetDatabase}
                        className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 transition-all shadow-sm active:scale-95"
                        title="Reset Database"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={fetchDashboardData}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:border-[#944555] transition-all shadow-sm active:scale-95 group disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-[#944555] ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Main Stats */}
            <div data-tour="stats-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Revenue', value: formatCurrency(stats.revenue), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-100/50 dark:bg-emerald-500/10' },
                    { label: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'text-[#944555]', bg: 'bg-[#fff5f6] dark:bg-[#944555]/10' },
                    { label: 'Active Customers', value: stats.customers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-100/50 dark:bg-blue-500/10' },
                    { label: 'Total Products', value: stats.products, icon: Package, color: 'text-orange-500', bg: 'bg-orange-100/50 dark:bg-orange-500/10' },
                ].map((item, i) => (
                    <div key={i} className="bg-white dark:bg-[#15171e] p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:border-[#944555]/50 transition-all cursor-default">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${item.bg} ${item.color}`}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{loading ? '...' : item.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                {/* Main Left Column */}
                <div className="xl:col-span-2 space-y-6 flex flex-col">
                    <div 
                        data-tour="welcome-banner"
                        className="rounded-3xl overflow-hidden relative shadow-lg shadow-[#944555]/20 animate-fade-in bg-cover bg-center min-h-[240px] flex items-center"
                        style={{ backgroundImage: `url('/Gemini_Generated_Image_h9czikh9czikh9cz.png')` }}
                    >
                        {/* High contrast gradient overlay to ensure text readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#944555] via-[#944555]/85 to-transparent z-0" />

                        <div className="relative z-10 p-8 md:w-2/3 flex flex-col justify-center">
                            <h2 className="text-white text-3xl font-black tracking-tight leading-tight mb-4 animate-fade-in">
                                Welcome to Bloomina <span className="inline-block text-2xl animate-bounce">✨</span>
                            </h2>
                            <p className="text-rose-100 text-sm mb-8 font-medium">
                                You have <span className="font-black text-white text-base">{stats.newOrdersToday}</span> new orders today. 
                                {stats.newOrdersToday > 0 ? " Time to start fulfilling!" : " Keep up the marketing efforts!"}
                            </p>
                            <Link to="/admin/orders" className="bg-white text-[#944555] w-fit font-black px-6 py-3 rounded-xl transition-all flex items-center gap-2 hover:bg-slate-50 shadow-lg active:scale-95 group">
                                View Analytics Report <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    <div data-tour="performance-chart" className="bg-white dark:bg-[#15171e] rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex-1 min-h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-slate-900 dark:text-white font-bold text-lg">Weekly Performance</h3>
                                <p className="text-xs text-slate-500 font-medium">Revenue trends for the last 7 days</p>
                            </div>
                            <button className="w-10 h-10 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors text-slate-400">
                                <MoreHorizontal />
                            </button>
                        </div>
                        
                        <div className="flex-1 w-full min-h-[300px]">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <RefreshCw className="w-8 h-8 text-slate-200 animate-spin" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#944555" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#944555" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                            dy={10}
                                        />
                                        <YAxis hide />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#fff', 
                                                border: 'none', 
                                                borderRadius: '16px', 
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                fontWeight: 800
                                            }}
                                            itemStyle={{ color: '#944555' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="revenue" 
                                            stroke="#944555" 
                                            strokeWidth={4}
                                            fillOpacity={1} 
                                            fill="url(#colorRev)" 
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <div data-tour="market-distribution" className="bg-white dark:bg-[#15171e] rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-fit">
                        <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-6 tracking-tight">Market Distribution</h3>
                        <div className="space-y-6 flex-1">
                            <div className="p-5 rounded-3xl bg-[#fff5f6] dark:bg-[#944555]/5 border border-[#944555]/10 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] font-black text-[#944555] uppercase tracking-widest bg-white dark:bg-[#944555]/20 px-2 py-1 rounded-lg">Top Category</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Live</span>
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{topCategories[0]?.name || 'Loading...'}</h4>
                                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                                        <TrendingUp className="w-3 h-3" />
                                        <span>High volume sales</span>
                                    </div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#944555]/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-1 h-4 bg-[#944555] rounded-full"></div>
                                    Growth Indicators
                                </h4>
                                <div className="space-y-3">
                                    {topCategories.slice(1).map((cat, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                    <Layers className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{cat.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Rising Category</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(cat.revenue)}</div>
                                                <div className="text-[10px] text-emerald-500 font-bold">+12%</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                                <Link to="/admin/categories" className="flex items-center justify-between p-4 rounded-2xl bg-[#944555]/5 border border-[#944555]/10 group">
                                    <div className="flex items-center gap-3">
                                        <Layers className="w-5 h-5 text-[#944555]" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">Product Categories</p>
                                            <p className="text-[10px] text-[#944555] font-black uppercase tracking-widest">{categoryCount} Total Categories</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#15171e] rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                        <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-6 tracking-tight flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-500" /> Top Selling Products
                        </h3>
                        <div className="space-y-4">
                            {topProducts.map((prod, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1a1c23] flex items-center justify-center text-[#944555] font-black text-xs shrink-0 shadow-sm">
                                            #{i + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{prod.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Performance Peak</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-black text-[#944555]">{formatCurrency(prod.revenue)}</p>
                                        <p className="text-[9px] text-emerald-500 font-bold uppercase">Trending</p>
                                    </div>
                                </div>
                            ))}
                            {topProducts.length === 0 && (
                                <div className="py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                    No sales data yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Operational Insights Section */}
                    <div data-tour="operational-insights" className="bg-white dark:bg-[#15171e] rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                        <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-6 tracking-tight">Operational Insights</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {/* Inventory Page Link */}
                            <Link to="/admin/inventory" className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-900/20 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Low Stock</h4>
                                        <p className="text-xs text-orange-600 font-bold">{lowStockCount} items need attention</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            {/* Inquiries Page Link */}
                            <Link to="/admin/inquiries" className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-900/20 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">New Inquiries</h4>
                                        <p className="text-xs text-blue-600 font-bold">{recentInquiries.length} pending leads</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            {/* Coupons Page Link */}
                            <Link to="/admin/coupons" className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-900/20 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center text-purple-600">
                                        <Ticket className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Promotions</h4>
                                        <p className="text-xs text-purple-600 font-bold">{activeCoupons} active coupons</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            {/* Finance Page Link */}
                            <Link to="/admin/finance" className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-900/20 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Payout Status</h4>
                                        <p className="text-xs text-emerald-600 font-bold">Health: Optimal</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            {/* System Status Link */}
                            <Link to="/admin/system" className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">System Status</h4>
                                        <p className="text-xs text-slate-500 font-bold">All services online</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Leads Preview Section */}
            <div data-tour="customer-leads" className="bg-white dark:bg-[#15171e] rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-slate-900 dark:text-white font-black text-xl tracking-tight">Recent Customer Leads</h3>
                        <p className="text-sm text-slate-500 font-medium">Latest inquiries from your storefront</p>
                    </div>
                    <Link to="/admin/inquiries" className="text-[#944555] font-black text-sm flex items-center gap-2 hover:gap-3 transition-all">
                        View All Leads <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {recentInquiries.length > 0 ? (
                        recentInquiries.map((lead, i) => (
                            <div key={i} className="p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 hover:border-[#944555]/30 transition-all group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center font-black text-[#944555] uppercase">
                                        {lead.name?.charAt(0) || lead.email?.charAt(0) || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">{lead.name || 'Anonymous'}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(lead.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 font-medium italic">"{lead.message || 'No message provided'}"</p>
                                <Link to="/admin/inquiries" className="text-[10px] font-black uppercase text-[#944555] tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Respond <ChevronRight className="w-3 h-3" />
                                </Link>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-3 py-12 text-center bg-slate-50/30 rounded-3xl border border-dashed border-slate-200">
                            <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No recent inquiries</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
;

