import React, { useState, useEffect } from 'react';
import { Database, Shield, Server, Terminal, Lock, Plug, Activity, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AdminSystem = () => {
    const [config, setConfig] = useState(null);
    const [logs, setLogs] = useState([]);
    const [storageUsage, setStorageUsage] = useState({ 
        files: { used: 0, total: 500 * 1024 * 1024 }, 
        db: { used: 0, total: 500 * 1024 * 1024 } 
    });
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [toast, setToast] = useState(null);

    const [lastUpdated, setLastUpdated] = useState(new Date());
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'brhjzpzdlkbqhtaqoyjw';

    useEffect(() => {
        fetchSystemData();
        
        // Subscribe to real-time logs
        const logsSubscription = supabase
            .channel('system_logs_feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, (payload) => {
                setLogs(prev => [payload.new, ...prev].slice(0, 50));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(logsSubscription);
        };
    }, []);

    const fetchSystemData = async () => {
        try {
            setLoading(true);
            // Fetch Config
            const { data: configData } = await supabase
                .from('system_config')
                .select('*');
            
            const configMap = {};
            configData?.forEach(item => {
                configMap[item.key] = item.value;
            });
            setConfig(configMap);

            // Fetch Recent Logs
            const { data: logData } = await supabase
                .from('system_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);
            
            setLogs(logData || []);

            // Fetch Real Storage Usage (Files)
            const { data: storageBytes } = await supabase.rpc('get_storage_usage');
            
            // Fetch Real Database Size
            const { data: dbBytes } = await supabase.rpc('get_database_size');

            setStorageUsage({
                files: { used: storageBytes || 0, total: 500 * 1024 * 1024 },
                db: { used: dbBytes || 0, total: 500 * 1024 * 1024 }
            });
            setLastUpdated(new Date());

        } catch (err) {
            console.error('Failed to fetch system data:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleStorefront = async () => {
        const currentStatus = config?.storefront_status || { online: true, message: 'We are currently performing scheduled maintenance. Please check back soon!' };
        
        const newValue = { 
            ...currentStatus, 
            online: !currentStatus.online 
        };

        try {
            const { error } = await supabase
                .from('system_config')
                .upsert({ 
                    key: 'storefront_status',
                    value: newValue,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            
            setConfig(prev => ({ ...prev, storefront_status: newValue }));
            
            // Log the action
            await supabase.rpc('log_system_event', {
                p_level: newValue.online ? 'info' : 'warn',
                p_source: 'system',
                p_message: `Storefront status manually changed to ${newValue.online ? 'Online' : 'Offline'}`
            });

            showToast(`Storefront is now ${newValue.online ? 'Online' : 'Offline'}`);
        } catch (err) {
            showToast('Failed to update status', 'error');
        }
    };

    const saveSystemConfig = async () => {
        try {
            const { error } = await supabase
                .from('system_config')
                .upsert({ 
                    key: 'storefront_status',
                    value: config.storefront_status,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            
            await supabase.rpc('log_system_event', {
                p_level: 'success',
                p_source: 'system',
                p_message: 'Global system configuration updated.'
            });

            showToast('All systems saved successfully');
        } catch (err) {
            showToast('Failed to save settings', 'error');
        }
    };

    const handleManualSync = async () => {
        setIsSyncing(true);
        try {
            await supabase.rpc('log_system_event', {
                p_level: 'success',
                p_source: 'system',
                p_message: 'Manual system synchronization completed.'
            });
            await fetchSystemData();
            showToast('System synced successfully');
        } catch (err) {
            showToast('Sync failed', 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    if (loading && !config) {
        return <div className="flex items-center justify-center h-64 text-slate-400">Loading system configuration...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in relative pb-12">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-24 right-8 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border animate-fade-in-up ${
                    toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span className="text-sm font-bold">{toast.message}</span>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">System Health</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Advanced platform settings and security logs</p>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Sync: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:border-[#944555] text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 active:scale-95 group"
                >
                    <RefreshCw className={`w-4 h-4 text-[#944555] ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    <span>Re-Sync Core</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1a1c23] rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                            <Database className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Supabase Connection</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Database Status</span>
                                <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded w-fit ${
                                    config?.storefront_status?.online ? 'text-green-500 bg-green-50 dark:bg-green-500/10' : 'text-amber-500 bg-amber-50 dark:bg-amber-500/10'
                                }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${config?.storefront_status?.online ? 'bg-green-500' : 'bg-amber-500'}`}></div> 
                                    {config?.storefront_status?.online ? 'Connected' : 'Maintenance'}
                                </span>
                            </div>
                            <p className="font-mono text-xs text-slate-500 mb-4 truncate">{supabaseUrl}.supabase.co</p>

                            <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Maintenance Message</label>
                                    <input 
                                        type="text"
                                        value={config?.storefront_status?.message || 'We are currently performing scheduled maintenance. Please check back soon!'}
                                        onChange={async (e) => {
                                            const newValue = { ...config.storefront_status, message: e.target.value };
                                            setConfig(prev => ({ ...prev, storefront_status: newValue }));
                                        }}
                                        className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 dark:text-white outline-none focus:border-indigo-500 transition-all"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1 italic">This message will be visible to all visitors if the store is offline.</p>
                                </div>
                                
                                <div className="space-y-3 pt-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Database Size</span>
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {(storageUsage.db.used / (1024 * 1024)).toFixed(1)} MB / {(storageUsage.db.total / (1024 * 1024)).toFixed(0)} MB
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">File Storage</span>
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {(storageUsage.files.used / (1024 * 1024)).toFixed(1)} MB / {(storageUsage.files.total / (1024 * 1024)).toFixed(0)} MB
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button 
                                onClick={toggleStorefront}
                                className={`py-3 rounded-xl font-bold text-xs transition-all border ${
                                    config?.storefront_status?.online 
                                    ? 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100' 
                                    : 'bg-green-50 border-green-100 text-green-600 hover:bg-green-100'
                                }`}
                            >
                                {config?.storefront_status?.online ? 'Go Offline' : 'Go Online'}
                            </button>
                            <button 
                                onClick={saveSystemConfig}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-600/20"
                            >
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1a1c23] rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security & API</h2>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <Lock className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                                <div>
                                    <p className="font-bold text-sm text-slate-900 dark:text-white">API Keys (Auth)</p>
                                    <p className="text-xs text-slate-500">Manage anon and service role keys</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <Plug className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                                <div>
                                    <p className="font-bold text-sm text-slate-900 dark:text-white">Webhooks</p>
                                    <p className="text-xs text-slate-500">{config?.webhook_stats?.active_endpoints || 0} active endpoints configured</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 dark:bg-black rounded-2xl p-6 shadow-xl border border-slate-800 font-mono text-sm overflow-hidden relative border-t-4 border-t-indigo-500/30">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-4">
                    <Terminal className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-300 font-bold tracking-wider uppercase text-xs">Runtime System Logs</span>
                    <span className="ml-auto flex items-center gap-2 text-xs text-slate-500">
                        <Activity className="w-3 h-3 animate-pulse text-green-500" /> Live Feed
                    </span>
                </div>
                <div className="space-y-2 opacity-80 h-48 overflow-y-auto scrollbar-hide flex flex-col-reverse">
                    <p className="animate-pulse text-indigo-400">_</p>
                    {logs.length === 0 ? (
                        <p className="text-slate-600 italic">Listening for system events...</p>
                    ) : (
                        logs.map((log) => (
                            <p key={log.id} className={`${
                                log.level === 'error' ? 'text-rose-400' : 
                                log.level === 'warn' ? 'text-amber-400' : 
                                log.level === 'success' ? 'text-emerald-400' : 'text-slate-300'
                            }`}>
                                <span className="text-slate-600">[{new Date(log.created_at).toLocaleTimeString()}]</span> {log.source?.toUpperCase()}: {log.message}
                            </p>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminSystem;

