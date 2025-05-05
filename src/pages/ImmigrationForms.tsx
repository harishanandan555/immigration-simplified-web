import React, { useState, useEffect } from 'react';
import { ImmigrationProcessForm } from '../types/immigration';

const ImmigrationForms: React.FC = () => {
  const [forms, setForms] = useState<ImmigrationProcessForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:5005/api/v1/immigration/process/forms', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch forms');
        }

        const data = await response.json();
        setForms(data);
      } catch (err) {
        console.error('Error fetching forms:', err);
        setError('Failed to load forms. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading forms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Immigration Forms</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <div key={form.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{form.name}</h2>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  form.status === 'approved' ? 'bg-green-100 text-green-800' :
                  form.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  form.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{form.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <span className="font-medium mr-2">Form Number:</span>
                  <span>{form.formNumber}</span>
                </div>
                
                {form.submissionDeadline && (
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="font-medium mr-2">Deadline:</span>
                    <span>{new Date(form.submissionDeadline).toLocaleDateString()}</span>
                  </div>
                )}
                
                {form.submittedAt && (
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="font-medium mr-2">Submitted:</span>
                    <span>{new Date(form.submittedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              {form.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">{form.notes}</p>
                </div>
              )}
              
              <div className="mt-4">
                <button
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                  onClick={() => {
                    // Handle form submission or view details
                    console.log('View form:', form.id);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImmigrationForms; 