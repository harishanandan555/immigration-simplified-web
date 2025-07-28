import { useState, useEffect, useCallback } from 'react';
import questionnaireAssignmentService from '../services/questionnaireAssignmentService';

export interface Assignment {
  _id: string;
  questionnaireId: {
    _id: string;
    title: string;
    category: string;
    description: string;
    fields?: any[];
  };
  clientId: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignedAt: string;
  completedAt?: string;
  dueDate?: string;
  isOverdue?: boolean;
  responses?: Record<string, any>;
  clientEmail?: string;
  clientUserId?: string;
}

export const useQuestionnaireAssignments = (userRole: string, authToken?: string) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    try {
      console.log('🔄 loadAssignments called - setting loading to true');
      setLoading(true);
      let response;
      
      if (userRole === 'client') {
        console.log('👤 Loading assignments for client...');
        // Use the enhanced assignment service method
        response = await questionnaireAssignmentService.getMyAssignments();
      } else {
        console.log('👨‍💼 Loading assignments for attorney/admin...');
        // For attorneys/admins - get all assignments
        response = await questionnaireAssignmentService.getAllAssignments();
      }
      
      console.log('✅ Assignments loaded:', response);
      setAssignments(response || []);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error loading assignments:', err);
      setError(err.message || 'Failed to load assignments');
    } finally {
      console.log('🏁 loadAssignments finished - setting loading to false');
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    console.log('🔧 useEffect triggered - authToken:', !!authToken, 'userRole:', userRole);
    if (authToken || userRole === 'client') {
      loadAssignments();
    }
  }, [authToken, userRole, loadAssignments]);

  const submitResponse = async (assignmentId: string, responses: Record<string, any>, notes = '') => {
    try {
      const result = await questionnaireAssignmentService.submitQuestionnaireResponses(
        assignmentId, 
        responses, 
        notes
      );
      
      // Reload assignments to reflect the change
      await loadAssignments();
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to submit response');
      throw err;
    }
  };

  const viewResponse = async (assignmentId: string) => {
    try {
      return await questionnaireAssignmentService.getAssignmentResponse(assignmentId);
    } catch (err: any) {
      setError(err.message || 'Failed to view response');
      throw err;
    }
  };

  const saveDraft = async (assignmentId: string, responses: Record<string, any>) => {
    try {
      await questionnaireAssignmentService.saveDraftResponses(assignmentId, responses);
    } catch (err: any) {
      setError(err.message || 'Failed to save draft');
      throw err;
    }
  };

  const loadDraft = (assignmentId: string) => {
    try {
      return questionnaireAssignmentService.loadDraftResponses(assignmentId);
    } catch (err: any) {
      setError(err.message || 'Failed to load draft');
      return null;
    }
  };

  const updateStatus = async (assignmentId: string, status: string) => {
    try {
      const result = await questionnaireAssignmentService.updateStatus(assignmentId, status);
      await loadAssignments(); // Refresh the list
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
      throw err;
    }
  };

  const getClientResponses = async (filters = {}) => {
    try {
      return await questionnaireAssignmentService.getClientResponses(filters);
    } catch (err: any) {
      setError(err.message || 'Failed to get client responses');
      throw err;
    }
  };

  return {
    assignments,
    loading,
    error,
    loadAssignments,
    submitResponse,
    viewResponse,
    saveDraft,
    loadDraft,
    updateStatus,
    getClientResponses,
    service: questionnaireAssignmentService
  };
};
