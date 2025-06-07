import React, { useState, useEffect } from 'react';
import { immigrationApi } from '../../services/api/immigrationProcess';
import { ImmigrationForm } from './ImmigrationForm';
import '../../styles/FormProcessor.css';

interface FormProcessorProps {
  processId: string;
  formId: string;
  onComplete: (data: any) => void;
  onError: (error: string) => void;
}

export const FormProcessor: React.FC<FormProcessorProps> = ({
  processId,
  formId,
  onComplete,
  onError
}) => {
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadFormData();
  }, [processId, formId]);

  const loadFormData = async () => {
    try {
      setLoading(true);
      const response = await immigrationApi.getFormData(processId, formId);
      setFormData(response.data);
    } catch (error: any) {
      onError(error.response?.data?.message || 'Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSave = async (data: any) => {
    try {
      setProcessing(true);
      setValidationErrors({});

      // Validate form data
      const validationResponse = await immigrationApi.validateForm(processId, formId);
      const validationResult = validationResponse.data;

      if (!validationResult.isValid) {
        setValidationErrors(
          validationResult.errors.reduce((acc: Record<string, string>, error: any) => {
            acc[error.field] = error.message;
            return acc;
          }, {})
        );
        return;
      }

      // Save form data
      await immigrationApi.saveFormData(processId, formId, data);
      onComplete(data);
    } catch (error: any) {
      onError(error.response?.data?.message || 'Failed to process form');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="form-processor-loading">
        <div className="spinner"></div>
        <p>Loading form data...</p>
      </div>
    );
  }

  return (
    <div className="form-processor">
      <div className="form-processor-header">
        <h2>Form Processing</h2>
        <p>Please review and submit your information</p>
      </div>

      <div className="form-processor-content">
        <ImmigrationForm
          formId={formId}
          processId={processId}
          onSave={handleFormSave}
          initialData={formData}
        />

        {Object.keys(validationErrors).length > 0 && (
          <div className="validation-errors">
            <h3>Please fix the following errors:</h3>
            <ul>
              {Object.entries(validationErrors).map(([field, message]) => (
                <li key={field}>
                  <strong>{field}:</strong> {message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {processing && (
          <div className="processing-overlay">
            <div className="spinner"></div>
            <p>Processing form data...</p>
          </div>
        )}
      </div>
    </div>
  );
}; 