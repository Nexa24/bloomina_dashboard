import React from 'react';
import { AlertCircle } from 'lucide-react';

const FormInput = ({
    label,
    icon: Icon,
    type = 'text',
    required = false,
    error = '',
    ...props
}) => {
    return (
        <div>
            {label && (
                <label htmlFor={props.id} className="block text-sm font-bold text-slate-900 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Icon className="h-5 w-5 text-slate-400" />
                    </div>
                )}
                <input
                    type={type}
                    required={required}
                    className={`block w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3 border-2 ${error
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-slate-200 focus:border-[#1B4F9C]'
                        } rounded-xl focus:outline-none transition-colors text-slate-900 placeholder-slate-400`}
                    {...props}
                />
            </div>
            {error && (
                <div className="mt-2 flex items-center gap-2 text-red-600 text-sm animate-shake">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{error}</span>
                </div>
            )}
        </div>
    );
};

export default FormInput;

