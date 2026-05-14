import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Check, Trash2, HelpCircle, Info, RefreshCw } from 'lucide-react';

const UniversalAlert = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Are you sure?", 
    message = "This action cannot be undone.", 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    type = "danger", // danger, warning, success, info, neutral
    showCancel = true,
    showInput = false,
    inputType = "text",
    placeholder = "Type here...",
    defaultValue = ""
}) => {
    const [inputValue, setInputValue] = React.useState(defaultValue);

    React.useEffect(() => {
        if (isOpen) setInputValue(defaultValue);
    }, [isOpen, defaultValue]);
    
    const colors = {
        danger: {
            icon: <Trash2 className="w-7 h-7 text-red-500" />,
            bg: 'bg-red-50 dark:bg-red-500/10',
            border: 'border-red-100 dark:border-red-500/20',
            button: 'bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/20'
        },
        warning: {
            icon: <AlertCircle className="w-7 h-7 text-amber-500" />,
            bg: 'bg-amber-50 dark:bg-amber-500/10',
            border: 'border-amber-100 dark:border-amber-500/20',
            button: 'bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20'
        },
        success: {
            icon: <Check className="w-7 h-7 text-emerald-500" />,
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            border: 'border-emerald-100 dark:border-emerald-500/20',
            button: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20'
        },
        info: {
            icon: <Info className="w-7 h-7 text-blue-500" />,
            bg: 'bg-blue-50 dark:bg-blue-500/10',
            border: 'border-blue-100 dark:border-blue-500/20',
            button: 'bg-blue-500 hover:bg-blue-600 text-white shadow-xl shadow-blue-500/20'
        },
        neutral: {
            icon: <HelpCircle className="w-7 h-7 text-slate-500" />,
            bg: 'bg-slate-100 dark:bg-slate-800',
            border: 'border-slate-200 dark:border-slate-700',
            button: 'bg-slate-800 dark:bg-slate-100 text-white dark:text-black hover:opacity-90 shadow-xl shadow-slate-900/20'
        }
    };

    const currentStyle = colors[type] || colors.danger;
    const [isPending, setIsPending] = React.useState(false);

    const handleConfirm = async () => {
        try {
            setIsPending(true);
            await onConfirm(showInput ? inputValue : true);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md transition-all duration-300"
                    />

                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25, duration: 0.2 }}
                        className="relative w-full max-w-[400px] bg-white/90 dark:bg-[#15171e]/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.4)] border border-white dark:border-slate-800/50 overflow-hidden ring-1 ring-black/5 dark:ring-white/5 active:scale-[0.99] transition-transform"
                    >
                        <div className={`h-1.5 w-full ${currentStyle.bg.replace('bg-', 'bg-opacity-50 bg-')}`} style={{ opacity: 0.3 }} />

                        <div className="p-8 pb-4 text-center">
                            <motion.div 
                                initial={{ scale: 0.8, rotate: -15 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                                className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center mb-6 relative group`}
                            >
                                <div className={`absolute inset-0 rounded-[2rem] ${currentStyle.bg} opacity-50 blur-xl group-hover:scale-125 transition-transform duration-500`} />
                                <div className={`absolute inset-0 rounded-[2rem] border-2 ${currentStyle.border} ${currentStyle.bg} shadow-inner flex items-center justify-center z-10`}>
                                    {currentStyle.icon}
                                </div>
                            </motion.div>

                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">{title}</h3>
                            <p className="text-[15px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-2 mb-6">{message}</p>

                            {showInput && (
                                <div className="px-2 mb-6 text-left">
                                    {inputType === 'file' ? (
                                        <div className="relative group">
                                            <input 
                                                type="file"
                                                accept="image/*"
                                                disabled={isPending}
                                                onChange={(e) => setInputValue(e.target.files?.[0])}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                            />
                                            <div className={`w-full px-5 py-4 bg-slate-100 dark:bg-black/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-3 transition-all ${!isPending && 'group-hover:border-blue-500/50 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-500/5'}`}>
                                                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center">
                                                    {isPending ? <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" /> : <Info className="w-4 h-4 text-blue-500" />}
                                                </div>
                                                <span className="truncate">{inputValue?.name || 'Choose Image File...'}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <input 
                                            autoFocus
                                            type={inputType}
                                            disabled={isPending}
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder={placeholder}
                                            className="w-full px-5 py-4 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 disabled:opacity-50"
                                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-8 pt-4 flex flex-col sm:flex-row gap-3">
                            {showCancel && (
                                <button
                                    onClick={onClose}
                                    disabled={isPending}
                                    className="flex-1 py-4 px-6 rounded-2xl text-[15px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white transition-all transform active:scale-95 disabled:opacity-50"
                                >
                                    {cancelText}
                                </button>
                            )}
                            <button
                                onClick={handleConfirm}
                                disabled={isPending}
                                className={`flex-[1.5] py-4 px-6 rounded-2xl text-[15px] font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 ${currentStyle.button} disabled:opacity-50`}
                            >
                                {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : confirmText}
                            </button>
                        </div>

                        <div className="absolute -bottom-1 -left-1 -right-1 h-3 opacity-10 bg-gradient-to-t from-black/20 dark:from-white/10 to-transparent pointer-events-none" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UniversalAlert;

