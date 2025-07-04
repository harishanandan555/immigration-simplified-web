import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Search, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface MultiSelectProps {
  id: string;
  label: string;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  maxHeight?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  id,
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Select options...',
  helperText,
  error,
  required = false,
  disabled = false,
  className = '',
  maxHeight = '200px'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter(option => selectedValues.includes(option.value));

  const handleOptionToggle = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newSelectedValues);
  };

  const removeSelected = (value: string) => {
    onChange(selectedValues.filter(v => v !== value));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className={`mb-4 ${className}`} ref={dropdownRef}>
      <div className="mb-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>

      <div className="relative">
        <div
          className={`min-h-[42px] border rounded-md shadow-sm bg-white cursor-pointer ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between p-2">
            <div className="flex flex-wrap gap-1 flex-1 min-w-0">
              {selectedOptions.length > 0 ? (
                selectedOptions.map(option => (
                  <span
                    key={option.value}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {option.label}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSelected(option.value);
                      }}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
            {/* Search */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options */}
            <div className={`max-h-${maxHeight} overflow-y-auto`}>
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500">No options found</div>
              ) : (
                <>
                  {selectedValues.length > 0 && (
                    <div className="px-3 py-2 border-b border-gray-200">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAll();
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                  {filteredOptions.map(option => (
                    <div
                      key={option.value}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                        selectedValues.includes(option.value) ? 'bg-blue-50' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionToggle(option.value);
                      }}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center ${
                          selectedValues.includes(option.value)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedValues.includes(option.value) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default MultiSelect; 