import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress?: number;
  error?: string;
}

interface DocumentUploadProps {
  onUpdate: (data: { documents: Document[] }) => void;
  data: {
    documents: Document[];
  };
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUpdate, data }) => {
  const [documents, setDocuments] = useState<Document[]>(data.documents);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newDocuments = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      status: 'pending' as const
    }));

    setDocuments(prev => [...prev, ...newDocuments]);
    onUpdate({ documents: [...documents, ...newDocuments] });
  }, [documents, onUpdate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  const handleUpload = async (document: Document) => {
    try {
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === document.id
            ? { ...doc, status: 'uploading', progress: 0 }
            : doc
        )
      );

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload

      setDocuments(prev =>
        prev.map(doc =>
          doc.id === document.id
            ? { ...doc, status: 'completed', progress: 100 }
            : doc
        )
      );
    } catch (error) {
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === document.id
            ? { ...doc, status: 'error', error: 'Upload failed' }
            : doc
        )
      );
    }
  };

  const handleUploadAll = async () => {
    setUploading(true);
    const pendingDocs = documents.filter(doc => doc.status === 'pending');
    
    for (const doc of pendingDocs) {
      await handleUpload(doc);
    }
    
    setUploading(false);
  };

  const handleRemove = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    onUpdate({ documents: documents.filter(doc => doc.id !== documentId) });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-neutral-800 mb-6">
        Document Upload
      </h2>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-neutral-300 hover:border-primary-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-neutral-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-sm text-neutral-600">
            <p className="font-medium text-primary-600 hover:text-primary-500">
              Upload a file
            </p>
            <p className="text-xs">or drag and drop</p>
          </div>
          <p className="text-xs text-neutral-500">
            PDF, PNG, JPG, DOC up to 10MB
          </p>
        </div>
      </div>

      {documents.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-neutral-700">
              Uploaded Documents
            </h3>
            {documents.some(doc => doc.status === 'pending') && (
              <button
                onClick={handleUploadAll}
                disabled={uploading}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload All'}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {documents.map(document => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-neutral-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {document.type.startsWith('image/') ? (
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
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    ) : (
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
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {document.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatFileSize(document.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {document.status === 'pending' && (
                    <button
                      onClick={() => handleUpload(document)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Upload
                    </button>
                  )}
                  {document.status === 'uploading' && (
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full"
                          style={{ width: `${document.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-500">
                        {document.progress}%
                      </span>
                    </div>
                  )}
                  {document.status === 'completed' && (
                    <span className="text-green-600 text-sm font-medium">
                      Completed
                    </span>
                  )}
                  {document.status === 'error' && (
                    <span className="text-red-600 text-sm font-medium">
                      {document.error}
                    </span>
                  )}
                  <button
                    onClick={() => handleRemove(document.id)}
                    className="text-neutral-400 hover:text-neutral-500"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload; 