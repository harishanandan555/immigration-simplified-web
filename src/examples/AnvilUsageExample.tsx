import React, { useState } from 'react';
import { 
  fillPdfTemplate, 
  fillPdfTemplateBlob, 
  fillPdfTemplatePreview,
  getAnvilTemplatesList,
  getAnvilTemplatePayload,
  downloadFilledPdf,
  createPdfPreviewUrl,
  revokePdfPreviewUrl,
  validateAnvilFormData,
  prepareAnvilFormData,
  handleAnvilApiError,
  filterTemplatesByCategory,
  searchTemplates,
  sortTemplates,
  getTemplateStats,
  getFieldNamesFromPayload,
  getRequiredFieldsFromPayload,
  validateFormDataAgainstPayload,
  hasTemplatePermission,
  isTemplateActive
} from '../controllers/AnvilControllers';

/**
 * Example component demonstrating how to use Anvil PDF template filling
 */
const AnvilUsageExample: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [templateId, setTemplateId] = useState('i-130-template');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Templates list state
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'fieldCount'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Template payload state
  const [templatePayload, setTemplatePayload] = useState<any>(null);
  const [payloadLoading, setPayloadLoading] = useState(false);
  const [payloadError, setPayloadError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Load templates list
  const loadTemplates = async () => {
    setTemplatesLoading(true);
    setError(null);

    try {
      const response = await getAnvilTemplatesList({
        page: 1,
        limit: 50,
        category: selectedCategory || undefined,
        search: searchTerm || undefined,
        sortBy,
        sortOrder
      });

      if (response.data) {
        setTemplates(response.data.templates || []);
      } else {
        setError('Failed to load templates');
      }
    } catch (err) {
      setError(handleAnvilApiError(err));
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Filter and sort templates
  const getFilteredTemplates = () => {
    let filtered = [...templates];

    // Apply search filter
    if (searchTerm) {
      filtered = searchTemplates(filtered, searchTerm);
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filterTemplatesByCategory(filtered, selectedCategory);
    }

    // Apply sorting
    filtered = sortTemplates(filtered, sortBy, sortOrder);

    return filtered;
  };

  // Get template categories
  const getCategories = () => {
    const categories = new Set<string>();
    templates.forEach(template => {
      if (template.category) {
        categories.add(template.category);
      }
    });
    return Array.from(categories).sort();
  };

  // Get template statistics
  const getStats = () => {
    return getTemplateStats(templates);
  };

  // Load template payload
  const loadTemplatePayload = async (templateId: string) => {
    setPayloadLoading(true);
    setPayloadError(null);

    try {
      const response = await getAnvilTemplatePayload(templateId);

      if (response.data) {
        setTemplatePayload(response.data);
      } else {
        setPayloadError('Failed to load template payload');
      }
    } catch (err) {
      setPayloadError(handleAnvilApiError(err));
    } finally {
      setPayloadLoading(false);
    }
  };

  // Get form fields from payload
  const getFormFieldsFromPayload = () => {
    if (!templatePayload) return [];
    return getFieldNamesFromPayload(templatePayload);
  };

  // Get required fields from payload
  const getRequiredFieldsFromPayload = () => {
    if (!templatePayload) return [];
    return getRequiredFieldsFromPayload(templatePayload);
  };

  // Validate form data against payload
  const validateFormDataAgainstPayload = (data: Record<string, any>) => {
    if (!templatePayload) return { isValid: true, errors: [] };
    return validateFormDataAgainstPayload(data, templatePayload);
  };

  const handleFillAndDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate form data
      const validation = validateAnvilFormData(formData);
      if (!validation.isValid) {
        setError(`Validation errors: ${validation.errors.join(', ')}`);
        return;
      }

      // Prepare form data
      const preparedData = prepareAnvilFormData(formData);

      // Fill PDF template and get blob
      const response = await fillPdfTemplateBlob(templateId, preparedData, {
        filename: `form-${templateId}-${Date.now()}.pdf`
      });

      if (response.data instanceof Blob) {
        // Download the PDF
        downloadFilledPdf(response.data, `form-${templateId}-${Date.now()}.pdf`);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      setError(handleAnvilApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate form data
      const validation = validateAnvilFormData(formData);
      if (!validation.isValid) {
        setError(`Validation errors: ${validation.errors.join(', ')}`);
        return;
      }

      // Prepare form data
      const preparedData = prepareAnvilFormData(formData);

      // Get preview URL
      const response = await fillPdfTemplatePreview(templateId, preparedData);

      if (response.data?.data?.pdfUrl) {
        setPreviewUrl(response.data.data.pdfUrl);
      } else {
        setError('No preview URL received');
      }
    } catch (err) {
      setError(handleAnvilApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleFillWithOptions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate form data
      const validation = validateAnvilFormData(formData);
      if (!validation.isValid) {
        setError(`Validation errors: ${validation.errors.join(', ')}`);
        return;
      }

      // Prepare form data
      const preparedData = prepareAnvilFormData(formData);

      // Fill PDF template with options
      const response = await fillPdfTemplate(templateId, preparedData, {
        filename: `form-${templateId}-${Date.now()}.pdf`,
        download: true,
        preview: false
      });

      if (response.data?.success) {
        console.log('PDF filled successfully:', response.data);
        // Handle success (e.g., show success message, redirect, etc.)
      } else {
        setError(response.data?.error || 'Failed to fill PDF');
      }
    } catch (err) {
      setError(handleAnvilApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      revokePdfPreviewUrl(previewUrl);
      setPreviewUrl(null);
    }
  };

  // Load templates on component mount
  React.useEffect(() => {
    loadTemplates();
  }, []);

  const filteredTemplates = getFilteredTemplates();
  const categories = getCategories();
  const stats = getStats();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Anvil PDF Template Filling Example</h1>
      
      {/* Templates List Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Available Templates</h2>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="name">Sort by Name</option>
            <option value="createdAt">Sort by Created Date</option>
            <option value="updatedAt">Sort by Updated Date</option>
            <option value="fieldCount">Sort by Field Count</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
          <button
            onClick={loadTemplates}
            disabled={templatesLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {templatesLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Statistics */}
        {stats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-md">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Templates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.categories}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.averageFieldCount}</div>
              <div className="text-sm text-gray-600">Avg Fields</div>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        {templatesLoading ? (
          <div className="text-center py-8">
            <div className="text-lg">Loading templates...</div>
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.templateId}
                className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setTemplateId(template.templateId);
                  loadTemplatePayload(template.templateId);
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{template.formNumber}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    template.status === 'active' ? 'bg-green-100 text-green-800' :
                    template.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {template.status}
                  </span>
                </div>
                {template.description && (
                  <p className="text-gray-600 text-sm mb-2">{template.description}</p>
                )}
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{template.category}</span>
                  <span>{template.fieldCount || 0} fields</span>
                </div>
                {template.metadata?.difficulty && (
                  <div className="mt-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {template.metadata.difficulty}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No templates found. Try adjusting your search criteria.
          </div>
        )}
      </div>

      {/* Template Payload Section */}
      {templatePayload && (
        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">Template Details</h2>
          
          {payloadLoading ? (
            <div className="text-center py-4">
              <div className="text-lg">Loading template details...</div>
            </div>
          ) : payloadError ? (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {payloadError}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Template Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Template Information</h3>
                <div className="space-y-2">
                  <div><strong>Name:</strong> {templatePayload.name}</div>
                  <div><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      templatePayload.status === 'active' ? 'bg-green-100 text-green-800' :
                      templatePayload.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {templatePayload.status}
                    </span>
                  </div>
                  {templatePayload.description && (
                    <div><strong>Description:</strong> {templatePayload.description}</div>
                  )}
                  {templatePayload.category && (
                    <div><strong>Category:</strong> {templatePayload.category}</div>
                  )}
                  {templatePayload.version && (
                    <div><strong>Version:</strong> {templatePayload.version}</div>
                  )}
                  <div><strong>Fields:</strong> {templatePayload.fields?.length || 0}</div>
                </div>
              </div>

              {/* Fields List */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Form Fields</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {templatePayload.fields?.map((field: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                      <div>
                        <span className="font-medium">{field.fieldName}</span>
                        <span className="text-sm text-gray-500 ml-2">({field.fieldType})</span>
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      <div className="text-sm text-gray-500">
                        {field.placeholder && `"${field.placeholder}"`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              {templatePayload.permissions && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">Permissions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(templatePayload.permissions).map(([permission, allowed]) => (
                      <div key={permission} className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${
                          allowed ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                        <span className="text-sm capitalize">{permission.replace('can', '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Usage Stats */}
              {templatePayload.usage && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">Usage Statistics</h3>
                  <div className="space-y-2">
                    <div><strong>Total Uses:</strong> {templatePayload.usage.totalUses}</div>
                    {templatePayload.usage.lastUsed && (
                      <div><strong>Last Used:</strong> {new Date(templatePayload.usage.lastUsed).toLocaleDateString()}</div>
                    )}
                    {templatePayload.usage.averageCompletionTime && (
                      <div><strong>Avg. Completion Time:</strong> {Math.round(templatePayload.usage.averageCompletionTime / 60)} minutes</div>
                    )}
                    {templatePayload.usage.successRate && (
                      <div><strong>Success Rate:</strong> {(templatePayload.usage.successRate * 100).toFixed(1)}%</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Form Section */}
      <div className="border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">Fill PDF Template</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Template ID:
        </label>
        <input
          type="text"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Enter template ID"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">First Name:</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Last Name:</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Phone:</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Address:</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">City:</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">State:</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">ZIP Code:</label>
          <input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <button
          onClick={handleFillAndDownload}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Fill & Download PDF'}
        </button>
        
        <button
          onClick={handlePreview}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Preview PDF'}
        </button>
        
        <button
          onClick={handleFillWithOptions}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Fill with Options'}
        </button>
      </div>

      {previewUrl && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">PDF Preview</h3>
            <button
              onClick={closePreview}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
          <iframe
            src={previewUrl}
            className="w-full h-96 border border-gray-300 rounded"
            title="PDF Preview"
          />
        </div>
      )}
    </div>
  );
};

export default AnvilUsageExample;
