import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Filter, ArrowUpDown } from 'lucide-react';

import { getCases } from '../../controllers/Casecontrollers';

type Case = {
  _id: string;
  caseNumber: string;
  type: string;
  status: string;
  clientId: string | null;
  assignedTo: string | null;
  description: string;
  timeline: Array<{
    action: string;
    user: string;
    notes: string;
    _id: string;
    date: string;
  }>;
  documents: any[];
  tasks: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
};

const CasesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const casesData: any = await getCases();

        if (casesData && casesData.cases && casesData.cases.length > 0) {
          setCases(casesData.cases);
        } else {
          setCases([]);
        }
      } catch (error) {
        console.error('Error fetching cases:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCases();
  }, []); // Removed getCases from dependencies as it's not needed
  
  const filteredCases = cases.filter(
    (caseItem) =>
      caseItem.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (caseItem.clientId && caseItem.clientId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cases</h1>
        <Link
          to="/cases/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors"
        >
          <PlusCircle size={18} />
          <span>New Case</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search cases..."
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          <button className="flex items-center justify-center gap-2 border border-gray-300 rounded-md px-4 py-2 text-gray-600 hover:bg-gray-50">
            <Filter size={18} />
            <span>Filters</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer">
                    <span>Case Number</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer">
                    <span>Description</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer">
                    <span>Client ID</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer">
                    <span>Date Created</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCases.length > 0 ? (
                filteredCases.map((caseItem) => (
                  <tr key={caseItem._id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                      <Link to={`/cases/${caseItem._id}`}>{caseItem.caseNumber}</Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <Link to={`/cases/${caseItem._id}`}>{caseItem.description}</Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{caseItem.clientId || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        caseItem.status === 'New' 
                          ? 'bg-blue-100 text-blue-800'
                          : caseItem.status === 'In Progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{caseItem.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(caseItem.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {loading ? 'Loading cases...' : 'No cases found matching your search criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredCases.length > 0 && (
          <div className="flex justify-between items-center mt-4 py-3">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{filteredCases.length}</span> of{" "}
              <span className="font-medium">{cases.length}</span> cases
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50">
                Previous
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm bg-gray-50">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CasesPage;