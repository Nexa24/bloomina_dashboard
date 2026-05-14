import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Search, Loader2, Image as ImageIcon, Upload, X, CheckCircle, AlertCircle, Settings2, RefreshCw } from 'lucide-react';
import { useAlert } from '../../contexts/AlertContext';

// Initial form state - outside component to prevent re-creation
const INITIAL_FORM_STATE = {
    name: '',
    slug: '',
    image: '',
    display_on_home: true,
    sort_order: 0
};

const AdminCategories = () => {
    const { showAlert } = useAlert();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [editingId, setEditingId] = useState(null);
    const [notification, setNotification] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        fetchCategories();
    }, []);

    const showToast = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('created_at', { ascending: true });
            
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
            ...(name === 'name' && !editingId ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') } : {})
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
                    let width = img.width;
                    let height = img.height;
                    const maxDim = 1200;
                    if (width > height) {
                        if (width > maxDim) { height *= maxDim / width; width = maxDim; }
                    } else {
                        if (height > maxDim) { width *= maxDim / height; height = maxDim; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                    }, 'image/jpeg', 0.85);
                };
            };
            reader.onerror = error => reject(error);
        });
    };

    const openModal = (category = null) => {
        if (category) {
            setFormData({
                name: category.name || '',
                slug: category.slug || '',
                image: category.image || '',
                display_on_home: category.display_on_home ?? true,
                sort_order: category.sort_order || 0
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

            // 1. Compress
            const compressedFile = await compressImage(file);

            const fileExt = file.name.split('.').pop();
            const fileName = `category_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 2. Use the established "product-images" bucket
            let { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, compressedFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            setFormData(prev => ({
                ...prev,
                image: data.publicUrl
            }));
            showToast('Image uploaded successfully!', 'success');
        } catch (error) {
            console.error('Error uploading image:', error);
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
            
            // 1. Check for duplicate slug (if creating new)
            if (!editingId) {
                const { data: existing } = await supabase
                    .from('categories')
                    .select('id')
                    .eq('slug', finalSlug)
                    .single();
                
                if (existing) {
                    throw new Error('A category with this name or slug already exists.');
                }
            }

            const payload = {
                name: formData.name,
                slug: finalSlug,
                image: formData.image,
                display_on_home: formData.display_on_home,
                sort_order: parseInt(formData.sort_order) || 0
            };

            // 2. Attempt save
            const { error } = editingId 
                ? await supabase.from('categories').update(payload).eq('id', editingId)
                : await supabase.from('categories').insert([payload]);

            if (error) {
                console.error('Initial save error:', error);
                // Fallback if columns are missing
                if (error.message?.includes('display_on_home') || error.message?.includes('sort_order') || error.code === '42703') {
                    const safePayload = { ...payload };
                    delete safePayload.display_on_home;
                    delete safePayload.sort_order;
                    
                    const { error: fallbackError } = editingId
                        ? await supabase.from('categories').update(safePayload).eq('id', editingId)
                        : await supabase.from('categories').insert([safePayload]);
                    
                    if (fallbackError) throw fallbackError;
                    showToast('Saved (layout preferences skipped due to DB schema).', 'warning');
                } else {
                    throw error;
                }
            } else {
                showToast(editingId ? 'Changes saved!' : 'New category added!', 'success');
            }
            
            // 3. Immediate Success cleanup
            setIsModalOpen(false);
            setFormData(INITIAL_FORM_STATE);
            setEditingId(null);
            setIsSubmitting(false); // Clear submitting state early for responsiveness
            
            // 4. Background refresh
            await fetchCategories();
        } catch (error) {
            console.error('Detailed save error:', error);
            showToast(error.message || 'Failed to save category', 'error');
            setIsSubmitting(false); // Ensure cleared on error
        }
    };

    const handleDelete = async (id, name) => {
        showAlert({
            title: 'Delete Category',
            message: `Are you sure you want to delete the category "${name}"? This will remove it from all storefront layouts.`,
            type: 'danger',
            confirmText: 'Yes, Delete Category',
            onConfirm: async () => {
                try {
                    const { error } = await supabase
                        .from('categories')
                        .delete()
                        .eq('id', id);
                    
                    if (error) throw error;
                    setCategories(categories.filter(c => c.id !== id));
                    showToast('Category deleted!', 'success');
                } catch (error) {
                    console.error('Error deleting category:', error);
                    showToast('Delete failed: ' + error.message, 'error');
                }
            }
        });
    };

    const filteredCategories = categories.filter(cat => {
        const nameMatch = cat?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const slugMatch = cat?.slug?.toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch || slugMatch;
    });

    return (
        <>
            {/* Toast Notification - Viewport Fixed */}
            {notification && (
                <div className="fixed top-6 right-6 z-[9999] animate-fade-in-up flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/10 font-bold text-sm bg-white/90 dark:bg-[#1a1c23]/90 backdrop-blur-md border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">
                    {notification.type === 'success' ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    )}
                    <span className="max-w-xs">{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition ml-2 text-slate-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Category Management</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage storefront collections</p>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={async () => {
                            const standardList = ['Bras', 'Panties', 'Luxe', 'Nightwear', 'Bestsellers', 'Combo Packs', 'Innerwear'];
                            setLoading(true);
                            try {
                                const newCats = standardList
                                    .filter(name => !categories.some(c => c.name.toLowerCase() === name.toLowerCase()))
                                    .map(name => ({
                                        name,
                                        slug: name.toLowerCase().replace(/\s+/g, '-'),
                                        display_on_home: true,
                                        sort_order: 0
                                    }));
                                
                                if (newCats.length > 0) {
                                    const { error } = await supabase.from('categories').insert(newCats);
                                    if (error) {
                                        // Fallback for missing columns
                                        if (error.code === '42703' || error.message?.includes('column')) {
                                            const safeCats = newCats.map(({ name, slug }) => ({ name, slug }));
                                            const { error: fallbackError } = await supabase.from('categories').insert(safeCats);
                                            if (fallbackError) throw fallbackError;
                                            showToast(`Synced ${newCats.length} categories (basic)!`, 'success');
                                        } else {
                                            throw error;
                                        }
                                    } else {
                                        showToast(`Synced ${newCats.length} new categories!`, 'success');
                                    }
                                    fetchCategories();
                                } else {
                                    showToast('All standard categories are already present.', 'success');
                                }
                            } catch (e) {
                                console.error('Sync error:', e);
                                showToast('Sync failed: ' + e.message, 'error');
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="flex items-center gap-2 bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-50"
                    >
                        <Settings2 className="w-4 h-4" />
                        Quick Sync
                    </button>
                    <button
                        onClick={fetchCategories}
                        disabled={loading}
                        className="flex items-center gap-2 bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:border-[#944555] text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-50 active:scale-95 group"
                    >
                        <RefreshCw className={`w-4 h-4 text-[#944555] ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        <span>Refresh</span>
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-[#944555] hover:bg-[#7d3a47] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm shrink-0"
                    >
                        <Plus className="w-5 h-5" />
                        Add Category
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#1a1c23]">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#944555]/50 focus:border-[#944555] text-sm text-slate-900 dark:text-white shadow-inner transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                            <ImageIcon className="w-12 h-12 opacity-20" />
                            <p>No categories found.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-[#15171e] sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Preview</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Category Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Home Display</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {filteredCategories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group border-b border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                        <td className="px-6 py-4 align-middle">
                                            {cat.image ? (
                                                <div className="w-20 h-14 rounded-lg overflow-hidden shadow-sm bg-stone-100">
                                                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                </div>
                                            ) : (
                                                <div className="w-20 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-[#944555] transition-colors">
                                                    <ImageIcon className="w-5 h-5" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="font-bold text-slate-900 dark:text-white truncate max-w-[200px] group-hover:text-[#944555] transition-colors">{cat.name}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5 max-w-[200px] truncate opacity-70">/{cat.slug}</div>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const newStatus = !cat.display_on_home;
                                                        const { error } = await supabase
                                                            .from('categories')
                                                            .update({ display_on_home: newStatus })
                                                            .eq('id', cat.id);
                                                        
                                                        if (error) throw error;
                                                        setCategories(categories.map(c => c.id === cat.id ? { ...c, display_on_home: newStatus } : c));
                                                        showToast(`Category ${newStatus ? 'highlighted on' : 'removed from'} home page!`, 'success');
                                                    } catch (err) {
                                                        showToast('Toggle failed: ' + err.message, 'error');
                                                    }
                                                }}
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${cat.display_on_home ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}
                                            >
                                                {cat.display_on_home ? 'On Main Page' : 'Hidden'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 align-middle text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openModal(cat)}
                                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors"
                                                    title="Edit Category"
                                                >
                                                    <Edit2 className="w-4 h-4 pointer-events-none" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.id, cat.name)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                                                    title="Delete Category"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all overflow-y-auto">
                    <div className="bg-white dark:bg-[#1a1c23] rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#15171e]/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {editingId ? 'Modify Category' : 'Create New Category'}
                                </h2>
                                <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">{editingId ? 'Storefront Collection' : 'Setup Layout'}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        {/* Edit Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[75vh]">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">Category Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Graphic Tees"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#944555] focus:border-transparent outline-none text-slate-900 dark:text-white font-medium"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">URL Slug *</label>
                                    <input
                                        type="text"
                                        name="slug"
                                        required
                                        value={formData.slug}
                                        onChange={handleInputChange}
                                        placeholder="e.g. graphic-tees"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#944555] focus:border-transparent outline-none text-slate-900 dark:text-white font-mono text-sm"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">Category Photo (Upload or URL)</label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            id="category-image-upload"
                                        />
                                        <label
                                            htmlFor="category-image-upload"
                                            className="cursor-pointer shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors text-sm"
                                        >
                                            {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            Upload Photo
                                        </label>
                                        <div className="flex-1">
                                            <input
                                                type="url"
                                                name="image"
                                                value={formData.image}
                                                onChange={handleInputChange}
                                                placeholder="Or paste image URL here..."
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#944555] focus:border-transparent outline-none text-slate-900 dark:text-white text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                 {/* Layout & Visibility Section */}
                                 <div className="col-span-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                     <div className="grid grid-cols-2 gap-6">
                                         <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                                             <div>
                                                 <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Main Page Highlight</h4>
                                                 <p className="text-[10px] text-slate-500 font-medium">Show as featured card</p>
                                             </div>
                                             <label className="relative inline-flex items-center cursor-pointer">
                                                 <input 
                                                     type="checkbox" 
                                                     className="sr-only peer" 
                                                     checked={formData.display_on_home}
                                                     onChange={(e) => setFormData(prev => ({ ...prev, display_on_home: e.target.checked }))}
                                                 />
                                                 <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#944555]"></div>
                                             </label>
                                         </div>

                                         <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                                             <div>
                                                 <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Display Priority</h4>
                                                 <p className="text-[10px] text-slate-500 font-medium">Lower numbers appear first</p>
                                             </div>
                                             <input 
                                                 type="number"
                                                 name="sort_order"
                                                 value={formData.sort_order}
                                                 onChange={handleInputChange}
                                                 className="w-16 h-8 px-2 text-center text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#944555] focus:outline-none"
                                             />
                                         </div>
                                     </div>
                                 </div>

                            </div>

                                <div className="pt-4 flex gap-3 flex-row-reverse border-t border-slate-200 dark:border-slate-800">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-6 py-2.5 bg-[#944555] hover:bg-[#7d3a47] text-white font-bold rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {editingId ? 'Save Changes' : 'Create Category'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => !isSubmitting && setIsModalOpen(false)}
                                        disabled={isSubmitting}
                                        className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#15171e] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </>
    );
};

export default AdminCategories;


