import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Loader2, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import questionnaireAssignmentService from '../services/questionnaireAssignmentService';
import toast from 'react-hot-toast';

interface QuestionnaireField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  order?: number;
}

interface QuestionnaireAssignment {
  _id: string;
  questionnaireId: {
    _id: string;
    title: string;
    category: string;
    description: string;
    fields: QuestionnaireField[];
  };
  status: string;
  responses?: Record<string, any>;
  wasOrphaned?: boolean;
}

const FillQuestionnaire: React.FC = () => {
  const { id: assignmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [assignment, setAssignment] = useState<QuestionnaireAssignment | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assignmentId) {
      loadAssignment();
    }
  }, [assignmentId]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      
      // Get all assignments and find the specific one
      const assignments = await questionnaireAssignmentService.getMyAssignments();
      const foundAssignment = assignments.find((a: any) => a._id === assignmentId || a.id === assignmentId);
      
      if (!foundAssignment) {
        setError('Questionnaire assignment not found');
        return;
      }

      
      // Ensure questionnaire has fields
      if (!foundAssignment.questionnaireId?.fields && !foundAssignment.questionnaire?.fields) {
        setError('This questionnaire has no fields to fill out');
        return;
      }

      // Detect orphaned assignments: completed status but no responseId or actual response data
      let actualStatus = foundAssignment.status || 'pending';
      let wasOrphaned = false;
      
      
      // If assignment shows as completed, check if it actually has response data
      if (foundAssignment.status === 'completed') {
        
        // Only reset to pending if it's completed but missing BOTH responseId AND response data
        const hasNoResponseId = !foundAssignment.responseId;
        const hasNoResponseData = !foundAssignment.responses || Object.keys(foundAssignment.responses).length === 0;
        
        if (hasNoResponseId && hasNoResponseData) {
          // This is truly orphaned - completed but no data
          actualStatus = 'pending';
          wasOrphaned = true;
        } else {
          // This is legitimately completed with data
        }
      }

      // Normalize the assignment structure
      const normalizedAssignment = {
        _id: foundAssignment._id || foundAssignment.id,
        questionnaireId: {
          _id: foundAssignment.questionnaireId?._id || foundAssignment.questionnaireId,
          title: foundAssignment.questionnaireId?.title || foundAssignment.questionnaireName || 'Untitled Questionnaire',
          category: foundAssignment.questionnaireId?.category || 'immigration',
          description: foundAssignment.questionnaireId?.description || '',
          fields: foundAssignment.questionnaireId?.fields || foundAssignment.questionnaire?.fields || []
        },
        status: actualStatus,
        responses: foundAssignment.responses || {},
        wasOrphaned: wasOrphaned
      };

      setAssignment(normalizedAssignment);
      
      // Load existing responses or draft responses
      const existingResponses = normalizedAssignment.responses || {};
      const draftResponses = assignmentId ? questionnaireAssignmentService.loadDraftResponses(assignmentId) : null;
      
      // Use draft responses if they exist and are more recent than existing responses
      const responsesToUse = draftResponses || existingResponses;
      setResponses(responsesToUse);
      
      
      setError(null);
    } catch (err) {
      console.error('Error loading assignment:', err);
      setError('Failed to load questionnaire. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      
      if (!assignment || !assignmentId) {
        toast.error('No assignment found');
        return;
      }

      // Save draft responses to localStorage
      await questionnaireAssignmentService.saveDraftResponses(assignmentId, responses);
      toast.success('Draft saved successfully');
    } catch (err) {
      console.error('Error saving draft:', err);
      toast.error('Failed to save draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      if (!assignment) {
        toast.error('No assignment found');
        return;
      }

      // Validate required fields
      const requiredFields = assignment.questionnaireId.fields.filter(field => field.required);
      const missingFields = requiredFields.filter(field => !responses[field.id] || responses[field.id] === '');
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`);
        return;
      }
      
      await questionnaireAssignmentService.submitQuestionnaireResponses(
        assignment._id,
        responses,
        'Submitted by client' // Optional notes
      );
      
      // Clear draft after successful submission
      questionnaireAssignmentService.clearDraftResponses(assignment._id);
      
      toast.success('Questionnaire submitted successfully!');
      
      // Navigate back to questionnaires list
      navigate('/my-questionnaires');
    } catch (err) {
      console.error('Error submitting questionnaire:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit questionnaire';
      
      // Handle authorization errors specifically
      if (errorMessage.includes('AUTHORIZATION ERROR')) {
        // Show a more user-friendly error for authorization issues
        toast.error(
          <div className="max-w-md">
            <p className="font-bold text-red-600 mb-2">⚠️ Wrong Account</p>
            <p className="text-sm mb-2">You're logged in with the wrong account for this questionnaire.</p>
            <p className="text-xs text-gray-600">Check the console for detailed instructions on how to login with the correct client account.</p>
          </div>,
          { 
            duration: 8000,
            style: {
              maxWidth: '400px'
            }
          }
        );
        
        // Also log the full error for detailed instructions
        console.error('Full authorization error details:', errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: QuestionnaireField) => {
    const value = responses[field.id] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field.type}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required={field.required}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required={field.required}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required={field.required}
            >
              <option value="">{field.placeholder || 'Select an option'}</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    required={field.required}
                  />
                  <span className="ml-2 text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    value={option}
                    checked={Array.isArray(value) && value.includes(option)}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        handleInputChange(field.id, [...currentValues, option]);
                      } else {
                        handleInputChange(field.id, currentValues.filter(v => v !== option));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required={field.required}
            />
          </div>
        );

      default:
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required={field.required}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading questionnaire...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <p>{error}</p>
          </div>
          <button 
            onClick={() => navigate('/my-questionnaires')}
            className="mt-2 text-red-700 hover:text-red-800 font-medium"
          >
            Back to Questionnaires
          </button>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center p-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Questionnaire Not Found</h2>
          <p className="text-gray-600 mb-4">The requested questionnaire could not be loaded.</p>
          <button 
            onClick={() => navigate('/my-questionnaires')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Questionnaires
          </button>
        </div>
      </div>
    );
  }

  const sortedFields = assignment.questionnaireId.fields.sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/my-questionnaires')}
          className="mr-4 p-2 text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {assignment.questionnaireId.title}
          </h1>
          {assignment.questionnaireId.description && (
            <p className="text-gray-600 mt-1">{assignment.questionnaireId.description}</p>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span className={`px-3 py-1 text-sm rounded-full ${
          assignment.status === 'completed' 
            ? 'bg-green-100 text-green-800' 
            : assignment.status === 'in-progress'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {assignment.status === 'completed' && <CheckCircle className="w-4 h-4 inline mr-1" />}
          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
        </span>
      </div>

      {/* Orphaned Assignment Warning */}
      {assignment.wasOrphaned && (
        <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
            <span className="text-sm text-orange-800 font-medium">Assignment Reset</span>
          </div>
          <p className="text-sm text-orange-700 mt-1">
            This questionnaire was previously completed but the response data was removed. You can now resubmit it.
          </p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {sortedFields.map(field => renderField(field))}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium flex items-center disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Draft
            </button>
            
            <button
              type="submit"
              disabled={submitting || assignment.status === 'completed'}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {assignment.status === 'completed' ? 'Completed' : 'Submit Questionnaire'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FillQuestionnaire;