import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Loader2, Image as ImageIcon, Upload, X, CheckCircle, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useAlert } from '../../contexts/AlertContext';

const AdminHero = () => {
    const { showAlert } = useAlert();
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const initialFormState = {
        image_url: '',
        order_index: 0,
        is_active: true
    };
    const [formData, setFormData] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchSlides();
    }, []);

    const showToast = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchSlides = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('hero_slides')
                .select('*')
                .order('order_index', { ascending: true });
            
            if (error) throw error;
            setSlides(data || []);
        } catch (error) {
            console.error('Error fetching slides:', error);
            showToast('Error fetching slides: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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
                    const maxDim = 1920; // Hero images can be larger
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

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setUploadingImage(true);
            const compressedFile = await compressImage(file);
            const fileName = `hero_${Date.now()}.jpg`;
            
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, compressedFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
            showToast('Hero image uploaded successfully!', 'success');
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Upload failed: ' + error.message, 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const openModal = (slide = null) => {
        if (slide) {
            setFormData({
                image_url: slide.image_url,
                order_index: slide.order_index,
                is_active: slide.is_active
            });
            setEditingId(slide.id);
        } else {
            setFormData({ ...initialFormState, order_index: slides.length });
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const payload = {
                image_url: formData.image_url,
                order_index: parseInt(formData.order_index) || 0,
                is_active: formData.is_active
            };

            if (editingId) {
                const { error } = await supabase.from('hero_slides').update(payload).eq('id', editingId);
                if (error) throw error;
                showToast('Hero slide updated!', 'success');
            } else {
                const { error } = await supabase.from('hero_slides').insert([payload]);
                if (error) throw error;
                showToast('Hero slide added!', 'success');
            }
            
            fetchSlides();
            setIsModalOpen(false);
        } catch (error) {
            showToast('Save failed: ' + error.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        showAlert({
            title: 'Delete Hero Slide',
            message: 'Are you sure? This image will be removed from the storefront slideshow.',
            type: 'danger',
            confirmText: 'Delete Slide',
            onConfirm: async () => {
                try {
                    const { error } = await supabase.from('hero_slides').delete().eq('id', id);
                    if (error) throw error;
                    setSlides(slides.filter(s => s.id !== id));
                    showToast('Slide deleted!', 'success');
                } catch (error) {
                    showToast('Delete failed: ' + error.message, 'error');
                }
            }
        });
    };

    const toggleStatus = async (slide) => {
        try {
            const { error } = await supabase.from('hero_slides').update({ is_active: !slide.is_active }).eq('id', slide.id);
            if (error) throw error;
            setSlides(slides.map(s => s.id === slide.id ? { ...s, is_active: !s.is_active } : s));
            showToast(`Slide ${!slide.is_active ? 'activated' : 'deactivated'}`);
        } catch (error) {
            showToast('Update failed: ' + error.message, 'error');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Notification */}
            {notification && (
                <div className="fixed top-6 right-6 z-[9999] animate-fade-in-up flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl bg-white/90 dark:bg-[#1a1c23]/90 backdrop-blur-md border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold">
                    {notification.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                    <span>{notification.message}</span>
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h1 data-tour="hero-header" className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Hero Slideshow</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage the high-impact images on your storefront home page.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        data-tour="hero-refresh-btn"
                        onClick={fetchSlides}
                        disabled={loading}
                        className="flex items-center gap-2 bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        data-tour="hero-add-btn"
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-[#944555] hover:bg-[#7d3a47] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Slide
                    </button>
                </div>
            </div>

            <div data-tour="hero-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="aspect-video bg-white dark:bg-[#1a1c23] rounded-3xl animate-pulse border border-slate-200 dark:border-slate-800" />
                    ))
                ) : slides.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-[#1a1c23] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <ImageIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">No hero slides found. Add your first one!</p>
                    </div>
                ) : (
                    slides.map((slide) => (
                        <div key={slide.id} className={`group relative bg-white dark:bg-[#1a1c23] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl ${!slide.is_active && 'opacity-60'}`}>
                            <div className="aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-900">
                                {slide.image_url ? (
                                    <img src={slide.image_url} alt="Hero Slide" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon /></div>
                                )}
                            </div>
                            
                            <div className="p-4 flex items-center justify-between bg-white dark:bg-[#1a1c23]">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-500">
                                        #{slide.order_index}
                                    </span>
                                    <button 
                                        onClick={() => toggleStatus(slide)}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${slide.is_active ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                                    >
                                        {slide.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                        {slide.is_active ? 'Visible' : 'Hidden'}
                                    </button>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                    <button onClick={() => openModal(slide)} className="p-2 text-slate-400 hover:text-[#944555] hover:bg-[#fff5f6] dark:hover:bg-[#944555]/10 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(slide.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#1a1c23] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-fade-in-up">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingId ? 'Edit Hero Slide' : 'Add Hero Slide'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Slide Image</label>
                                    <div className="flex flex-col gap-3">
                                        {formData.image_url && (
                                            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                                                <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                                <button 
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="hero-upload" />
                                            <label htmlFor="hero-upload" className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition-all">
                                                {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                                {formData.image_url ? 'Replace Image' : 'Upload Image'}
                                            </label>
                                        </div>
                                        <input
                                            type="url"
                                            name="image_url"
                                            value={formData.image_url}
                                            onChange={handleInputChange}
                                            placeholder="Or paste image URL..."
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#944555] outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Display Order</label>
                                        <input
                                            type="number"
                                            name="order_index"
                                            value={formData.order_index}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#944555] outline-none"
                                        />
                                    </div>
                                    <div className="flex items-end pb-3">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    name="is_active"
                                                    checked={formData.is_active}
                                                    onChange={handleInputChange}
                                                    className="sr-only"
                                                />
                                                <div className={`w-10 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-[#944555]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_active ? 'translate-x-4' : ''}`}></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Active</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !formData.image_url}
                                    className="flex-1 py-3 bg-[#944555] hover:bg-[#7d3a47] text-white font-bold rounded-2xl disabled:opacity-50 transition-all shadow-lg shadow-[#944555]/20"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (editingId ? 'Save Changes' : 'Add Slide')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminHero;
