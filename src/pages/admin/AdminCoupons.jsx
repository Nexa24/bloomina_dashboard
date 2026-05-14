import React, { useState, useEffect } from 'react';
import { Ticket, Search, Plus, Trash2, CheckCircle, Clock, X, Edit2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';

const AdminCoupons = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const { showAlert } = useAlert();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;
    
    // New Coupon Form State
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        type: 'flat',
        value: 0,
        status: 'Active',
        rule_new_user_only: false,
        min_cart_value: 0,
        max_uses: '',
        expiry: ''
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (!error && data) {
            setCoupons(data);
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        showAlert({
            title: 'Delete Coupon?',
            message: 'Are you sure you want to permanently delete this coupon code? This action cannot be undone.',
            type: 'warning',
            confirmText: 'Delete Permanently',
            onConfirm: async () => {
                const { error } = await supabase.from('coupons').delete().eq('id', id);
                if (!error) {
                    setCoupons(prev => prev.filter(c => c.id !== id));
                    showAlert({ title: 'Deleted', message: 'Coupon has been removed.', type: 'success' });
                } else {
                    showAlert({ title: 'Error', message: error.message, type: 'danger' });
                }
            }
        });
    };

    const handleOpenModal = (coupon = null) => {
        if (coupon) {
            setEditId(coupon.id);
            let formattedExpiry = '';
            if (coupon.expiry) {
                const dateObj = new Date(coupon.expiry);
                const d = String(dateObj.getDate()).padStart(2, '0');
                const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                const y = dateObj.getFullYear();
                formattedExpiry = `${d}/${m}/${y}`;
            }
            setNewCoupon({
                ...coupon,
                expiry: formattedExpiry,
                max_uses: coupon.max_uses || ''
            });
        } else {
            setEditId(null);
            setNewCoupon({ code: '', type: 'flat', value: 0, status: 'Active', rule_new_user_only: false, min_cart_value: 0, max_uses: '', expiry: '' });
        }
        setIsModalOpen(true);
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        
        let parsedExpiry = null;
        if (newCoupon.expiry) {
            const parts = newCoupon.expiry.split('/');
            if (parts.length === 3) {
                const [d, m, y] = parts;
                parsedExpiry = new Date(y, m - 1, d, 23, 59, 59).toISOString();
            }
        }

        const payload = {
            code: newCoupon.code.toUpperCase(),
            type: newCoupon.type,
            value: Number(newCoupon.value),
            status: newCoupon.status,
            rule_new_user_only: newCoupon.rule_new_user_only,
            min_cart_value: Number(newCoupon.min_cart_value) || 0,
            max_uses: newCoupon.max_uses ? Number(newCoupon.max_uses) : null,
            expiry: parsedExpiry,
        };

        if (editId) {
            const { data, error } = await supabase.from('coupons').update(payload).eq('id', editId).select();
            if (!error && data) {
                setCoupons(prev => prev.map(c => c.id === editId ? data[0] : c));
                setIsModalOpen(false);
                showAlert({ title: 'Updated', message: 'Coupon successfully updated with premium precision.', type: 'success' });
            } else {
                console.error("Supabase Error:", error);
                showAlert({ title: 'Update Failed', message: error?.message || 'Check for unique code constraint violation.', type: 'danger' });
            }
        } else {
            const { data, error } = await supabase.from('coupons').insert([payload]).select();
            if (!error && data) {
                setCoupons([data[0], ...coupons]);
                setIsModalOpen(false);
                showAlert({ title: 'Created', message: 'New coupon launched successfully.', type: 'success' });
            } else {
                console.error("Supabase Error:", error);
                showAlert({ title: 'Creation Failed', message: error?.message || 'Check for unique code constraint violation.', type: 'danger' });
            }
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const filteredCoupons = coupons.filter(c => c.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCoupons = filteredCoupons.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Coupon Codes</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Create and manage discount codes for your customers</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchCoupons}
                        disabled={loading}
                        className="bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-[#944555] hover:bg-[#7d3a47] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-md shadow-[#944555]/20 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Create Coupon
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1a1c23] rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-[#944555] text-slate-900 dark:text-white transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-[#0f111a]/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-bold">Code / Rule</th>
                                <th className="p-4 font-bold text-center">Discount Value</th>
                                <th className="p-4 font-bold text-center">Usage</th>
                                <th className="p-4 font-bold text-center">Expiry</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading coupons...</td></tr>
                            ) : paginatedCoupons.length === 0 ? (
                                <tr><td colSpan="6" className="p-12 text-center text-slate-500 font-medium">No coupons found matching your search.</td></tr>
                            ) : paginatedCoupons.map((coupon) => (
                                <tr key={coupon.id} className="hover:bg-slate-50 dark:hover:bg-[#0f111a]/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
                                                <Ticket className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="font-black tracking-widest text-slate-900 dark:text-white block">{coupon.code}</span>
                                                {coupon.rule_new_user_only && <span className="text-[10px] text-blue-500 font-bold uppercase">New Users Only</span>}
                                                {coupon.min_cart_value > 0 && <span className="text-[10px] text-slate-500 block">Min. Cart: ₹{coupon.min_cart_value}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                            {coupon.type === 'freeship' ? 'FREE' : coupon.type === 'percent' ? `${coupon.value}%` : `₹${coupon.value}`}
                                        </span>
                                        <p className="text-[10px] text-slate-500 uppercase">{coupon.type}</p>
                                    </td>
                                    <td className="p-4 text-center text-slate-600 dark:text-slate-300">
                                        {coupon.uses} {coupon.max_uses ? `/ ${coupon.max_uses}` : '(Unlimited)'}
                                    </td>
                                    <td className="p-4 text-center text-slate-600 dark:text-slate-400">
                                        {coupon.expiry ? new Date(coupon.expiry).toLocaleDateString('en-GB') : 'Never'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${coupon.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                                            {coupon.status === 'Active' ? <CheckCircle className="inline w-3 h-3 mr-1" /> : null}
                                            {coupon.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => handleOpenModal(coupon)} className="p-2 text-slate-400 hover:text-[#944555] hover:bg-[#944555]/10 dark:hover:bg-[#944555]/20 rounded-lg transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(coupon.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1a1c23]">
                    <div className="font-bold">Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCoupons.length)} of {filteredCoupons.length} results</div>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
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
                                    className={`px-3 py-1 rounded-xl border transition-all ${currentPage === pageNum ? 'border-[#944555] bg-[#fff5f6] dark:bg-[#944555]/20 text-[#944555] dark:text-[#ff91a4] font-black' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className={`px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${(currentPage === totalPages || totalPages === 0) ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Create / Edit Coupon Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#1a1c23] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                {editId ? 'Edit Coupon' : 'Create New Coupon'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleCreateCoupon} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Coupon Code</label>
                                    <input required type="text" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#944555] uppercase font-bold dark:text-white" placeholder="e.g. SUMMER20" />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                    <select value={newCoupon.status} onChange={e => setNewCoupon({...newCoupon, status: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white">
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                                    <select value={newCoupon.type} onChange={e => setNewCoupon({...newCoupon, type: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white">
                                        <option value="flat">Fixed Amount (₹)</option>
                                        <option value="percent">Percentage (%)</option>
                                        <option value="freeship">Free Shipping</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Discount Value</label>
                                    <input type="number" min="0" disabled={newCoupon.type === 'freeship'} value={newCoupon.type === 'freeship' ? 0 : newCoupon.value} onChange={e => setNewCoupon({...newCoupon, value: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white disabled:opacity-50" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Min. Cart Value (₹)</label>
                                    <input type="number" min="0" value={newCoupon.min_cart_value} onChange={e => setNewCoupon({...newCoupon, min_cart_value: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white" placeholder="0 = None" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Uses</label>
                                    <input type="number" min="1" value={newCoupon.max_uses} onChange={e => setNewCoupon({...newCoupon, max_uses: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white" placeholder="Blank = Unlimited" />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry Date <span className="text-slate-400 capitalize">(Valid through end of day)</span></label>
                                    <input 
                                        type="text" 
                                        placeholder="DD/MM/YYYY"
                                        maxLength="10"
                                        value={newCoupon.expiry} 
                                        onChange={e => {
                                            let val = e.target.value.replace(/\D/g, '');
                                            if (val.length >= 2) val = val.slice(0,2) + '/' + val.slice(2);
                                            if (val.length >= 5) val = val.slice(0,5) + '/' + val.slice(5);
                                            setNewCoupon({...newCoupon, expiry: val.slice(0, 10)});
                                        }}
                                        className="w-full p-3 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white" 
                                    />
                                </div>

                                <div className="col-span-2 flex items-center gap-2 mt-2">
                                    <input type="checkbox" id="new_user" checked={newCoupon.rule_new_user_only} onChange={e => setNewCoupon({...newCoupon, rule_new_user_only: e.target.checked})} className="w-4 h-4 text-[#944555] rounded border-slate-300" />
                                    <label htmlFor="new_user" className="text-sm font-bold text-slate-700 dark:text-slate-300">New Users Only</label>
                                </div>
                            </div>
                            
                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2 rounded-xl bg-[#944555] hover:bg-[#7d3a47] text-white font-bold transition-colors shadow-md shadow-[#944555]/20">
                                    {editId ? 'Save Changes' : 'Create Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCoupons;


