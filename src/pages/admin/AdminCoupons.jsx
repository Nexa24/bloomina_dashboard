import React, { useState, useEffect } from 'react';
import { Ticket, Search, Plus, Trash2, CheckCircle, Clock, X, Edit2, RefreshCw, Upload, Image as ImageIcon, Box } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';

const AdminCoupons = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [coupons, setCoupons] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const { showAlert } = useAlert();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;
    
    // New Coupon Form State
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        type: 'flat',
        title: '',
        value: 0,
        status: 'Active',
        rule_new_user_only: false,
        min_cart_value: 0,
        min_items_count: 2,
        applicable_category: 'all',
        applicable_products: '',
        selected_product_ids: [],
        banner_image: '',
        max_uses: '',
        expiry: ''
    });

    useEffect(() => {
        fetchCoupons();
        fetchProducts();
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

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('products')
            .select('id, title, price, images, category, color_configs, variants')
            .order('created_at', { ascending: false });
        if (!error && data) {
            setAvailableProducts(data);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        try {
            const fileName = `coupon_cover_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
            const { data, error } = await supabase.storage.from('product-images').upload(fileName, file);
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
            setNewCoupon(prev => ({ ...prev, banner_image: publicUrl }));
            showAlert({ title: 'Uploaded', message: 'Coupon cover image uploaded successfully!', type: 'success' });
        } catch (err) {
            console.error('Image upload error:', err);
            showAlert({ title: 'Upload Failed', message: err?.message || 'Could not upload image.', type: 'danger' });
        } finally {
            setUploadingImage(false);
        }
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
                title: coupon.title || '',
                banner_image: coupon.banner_image || coupon.image || '',
                applicable_category: coupon.applicable_category || 'all',
                applicable_products: coupon.applicable_products || '',
                min_items_count: coupon.min_items_count || 2,
                selected_product_ids: Array.isArray(coupon.selected_product_ids) ? coupon.selected_product_ids : [],
                expiry: formattedExpiry,
                max_uses: coupon.max_uses || ''
            });
        } else {
            setEditId(null);
            setNewCoupon({ 
                code: '', 
                type: 'flat', 
                title: '',
                value: 0, 
                status: 'Active', 
                rule_new_user_only: false, 
                min_cart_value: 0, 
                min_items_count: 2,
                applicable_category: 'all',
                applicable_products: '',
                selected_product_ids: [],
                banner_image: '',
                max_uses: '', 
                expiry: '' 
            });
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
            title: newCoupon.title || null,
            value: Number(newCoupon.value),
            status: newCoupon.status,
            rule_new_user_only: newCoupon.rule_new_user_only,
            min_cart_value: Number(newCoupon.min_cart_value) || 0,
            min_items_count: Number(newCoupon.min_items_count) || 1,
            applicable_category: newCoupon.applicable_category || 'all',
            applicable_products: newCoupon.applicable_products || null,
            selected_product_ids: newCoupon.selected_product_ids || [],
            banner_image: newCoupon.banner_image || null,
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
                showAlert({ title: 'Creation Failed', message: error?.message || 'Code might already exist.', type: 'danger' });
            }
        }
    };

    const filteredCoupons = coupons.filter(c => 
        (c.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.type || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
    const paginatedCoupons = filteredCoupons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Selected products for combo auto-loading preview
    const selectedComboProducts = availableProducts.filter(p => 
        (newCoupon.selected_product_ids || []).includes(p.id) ||
        (newCoupon.applicable_products || '').toLowerCase().includes(p.title?.toLowerCase() || '')
    );

    return (
        <div className="space-y-6 pb-12 animate-fade-in">
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#1a1c23] p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <Ticket className="w-6 h-6 text-[#944555]" /> Coupon & Promo Offers Manager
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-1">Configure BOGO, Combos, Percentage discounts, and specific product bundle offers.</p>
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

            {/* Coupons Table */}
            <div className="bg-white dark:bg-[#1a1c23] rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search coupon code or offer type..."
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
                                <th className="p-4 font-bold">Code / Offer Title</th>
                                <th className="p-4 font-bold text-center">Offer Type</th>
                                <th className="p-4 font-bold text-center">Value / Price</th>
                                <th className="p-4 font-bold text-center">Usage</th>
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
                                            {coupon.banner_image ? (
                                                <img src={coupon.banner_image} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center text-[#944555] font-black shrink-0">
                                                    <Ticket className="w-5 h-5" />
                                                </div>
                                            )}
                                            <div>
                                                <span className="font-black tracking-widest text-slate-900 dark:text-white block uppercase">{coupon.code}</span>
                                                {coupon.title && <span className="text-xs text-slate-500 font-bold block">{coupon.title}</span>}
                                                {coupon.rule_new_user_only && <span className="text-[10px] text-blue-500 font-bold uppercase">New Users Only</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#944555]/10 text-[#944555] border border-[#944555]/20">
                                            {coupon.type === 'bogo' ? 'BUY 1 GET 1 FREE' : coupon.type === 'buy2get1' ? 'BUY 2 GET 1 FREE' : coupon.type === 'combo' ? 'COMBO DEAL' : coupon.type === 'percent' ? 'PERCENTAGE' : coupon.type === 'freeship' ? 'FREE SHIPPING' : 'FIXED DISCOUNT'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="font-black text-slate-900 dark:text-white text-base">
                                            {coupon.type === 'freeship' ? 'FREE' : coupon.type === 'percent' ? `${coupon.value}%` : `₹${coupon.value}`}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center text-xs font-bold text-slate-500">
                                        {coupon.uses || 0} / {coupon.max_uses ? coupon.max_uses : '∞'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${coupon.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {coupon.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleOpenModal(coupon)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(coupon.id)} className="p-2 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create / Edit Coupon Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#1a1c23] rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-in">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-[#0f111a]/50">
                            <div>
                                <span className="text-[10px] font-black text-[#944555] uppercase tracking-widest bg-[#944555]/10 px-2.5 py-1 rounded-md">Offer Configurator</span>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1">
                                    {editId ? 'Edit Coupon Offer' : 'Create New Offer / Combo'}
                                </h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <form onSubmit={handleCreateCoupon} className="p-6">
                            <div className="max-h-[72vh] overflow-y-auto pr-2 space-y-5 text-slate-700 dark:text-slate-300 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                                
                                {/* Basic Coupon Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Coupon Code *</label>
                                        <input required type="text" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} className="w-full p-3 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#944555] uppercase font-black text-slate-900 dark:text-white tracking-wider" placeholder="e.g. BOGO2026" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                        <select value={newCoupon.status} onChange={e => setNewCoupon({...newCoupon, status: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white font-bold">
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Offer Type *</label>
                                    <select value={newCoupon.type} onChange={e => setNewCoupon({...newCoupon, type: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white font-black text-sm">
                                        <option value="flat">Fixed Amount Discount (₹)</option>
                                        <option value="percent">Percentage Discount (%)</option>
                                        <option value="bogo">Buy 1 Get 1 Free (BOGO)</option>
                                        <option value="buy2get1">Buy 2 Get 1 Free</option>
                                        <option value="combo">Combo Offer (Fixed Price Bundle)</option>
                                        <option value="quantity_discount">Multi-Quantity Bundle Discount</option>
                                        <option value="freeship">Free Shipping</option>
                                    </select>
                                </div>

                                {/* Header Title (Optional for Combos) */}
                                {newCoupon.type === 'combo' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Combo Header Title</label>
                                        <input type="text" value={newCoupon.title || ''} onChange={e => setNewCoupon({...newCoupon, title: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white font-black" placeholder="e.g. Daily Bra & Panty Combo Set" />
                                    </div>
                                )}

                                {/* DYNAMIC SECTIONS BASED ON TYPE */}
                                <div className="p-4 bg-slate-50/80 dark:bg-[#0f111a]/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                                    {(newCoupon.type === 'flat' || newCoupon.type === 'percent' || newCoupon.type === 'quantity_discount') && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                    {newCoupon.type === 'percent' ? 'Discount Percentage (%)' : 'Discount Value (₹)'}
                                                </label>
                                                <input type="number" min="0" value={newCoupon.value} onChange={e => setNewCoupon({...newCoupon, value: e.target.value})} className="w-full p-3 bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white font-bold" placeholder="0" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Min. Cart Value (₹)</label>
                                                <input type="number" min="0" value={newCoupon.min_cart_value} onChange={e => setNewCoupon({...newCoupon, min_cart_value: e.target.value})} className="w-full p-3 bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white" placeholder="0 = None" />
                                            </div>
                                        </div>
                                    )}

                                    {newCoupon.type === 'combo' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Combo Bundle Price (₹) *</label>
                                                    <input required type="number" min="0" value={newCoupon.value} onChange={e => setNewCoupon({...newCoupon, value: e.target.value})} className="w-full p-3 bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white font-black text-lg" placeholder="e.g. 599" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Required Items Count</label>
                                                    <input type="number" min="1" value={newCoupon.min_items_count || 2} onChange={e => setNewCoupon({...newCoupon, min_items_count: Number(e.target.value)})} className="w-full p-3 bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white font-bold" placeholder="2" />
                                                </div>
                                            </div>

                                            {/* Select Products for Combo (Auto-loads all details & photos) */}
                                            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                                <label className="block text-xs font-bold text-slate-500 uppercase">
                                                    Select Products for Combo <span className="text-[#944555] lowercase">(images & specs auto-load from selected items)</span>
                                                </label>
                                                
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input 
                                                        type="text" 
                                                        placeholder="Search product to add to combo..." 
                                                        value={productSearch}
                                                        onChange={e => setProductSearch(e.target.value)}
                                                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none dark:text-white"
                                                    />
                                                </div>

                                                {/* Search Results Dropdown */}
                                                {productSearch.trim() && (
                                                    <div className="max-h-36 overflow-y-auto bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 shadow-lg">
                                                        {availableProducts.filter(p => p.title?.toLowerCase().includes(productSearch.toLowerCase())).map(prod => {
                                                            const isSelected = (newCoupon.selected_product_ids || []).includes(prod.id);
                                                            return (
                                                                <div 
                                                                    key={prod.id}
                                                                    onClick={() => {
                                                                        const prevIds = newCoupon.selected_product_ids || [];
                                                                        const nextIds = isSelected ? prevIds.filter(id => id !== prod.id) : [...prevIds, prod.id];
                                                                        const nextTitles = availableProducts.filter(p => nextIds.includes(p.id)).map(p => p.title).join(', ');
                                                                        setNewCoupon({
                                                                            ...newCoupon,
                                                                            selected_product_ids: nextIds,
                                                                            applicable_products: nextTitles,
                                                                            banner_image: newCoupon.banner_image || prod.images?.[0] || ''
                                                                        });
                                                                    }}
                                                                    className={`p-2.5 flex items-center justify-between cursor-pointer text-xs font-bold transition-colors ${isSelected ? 'bg-pink-50 dark:bg-pink-900/20 text-[#944555]' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'}`}
                                                                >
                                                                    <div className="flex items-center gap-2 truncate">
                                                                        <img src={prod.images?.[0] || ''} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                                                                        <span className="truncate">{prod.title} (₹{prod.price})</span>
                                                                    </div>
                                                                    <span className="text-[10px] uppercase font-black">{isSelected ? '✓ Added' : '+ Add'}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Auto-Loaded Selected Products Preview Cards */}
                                                {selectedComboProducts.length > 0 && (
                                                    <div className="space-y-2 mt-2">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">Auto-Loaded Products in Combo:</span>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {selectedComboProducts.map(p => (
                                                                <div key={p.id} className="p-2.5 bg-white dark:bg-[#15171e] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                                                                    <img src={p.images?.[0] || ''} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border" />
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-xs font-black text-slate-800 dark:text-white truncate">{p.title}</p>
                                                                        <p className="text-[10px] font-bold text-[#944555]">Original: ₹{p.price}</p>
                                                                    </div>
                                                                    <button type="button" onClick={() => {
                                                                        const nextIds = (newCoupon.selected_product_ids || []).filter(id => id !== p.id);
                                                                        setNewCoupon({...newCoupon, selected_product_ids: nextIds});
                                                                    }} className="text-slate-400 hover:text-red-500 p-1"><X className="w-3.5 h-3.5" /></button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {newCoupon.type === 'bogo' && (
                                        <div className="space-y-2">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Min. Items Count for BOGO</label>
                                                <input type="number" min="2" value={newCoupon.min_items_count || 2} onChange={e => setNewCoupon({...newCoupon, min_items_count: Number(e.target.value)})} className="w-full p-3 bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white font-bold" placeholder="2" />
                                            </div>
                                            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/50">
                                                🎁 BOGO Offer: Every 2nd item of equal or lower price will automatically be 100% FREE.
                                            </p>
                                        </div>
                                    )}

                                    {newCoupon.type === 'buy2get1' && (
                                        <div className="space-y-2">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Min. Items Count Required</label>
                                                <input type="number" min="3" value={newCoupon.min_items_count || 3} onChange={e => setNewCoupon({...newCoupon, min_items_count: Number(e.target.value)})} className="w-full p-3 bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white font-bold" placeholder="3" />
                                            </div>
                                            <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 p-2.5 rounded-xl border border-purple-200/60 dark:border-purple-800/50">
                                                🎉 Buy 2 Get 1 Free: 1 item out of every 3 items in cart will automatically be 100% FREE.
                                            </p>
                                        </div>
                                    )}

                                    {/* Applicable Category & Specific Products Filters */}
                                    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Applicable Category Filter</label>
                                            <select value={newCoupon.applicable_category || 'all'} onChange={e => setNewCoupon({...newCoupon, applicable_category: e.target.value})} className="w-full p-3 bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white font-bold">
                                                <option value="all">All Categories</option>
                                                <option value="bras">Bras Only</option>
                                                <option value="panties">Panties Only</option>
                                                <option value="maternity">Maternity Only</option>
                                                <option value="nightwear">Lounge & Nightwear</option>
                                                <option value="bestsellers">Bestsellers Only</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Banner / Cover Image Upload */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Coupon Cover / Banner Image</label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="text" 
                                            placeholder="Image URL or upload banner photo below..."
                                            value={newCoupon.banner_image || ''} 
                                            onChange={e => setNewCoupon({...newCoupon, banner_image: e.target.value})}
                                            className="flex-1 p-3 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-xs font-medium text-slate-900 dark:text-white" 
                                        />
                                        <label className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-xl font-bold text-xs cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                                            <Upload className="w-4 h-4" />
                                            <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                                        </label>
                                    </div>
                                    {newCoupon.banner_image && (
                                        <div className="mt-2 relative w-full h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-[#0f111a]">
                                            <img src={newCoupon.banner_image} alt="Cover Preview" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => setNewCoupon({...newCoupon, banner_image: ''})} className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-red-600 transition-colors">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Validity & Rules */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry Date</label>
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
                                            className="w-full p-3 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white text-xs font-bold" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Uses</label>
                                        <input type="number" min="1" value={newCoupon.max_uses} onChange={e => setNewCoupon({...newCoupon, max_uses: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white text-xs" placeholder="Blank = Unlimited" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1 pb-2">
                                    <input type="checkbox" id="new_user" checked={newCoupon.rule_new_user_only} onChange={e => setNewCoupon({...newCoupon, rule_new_user_only: e.target.checked})} className="w-4 h-4 text-[#944555] rounded border-slate-300" />
                                    <label htmlFor="new_user" className="text-sm font-bold text-slate-700 dark:text-slate-300">New Users Only</label>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-500 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#944555] hover:bg-[#7d3a47] text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-[#944555]/20">
                                    {editId ? 'Save Offer Changes' : 'Launch Offer'}
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
