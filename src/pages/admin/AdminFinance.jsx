import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Filter, ArrowUpRight, ArrowDownRight, CreditCard, Banknote, Activity, Trash2, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';

const AdminFinance = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;
    const { showAlert } = useAlert();

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) setOrders(data);
        } catch (err) {
            console.error('Finance fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportReport = () => {
        if (!orders.length) return;

        const headers = ['Order ID', 'Date', 'Status', 'Payment Method', 'Amount', 'Customer Name', 'Email'];
        const csvRows = [
            headers.join(','),
            ...orders.map(o => {
                const amount = parseFloat(String(o.total || o.metadata?.total || '0').replace(/,/g, ''));
                return [
                    o.id,
                    new Date(o.created_at).toLocaleDateString(),
                    o.status,
                    o.payment_method || 'N/A',
                    amount,
                    (o.customer_name || '').replace(/,/g, ''),
                    o.customer_email || ''
                ].join(',');
            })
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Bloomina_Finance_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const handleResetDatabase = async () => {
        // Replacing prompt with a staged secure flow
        showAlert({
            title: 'Administrative Security',
            message: 'You are attempting to access high-level database operations. Please confirm your administrative identity to proceed by entering your password.',
            type: 'warning',
            showInput: true,
            inputType: 'password',
            confirmText: 'Verify Password',
            onConfirm: (pass) => {
                if (pass === "appunandhu123*") {
                    executeSecurityFlow();
                } else if (pass !== null) {
                    showAlert({
                        title: 'Access Denied',
                        message: 'The password entered is incorrect. Serious administrative actions require verification.',
                        type: 'danger'
                    });
                }
            }
        });
    };

    const executeSecurityFlow = () => {

        showAlert({
            title: 'Critical Security Warning!',
            message: 'You are about to PERMANENTLY WIPE all financial data, orders, and transaction history. This action is irreversible. Proceed?',
            type: 'warning',
            confirmText: 'I Understand, Continue',
            cancelText: 'Abort Reset',
            onConfirm: () => {
                showAlert({
                    title: 'Terminal Confirmation',
                    message: 'One final check: Are you 100% certain you wish to purge the entire database? No recovery is possible.',
                    type: 'danger',
                    confirmText: 'Execute Purge Now',
                    cancelText: 'Stop!',
                    onConfirm: async () => {
                        try {
                            setLoading(true);
                            const { error } = await supabase.from('orders').delete().not('id', 'is', null);
                            if (error) throw error;
                            
                            showAlert({
                                title: 'Database Purged',
                                message: 'All financial records and orders have been successfully erased from the system.',
                                type: 'success',
                                showCancel: false,
                                confirmText: 'Exit Portal',
                                onConfirm: () => window.location.reload()
                            });
                        } catch (err) {
                            showAlert({
                                title: 'Purge Failed',
                                message: 'A system error occurred during the reset: ' + err.message,
                                type: 'danger'
                            });
                            setLoading(false);
                        }
                    }
                });
            }
        });
    };

    // Calculate real stats
    const parseAmount = (val) => parseFloat(String(val || '0').replace(/,/g, '')) || 0;

    const totalRevenue = orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Refunded')
                               .reduce((sum, o) => sum + parseAmount(o.total || o.metadata?.total), 0);
    const pendingPayouts = orders.filter(o => o.status === 'Processing')
                                 .reduce((sum, o) => sum + parseAmount(o.total || o.metadata?.total), 0);
    const refundsAmount = orders.filter(o => o.status === 'Refunded')
                                .reduce((sum, o) => sum + parseAmount(o.total || o.metadata?.total), 0);
    const activeDisputes = orders.filter(o => o.status === 'Disputed').length;

    // Generate Chart Data (Real historical buckets for the last 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date();
    const chartData = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(d.getFullYear(), d.getMonth() - i, 1);
        chartData.push({
            month: monthNames[date.getMonth()],
            year: date.getFullYear(),
            monthIndex: date.getMonth(),
            revenue: 0,
            refunds: 0
        });
    }

    orders.forEach(o => {
        const orderDate = new Date(o.created_at);
        const bucket = chartData.find(b => b.monthIndex === orderDate.getMonth() && b.year === orderDate.getFullYear());
        if (bucket) {
            const amount = parseAmount(o.total || o.metadata?.total);
            if (o.status === 'Refunded') bucket.refunds += amount;
            else if (o.status !== 'Cancelled') bucket.revenue += amount;
        }
    });

    // Format top 10 transactions
    const transactions = orders.slice(0, 10).map(o => ({
        id: String(o.id || '').substring(0, 8),
        type: o.status === 'Refunded' ? 'Refund' : 'Payment',
        amount: parseAmount(o.total || o.metadata?.total),
        date: new Date(o.created_at).toLocaleDateString(),
        status: o.status === 'Delivered' ? 'Completed' : o.status === 'Processing' ? 'Pending' : o.status || 'Pending',
        method: o.payment_method || 'WhatsApp / External'
    }));

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Completed':
            case 'Processed': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
            case 'Failed': return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
            case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    const totalPages = Math.ceil(transactions.length / itemsPerPage);
    const paginatedTransactions = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-4 sm:p-8 space-y-8 animate-fade-in-up pb-24 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div data-tour="finance-header">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Payment & Finance</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor revenue, payouts, and transactions</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button data-tour="reset-db-btn" onClick={handleResetDatabase} className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm">
                        <Trash2 className="w-4 h-4" /> Reset Database
                    </button>
                    <button
                        data-tour="refresh-finance-btn"
                        onClick={fetchFinanceData}
                        disabled={loading}
                        className="bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                    <button 
                        data-tour="export-report-btn"
                        onClick={handleExportReport}
                        className="bg-[#944555] hover:bg-[#7d3a47] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-md shadow-[#944555]/20 disabled:opacity-50"
                        disabled={!orders.length}
                    >
                        Export Report
                    </button>
                </div>
            </div>

            <div data-tour="finance-stats-grid" className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { title: 'Total Revenue YTD', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-500/10' },
                    { title: 'Pending Payouts', value: `₹${pendingPayouts.toLocaleString('en-IN')}`, icon: Banknote, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/10' },
                    { title: 'Refunds (30d)', value: `₹${refundsAmount.toLocaleString('en-IN')}`, icon: ArrowDownRight, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-500/10' },
                    { title: 'Active Disputes', value: activeDisputes.toString(), icon: Activity, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-[#1a1c23] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-500">{stat.title}</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div data-tour="revenue-chart" className="bg-white dark:bg-[#1a1c23] rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue vs Refunds</h3>
                        <p className="text-slate-500 text-sm">Monthly cash flow comparative analysis</p>
                    </div>
                </div>

                <div className="w-full h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#944555" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#944555" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorRefunds" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.2} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} tickFormatter={(value) => `₹${value / 1000}k`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                            />
                            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#944555" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            <Area type="monotone" dataKey="refunds" name="Refunds" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorRefunds)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div data-tour="transactions-table" className="bg-white dark:bg-[#1a1c23] rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/50">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">Recent Transactions</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-[#0f111a]/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-bold">Transaction ID</th>
                                <th className="p-4 font-bold">Date</th>
                                <th className="p-4 font-bold">Type</th>
                                <th className="p-4 font-bold">Method</th>
                                <th className="p-4 font-bold text-right">Amount</th>
                                <th className="p-4 font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                            {paginatedTransactions.map((txn) => (
                                <tr key={txn.id} className="hover:bg-slate-50 dark:hover:bg-[#0f111a]/50 transition-colors">
                                    <td className="p-4 font-mono text-xs font-bold text-slate-900 dark:text-white">{txn.id}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300">{txn.date}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {txn.type === 'Refund' ? <ArrowDownRight className="w-4 h-4 text-orange-500" /> : <ArrowUpRight className="w-4 h-4 text-green-500" />}
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{txn.type}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-slate-400" /> {txn.method}
                                    </td>
                                    <td className={`p-4 text-right font-black ${txn.type === 'Refund' ? 'text-orange-500' : 'text-slate-900 dark:text-white'}`}>
                                        {txn.type === 'Refund' ? '-' : '+'}₹{txn.amount.toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusStyle(txn.status)}`}>
                                            {txn.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Bar */}
                <div data-tour="transactions-pagination" className="p-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1a1c23]">
                    <div>Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, transactions.length)} of {transactions.length} transactions</div>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
                        >
                            Prev
                        </button>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum = currentPage <= 3 ? i + 1 : (currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i);
                            if (pageNum < 1) pageNum = i + 1;
                            if (pageNum > totalPages) return null;
                            
                            return (
                                <button 
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-1 rounded border transition-all ${currentPage === pageNum ? 'border-[#944555] bg-[#fff5f6] dark:bg-[#944555]/20 text-[#944555] dark:text-[#ff91a4] font-black' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className={`px-3 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${(currentPage === totalPages || totalPages === 0) ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminFinance;


