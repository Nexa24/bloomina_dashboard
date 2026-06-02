import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, Zap, Key, Smartphone, Globe, RefreshCw, Save, CheckCircle2, AlertCircle, Info, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AdminPayments = () => {
    const [config, setConfig] = useState({
        razorpay_key_id: '',
        razorpay_key_secret: '',
        razorpay_mode: 'test',
        upi_id: 'Bloomina@ybl',
        phonepe_merchant_id: '',
        whatsapp_payments_enabled: true,
        cod_enabled: true,
        cod_min_order: 500
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('system_config')
                .select('*')
                .eq('key', 'payment_gateway_config')
                .single();
            
            if (data?.value) {
                setConfig(data.value);
            }
        } catch (err) {
            console.error('Error fetching payment config:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { error } = await supabase
                .from('system_config')
                .upsert({ 
                    key: 'payment_gateway_config', 
                    value: config,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (error) throw error;
            showToast('Payment settings updated successfully');
        } catch (err) {
            showToast('Failed to save settings: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <RefreshCw className="w-8 h-8 text-[#944555] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up pb-20">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-24 right-8 z-50 flex items-center gap-2 px-6 py-3 rounded-2xl shadow-2xl border animate-fade-in-up ${
                    toast.type === 'success' ? 'bg-[#944555] text-white' : 'bg-red-500 text-white'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span className="text-sm font-bold">{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div data-tour="payments-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Payment Gateways</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Configure secure checkout and transaction protocols.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        data-tour="refresh-payments-btn"
                        onClick={fetchConfig}
                        disabled={loading}
                        className="bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                    <button 
                        data-tour="save-payments-btn"
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 bg-[#944555] hover:bg-[#7d3a47] text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-[#944555]/25 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Publish Configuration
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Config Area */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Razorpay Section */}
                    <div data-tour="razorpay-config-card" className="bg-white dark:bg-[#1a1c23] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <Zap className="w-32 h-32 text-[#944555]" />
                        </div>
                        
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Razorpay Integration</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Primary Payment Gateway</p>
                            </div>
                            <div className="ml-auto">
                                <div className="flex bg-slate-100 dark:bg-black/40 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <button 
                                        type="button"
                                        onClick={() => setConfig({...config, razorpay_mode: 'test'})}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            config.razorpay_mode === 'test' 
                                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        Test Mode
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setConfig({...config, razorpay_mode: 'live'})}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            config.razorpay_mode === 'live' 
                                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        Live Production
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Key ID</label>
                                <div className="relative group/input">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-[#944555] transition-colors">
                                        <Key className="w-4 h-4" />
                                    </div>
                                    <input 
                                        type="text"
                                        value={config.razorpay_key_id}
                                        onChange={(e) => setConfig({...config, razorpay_key_id: e.target.value})}
                                        placeholder="rzp_test_..."
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-[#944555]/10 transition-all outline-none"
                                    />
                                </div>
                                {config.razorpay_key_id && (
                                    <div className="px-1 mt-2">
                                        {config.razorpay_mode === 'live' && config.razorpay_key_id.startsWith('rzp_test_') && (
                                            <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1.5 animate-pulse">
                                                <AlertCircle className="w-3 h-3" /> Warning: You are using a TEST key in LIVE mode.
                                            </p>
                                        )}
                                        {config.razorpay_mode === 'test' && config.razorpay_key_id.startsWith('rzp_live_') && (
                                            <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1.5 animate-pulse">
                                                <AlertCircle className="w-3 h-3" /> Warning: You are using a LIVE key in TEST mode.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Key Secret</label>
                                <div className="relative group/input">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-[#944555] transition-colors">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input 
                                        type="password"
                                        value={config.razorpay_key_secret}
                                        onChange={(e) => setConfig({...config, razorpay_key_secret: e.target.value})}
                                        placeholder="••••••••••••••••"
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-[#944555]/10 transition-all outline-none"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 italic px-1 flex items-center gap-1.5 mt-2">
                                    <Info className="w-3 h-3" /> Never share your Key Secret. Encrypted at rest in Bloomina secure vault.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Direct UPI / PhonePe Section */}
                    <div data-tour="upi-config-card" className="bg-white dark:bg-[#1a1c23] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Direct UPI & PhonePe</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fallback / Direct Transfer</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Business UPI ID</label>
                                <input 
                                    type="text"
                                    value={config.upi_id}
                                    onChange={(e) => setConfig({...config, upi_id: e.target.value})}
                                    placeholder="merchant@upi"
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-[#944555]/10 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">PhonePe Merchant ID</label>
                                <input 
                                    type="text"
                                    value={config.phonepe_merchant_id}
                                    onChange={(e) => setConfig({...config, phonepe_merchant_id: e.target.value})}
                                    placeholder="PHPE_M_8829..."
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-[#944555]/10 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Sidebar Controls */}
                <div className="space-y-6">
                    
                    {/* Status & Security Card */}
                    <div data-tour="security-badge-card" className="bg-[#944555] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-[#944555]/20">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h4 className="text-xl font-black mb-2">Secure Gateway</h4>
                            <p className="text-white/70 text-sm font-medium leading-relaxed mb-6">
                                All payment credentials are encrypted using industry-standard AES-256 before being stored.
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-wider">SSL Encryption Active</span>
                                </div>
                                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10">
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                    <span className="text-[10px] font-black uppercase tracking-wider">PCI Compliance Ready</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Method Toggles */}
                    <div data-tour="toggles-config-card" className="bg-white dark:bg-[#1a1c23] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                             Methods & Rules
                        </h4>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-slate-900 dark:text-white">Cash on Delivery</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Allow COD payments</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={config.cod_enabled}
                                        onChange={(e) => setConfig({...config, cod_enabled: e.target.checked})}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#944555] rounded-full"></div>
                                </label>
                            </div>

                            {config.cod_enabled && (
                                <div className="p-4 bg-[#fff5f6] dark:bg-[#944555]/5 rounded-2xl border border-[#944555]/10 animate-fade-in">
                                    <label className="text-[10px] font-black text-[#944555] uppercase tracking-widest mb-2 block">Min. Order Value for COD</label>
                                    <div className="relative">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 font-bold text-[#944555]">₹</span>
                                        <input 
                                            type="number"
                                            value={config.cod_min_order}
                                            onChange={(e) => setConfig({...config, cod_min_order: parseInt(e.target.value)})}
                                            className="w-full bg-transparent border-none focus:ring-0 pl-4 py-0 text-lg font-black text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-slate-900 dark:text-white">WhatsApp Orders</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Process via chat</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={config.whatsapp_payments_enabled}
                                        onChange={(e) => setConfig({...config, whatsapp_payments_enabled: e.target.checked})}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#944555] rounded-full"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Developer Info */}
                    <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-3xl text-center">
                         <div className="flex justify-center mb-3">
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400">
                                <Globe className="w-5 h-5" />
                            </div>
                         </div>
                         <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Webhooks Required</h5>
                         <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                            To process orders automatically, ensure you have pointed your Razorpay webhooks to:<br/>
                            <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded mt-1 inline-block font-mono">https://bloomina.in/api/webhooks</code>
                         </p>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default AdminPayments;
