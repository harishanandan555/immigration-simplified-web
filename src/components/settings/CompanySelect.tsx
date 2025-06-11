import React, { useState, useEffect, useRef } from 'react';
import { getAllCompaniesList, Company } from '../../controllers/CompanyControllers';

interface CompanySelectProps {
  onCompanySelect: (companyId: string) => void;
  selectedCompanyId: string;
  className?: string;
  userId: string;
}

const CompanySelect: React.FC<CompanySelectProps> = ({
  onCompanySelect,
  selectedCompanyId,
  className = '',
  userId
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesList = await getAllCompaniesList(userId);
        if (companiesList?.data) {
          setCompanies(companiesList.data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchCompanies();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCompany = companies.find(company => company._id === selectedCompanyId);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
      <div
        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 cursor-pointer"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="flex justify-between items-center">
          <span>{selectedCompany ? selectedCompany.name : 'Select a company'}</span>
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${showDropdown ? 'transform rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
          <div className="px-3 py-2">
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {filteredCompanies.length === 0 ? (
            <div className="px-4 py-2 text-gray-500">No companies found</div>
          ) : (
            filteredCompanies.map((company) => (
              <div
                key={company._id}
                onClick={() => {
                  onCompanySelect(company._id);
                  setShowDropdown(false);
                }}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 ${
                  selectedCompanyId === company._id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center">
                  <span className="ml-3 block truncate">{company.name}</span>
                </div>
                {selectedCompanyId === company._id && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CompanySelect; 