import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Mail, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const DURATION = 8000;

const getTypeConfig = (type) => {
    switch (type) {
        case 'order':
            return {
                icon: ShoppingBag,
                color: 'from-[#944555] to-[#6c56e5]',
                label: 'New Order',
                link: '/admin/orders'
            };
        case 'lead':
            return {
                icon: Mail,
                color: 'from-blue-500 to-indigo-600',
                label: 'New Inquiry',
                link: '/admin/inquiries'
            };
        case 'inventory':
            return {
                icon: AlertTriangle,
                color: 'from-amber-500 to-orange-600',
                label: 'Inventory Alert',
                link: '/admin/inventory'
            };
        default:
            return {
                icon: Info,
                color: 'from-slate-500 to-slate-700',
                label: 'System Alert',
                link: '/admin'
            };
    }
};

const NotificationToast = ({ notif, onClose }) => {
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(100);
    const config = getTypeConfig(notif.type);
    const Icon = config.icon;

    useEffect(() => {
        // Show animation
        const t = setTimeout(() => setVisible(true), 30);
        
        // Progress bar logic
        const start = Date.now();
        const tick = setInterval(() => {
            const pct = Math.max(0, 100 - ((Date.now() - start) / DURATION) * 100);
            setProgress(pct);
            if (pct <= 0) {
                clearInterval(tick);
            }
        }, 40);

        return () => { 
            clearTimeout(t); 
            clearInterval(tick); 
        };
    }, []);

    const dismiss = () => {
        setVisible(false);
        setTimeout(() => onClose(notif.id), 320);
    };

    return (
        <div className={`relative w-85 bg-white dark:bg-[#1a1c23] rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-300 ease-out pointer-events-auto ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`}>
            <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${config.color}`} />
            <div className="pl-5 pr-4 pt-4 pb-3 flex items-start gap-4">
                <div className={`shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg shadow-[#944555]/20`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded-lg text-slate-500">
                            {config.label}
                        </p>
                        <button onClick={dismiss} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm leading-tight mb-1 truncate">{notif.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{notif.body}</p>
                    <Link to={config.link} onClick={dismiss} className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-black text-[#944555] hover:underline uppercase tracking-wider">
                        Take Action <ExternalLink className="w-3 h-3" />
                    </Link>
                </div>
            </div>
            <div className="h-1 bg-slate-50 dark:bg-white/5">
                <div className={`h-full bg-gradient-to-r ${config.color} transition-none`} style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
};

const NotificationStack = ({ notifications, onClose }) => {
    if (!notifications || notifications.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
            {notifications.map((notif) => (
                <NotificationToast 
                    key={notif.id} 
                    notif={notif} 
                    onClose={onClose}
                />
            ))}
        </div>
    );
};

export default NotificationStack;
