import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle2, Search, Filter, Trash2, Send, RefreshCw, ShoppingBag, User, ExternalLink, AlertCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import UniversalDropdown from '../../components/admin/UniversalDropdown';
import { useAlert } from '../../contexts/AlertContext';

function parseReviewComment(comment) {
  if (!comment) return { fabricRating: null, comfortRating: null, servicePackagingRating: null, cleanComment: '' };

  const newMatch = comment.match(/^\[Fabric:\s*(\d)\/5,\s*Comfort:\s*(\d)\/5,\s*Service\s*&\s*Packaging:\s*(\d)\/5\]\s*([\s\S]*)$/);
  if (newMatch) {
    return {
      fabricRating: parseInt(newMatch[1]),
      comfortRating: parseInt(newMatch[2]),
      servicePackagingRating: parseInt(newMatch[3]),
      cleanComment: newMatch[4].trim()
    };
  }

  const oldMatch = comment.match(/^\[Fabric:\s*(\d)\/5,\s*Comfort:\s*(\d)\/5,\s*Service:\s*(\d)\/5,\s*Package:\s*(\d)\/5\]\s*([\s\S]*)$/);
  if (oldMatch) {
    const serviceVal = parseInt(oldMatch[3]);
    const packageVal = parseInt(oldMatch[4]);
    return {
      fabricRating: parseInt(oldMatch[1]),
      comfortRating: parseInt(oldMatch[2]),
      servicePackagingRating: Math.round((serviceVal + packageVal) / 2),
      cleanComment: oldMatch[5].trim()
    };
  }

  return {
    fabricRating: null,
    comfortRating: null,
    servicePackagingRating: null,
    cleanComment: comment
  };
}

