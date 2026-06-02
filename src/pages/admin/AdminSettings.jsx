import React, { useState, useEffect } from 'react';
import { 
    Settings, Save, Store, ShieldCheck, Bell, User, Globe, Key, 
    Smartphone, Camera, ShoppingBag, Boxes, MessageSquare, 
    RefreshCw, ChevronRight, Lock, Mail, Smartphone as PhoneIcon
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const AdminSettings = () => {
    const { showAlert } = useAlert();
    const { adminUser } = useAdminAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    
    const [settings, setSettings] = useState({
        store_name: 'Bloomina',
        support_email: 'support@bloomina.in',
        support_phone: '+91 800-BLOOMINA',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        notify_orders: true,
        notify_inventory: true,
        notify_customers: false,
    });

    const [profile, setProfile] = useState({
        full_name: '',
        email: '',
        phone: '',
        avatar_url: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch everything in parallel
            const [configRes, profileRes] = await Promise.all([
                supabase.from('system_config').select('*'),
                adminUser?.id ? supabase.from('profiles').select('*').eq('id', adminUser.id).maybeSingle() : Promise.resolve({ data: null })
            ]);

            // 1. Handle Store Config
            if (configRes && configRes.data) {
                const configMap = {};
                configRes.data.forEach(item => { 
                    if (item && item.key) configMap[item.key] = item.value; 
                });
                
                if (configMap.store_settings) {
                    const storeSettings = typeof configMap.store_settings === 'string' 
                        ? JSON.parse(configMap.store_settings) 
                        : configMap.store_settings;
                    setSettings(prev => ({ ...prev, ...(storeSettings || {}) }));
                }
            }

            // 2. Handle Profile Data
            if (profileRes?.data) {
                setProfile({
                    full_name: profileRes.data.full_name || '',
                    email: profileRes.data.email || adminUser?.email || '',
                    phone: profileRes.data.phone || '',
                    avatar_url: profileRes.data.avatar_url || ''
                });
            } else if (adminUser) {
                setProfile(prev => ({ ...prev, email: adminUser.email || '' }));
            }

            setLastUpdated(new Date());
        } catch (err) {
            console.error('[Settings] Load failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [adminUser?.id]); // Re-fetch if admin user context changes

    const handleSave = async () => {
        try {
            setSaving(true);
            
            // 1. Save Store Settings
            const { error: configError } = await supabase
                .from('system_config')
                .upsert({
                    key: 'store_settings',
                    value: settings,
                    updated_by: adminUser?.id,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (configError) throw configError;

            // 2. Save Profile (if user exists)
            if (adminUser?.id) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: profile.full_name,
                        phone: profile.phone,
                        avatar_url: profile.avatar_url
                    })
                    .eq('id', adminUser.id);
                
                if (profileError) throw profileError;
            }

            showAlert({
                title: 'Workspace Synchronized',
                message: 'System parameters and profile data have been successfully committed.',
                type: 'success'
            });
            setLastUpdated(new Date());

        } catch (err) {
            console.error('[Settings] Save failed:', err);
            showAlert({
                title: 'Synchronization Error',
                message: err.message || 'Failed to update system configurations.',
                type: 'danger'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpdate = () => {
        showAlert({
            title: 'Update Profile Image',
            message: 'Please choose a professional photo from your computer.',
            type: 'info',
            showInput: true,
            inputType: 'file',
            confirmText: 'Upload Photo',
            onConfirm: async (file) => {
                if (!adminUser?.id) {
                    showAlert({ title: 'Auth Error', message: 'Your administrator session is not fully verified. Please reload.', type: 'danger' });
                    return;
                }
                if (!file || !(file instanceof File)) {
                    showAlert({ title: 'Selection Error', message: 'No valid image file was selected.', type: 'warning' });
                    return;
                }

                try {
                    setSaving(true);
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${adminUser.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                    const filePath = `admin/${fileName}`;

                    // Upload to Supabase Storage
                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(filePath, file, { upsert: true });

                    if (uploadError) throw uploadError;

                    // Get Public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath);

                    setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
                    
                    // Auto-save the profile update to database
                    await supabase
                        .from('profiles')
                        .update({ avatar_url: publicUrl })
                        .eq('id', adminUser.id);
                    
                    showAlert({
                        title: 'Upload Successful',
                        message: 'Your profile photo has been synchronized and saved to your account.',
                        type: 'success'
                    });

                } catch (err) {
                    console.error('Upload failed:', err);
                    showAlert({ title: 'Upload Failed', message: err.message, type: 'danger' });
                } finally {
                    setSaving(false);
                }
            }
        });
    };

    const handlePasswordReset = async () => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
                redirectTo: `${window.location.origin}/admin/reset-password`,
            });
            if (error) throw error;
            showAlert({
                title: 'Security Link Sent',
                message: `Encryption reset protocol dispatched to ${profile.email}`,
                type: 'success'
            });
        } catch (err) {
            showAlert({ title: 'Auth Error', message: err.message, type: 'danger' });
        }
    };

    const tabs = [
        { id: 'general', name: 'General', icon: Store, desc: 'Store identity and locale' },
        { id: 'security', name: 'Security', icon: ShieldCheck, desc: 'Access and authentication' },
        { id: 'notifications', name: 'Notifications', icon: Bell, desc: 'Operational alerts' },
        { id: 'account', name: 'My Account', icon: User, desc: 'Personal administrator profile' },
    ];

    if (loading && !settings.store_name) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-6 animate-pulse">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-[#944555]/10 border-t-[#944555] rounded-full animate-spin"></div>
                    <Settings className="w-6 h-6 text-[#944555] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                </div>
                <div className="text-center">
                    <p className="text-slate-900 dark:text-white font-black text-lg uppercase tracking-tight">Syncing Settings</p>
                    <p className="text-slate-500 text-sm font-medium">Please wait while we calibrate your workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in-up pb-12 max-w-6xl mx-auto">
            {/* Standardized Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 data-tour="settings-header" className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-3">
                        <Settings className="w-7 h-7 text-[#944555]" />
                        Global Configuration
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Manage system-wide operational parameters</p>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Sync: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        data-tour="refresh-settings-btn"
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-[#944555] transition-all shadow-sm active:scale-95 group disabled:opacity-50"
                        title="Refresh Settings"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    </button>
                    <button 
                        data-tour="save-settings-btn"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#944555] text-white font-black text-sm hover:bg-[#7d3a47] transition-all shadow-lg shadow-[#944555]/20 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{saving ? 'Synchronizing...' : 'Save Configuration'}</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Modern Sidebar Tabs */}
                <div data-tour="settings-tabs" className="w-full lg:w-80 shrink-0 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-[20px] transition-all group relative overflow-hidden ${activeTab === tab.id
                                ? 'bg-white dark:bg-[#15171e] text-[#944555] shadow-xl shadow-black/5 border-l-4 border-l-[#944555]'
                                : 'text-slate-500 hover:bg-white/50 dark:hover:bg-white/5'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${activeTab === tab.id ? 'bg-[#944555]/10 text-[#944555]' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600'}`}>
                                <tab.icon className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className={`font-black text-sm uppercase tracking-tight ${activeTab === tab.id ? 'text-slate-900 dark:text-white' : ''}`}>{tab.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter line-clamp-1">{tab.desc}</p>
                            </div>
                            {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div data-tour="settings-content" className="flex-1 bg-white dark:bg-[#15171e] rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-8 lg:p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#944555]/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    
                    {activeTab === 'general' && (
                        <div className="space-y-8 animate-fade-in relative z-10">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-6 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-[#fff5f6] dark:bg-[#944555]/10 flex items-center justify-center text-[#944555]">
                                    <Store className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Store Identity</h2>
                                    <p className="text-xs text-slate-500 font-medium">Public facing branding and communication details</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Entity Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Globe className="w-4 h-4 text-slate-300 group-focus-within:text-[#944555] transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            value={settings.store_name}
                                            onChange={(e) => setSettings({...settings, store_name: e.target.value})}
                                            className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#944555] focus:ring-4 focus:ring-[#944555]/5 transition-all"
                                            placeholder="e.g. Bloomina India"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Support Email</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="w-4 h-4 text-slate-300 group-focus-within:text-[#944555] transition-colors" />
                                            </div>
                                            <input
                                                type="email"
                                                value={settings.support_email}
                                                onChange={(e) => setSettings({...settings, support_email: e.target.value})}
                                                className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#944555] focus:ring-4 focus:ring-[#944555]/5 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <PhoneIcon className="w-4 h-4 text-slate-300 group-focus-within:text-[#944555] transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                value={settings.support_phone}
                                                onChange={(e) => setSettings({...settings, support_phone: e.target.value})}
                                                className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#944555] focus:ring-4 focus:ring-[#944555]/5 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-[#944555] rounded-full"></div>
                                        Regional Parameters
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Store Currency</label>
                                            <select 
                                                value={settings.currency}
                                                onChange={(e) => setSettings({...settings, currency: e.target.value})}
                                                className="w-full px-4 py-4 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#944555] transition-all cursor-pointer"
                                            >
                                                <option value="INR">Indian Rupee (₹)</option>
                                                <option value="USD">US Dollar ($)</option>
                                                <option value="EUR">Euro (€)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Store Timezone</label>
                                            <select 
                                                value={settings.timezone}
                                                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                                                className="w-full px-4 py-4 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#944555] transition-all cursor-pointer"
                                            >
                                                <option value="Asia/Kolkata">(GMT+05:30) India Standard Time</option>
                                                <option value="UTC">Coordinated Universal Time (UTC)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-8 animate-fade-in relative z-10">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-6 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Security Hardening</h2>
                                    <p className="text-xs text-slate-500 font-medium">Authentication protocols and access control</p>
                                </div>
                            </div>

                            <div className="p-8 rounded-[32px] bg-slate-50 dark:bg-[#0f111a] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-8 group">
                                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#15171e] shadow-xl flex items-center justify-center text-[#944555] group-hover:scale-110 transition-transform">
                                    <Key className="w-8 h-8" />
                                </div>
                                <div className="text-center md:text-left flex-1">
                                    <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight uppercase">Credentials Management</h3>
                                    <p className="text-sm text-slate-500 font-medium mb-4">Request a secure password reset link to your registered email.</p>
                                    <button 
                                        onClick={handlePasswordReset}
                                        className="px-6 py-3 bg-[#944555] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#7d3a47] transition-all shadow-lg shadow-[#944555]/20 active:scale-95"
                                    >
                                        Initiate Reset Protocol
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                                    Active Sessions
                                </h3>
                                <div className="flex items-center justify-between p-6 bg-white dark:bg-[#15171e] border border-slate-100 dark:border-slate-800 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <Smartphone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Standard Desktop Access</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Connection • Just Now</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-lg tracking-widest">Connected</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-8 animate-fade-in relative z-10">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-6 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600">
                                    <Bell className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Event Triggers</h2>
                                    <p className="text-xs text-slate-500 font-medium">Operational alert routing and frequency</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { id: 'notify_orders', label: 'Order Execution Alerts', desc: 'Critical notification on every new successful transaction.', icon: ShoppingBag, color: 'text-rose-500', bg: 'bg-rose-50' },
                                    { id: 'notify_inventory', label: 'Inventory Depletion Warnings', desc: 'Stock threshold monitoring and low quantity alerts.', icon: Boxes, color: 'text-orange-500', bg: 'bg-orange-50' },
                                    { id: 'notify_customers', label: 'Lead & Inquiry Routing', desc: 'Real-time sync for new customer support messages.', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-[#0f111a] rounded-[28px] border border-slate-100 dark:border-slate-800 group hover:border-[#944555]/30 transition-all">
                                        <div className="flex gap-5 items-center">
                                            <div className={`w-12 h-12 rounded-2xl ${item.bg} dark:bg-slate-800 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                                                <item.icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.label}</h4>
                                                <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSettings({...settings, [item.id]: !settings[item.id]})}
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none ${settings[item.id] ? 'bg-[#944555] shadow-lg shadow-[#944555]/30' : 'bg-slate-300 dark:bg-slate-700'}`}
                                        >
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings[item.id] ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div className="space-y-10 animate-fade-in relative z-10">
                            <div className="flex flex-col sm:flex-row items-center gap-8 mb-12 bg-slate-50 dark:bg-[#0f111a] p-8 rounded-[40px] border border-slate-100 dark:border-slate-800">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-[40px] bg-white dark:bg-[#15171e] flex items-center justify-center overflow-hidden border-8 border-white dark:border-[#15171e] shadow-2xl transition-transform group-hover:scale-105">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-12 h-12 text-slate-300" />
                                        )}
                                    </div>
                                    <button 
                                        onClick={handleAvatarUpdate}
                                        className="absolute -bottom-2 -right-2 p-3 bg-[#944555] text-white rounded-2xl shadow-xl hover:scale-110 transition-transform active:scale-95"
                                    >
                                        <Camera className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="text-center sm:text-left flex-1">
                                    <p className="text-[10px] font-black text-[#944555] uppercase tracking-[0.2em] mb-1">Authenticated Admin</p>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">{profile.full_name || 'Administrator'}</h3>
                                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{profile.email}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Alias</label>
                                    <input
                                        type="text"
                                        value={profile.full_name}
                                        onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                                        className="w-full px-4 py-4 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#944555] transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Terminal</label>
                                    <input
                                        type="text"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                                        className="w-full px-4 py-4 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#944555] transition-all"
                                        placeholder="+91 00000 00000"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;


