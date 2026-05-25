import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Search, Loader2, X, CheckCircle, AlertCircle, Ruler, Grid, RefreshCw, HelpCircle, Columns } from 'lucide-react';
import { useAlert } from '../../contexts/AlertContext';

const AdminSizeGuides = () => {
    const [sizeGuides, setSizeGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial builder state
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [headers, setHeaders] = useState([
        { id: 'col_0', label: 'Size' },
        { id: 'col_1', label: 'Chest (in)' },
        { id: 'col_2', label: 'Waist (in)' },
        { id: 'col_3', label: 'Hips (in)' }
    ]);
    const [rows, setRows] = useState([
        { col_0: 'S', col_1: '34-36', col_2: '28-30', col_3: '35-37' },
        { col_0: 'M', col_1: '38-40', col_2: '32-34', col_3: '39-41' },
        { col_0: 'L', col_1: '42-44', col_2: '36-38', col_3: '43-45' }
    ]);

    const [notification, setNotification] = useState(null);
    const { showAlert } = useAlert();

    useEffect(() => {
        fetchSizeGuides();
    }, []);

    const showToast = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchSizeGuides = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('size_guides')
                .select('*')
                .order('name', { ascending: true });
            
            if (error) throw error;
            setSizeGuides(data || []);
        } catch (error) {
            console.error('Error fetching size guides:', error);
            showToast('Error fetching size guides: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Column Actions
    const addColumn = () => {
        const nextId = `col_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const newColName = `Col ${headers.length + 1}`;
        setHeaders([...headers, { id: nextId, label: newColName }]);
        setRows(rows.map(row => ({ ...row, [nextId]: '' })));
    };

    const renameColumn = (index, newName) => {
        const updatedHeaders = [...headers];
        updatedHeaders[index] = { ...updatedHeaders[index], label: newName };
        setHeaders(updatedHeaders);
    };

    const removeColumn = (index) => {
        if (headers.length <= 1) {
            showToast('A size chart must have at least one column!', 'error');
            return;
        }
        const colToRemove = headers[index];
        setHeaders(headers.filter((_, i) => i !== index));
        setRows(rows.map(row => {
            const newRow = { ...row };
            delete newRow[colToRemove.id];
            return newRow;
        }));
    };

    // Row Actions
    const addRow = () => {
        const newRow = {};
        headers.forEach(h => {
            newRow[h.id] = '';
        });
        setRows([...rows, newRow]);
    };

    const updateCell = (rowIndex, colId, value) => {
        const updatedRows = [...rows];
        updatedRows[rowIndex][colId] = value;
        setRows(updatedRows);
    };

    const removeRow = (rowIndex) => {
        setRows(rows.filter((_, i) => i !== rowIndex));
    };

    const openModal = (guide = null) => {
        if (guide) {
            setName(guide.name || '');
            setDescription(guide.description || '');
            
            // Extract headers from the chart_data
            const loadedChartData = guide.chart_data || [];
            const loadedHeaders = loadedChartData[0] ? Object.keys(loadedChartData[0]) : ['Size'];
            
            const convertedHeaders = loadedHeaders.map((label, idx) => ({
                id: `col_${idx}`,
                label: label
            }));
            setHeaders(convertedHeaders);
            
            // Map rows safely using the stable IDs
            const loadedRows = loadedChartData.map(row => {
                const safeRow = {};
                convertedHeaders.forEach(h => {
                    safeRow[h.id] = row[h.label] !== undefined ? String(row[h.label]) : '';
                });
                return safeRow;
            });
            setRows(loadedRows.length > 0 ? loadedRows : [convertedHeaders.reduce((acc, h) => ({ ...acc, [h.id]: '' }), {})]);
            setEditingId(guide.id);
        } else {
            setName('');
            setDescription('');
            setHeaders([
                { id: 'col_0', label: 'Size' },
                { id: 'col_1', label: 'Chest (in)' },
                { id: 'col_2', label: 'Waist (in)' },
                { id: 'col_3', label: 'Hips (in)' }
            ]);
            setRows([
                { col_0: 'S', col_1: '34-36', col_2: '28-30', col_3: '35-37' },
                { col_0: 'M', col_1: '38-40', col_2: '32-34', col_3: '39-41' },
                { col_0: 'L', col_1: '42-44', col_2: '36-38', col_3: '43-45' }
            ]);
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            showToast('Size guide name is required!', 'error');
            return;
        }

        // Clean headers and check validation
        const cleanHeaders = headers.map(h => ({
            ...h,
            label: h.label.trim()
        })).filter(h => h.label !== '');

        if (cleanHeaders.length === 0) {
            showToast('At least one non-empty column is required!', 'error');
            return;
        }

        // Check for duplicates
        const labelList = cleanHeaders.map(h => h.label);
        const uniqueLabels = new Set(labelList);
        if (uniqueLabels.size !== labelList.length) {
            // Find duplicate
            const duplicates = labelList.filter((item, index) => labelList.indexOf(item) !== index);
            showToast(`Column headers must be unique! Duplicate found: "${duplicates[0]}"`, 'error');
            return;
        }

        const chartData = rows.map(row => {
            const cleanRow = {};
            cleanHeaders.forEach(h => {
                cleanRow[h.label] = row[h.id] || '';
            });
            return cleanRow;
        });

        setIsSubmitting(true);
        try {
            const payload = {
                name: name.trim(),
                description: description.trim(),
                chart_data: chartData
            };

            if (editingId) {
                const { error } = await supabase
                    .from('size_guides')
                    .update(payload)
                    .eq('id', editingId);
                if (error) throw error;
                showToast('Size guide updated successfully!', 'success');
            } else {
                const { error } = await supabase
                    .from('size_guides')
                    .insert([payload]);
                if (error) throw error;
                showToast('Size guide created successfully!', 'success');
            }
            
            await fetchSizeGuides();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving size guide:', error);
            showToast('Failed to save size guide: ' + error.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, guideName) => {
        showAlert({
            title: 'Delete Size Guide',
            message: `Are you sure you want to delete "${guideName}"? This chart will be unlinked from all products.`,
            type: 'danger',
            confirmText: 'Yes, Delete Guide',
            onConfirm: async () => {
                try {
                    const { error } = await supabase
                        .from('size_guides')
                        .delete()
                        .eq('id', id);
                    
                    if (error) throw error;
                    setSizeGuides(sizeGuides.filter(g => g.id !== id));
                    showToast('Size guide deleted!', 'success');
                } catch (error) {
                    console.error('Error deleting size guide:', error);
                    showToast('Delete failed: ' + error.message, 'error');
                }
            }
        });
    };

    const filteredSizeGuides = sizeGuides.filter(guide => 
        guide.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guide.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            {/* Toast Notification */}
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
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Size Charts & Guides</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage interactive fit tables displayed on the product storefront.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchSizeGuides}
                            disabled={loading}
                            className="flex items-center gap-2 bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2 bg-[#944555] hover:bg-[#7d3a47] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm shrink-0"
                        >
                            <Plus className="w-5 h-5" />
                            Create Size Guide
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#1a1c23]">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search size charts..."
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
                        ) : filteredSizeGuides.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                                <Ruler className="w-12 h-12 opacity-20" />
                                <p>No size guides found.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-[#15171e] sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Guide Name</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Description</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-center font-bold">Headers Listed</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-center font-bold">Size Count</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {filteredSizeGuides.map((guide) => {
                                        const cols = guide.chart_data?.[0] ? Object.keys(guide.chart_data[0]) : [];
                                        return (
                                            <tr key={guide.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900 dark:text-white group-hover:text-[#944555] transition-colors flex items-center gap-2">
                                                        <Ruler className="w-4 h-4 opacity-40 text-[#944555]" />
                                                        {guide.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-500 dark:text-slate-400 max-w-sm truncate">
                                                        {guide.description || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-wrap gap-1 justify-center max-w-xs mx-auto">
                                                        {cols.slice(0, 3).map((col, cidx) => (
                                                            <span key={cidx} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded">
                                                                {col}
                                                            </span>
                                                        ))}
                                                        {cols.length > 3 && (
                                                            <span className="text-[9px] text-slate-400 font-bold italic">+{cols.length - 3} more</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-[#944555]/10 text-[#944555] dark:text-[#f8a5c2] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                        {guide.chart_data?.length || 0} Rows
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => openModal(guide)}
                                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(guide.id, guide.name)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                                                        >
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

                {/* Grid Builder & Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all overflow-y-auto">
                        <div className="bg-white dark:bg-[#1a1c23] rounded-[32px] shadow-2xl w-full max-w-5xl overflow-hidden transform transition-all border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col mt-safe">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#15171e]/50 shrink-0">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                        <Ruler className="w-6 h-6 text-[#944555]" />
                                        {editingId ? 'Modify Size Guide' : 'Design New Size Guide'}
                                    </h2>
                                    <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Interactive Table Grid Builder</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Left Fields Column */}
                                    <div className="md:col-span-1 space-y-4">
                                        <div className="bg-slate-50 dark:bg-[#15171e] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4">
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                                                <HelpCircle className="w-4 h-4" /> Basic Details
                                            </h3>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5">Guide Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="e.g. Lingerie Bralette Sizes"
                                                    className="w-full px-4 py-2.5 bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#944555] focus:border-transparent outline-none text-slate-900 dark:text-white font-medium text-sm transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5">Description / Help Text</label>
                                                <textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    rows="3"
                                                    placeholder="e.g. Standard chest & waist measurements in inches to ensure comfort fit."
                                                    className="w-full px-4 py-2.5 bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#944555] focus:border-transparent outline-none text-slate-900 dark:text-white font-medium text-xs resize-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 text-amber-600 dark:text-amber-400 space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest">Builder Instructions</p>
                                            <ul className="text-[11px] font-medium space-y-1.5 list-disc pl-4 opacity-90 leading-relaxed">
                                                <li>Add columns for dimensions (e.g. Chest, Sleeve, Waist).</li>
                                                <li>Double-click/edit the header text fields to rename table headers.</li>
                                                <li>Create row entries matching size increments (e.g. S, M, L, XL).</li>
                                                <li>Headers are mapped dynamically to keep storefront grids accurate.</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Right Grid Builder Column */}
                                    <div className="md:col-span-2 space-y-4">
                                        <div className="bg-slate-50 dark:bg-[#15171e] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col h-full min-h-[300px]">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                                                    <Grid className="w-4 h-4" /> Size Chart Grid Editor
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={addColumn}
                                                        className="text-[10px] font-black uppercase bg-white dark:bg-[#0f111a] text-[#944555] hover:bg-slate-100 dark:hover:bg-[#0f111a]/50 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                                                    >
                                                        <Columns className="w-3 h-3" /> Add Dimension
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={addRow}
                                                        className="text-[10px] font-black uppercase bg-[#944555] hover:bg-[#7d3a47] text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                                                    >
                                                        <Plus className="w-3 h-3" /> Add Size Row
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex-1 overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-slate-200 dark:border-slate-800">
                                                            {headers.map((header, hidx) => (
                                                                <th key={header.id} className="pb-3 px-2 min-w-[120px]">
                                                                    <div className="flex items-center gap-1">
                                                                        <input
                                                                            type="text"
                                                                            value={header.label}
                                                                            onChange={(e) => renameColumn(hidx, e.target.value)}
                                                                            className="w-full px-2 py-1 bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider text-center outline-none focus:ring-1 focus:ring-[#944555]"
                                                                            placeholder="Header"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeColumn(hidx)}
                                                                            className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                                                                            title="Delete Column"
                                                                        >
                                                                            <X className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </th>
                                                            ))}
                                                            <th className="pb-3 px-2 w-[40px]"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {rows.map((row, ridx) => (
                                                            <tr key={ridx} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-100/30">
                                                                {headers.map((header, hidx) => (
                                                                    <td key={header.id} className="py-2 px-2">
                                                                        <input
                                                                            type="text"
                                                                            value={row[header.id] || ''}
                                                                            onChange={(e) => updateCell(ridx, header.id, e.target.value)}
                                                                            placeholder={`-`}
                                                                            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-[#944555] transition-all"
                                                                        />
                                                                    </td>
                                                                ))}
                                                                <td className="py-2 px-2 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeRow(ridx)}
                                                                        className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                                                                        title="Delete Row"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {rows.length === 0 && (
                                                            <tr>
                                                                <td colSpan={headers.length + 1} className="py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic bg-white dark:bg-[#0f111a] border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                                                    No rows created yet. Click "Add Size Row" to start adding values.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-3 flex-row-reverse border-t border-slate-100 dark:border-slate-800 shrink-0">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-8 py-3 bg-[#944555] hover:bg-[#7d3a47] text-white font-bold rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#944555]/20"
                                    >
                                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {editingId ? 'Save Guide Changes' : 'Publish Size Guide'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => !isSubmitting && setIsModalOpen(false)}
                                        disabled={isSubmitting}
                                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-[#15171e] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors disabled:opacity-50"
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

export default AdminSizeGuides;
