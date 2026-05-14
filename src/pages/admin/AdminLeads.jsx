import React, { useState, useEffect } from 'react';
import { Search, Filter, Mail, Phone, MoreVertical, Eye, Trash2, CheckCircle2, X, RefreshCw, ChevronRight, MessageSquare, Clock, User, ArrowRight, ShoppingBag, Boxes } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';

const AdminLeads = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const { showAlert } = useAlert();
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLeads(data || []);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Error fetching leads:", err);
            showAlert({ 
                title: 'Error', 
                message: 'Failed to load inquiries. Ensure the leads table exists in your database.', 
                type: 'danger',
                showCancel: false,
                confirmText: 'Dismiss'
            });
        }
        setIsLoading(false);
    };

    const updateLeadStatus = async (id, status) => {
        try {
            const { error } = await supabase
                .from('leads')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
            if (selectedLead?.id === id) {
                setSelectedLead(prev => ({ ...prev, status }));
            }
            showAlert({ title: 'Success', message: `Lead marked as ${status}`, type: 'success' });
        } catch (err) {
            showAlert({ title: 'Error', message: err.message, type: 'danger' });
        }
    };

    const deleteLead = async (id) => {
        showAlert({
            title: 'Delete Inquiry?',
            message: 'Are you sure you want to remove this customer inquiry? This action cannot be undone.',
            type: 'warning',
            confirmText: 'Confirm Delete',
            onConfirm: async () => {
                try {
                    const { error } = await supabase.from('leads').delete().eq('id', id);
                    if (error) throw error;
                    setLeads(prev => prev.filter(l => l.id !== id));
                    setIsDetailsOpen(false);
                    showAlert({ title: 'Success', message: 'Inquiry deleted.', type: 'success' });
                } catch (err) {
                    showAlert({ title: 'Delete Failed', message: err.message, type: 'danger' });
                }
            }
        });
    };

    const filteredLeads = leads.filter(l => {
        const matchesSearch = 
            (l.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (l.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (l.message?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: leads.length,
        new: leads.filter(l => l.status === 'new').length,
        responded: leads.filter(l => l.status === 'responded').length
    };

    return (
        <div className="space-y-6 animate-fade-in relative pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Contact Inquiries</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Manage customer leads and feedback</p>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Sync: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={fetchLeads}
                    disabled={isLoading}
                    className="bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:border-[#944555] text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 active:scale-95 group"
                >
                    <RefreshCw className={`w-4 h-4 text-[#944555] ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} /> 
                    <span>Refresh Feed</span>
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { title: 'Total Inquiries', value: stats.total, icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-500/10' },
                    { title: 'New Leads', value: stats.new, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/10' },
                    { title: 'Responded', value: stats.responded, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-[#1a1c23] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.title}</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{isLoading ? '...' : stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Leads Table Container */}
            <div className="bg-white dark:bg-[#1a1c23] rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search name, email, or message..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-[#944555] dark:focus:border-[#944555] text-slate-900 dark:text-white transition-colors shadow-inner"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'new', 'responded', 'archived'].map(f => (
                            <button 
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${statusFilter === f ? 'bg-[#944555] text-white shadow-md shadow-[#944555]/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-[#0f111a]/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                                <th className="p-4">Customer Info</th>
                                <th className="p-4">Subject/Type</th>
                                <th className="p-4">Message Snippet</th>
                                <th className="p-4 text-center">Date</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="p-4"><div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center">
                                        <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-500 font-bold">No inquiries found</p>
                                    </td>
                                </tr>
                            ) : filteredLeads.map((lead) => (
                                <tr key={lead.id} className="group hover:bg-slate-50 dark:hover:bg-[#0f111a]/50 transition-all cursor-pointer" onClick={() => { setSelectedLead(lead); setIsDetailsOpen(true); }}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 shrink-0">
                                                {(lead.name || 'L').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-900 dark:text-white group-hover:text-[#944555] transition-colors">{lead.name}</span>
                                                <p className="text-[10px] text-slate-500 font-bold">{lead.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{lead.type || 'General Inquiry'}</span>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">{lead.message}</p>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{new Date(lead.created_at).toLocaleDateString()}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md ${
                                            lead.status === 'responded' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                                            lead.status === 'archived' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                                            'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                        }`}>
                                            {lead.status || 'New'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button className="p-2 text-slate-400 hover:text-[#944555] hover:bg-[#944555]/10 rounded-lg transition-colors">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Lead Details Side Panel */}
            {isDetailsOpen && selectedLead && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsDetailsOpen(false)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1c23] h-full shadow-2xl flex flex-col border-l border-white/20 dark:border-slate-800 animate-slide-left overflow-y-auto">
                        
                        <div className="p-8 pb-4 relative">
                            <button onClick={() => setIsDetailsOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                            
                            <div className="mt-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-black uppercase mb-4">
                                    <Clock className="w-3 h-3" /> Inquiry Received
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{selectedLead.type || 'General Inquiry'}</h2>
                                <p className="text-slate-500 font-bold mt-1">From {selectedLead.name} • {new Date(selectedLead.created_at).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="p-8 space-y-8 flex-1">
                            {/* Contact Info Card */}
                            <div className="bg-slate-50 dark:bg-[#0f111a] p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-[#1a1c23] rounded-2xl flex items-center justify-center text-[#944555] shadow-sm">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">{selectedLead.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Message Content */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Message Content</h3>
                                <div className="p-6 bg-white dark:bg-[#1a1c23] rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm italic text-slate-600 dark:text-slate-300 leading-relaxed">
                                    "{selectedLead.message}"
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider text-center">Inquiry Management</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedLead.status !== 'responded' && (
                                        <button 
                                            onClick={() => updateLeadStatus(selectedLead.id, 'responded')}
                                            className="flex-1 min-w-[140px] py-3 bg-[#944555] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#944555]/20"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Mark as Responded
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => updateLeadStatus(selectedLead.id, 'archived')}
                                        className="flex-1 min-w-[140px] py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                    >
                                        <ArrowRight className="w-4 h-4" /> Archive Lead
                                    </button>
                                </div>
                                <button 
                                    onClick={() => deleteLead(selectedLead.id)}
                                    className="w-full py-3 text-rose-500 font-bold text-xs hover:underline flex items-center justify-center gap-1"
                                >
                                    <Trash2 className="w-3 h-3" /> Delete Permanently
                                </button>
                                <a 
                                    href={`mailto:${selectedLead.email}?subject=Re: ${selectedLead.type || 'Inquiry'}`}
                                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                                >
                                    Reply via Email <Mail className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLeads;
