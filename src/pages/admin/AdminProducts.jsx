import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Filter, Upload, Download, MoreHorizontal, Edit, Trash2, Image as ImageIcon, X, Save, ArrowLeft, ChevronDown, Check, DollarSign, Box, Tag, Layers, Settings2, CheckCircle, AlertCircle, RefreshCw, ArrowUpDown, Ruler, Palette } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';

const CustomDropdown = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <div className="relative w-full" ref={ref}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center bg-slate-50 dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#944555]/50 font-medium transition-all"
            >
                {value || placeholder}
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1c23] border border-slate-100 dark:border-slate-800 rounded-xl shadow-lg z-50 overflow-hidden py-1 animate-fade-in-up">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => { onChange(opt); setIsOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${value === opt ? 'bg-[#fff5f6] dark:bg-[#944555]/10 text-[#944555] dark:text-[#a28bfc]' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const categoryTemplates = {
    'Electronics': [
        { key: 'Brand', value: '' },
        { key: 'Model', value: '' },
        { key: 'Connectivity', value: '' },
        { key: 'Battery Life', value: '' },
        { key: 'Special Feature', value: '' },
        { key: 'Weight', value: '' }
    ],
    'Apparel': [
        { key: 'Brand', value: '' },
        { key: 'Material', value: '' },
        { key: 'Fit', value: '' },
        { key: 'Care Instructions', value: '' }
    ],
    'Footwear': [
        { key: 'Brand', value: '' },
        { key: 'Upper Material', value: '' },
        { key: 'Sole Material', value: '' },
        { key: 'Fastening', value: '' },
        { key: 'Type', value: '' }
    ],
    'Decor': [
        { key: 'Brand', value: '' },
        { key: 'Material', value: '' },
        { key: 'Dimensions', value: '' },
        { key: 'Weight', value: '' }
    ],
    'Accessories': [
        { key: 'Brand', value: '' },
        { key: 'Material', value: '' },
        { key: 'Style', value: '' }
    ],
    'Gadgets': [
        { key: 'Brand', value: '' },
        { key: 'Display', value: '' },
        { key: 'Processor', value: '' },
        { key: 'Storage', value: '' },
        { key: 'RAM', value: '' },
        { key: 'Operating System', value: '' }
    ]
};

