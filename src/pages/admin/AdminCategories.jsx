import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Plus, Edit2, Trash2, Search, Loader2, Image as ImageIcon,
    Upload, X, CheckCircle, AlertCircle, Settings2, RefreshCw,
    Tag, Globe, ChevronDown
} from 'lucide-react';
import { useAlert } from '../../contexts/AlertContext';

const INITIAL_FORM_STATE = {
    name: '',
    slug: '',
    image: '',
    display_on_home: true,
    sort_order: 0,
    category_type: 'category',   // 'category' | 'subcategory' | 'universal'
    parent_id: ''
};

const TYPE_CONFIG = {
    category: {
        label: 'Category',
        description: 'Main product type (e.g. Bra, Panties, Tops)',
        color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
        icon: Tag
    },
    subcategory: {
        label: 'Sub-Category',
        description: 'Variant within a category (e.g. Padded, Strapped, Wireless)',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
        icon: ChevronDown
    },
    universal: {
        label: 'Universal Tag',
        description: 'Cross-cutting label applied across products (e.g. Sale, Innerwear)',
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
        icon: Globe
    }
};

// Standard hierarchy to seed on Quick Sync
const STANDARD_HIERARCHY = [
    // Universal tags
    { name: 'Sale', slug: 'sale', category_type: 'universal', display_on_home: true },
    { name: 'Innerwear', slug: 'innerwear', category_type: 'universal', display_on_home: true },
    { name: 'Bestsellers', slug: 'bestsellers', category_type: 'universal', display_on_home: true },
    { name: 'New Arrivals', slug: 'new-arrivals', category_type: 'universal', display_on_home: true },
    { name: 'Featured', slug: 'featured', category_type: 'universal', display_on_home: false },
    // Main categories
    { name: 'Bras', slug: 'bras', category_type: 'category', display_on_home: true },
    { name: 'Panties', slug: 'panties', category_type: 'category', display_on_home: true },
    { name: 'Nightwear', slug: 'nightwear', category_type: 'category', display_on_home: true },
    { name: 'Combo Packs', slug: 'combo-packs', category_type: 'category', display_on_home: false },
    // Bras sub-categories (parent resolved at sync time)
    { name: 'Padded Bras', slug: 'padded-bras', category_type: 'subcategory', parentName: 'Bras' },
    { name: 'Strappy Bras', slug: 'strappy-bras', category_type: 'subcategory', parentName: 'Bras' },
    { name: 'Wireless Bras', slug: 'wireless-bras', category_type: 'subcategory', parentName: 'Bras' },
    { name: 'Underwired Bras', slug: 'underwired-bras', category_type: 'subcategory', parentName: 'Bras' },
    { name: 'Push-Up Bras', slug: 'push-up-bras', category_type: 'subcategory', parentName: 'Bras' },
    { name: 'Lace Bras', slug: 'lace-bras', category_type: 'subcategory', parentName: 'Bras' },
    { name: 'Bralettes', slug: 'bralettes', category_type: 'subcategory', parentName: 'Bras' },
    { name: 'Sports Bras', slug: 'sports-bras', category_type: 'subcategory', parentName: 'Bras' },
    { name: 'Nursing Bras', slug: 'nursing-bras', category_type: 'subcategory', parentName: 'Bras' },
    // Panties sub-categories
    { name: 'Seamless Panties', slug: 'seamless-panties', category_type: 'subcategory', parentName: 'Panties' },
    { name: 'High-Waist Panties', slug: 'high-waist-panties', category_type: 'subcategory', parentName: 'Panties' },
    { name: 'Bikini Panties', slug: 'bikini-panties', category_type: 'subcategory', parentName: 'Panties' },
    { name: 'Thongs', slug: 'thongs', category_type: 'subcategory', parentName: 'Panties' },
    { name: 'Brief Panties', slug: 'brief-panties', category_type: 'subcategory', parentName: 'Panties' },
    { name: 'Period Panties', slug: 'period-panties', category_type: 'subcategory', parentName: 'Panties' },
    // Nightwear sub-categories
    { name: 'Babydolls', slug: 'babydolls', category_type: 'subcategory', parentName: 'Nightwear' },
    { name: 'Pajama Sets', slug: 'pajama-sets', category_type: 'subcategory', parentName: 'Nightwear' },
    { name: 'Nighties', slug: 'nighties', category_type: 'subcategory', parentName: 'Nightwear' },
];

