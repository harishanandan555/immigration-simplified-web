import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  tooltip?: string;
}

const Select: React.FC<SelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  helperText,
  error,
  required = false,
  disabled = false,
  className = '',
  tooltip,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-center mb-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {tooltip && (
          <div className="relative ml-1">
            <Info
              className="w-4 h-4 text-gray-400 cursor-help"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            />
            {showTooltip && (
              <div className="absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-gray-800 rounded-md shadow-lg -left-32 top-6">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500 transition-colors ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'hover:border-gray-400'} ${
          !value ? 'text-gray-500' : 'text-gray-900'
        }`}
      >
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            className={option.value === '' ? 'text-gray-500' : 'text-gray-900'}
          >
            {option.label}
          </option>
        ))}
      </select>
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Select;