import React, { useState, useEffect } from 'react';
import { 
  ImmigrationProcessFlow, 
  ImmigrationCategory, 
  ImmigrationDocument,
  ReviewData,
  immigrationApi 
} from '../services/api/immigrationProcess';

const ImmigrationProcessFlowPage: React.FC = () => {
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Process data
  const [category, setCategory] = useState<ImmigrationCategory>({
    categoryId: '',
    subcategoryId: '',
    visaType: '',
    priorityDate: ''
  });
  const [documents, setDocuments] = useState<ImmigrationDocument[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [review, setReview] = useState<ReviewData>({
    confirmed: false,
    notes: '',
    specialInstructions: ''
  });

  // Step handlers
  const handleCategorySubmit = (categoryData: ImmigrationCategory) => {
    setCategory(categoryData);
    setCurrentStep(2);
  };

  const handleDocumentsSubmit = (documentsData: ImmigrationDocument[]) => {
    setDocuments(documentsData);
    setCurrentStep(3);
  };

  const handleFormsSubmit = (formsData: Record<string, any>) => {
    setFormData(formsData);
    setCurrentStep(4);
  };

  const handleReviewSubmit = (reviewData: ReviewData) => {
    setReview(reviewData);
    submitProcess();
  };

  // Submit entire process
  const submitProcess = async () => {
    try {
      setLoading(true);
      setError(null);

      const processData: ImmigrationProcessFlow = {
        category,
        documents,
        formData,
        review
      };

      const response = await immigrationApi.submitProcessFlow(processData);

      if (response.data.success) {
        setSuccess(true);
        // Handle success (e.g., show confirmation, redirect)
      } else {
        setError(response.data.message || 'Failed to submit process');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred while submitting the process');
    } finally {
      setLoading(false);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CategorySelectionStep 
            onSubmit={handleCategorySubmit}
            initialData={category}
          />
        );
      case 2:
        return (
          <DocumentUploadStep 
            onSubmit={handleDocumentsSubmit}
            initialData={documents}
            category={category}
          />
        );
      case 3:
        return (
          <FormsStep 
            onSubmit={handleFormsSubmit}
            initialData={formData}
            category={category}
          />
        );
      case 4:
        return (
          <ReviewStep 
            onSubmit={handleReviewSubmit}
            initialData={review}
            processData={{ category, documents, formData }}
          />
        );
      default:
        return null;
    }
  };

  if (success) {
    return (
      <div className="success-container">
        <h2>Process Submitted Successfully</h2>
        <p>Your immigration process has been submitted. We will review your application and contact you soon.</p>
        <button onClick={() => window.location.href = '/dashboard'}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="process-flow-container">
      <div className="steps-progress">
        <StepIndicator currentStep={currentStep} />
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="step-content">
        {renderStep()}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Processing your request...</p>
        </div>
      )}
    </div>
  );
};

