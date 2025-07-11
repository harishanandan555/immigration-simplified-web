import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import questionnaireAssignmentService from '../services/questionnaireAssignmentService';
import { useAuth } from '../controllers/AuthControllers';
import toast from 'react-hot-toast';
import { validateMongoObjectId, isValidMongoObjectId } from '../utils/idValidation';

interface QuestionnaireField {
  id: string;
  type: string;
  label: string;
  question?: string;
  help_text?: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface QuestionnaireAssignment {
  _id: string;
  questionnaireId: {
    _id: string;
    title: string;
    description?: string;
    fields: QuestionnaireField[];
  };
  status: 'pending' | 'in-progress' | 'completed';
  responseId?: string;
}

const FillQuestionnaire: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState<QuestionnaireAssignment | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fields per step (for pagination)
  const FIELDS_PER_STEP = 5;

  useEffect(() => {
    if (!id) {
      navigate('/my-questionnaires');
      return;
    }

    loadAssignment();
  }, [id, navigate]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      
      // Validate id parameter before making API call
      if (!id || !isValidMongoObjectId(id)) {
        setError('Invalid questionnaire ID format. Please check the URL.');
        console.error(`Invalid ObjectId format: ${id}`);
        return;
      }
      
      const data = await questionnaireAssignmentService.getAssignment(id as string);
      
      // Check if the assignment exists and has a questionnaire
      if (!data || !data.questionnaireId) {
        setError('Questionnaire not found or has been removed');
        return;
      }

      // Check if already completed
      if (data.status === 'completed') {
        setResponses(data.responseId?.responses || {});
      }
      
      setAssignment(data);
      
      // If not yet started, update to in-progress
      if (data.status === 'pending') {
        await questionnaireAssignmentService.updateStatus(data._id, 'in-progress');
      }
    } catch (err: any) {
      console.error('Error loading questionnaire:', err);
      if (err?.response?.data?.error) {
        setError(err.response.data.error);
        toast.error(err.response.data.error);
      } else if (err?.message?.includes('Invalid')) {
        // This is our validation error
        setError(err.message);
        toast.error(err.message);
      } else {
        setError('Failed to load questionnaire. Please try again.');
        toast.error('Error loading questionnaire');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error for this field if exists
    if (fieldErrors[fieldId]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
    
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaved(false);
      setSubmitting(true);
      
      if (!assignment) return;
      
      // Ensure we're using valid MongoDB ObjectId format
      const questionnaireId = assignment.questionnaireId._id;
      const assignmentId = assignment._id;
      
      // Validate IDs using utility function
      validateMongoObjectId(questionnaireId, 'questionnaire');
      validateMongoObjectId(assignmentId, 'assignment');
      
      // Save as draft (not completing)
      await questionnaireAssignmentService.submitQuestionnaire(
        questionnaireId,
        assignmentId,
        responses
      );
      
      setSaved(true);
      toast.success('Your responses have been saved');
    } catch (err: any) {
      console.error('Error saving questionnaire responses:', err);
      if (err?.message?.includes('Invalid')) {
        toast.error(err.message);
      } else {
        toast.error('Failed to save responses');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const validateResponses = (): boolean => {
    if (!assignment?.questionnaireId.fields) return false;
    
    const newErrors: Record<string, string> = {};
    
    assignment.questionnaireId.fields.forEach(field => {
      if (field.required) {
        const value = responses[field.id];
        
        if (value === undefined || value === null || value === '') {
          newErrors[field.id] = 'This field is required';
        } else if (Array.isArray(value) && value.length === 0) {
          newErrors[field.id] = 'Please select at least one option';
        }
      }
    });
    
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!validateResponses()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (!assignment) return;
      
      // Ensure we're using valid MongoDB ObjectId format
      const questionnaireId = assignment.questionnaireId._id;
      const assignmentId = assignment._id;
      
      // Validate IDs using utility function
      validateMongoObjectId(questionnaireId, 'questionnaire');
      validateMongoObjectId(assignmentId, 'assignment');
      
      // Submit questionnaire
      await questionnaireAssignmentService.submitQuestionnaire(
        questionnaireId,
        assignmentId,
        responses
      );
      
      // Update status to completed
      await questionnaireAssignmentService.updateStatus(assignmentId, 'completed');
      
      toast.success('Questionnaire submitted successfully');
      navigate('/my-questionnaires');
    } catch (err: any) {
      console.error('Error submitting questionnaire:', err);
      if (err?.message?.includes('Invalid')) {
        toast.error(err.message);
      } else {
        toast.error('Failed to submit questionnaire');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (!assignment?.questionnaireId.fields) return;
    
    const totalSteps = Math.ceil(assignment.questionnaireId.fields.length / FIELDS_PER_STEP);
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const renderField = (field: QuestionnaireField) => {
    const isDisabled = assignment?.status === 'completed';
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label || field.question}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.help_text && (
              <p className="text-xs text-gray-500 mb-1 flex items-center">
                <HelpCircle className="w-3 h-3 mr-1" />
                {field.help_text}
              </p>
            )}
            <input
              type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
              value={responses[field.id] || ''}
              onChange={e => handleInputChange(field.id, e.target.value)}
              disabled={isDisabled}
              placeholder={field.placeholder}
              className={`w-full px-3 py-2 border ${
                fieldErrors[field.id] 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
            {fieldErrors[field.id] && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors[field.id]}</p>
            )}
          </div>
        );
      
      case 'date':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label || field.question}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.help_text && (
              <p className="text-xs text-gray-500 mb-1">{field.help_text}</p>
            )}
            <input
              type="date"
              value={responses[field.id] || ''}
              onChange={e => handleInputChange(field.id, e.target.value)}
              disabled={isDisabled}
              className={`w-full px-3 py-2 border ${
                fieldErrors[field.id] 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
            {fieldErrors[field.id] && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors[field.id]}</p>
            )}
          </div>
        );
      
      case 'textarea':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label || field.question}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.help_text && (
              <p className="text-xs text-gray-500 mb-1">{field.help_text}</p>
            )}
            <textarea
              value={responses[field.id] || ''}
              onChange={e => handleInputChange(field.id, e.target.value)}
              disabled={isDisabled}
              placeholder={field.placeholder}
              rows={4}
              className={`w-full px-3 py-2 border ${
                fieldErrors[field.id] 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
            {fieldErrors[field.id] && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors[field.id]}</p>
            )}
          </div>
        );
      
      case 'select':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label || field.question}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.help_text && (
              <p className="text-xs text-gray-500 mb-1">{field.help_text}</p>
            )}
            <select
              value={responses[field.id] || ''}
              onChange={e => handleInputChange(field.id, e.target.value)}
              disabled={isDisabled}
              className={`w-full px-3 py-2 border ${
                fieldErrors[field.id] 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="">Select an option</option>
              {field.options?.map((option, i) => (
                <option key={i} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {fieldErrors[field.id] && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors[field.id]}</p>
            )}
          </div>
        );
      
      case 'radio':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label || field.question}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.help_text && (
              <p className="text-xs text-gray-500 mb-1">{field.help_text}</p>
            )}
            <div className="mt-2 space-y-2">
              {field.options?.map((option, i) => (
                <label key={i} className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    checked={responses[field.id] === option}
                    onChange={() => handleInputChange(field.id, option)}
                    disabled={isDisabled}
                    className={`form-radio h-4 w-4 text-primary-600 border-gray-300 ${
                      isDisabled ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="ml-2 text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            {fieldErrors[field.id] && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors[field.id]}</p>
            )}
          </div>
        );
      
      case 'checkbox':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label || field.question}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.help_text && (
              <p className="text-xs text-gray-500 mb-1">{field.help_text}</p>
            )}
            <div className="mt-2 space-y-2">
              {field.options?.map((option, i) => {
                const selectedValues = Array.isArray(responses[field.id]) 
                  ? responses[field.id] 
                  : [];
                  
                return (
                  <label key={i} className="inline-flex items-center mr-4">
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option)}
                      onChange={e => {
                        const updatedValues = [...selectedValues];
                        if (e.target.checked) {
                          updatedValues.push(option);
                        } else {
                          const index = updatedValues.indexOf(option);
                          if (index >= 0) updatedValues.splice(index, 1);
                        }
                        handleInputChange(field.id, updatedValues);
                      }}
                      disabled={isDisabled}
                      className={`form-checkbox h-4 w-4 text-primary-600 border-gray-300 ${
                        isDisabled ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    />
                    <span className="ml-2 text-gray-700">{option}</span>
                  </label>
                );
              })}
            </div>
            {fieldErrors[field.id] && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors[field.id]}</p>
            )}
          </div>
        );
      
