import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const types = {
        success: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            iconBg: 'bg-green-100',
            text: 'text-green-800'
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
            iconBg: 'bg-red-100',
            text: 'text-red-800'
        },
        warning: {
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
            iconBg: 'bg-orange-100',
            text: 'text-orange-800'
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            icon: <Info className="w-5 h-5 text-[#1B4F9C]" />,
            iconBg: 'bg-blue-100',
            text: 'text-blue-800'
        }
    };

    const config = types[type] || types.info;

    return (
        <div className="fixed top-6 right-6 z-[10000] animate-slideIn">
            <div className={`${config.bg} ${config.border} border-2 rounded-2xl shadow-2xl p-4 min-w-[320px] max-w-md flex items-center gap-3`}>
                {/* Icon */}
                <div className={`${config.iconBg} p-2 rounded-xl flex-shrink-0`}>
                    {config.icon}
                </div>

                {/* Message */}
                <p className={`${config.text} font-medium text-sm flex-1`}>
                    {message}
                </p>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1 hover:bg-white/50 rounded-lg transition-colors"
                >
                    <X className={`w-4 h-4 ${config.text}`} />
                </button>
            </div>
        </div>
    );
};

export default Toast;

