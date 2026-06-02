import React, { useState, useEffect } from 'react';
import { Boxes, Search, AlertTriangle, Edit2, Check, X, RefreshCw, PackageX } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';

const LOW_STOCK_THRESHOLD = 10;

const AdminInventory = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editStock, setEditStock] = useState('');
    const [saving, setSaving] = useState(false);
    const { showAlert } = useAlert();
    const [filter, setFilter] = useState('all'); // all | low | out
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const showToast = (message, type = 'success') => {
        showAlert({
            title: type === 'error' ? 'Validation Error' : 'Success',
            message: message,
            type: type === 'error' ? 'danger' : 'success',
            showCancel: false,
            confirmText: 'OK'
        });
    };

    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchInventory = async (page = 1) => {
        setLoading(true);
        try {
            const from = (page - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            let query = supabase
                .from('products')
                .select('id, name, sku, categories, stock, trackQuantity, status, images', { count: 'exact' })
                .eq('trackQuantity', true);

            if (debouncedSearch) {
                query = query.or(`name.ilike.%${debouncedSearch}%,sku.ilike.%${debouncedSearch}%`);
            }

            if (filter === 'low') {
                query = query.gt('stock', 0).lte('stock', LOW_STOCK_THRESHOLD);
            } else if (filter === 'out') {
                query = query.lte('stock', 0);
            }

            const { data, count, error } = await query
                .order('stock', { ascending: true })
                .range(from, to);

            if (error) {
                showAlert({ title: 'Fetch Failed', message: error.message, type: 'danger' });
            } else {
                setProducts(data || []);
                setTotalCount(count || 0);
            }
            setLastUpdated(new Date());
        } catch (err) {
            console.error(err);
            showAlert({ title: 'Error', message: 'Failed to connect to database.', type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    useEffect(() => {
        fetchInventory(currentPage);
    }, [currentPage, debouncedSearch, filter]);

    const getStatus = (stock) => {
        if (stock <= 0) return 'Out of Stock';
        if (stock <= LOW_STOCK_THRESHOLD) return 'Low Stock';
        return 'In Stock';
    };

    const getStatusStyle = (stock) => {
        if (stock <= 0) return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
        if (stock <= LOW_STOCK_THRESHOLD) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400';
        return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
    };

    const handleEditStart = (product) => {
        setEditingId(product.id);
        setEditStock(String(product.stock ?? 0));
    };

    const handleSaveStock = async (productId) => {
        const newStock = parseInt(editStock);
        if (isNaN(newStock) || newStock < 0) {
            showToast('Please enter a valid stock number.', 'error');
            return;
        }
        setSaving(true);
        const { error } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', productId);

        if (error) {
            showAlert({ title: 'Update Failed', message: error.message, type: 'danger' });
        } else {
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
            showAlert({ title: 'Stock Updated', message: 'The new stock level has been saved.', type: 'success', showCancel: false });
            setEditingId(null);
        }
        setSaving(false);
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    // We already fetch only the current page's products
    const paginatedProducts = products;

    // These counts should ideally be separate totals if we're truly server-side
    // But for the stats bar, we'll keep them as they were if they represent the WHOLE inventory
    // To be perfectly accurate, we might need a separate simple count for these 3 stats
    const [stats, setStats] = useState({ total: 0, low: 0, out: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            const { count: total } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('trackQuantity', true);
            const { count: low } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('trackQuantity', true).gt('stock', 0).lte('stock', LOW_STOCK_THRESHOLD);
            const { count: out } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('trackQuantity', true).lte('stock', 0);
            setStats({ total: total || 0, low: low || 0, out: out || 0 });
        };
        fetchStats();
    }, [products]); // Update stats when products change (e.g. after update)

    return (
        <div className="space-y-6 animate-fade-in relative pb-12">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div data-tour="inventory-header">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Inventory Status</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Live stock levels from your production database</p>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Sync: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>
                <button
                    data-tour="refresh-stock-btn"
                    onClick={() => fetchInventory(currentPage)}
                    disabled={loading}
                    className="bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:border-[#944555] text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 active:scale-95 group"
                >
                    <RefreshCw className={`w-4 h-4 text-[#944555] ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    <span>Refresh Stock</span>
                </button>
            </div>

            {/* Stats */}
            <div data-tour="inventory-stats" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { title: 'Tracked Products', value: stats.total, icon: Boxes, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/10', filterKey: 'all' },
                    { title: 'Low Stock', value: stats.low, icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-500/10', filterKey: 'low' },
                    { title: 'Out of Stock', value: stats.out, icon: PackageX, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/10', filterKey: 'out' },
                ].map((stat) => (
                    <button
                        key={stat.filterKey}
                        onClick={() => setFilter(f => f === stat.filterKey ? 'all' : stat.filterKey)}
                        className={`bg-white dark:bg-[#1a1c23] p-6 rounded-2xl border shadow-sm flex items-center gap-4 transition-all text-left w-full ${filter === stat.filterKey ? 'border-[#944555] ring-2 ring-[#944555]/20' : 'border-slate-100 dark:border-slate-800/50 hover:border-[#944555]/40'}`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-500">{stat.title}</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{loading ? '...' : stat.value}</h3>
                        </div>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div data-tour="inventory-table" className="bg-white dark:bg-[#1a1c23] rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div data-tour="inventory-search-input" className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by product name, SKU, or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-[#944555] dark:focus:border-[#944555] text-slate-900 dark:text-white transition-colors"
                        />
                    </div>
                    <div data-tour="inventory-filter-tabs" className="flex gap-2 text-xs font-bold">
                        {['all', 'low', 'out'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${filter === f ? 'bg-[#944555] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                            >
                                {f === 'all' ? 'All' : f === 'low' ? `⚠️ Low Stock` : `🚫 Out of Stock`}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-24 text-slate-400">
                        <RefreshCw className="w-8 h-8 animate-spin mr-3" />
                        <span className="font-bold text-lg">Loading inventory...</span>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-24 text-slate-400">
                        <PackageX className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-bold text-lg">No products found</p>
                        <p className="text-sm mt-1">Make sure products have "Track Quantity" enabled in the Products page.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-[#0f111a]/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-bold">Product</th>
                                    <th className="p-4 font-bold">SKU</th>
                                    <th className="p-4 font-bold">Category</th>
                                    <th className="p-4 font-bold text-right">Stock</th>
                                    <th className="p-4 font-bold">Status</th>
                                    <th className="p-4 font-bold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                                {paginatedProducts.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#0f111a]/50 transition-colors">
                                        {/* Product */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {item.images?.[0] ? (
                                                    <img src={item.images[0]} alt={item.name} className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                        <Boxes className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                )}
                                                <span className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</span>
                                            </div>
                                        </td>

                                        {/* SKU */}
                                        <td className="p-4 text-slate-500 font-mono text-xs">{item.sku || '—'}</td>

                                        {/* Category */}
                                        <td className="p-4 text-slate-600 dark:text-slate-300 capitalize">
                                            {Array.isArray(item.categories) ? item.categories.join(', ') : (item.categories || '—')}
                                        </td>

                                        {/* Stock (inline editable) */}
                                        <td className="p-4 text-right">
                                            {editingId === item.id ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={editStock}
                                                    onChange={(e) => setEditStock(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveStock(item.id);
                                                        if (e.key === 'Escape') setEditingId(null);
                                                    }}
                                                    autoFocus
                                                    className="w-20 text-right bg-white dark:bg-[#0f111a] border-2 border-[#944555] rounded-lg px-2 py-1 font-black text-slate-900 dark:text-white text-sm focus:outline-none"
                                                />
                                            ) : (
                                                <span className={`font-black text-lg ${item.stock <= 0 ? 'text-red-500' : item.stock <= LOW_STOCK_THRESHOLD ? 'text-yellow-500' : 'text-slate-900 dark:text-white'}`}>
                                                    {item.stock ?? 0}
                                                </span>
                                            )}
                                        </td>

                                        {/* Status badge */}
                                        <td className="p-4">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusStyle(item.stock)}`}>
                                                {getStatus(item.stock)}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {editingId === item.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleSaveStock(item.id)}
                                                            disabled={saving}
                                                            className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                                                            title="Save"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Cancel"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditStart(item)}
                                                        className="p-2 text-slate-400 hover:text-[#944555] hover:bg-[#944555]/10 rounded-lg transition-colors"
                                                        title="Edit Stock"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* Pagination */}
                {totalCount > 0 && !loading && (
                    <div data-tour="inventory-pagination" className="p-4 border-t border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-[#1a1c23] gap-4">
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalCount)} of {totalCount} results
                        </div>
                        <div className="flex gap-1.5">
                            <button 
                                onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                disabled={currentPage === 1 || loading}
                                className={`px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-sm ${currentPage === 1 || loading ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
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
                                        onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        disabled={loading}
                                        className={`px-3.5 py-1.5 rounded-xl border transition-all text-sm font-black ${currentPage === pageNum ? 'border-[#944555] bg-[#fff5f6] dark:bg-[#944555]/20 text-[#944555] dark:text-[#ff91a4]' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button 
                                onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                disabled={currentPage === totalPages || totalPages === 0 || loading}
                                className={`px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-sm ${currentPage === totalPages || totalPages === 0 || loading ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminInventory;


