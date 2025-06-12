import React, { useState } from 'react';

interface Document {
  id: string;
  name: string;
  description: string;
  required: boolean;
  status: 'pending' | 'uploaded' | 'approved' | 'rejected';
  file?: File;
}

interface DocumentUploadProps {
  onNext: (data: any) => void;
  caseType: string;
  forms: string[];
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onNext, caseType, forms }) => {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 'passport',
      name: 'Passport Copy',
      description: 'Clear copy of your current passport',
      required: true,
      status: 'pending'
    },
    {
      id: 'birthCertificate',
      name: 'Birth Certificate',
      description: 'Original or certified copy of birth certificate',
      required: true,
      status: 'pending'
    },
    {
      id: 'marriageCertificate',
      name: 'Marriage Certificate',
      description: 'If applicable, original or certified copy',
      required: forms.includes('I-130'),
      status: 'pending'
    },
    {
      id: 'i94',
      name: 'I-94 Arrival/Departure Record',
      description: 'Most recent I-94 record',
      required: true,
      status: 'pending'
    },
    {
      id: 'financialSupport',
      name: 'Financial Support Documents',
      description: 'I-864 and supporting documents',
      required: forms.includes('I-864'),
      status: 'pending'
    }
  ]);

  const handleFileUpload = (documentId: string, file: File) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, file, status: 'uploaded' }
        : doc
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ documents });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Document Upload</h2>
        <p className="mt-2 text-gray-600">
          Please upload the required documents for your case. Make sure all documents are clear and
          legible.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 border rounded-lg bg-white shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {doc.name}
                    {doc.required && (
                      <span className="ml-2 text-red-500">*</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">{doc.description}</p>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    doc.status === 'uploaded' ? 'bg-green-100 text-green-800' :
                    doc.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                    doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <label className="block">
                  <span className="sr-only">Choose file</span>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(doc.id, file);
                    }}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100"
                  />
                </label>
                {doc.file && (
                  <p className="mt-2 text-sm text-gray-500">
                    Selected file: {doc.file.name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Next Step
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-blue-900">Document Requirements</h3>
        <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
          <li>All documents must be clear and legible</li>
          <li>Documents in foreign languages must be translated to English</li>
          <li>Maximum file size: 10MB per document</li>
          <li>Accepted formats: PDF, JPG, PNG</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentUpload; 