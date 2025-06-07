import React from 'react';

interface WizardCompletedProps {
  data: {
    caseNumber: string;
    category: string;
    subcategory: string;
    clientName: string;
    documents: {
      name: string;
      status: string;
    }[];
    forms: {
      name: string;
      status: string;
    }[];
  };
}

const WizardCompleted: React.FC<WizardCompletedProps> = ({ data }) => {
  const allDocumentsCompleted = data.documents.every(
    doc => doc.status === 'completed'
  );
  const allFormsCompleted = data.forms.every(
    form => form.status === 'completed'
  );

  return (
    <div>
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
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
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-neutral-800">
          Case Creation Completed
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          Your immigration case has been successfully created and is ready for processing
        </p>
      </div>

      <div className="mt-8 bg-white rounded-lg border border-neutral-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-neutral-800 mb-4">
              Case Details
            </h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-neutral-500">
                  Case Number
                </dt>
                <dd className="mt-1 text-sm text-neutral-900">
                  {data.caseNumber}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">
                  Category
                </dt>
                <dd className="mt-1 text-sm text-neutral-900">
                  {data.category}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">
                  Subcategory
                </dt>
                <dd className="mt-1 text-sm text-neutral-900">
                  {data.subcategory}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">
                  Client
                </dt>
                <dd className="mt-1 text-sm text-neutral-900">
                  {data.clientName}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-medium text-neutral-800 mb-4">
              Status Summary
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">
                    Documents
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      allDocumentsCompleted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {allDocumentsCompleted ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {data.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-neutral-600">{doc.name}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          doc.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">
                    Forms
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      allFormsCompleted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {allFormsCompleted ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {data.forms.map((form, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-neutral-600">{form.name}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          form.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-200 pt-6">
          <h3 className="text-lg font-medium text-neutral-800 mb-4">
            Next Steps
          </h3>
          <ol className="space-y-4">
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                1
              </span>
              <span className="ml-3 text-sm text-neutral-600">
                Review the case details and ensure all information is correct
              </span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                2
              </span>
              <span className="ml-3 text-sm text-neutral-600">
                Monitor the case status through the dashboard
              </span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                3
              </span>
              <span className="ml-3 text-sm text-neutral-600">
                Receive notifications about case updates and required actions
              </span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                4
              </span>
              <span className="ml-3 text-sm text-neutral-600">
                Contact your assigned case manager for any questions or concerns
              </span>
            </li>
          </ol>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default WizardCompleted; 