import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Form {
  id: string;
  name: string;
  description: string;
  category: string;
  isRequired: boolean;
  formNumber: string;
  filingFee: number;
  processingTime: string;
}

interface FormSelectionProps {
  onUpdate: (data: { selectedForms: string[] }) => void;
  data: string[];
}

const FormSelection: React.FC<FormSelectionProps> = ({ onUpdate, data }) => {
  const [selectedForms, setSelectedForms] = useState<string[]>(data);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First get the categories
      const categoriesResponse = await axios.get('/api/v1/immigration/categories');
      const categories = categoriesResponse.data;

      // Then get forms for each category
      const formsPromises = categories.map(async (category: any) => {
        try {
          const response = await axios.get(`/api/v1/immigration/categories/${category.id}/forms`);
          return response.data.map((form: any) => ({
            ...form,
            category: category.name
          }));
        } catch (err) {
          console.error(`Error fetching forms for category ${category.id}:`, err);
          return [];
        }
      });

      const formsResults = await Promise.all(formsPromises);
      const allForms = formsResults.flat();

      if (allForms.length === 0) {
        setError('No forms available. Please try again later.');
      } else {
        setForms(allForms);
      }
    } catch (err) {
      console.error('Error fetching forms:', err);
      setError('Failed to load forms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormToggle = (formId: string) => {
    const newSelectedForms = selectedForms.includes(formId)
      ? selectedForms.filter(id => id !== formId)
      : [...selectedForms, formId];
    
    setSelectedForms(newSelectedForms);
    onUpdate({ selectedForms: newSelectedForms });
  };

  const handleRetry = () => {
    fetchForms();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-neutral-800 mb-6">
        Select Required Forms
      </h2>
      
      {forms.length === 0 ? (
        <div className="text-center text-neutral-600 p-4">
          No forms available for selection.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map(form => (
              <div
                key={form.id}
                className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                  selectedForms.includes(form.id)
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-neutral-200 hover:border-primary-400'
                }`}
                onClick={() => handleFormToggle(form.id)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedForms.includes(form.id)}
                      onChange={() => {}}
                      className="h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                    />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-neutral-800">
                      {form.name}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      {form.description}
                    </p>
                    <div className="mt-2 space-y-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                        {form.category}
                      </span>
                      {form.isRequired && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Required
                        </span>
                      )}
                      <div className="text-xs text-neutral-600">
                        <p>Form Number: {form.formNumber}</p>
                        <p>Filing Fee: ${form.filingFee}</p>
                        <p>Processing Time: {form.processingTime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedForms.length > 0 && (
            <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
              <h3 className="text-sm font-medium text-neutral-800 mb-2">
                Selected Forms ({selectedForms.length})
              </h3>
              <ul className="text-sm text-neutral-600">
                {selectedForms.map(formId => {
                  const form = forms.find(f => f.id === formId);
                  return (
                    <li key={formId} className="flex items-center">
                      <svg
                        className="h-4 w-4 text-primary-600 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {form?.name} - {form?.description}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FormSelection; 