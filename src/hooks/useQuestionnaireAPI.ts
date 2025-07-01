import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { ImmigrationQuestionnaire, QuestionnaireField } from '../types/questionnaire';
import questionnaireService from '../services/questionnaireService';

// Local questionnaire interface that matches the component structure
export interface LocalQuestionnaire {
  id: string;
  title: string;
  description: string;
  category: 'family-based' | 'employment-based' | 'humanitarian' | 'citizenship' | 'temporary' | 'assessment' | 'general';
  fields: LocalQuestionnaireField[];
  settings: {
    show_progress_bar: boolean;
    allow_back_navigation: boolean;
    auto_save: boolean;
    show_results: boolean;
    theme: 'default' | 'modern' | 'minimal';
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  version?: number;
}

export interface LocalQuestionnaireField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'textarea' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'yesno' | 'rating' | 'file' | 'address';
  label: string;
  placeholder?: string;
  help_text?: string;
  required: boolean;
  eligibility_impact?: 'high' | 'medium' | 'low';
  options?: string[];
  validation?: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    min_value?: number;
    max_value?: number;
  };
  conditional_logic?: {
    show_if?: {
      field_id: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
    };
  };
  order: number;
}

export const useQuestionnaireAPI = () => {
  const [questionnaires, setQuestionnaires] = useState<LocalQuestionnaire[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert API format to local format
  const convertAPIToLocal = useCallback((apiQuestionnaire: ImmigrationQuestionnaire): LocalQuestionnaire => {
    return {
      id: apiQuestionnaire.id,
      title: apiQuestionnaire.title,
      description: apiQuestionnaire.description,
      category: apiQuestionnaire.category,
      fields: apiQuestionnaire.fields.map(field => ({
        id: field.id,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder,
        help_text: field.help_text,
        required: field.required,
        eligibility_impact: field.eligibility_impact,
        options: field.options,
        validation: field.validation,
        conditional_logic: field.conditional_logic,
        order: field.order
      })),
      settings: apiQuestionnaire.settings,
      is_active: apiQuestionnaire.is_active,
      created_at: apiQuestionnaire.created_at,
      updated_at: apiQuestionnaire.updated_at,
      version: apiQuestionnaire.version
    };
  }, []);

  // Convert local format to API format
  const convertLocalToAPI = useCallback((localQuestionnaire: LocalQuestionnaire): Omit<ImmigrationQuestionnaire, 'id' | 'created_by' | 'organization_id' | 'created_at' | 'updated_at' | 'version'> => {
    return {
      title: localQuestionnaire.title,
      description: localQuestionnaire.description,
      category: localQuestionnaire.category,
      settings: localQuestionnaire.settings,
      fields: localQuestionnaire.fields.map(field => ({
        id: field.id,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder,
        required: field.required,
        help_text: field.help_text,
        eligibility_impact: field.eligibility_impact || 'medium',
        options: field.options,
        validation: field.validation,
        conditional_logic: field.conditional_logic,
        order: field.order
      })),
      is_active: localQuestionnaire.is_active
    };
  }, []);

  // Load all questionnaires
  const loadQuestionnaires = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await questionnaireService.getQuestionnaires({
        is_active: true,
        limit: 100
      });
      
      const convertedQuestionnaires = response.questionnaires.map(convertAPIToLocal);
      setQuestionnaires(convertedQuestionnaires);
      
      // Export function to make questionnaires available globally
      (window as any).getImmigrationQuestionnaires = () => convertedQuestionnaires;
      (window as any).getQuestionnaireByCategory = (category: string) => 
        convertedQuestionnaires.filter(q => q.category === category);
        
    } catch (error: any) {
      console.error('Error loading questionnaires:', error);
      setError(error.message);
      toast.error('Failed to load questionnaires');
    } finally {
      setLoading(false);
    }
  }, [convertAPIToLocal]);

  // Create new questionnaire
  const createQuestionnaire = useCallback(async (questionnaire: LocalQuestionnaire): Promise<string | null> => {
    try {
      setLoading(true);
      const apiData = convertLocalToAPI(questionnaire);
      const response = await questionnaireService.createQuestionnaire(apiData);
      
      toast.success('Questionnaire created successfully');
      await loadQuestionnaires(); // Reload to get the created questionnaire
      
      return response.id;
    } catch (error: any) {
      console.error('Error creating questionnaire:', error);
      toast.error('Failed to create questionnaire: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [convertLocalToAPI, loadQuestionnaires]);

  // Update questionnaire
  const updateQuestionnaire = useCallback(async (id: string, questionnaire: LocalQuestionnaire): Promise<boolean> => {
    try {
      setLoading(true);
      const apiData = convertLocalToAPI(questionnaire);
      await questionnaireService.updateQuestionnaire(id, apiData);
      
      toast.success('Questionnaire updated successfully');
      await loadQuestionnaires(); // Reload to get updated data
      
      return true;
    } catch (error: any) {
      console.error('Error updating questionnaire:', error);
      toast.error('Failed to update questionnaire: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [convertLocalToAPI, loadQuestionnaires]);

  // Delete questionnaire
  const deleteQuestionnaire = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      await questionnaireService.deleteQuestionnaire(id);
      
      toast.success('Questionnaire deleted successfully');
      setQuestionnaires(prev => prev.filter(q => q.id !== id));
      
      return true;
    } catch (error: any) {
      console.error('Error deleting questionnaire:', error);
      toast.error('Failed to delete questionnaire: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Duplicate questionnaire
  const duplicateQuestionnaire = useCallback(async (id: string, newTitle: string): Promise<boolean> => {
    try {
      setLoading(true);
      await questionnaireService.duplicateQuestionnaire(id, {
        title: newTitle,
        description: 'Duplicated questionnaire'
      });
      
      toast.success('Questionnaire duplicated successfully');
      await loadQuestionnaires(); // Reload to show new questionnaire
      
      return true;
    } catch (error: any) {
      console.error('Error duplicating questionnaire:', error);
      toast.error('Failed to duplicate questionnaire: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadQuestionnaires]);

  // Export questionnaire
  const exportQuestionnaire = useCallback(async (id: string): Promise<boolean> => {
    try {
      await questionnaireService.exportQuestionnaire(id);
      toast.success('Questionnaire exported successfully');
      return true;
    } catch (error: any) {
      console.error('Error exporting questionnaire:', error);
      toast.error('Failed to export questionnaire: ' + error.message);
      return false;
    }
  }, []);

  // Import questionnaire
  const importQuestionnaire = useCallback(async (file: File): Promise<boolean> => {
    try {
      setLoading(true);
      const importedData = await questionnaireService.importQuestionnaire(file);
      await questionnaireService.createQuestionnaire(importedData);
      
      toast.success('Questionnaire imported successfully');
      await loadQuestionnaires(); // Reload to show imported questionnaire
      
      return true;
    } catch (error: any) {
      console.error('Error importing questionnaire:', error);
      toast.error('Failed to import questionnaire: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadQuestionnaires]);

  // Get questionnaires by category
  const getQuestionnairesByCategory = useCallback((category: string): LocalQuestionnaire[] => {
    return questionnaires.filter(q => q.category === category && q.is_active);
  }, [questionnaires]);

  // Search questionnaires
  const searchQuestionnaires = useCallback((query: string): LocalQuestionnaire[] => {
    const lowercaseQuery = query.toLowerCase();
    return questionnaires.filter(q => 
      q.title.toLowerCase().includes(lowercaseQuery) ||
      q.description.toLowerCase().includes(lowercaseQuery)
    );
  }, [questionnaires]);

  // Load questionnaires on hook initialization
  useEffect(() => {
    loadQuestionnaires();
  }, [loadQuestionnaires]);

  return {
    // State
    questionnaires,
    loading,
    error,
    
    // Actions
    loadQuestionnaires,
    createQuestionnaire,
    updateQuestionnaire,
    deleteQuestionnaire,
    duplicateQuestionnaire,
    exportQuestionnaire,
    importQuestionnaire,
    
    // Utility functions
    getQuestionnairesByCategory,
    searchQuestionnaires,
    
    // Data conversion utilities
    convertAPIToLocal,
    convertLocalToAPI
  };
}; 