const AdminCategories = () => {
    const { showAlert } = useAlert();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'category' | 'subcategory' | 'universal'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [editingId, setEditingId] = useState(null);
    const [notification, setNotification] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => { fetchCategories(); }, []);

    const showToast = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3500);
    };

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('category_type', { ascending: true })
                .order('sort_order', { ascending: true })
                .order('name', { ascending: true });
            if (error) throw error;
            setCategories(data || []);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching categories:', error);
            showToast('Error fetching categories: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'name' && !editingId
                ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }
                : {})
        }));
    };

    const compressImage = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;
                    const maxDim = 1200;
                    if (width > height) { if (width > maxDim) { height *= maxDim / width; width = maxDim; } }
                    else { if (height > maxDim) { width *= maxDim / height; height = maxDim; } }
                    canvas.width = width; canvas.height = height;
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                    canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.85);
                };
            };
            reader.onerror = reject;
        });
    };

    const openModal = (category = null) => {
        if (category) {
            setFormData({
                name: category.name || '',
                slug: category.slug || '',
                image: category.image || '',
                display_on_home: category.display_on_home ?? true,
                sort_order: category.sort_order || 0,
                category_type: category.category_type || 'category',
                parent_id: category.parent_id || ''
            });
            setEditingId(category.id);
        } else {
            setFormData(INITIAL_FORM_STATE);
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        try {
            setUploadingImage(true);
            const compressedFile = await compressImage(file);
            const fileName = `category_${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage
                .from('product-images').upload(fileName, compressedFile);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
            setFormData(prev => ({ ...prev, image: data.publicUrl }));
            showToast('Image uploaded!', 'success');
        } catch (error) {
            showToast('Upload failed: ' + error.message, 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const finalSlug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

            if (!editingId) {
                const { data: existing } = await supabase.from('categories').select('id').eq('slug', finalSlug).single();
                if (existing) throw new Error('A category with this slug already exists.');
            }

            const payload = {
                name: formData.name,
                slug: finalSlug,
                image: formData.image || null,
                display_on_home: formData.display_on_home,
                sort_order: parseInt(formData.sort_order) || 0,
                category_type: formData.category_type,
                parent_id: formData.category_type === 'subcategory' && formData.parent_id ? formData.parent_id : null
            };

            const { error } = editingId
                ? await supabase.from('categories').update(payload).eq('id', editingId)
                : await supabase.from('categories').insert([payload]);

            if (error) {
                // Fallback for missing columns (old schema)
                if (error.code === '42703') {
                    const safe = { name: payload.name, slug: payload.slug, image: payload.image, display_on_home: payload.display_on_home, sort_order: payload.sort_order };
                    const { error: fe } = editingId
                        ? await supabase.from('categories').update(safe).eq('id', editingId)
                        : await supabase.from('categories').insert([safe]);
                    if (fe) throw fe;
                    showToast('Saved (run the SQL migration to enable hierarchy features).', 'warning');
                } else throw error;
            } else {
                showToast(editingId ? 'Changes saved!' : 'Category created!', 'success');
            }

            setIsModalOpen(false);
            setFormData(INITIAL_FORM_STATE);
            setEditingId(null);
            setIsSubmitting(false);
            await fetchCategories();
        } catch (error) {
            showToast(error.message || 'Failed to save category', 'error');
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, name) => {
        showAlert({
            title: 'Delete Category',
            message: `Delete "${name}"? Sub-categories linked to it will have their parent cleared.`,
            type: 'danger',
            confirmText: 'Yes, Delete',
            onConfirm: async () => {
                try {
                    const { error } = await supabase.from('categories').delete().eq('id', id);
                    if (error) throw error;
                    setCategories(cats => cats.filter(c => c.id !== id));
                    showToast('Deleted!', 'success');
                } catch (error) {
                    showToast('Delete failed: ' + error.message, 'error');
                }
            }
        });
    };

    const handleQuickSync = async () => {
        setLoading(true);
        try {
            // Step 1: Insert missing universals & main categories (no parent needed)
            const nonSubs = STANDARD_HIERARCHY.filter(s => s.category_type !== 'subcategory');
            const newNonSubs = nonSubs.filter(s => !categories.some(c => c.slug === s.slug));
            if (newNonSubs.length > 0) {
                const rows = newNonSubs.map(({ name, slug, category_type, display_on_home }) => ({ name, slug, category_type, display_on_home, sort_order: 0 }));
                const { error } = await supabase.from('categories').insert(rows);
                if (error && error.code !== '42703') throw error;
            }

            // Step 2: Re-fetch to get the IDs of parent categories
            const { data: allCats } = await supabase.from('categories').select('id, name, slug');
            const catBySlug = Object.fromEntries((allCats || []).map(c => [c.slug, c]));

            // Step 3: Insert missing sub-categories with parent_id resolved
            const subs = STANDARD_HIERARCHY.filter(s => s.category_type === 'subcategory');
            const newSubs = subs.filter(s => !categories.some(c => c.slug === s.slug));
            if (newSubs.length > 0) {
                const rows = newSubs.map(s => {
                    const parentSlug = s.parentName?.toLowerCase().replace(/\s+/g, '-');
                    const parent = catBySlug[parentSlug];
                    return { name: s.name, slug: s.slug, category_type: 'subcategory', display_on_home: false, sort_order: 0, parent_id: parent?.id || null };
                });
                const { error } = await supabase.from('categories').insert(rows);
                if (error && error.code !== '42703') throw error;
            }

            await fetchCategories();
            showToast(`Sync complete! Added ${newNonSubs.length + newSubs.length} categories.`, 'success');
        } catch (e) {
            showToast('Sync failed: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Group categories by type for display
    const getParentName = (parentId) => {
        const parent = categories.find(c => c.id === parentId);
        return parent ? parent.name : null;
    };

    const filtered = categories.filter(cat => {
        const matchSearch = cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) || cat.slug?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = typeFilter === 'all' || cat.category_type === typeFilter;
        return matchSearch && matchType;
    });

    const counts = {
        all: categories.length,
        category: categories.filter(c => c.category_type === 'category').length,
        subcategory: categories.filter(c => c.category_type === 'subcategory').length,
        universal: categories.filter(c => c.category_type === 'universal').length,
    };

    const parentCategories = categories.filter(c => c.category_type === 'category');

    return (
        <>
            {notification && (
                <div className="fixed top-6 right-6 z-[9999] animate-fade-in-up flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/10 font-bold text-sm bg-white/90 dark:bg-[#1a1c23]/90 backdrop-blur-md border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">
                    {notification.type === 'success'
                        ? <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0"><CheckCircle className="w-5 h-5" /></div>
                        : <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 text-red-500 flex items-center justify-center shrink-0"><AlertCircle className="w-5 h-5" /></div>}
                    <span className="max-w-xs">{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition ml-2 text-slate-400"><X className="w-4 h-4" /></button>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 data-tour="categories-header" className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Category Management</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Three-tier hierarchy: Universal → Category → Sub-Category</p>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button data-tour="categories-sync-btn" onClick={handleQuickSync} disabled={loading}
                            className="flex items-center gap-2 bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-50">
                            <Settings2 className="w-4 h-4" /> Quick Sync
                        </button>
                        <button onClick={fetchCategories} disabled={loading}
                            className="flex items-center gap-2 bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:border-[#944555] text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-50 active:scale-95 group">
                            <RefreshCw className={`w-4 h-4 text-[#944555] ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            Refresh
                        </button>
                        <button data-tour="categories-add-btn" onClick={() => openModal()}
                            className="flex items-center gap-2 bg-[#944555] hover:bg-[#7d3a47] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm shrink-0">
                            <Plus className="w-5 h-5" /> Add Category
                        </button>
                    </div>
                </div>

                {/* Type Tier Cards */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { key: 'universal', icon: Globe, color: 'amber', desc: 'Cross-cutting tags (Sale, New Arrivals)' },
                        { key: 'category', icon: Tag, color: 'violet', desc: 'Main product types (Bras, Panties)' },
                        { key: 'subcategory', icon: ChevronDown, color: 'blue', desc: 'Variants within a category (Padded, Strappy)' },
                    ].map(({ key, icon: Icon, color, desc }) => (
                        <button key={key} onClick={() => setTypeFilter(typeFilter === key ? 'all' : key)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${typeFilter === key
                                ? `border-${color}-400 bg-${color}-50 dark:bg-${color}-500/10`
                                : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-[#15171e] hover:border-slate-200 dark:hover:border-slate-700'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${color}-100 dark:bg-${color}-500/20 text-${color}-600 dark:text-${color}-400`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span className={`text-2xl font-black ${typeFilter === key ? `text-${color}-600 dark:text-${color}-400` : 'text-slate-900 dark:text-white'}`}>{counts[key]}</span>
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">{TYPE_CONFIG[key].label}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div data-tour="categories-table" className="bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '400px', maxHeight: 'calc(100vh - 320px)' }}>
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-[#1a1c23]">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" placeholder="Search by name or slug..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#944555]/50 text-sm text-slate-900 dark:text-white shadow-inner transition-all" />
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shrink-0">
                            {['all', 'universal', 'category', 'subcategory'].map(t => (
                                <button key={t} onClick={() => setTypeFilter(t)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${typeFilter === t ? 'bg-white dark:bg-[#15171e] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                                    {t === 'all' ? `All (${counts.all})` : TYPE_CONFIG[t].label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-slate-400 py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>
                        ) : filtered.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 py-16">
                                <ImageIcon className="w-12 h-12 opacity-20" />
                                <p>No categories found.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-[#15171e] sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Preview</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Name / Slug</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Type</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Parent</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Home Display</th>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {filtered.map(cat => {
                                        const typeConf = TYPE_CONFIG[cat.category_type] || TYPE_CONFIG.category;
                                        const TypeIcon = typeConf.icon;
                                        const parentName = cat.parent_id ? getParentName(cat.parent_id) : null;
                                        return (
                                            <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <td className="px-6 py-3 align-middle">
                                                    {cat.image ? (
                                                        <div className="w-16 h-12 rounded-lg overflow-hidden shadow-sm bg-stone-100">
                                                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-16 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                            <ImageIcon className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 align-middle">
                                                    <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-[#944555] transition-colors">{cat.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">/{cat.slug}</div>
                                                </td>
                                                <td className="px-4 py-3 align-middle">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${typeConf.color}`}>
                                                        <TypeIcon className="w-3 h-3" />
                                                        {typeConf.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 align-middle">
                                                    {parentName
                                                        ? <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">↳ {parentName}</span>
                                                        : <span className="text-xs text-slate-300 dark:text-slate-600">—</span>}
                                                </td>
                                                <td className="px-4 py-3 align-middle">
                                                    <button onClick={async () => {
                                                        try {
                                                            const newStatus = !cat.display_on_home;
                                                            const { error } = await supabase.from('categories').update({ display_on_home: newStatus }).eq('id', cat.id);
                                                            if (error) throw error;
                                                            setCategories(cats => cats.map(c => c.id === cat.id ? { ...c, display_on_home: newStatus } : c));
                                                        } catch (err) { showToast('Toggle failed: ' + err.message, 'error'); }
                                                    }} className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${cat.display_on_home ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                                        {cat.display_on_home ? 'Visible' : 'Hidden'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-3 align-middle text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openModal(cat)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors" title="Edit">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDelete(cat.id, cat.name)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors" title="Delete">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-[#1a1c23] rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#15171e]/50 rounded-t-3xl">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {editingId ? 'Edit Category' : 'Create Category'}
                                </h2>
                                <p className="text-xs text-slate-500 font-bold mt-0.5 uppercase tracking-widest">
                                    {TYPE_CONFIG[formData.category_type]?.description}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

                            {/* Type Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">Category Type *</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(TYPE_CONFIG).map(([key, conf]) => {
                                        const Icon = conf.icon;
                                        const isActive = formData.category_type === key;
                                        return (
                                            <button key={key} type="button" onClick={() => setFormData(prev => ({ ...prev, category_type: key, parent_id: '' }))}
                                                className={`p-3 rounded-2xl border-2 text-left transition-all ${isActive ? 'border-[#944555] bg-[#fff5f6] dark:bg-[#944555]/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${isActive ? 'bg-[#944555] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                </div>
                                                <p className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-[#944555]' : 'text-slate-600 dark:text-slate-400'}`}>{conf.label}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">Name *</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleInputChange}
                                    placeholder={formData.category_type === 'subcategory' ? 'e.g. Padded Bras' : formData.category_type === 'universal' ? 'e.g. Sale' : 'e.g. Bras'}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#944555] focus:border-transparent outline-none text-slate-900 dark:text-white font-medium" />
                            </div>

                            {/* Slug */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">URL Slug *</label>
                                <input type="text" name="slug" required value={formData.slug} onChange={handleInputChange} placeholder="e.g. padded-bras"
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#944555] focus:border-transparent outline-none text-slate-900 dark:text-white font-mono text-sm" />
                            </div>

                            {/* Parent Category — only for subcategory */}
                            {formData.category_type === 'subcategory' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">Parent Category</label>
                                    <select name="parent_id" value={formData.parent_id} onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#944555] focus:border-transparent outline-none text-slate-900 dark:text-white font-medium appearance-none cursor-pointer">
                                        <option value="">— No Parent —</option>
                                        {parentCategories.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-slate-400 mt-1">Link to the main category this sub-category belongs under.</p>
                                </div>
                            )}

                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">Category Photo (Optional)</label>
                                <div className="flex gap-3">
                                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="cat-img-upload" />
                                    <label htmlFor="cat-img-upload" className="cursor-pointer shrink-0 flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors">
                                        {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
                                    </label>
                                    <input type="url" name="image" value={formData.image} onChange={handleInputChange} placeholder="Or paste image URL..."
                                        className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#944555] focus:border-transparent outline-none text-slate-900 dark:text-white text-sm" />
                                </div>
                                {formData.image && (
                                    <div className="mt-2 flex items-center gap-3">
                                        <img src={formData.image} alt="Preview" className="w-16 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, image: '' }))} className="text-xs text-red-500 font-bold hover:underline">Remove</button>
                                    </div>
                                )}
                            </div>

                            {/* Visibility + Priority */}
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Home Page</h4>
                                        <p className="text-[10px] text-slate-500">Show as featured card</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={formData.display_on_home}
                                            onChange={e => setFormData(prev => ({ ...prev, display_on_home: e.target.checked }))} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#944555]"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Priority</h4>
                                        <p className="text-[10px] text-slate-500">Lower = appears first</p>
                                    </div>
                                    <input type="number" name="sort_order" value={formData.sort_order} onChange={handleInputChange}
                                        className="w-16 h-8 px-2 text-center text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#944555] focus:outline-none" />
                                </div>
                            </div>

                            <div className="flex gap-3 flex-row-reverse pt-2 border-t border-slate-200 dark:border-slate-800">
                                <button type="submit" disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-[#944555] hover:bg-[#7d3a47] text-white font-bold rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2">
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingId ? 'Save Changes' : 'Create Category'}
                                </button>
                                <button type="button" onClick={() => !isSubmitting && setIsModalOpen(false)} disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#15171e] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors disabled:opacity-50">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminCategories;
