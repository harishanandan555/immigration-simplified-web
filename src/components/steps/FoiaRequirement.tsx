import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Requirement {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
}

interface FormType {
  id: string;
  name: string;
  description: string;
  categoryId: string;
}

interface Subcategory {
  id: string;
  name: string;
  description: string;
  formTypeId: string;
}

interface FoiaRequirementProps {
  onUpdate: (data: { foiaRequired: boolean; foiaStatus: string }) => void;
  data: {
    foiaRequired: boolean;
    foiaStatus: string;
  };
}

const FoiaRequirement: React.FC<FoiaRequirementProps> = ({ onUpdate, data }) => {
  const [foiaRequired, setFoiaRequired] = useState<boolean>(data.foiaRequired);
  const [foiaStatus, setFoiaStatus] = useState<string>(data.foiaStatus);
  const [showDetails, setShowDetails] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // API Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [formTypes, setFormTypes] = useState<FormType[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFormType, setSelectedFormType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/immigration/categories');
      setCategories(response.data);
    } catch (err) {
      setError('Failed to fetch categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequirements = async (categoryId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/immigration/categories/${categoryId}/requirements`);
      setRequirements(response.data);
    } catch (err) {
      setError('Failed to fetch requirements');
      console.error('Error fetching requirements:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormTypes = async (categoryId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/immigration/categories/${categoryId}/form-types`);
      setFormTypes(response.data);
    } catch (err) {
      setError('Failed to fetch form types');
      console.error('Error fetching form types:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedFormType(''); // Reset form type selection
    setSubcategories([]); // Reset subcategories
    await Promise.all([
      fetchRequirements(categoryId),
      fetchFormTypes(categoryId)
    ]);
  };

  const handleFormTypeSelect = async (typeId: string) => {
    try {
      setLoading(true);
      // Select the form type
      await axios.post(`/api/v1/immigration/form-types/${typeId}/select`);
      setSelectedFormType(typeId);
      
      // Fetch subcategories for the selected form type
      const response = await axios.get(`/api/v1/immigration/form-types/${typeId}/subcategories`);
      setSubcategories(response.data);
    } catch (err) {
      setError('Failed to select form type');
      console.error('Error selecting form type:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFoiaToggle = (required: boolean) => {
    setFoiaRequired(required);
    setFoiaStatus(required ? 'pending' : 'not_required');
    onUpdate({ foiaRequired: required, foiaStatus: required ? 'pending' : 'not_required' });
    
    if (required) {
      setShowForm(true);
    }
  };

  const handleStatusChange = (status: string) => {
    setFoiaStatus(status);
    onUpdate({ foiaRequired, foiaStatus: status });
  };

  const handleBackToWizard = () => {
    setShowForm(false);
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBackToWizard}
            className="flex items-center text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to FOIA Requirements
          </button>
        </div>

        <div className="bg-white shadow-card rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-neutral-800 mb-6">FOIA Request Form</h2>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <form className="space-y-6">
              {/* Category Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-neutral-800">Immigration Category</h3>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Select Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Requirements Display */}
              {requirements.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neutral-800">Requirements</h3>
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <ul className="space-y-2">
                      {requirements.map((req) => (
                        <li key={req.id} className="flex items-start">
                          <span className={`inline-block w-4 h-4 mt-1 mr-2 rounded-full ${
                            req.isRequired ? 'bg-red-500' : 'bg-green-500'
                          }`}></span>
                          <div>
                            <p className="text-sm font-medium text-neutral-800">{req.name}</p>
                            <p className="text-sm text-neutral-600">{req.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Form Type Selection */}
              {formTypes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neutral-800">Form Type</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleFormTypeSelect(type.id)}
                        className={`p-4 rounded-lg border ${
                          selectedFormType === type.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-300 hover:border-primary-500'
                        }`}
                      >
                        <h4 className="font-medium text-neutral-800">{type.name}</h4>
                        <p className="text-sm text-neutral-600 mt-1">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subcategories Display */}
              {subcategories.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neutral-800">Subcategories</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subcategories.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-4 rounded-lg border border-neutral-300"
                      >
                        <h4 className="font-medium text-neutral-800">{sub.name}</h4>
                        <p className="text-sm text-neutral-600 mt-1">{sub.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-neutral-800">Subject Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">First Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Last Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Date of Birth</label>
                    <input
                      type="date"
                      className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Alien Number</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Supporting Documents */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-neutral-800">Supporting Documents</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Upload Documents</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-neutral-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-neutral-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                          >
                            <span>Upload a file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-neutral-500">PDF, JPG, PNG up to 10MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
          FOIA Requirements
        </h2>
        <p className="text-neutral-600">
          Determine if a Freedom of Information Act (FOIA) request is required for this case.
        </p>
      </div>

      <div className="bg-white shadow-card rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-700">
              Is a FOIA request required?
            </label>
            <div className="mt-2 space-x-4">
              <button
                type="button"
                onClick={() => handleFoiaToggle(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  foiaRequired
                    ? 'bg-primary-100 text-primary-700 border-primary-300'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                } border`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleFoiaToggle(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  !foiaRequired
                    ? 'bg-primary-100 text-primary-700 border-primary-300'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                } border`}
              >
                No
              </button>
            </div>
          </div>

          {foiaRequired && (
            <div>
              <label className="text-sm font-medium text-neutral-700">
                FOIA Request Status
              </label>
              <div className="mt-2">
                <select
                  value={foiaStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="received">Received</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>

            {showDetails && (
              <div className="mt-4 space-y-4">
                <div className="bg-neutral-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-neutral-800 mb-2">
                    FOIA Request Process
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-600">
                    <li>Complete the FOIA request form</li>
                    <li>Gather required supporting documents</li>
                    <li>Submit the request to the appropriate agency</li>
                    <li>Track the request status</li>
                    <li>Receive and review the response</li>
                  </ol>
                </div>

                <div className="bg-neutral-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-neutral-800 mb-2">
                    Required Documents
                  </h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-neutral-600">
                    <li>Completed FOIA request form</li>
                    <li>Proof of identity</li>
                    <li>Authorization letter (if applicable)</li>
                    <li>Payment for processing fees</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoiaRequirement; 