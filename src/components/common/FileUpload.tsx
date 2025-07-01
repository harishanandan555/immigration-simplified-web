import React, { useState, useRef } from 'react';
import { Upload, X, FilePlus, AlertCircle, CheckCircle } from 'lucide-react';
import Button from './Button';
import { validateFileType, validateFileSize, fileToBase64 } from '../../utils/validation';

interface FileUploadProps {
  id: string;
  label: string;
  onChange: (file: File, base64Content: string) => void;
  helperText?: string;
  error?: string;
  required?: boolean;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  id,
  label,
  onChange,
  helperText = 'Accepted file types: PDF, JPEG, PNG (max 5MB)',
  error,
  required = false,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png'],
  maxSizeMB = 5,
  className = '',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsLoading(true);
    setFileError(null);

    // Validate file type
    const isValidType = validateFileType(
      selectedFile,
      acceptedTypes.map(type => {
        // Convert from extension to MIME type
        if (type === '.pdf') return 'application/pdf';
        if (type === '.jpg' || type === '.jpeg') return 'image/jpeg';
        if (type === '.png') return 'image/png';
        return type;
      })
    );

    if (!isValidType) {
      setFileError(`Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`);
      setIsLoading(false);
      return;
    }

    // Validate file size
    const isValidSize = validateFileSize(selectedFile, maxSizeMB);
    if (!isValidSize) {
      setFileError(`File size exceeds the maximum allowed (${maxSizeMB}MB)`);
      setIsLoading(false);
      return;
    }

    try {
      // Convert file to base64
      const base64Content = await fileToBase64(selectedFile);
      setFile(selectedFile);
      onChange(selectedFile, base64Content);
    } catch (error) {
      console.error('Error processing file:', error);
      setFileError('Failed to process the file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`mb-4 ${className}`}>
      <div className="mb-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileChange}
        className="hidden"
        required={required}
      />

      {!file ? (
        <div
          className={`border-2 border-dashed rounded-md p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer ${error || fileError ? 'border-red-300' : 'border-gray-300'
            }`}
          onClick={triggerFileInput}
        >
          <div className="flex flex-col items-center justify-center">
            <FilePlus className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500 mt-1">{helperText}</p>
          </div>
        </div>
      ) : (
        <div className="border rounded-md p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveFile}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {(error || fileError) && (
        <div className="flex items-center mt-1">
          <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
          <p className="text-xs text-red-500">{error || fileError}</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;