      case 'yesno':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label || field.question}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.help_text && (
              <p className="text-xs text-gray-500 mb-1">{field.help_text}</p>
            )}
            <div className="mt-2 space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  checked={responses[field.id] === true}
                  onChange={() => handleInputChange(field.id, true)}
                  disabled={isDisabled}
                  className={`form-radio h-4 w-4 text-primary-600 border-gray-300 ${
                    isDisabled ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                />
                <span className="ml-2 text-gray-700">Yes</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  checked={responses[field.id] === false}
                  onChange={() => handleInputChange(field.id, false)}
                  disabled={isDisabled}
                  className={`form-radio h-4 w-4 text-primary-600 border-gray-300 ${
                    isDisabled ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                />
                <span className="ml-2 text-gray-700">No</span>
              </label>
            </div>
            {fieldErrors[field.id] && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors[field.id]}</p>
            )}
          </div>
        );
      
      default:
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700">
              {field.label || field.question}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="text-sm text-gray-500 italic mt-1">
              Field type "{field.type}" not supported yet
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mr-2" />
        <span className="text-gray-600">Loading questionnaire...</span>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start">
          <AlertTriangle className="w-5 h-5 mr-2 mt-0.5" />
          <div>
            <h2 className="font-medium">Error</h2>
            <p>{error || 'Questionnaire not found'}</p>
            <button 
              onClick={() => navigate('/my-questionnaires')}
              className="mt-2 text-red-700 hover:text-red-800 font-medium"
            >
              Back to My Questionnaires
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCompleted = assignment.status === 'completed';
  const fields = assignment.questionnaireId.fields || [];
  const totalSteps = Math.ceil(fields.length / FIELDS_PER_STEP);
  const startIndex = currentStep * FIELDS_PER_STEP;
  const endIndex = Math.min(startIndex + FIELDS_PER_STEP, fields.length);
  const currentFields = fields.slice(startIndex, endIndex);
  const progress = Math.round((currentStep + 1) / totalSteps * 100);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/my-questionnaires')}
            className="text-gray-600 hover:text-gray-800 flex items-center mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to My Questionnaires
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900">
            {assignment.questionnaireId.title || 'Complete Your Questionnaire'}
          </h1>
          
          {assignment.questionnaireId.description && (
            <p className="text-gray-600 mt-2">{assignment.questionnaireId.description}</p>
          )}
          
          {isCompleted && (
            <div className="mt-4 bg-green-50 text-green-700 p-3 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>You've completed this questionnaire. Thank you!</span>
            </div>
          )}
        </div>
        
        {/* Progress bar */}
        {totalSteps > 1 && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-center">
              Step {currentStep + 1} of {totalSteps}
            </div>
          </div>
        )}
        
        {/* Questionnaire fields */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {currentFields.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              This questionnaire has no questions to answer.
            </div>
          ) : (
            currentFields.map((field) => renderField(field))
          )}
        </div>
        
        {/* Navigation and submission buttons */}
        <div className="mt-6 flex justify-between">
          <div>
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            {!isCompleted && (
              <button
                onClick={handleSave}
                disabled={submitting || Object.keys(responses).length === 0}
                className={`px-4 py-2 border border-primary-600 text-primary-600 rounded-md hover:bg-primary-50 flex items-center ${
                  (submitting || Object.keys(responses).length === 0) 
                    ? 'opacity-60 cursor-not-allowed' 
                    : ''
                }`}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </button>
            )}
            
            {currentStep < totalSteps - 1 ? (
              <button
                onClick={nextStep}
                disabled={submitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
              >
                Next
              </button>
            ) : (
              !isCompleted && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center ${
                    submitting ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit
                </button>
              )
            )}
          </div>
        </div>
        
        {/* Saved indicator */}
        {saved && (
          <div className="mt-4 text-center text-sm text-green-600 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 mr-1" />
            Changes saved
          </div>
        )}
      </div>
    </div>
  );
};

export default FillQuestionnaire;
