import React, { useState } from 'react';

interface Form {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  error?: string;
}

interface FormProcessingProps {
  onUpdate: (data: { forms: Form[] }) => void;
  data: {
    forms: Form[];
  };
}

const FormProcessing: React.FC<FormProcessingProps> = ({ onUpdate, data }) => {
  const [forms, setForms] = useState<Form[]>(data.forms);
  const [processing, setProcessing] = useState(false);

  const handleProcessForm = async (form: Form) => {
    try {
      setForms(prev =>
        prev.map(f =>
          f.id === form.id
            ? { ...f, status: 'processing', progress: 0 }
            : f
        )
      );

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

      setForms(prev =>
        prev.map(f =>
          f.id === form.id
            ? { ...f, status: 'completed', progress: 100 }
            : f
        )
      );
    } catch (error) {
      setForms(prev =>
        prev.map(f =>
          f.id === form.id
            ? { ...f, status: 'error', error: 'Processing failed' }
            : f
        )
      );
    }
  };

  const handleProcessAll = async () => {
    setProcessing(true);
    const pendingForms = forms.filter(form => form.status === 'pending');
    
    for (const form of pendingForms) {
      await handleProcessForm(form);
    }
    
    setProcessing(false);
  };

  const handleRetry = (form: Form) => {
    setForms(prev =>
      prev.map(f =>
        f.id === form.id
          ? { ...f, status: 'pending', error: undefined }
          : f
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-neutral-800 mb-6">
        Form Processing
      </h2>

      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-medium text-neutral-800">
              Process Forms
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Review and process the selected immigration forms
            </p>
          </div>
          {forms.some(form => form.status === 'pending') && (
            <button
              onClick={handleProcessAll}
              disabled={processing}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Process All'}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {forms.map(form => (
            <div
              key={form.id}
              className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {form.name}
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      form.status
                    )}`}
                  >
                    {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {form.status === 'pending' && (
                  <button
                    onClick={() => handleProcessForm(form)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Process
                  </button>
                )}
                {form.status === 'processing' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full"
                        style={{ width: `${form.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-500">
                      {form.progress}%
                    </span>
                  </div>
                )}
                {form.status === 'error' && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-red-600">
                      {form.error}
                    </span>
                    <button
                      onClick={() => handleRetry(form)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {forms.every(form => form.status === 'completed') && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  All forms processed successfully
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  You can now proceed to the next step
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormProcessing; 