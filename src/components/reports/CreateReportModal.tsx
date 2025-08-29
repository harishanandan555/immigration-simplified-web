import { useState } from 'react';
import { X, Save, Calendar, Users, FileText, Settings } from 'lucide-react';
import { Report, createReport } from '../../controllers/ReportControllers';

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateReportModal: React.FC<CreateReportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'case' as Report['type'],
    category: '',
    description: '',
    format: 'PDF' as Report['format'],
    isActive: true
  });

  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: 'case', label: 'Case Report', icon: FileText },
    { value: 'client', label: 'Client Report', icon: Users },
    { value: 'document', label: 'Document Report', icon: FileText },
    { value: 'user', label: 'User Report', icon: Users },
    { value: 'financial', label: 'Financial Report', icon: FileText },
    { value: 'custom', label: 'Custom Report', icon: Settings }
  ];

  const reportFormats = [
    { value: 'PDF', label: 'PDF' },
    { value: 'Excel', label: 'Excel' },
    { value: 'CSV', label: 'CSV' },
    { value: 'HTML', label: 'HTML' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reportData = {
        ...formData,
        parameters: {
          dateRange: {
            start: new Date().toISOString(),
            end: new Date().toISOString()
          },
          filters: {
            status: [],
            type: [],
            priority: []
          }
        },
        recipients: [],
        createdBy: 'current-user-id' // This should come from auth context
      };

      await createReport(reportData);
      onSuccess();
      onClose();
      setFormData({
        name: '',
        type: 'case',
        category: '',
        description: '',
        format: 'PDF',
        isActive: true
      });
    } catch (error) {
      console.error('Error creating report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Create New Report</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Report Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="form-input w-full"
              placeholder="Enter report name"
            />
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Report['type'] }))}
              className="form-select w-full"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="form-input w-full"
              placeholder="Enter category"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="form-textarea w-full"
              rows={3}
              placeholder="Enter report description"
            />
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Output Format *
            </label>
            <select
              required
              value={formData.format}
              onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as Report['format'] }))}
              className="form-select w-full"
            >
              {reportFormats.map(format => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active Report
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReportModal;
