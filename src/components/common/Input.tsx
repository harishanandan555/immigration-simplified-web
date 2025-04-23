import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  tooltip?: string;
}

const Input: React.FC<InputProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
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
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-blue-500 focus:ring-blue-500 ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 text-gray-500' : ''}`}
      />
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Input;