import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ProcessDocument } from '../../types/immigration';
import '../../styles/DocumentUpload.css';

interface DocumentUploadProps {
  requiredDocuments: string[];
  onUploadComplete: (documents: ProcessDocument[]) => void;
  disabled?: boolean;
  error?: string | null;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  requiredDocuments,
  onUploadComplete,
  disabled = false,
  error = null
}) => {
  const [documents, setDocuments] = useState<ProcessDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    const newDocuments: ProcessDocument[] = [];

    for (const file of acceptedFiles) {
      const documentType = determineDocumentType(file.name);
      if (documentType) {
        newDocuments.push({
          id: `temp-${Date.now()}-${file.name}`,
          type: documentType,
          name: file.name,
          status: 'pending',
          metadata: {
            file
          }
        });
      }
    }

    setDocuments(prev => [...prev, ...newDocuments]);

    // Process each document
    for (const doc of newDocuments) {
      try {
        // Upload document
        await uploadDocument(doc.metadata.file);
        
        // Extract data from document
        const extractedData = await extractDataFromDocument(doc.metadata.file);
        
        // Update document status
        setDocuments(prev =>
          prev.map(d =>
            d.id === doc.id
              ? { ...d, status: 'uploaded', extractedData }
              : d
          )
        );
      } catch (error) {
        setDocuments(prev =>
          prev.map(d =>
            d.id === doc.id
              ? { ...d, status: 'rejected' }
              : d
          )
        );
      }
    }

    setUploading(false);
    onUploadComplete(documents);
  }, [requiredDocuments]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  });

  const determineDocumentType = (fileName: string): string | null => {
    const lowerFileName = fileName.toLowerCase();
    for (const docType of requiredDocuments) {
      if (lowerFileName.includes(docType.toLowerCase())) {
        return docType;
      }
    }
    return null;
  };

  const uploadDocument = async (file: File): Promise<void> => {
    // Simulate document upload
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const extractDataFromDocument = async (file: File): Promise<any> => {
    // Simulate data extraction
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      name: 'John Doe',
      dateOfBirth: '1990-01-01',
      nationality: 'Canadian',
      // Add more extracted fields based on document type
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setUploadError(null);

      const uploadPromises = Array.from(files).map(async (file) => {
        const metadata = {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadDate: new Date().toISOString()
        };

        const response = await immigrationApi.uploadDocument(processId!, file, {
          documentType: 'application/pdf',
          category: 'immigration'
        });

        return {
          ...response,
          name: file.name,
          type: file.type,
          metadata: metadata
        };
      });

      const results = await Promise.all(uploadPromises);
      setDocuments(prev => [...prev, ...results]);
      onUploadComplete(results);
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      setUploadError(error.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="document-upload">
      <div className="upload-header">
        <h2>Upload Required Documents</h2>
        <p>Upload the required documents for your application</p>
      </div>

      <div className="required-documents-list">
        <h3>Required Documents:</h3>
        <ul>
          {requiredDocuments.map((doc, index) => (
            <li key={index}>{doc}</li>
          ))}
        </ul>
      </div>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here...</p>
        ) : (
          <div className="upload-prompt">
            <p>Drag and drop files here, or click to select files</p>
            <p className="upload-hint">
              Supported formats: PDF, PNG, JPG, JPEG
            </p>
          </div>
        )}
      </div>

      {documents.length > 0 && (
        <div className="uploaded-documents">
          <h3>Uploaded Documents</h3>
          <div className="document-list">
            {documents.map((doc) => (
              <div key={doc.id} className={`document-item ${doc.status}`}>
                <div className="document-info">
                  <span className="document-name">{doc.name}</span>
                  <span className="document-type">{doc.type}</span>
                </div>
                <div className="document-status">
                  {doc.status === 'pending' && (
                    <div className="spinner"></div>
                  )}
                  {doc.status === 'uploaded' && (
                    <span className="status-icon">✓</span>
                  )}
                  {doc.status === 'rejected' && (
                    <span className="error-icon">✕</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <p>Processing documents...</p>
        </div>
      )}
    </div>
  );
}; 