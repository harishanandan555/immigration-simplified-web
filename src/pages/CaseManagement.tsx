import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Case {
  id: string;
  clientName: string;
  caseType: string;
  status: string;
  priority: string;
  lastUpdated: string;
}

const CaseManagement: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([
    {
      id: '1',
      clientName: 'John Doe',
      caseType: 'Green Card',
      status: 'In Progress',
      priority: 'High',
      lastUpdated: '2024-03-20'
    },
    // Add more sample cases as needed
  ]);

  const handleNewCase = () => {
    navigate('/new-client');
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Case Management</h1>
        <button
          onClick={handleNewCase}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          New Case
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Case Type</label>
            <select className="mt-1 block w-full p-2 border rounded">
              <option value="">All Types</option>
              <option value="greenCard">Green Card</option>
              <option value="citizenship">Citizenship</option>
              <option value="workAuth">Work Authorization</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select className="mt-1 block w-full p-2 border rounded">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="inProgress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select className="mt-1 block w-full p-2 border rounded">
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              placeholder="Search cases..."
              className="mt-1 block w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Case Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cases.map((case_) => (
              <tr key={case_.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{case_.clientName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{case_.caseType}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    case_.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                    case_.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {case_.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    case_.priority === 'High' ? 'bg-red-100 text-red-800' :
                    case_.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {case_.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {case_.lastUpdated}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => navigate(`/cases/${case_.id}`)}
                    className="text-primary-600 hover:text-primary-900 mr-4"
                  >
                    View
                  </button>
                  <button
                    onClick={() => navigate(`/cases/${case_.id}/edit`)}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CaseManagement; 