// Step Components
const CategorySelectionStep: React.FC<{
  onSubmit: (data: ImmigrationCategory) => void;
  initialData: ImmigrationCategory;
}> = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.categoryId) newErrors.categoryId = 'Please select a category';
    if (!formData.subcategoryId) newErrors.subcategoryId = 'Please select a subcategory';
    if (!formData.visaType) newErrors.visaType = 'Please select a visa type';
    if (!formData.priorityDate) newErrors.priorityDate = 'Please select a priority date';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Select Immigration Category</h2>
      
      <div className="form-group">
        <label htmlFor="categoryId">Immigration Category</label>
        <select
          id="categoryId"
          value={formData.categoryId}
          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          className={errors.categoryId ? 'error' : ''}
        >
          <option value="">Select Category</option>
          <option value="family">Family-Based Immigration</option>
          <option value="employment">Employment-Based Immigration</option>
          <option value="student">Student Visa</option>
          <option value="investor">Investor Visa</option>
          <option value="humanitarian">Humanitarian Programs</option>
        </select>
        {errors.categoryId && <span className="error-message">{errors.categoryId}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="subcategoryId">Subcategory</label>
        <select
          id="subcategoryId"
          value={formData.subcategoryId}
          onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
          className={errors.subcategoryId ? 'error' : ''}
        >
          <option value="">Select Subcategory</option>
          {/* Dynamic subcategories based on category */}
        </select>
        {errors.subcategoryId && <span className="error-message">{errors.subcategoryId}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="visaType">Visa Type</label>
        <select
          id="visaType"
          value={formData.visaType}
          onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
          className={errors.visaType ? 'error' : ''}
        >
          <option value="">Select Visa Type</option>
          {/* Dynamic visa types based on subcategory */}
        </select>
        {errors.visaType && <span className="error-message">{errors.visaType}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="priorityDate">Priority Date</label>
        <input
          type="date"
          id="priorityDate"
          value={formData.priorityDate}
          onChange={(e) => setFormData({ ...formData, priorityDate: e.target.value })}
          className={errors.priorityDate ? 'error' : ''}
        />
        {errors.priorityDate && <span className="error-message">{errors.priorityDate}</span>}
      </div>

      <button type="submit">Continue</button>
    </form>
  );
};

const DocumentUploadStep: React.FC<{
  onSubmit: (data: ImmigrationDocument[]) => void;
  initialData: ImmigrationDocument[];
  category: ImmigrationCategory;
}> = ({ onSubmit, initialData, category }) => {
  const [documents, setDocuments] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const validateDocuments = () => {
    const newErrors: Record<string, string> = {};
    if (documents.length === 0) {
      newErrors.documents = 'Please upload at least one document';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'identification');
        formData.append('category', category.categoryId);
        formData.append('description', file.name);

        const response = await immigrationApi.uploadDocument(category.categoryId, file, {
          documentType: 'identification',
          category: category.categoryId
        });

        return {
          documentId: response.data.id,
          type: 'identification',
          category: category.categoryId,
          description: file.name,
          metadata: {}
        };
      });

      const uploadedDocs = await Promise.all(uploadPromises);
      setDocuments([...documents, ...uploadedDocs]);
    } catch (error) {
      setErrors({ upload: 'Failed to upload documents. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateDocuments()) {
      onSubmit(documents);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Upload Required Documents</h2>

      <div className="form-group">
        <label>Required Documents</label>
        <div className="document-list">
          {documents.map((doc, index) => (
            <div key={index} className="document-item">
              <span>{doc.description}</span>
              <button
                type="button"
                onClick={() => setDocuments(documents.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {errors.documents && <span className="error-message">{errors.documents}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="fileUpload">Upload New Document</label>
        <input
          type="file"
          id="fileUpload"
          onChange={handleFileUpload}
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
        />
        {errors.upload && <span className="error-message">{errors.upload}</span>}
      </div>

      {uploading && <div className="uploading-message">Uploading documents...</div>}

      <button type="submit" disabled={uploading}>
        Continue
      </button>
    </form>
  );
};

const FormsStep: React.FC<{
  onSubmit: (data: Record<string, any>) => void;
  initialData: Record<string, any>;
  category: ImmigrationCategory;
}> = ({ onSubmit, initialData, category }) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    // Add validation rules based on category
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Complete Required Forms</h2>

      <div className="form-group">
        <label htmlFor="fullName">Full Name</label>
        <input
          type="text"
          id="fullName"
          value={formData.fullName || ''}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className={errors.fullName ? 'error' : ''}
        />
        {errors.fullName && <span className="error-message">{errors.fullName}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="dateOfBirth">Date of Birth</label>
        <input
          type="date"
          id="dateOfBirth"
          value={formData.dateOfBirth || ''}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          className={errors.dateOfBirth ? 'error' : ''}
        />
        {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="nationality">Nationality</label>
        <input
          type="text"
          id="nationality"
          value={formData.nationality || ''}
          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
          className={errors.nationality ? 'error' : ''}
        />
        {errors.nationality && <span className="error-message">{errors.nationality}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="address">Current Address</label>
        <textarea
          id="address"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className={errors.address ? 'error' : ''}
        />
        {errors.address && <span className="error-message">{errors.address}</span>}
      </div>

      <button type="submit">Continue</button>
    </form>
  );
};

const ReviewStep: React.FC<{
  onSubmit: (data: ReviewData) => void;
  initialData: ReviewData;
  processData: {
    category: ImmigrationCategory;
    documents: ImmigrationDocument[];
    formData: Record<string, any>;
  };
}> = ({ onSubmit, initialData, processData }) => {
  const [reviewData, setReviewData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateReview = () => {
    const newErrors: Record<string, string> = {};
    if (!reviewData.confirmed) {
      newErrors.confirmed = 'Please confirm that all information is correct';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateReview()) {
      onSubmit(reviewData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Review Your Application</h2>

      <div className="review-section">
        <h3>Category Information</h3>
        <div className="review-item">
          <label>Category:</label>
          <span>{processData.category.categoryId}</span>
        </div>
        <div className="review-item">
          <label>Subcategory:</label>
          <span>{processData.category.subcategoryId}</span>
        </div>
        <div className="review-item">
          <label>Visa Type:</label>
          <span>{processData.category.visaType}</span>
        </div>
        <div className="review-item">
          <label>Priority Date:</label>
          <span>{processData.category.priorityDate}</span>
        </div>
      </div>

      <div className="review-section">
        <h3>Uploaded Documents</h3>
        <ul>
          {processData.documents.map((doc, index) => (
            <li key={index}>{doc.description}</li>
          ))}
        </ul>
      </div>

      <div className="review-section">
        <h3>Form Information</h3>
        {Object.entries(processData.formData).map(([key, value]) => (
          <div key={key} className="review-item">
            <label>{key}:</label>
            <span>{value}</span>
          </div>
        ))}
      </div>

      <div className="form-group">
        <label htmlFor="notes">Additional Notes</label>
        <textarea
          id="notes"
          value={reviewData.notes}
          onChange={(e) => setReviewData({ ...reviewData, notes: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label htmlFor="specialInstructions">Special Instructions</label>
        <textarea
          id="specialInstructions"
          value={reviewData.specialInstructions}
          onChange={(e) => setReviewData({ ...reviewData, specialInstructions: e.target.value })}
        />
      </div>

      <div className="form-group checkbox">
        <input
          type="checkbox"
          id="confirmed"
          checked={reviewData.confirmed}
          onChange={(e) => setReviewData({ ...reviewData, confirmed: e.target.checked })}
          className={errors.confirmed ? 'error' : ''}
        />
        <label htmlFor="confirmed">
          I confirm that all information provided is accurate and complete
        </label>
        {errors.confirmed && <span className="error-message">{errors.confirmed}</span>}
      </div>

      <button type="submit">Submit Application</button>
    </form>
  );
};

const StepIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps = [
    { id: 1, name: 'Category' },
    { id: 2, name: 'Documents' },
    { id: 3, name: 'Forms' },
    { id: 4, name: 'Review' }
  ];

  return (
    <div className="step-indicator">
      {steps.map((step) => (
        <div
          key={step.id}
          className={`step ${step.id === currentStep ? 'active' : ''} ${
            step.id < currentStep ? 'completed' : ''
          }`}
        >
          <div className="step-number">{step.id}</div>
          <div className="step-name">{step.name}</div>
        </div>
      ))}
    </div>
  );
};

export default ImmigrationProcessFlowPage; 