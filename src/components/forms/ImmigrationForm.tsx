import React, { useState, useEffect } from 'react';
import { immigrationApi } from '../../services/api/immigrationProcess';
import '../../styles/ImmigrationForm.css';

interface ImmigrationFormProps {
  formId: string;
  processId: string;
  onSave: (data: any) => void;
  initialData?: any;
}

export const ImmigrationForm: React.FC<ImmigrationFormProps> = ({
  formId,
  processId,
  onSave,
  initialData
}) => {
  const [formData, setFormData] = useState<any>(initialData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<any>(null);

  useEffect(() => {
    loadFormTemplate();
  }, [formId]);

  const loadFormTemplate = async () => {
    try {
      setLoading(true);
      const response = await immigrationApi.getFormTemplate(formId);
      setTemplate(response.data);
    } catch (error) {
      console.error('Failed to load form template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = async () => {
    try {
      setLoading(true);
      const response = await immigrationApi.validateFormData(formId, formData);
      const validationErrors = response.data.errors || {};
      setErrors(validationErrors);
      return Object.keys(validationErrors).length === 0;
    } catch (error) {
      console.error('Validation failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (isValid) {
      onSave(formData);
    }
  };

  if (loading && !template) {
    return (
      <div className="form-loading">
        <div className="spinner"></div>
        <p>Loading form...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="form-error">
        <p>Failed to load form template</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="immigration-form">
      <div className="form-header">
        <h2>{template.title}</h2>
        <p>{template.description}</p>
      </div>

      <div className="form-fields">
        {template.fields.map((field: any) => (
          <div key={field.id} className="form-field">
            <label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>

            {field.type === 'text' && (
              <input
                type="text"
                id={field.id}
                value={formData[field.id] || ''}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                required={field.required}
                placeholder={field.placeholder}
                className={errors[field.id] ? 'error' : ''}
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                id={field.id}
                value={formData[field.id] || ''}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                required={field.required}
                placeholder={field.placeholder}
                className={errors[field.id] ? 'error' : ''}
              />
            )}

            {field.type === 'select' && (
              <select
                id={field.id}
                value={formData[field.id] || ''}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                required={field.required}
                className={errors[field.id] ? 'error' : ''}
              >
                <option value="">Select {field.label}</option>
                {field.options.map((option: any) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'date' && (
              <input
                type="date"
                id={field.id}
                value={formData[field.id] || ''}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                required={field.required}
                className={errors[field.id] ? 'error' : ''}
              />
            )}

            {field.type === 'file' && (
              <div className="file-upload">
                <input
                  type="file"
                  id={field.id}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleInputChange(field.id, file);
                    }
                  }}
                  required={field.required}
                  accept={field.accept}
                  className={errors[field.id] ? 'error' : ''}
                />
                {formData[field.id] && (
                  <span className="file-name">
                    {formData[field.id].name}
                  </span>
                )}
              </div>
            )}

            {errors[field.id] && (
              <span className="error-message">{errors[field.id]}</span>
            )}
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Form'}
        </button>
      </div>
    </form>
  );
}; 