const SpecLabelInput = ({ value, onChange, suggestions = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredSuggestions = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase());

    return (
        <div className="relative w-full" ref={ref}>
            <input
                type="text"
                value={value}
                onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
                onFocus={() => setIsOpen(true)}
                placeholder="Label (e.g. Brand)"
                className="w-full bg-slate-50 dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#944555]/50 font-medium transition-all"
            />
            {isOpen && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1c23] border border-slate-100 dark:border-slate-800 rounded-xl shadow-lg z-50 overflow-hidden py-1 animate-fade-in-up max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); }}
                            onClick={() => { onChange(opt); setIsOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm font-medium transition-colors text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// Form Template - Moved outside to ensure it's a true constant
const initialForm = {
    name: '', description: '', categories: [], status: 'Active',
    price: '', comparePrice: '', cost: '', isSale: false,
    sku: '', barcode: '', trackQuantity: true, stock: '', supplierRef: '',
    hasVariants: true, variants: [], specifications: [], images: [],
    colorConfigs: [], material_id: null, size_guide_id: null
};

const AdminProducts = () => {
    const [view, setView] = useState('list'); // 'list' | 'form'
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [subCategoryFilter, setSubCategoryFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Draft'
    const [editingProduct, setEditingProduct] = useState(null);
    const [allCategories, setAllCategories] = useState([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef(null);
    const { showAlert } = useAlert();
    const [allMaterials, setAllMaterials] = useState([]);
    const [allSizeGuides, setAllSizeGuides] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Filter & Select State
    const [selectedIds, setSelectedIds] = useState([]);
    const [sortBy, setSortBy] = useState('Newest');
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Dynamic Category Hierarchy (loaded from DB)
    // categoryHierarchy = { universal: [...], categories: [{id, name, subs:[...]}] }
    const [categoryHierarchy, setCategoryHierarchy] = useState({ universal: [], categories: [] });

    // Derive legacy categoryMap for the list-view filters (category name -> subcategory names[])
    const categoryMap = Object.fromEntries(
        categoryHierarchy.categories.map(c => [c.name, c.subs.map(s => s.name)])
    );
    // Category Normalization and Sale Synchronization
    const normalizeAndSyncCategories = (categoriesList, isSale) => {
        let clean = Array.isArray(categoriesList) 
            ? categoriesList.filter(c => typeof c === 'string').map(c => c.trim())
            : [];

        const normalized = new Set();
        
        let hasBra = false;
        let hasPanty = false;
        let hasCombo = false;
        let hasClearance = false;

        clean.forEach(cat => {
            const low = cat.toLowerCase();
            if (low === 'bras' || low === 'bra' || low === 'bras on sale' || low === 'wireless bras' || low === 'padded & push-up' || low === 'lace bras' || low === 'bralettes' || low === 'everyday comfort' || low === 'nursing bras') {
                hasBra = true;
                normalized.add(cat);
            } else if (low === 'panties' || low === 'panty' || low === 'panties on sale' || low === 'seamless panties' || low === 'high-waist panties' || low === 'bikini panties' || low === 'thongs' || low === 'hipsters' || low === 'period panties') {
                hasPanty = true;
                normalized.add(cat);
            } else if (low === 'combo packs' || low === 'combo pack' || low === 'combo' || low === 'combos' || low === 'combo pack offers' || low === 'bra & panty sets' || low === 'multi-pack panties' || low === 'value packs') {
                hasCombo = true;
                normalized.add(cat);
            } else if (low === 'clearance' || low === 'clearance sale') {
                hasClearance = true;
                normalized.add(cat);
            } else {
                normalized.add(cat);
            }
        });

        if (hasBra && !Array.from(normalized).some(c => c.toLowerCase() === 'bras')) normalized.add('Bras');
        if (hasPanty && !Array.from(normalized).some(c => c.toLowerCase() === 'panties')) normalized.add('Panties');
        if (hasCombo && !Array.from(normalized).some(c => c.toLowerCase() === 'combo packs')) normalized.add('Combo Packs');

        let result = Array.from(normalized);

        if (isSale) {
            if (!result.includes('Sale%')) {
                result.push('Sale%');
            }
            if (hasBra && !result.includes('Bras on Sale')) {
                result.push('Bras on Sale');
            }
            if (hasPanty && !result.includes('Panties on Sale')) {
                result.push('Panties on Sale');
            }
            if (hasCombo && !result.includes('Combo Pack Offers')) {
                result.push('Combo Pack Offers');
            }
            if (hasClearance && !result.includes('Clearance')) {
                result.push('Clearance');
            }
        } else {
            const saleSubcats = ['Bras on Sale', 'Panties on Sale', 'Combo Pack Offers', 'Clearance'];
            result = result.filter(c => c !== 'Sale%' && !saleSubcats.includes(c));
        }

        return result;
    };

    const fetchProducts = async (page = 1) => {
        setLoading(true);
        try {
            const from = (page - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            let query = supabase.from('products').select('*', { count: 'exact' });

            if (searchQuery) {
                query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
            }
            if (statusFilter !== 'All') {
                query = query.eq('status', statusFilter);
            }
            if (categoryFilter !== 'All') {
                if (categoryFilter === 'Sale%') {
                    if (subCategoryFilter !== 'All') {
                        let mainCatForSaleSub = 'None';
                        if (subCategoryFilter === 'Bras on Sale') mainCatForSaleSub = 'Bras';
                        else if (subCategoryFilter === 'Panties on Sale') mainCatForSaleSub = 'Panties';
                        else if (subCategoryFilter === 'Combo Pack Offers') mainCatForSaleSub = 'Combo Packs';
                        else if (subCategoryFilter === 'Clearance') mainCatForSaleSub = 'Clearance';

                        if (mainCatForSaleSub !== 'None') {
                            query = query.or(`categories.cs.["${subCategoryFilter}"],and(is_sale.eq.true,categories.cs.["${mainCatForSaleSub}"])`);
                        } else {
                            query = query.or(`categories.cs.["${subCategoryFilter}"],is_sale.eq.true`);
                        }
                    } else {
                        query = query.or('categories.cs.["Sale%"],is_sale.eq.true');
                    }
                } else {
                    const filters = [categoryFilter];
                    if (subCategoryFilter !== 'All') {
                        filters.push(subCategoryFilter);
                    }
                    query = query.contains('categories', filters);
                }
            }

            // Apply Sorting
            if (sortBy === 'Newest') query = query.order('created_at', { ascending: false });
            else if (sortBy === 'Oldest') query = query.order('created_at', { ascending: true });
            else if (sortBy === 'Price Low to High') query = query.order('price', { ascending: true });
            else if (sortBy === 'Price High to Low') query = query.order('price', { ascending: false });
            else if (sortBy === 'Stock Low to High') query = query.order('stock', { ascending: true });
            else if (sortBy === 'Stock High to Low') query = query.order('stock', { ascending: false });

            const { data, count, error } = await query
                .range(from, to);

            if (error) {
                showAlert({ title: 'Error', message: error.message, type: 'danger' });
            } else {
                setProducts(data || []);
                setTotalCount(count || 0);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchMaterials();
        fetchSizeGuides();
    }, []);

    const fetchMaterials = async () => {
        const { data, error } = await supabase.from('materials').select('*').order('name');
        if (!error && data) setAllMaterials(data);
    };

    const fetchSizeGuides = async () => {
        const { data, error } = await supabase.from('size_guides').select('*').order('name');
        if (!error && data) setAllSizeGuides(data);
    };

    useEffect(() => {
        setSubCategoryFilter('All');
        fetchProducts(1);
    }, [categoryFilter]);

    useEffect(() => {
        fetchProducts(1);
    }, [subCategoryFilter, statusFilter, sortBy, searchQuery]);

    useEffect(() => {
        fetchProducts(currentPage);
    }, [currentPage]);

    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = products;

    const fetchCategories = async () => {
        try {
            // Try to fetch with hierarchy columns (requires migration)
            const { data, error } = await supabase
                .from('categories')
                .select('id, name, slug, category_type, parent_id')
                .order('sort_order', { ascending: true })
                .order('name', { ascending: true });

            if (error) throw error;
            const rows = data || [];

            // Flat list for legacy usage
            setAllCategories(rows.map(r => ({ id: r.id, name: r.name, slug: r.slug })));

            // Check if hierarchy columns exist
            const hasType = rows.length === 0 || rows[0].category_type !== undefined;

            if (hasType) {
                const universals = rows.filter(r => r.category_type === 'universal');
                const mainCats = rows.filter(r => r.category_type === 'category');
                const subCats = rows.filter(r => r.category_type === 'subcategory');

                setCategoryHierarchy({
                    universal: universals,
                    categories: mainCats.map(cat => ({
                        ...cat,
                        subs: subCats.filter(s => s.parent_id === cat.id)
                    }))
                });
            } else {
                // Fallback: treat all as flat categories (old schema)
                setCategoryHierarchy({ universal: [], categories: rows.map(r => ({ ...r, subs: [] })) });
            }
        } catch {
            // Fallback for very old schema with no hierarchy columns
            const { data } = await supabase.from('categories').select('id, name, slug').order('name');
            const rows = data || [];
            setAllCategories(rows);
            setCategoryHierarchy({ universal: [], categories: rows.map(r => ({ ...r, subs: [] })) });
        }
    };

    const showToast = (message, type = 'success') => {
        showAlert({
            title: type === 'error' ? 'Error' : 'Success',
            message: message,
            type: type === 'error' ? 'danger' : 'success',
            showCancel: false,
            confirmText: 'Dismiss'
        });
    };

    const [formData, setFormData] = useState({ ...initialForm });

    const handleAddProduct = () => {
        setFormData({ ...initialForm });
        setEditingProduct(null);
        setView('form');
    };

    const handleEditProduct = (product) => {
        setFormData({
            ...product,
            description: product.description || '',
            comparePrice: product.comparePrice || '',
            barcode: product.barcode || '',
            trackQuantity: product.trackQuantity ?? true,
            supplierRef: product.supplierRef || '',
            hasVariants: product.hasVariants || false,
            variants: product.variants || [],
            specifications: product.specifications || [],
            images: product.images || [],
            categories: product.categories || (product.category ? [product.category] : []),
            isSale: product.is_sale || (Array.isArray(product.categories) && product.categories.includes('Sale%')) || false,
            material_id: product.material_id || null,
            size_guide_id: product.size_guide_id || null
        });
        setEditingProduct(product);
        setView('form');
    };

    const handleDeleteProduct = (id) => {
        showAlert({
            title: 'Delete Product?',
            message: 'Are you sure you want to delete this product? This action cannot be undone and will permanently remove it from your catalog.',
            type: 'danger',
            confirmText: 'Delete Now',
            onConfirm: async () => {
                const { error } = await supabase.from('products').delete().eq('id', id);
                if (error) {
                    showToast('Database Error: ' + error.message, 'error');
                    return;
                }
                fetchProducts(currentPage);
                setSelectedIds(prev => prev.filter(pId => pId !== id));
                showToast('Product deleted successfully!');
            }
        });
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        
        showAlert({
            title: `Delete ${selectedIds.length} Products?`,
            message: `Are you sure you want to permanently delete these ${selectedIds.length} products? This action cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete Selected',
            onConfirm: async () => {
                setLoading(true);
                const { error } = await supabase.from('products').delete().in('id', selectedIds);
                if (error) {
                    showToast('Database Error: ' + error.message, 'error');
                    setLoading(false);
                    return;
                }
                setSelectedIds([]);
                fetchProducts(currentPage);
                showToast(`${selectedIds.length} products deleted successfully!`);
            }
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(products.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };

    const handleBulkViewSizes = () => {
        const selectedProducts = products.filter(p => selectedIds.includes(p.id));
        const fashionProducts = selectedProducts.filter(p => {
            const productCategories = p.categories || (p.category ? [p.category] : []);
            const cats = productCategories.map(c => c?.toLowerCase());
            return cats.some(c => ['apparel', 'footwear', 'clothing', 'fashion'].includes(c));
        });

        if (fashionProducts.length === 0) {
            showToast('Selected products do not have standard sizing enabled.', 'info');
            return;
        }

        showAlert({
            title: 'Sizing Overview',
            message: (
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-left">
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Box className="w-3 h-3" /> Selected Items Inventory
                        </h4>
                        <div className="grid gap-2">
                            {fashionProducts.map(p => {
                                const sizeVar = p.variants?.find(v => v.name === 'Size');
                                return (
                                    <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 m-auto text-slate-400" />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">{p.name}</span>
                                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">SKU: {p.sku}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1 justify-end max-w-[140px]">
                                            {sizeVar?.values?.length > 0 ? sizeVar.values.map(val => (
                                                <span key={val} className="px-1.5 py-0.5 bg-[#944555]/10 text-[#944555] dark:text-[#a28bfc] rounded text-[9px] font-black border border-[#944555]/20 uppercase">
                                                    {val}
                                                </span>
                                            )) : <span className="text-[10px] text-slate-400 italic">No sizes set</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-white/10">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Ruler className="w-3 h-3" /> Standard Clothing Size Guide
                        </h4>
                        <div className="overflow-x-auto w-full bg-slate-900/5 dark:bg-black/20 rounded-2xl p-4 border border-slate-200 dark:border-white/5">
                            <table className="w-full text-left border-collapse min-w-[280px]">
                                <thead>
                                    <tr>
                                        <th className="pb-3 border-b border-slate-200 dark:border-white/10 font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px]">Size</th>
                                        <th className="pb-3 border-b border-slate-200 dark:border-white/10 font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px]">Chest</th>
                                        <th className="pb-3 border-b border-slate-200 dark:border-white/10 font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px]">Waist</th>
                                        <th className="pb-3 border-b border-slate-200 dark:border-white/10 font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px]">Hips</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs">
                                    {[
                                        { s: 'S', c: '34-36"', w: '28-30"', h: '36-38"' },
                                        { s: 'M', c: '38-40"', w: '32-34"', h: '40-42"' },
                                        { s: 'L', c: '42-44"', w: '36-38"', h: '44-46"' },
                                        { s: 'XL', c: '46-48"', w: '40-42"', h: '48-50"' }
                                    ].map((row, i) => (
                                        <tr key={i} className="group">
                                            <td className="py-2.5 border-b border-slate-200/50 dark:border-white/5 font-black text-slate-900 dark:text-white uppercase">{row.s}</td>
                                            <td className="py-2.5 border-b border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-300 font-medium">{row.c}</td>
                                            <td className="py-2.5 border-b border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-300 font-medium">{row.w}</td>
                                            <td className="py-2.5 border-b border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-300 font-medium">{row.h}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ),
            confirmText: 'Dismiss',
            showCancel: false
        });
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

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingImage(true);
        const newImages = [];

        try {
            for (const file of files) {
                // 1. Compress
                const compressedFile = await compressImage(file);
                
                // 2. Upload to storage
                const fileName = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.jpg`;
                const { data, error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, compressedFile);

                if (uploadError) throw uploadError;

                // 3. Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);

                newImages.push(publicUrl);
            }
            setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
            showToast(`Uploaded ${newImages.length} images successfully.`);
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Upload failed: ' + error.message, 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleRemoveImage = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, idx) => idx !== indexToRemove)
        }));
    };

    const handleColorImageUpload = async (e, colorIndex) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingImage(true);
        const newImages = [];

        try {
            for (const file of files) {
                // 1. Compress
                const compressedFile = await compressImage(file);
                
                // 2. Upload to storage
                const fileName = `color_${colorIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.jpg`;
                const { data, error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, compressedFile);

                if (uploadError) throw uploadError;

                // 3. Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);

                newImages.push(publicUrl);
            }
            
            const newConfigs = [...formData.colorConfigs];
            newConfigs[colorIndex].images = [...(newConfigs[colorIndex].images || []), ...newImages];
            setFormData({ ...formData, colorConfigs: newConfigs });
            
            showToast(`Uploaded ${newImages.length} images for this color.`);
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Upload failed: ' + error.message, 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const removeColorImage = (colorIndex, imageIndex) => {
        const newConfigs = [...formData.colorConfigs];
        newConfigs[colorIndex].images = newConfigs[colorIndex].images.filter((_, idx) => idx !== imageIndex);
        setFormData({ ...formData, colorConfigs: newConfigs });
    };

    const addColorConfig = () => {
        setFormData({
            ...formData,
            colorConfigs: [...(formData.colorConfigs || []), { name: '', hex: '#000000', images: [] }]
        });
    };

    const removeColorConfig = (index) => {
        const newConfigs = [...formData.colorConfigs];
        newConfigs.splice(index, 1);
        setFormData({ ...formData, colorConfigs: newConfigs });
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSaveProduct = async () => {
        if (isSubmitting) return;
        
        if (!formData.name) {
            showToast('Product title is required.', 'error');
            return;
        }

        setIsSubmitting(true);
        setLoading(true); // Keep general loading active too

        let cleanCategories = normalizeAndSyncCategories(formData.categories, formData.isSale);

        // Ensure IDs are valid UUIDs or null
        const isValidUUID = (id) => id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

        const payload = {
            name: formData.name,
            description: formData.description || '',
            categories: cleanCategories,
            status: formData.status || 'Active',
            price: parseFloat(formData.price) || 0,
            comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
            cost: parseFloat(formData.cost) || 0,
            is_sale: Boolean(formData.isSale),
            sku: formData.sku || `SKU-${Date.now()}`,
            barcode: formData.barcode || '',
            trackQuantity: Boolean(formData.trackQuantity),
            stock: parseInt(formData.stock) || 0,
            supplierRef: formData.supplierRef || '',
            variants: formData.variants || [],
            specifications: formData.specifications || [],
            images: formData.images || [],
            colorConfigs: formData.colorConfigs || [],
            material_id: isValidUUID(formData.material_id) ? formData.material_id : null,
            size_guide_id: isValidUUID(formData.size_guide_id) ? formData.size_guide_id : null
        };

        try {
            if (editingProduct) {
                const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
                if (error) throw error;
                showToast('Product updated successfully!');
            } else {
                const { error } = await supabase.from('products').insert([payload]);
                if (error) throw error;
                showToast('Product added successfully!');
            }

            // Reset state immediately for a responsive feel
            setEditingProduct(null);
            setFormData({
                name: '', description: '', categories: [], status: 'Active',
                price: '', comparePrice: '', cost: '', isSale: false,
                sku: '', barcode: '', trackQuantity: true, stock: '', supplierRef: '',
                hasVariants: true, variants: [], specifications: [], images: [],
                colorConfigs: [], material_id: null, size_guide_id: null
            });
            setView('list');
            
            // Refresh the list
            await fetchProducts(currentPage);
        } catch (error) {
            console.error('Save Error:', error);
            showToast('Save Failed: ' + (error.message || 'Check connection'), 'error');
        } finally {
            setIsSubmitting(false);
            setLoading(false);
        }
    };

    const downloadCSVTemplate = () => {
        const headers = ["name", "description", "price", "comparePrice", "cost", "sku", "barcode", "stock", "categories", "status", "is_sale", "images", "specifications", "variants", "trackQuantity", "supplierRef"];
        const sampleRow = [
            "Sample Product",
            "This is a premium product from Bloomina.",
            "999.00",
            "1299.00",
            "450.00",
            "SAMPLE-001",
            "8901234567890",
            "50",
            "Premium,Gadgets",
            "Active",
            "TRUE",
            "https://placehold.co/600x400,https://placehold.co/600x401",
            '[{"key":"Weight","value":"200g"}]',
            '[{"name":"Color","values":["Black","White"]}]',
            "TRUE",
            "TRUI-S-001"
        ];
        
        const csvContent = [
            headers.join(','),
            sampleRow.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(',')
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "Bloomina_product_template.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportCSV = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            const csvText = event.target.result;
            const rows = parseCSV(csvText);
            
            if (rows.length < 2) {
                showToast("CSV is empty or invalid.", "error");
                setImporting(false);
                return;
            }

            const headers = rows[0].map(h => h.trim().toLowerCase());
            const dataRows = rows.slice(1);
            
            let successCount = 0;
            let errorCount = 0;

            for (const row of dataRows) {
                if (row.length < headers.length) continue;
                
                try {
                    const rowData = {};
                    headers.forEach((header, index) => {
                        rowData[header] = row[index];
                    });

                    const isSale = rowData.is_sale?.toLowerCase() === 'true';
                    let rawCategories = rowData.categories ? rowData.categories.split(',').map(c => c.trim()) : [];
                    let importedCategories = normalizeAndSyncCategories(rawCategories, isSale);

                    const payload = {
                        name: rowData.name || "Unnamed Product",
                        description: rowData.description || "",
                        price: parseFloat(rowData.price) || 0,
                        comparePrice: rowData.compareprice ? parseFloat(rowData.compareprice) : null,
                        cost: parseFloat(rowData.cost) || 0,
                        sku: rowData.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                        barcode: rowData.barcode || "",
                        stock: parseInt(rowData.stock) || 0,
                        categories: importedCategories,
                        status: rowData.status || "Draft",
                        is_sale: isSale,
                        images: rowData.images ? rowData.images.split(',').map(i => i.trim()) : [],
                        specifications: rowData.specifications ? JSON.parse(rowData.specifications) : [],
                        variants: rowData.variants ? JSON.parse(rowData.variants) : [],
                        trackQuantity: rowData.trackquantity?.toLowerCase() !== 'false',
                        supplierRef: rowData.supplierref || ""
                    };

                    const { error } = await supabase.from('products').insert([payload]);
                    if (error) throw error;
                    successCount++;
                } catch (err) {
                    console.error("Row Import Error:", err);
                    errorCount++;
                }
            }

            showToast(`Import finished! ${successCount} success, ${errorCount} errors.`);
            fetchProducts(currentPage);
            setImporting(false);
            e.target.value = ''; // Reset input
        };

        reader.readAsText(file);
    };

    const parseCSV = (text) => {
        const lines = [];
        let currentLine = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentField += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                currentLine.push(currentField);
                currentField = '';
            } else if ((char === '\n' || char === '\r') && !inQuotes) {
                if (char === '\r' && nextChar === '\n') i++;
                if (currentField || currentLine.length > 0) {
                    currentLine.push(currentField);
                    lines.push(currentLine);
                }
                currentLine = [];
                currentField = '';
            } else {
                currentField += char;
            }
        }
        if (currentField || currentLine.length > 0) {
            currentLine.push(currentField);
            lines.push(currentLine);
        }
        return lines;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Active': return <span className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold">Active</span>;
            case 'Low Stock': return <span className="bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 px-2.5 py-1 rounded-full text-xs font-bold">Low Stock</span>;
            case 'Out of Stock': return <span className="bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-full text-xs font-bold">Out of Stock</span>;
            case 'Draft': return <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold">Draft</span>;
            default: return <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
        }
    };

    if (view === 'form') {
        return (
            <div 
                key={editingProduct ? `edit-${editingProduct.id}` : 'add-new'}
                data-tour="product-form"
                className="flex flex-col h-full animate-fade-in-up relative"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                    <div className="flex items-center gap-5">
                        <button 
                            onClick={() => setView('list')}
                            className="p-3.5 bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-[#944555] rounded-2xl transition-all shadow-sm active:scale-90"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                                {editingProduct ? 'Update Collection Item' : 'New Master Entry'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Configure product attributes and marketing data</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setView('list')}
                            className="px-6 py-3 text-sm font-black text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white uppercase tracking-wider"
                        >
                            Cancel
                        </button>
                        <button 
                            data-tour="product-save-btn"
                            onClick={handleSaveProduct}
                            disabled={isSubmitting}
                            className="bg-[#944555] hover:bg-[#7d3a47] text-white px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-xl shadow-[#944555]/20 flex items-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            <span>{editingProduct ? 'Commit Changes' : 'Publish Product'}</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-12">
                    {/* Left Column (Main details) */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <div data-tour="product-basic-card" className="bg-white dark:bg-[#15171e] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-5 flex items-center gap-2"><Tag className="w-5 h-5 text-[#944555]" /> Basic Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Product Title</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#944555]/50 focus:border-[#944555] transition-all font-medium"
                                        placeholder="e.g. Nike Air Max 270"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="4"
                                        className="w-full bg-slate-50 dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#944555]/50 focus:border-[#944555] transition-all font-medium resize-none"
                                        placeholder="Detailed product behavior..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Material Selection Section */}
                        <div data-tour="product-material-card" className="bg-white dark:bg-[#15171e] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-slate-900 dark:text-white font-bold text-lg flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-[#944555]" /> Material Mastery
                                </h3>
                                <button 
                                    type="button"
                                    onClick={() => window.open('/admin/materials', '_blank')}
                                    className="text-[10px] font-black uppercase text-[#944555] hover:underline flex items-center gap-1 bg-[#fff5f6] dark:bg-[#944555]/10 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    <Plus className="w-3 h-3" /> Manage Templates
                                </button>
                            </div>

                            <p className="text-slate-500 text-xs mb-4 font-medium">Link a universal material template to this product to display high-fidelity technical specs and fabric stories on the storefront.</p>

                            <div className="relative mb-4">
                                <select
                                    value={formData.material_id || ''}
                                    onChange={(e) => setFormData({ ...formData, material_id: e.target.value || null })}
                                    className="w-full bg-slate-50 dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#944555]/50 focus:border-[#944555] transition-all font-bold appearance-none cursor-pointer"
                                >
                                    <option value="">No Material Template Linked</option>
                                    {allMaterials.map(mat => (
                                        <option key={mat.id} value={mat.id}>{mat.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>

                            {/* Material Preview */}
                            {formData.material_id && (
                                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 animate-fade-in shadow-inner">
                                    {(() => {
                                        const selectedMat = allMaterials.find(m => m.id === formData.material_id);
                                        return selectedMat ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-[#944555]">
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Selected Template: {selectedMat.name}</span>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                                        {selectedMat.content?.length || 0} Technical Specs
                                                    </span>
                                                </div>
                                                
                                                {selectedMat.description && (
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium italic border-l-2 border-[#944555]/20 pl-4">
                                                        "{selectedMat.description}"
                                                    </p>
                                                )}

                                                {selectedMat.content?.length > 0 && (
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                        {selectedMat.content.slice(0, 6).map((spec, sidx) => (
                                                            <div key={sidx} className="bg-white dark:bg-[#1a1c23] p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">{spec.label}</div>
                                                                <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">{spec.value}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            )}
                        </div>


                        {/* Media Upload */}
                        <div data-tour="product-media-card" className="bg-white dark:bg-[#15171e] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-5 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-[#944555]" /> Media</h3>

                            {formData.images.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                    {formData.images.map((imgSrc, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                                            <img src={imgSrc} alt={`preview ${idx}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button onClick={() => handleRemoveImage(idx)} className="w-8 h-8 bg-white text-red-500 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors shadow-sm">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-[#1a1c23] transition-colors cursor-pointer group">
                                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                                <div className="w-16 h-16 rounded-full bg-[#fff5f6] dark:bg-[#944555]/10 text-[#944555] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <p className="text-slate-900 dark:text-white font-bold content-center mb-1">
                                    {uploadingImage ? 'Processing & Uploading...' : 'Click to upload or drag & drop'}
                                </p>
                                <p className="text-slate-500 text-sm">Global images for the product</p>
                            </label>
                        </div>

                        {/* Color Configurations Section */}
                        <div data-tour="product-color-card" className="bg-white dark:bg-[#15171e] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-slate-900 dark:text-white font-bold text-lg flex items-center gap-2"><Ruler className="w-5 h-5 text-[#944555]" /> Color Management</h3>
                                <button
                                    onClick={addColorConfig}
                                    className="text-sm font-bold text-[#944555] hover:underline flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" /> Add Color
                                </button>
                            </div>
                            <p className="text-sm text-slate-500 mb-6">Upload specific images for each color. These will show up when customers select the color.</p>

                            <div className="space-y-8">
                                {formData.colorConfigs.map((config, colorIdx) => (
                                    <div key={colorIdx} className="p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-[#1a1c23]/50 animate-fade-in-up">
                                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Color Name</label>
                                                <input
                                                    type="text"
                                                    value={config.name}
                                                    onChange={(e) => {
                                                        const newConfigs = [...formData.colorConfigs];
                                                        newConfigs[colorIdx].name = e.target.value;
                                                        setFormData({ ...formData, colorConfigs: newConfigs });
                                                    }}
                                                    placeholder="e.g. Bloom Pink"
                                                    className="w-full bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-[#944555] transition-colors"
                                                />
                                            </div>
                                            <div className="w-full sm:w-32">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hex Code</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={config.hex}
                                                        onChange={(e) => {
                                                            const newConfigs = [...formData.colorConfigs];
                                                            newConfigs[colorIdx].hex = e.target.value;
                                                            setFormData({ ...formData, colorConfigs: newConfigs });
                                                        }}
                                                        className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={config.hex}
                                                        onChange={(e) => {
                                                            const newConfigs = [...formData.colorConfigs];
                                                            newConfigs[colorIdx].hex = e.target.value;
                                                            setFormData({ ...formData, colorConfigs: newConfigs });
                                                        }}
                                                        className="flex-1 bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold font-mono uppercase"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-end">
                                                <button
                                                    onClick={() => removeColorConfig(colorIdx)}
                                                    className="w-10 h-10 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="block text-xs font-bold text-slate-500 uppercase">Color Specific Images</label>
                                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                                {(config.images || []).map((img, imgIdx) => (
                                                    <div key={imgIdx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 group">
                                                        <img src={img} className="w-full h-full object-cover" />
                                                        <button 
                                                            onClick={() => removeColorImage(colorIdx, imgIdx)}
                                                            className="absolute top-1 right-1 w-6 h-6 bg-white/90 text-red-500 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-[#0f111a] transition-all group">
                                                    <input type="file" multiple accept="image/*" onChange={(e) => handleColorImageUpload(e, colorIdx)} className="hidden" />
                                                    <Plus className="w-5 h-5 text-slate-400 group-hover:text-[#944555] group-hover:scale-110 transition-all" />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {formData.colorConfigs.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
                                        <Plus className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                        <p className="font-bold">No colors configured yet.</p>
                                        <button onClick={addColorConfig} className="text-[#944555] text-sm font-bold mt-2 hover:underline underline-offset-4">Add your first color</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pricing Component */}
                        <div data-tour="product-pricing-card" className="bg-white dark:bg-[#15171e] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-5 flex items-center gap-2"><DollarSign className="w-5 h-5 text-[#944555]" /> Pricing</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Selling Price (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#944555]/50 font-medium"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                                        Compare-at Price (₹) 
                                        {formData.isSale && <span className="text-red-500 text-[10px] uppercase font-black animate-pulse">Sale Active</span>}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.comparePrice}
                                        onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#944555]/50 font-medium line-through text-slate-500"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-500/5 rounded-2xl border border-red-100 dark:border-red-500/10 mb-4">
                                <input 
                                    type="checkbox" 
                                    id="isSale"
                                    className="w-5 h-5 rounded border-red-300 text-red-500 focus:ring-red-500/50" 
                                    checked={formData.isSale} 
                                    onChange={(e) => setFormData({ ...formData, isSale: e.target.checked })} 
                                />
                                <label htmlFor="isSale" className="text-sm font-bold text-red-600 dark:text-red-400 cursor-pointer">
                                    Is Sales Running? <span className="font-normal opacity-80">(Displays "SALE" badge on storefront)</span>
                                </label>
                            </div>
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                                            Cost per item (₹) <span className="text-slate-400 text-xs font-normal">Customers won't see this</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.cost}
                                            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#944555]/50 font-medium"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-end">
                                        <div className="bg-slate-50 dark:bg-[#1a1c23] rounded-xl p-3 border border-slate-200 dark:border-slate-700 flex justify-between items-center h-[46px]">
                                            <span className="text-sm font-bold text-slate-500">Margin</span>
                                            <span className="font-black text-[#944555]">
                                                {formData.price && formData.cost ? `${(((formData.price - formData.cost) / formData.price) * 100).toFixed(1)}%` : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Size Guide Section */}
                        <div data-tour="product-sizing-card" className="bg-white dark:bg-[#15171e] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-slate-900 dark:text-white font-bold text-lg flex items-center gap-2">
                                    <Ruler className="w-5 h-5 text-[#944555]" /> Fit & Sizing
                                </h3>
                                <button 
                                    type="button"
                                    onClick={() => window.open('/admin/size-guides', '_blank')}
                                    className="text-[10px] font-black uppercase text-[#944555] hover:underline flex items-center gap-1 bg-[#fff5f6] dark:bg-[#944555]/10 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    <Plus className="w-3 h-3" /> Manage Guides
                                </button>
                            </div>

                            <p className="text-slate-500 text-xs mb-4 font-medium">Link a size guide to this product to help customers find their perfect fit. Displays a measurement chart on the product page.</p>

                            <div className="relative mb-4">
                                <select
                                    value={formData.size_guide_id || ''}
                                    onChange={(e) => setFormData({ ...formData, size_guide_id: e.target.value || null })}
                                    className="w-full bg-slate-50 dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#944555]/50 focus:border-[#944555] transition-all font-bold appearance-none cursor-pointer"
                                >
                                    <option value="">No Size Guide Linked</option>
                                    {allSizeGuides.map(guide => (
                                        <option key={guide.id} value={guide.id}>{guide.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>

                            {/* Size Guide Preview */}
                            {formData.size_guide_id && (
                                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 animate-fade-in shadow-inner">
                                    {(() => {
                                        const selectedGuide = allSizeGuides.find(g => g.id === formData.size_guide_id);
                                        return selectedGuide ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-[#944555]">
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Active Guide: {selectedGuide.name}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-[10px]">
                                                        <thead>
                                                            <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                                                                {selectedGuide.chart_data?.[0] && Object.keys(selectedGuide.chart_data[0]).map(key => (
                                                                    <th key={key} className="py-2 px-1 font-black text-slate-400 uppercase tracking-tighter">{key}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(() => {
                                                                const headers = selectedGuide.chart_data?.[0] ? Object.keys(selectedGuide.chart_data[0]) : [];
                                                                return selectedGuide.chart_data?.slice(0, 3).map((row, ridx) => (
                                                                    <tr key={ridx} className="border-b border-slate-100 dark:border-slate-800/50">
                                                                        {headers.map((key, vidx) => (
                                                                            <td key={vidx} className="py-2 px-1 text-slate-700 dark:text-slate-300 font-bold">{row[key]}</td>
                                                                        ))}
                                                                    </tr>
                                                                ));
                                                            })()}
                                                        </tbody>
                                                    </table>
                                                    {selectedGuide.chart_data?.length > 3 && (
                                                        <p className="text-[8px] text-slate-400 mt-2 font-bold italic text-center">+ {selectedGuide.chart_data.length - 3} more sizes</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Variants Component */}
                        <div data-tour="product-variants-card" className="bg-white dark:bg-[#15171e] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-slate-900 dark:text-white font-bold text-lg flex items-center gap-2"><Layers className="w-5 h-5 text-[#944555]" /> Variants</h3>
                                <button className="text-sm font-bold text-[#944555] hover:underline flex items-center gap-1">
                                    <Plus className="w-4 h-4" /> Add options like size or color
                                </button>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">Add variants to your product to offer customers different choices, such as sizes or colors.</p>

                            <div className="mt-4 p-4 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1c23] rounded-xl space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-xs font-bold text-slate-500 uppercase">Available Colors</label>
                                        <span className="text-[10px] text-[#944555] font-bold px-2 py-0.5 bg-[#944555]/10 rounded-full uppercase">Synced with Color Management</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.colorConfigs?.length > 0 ? (
                                            formData.colorConfigs.map((config, idx) => (
                                                <span key={idx} className="pl-3 pr-3 py-1.5 bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300 shadow-sm">
                                                    <span className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: config.hex }}></span>
                                                    {config.name || 'Unnamed Color'}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">Add colors in the Color Management section above.</p>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-xs font-bold text-slate-500 uppercase text-left">Available Sizes</label>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                let newVariants = [...(formData.variants || [])];
                                                const sizeIdx = newVariants.findIndex(v => v.name === 'Size');
                                                if (sizeIdx >= 0) {
                                                    newVariants[sizeIdx].values = [];
                                                    setFormData({ ...formData, variants: newVariants });
                                                }
                                            }}
                                            className="text-[10px] font-bold text-[#944555] hover:underline uppercase tracking-wider"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(() => {
                                            const isBra = formData.categories?.some(c => c.toLowerCase().includes('bra'));
                                            const isPanty = formData.categories?.some(c => c.toLowerCase().includes('pant') || c.toLowerCase().includes('brief'));
                                            
                                            let sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
                                            if (isBra) {
                                                sizeOptions = ['32B', '32C', '34B', '34C', '34D', '36B', '36C', '36D', '38B', '38C', '38D', '40B', '40C', '40D'];
                                            } else if (isPanty) {
                                                sizeOptions = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
                                            }

                                            return sizeOptions.map(size => {
                                                const currentSizes = formData.variants?.find(v => v.name === 'Size')?.values || [];
                                                const isSelected = currentSizes.includes(size);
                                                return (
                                                    <button
                                                        key={size}
                                                        type="button"
                                                        onClick={() => {
                                                            let newVariants = [...(formData.variants || [])];
                                                            const sizeIdx = newVariants.findIndex(v => v.name === 'Size');
                                                            let values = [...currentSizes];
                                                            if (isSelected) values = values.filter(v => v !== size);
                                                            else values.push(size);
                                                            
                                                            if (sizeIdx >= 0) newVariants[sizeIdx].values = values;
                                                            else newVariants.push({ name: 'Size', values });
                                                            newVariants = newVariants.filter(v => v.values.length > 0);
                                                            setFormData({ ...formData, variants: newVariants });
                                                        }}
                                                        className={`px-3 h-10 rounded-xl border-2 font-bold text-[11px] transition-all flex items-center justify-center min-w-[3.5rem] ${isSelected ? 'bg-[#944555] border-[#944555] text-white shadow-md shadow-[#944555]/20' : 'bg-white dark:bg-[#0f111a] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-[#944555]'}`}
                                                    >
                                                        {size}
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Specifications Builder */}
                        <div data-tour="product-specs-card" className="bg-white dark:bg-[#15171e] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-slate-900 dark:text-white font-bold text-lg flex items-center gap-2"><Settings2 className="w-5 h-5 text-[#944555]" /> Specifications</h3>
                                <button
                                    onClick={() => setFormData({ ...formData, specifications: [...formData.specifications, { key: '', value: '' }] })}
                                    className="text-sm font-bold text-[#944555] hover:underline flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" /> Add Spec
                                </button>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">Add technical details, material info, or key features. (e.g. Brand, Connectivity, Weight)</p>

                            <div className="space-y-3">
                                {formData.specifications.map((spec, index) => (
                                    <div key={index} className="flex gap-3 items-start animate-fade-in-up">
                                        <div className="flex-1">
                                            <SpecLabelInput
                                                value={spec.key}
                                                onChange={(val) => {
                                                    const newSpecs = [...formData.specifications];
                                                    newSpecs[index].key = val;
                                                    setFormData({ ...formData, specifications: newSpecs });
                                                }}
                                                suggestions={formData.categories?.[0] && categoryTemplates[formData.categories?.[0]] ? categoryTemplates[formData.categories[0]].map(t => t.key) : []}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder="Value (e.g. TruAudio)"
                                                value={spec.value}
                                                onChange={(e) => {
                                                    const newSpecs = [...formData.specifications];
                                                    newSpecs[index].value = e.target.value;
                                                    setFormData({ ...formData, specifications: newSpecs });
                                                }}
                                                className="w-full bg-slate-50 dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#944555]/50 font-medium"
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newSpecs = [...formData.specifications];
                                                newSpecs.splice(index, 1);
                                                setFormData({ ...formData, specifications: newSpecs });
                                            }}
                                            className="w-11 h-11 shrink-0 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                                {formData.specifications.length === 0 && (
                                    <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 font-medium text-sm">
                                        No specifications added yet.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Column (Sidebar details) */}
                    <div className="space-y-6">

                        {/* Status */}
                        <div data-tour="product-status-card" className="bg-white dark:bg-[#15171e] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-4">Status</h3>
                            <CustomDropdown
                                options={['Active', 'Draft']}
                                value={formData.status}
                                onChange={(val) => setFormData({ ...formData, status: val })}
                            />
                            <p className="text-xs text-slate-500 mt-2">Active products are instantly visible to your customers.</p>
                        </div>

                        {/* Inventory & Tracking */}
                        <div data-tour="product-inventory-card" className="bg-white dark:bg-[#15171e] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-5 flex items-center gap-2"><Box className="w-5 h-5 text-[#944555]" /> Inventory</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">SKU (Stock Keeping Unit)</label>
                                    <input
                                        type="text"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#944555]/50 font-medium"
                                        placeholder="e.g. T-SHIRT-M"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Barcode (ISBN, UPC, GTIN)</label>
                                    <input
                                        type="text"
                                        value={formData.barcode}
                                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#944555]/50 font-medium"
                                    />
                                </div>

                                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                                    <label className="flex items-center gap-3 cursor-pointer mb-4">
                                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-[#944555] focus:ring-[#944555]/50 bg-slate-50 dark:bg-[#1a1c23]" checked={formData.trackQuantity} onChange={(e) => setFormData({ ...formData, trackQuantity: e.target.checked })} />
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Track quantity</span>
                                    </label>

                                    {formData.trackQuantity && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Available Quantity</label>
                                            <input
                                                type="number"
                                                value={formData.stock}
                                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#944555]/50 font-medium"
                                                placeholder="0"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Vendors & Organization */}
                        <div data-tour="product-org-card" className="bg-white dark:bg-[#15171e] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-1">Organization & Categories</h3>
                            <p className="text-xs text-slate-400 mb-5 font-medium">Assign universal tags, a main category, and sub-categories for precise storefront placement.</p>

                            <div className="space-y-5">

                                {/* ─── Tier 1: Universal Tags ─── */}
                                {categoryHierarchy.universal.length > 0 && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/20">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                                                Universal Tags
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const universalNames = categoryHierarchy.universal.map(u => u.name);
                                                    setFormData({ ...formData, categories: (formData.categories || []).filter(c => !universalNames.includes(c)) });
                                                }}
                                                className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {categoryHierarchy.universal.map(tag => {
                                                const isOn = formData.categories?.includes(tag.name);
                                                return (
                                                    <button
                                                        key={tag.id}
                                                        type="button"
                                                        onClick={() => {
                                                            let next = [...(formData.categories || [])];
                                                            if (isOn) next = next.filter(c => c !== tag.name);
                                                            else next.push(tag.name);
                                                            setFormData({ ...formData, categories: next });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${isOn
                                                            ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200 dark:shadow-amber-900/30'
                                                            : 'bg-white dark:bg-[#0f111a] border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 hover:border-amber-400'}`}
                                                    >
                                                        {tag.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* ─── Tier 2: Main Category ─── */}
                                <div className="p-4 bg-violet-50 dark:bg-violet-500/5 rounded-2xl border border-violet-100 dark:border-violet-500/20">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 mb-3 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-violet-400 inline-block"></span>
                                        Main Category
                                    </p>
                                    {categoryHierarchy.categories.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">No categories yet. <a href="/admin/categories" className="text-[#944555] underline" target="_blank">Create one</a>.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {categoryHierarchy.categories.map(cat => {
                                                const isOn = formData.categories?.includes(cat.name);
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const allMainNames = categoryHierarchy.categories.map(c => c.name);
                                                            const allSubNames = categoryHierarchy.categories.flatMap(c => c.subs.map(s => s.name));
                                                            // When toggling a main category off: also remove its subs
                                                            let next = [...(formData.categories || [])];
                                                            if (isOn) {
                                                                const thisSubs = cat.subs.map(s => s.name);
                                                                next = next.filter(c => c !== cat.name && !thisSubs.includes(c));
                                                            } else {
                                                                // Remove any other main category if switching (single-main rule)
                                                                next = next.filter(c => !allMainNames.includes(c) && !allSubNames.includes(c));
                                                                next.push(cat.name);
                                                            }
                                                            setFormData({ ...formData, categories: next });
                                                        }}
                                                        className={`px-4 py-2 rounded-xl border-2 text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${isOn
                                                            ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200 dark:shadow-violet-900/30'
                                                            : 'bg-white dark:bg-[#0f111a] border-violet-200 dark:border-violet-500/30 text-violet-600 dark:text-violet-400 hover:border-violet-400'}`}
                                                    >
                                                        {cat.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* ─── Tier 3: Sub-Categories ─── */}
                                {(() => {
                                    const allMainNames = categoryHierarchy.categories.map(c => c.name);
                                    const selectedMain = categoryHierarchy.categories.find(c => formData.categories?.includes(c.name));
                                    if (!selectedMain || selectedMain.subs.length === 0) return null;
                                    return (
                                        <div className="p-4 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/20 animate-fade-in">
                                            <div className="flex justify-between items-center mb-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                                                    {selectedMain.name} Sub-Categories
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const subNames = selectedMain.subs.map(s => s.name);
                                                        setFormData({ ...formData, categories: (formData.categories || []).filter(c => !subNames.includes(c)) });
                                                    }}
                                                    className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {selectedMain.subs.map(sub => {
                                                    const isOn = formData.categories?.includes(sub.name);
                                                    return (
                                                        <label key={sub.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${isOn ? 'bg-white dark:bg-[#1a1c23] border-blue-400 text-blue-600 dark:text-blue-400' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500'}`}>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={isOn}
                                                                onChange={() => {
                                                                    let next = [...(formData.categories || [])];
                                                                    if (isOn) next = next.filter(c => c !== sub.name);
                                                                    else next.push(sub.name);
                                                                    setFormData({ ...formData, categories: next });
                                                                }}
                                                            />
                                                            <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-all ${isOn ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-slate-700'}`}>
                                                                {isOn && <Check className="w-3 h-3 text-white" />}
                                                            </div>
                                                            <span className="text-xs font-bold">{sub.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Active Summary */}
                                {(formData.categories || []).length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {formData.categories.map(cat => (
                                            <span key={cat} className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                                                {cat}
                                                <button type="button" onClick={() => setFormData({ ...formData, categories: formData.categories.filter(c => c !== cat) })} className="hover:text-red-500 transition-colors leading-none">×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Supplier Reference */}
                                <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                                        Supplier Reference <span className="text-slate-400 text-xs font-normal">Optional</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.supplierRef}
                                        onChange={(e) => setFormData({ ...formData, supplierRef: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#944555]/50 font-medium"
                                        placeholder="Supplier ID or Name"
                                    />
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        );
    }

    // List View
    return (
        <div className="space-y-6 animate-fade-in relative pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div data-tour="catalog-header">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Master Catalog</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Manage global product availability and variants</p>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Sync: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        data-tour="refresh-board-btn"
                        onClick={() => fetchProducts(currentPage)}
                        disabled={loading}
                        className="bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:border-[#944555] text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 active:scale-95 group"
                    >
                        <RefreshCw className={`w-4 h-4 text-[#944555] ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} /> 
                        <span>Refresh Board</span>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImportCSV} 
                        accept=".csv" 
                        className="hidden" 
                    />
                    <button 
                        data-tour="import-csv-btn"
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={importing}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold bg-white dark:bg-[#15171e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Upload className={`w-4 h-4 ${importing ? 'animate-bounce' : ''}`} /> {importing ? 'Importing...' : 'Import CSV'}
                    </button>
                    <button 
                        data-tour="template-csv-btn"
                        onClick={downloadCSVTemplate}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold bg-white dark:bg-[#15171e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Template
                    </button>
                    <button data-tour="add-product-btn" onClick={handleAddProduct} className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold bg-[#944555] text-white hover:bg-[#7d3a47] transition shadow-md shadow-[#944555]/20 flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Add Product
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#15171e] rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex-1 flex flex-col">

                {/* Search & Filter Bar */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row justify-between gap-4 bg-slate-50/50 dark:bg-[#1a1c23]/50">
                    <div className="flex flex-wrap items-center gap-3">
                        <div data-tour="status-filter-tabs" className="flex bg-white dark:bg-[#15171e] rounded-xl border border-slate-200 dark:border-slate-800 p-1">
                            {['All', 'Active', 'Draft'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === status 
                                        ? 'bg-slate-900 text-white shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        <div data-tour="category-dropdown" className="w-48">
                            <CustomDropdown 
                                options={['All', ...Object.keys(categoryMap)]}
                                value={categoryFilter}
                                onChange={setCategoryFilter}
                                placeholder="Category"
                            />
                        </div>

                        {categoryFilter !== 'All' && categoryMap[categoryFilter]?.length > 0 && (
                            <div className="flex items-center gap-3 bg-stone-50 p-2 rounded-2xl border border-stone-100 animate-fade-in shadow-sm">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 pl-2">Sub:</span>
                                <div className="w-48">
                                    <CustomDropdown 
                                        options={['All', ...categoryMap[categoryFilter]]}
                                        value={subCategoryFilter}
                                        onChange={setSubCategoryFilter}
                                        placeholder="Sub Category"
                                    />
                                </div>
                            </div>
                        )}

                        <div data-tour="sort-dropdown" className="w-48">
                            <CustomDropdown 
                                options={['Newest', 'Oldest', 'Price Low to High', 'Price High to Low', 'Stock Low to High', 'Stock High to Low']}
                                value={sortBy}
                                onChange={setSortBy}
                                placeholder="Sort By"
                            />
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="flex gap-2 animate-fade-in">
                                <button 
                                    onClick={handleBulkViewSizes}
                                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#15171e] text-[#944555] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-2 text-xs font-black shadow-sm"
                                >
                                    <Ruler className="w-3.5 h-3.5" /> Size Chart
                                </button>
                                <button 
                                    onClick={handleBulkDelete}
                                    className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 hover:bg-red-100 transition flex items-center gap-2 text-xs font-black"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete {selectedIds.length}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <div data-tour="search-input" className="flex items-center bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 rounded-xl px-3 focus-within:ring-2 focus-within:ring-[#944555]/50 w-full sm:w-64 transition-all">
                            <Search className="w-4 h-4 text-slate-400 shrink-0" />
                            <input
                                type="text"
                                placeholder="Search sku, title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent px-2 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 min-w-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div data-tour="products-table" className="overflow-x-auto overflow-y-auto flex-1 hide-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="sticky top-0 bg-white dark:bg-[#15171e] z-10 shadow-sm dark:shadow-slate-900/10">
                            <tr>
                                <th className="py-4 px-6 w-10">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-slate-300 text-[#944555] focus:ring-[#944555]/50 cursor-pointer" 
                                        checked={products.length > 0 && selectedIds.length === products.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="py-4 px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Product</th>
                                <th className="py-4 px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Inventory</th>
                                <th className="py-4 px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Category</th>
                                <th className="py-4 px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Price</th>
                                <th className="py-4 px-6 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <tr key={idx} className="border-b border-slate-50 dark:border-slate-800/30">
                                        <td className="py-6 px-6"><div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div></td>
                                        <td className="py-4 px-3">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                                                <div className="space-y-2">
                                                    <div className="w-32 h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                                                    <div className="w-20 h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-3"><div className="w-16 h-5 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse"></div></td>
                                        <td className="py-4 px-3"><div className="w-24 h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div></td>
                                        <td className="py-4 px-3"><div className="w-20 h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div></td>
                                        <td className="py-4 px-3 pr-6 text-right"><div className="w-16 h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse ml-auto"></div></td>
                                        <td className="py-4 px-6"></td>
                                    </tr>
                                ))
                            ) : paginatedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                                        No products found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                paginatedProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-[#1c1e28] transition-colors group border-b border-transparent hover:border-slate-100 dark:hover:border-slate-800 last:border-0 border-t border-slate-50 dark:border-slate-800/30">
                                        <td className="py-4 px-6 align-middle">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-slate-300 text-[#944555] focus:ring-[#944555]/50 cursor-pointer" 
                                                checked={selectedIds.includes(product.id)}
                                                onChange={() => toggleSelect(product.id)}
                                            />
                                        </td>
                                        <td className="py-4 px-3 align-middle">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-[#fff5f6] dark:bg-[#944555]/10 text-[#944555] dark:text-[#a28bfc] rounded-xl flex items-center justify-center text-xl shrink-0 border border-[#944555]/10 overflow-hidden">
                                                    {product.images && product.images.length > 0 ? (
                                                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-900 dark:text-white text-base truncate">{product.name}</div>
                                                    <div className="text-xs font-medium text-slate-500 truncate mt-0.5">SKU: {product.sku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-3 align-middle">
                                            <div className="flex flex-col gap-1">
                                                {getStatusBadge(product.status)}
                                                {product.is_sale && <span className="inline-flex w-fit bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter animate-pulse border border-red-200 dark:border-red-500/30">SALE RUNNING</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-3 align-middle">
                                            <div className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{product.stock} in stock</div>
                                            {product.trackQuantity && product.stock <= 5 && <span className="text-[10px] text-orange-500 font-bold uppercase tracking-tighter">Low Inventory!</span>}
                                        </td>
                                        <td className="py-4 px-3 align-middle">
                                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                {(product.categories || [product.category]).filter(Boolean).map((cat, i) => (
                                                    <span key={i} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-4 px-3 align-middle text-right">
                                            <div className="font-bold text-slate-900 dark:text-white">₹{product.price?.toLocaleString()}</div>
                                            {product.comparePrice && (
                                                <div className="text-xs font-medium text-slate-400 line-through">₹{product.comparePrice.toLocaleString()}</div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 align-middle text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditProduct(product)} className="w-8 h-8 rounded-lg bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-[#944555] hover:border-[#944555] transition shadow-sm">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteProduct(product.id)} className="w-8 h-8 rounded-lg bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-red-500 hover:border-red-500 transition shadow-sm">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalCount > 0 && (
                    <div data-tour="pagination-nav" className="mx-8 mb-8 p-4 border-t border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-[#1a1c23] rounded-xl shadow-lg gap-4">
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalCount)} of {totalCount} products
                        </div>
                        <div className="flex gap-1.5">
                            <button 
                                onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                disabled={currentPage === 1 || loading}
                                className={`px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-sm ${currentPage === 1 || loading ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
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
                                        className={`px-4 py-2 rounded-xl border transition-all text-sm font-black ${currentPage === pageNum ? 'border-[#944555] bg-[#fff5f6] dark:bg-[#944555]/20 text-[#944555] dark:text-[#a28bfc]' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button 
                                onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                disabled={currentPage === totalPages || totalPages === 0 || loading}
                                className={`px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-sm ${currentPage === totalPages || totalPages === 0 || loading ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
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

export default AdminProducts;


