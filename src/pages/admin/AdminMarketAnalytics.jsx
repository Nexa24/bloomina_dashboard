import React, { useState, useEffect } from 'react';
import { Globe, Target, Map, Activity, ShoppingBag, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';

const AdminMarketAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [regionData, setRegionData] = useState([]);
    const [trendingProduct, setTrendingProduct] = useState({ name: 'Waiting for orders...', count: 0 });
    const [totalValue, setTotalValue] = useState(0);
    const { showAlert } = useAlert();


    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: orders, error } = await supabase.from('orders').select('*');
            if (error) throw error;
            
            if (orders && orders.length > 0) {
                // 1. Calculate Geographic Distribution
                const regionMap = {};
                let totalRevenue = 0;
                
                orders.forEach(o => {
                    const amount = parseFloat(String(o.total || o.metadata?.total || '0').replace(/,/g, '')) || 0;
                    const isSuccessful = o.status !== 'Cancelled' && o.status !== 'Refunded';
                    
                    if (isSuccessful) {
                        totalRevenue += amount;
                    }
                    
                    // Extract region/state from shipping metadata if available
                    let region = 'Local / Other';
                    const state = o.metadata?.shipping_address?.state || o.metadata?.address?.state || o.metadata?.billing_address?.state;
                    if (state) region = `${state}, IN`;
                    
                    if (!regionMap[region]) regionMap[region] = { users: 0, revenue: 0 };
                    regionMap[region].users += 1;
                    if (o.status !== 'Cancelled') regionMap[region].revenue += amount;
                });
                
                setTotalValue(totalRevenue);

                let formattedRegions = Object.keys(regionMap).map(r => ({
                    region: r,
                    users: regionMap[r].users,
                    revenue: regionMap[r].revenue,
                    percentage: totalRevenue > 0 ? (regionMap[r].revenue / totalRevenue) * 100 : 0
                })).sort((a, b) => b.revenue - a.revenue);
                
                setRegionData(formattedRegions);

                // 2. Calculate Trending Product (Units Sold)
                const productSales = {};
                orders.forEach(o => {
                    if (o.status === 'Cancelled') return;
                    const cart = o.metadata?.cart || o.metadata?.products || [];
                    cart.forEach(item => {
                        const name = item.title || item.name || 'Product';
                        productSales[name] = (productSales[name] || 0) + (item.quantity || item.qty || 1);
                    });
                });
                
                const topProd = Object.keys(productSales).sort((a,b) => productSales[b] - productSales[a])[0];
                if (topProd) setTrendingProduct({ name: topProd, count: productSales[topProd] });
            } else {
                setRegionData([]);
                setTrendingProduct({ name: 'No orders yet', count: 0 });
                setTotalValue(0);
            }
        } catch (err) {
            console.error('Market Analytics Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
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

    const chartData = regionData.slice(0, 6); // Top 6 for chart

    return (
        <div className="space-y-6 animate-fade-in">
            <div data-tour="market-header" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Market Intelligence</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Analyze demographic engagement and global reach based on real orders</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button data-tour="market-reset-btn" onClick={handleResetDatabase} className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm">
                        <Trash2 className="w-4 h-4" /> Reset Database
                    </button>
                    <button
                        data-tour="market-refresh-btn"
                        onClick={fetchData}
                        disabled={loading}
                        className="bg-white/50 dark:bg-[#12131a]/50 hover:bg-white/80 dark:hover:bg-[#12131a]/80 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div data-tour="market-heatmap-card" className="bg-white dark:bg-[#1a1c23] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm md:col-span-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Geographic Order Heatmap</h3>
                        <div className="w-full h-[400px] mt-4 overflow-hidden relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    layout="vertical"
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" strokeOpacity={0.2} />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis type="category" dataKey="region" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={120} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="users" name="Active Orders" radius={[0, 4, 4, 0]} barSize={24}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#944555' : index === 1 ? '#a28bfc' : '#c6bafc'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div data-tour="market-regions-card" className="bg-white dark:bg-[#1a1c23] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Top Regions by Revenue</h3>
                            <div className="space-y-4">
                                {regionData.slice(0, 5).map((loc, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-center text-sm mb-1 font-bold">
                                            <span className="text-slate-700 dark:text-slate-300">{loc.region}</span>
                                            <span className="text-slate-900 dark:text-white">₹{loc.revenue.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                            <div className="bg-[#944555] h-1.5 rounded-full" style={{ width: `${loc.percentage}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                                {regionData.length === 0 && <p className="text-slate-400 text-sm">No location data found yet.</p>}
                            </div>
                        </div>

                        <div data-tour="market-trending-card" className="bg-[#1a1c23] dark:bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#944555] rounded-full blur-[50px] opacity-20"></div>
                            <Target className="w-8 h-8 text-[#944555] mb-3 relative z-10" />
                            <h3 className="text-lg font-black tracking-tight mb-1 relative z-10">Trending Product</h3>
                            <p className="text-sm text-slate-400 mb-4 relative z-10">Highest volume sold</p>
                            <div className="flex items-center gap-3 relative z-10 bg-white/5 p-3 rounded-xl border border-white/10">
                                <ShoppingBag className="w-5 h-5 text-yellow-500" />
                                <span className="font-bold line-clamp-1">{trendingProduct.name}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMarketAnalytics;


