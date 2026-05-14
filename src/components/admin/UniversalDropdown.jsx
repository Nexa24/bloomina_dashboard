import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const UniversalDropdown = ({ value, onChange, options, placeholder = "Select...", className = "", menuClassName = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === value);

    const getStatusColor = (val) => {
        if (!val) return 'text-slate-900 dark:text-white';
        if (val.toLowerCase() === 'pending') return 'text-amber-500';
        if (val.toLowerCase() === 'approved') return 'text-blue-500';
        if (val.toLowerCase() === 'featured') return 'text-emerald-500';
        return 'text-slate-900 dark:text-white';
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-700/50 px-3 py-2 rounded-xl hover:border-[#944555] dark:hover:border-[#944555]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#944555]/20 w-fit min-w-[120px]"
            >
                <span className={`text-xs font-bold truncate ${!selectedOption ? 'text-slate-400' : getStatusColor(selectedOption.value)}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute right-0 mt-2 min-w-[140px] bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-[60] overflow-hidden py-1 animate-fade-in-up origin-top-right ${menuClassName}`}>
                    <div className="max-h-60 overflow-y-auto hide-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${value === option.value
                                        ? 'bg-[#fff5f6] dark:bg-[#944555]/10'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'
                                    }`}
                            >
                                <span className={`text-xs font-bold truncate pr-3 ${getStatusColor(option.value)}`}>
                                    {option.label}
                                </span>
                                {value === option.value && (
                                    <Check className={`w-3.5 h-3.5 shrink-0 ${getStatusColor(option.value)}`} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UniversalDropdown;


