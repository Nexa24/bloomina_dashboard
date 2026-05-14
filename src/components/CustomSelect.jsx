import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ value, onChange, options, label, icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-3 bg-white border-2 border-slate-200 px-4 py-3 rounded-xl hover:border-[#1B4F9C] transition-colors focus:outline-none focus:border-[#1B4F9C]"
            >
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4 text-slate-500" />}
                    {label && <span className="text-sm text-slate-500 font-medium">{label}</span>}
                    <span className="text-sm font-bold text-slate-900">
                        {selectedOption?.label || value}
                    </span>
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${value === option.value
                                    ? 'bg-[#1B4F9C] text-white'
                                    : 'hover:bg-gray-50 text-slate-900'
                                }`}
                        >
                            <span className={`text-sm font-medium ${value === option.value ? 'font-bold' : ''
                                }`}>
                                {option.label}
                            </span>
                            {value === option.value && (
                                <Check className="w-4 h-4" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;

