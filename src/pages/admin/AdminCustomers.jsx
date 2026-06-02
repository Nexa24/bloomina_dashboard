import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Mail, Phone, MapPin, Star, MoreVertical, Eye, Trash2, Ban, CheckCircle2, History, TrendingUp, Wallet, X, RefreshCw, ChevronRight, ShoppingBag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';




const CustomerOrderHistory = ({ userId }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!userId) return;
            setLoading(true);
            const { data } = await supabase
                .from('orders')
                .select('id, total, status, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);
            setOrders(data || []);
            setLoading(false);
        };
        fetchOrders();
    }, [userId]);

    if (loading) return <div className="animate-pulse space-y-2"><div className="h-10 bg-slate-50 dark:bg-slate-800 rounded-xl w-full"></div></div>;
    if (orders.length === 0) return <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">No order history found for this user.</p>;

    return (
        <div className="space-y-2">
            {orders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">₹{order.total}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md ${
                        order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 
                        order.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' : 
                        'bg-blue-100 text-blue-700'
                    }`}>
                        {order.status}
                    </span>
                </div>
            ))}
        </div>
    );
};

const AdminCustomers = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [dbError, setDbError] = useState(false);

    // Filter states
    const [statusFilter, setStatusFilter] = useState('all'); // all | active | blocked
    const { showAlert } = useAlert();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .neq('role', 'admin')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching customers:", error);
                if (error.code === 'PGRST116' || error.message.includes('relation "public.profiles" does not exist')) {
                    setDbError(true);
                }
                setCustomers([]);
            } else {
                setCustomers(data || []);
                setDbError(false);
                setLastUpdated(new Date());
            }
        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    };

    const handleAction = async (customerId, action, value) => {
        try {
            let updateData = {};
            if (action === 'status') updateData = { status: value };

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', customerId);

            if (error) throw error;

            setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...updateData } : c));
            if (selectedCustomer?.id === customerId) {
                setSelectedCustomer(prev => ({ ...prev, ...updateData }));
            }
        } catch (err) {
            showAlert({ title: 'Action Failed', message: err.message, type: 'danger' });
        }
    };

    const deleteCustomer = async (id) => {
        showAlert({
            title: 'Delete Customer?',
            message: 'Are you sure you want to delete this customer record? This will not delete the Auth user, only the profile metadata.',
            type: 'warning',
            confirmText: 'Confirm Delete',
            onConfirm: async () => {
                try {
                    const { error } = await supabase.from('profiles').delete().eq('id', id);
                    if (error) throw error;
                    setCustomers(prev => prev.filter(c => c.id !== id));
                    setIsDetailsOpen(false);
                    showAlert({ title: 'Success', message: 'Customer record deleted.', type: 'success' });
                } catch (err) {
                    showAlert({ title: 'Delete Failed', message: err.message, type: 'danger' });
                }
            }
        });
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = 
            (c.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (c.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (c.phone?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || (statusFilter === 'blocked' ? c.status === 'blocked' : c.status !== 'blocked');
        
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

    const stats = {
        total: customers.length,
        active: customers.filter(c => c.status !== 'blocked').length,
        new: customers.filter(c => {
            if (!c.created_at) return false;
            const joinDate = new Date(c.created_at);
            const now = new Date();
            return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
        }).length
    };

    if (dbError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center">
                    < Ban className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Profile Table Missing</h2>
                <p className="text-slate-500 max-w-md">The 'profiles' table was not found in your Supabase database. This table is required to manage customer metadata and account status.</p>
                <div className="flex gap-4">
                    <button 
                        onClick={() => window.open('https://app.supabase.com', '_blank')}
                        className="bg-[#944555] text-white px-6 py-2 rounded-xl font-bold shadow-lg"
                    >
                        Check Supabase
                    </button>
                    <button 
                        onClick={() => setDbError(false)}
                        className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-6 py-2 rounded-xl font-bold"
                    >
                        Bypass Error
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in relative pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div data-tour="customers-header">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Customer Management</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor user activity and manage profiles</p>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>
                <button 
                    data-tour="refresh-customers-btn"
                    onClick={fetchCustomers}
                    disabled={isLoading}
                    className="bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:border-[#944555] text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 active:scale-95 group"
                >
                    <RefreshCw className={`w-4 h-4 text-[#944555] ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} /> 
                    <span>Refresh List</span>
                </button>
            </div>

            {/* Quick Stats */}
            <div data-tour="customers-stats-grid" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { title: 'Total Customers', value: stats.total, icon: Users, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-500/10' },
                    { title: 'Active (Standard)', value: stats.active, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/10' },
                    { title: 'Joined This Month', value: stats.new, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-[#1a1c23] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.title}</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{isLoading ? '...' : stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Customer List Container */}
            <div data-tour="customers-table" className="bg-white dark:bg-[#1a1c23] rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div data-tour="customers-search-input" className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search name, code, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-[#944555] dark:focus:border-[#944555] text-slate-900 dark:text-white transition-colors shadow-inner"
                        />
                    </div>
                    <div data-tour="customers-status-filters" className="flex gap-2">
                        {['all', 'active', 'blocked'].map(f => (
                            <button 
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${statusFilter === f ? 'bg-[#944555] text-white shadow-md shadow-[#944555]/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-[#0f111a]/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                                <th className="p-4">Customer identity</th>
                                <th className="p-4">Account Type</th>
                                <th className="p-4 text-center">Join Date</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="p-4"><div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center">
                                        <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-500 font-bold">No customers found matching your criteria</p>
                                    </td>
                                </tr>
                            ) : paginatedCustomers.map((customer) => (
                                <tr key={customer.id} className="group hover:bg-slate-50 dark:hover:bg-[#0f111a]/50 transition-all cursor-pointer" onClick={() => { setSelectedCustomer(customer); setIsDetailsOpen(true); }}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {customer.avatar_url ? (
                                                <img src={customer.avatar_url} alt="" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-[#fff5f6] dark:bg-[#944555]/10 border border-[#944555]/10 dark:border-[#944555]/20 flex items-center justify-center font-black text-[#944555] shrink-0">
                                                    {(customer.full_name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <span className="font-bold text-slate-900 dark:text-white group-hover:text-[#944555] transition-colors">{customer.full_name || 'Anonymous User'}</span>
                                                <p className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                                                    <span className="text-slate-400">CUSTOMER</span>
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-[#944555]">
                                            <span className="font-bold">Standard Account</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="inline-flex flex-col items-center">
                                            <span className="font-black text-slate-700 dark:text-slate-200">{new Date(customer.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md ${customer.status === 'blocked' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                                            {customer.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button className="p-2 text-slate-400 hover:text-[#944555] hover:bg-[#944555]/10 rounded-lg transition-colors">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Customer Details Side Panel */}
            {isDetailsOpen && selectedCustomer && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsDetailsOpen(false)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1c23] h-full shadow-2xl flex flex-col border-l border-white/20 dark:border-slate-800 animate-slide-left overflow-y-auto">
                        
                        {/* Panel Header */}
                        <div className="p-8 pb-4 relative">
                            <button onClick={() => setIsDetailsOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                            
                            <div className="flex items-center gap-5 mt-4">
                                <div className="w-24 h-24 rounded-3xl bg-[#944555]/10 border-4 border-white dark:border-slate-800 shadow-xl flex items-center justify-center font-black text-4xl text-[#944555]">
                                    {(selectedCustomer.full_name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white truncate">{selectedCustomer.full_name || 'Anonymous User'}</h2>
                                    <p className="text-slate-500 font-bold mb-2">Customer since {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                                    <div className="flex gap-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${selectedCustomer.status === 'blocked' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {selectedCustomer.status || 'Active'}
                                        </span>
                                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[10px] font-black uppercase">
                                            ID: {String(selectedCustomer.id).slice(0, 8)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-8 flex-1">
                            
                            {/* Referral Stats Grid */}
                             <div className="grid grid-cols-1 gap-4">
                                <div className="bg-emerald-50/50 dark:bg-emerald-500/5 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        <p className="text-xs font-bold text-slate-500 uppercase">Verification Status</p>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">Verified Profile</span>
                                    </div>
                                </div>
                            </div>

                            {/* Details List */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-slate-400" /> Identity & Connection
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between p-4 bg-white dark:bg-[#1a1c23] rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm text-slate-600 dark:text-slate-400">Email Address</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{selectedCustomer.email}</span>
                                    </div>
                                    <div className="flex justify-between p-4 bg-white dark:bg-[#1a1c23] rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm text-slate-600 dark:text-slate-400">Phone Number</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedCustomer.phone || 'NOT PROVIDED'}</span>
                                    </div>
                                </div>
                            </div>




                             {/* Section: Recent Orders */}
                             <div className="space-y-4">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-slate-400" /> Recent Purchase Activity
                                </h3>
                                <div className="space-y-2">
                                    <CustomerOrderHistory userId={selectedCustomer.id} />
                                </div>
                            </div>

                            {/* Section: Management Actions */}
                            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4 text-center">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Account Control</h3>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    <button 
                                        onClick={() => handleAction(selectedCustomer.id, 'status', selectedCustomer.status === 'blocked' ? 'active' : 'blocked')}
                                        className={`flex-1 min-w-[140px] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                            selectedCustomer.status === 'blocked' 
                                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                            : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                        }`}
                                    >
                                        <Ban className="w-4 h-4" />
                                        {selectedCustomer.status === 'blocked' ? 'Unblock Account' : 'Block Account'}
                                    </button>
                                    <button 
                                        onClick={() => deleteCustomer(selectedCustomer.id)}
                                        className="flex-1 min-w-[140px] py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Remove Record
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto italic leading-normal">Blocking an account prevents the user from placing new orders while allowing them to browse.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCustomers;
