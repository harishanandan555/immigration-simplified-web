import { useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { mockForms } from '../../utils/mockData';

const FormsLibraryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...new Set(mockForms.map(form => form.category))];

  const filteredForms = mockForms.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || form.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">USCIS Forms Library</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search forms..."
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-300 rounded-md pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-700"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>
        </div>

        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => (
            <div key={form.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="text-primary-600">{form.icon}</div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {form.category}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">{form.name}</h3>
              <p className="mt-2 text-sm text-gray-500">{form.description}</p>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Filing Fee:</span>
                  <span className="font-medium text-gray-900">${form.fee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Processing Time:</span>
                  <span className="font-medium text-gray-900">{form.processingTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pages:</span>
                  <span className="font-medium text-gray-900">{form.pages}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <button
                  className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                  onClick={() => window.open(`https://www.uscis.gov/forms/${form.name.split(',')[0].toLowerCase()}`, '_blank')}
                >
                  <Download size={16} className="mr-1" />
                  Download PDF
                </button>
                <button
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                  onClick={() => window.location.href = `/forms/${form.id}`}
                >
                  Fill Online
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredForms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No forms found matching your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormsLibraryPage;