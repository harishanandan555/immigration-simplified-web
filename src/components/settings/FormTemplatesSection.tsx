import React, { useState } from 'react';
import { Copy, Download, Edit, Trash } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  FORM_TEMPLATE_CATEGORIES,
  FORM_TEMPLATE_TYPES,
  FORM_TEMPLATE_STATUS
} from '../../utils/constants';
import {
  FormTemplate,
  FormTemplateData,
  createFormTemplate,
  updateFormTemplate,
  deleteFormTemplate,
  duplicateFormTemplate,
  exportFormTemplate,
  importFormTemplate
} from '../../controllers/SettingsControllers';

interface FormTemplatesSectionProps {
  userId: string;
  isSuperAdmin: boolean;
  isAttorney: boolean;
}

export const FormTemplatesSection: React.FC<FormTemplatesSectionProps> = ({
  userId,
  isSuperAdmin,
  isAttorney
}) => {
  const [formTemplatesData, setFormTemplatesData] = useState<FormTemplateData>({
    templates: [],
    totalTemplates: 0,
    activeTemplates: 0
  });

  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [showDeleteTemplate, setShowDeleteTemplate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleFormTemplateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (selectedTemplate) {
      setSelectedTemplate(prev => ({
        ...prev!,
        [name]: value
      }));
    }
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedTemplate) return;
      const response = await createFormTemplate(userId, selectedTemplate);
      if (response.data) {
        setFormTemplatesData(prev => ({
          templates: [...prev.templates, response.data],
          totalTemplates: prev.totalTemplates + 1,
          activeTemplates: response.data.isActive ? prev.activeTemplates + 1 : prev.activeTemplates
        }));
        setShowAddTemplate(false);
        setSelectedTemplate(null);
        toast.success('Template created successfully');
      }
    } catch (error) {
      toast.error('Failed to create template');
    }
  };

  const handleEditTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedTemplate?._id) return;
      const response = await updateFormTemplate(userId, selectedTemplate._id, selectedTemplate);
      if (response.data) {
        setFormTemplatesData(prev => ({
          ...prev,
          templates: prev.templates.map(t => t._id === response.data._id ? response.data : t),
          activeTemplates: prev.templates.filter(t => t.isActive).length
        }));
        setShowEditTemplate(false);
        setSelectedTemplate(null);
        toast.success('Template updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update template');
    }
  };

  const handleDeleteTemplate = async () => {
    try {
      if (!selectedTemplate?._id) return;
      await deleteFormTemplate(userId, selectedTemplate._id);
      setFormTemplatesData(prev => ({
        templates: prev.templates.filter(t => t._id !== selectedTemplate._id),
        totalTemplates: prev.totalTemplates - 1,
        activeTemplates: selectedTemplate.isActive ? prev.activeTemplates - 1 : prev.activeTemplates
      }));
      setShowDeleteTemplate(false);
      setSelectedTemplate(null);
      toast.success('Template deleted successfully');
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      const response = await duplicateFormTemplate(userId, templateId);
      if (response.data) {
        setFormTemplatesData(prev => ({
          templates: [...prev.templates, response.data],
          totalTemplates: prev.totalTemplates + 1,
          activeTemplates: response.data.isActive ? prev.activeTemplates + 1 : prev.activeTemplates
        }));
        toast.success('Template duplicated successfully');
      }
    } catch (error) {
      toast.error('Failed to duplicate template');
    }
  };

  const handleExportTemplate = async (templateId: string) => {
    try {
      const response = await exportFormTemplate(userId, templateId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `template-${templateId}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Template exported successfully');
    } catch (error) {
      toast.error('Failed to export template');
    }
  };

  const handleImportTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const response = await importFormTemplate(userId, file);
      if (response.data) {
        setFormTemplatesData(prev => ({
          templates: [...prev.templates, response.data],
          totalTemplates: prev.totalTemplates + 1,
          activeTemplates: response.data.isActive ? prev.activeTemplates + 1 : prev.activeTemplates
        }));
        toast.success('Template imported successfully');
      }
    } catch (error) {
      toast.error('Failed to import template');
    }
  };

  // Filter templates based on search and category
  const filteredTemplates = formTemplatesData.templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isSuperAdmin && !isAttorney) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Form Templates</h2>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input w-64"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-select"
          >
            <option value="all">All Categories</option>
            {Object.entries(FORM_TEMPLATE_CATEGORIES).map(([key, value]) => (
              <option key={key} value={value}>{key.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedTemplate({
                name: '',
                description: '',
                category: 'FAMILY_BASED',
                type: 'CUSTOM',
                status: 'DRAFT',
                fields: [],
                version: '1.0',
                effectiveDate: new Date().toISOString(),
                isActive: true,
                createdBy: userId,
                updatedBy: userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              setShowAddTemplate(true);
            }}
          >
            Add Template
          </button>
          <label className="btn btn-outline cursor-pointer">
            Import
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportTemplate}
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map(template => (
          <div key={template._id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{template.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => handleDuplicateTemplate(template._id!)}
                >
                  <Copy className="h-5 w-5" />
                </button>
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => handleExportTemplate(template._id!)}
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowEditTemplate(true);
                  }}
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowDeleteTemplate(true);
                  }}
                >
                  <Trash className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  template.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  template.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {template.status}
                </span>
                <span className="text-sm text-gray-500">
                  {template.category.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <p>Version: {template.version}</p>
                <p>Fields: {template.fields.length}</p>
                <p>Last updated: {new Date(template.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Template Modal */}
      {(showAddTemplate || showEditTemplate) && selectedTemplate && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {showAddTemplate ? 'Add New Template' : 'Edit Template'}
            </h3>
            <form onSubmit={showAddTemplate ? handleAddTemplate : handleEditTemplate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Template Name</label>
                  <input
                    type="text"
                    name="name"
                    value={selectedTemplate.name}
                    onChange={handleFormTemplateChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={selectedTemplate.description}
                    onChange={handleFormTemplateChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      name="category"
                      value={selectedTemplate.category}
                      onChange={handleFormTemplateChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      {Object.entries(FORM_TEMPLATE_CATEGORIES).map(([key, value]) => (
                        <option key={key} value={value}>{key.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      name="type"
                      value={selectedTemplate.type}
                      onChange={handleFormTemplateChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      {Object.entries(FORM_TEMPLATE_TYPES).map(([key, value]) => (
                        <option key={key} value={value}>{key.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={selectedTemplate.status}
                    onChange={handleFormTemplateChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    {Object.entries(FORM_TEMPLATE_STATUS).map(([key, value]) => (
                      <option key={key} value={value}>{key.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Version</label>
                  <input
                    type="text"
                    name="version"
                    value={selectedTemplate.version}
                    onChange={handleFormTemplateChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Effective Date</label>
                  <input
                    type="date"
                    name="effectiveDate"
                    value={selectedTemplate.effectiveDate.split('T')[0]}
                    onChange={handleFormTemplateChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                {selectedTemplate.type === 'USCIS' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">USCIS Form Number</label>
                      <input
                        type="text"
                        name="metadata.uscisFormNumber"
                        value={selectedTemplate.metadata?.uscisFormNumber || ''}
                        onChange={handleFormTemplateChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">USCIS Form Link</label>
                      <input
                        type="url"
                        name="metadata.uscisFormLink"
                        value={selectedTemplate.metadata?.uscisFormLink || ''}
                        onChange={handleFormTemplateChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estimated Processing Time</label>
                      <input
                        type="text"
                        name="metadata.estimatedProcessingTime"
                        value={selectedTemplate.metadata?.estimatedProcessingTime || ''}
                        onChange={handleFormTemplateChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fee</label>
                      <input
                        type="number"
                        name="metadata.fee"
                        value={selectedTemplate.metadata?.fee || ''}
                        onChange={handleFormTemplateChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowAddTemplate(false);
                    setShowEditTemplate(false);
                    setSelectedTemplate(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {showAddTemplate ? 'Create Template' : 'Update Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Template Confirmation Modal */}
      {showDeleteTemplate && selectedTemplate && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Template</h3>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete the template "{selectedTemplate.name}"? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowDeleteTemplate(false);
                  setSelectedTemplate(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteTemplate}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 