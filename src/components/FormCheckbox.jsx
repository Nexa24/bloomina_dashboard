import React from 'react';
import { AlertCircle } from 'lucide-react';

const FormCheckbox = ({
    id,
    name,
    checked,
    onChange,
    required = false,
    error = '',
    children
}) => {
    return (
        <div>
            <div className="flex items-start">
                <div className="flex items-center h-5">
                    <input
                        id={id}
                        name={name}
                        type="checkbox"
                        required={required}
                        checked={checked}
                        onChange={onChange}
                        className={`h-4 w-4 text-[#1B4F9C] focus:ring-[#1B4F9C] ${error ? 'border-red-300' : 'border-slate-300'
                            } rounded transition-colors`}
                    />
                </div>
                <div className="ml-2">
                    <label htmlFor={id} className="text-sm text-slate-700">
                        {children}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                </div>
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

export default FormCheckbox;

