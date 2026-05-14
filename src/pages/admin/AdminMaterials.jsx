import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Search, Loader2, X, CheckCircle, AlertCircle, Palette, FileText, RefreshCw } from 'lucide-react';
import { useAlert } from '../../contexts/AlertContext';

const AdminMaterials = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial form state
    const initialFormState = {
        name: '',
        description: '',
        content: [] // [{ label: '', value: '' }]
    };
    const [formData, setFormData] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);
    const [notification, setNotification] = useState(null);
    const { showAlert } = useAlert();

    useEffect(() => {
        fetchMaterials();
    }, []);

    const showToast = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('materials')
                .select('*')
                .order('name', { ascending: true });
            
            if (error) throw error;
            setMaterials(data || []);
        } catch (error) {
            console.error('Error fetching materials:', error);
            showToast('Error fetching materials: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const addSpec = () => {
        setFormData(prev => ({
            ...prev,
            content: [...prev.content, { label: '', value: '' }]
        }));
    };

    const updateSpec = (index, field, value) => {
        const newContent = [...formData.content];
        newContent[index][field] = value;
        setFormData(prev => ({
            ...prev,
            content: newContent
        }));
    };

    const removeSpec = (index) => {
        setFormData(prev => ({
            ...prev,
            content: prev.content.filter((_, i) => i !== index)
        }));
    };

    const openModal = (material = null) => {
        if (material) {
            setFormData({
                name: material.name || '',
                description: material.description || '',
                content: material.content || []
            });
            setEditingId(material.id);
        } else {
            setFormData(initialFormState);
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                content: formData.content
            };

            if (editingId) {
                const { error } = await supabase
                    .from('materials')
                    .update(payload)
                    .eq('id', editingId);
                if (error) throw error;
                showToast('Material template updated!', 'success');
            } else {
                const { error } = await supabase
                    .from('materials')
                    .insert([payload]);
                if (error) throw error;
                showToast('Material template created!', 'success');
            }
            
            await fetchMaterials();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving material:', error);
            showToast('Failed to save material template.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, name) => {
        showAlert({
            title: 'Delete Material Template',
            message: `Are you sure you want to delete "${name}"? This template will be unlinked from all products.`,
            type: 'danger',
            confirmText: 'Yes, Delete Template',
            onConfirm: async () => {
                try {
                    const { error } = await supabase
                        .from('materials')
                        .delete()
                        .eq('id', id);
                    
                    if (error) throw error;
                    setMaterials(materials.filter(m => m.id !== id));
                    showToast('Material template deleted!', 'success');
                } catch (error) {
                    console.error('Error deleting material:', error);
                    showToast('Delete failed: ' + error.message, 'error');
                }
            }
        });
    };

    const filteredMaterials = materials.filter(mat => 
        mat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mat.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Material Templates</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Define technical specs and stories for your fabric collections.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchMaterials}
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
                            Create Template
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#1a1c23]">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search templates..."
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
                        ) : filteredMaterials.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                                <Palette className="w-12 h-12 opacity-20" />
                                <p>No material templates found.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-[#15171e] sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Template Name</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Description Preview</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-center">Spec Count</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {filteredMaterials.map((mat) => (
                                        <tr key={mat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white group-hover:text-[#944555] transition-colors flex items-center gap-2">
                                                    <FileText className="w-4 h-4 opacity-40" />
                                                    {mat.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-500 dark:text-slate-400 max-w-md truncate">
                                                    {mat.description || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                    {mat.content?.length || 0} Specs
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openModal(mat)}
                                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(mat.id, mat.name)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
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
                        <div className="bg-white dark:bg-[#1a1c23] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col mt-safe">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#15171e]/50 shrink-0">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                        {editingId ? 'Modify Material' : 'Define New Material'}
                                    </h2>
                                    <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Premium Fabric Specs</p>
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
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">Template Name *</label>
                                        <input
                                            type="text"
                                            required
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Pure Ethereal Silk"
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#944555] focus:border-transparent outline-none text-slate-900 dark:text-white font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">Material Story / Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                            placeholder="Tell the story of this material..."
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#944555] focus:border-transparent outline-none text-slate-900 dark:text-white font-medium resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Technical Specifications</label>
                                        <button
                                            type="button"
                                            onClick={addSpec}
                                            className="text-[10px] font-black uppercase text-[#944555] hover:underline flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Add Specification
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {formData.content?.length === 0 ? (
                                            <div className="py-8 text-center bg-slate-50 dark:bg-[#15171e] rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No specs added yet</p>
                                            </div>
                                        ) : (
                                            formData.content?.map((spec, idx) => (
                                                <div key={idx} className="flex gap-3 animate-fade-in">
                                                    <input
                                                        type="text"
                                                        value={spec.label}
                                                        onChange={(e) => updateSpec(idx, 'label', e.target.value)}
                                                        placeholder="Label (e.g. Weight)"
                                                        className="flex-1 px-4 py-2 bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-bold"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={spec.value}
                                                        onChange={(e) => updateSpec(idx, 'value', e.target.value)}
                                                        placeholder="Value (e.g. 19 Momme)"
                                                        className="flex-1 px-4 py-2 bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-medium"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSpec(idx)}
                                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-3 flex-row-reverse border-t border-slate-100 dark:border-slate-800 shrink-0">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-8 py-3 bg-[#944555] hover:bg-[#7d3a47] text-white font-bold rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#944555]/20"
                                    >
                                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {editingId ? 'Update Template' : 'Create Template'}
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

export default AdminMaterials;
