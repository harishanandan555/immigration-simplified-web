import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CaseFormsList from '../../components/CaseFormsList';
import { immigrationApi } from '../../services/api/immigrationProcess';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ImmigrationProcessForm } from '../../types/immigration';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  status: number;
}

interface Form {
  id: string;
  formNumber: string;
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'not-started';
  requirements: string[];
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
}

interface CaseType {
  id: string;
  name: string;
  subcategories: {
    id: string;
    name: string;
    forms: Form[];
  }[];
}

const transformForm = (form: ImmigrationProcessForm): Form => ({
  id: form.formNumber,
  formNumber: form.formNumber,
  title: form.name,
  description: form.description,
  status: 'not-started', // Default status
  requirements: form.requiredDocuments.map(doc => doc.name),
  priority: 'medium', // Default priority
});

const transformCaseType = (caseType: any): CaseType => ({
  id: caseType.id,
  name: caseType.name,
  subcategories: caseType.subcategories.map((sub: any) => ({
    id: sub.id,
    name: sub.name,
    forms: sub.forms.map(transformForm)
  }))
});

const CaseFormsListPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);

  useEffect(() => {
    const fetchCaseForms = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch case types and their forms
        const response = await immigrationApi.getForms();
        const apiResponse = response as unknown as ApiResponse<any[]>;
        
        if (apiResponse.success) {
          const transformedCaseTypes = apiResponse.data.map(transformCaseType);
          setCaseTypes(transformedCaseTypes);
        } else {
          setError(apiResponse.message || 'Failed to load forms');
        }
      } catch (err) {
        console.error('Error fetching case forms:', err);
        setError('Failed to load forms. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCaseForms();
  }, [caseId]);

  const handleFormClick = (formId: string) => {
    navigate(`/forms/${formId}`);
  };

  const handleDownloadClick = (formId: string) => {
    // Implement download functionality
    console.log('Downloading form:', formId);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <h2 className="text-error-800 font-medium">Error</h2>
          <p className="text-error-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Case Forms</h1>
      </div>

      <CaseFormsList
        caseTypes={caseTypes}
        onFormClick={handleFormClick}
        onDownloadClick={handleDownloadClick}
      />
    </div>
  );
};

export default CaseFormsListPage; 