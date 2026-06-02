import React, { useState, useEffect } from 'react';
import { Megaphone, Rocket, LayoutTemplate, MousePointer2, Calendar, Trash2, MessageSquare, Plus, X, Globe, Search, Filter, AlertCircle, CheckCircle2, Edit3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';

const AdminMarketing = () => {
    const { showAlert } = useAlert();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [seoConfig, setSeoConfig] = useState({
        site_title: '',
        meta_description: '',
        keywords: '',
        robots_txt: 'User-agent: *\nAllow: /'
    });
    const [newCampaign, setNewCampaign] = useState({
        title: '',
        status: 'Scheduled',
        type: 'Social Media',
        ctr: '-',
        spends: '₹0'
    });

    useEffect(() => {
        fetchMarketingData();
    }, []);

    const fetchMarketingData = async () => {
        setLoading(true);
        try {
            // Fetch Campaigns
            const { data: campaignData, error: campaignError } = await supabase
                .from('marketing_campaigns')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (campaignError) throw campaignError;
            setCampaigns(campaignData || []);

            // Fetch SEO Config from system_config
            const { data: seoData } = await supabase
                .from('system_config')
                .select('value')
                .eq('key', 'seo_settings')
                .single();
            
            if (seoData?.value) {
                setSeoConfig(seoData.value);
            }
        } catch (err) {
            console.error('Failed to fetch marketing data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('marketing_campaigns')
                .insert([newCampaign])
                .select();

            if (error) throw error;

            setCampaigns([data[0], ...campaigns]);
            setIsAdding(false);
            setNewCampaign({ title: '', status: 'Scheduled', type: 'Social Media', ctr: '-', spends: '₹0' });
            showAlert({ title: 'Success', message: 'Campaign launched successfully!', type: 'success' });
        } catch (err) {
            showAlert({ title: 'Error', message: err.message, type: 'danger' });
        }
    };

    const handleUpdateCampaign = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('marketing_campaigns')
                .update({
                    title: editingCampaign.title,
                    status: editingCampaign.status,
                    type: editingCampaign.type,
                    ctr: editingCampaign.ctr,
                    spends: editingCampaign.spends
                })
                .eq('id', editingCampaign.id);

            if (error) throw error;

            setCampaigns(campaigns.map(c => c.id === editingCampaign.id ? editingCampaign : c));
            setEditingCampaign(null);
            showAlert({ title: 'Success', message: 'Campaign updated successfully!', type: 'success' });
        } catch (err) {
            showAlert({ title: 'Error', message: err.message, type: 'danger' });
        }
    };

    const handleDeleteCampaign = async (id) => {
        showAlert({
            title: 'Delete Campaign?',
            message: 'Are you sure you want to remove this marketing campaign? This cannot be undone.',
            type: 'warning',
            confirmText: 'Delete Campaign',
            onConfirm: async () => {
                try {
                    const { error } = await supabase
                        .from('marketing_campaigns')
                        .delete()
                        .eq('id', id);

                    if (error) throw error;

                    setCampaigns(campaigns.filter(c => c.id !== id));
                    showAlert({ title: 'Removed', message: 'Campaign deleted.', type: 'success' });
                } catch (err) {
                    showAlert({ title: 'Error', message: err.message, type: 'danger' });
                }
            }
        });
    };

    const handleUpdateSEO = async () => {
        try {
            const { error } = await supabase
                .from('system_config')
                .upsert({ 
                    key: 'seo_settings', 
                    value: seoConfig 
                });

            if (error) throw error;
            showAlert({ title: 'SEO Updated', message: 'Global search settings saved.', type: 'success' });
        } catch (err) {
            showAlert({ title: 'Error', message: err.message, type: 'danger' });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative pb-20">
            <div data-tour="marketing-header" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Marketing & Growth</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Launch and track promotional campaigns</p>
                </div>
                <button 
                    data-tour="create-campaign-btn"
                    onClick={() => setIsAdding(true)}
                    className="bg-[#944555] hover:bg-[#7d3a47] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-md shadow-[#944555]/20 flex items-center gap-2"
                >
                    <Rocket className="w-4 h-4" /> New Campaign
                </button>
            </div>

            {/* Campaign Grid */}
            <div data-tour="campaign-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                    ))
                ) : campaigns.length === 0 ? (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                        <Megaphone className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-bold">No active campaigns. Launch one to see results.</p>
                    </div>
                ) : (
                    campaigns.map((campaign) => (
                        <div key={campaign.id} className="bg-white dark:bg-[#1a1c23] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm relative overflow-hidden group hover:border-[#944555] transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                    <Megaphone className="w-5 h-5" />
                                </div>
                                <div className="flex gap-2">
                                    <span className={`px-2.5 py-1 text-[10px] uppercase font-black tracking-wider rounded-md ${
                                        campaign.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                                        campaign.status === 'Scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                        'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
                                    }`}>
                                        {campaign.status}
                                    </span>
                                    <button 
                                        onClick={() => setEditingCampaign(campaign)}
                                        className="p-1 text-slate-300 hover:text-indigo-500 transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteCampaign(campaign.id)}
                                        className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight mb-1">{campaign.title}</h3>
                            <p className="text-slate-500 text-xs font-medium mb-4">{campaign.type}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">CTR / Conv.</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{campaign.ctr}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Spends</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{campaign.spends}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Campaign Modal (Add/Edit) */}
            {(isAdding || editingCampaign) && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#1a1c23] w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 scale-in">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="font-black text-slate-900 dark:text-white text-lg">
                                {isAdding ? 'Launch New Campaign' : 'Edit Campaign'}
                            </h3>
                            <button 
                                onClick={() => {
                                    setIsAdding(false);
                                    setEditingCampaign(null);
                                }} 
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={isAdding ? handleCreateCampaign : handleUpdateCampaign} className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Campaign Title</label>
                                <input 
                                    required
                                    type="text"
                                    value={isAdding ? newCampaign.title : editingCampaign.title}
                                    onChange={(e) => isAdding ? setNewCampaign({...newCampaign, title: e.target.value}) : setEditingCampaign({...editingCampaign, title: e.target.value})}
                                    placeholder="e.g. Winter Collection Launch"
                                    className="w-full bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Campaign Type</label>
                                    <select 
                                        value={isAdding ? newCampaign.type : editingCampaign.type}
                                        onChange={(e) => isAdding ? setNewCampaign({...newCampaign, type: e.target.value}) : setEditingCampaign({...editingCampaign, type: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555]"
                                    >
                                        <option>Social Media</option>
                                        <option>Banner Ad</option>
                                        <option>WhatsApp Push</option>
                                        <option>Influencer</option>
                                        <option>Email Blast</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Initial Status</label>
                                    <select 
                                        value={isAdding ? newCampaign.status : editingCampaign.status}
                                        onChange={(e) => isAdding ? setNewCampaign({...newCampaign, status: e.target.value}) : setEditingCampaign({...editingCampaign, status: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555]"
                                    >
                                        <option>Scheduled</option>
                                        <option>Active</option>
                                        <option>Automated</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Budget Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                                        <input 
                                            required
                                            type="number"
                                            value={isAdding ? newCampaign.spends.replace('₹', '') : editingCampaign.spends.replace('₹', '')}
                                            onChange={(e) => isAdding ? setNewCampaign({...newCampaign, spends: `₹${e.target.value}`}) : setEditingCampaign({...editingCampaign, spends: `₹${e.target.value}`})}
                                            placeholder="0"
                                            className="w-full bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Est. CTR / Conv.</label>
                                    <input 
                                        type="text"
                                        value={isAdding ? newCampaign.ctr : editingCampaign.ctr}
                                        onChange={(e) => isAdding ? setNewCampaign({...newCampaign, ctr: e.target.value}) : setEditingCampaign({...editingCampaign, ctr: e.target.value})}
                                        placeholder="e.g. 4.2%"
                                        className="w-full bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555]"
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit"
                                className="w-full py-4 bg-[#944555] hover:bg-[#7d3a47] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-[#944555]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Rocket className="w-4 h-4" /> {isAdding ? 'Deploy Campaign' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMarketing;