const AdminBrandReviews = () => {
    const { showAlert } = useAlert();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all'); // all, product, brand
    const [replyText, setReplyText] = useState('');
    const [notification, setNotification] = useState(null);
    const [togglingIds, setTogglingIds] = useState({});

    const showToast = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3500);
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    *,
                    products (
                        name,
                        images
                    )
                `)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setReviews(data || []);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            showAlert({ title: 'Error', message: 'Failed to fetch reviews.', type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const { error } = await supabase.from('reviews').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
            setReviews(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
            showAlert({ title: 'Updated', message: `Review status changed to ${newStatus}.`, type: 'success' });
        } catch (error) {
            console.error("Error updating status:", error);
            showAlert({ title: 'Failed', message: "Failed to update status.", type: 'danger' });
        }
    };

    const initiateDelete = (id) => {
        showAlert({
            title: 'Delete Review?',
            message: "Are you absolutely sure you want to permanently delete this customer's feedback? This action cannot be undone.",
            type: 'danger',
            confirmText: 'Yes, Delete it',
            onConfirm: async () => {
                try {
                    const { error } = await supabase.from('reviews').delete().eq('id', id);
                    if (error) throw error;
                    setReviews(prev => prev.filter(r => r.id !== id));
                    showAlert({ title: 'Deleted', message: 'Review has been removed from existence.', type: 'success' });
                } catch (error) {
                    console.error("Error deleting review:", error);
                    showAlert({ title: 'Failed', message: 'Failed to delete review.', type: 'danger' });
                }
            }
        });
    };

    const filteredReviews = reviews.filter(r => {
        const matchesStatus = filter === 'all' || r.status === filter;
        const matchesType = typeFilter === 'all' 
            ? true 
            : typeFilter === 'product' ? r.product_id !== null : r.product_id === null;
        return matchesStatus && matchesType;
    });

    const stats = {
        total: reviews.length,
        avgRating: reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 0,
        pending: reviews.filter(r => r.status === 'pending').length
    };

    return (
        <div className="flex flex-col h-full animate-fade-in-up">
            {notification && (
                <div className="fixed top-6 right-6 z-[9999] animate-fade-in-up flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/10 font-bold text-sm bg-white/90 dark:bg-[#1a1c23]/90 backdrop-blur-md border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">
                    {notification.type === 'success'
                        ? <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
                        : <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 text-red-500 flex items-center justify-center shrink-0"><AlertCircle className="w-5 h-5" /></div>}
                    <span className="max-w-xs">{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition ml-2 text-slate-400"><X className="w-4 h-4" /></button>
                </div>
            )}
            <div data-tour="reviews-header" className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Community Feedback</h1>
                    <p className="text-slate-500 text-sm font-medium">Moderate and manage reviews for products and the Bloomina brand.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                    <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0 hide-scrollbar flex-1 md:flex-none">
                        <button
                            data-tour="refresh-reviews-btn"
                            onClick={fetchReviews}
                            disabled={loading}
                            className="bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 shrink-0"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                        
                        {/* Type Filter */}
                        <div data-tour="reviews-type-filter" className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                            {['all', 'product', 'brand'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(t)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${typeFilter === t ? 'bg-[#944555] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 shrink-0 hidden md:block" />
                    </div>

                    <div data-tour="reviews-status-filter" className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                        {['all', 'pending', 'approved', 'rejected'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold capitalize whitespace-nowrap transition-all shrink-0 ${filter === f ? 'bg-[#944555] text-white shadow-lg shadow-[#944555]/20 border border-[#944555]' : 'bg-white dark:bg-[#1a1c23] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-[#944555]/30 hover:text-[#944555] dark:hover:text-[#f191a1]'}`}
                            >
                                {f} {f === 'pending' && stats.pending > 0 && `(${stats.pending})`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div data-tour="reviews-stats-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-[#15171e] p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Customer Sentiment</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            {stats.avgRating} <Star className="w-6 h-6 fill-yellow-400 text-yellow-500 animate-pulse" />
                        </h3>
                    </div>
                    <div className="w-12 h-12 bg-yellow-400/10 rounded-2xl flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
                        <Star className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white dark:bg-[#15171e] p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Voices</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.total}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-[#fff5f6] dark:bg-[#944555]/10 p-6 rounded-[28px] border border-[#944555]/20 shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-xs font-bold text-[#944555] uppercase tracking-wider mb-1">Needs Moderation</p>
                        <h3 className="text-3xl font-black text-[#944555]">{stats.pending}</h3>
                    </div>
                    <div className="w-12 h-12 bg-[#944555]/10 rounded-2xl flex items-center justify-center text-[#944555] group-hover:scale-110 transition-transform">
                        <RefreshCw className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="w-8 h-8 animate-spin text-[#944555]" />
                        <span className="font-bold text-xs uppercase tracking-widest">Fetching Community Voices...</span>
                    </div>
                </div>
            ) : filteredReviews.length === 0 ? (
                <div className="flex-1 bg-white dark:bg-[#15171e] rounded-[32px] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                        <MessageSquare className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Silence is Golden</h3>
                    <p className="text-slate-500">No feedback matches your current selection. Maybe try a different filter?</p>
                </div>
            ) : (
                <div data-tour="reviews-grid" className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredReviews.map((review) => {
                        const { fabricRating, comfortRating, servicePackagingRating, cleanComment } = parseReviewComment(review.comment);
                        return (
                            <div key={review.id} className="relative bg-white dark:bg-[#15171e] rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col hover:border-[#944555]/30 transition-all group hover:shadow-xl hover:shadow-[#944555]/5">
                            
                            {/* Product Info Tag if exists */}
                            {review.products ? (
                                <div className="flex items-center gap-2 mb-4 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-white shrink-0 border border-emerald-200">
                                        <img src={review.products.images?.[0] || 'https://placehold.co/100'} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 leading-none mb-1">Product Feedback</p>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{review.products.name}</p>
                                    </div>
                                    <ExternalLink className="w-3 h-3 text-emerald-400 ml-auto shrink-0" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mb-4 bg-[#944555]/5 px-3 py-2 rounded-xl border border-[#944555]/10">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 border border-[#944555]/20">
                                        <CheckCircle2 className="w-4 h-4 text-[#944555]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-[#944555] leading-none mb-1">Brand Feedback</p>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Bloomina Experience</p>
                                    </div>
                                </div>
                            )}

                            {/* Header */}
                            <div className="flex justify-between items-start mb-4 gap-2">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-[#944555] uppercase shrink-0">
                                        {review.customer_name.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1 pr-2">
                                        <h4 className="font-bold text-slate-900 dark:text-white truncate block w-full" title={review.customer_name}>{review.customer_name}</h4>
                                        <div className="flex gap-0.5 mt-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-500' : 'text-slate-200 dark:text-slate-700'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                 <div className="flex items-center shrink-0">
                                     <UniversalDropdown 
                                         value={review.status}
                                         onChange={(val) => updateStatus(review.id, val)}
                                         options={[
                                             { value: 'pending', label: 'Pending' },
                                             { value: 'approved', label: 'Approved' },
                                             { value: 'rejected', label: 'Rejected' }
                                         ]}
                                     />
                                 </div>
                             </div>

                             {/* Content */}
                             <div className="flex-1 space-y-4">
                                 {fabricRating !== null && (
                                     <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                                         <div>
                                             <div className="text-slate-500">Fabric</div>
                                             <div className="text-[#944555] font-black">{fabricRating}/5</div>
                                         </div>
                                         <div>
                                             <div className="text-slate-500">Comfort</div>
                                             <div className="text-[#944555] font-black">{comfortRating}/5</div>
                                         </div>
                                         <div>
                                             <div className="text-slate-500">Service</div>
                                             <div className="text-[#944555] font-black">{servicePackagingRating}/5</div>
                                         </div>
                                     </div>
                                 )}
                                 <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                                     "{cleanComment}"
                                 </p>
                             </div>

                             {/* Testimonial Display Toggle Switch */}
                             <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                 <div>
                                     <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Show in Testimonials</h5>
                                     <p className="text-[10px] text-slate-500 font-medium">Display on homepage trail</p>
                                 </div>
                                 <label htmlFor={`toggle-${review.id}`} className="relative inline-flex items-center cursor-pointer">
                                     <input 
                                         id={`toggle-${review.id}`}
                                         type="checkbox" 
                                         className="sr-only peer" 
                                         checked={review.show_on_home || false}
                                         disabled={togglingIds[review.id] || false}
                                         onChange={async (e) => {
                                             if (togglingIds[review.id]) return;
                                             const newStatus = e.target.checked;
                                             
                                             // Optimistic UI Update
                                             setReviews(prev => prev.map(r => r.id === review.id ? { ...r, show_on_home: newStatus } : r));
                                             setTogglingIds(prev => ({ ...prev, [review.id]: true }));
                                             
                                             try {
                                                 const { error } = await supabase.from('reviews').update({ show_on_home: newStatus }).eq('id', review.id);
                                                 if (error) throw error;
                                                 showToast(newStatus ? 'Added to homepage testimonials!' : 'Removed from homepage testimonials.');
                                             } catch (err) {
                                                 // Rollback on failure
                                                 setReviews(prev => prev.map(r => r.id === review.id ? { ...r, show_on_home: !newStatus } : r));
                                                 showAlert({ title: 'Failed', message: 'Toggle failed: ' + err.message, type: 'danger' });
                                             } finally {
                                                 setTogglingIds(prev => ({ ...prev, [review.id]: false }));
                                             }
                                         }} 
                                     />
                                     <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#944555] peer-disabled:opacity-50"></div>
                                 </label>
                             </div>

                             {/* Divider */}
                             <hr className="my-5 border-slate-100 dark:border-slate-800" />

                            {/* Footer / Meta */}
                            <div className="mt-auto flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted On</span>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                        {new Date(review.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => initiateDelete(review.id)} 
                                    className="p-2.5 text-slate-300 hover:bg-red-50 hover:text-red-500 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    title="Delete Review"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                        </div>
                        );
                    })}
                </div>
            )}

        </div>
    );
};

export default AdminBrandReviews;
