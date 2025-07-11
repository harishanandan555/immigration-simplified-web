import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  Eye,
  Copy,
  Download,
  Upload,
  Move,
  ChevronDown,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  List,
  FileText,
  Mail,
  Phone,
  MapPin,
  Star,
  Paperclip,
  AlignLeft,
  HelpCircle,
  Settings,
  Users,
  Briefcase,
  Heart,
  Shield,
  Plane,
  X,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  ImmigrationQuestionnaire as APIQuestionnaire, 
  QuestionnaireField as APIField 
} from '../../types/questionnaire';
import questionnaireService from '../../services/questionnaireService';

// Enhanced interfaces for questionnaire system
export interface QuestionnaireField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'textarea' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'yesno' | 'rating' | 'file' | 'address';
  label: string;
  placeholder?: string;
  help_text?: string;
  required: boolean;
  validation?: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    min_value?: number;
    max_value?: number;
  };
  options?: string[];
  defaultValue?: any;
  conditional_logic?: {
    show_if?: {
      field_id: string;
      value: any;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    };
  };
  width?: 'full' | 'half' | 'third' | 'quarter';
  order: number;
  // Questionnaire-specific properties
  weight?: number;
  category?: string;
  subcategory?: string;
  eligibility_impact?: 'high' | 'medium' | 'low';
}

export interface ImmigrationQuestionnaire {
  id: string;
  title: string;
  description: string;
  category: 'family-based' | 'employment-based' | 'humanitarian' | 'citizenship' | 'temporary' | 'assessment' | 'general';
  subcategory?: string;
  fields: QuestionnaireField[];
  settings: {
    show_progress_bar: boolean;
    allow_back_navigation: boolean;
    auto_save: boolean;
    require_completion?: boolean;
    show_results: boolean;
    theme: 'default' | 'modern' | 'minimal';
  };
  scoring?: {
    maxScore: number;
    passScore: number;
    categories: Array<{
      name: string;
      weight: number;
      threshold: number;
    }>;
  };
  results?: Array<{
    condition: string;
    title: string;
    description: string;
    recommendedForms: string[];
    nextSteps: string[];
  }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  version?: number;
}

interface QuestionnaireBuilderProps {
  userId: string;
  isSuperAdmin: boolean;
  isAttorney: boolean;
}

const questionnaireFieldTypes = [
  { type: 'text', label: 'Text Input', icon: Type },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'textarea', label: 'Text Area', icon: AlignLeft },
  { type: 'select', label: 'Dropdown', icon: ChevronDown },
  { type: 'multiselect', label: 'Multi Select', icon: List },
  { type: 'radio', label: 'Radio Buttons', icon: CheckSquare },
  { type: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
  { type: 'yesno', label: 'Yes/No', icon: CheckSquare },
  { type: 'rating', label: 'Rating Scale', icon: Star },
  { type: 'file', label: 'File Upload', icon: Paperclip },
  { type: 'address', label: 'Address', icon: MapPin },
];

const immigrationCategories = [
  { id: 'family-based', label: 'Family-Based Immigration', icon: Users },
  { id: 'employment-based', label: 'Employment-Based Immigration', icon: Briefcase },
  { id: 'humanitarian', label: 'Humanitarian Relief', icon: Heart },
  { id: 'citizenship', label: 'Citizenship & Naturalization', icon: Shield },
  { id: 'temporary', label: 'Temporary Visas & Status', icon: Plane },
  { id: 'assessment', label: 'General Assessment', icon: HelpCircle },
  { id: 'general', label: 'General Purpose', icon: FileText },
];

export const QuestionnaireBuilder: React.FC<QuestionnaireBuilderProps> = ({
  userId,
  isSuperAdmin,
  isAttorney
}) => {
  const [questionnaires, setQuestionnaires] = useState<ImmigrationQuestionnaire[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<ImmigrationQuestionnaire | null>(null);
  const [editingField, setEditingField] = useState<QuestionnaireField | null>(null);
  const [showQuestionnaireSettings, setShowQuestionnaireSettings] = useState(false);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddQuestionsGuide, setShowAddQuestionsGuide] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Load questionnaires from API on component mount
  useEffect(() => {
    loadQuestionnaires();
  }, []);

  const loadQuestionnaires = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if API is available
      const isAPIAvailable = await questionnaireService.isAPIAvailable();
      let loadedQuestionnaires = [];
      
      if (isAPIAvailable) {
        // Load from API
        const response = await questionnaireService.getQuestionnaires({
          is_active: true,
          limit: 100
        });
        
        // Convert API format to local format
        const convertedQuestionnaires = response.questionnaires.map(convertAPIToLocal);
        setQuestionnaires(convertedQuestionnaires);
        loadedQuestionnaires = convertedQuestionnaires;
        
        // Export function to make questionnaires available globally
        (window as any).getImmigrationQuestionnaires = () => convertedQuestionnaires;
        (window as any).getQuestionnaireByCategory = (category: string) => 
          convertedQuestionnaires.filter((q: ImmigrationQuestionnaire) => q.category === category);
      } else {
        // Fallback to localStorage
        const savedQuestionnaires = localStorage.getItem('immigration-questionnaires');
        if (savedQuestionnaires) {
          const localQuestionnaires = JSON.parse(savedQuestionnaires);
          setQuestionnaires(localQuestionnaires);
          loadedQuestionnaires = localQuestionnaires;
          
          (window as any).getImmigrationQuestionnaires = () => localQuestionnaires;
          (window as any).getQuestionnaireByCategory = (category: string) => 
            localQuestionnaires.filter((q: ImmigrationQuestionnaire) => q.category === category);
        }
      }
      
      return loadedQuestionnaires;
        
    } catch (error: any) {
      console.error('Error loading questionnaires:', error);
      setError('Failed to load questionnaires: ' + error.message);
      toast.error('Failed to load questionnaires');
      
      // Fallback to localStorage on error
      try {
        const savedQuestionnaires = localStorage.getItem('immigration-questionnaires');
        if (savedQuestionnaires) {
          setQuestionnaires(JSON.parse(savedQuestionnaires));
        }
      } catch (localError) {
        console.error('Error loading from localStorage:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Convert API questionnaire format to local format
  const convertAPIToLocal = (apiQuestionnaire: any): ImmigrationQuestionnaire => {
    return {
      id: apiQuestionnaire.id,
      title: apiQuestionnaire.title,
      description: apiQuestionnaire.description,
      category: apiQuestionnaire.category,
      fields: apiQuestionnaire.fields.map((field: any) => ({
        ...field,
        help_text: field.help_text || undefined,
        eligibility_impact: field.eligibility_impact || 'medium'
      })),
      settings: apiQuestionnaire.settings,
      is_active: apiQuestionnaire.is_active,
      created_at: apiQuestionnaire.created_at,
      updated_at: apiQuestionnaire.updated_at,
      version: apiQuestionnaire.version
    };
  };

  // Convert local questionnaire format to API format
  const convertLocalToAPI = (localQuestionnaire: Partial<ImmigrationQuestionnaire>) => {
    if (!localQuestionnaire) {
      return {};
    }
    
    // Ensure fields have all required properties
    const formattedFields = localQuestionnaire.fields?.map((field, index) => ({
      id: field.id || `field_${Date.now()}_${index}`,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder || '',
      required: typeof field.required === 'boolean' ? field.required : false,
      help_text: field.help_text || '',
      eligibility_impact: field.eligibility_impact || 'medium',
      options: ['select', 'multiselect', 'radio', 'checkbox'].includes(field.type) ? 
        (field.options?.length ? field.options : ['Option 1', 'Option 2']) : 
        [],
      validation: field.validation || {},
      conditional_logic: field.conditional_logic || {},
      order: field.order !== undefined ? field.order : index,
      width: field.width || 'full',
      category: field.category || '',
      subcategory: field.subcategory || '',
      weight: field.weight || 1
    })) || [];
    
    // Format the settings object properly
    const formattedSettings = {
      show_progress_bar: localQuestionnaire.settings?.show_progress_bar !== false,
      allow_back_navigation: localQuestionnaire.settings?.allow_back_navigation !== false,
      auto_save: localQuestionnaire.settings?.auto_save !== false,
      require_completion: localQuestionnaire.settings?.require_completion === true,
      show_results: localQuestionnaire.settings?.show_results !== false,
      theme: localQuestionnaire.settings?.theme || 'default'
    };
    
    // Return formatted data for API
    return {
      title: localQuestionnaire.title || 'Unnamed Questionnaire',
      description: localQuestionnaire.description || '',
      category: localQuestionnaire.category || 'general',
      subcategory: localQuestionnaire.subcategory || '',
      settings: formattedSettings,
      fields: formattedFields,
      is_active: localQuestionnaire.is_active !== false,
      // Include metadata if updating an existing questionnaire
      ...(localQuestionnaire.id && localQuestionnaire.id !== 'new' ? { 
        id: localQuestionnaire.id,
        version: localQuestionnaire.version
      } : {})
    };
  };

  const createNewQuestionnaire = () => {
    const newQuestionnaire: ImmigrationQuestionnaire = {
      id: 'new',
      title: 'New Immigration Questionnaire',
      description: '',
      category: 'assessment',
      fields: [],
      settings: {
        show_progress_bar: true,
        allow_back_navigation: true,
        auto_save: true,
        require_completion: false,
        show_results: true,
        theme: 'default'
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setSelectedQuestionnaire(newQuestionnaire);
    setShowQuestionnaireSettings(true);
  };

  const addQuestionnaireField = (type: string) => {
    if (!selectedQuestionnaire) return;

    const newField: QuestionnaireField = {
      id: `field_${Date.now()}`,
      type: type as any,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      placeholder: '',
      help_text: '',
      required: false,
      eligibility_impact: 'medium',
      order: (selectedQuestionnaire.fields || []).length,
      options: ['select', 'multiselect', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : undefined
    };

    setEditingField(newField);
    setShowFieldEditor(true);
  };

  const editQuestionnaireField = (field: QuestionnaireField) => {
    setEditingField({ ...field });
    setShowFieldEditor(true);
  };

  const saveField = () => {
    if (!selectedQuestionnaire || !editingField) return;

    const updatedFields = [...selectedQuestionnaire.fields];
    const existingIndex = updatedFields.findIndex(f => f.id === editingField.id);

    if (existingIndex >= 0) {
      updatedFields[existingIndex] = editingField;
    } else {
      updatedFields.push(editingField);
    }

    setSelectedQuestionnaire({
      ...selectedQuestionnaire,
      fields: updatedFields
    });

    setEditingField(null);
    setShowFieldEditor(false);
    toast.success('Field saved successfully');
  };

  const deleteQuestionnaireField = (fieldId: string) => {
    if (!selectedQuestionnaire) return;

    setSelectedQuestionnaire({
      ...selectedQuestionnaire,
      fields: (selectedQuestionnaire.fields || []).filter(f => f.id !== fieldId)
    });
    toast.success('Field deleted successfully');
  };

  // Function to check if user is logged in before saving
  const checkLoginBeforeSave = async () => {
    // Check if there's a token
    const token = localStorage.getItem('auth_token') || 
                 sessionStorage.getItem('auth_token') || 
                 localStorage.getItem('access_token') || 
                 localStorage.getItem('token');
    
    if (!token) {
      toast.error('You must be logged in to save questionnaires.');
      setError('Authentication error: No login token found. Please log in.');
      return false;
    }
    
    return true;
  };

  const saveQuestionnaire = async () => {
    if (!selectedQuestionnaire) {
      toast.error('No questionnaire selected to save');
      return;
    }

    // Check login before saving
    const isLoggedIn = await checkLoginBeforeSave();
    if (!isLoggedIn) return;

    try {
      setLoading(true);
      setError(null);
      
      // Get and validate auth token
      const authToken = localStorage.getItem('auth_token') || 
                         sessionStorage.getItem('auth_token') || 
                         localStorage.getItem('access_token') || 
                         localStorage.getItem('token');
      
      if (!authToken) {
        toast.error('Authentication token not found. Please log in again.');
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Test authentication
      const authStatus = await questionnaireService.testAuthentication();
      
      if (!authStatus.isAuthenticated) {
        toast.error(`Authentication error: ${authStatus.message}. Please log in again.`);
        setError(`Authentication error: ${authStatus.message}`);
        setLoading(false);
        return;
      }
      
      // Check if API is available
      const isAPIAvailable = await questionnaireService.isAPIAvailable();
      
      if (!isAPIAvailable) {
        toast.error('API is not available. Please check your internet connection and try again.');
        setError('API is not available. Please check your internet connection and try again.');
        setLoading(false);
        return;
      }
      
      // Format and validate questionnaire data
      const apiData = convertLocalToAPI(selectedQuestionnaire);
      
      if (Object.keys(apiData).length === 0 || !(apiData as { title?: string }).title || (apiData as { title?: string }).title?.trim() === '') {
        toast.error('Questionnaire title is required');
        setError('Questionnaire title is required');
        setLoading(false);
        return;
      }
      
      if (selectedQuestionnaire.id === 'new') {
        // Create new questionnaire
        try {
          const response = await questionnaireService.createQuestionnaire(apiData as any);
          toast.success('Questionnaire created successfully');
          
          // Verify the questionnaire was created and fetch it
          try {
            const createdQuestionnaire = await questionnaireService.getQuestionnaireById(response.id);
            
            // Update UI with created questionnaire but keep the questionnaire selected
            const updatedQuestionnaires = await loadQuestionnaires();              // Find the newly created questionnaire and select it
              const newlyCreated = updatedQuestionnaires.find((q: ImmigrationQuestionnaire) => q.id === response.id);
              if (newlyCreated) {
                setSelectedQuestionnaire(newlyCreated);
                toast.info('Now you can add questions to your questionnaire');
                // Show the guide banner
                setShowAddQuestionsGuide(true);
                
                // Auto-hide the guide after 15 seconds
                setTimeout(() => {
                  setShowAddQuestionsGuide(false);
                }, 15000);
              } else {
                // If we can't find it for some reason, use the returned data with proper formatting
                const formattedNewQuestionnaire = {
                  ...createdQuestionnaire,
                  id: response.id,
                  fields: createdQuestionnaire.fields || []
                };
                setSelectedQuestionnaire(formattedNewQuestionnaire);
                setShowAddQuestionsGuide(true);
              }
              setShowQuestionnaireSettings(false);
            setShowAddQuestionsGuide(true);
            
          } catch (verifyError) {
            toast.warning('Questionnaire may not have been saved correctly. Please check and try again.');
          }
        } catch (apiError: any) {
          // Check for specific error types
          if (apiError.message.includes('Authentication') || apiError.message.includes('log in')) {
            toast.error('Authentication error. Please log in again.');
          } else if (apiError.message.includes('title already exists')) {
            toast.error('A questionnaire with this title already exists. Please choose a different title.');
          } else {
            toast.error(`Failed to create questionnaire: ${apiError.message}`);
          }
          setError(`Failed to create questionnaire: ${apiError.message}`);
        }
      } else {
        // Update existing questionnaire
        try {
          const response = await questionnaireService.updateQuestionnaire(selectedQuestionnaire.id, apiData as any);
          toast.success('Questionnaire updated successfully');
          
          // Reload questionnaires but keep the questionnaire selected
          const updatedQuestionnaires = await loadQuestionnaires();
          
          // Find the updated questionnaire and keep it selected
          const updatedQuestionnaire = updatedQuestionnaires.find((q: ImmigrationQuestionnaire) => q.id === selectedQuestionnaire.id);
          if (updatedQuestionnaire) {
            setSelectedQuestionnaire(updatedQuestionnaire);
          }
          setShowQuestionnaireSettings(false);
          
        } catch (updateError: any) {
          console.error('API error updating questionnaire:', updateError);
          
          // Check for specific error types
          if (updateError.message.includes('Authentication') || updateError.message.includes('log in')) {
            toast.error('Authentication error. Please log in again.');
          } else {
            toast.error(`Failed to update questionnaire: ${updateError.message}`);
          }
          
          setError(`Failed to update questionnaire: ${updateError.message}`);
        }
      }
    } catch (error: any) {
      console.error('Error saving questionnaire:', error);
      toast.error('Failed to save questionnaire: ' + error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };



  const deleteQuestionnaire = async (questionnaireId: string) => {
    if (!confirm('Are you sure you want to delete this questionnaire?')) return;

    try {
      setLoading(true);
      setError(null);
      
      // Get and validate auth token first
      const authToken = localStorage.getItem('auth_token') || 
                       sessionStorage.getItem('auth_token') || 
                       localStorage.getItem('access_token') || 
                       localStorage.getItem('token');
      
      if (!authToken) {
        toast.error('Authentication token not found. Please log in again.');
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Check if API is available
      const isAPIAvailable = await questionnaireService.isAPIAvailable();
      
      if (isAPIAvailable) {
        try {
          // Direct fetch approach for better error visibility
          const baseURL = import.meta.env.VITE_API_BASE_URL || 
                         (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
                           ? "http://localhost:5005/api/v1"
                           : "https://immigration-simplified-api.onrender.com/api/v1");
          
          const response = await fetch(`${baseURL}/questionnaires/${questionnaireId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            
            // Handle specific error codes
            if (response.status === 401) {
              toast.error('Authentication failed. Please log in again.');
            } else if (response.status === 404) {
              toast.error('Questionnaire not found. It may have been already deleted.');
            } else if (response.status === 403) {
              toast.error('You do not have permission to delete this questionnaire.');
            } else {
              toast.error(`Failed to delete: ${response.statusText}`);
            }
            
            throw new Error(`Delete failed: ${response.statusText}`);
          }
          
          // Successfully deleted
          toast.success('Questionnaire deleted successfully');
          
          // Remove from local state
          setQuestionnaires(prev => prev.filter((q: ImmigrationQuestionnaire) => q.id !== questionnaireId));
          
          // Clear selection if the deleted questionnaire was selected
          if (selectedQuestionnaire?.id === questionnaireId) {
            setSelectedQuestionnaire(null);
          }
        } catch (apiError: any) {
          toast.error(`Delete failed: ${apiError.message}`);
          throw apiError; // Re-throw to be caught by the outer catch
        }
      } else {
        // Fallback to localStorage
        const updatedQuestionnaires = questionnaires.filter((q: ImmigrationQuestionnaire) => q.id !== questionnaireId);
        setQuestionnaires(updatedQuestionnaires);
        localStorage.setItem('immigration-questionnaires', JSON.stringify(updatedQuestionnaires));
        toast.success('Questionnaire deleted successfully (offline)');
        
        // Update global functions
        (window as any).getImmigrationQuestionnaires = () => updatedQuestionnaires;
        (window as any).getQuestionnaireByCategory = (category: string) => 
          updatedQuestionnaires.filter((q: ImmigrationQuestionnaire) => q.category === category);
          
        // Clear selection if the deleted questionnaire was selected
        if (selectedQuestionnaire?.id === questionnaireId) {
          setSelectedQuestionnaire(null);
        }
      }
    } catch (error: any) {
      toast.error(`Failed to delete questionnaire: ${error.message || 'Unknown error'}`);
      setError(`Delete failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const duplicateQuestionnaire = async (questionnaire: ImmigrationQuestionnaire) => {
    try {
      setLoading(true);
      
      // Check if API is available
      const isAPIAvailable = await questionnaireService.isAPIAvailable();
      
      if (isAPIAvailable) {
        // Duplicate via API
        await questionnaireService.duplicateQuestionnaire(questionnaire.id, {
          title: `${questionnaire.title} (Copy)`,
          description: questionnaire.description
        });
        toast.success('Questionnaire duplicated successfully');
        await loadQuestionnaires();
      } else {
        // Fallback to localStorage
        const duplicated = {
          ...questionnaire,
          id: Date.now().toString(),
          title: `${questionnaire.title} (Copy)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: 1,
          fields: questionnaire.fields || []
        };
        
        const updatedQuestionnaires = [...questionnaires, duplicated];
        setQuestionnaires(updatedQuestionnaires);
        localStorage.setItem('immigration-questionnaires', JSON.stringify(updatedQuestionnaires));
        toast.success('Questionnaire duplicated successfully (offline)');
        
        // Update global functions
        (window as any).getImmigrationQuestionnaires = () => updatedQuestionnaires;
        (window as any).getQuestionnaireByCategory = (category: string) => 
          updatedQuestionnaires.filter((q: ImmigrationQuestionnaire) => q.category === category);
      }
    } catch (error: any) {
      console.error('Error duplicating questionnaire:', error);
      toast.error('Failed to duplicate questionnaire: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportQuestionnaire = async (questionnaire: ImmigrationQuestionnaire) => {
    try {
      await questionnaireService.exportQuestionnaire(questionnaire.id);
      toast.success('Questionnaire exported successfully');
    } catch (error: any) {
      console.error('Error exporting questionnaire:', error);
      toast.error('Failed to export questionnaire: ' + error.message);
    }
  };

  const importQuestionnaire = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const importedData = await questionnaireService.importQuestionnaire(file);
      const response = await questionnaireService.createQuestionnaire(importedData as any);
      
      toast.success('Questionnaire imported successfully');
      await loadQuestionnaires(); // Reload to show imported questionnaire
    } catch (error: any) {
      console.error('Error importing questionnaire:', error);
      toast.error('Failed to import questionnaire: ' + error.message);
    } finally {
      setLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };
  




  const filteredQuestionnaires = questionnaires.filter(questionnaire => {
    // Ensure questionnaire has required properties
    if (!questionnaire || typeof questionnaire !== 'object') {
      return false;
    }
    
    const title = questionnaire.title || '';
    const description = questionnaire.description || '';
    const category = questionnaire.category || '';
    
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderFieldEditor = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingField?.id?.startsWith('field_') ? 'Add Field' : 'Edit Field'}
          </h3>
          <button
            onClick={() => {
              setEditingField(null);
              setShowFieldEditor(false);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {editingField && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field Type
              </label>
              <select
                value={editingField.type}
                onChange={(e) => setEditingField({
                  ...editingField,
                  type: e.target.value as any,
                  options: ['select', 'multiselect', 'radio', 'checkbox'].includes(e.target.value) 
                    ? (editingField.options || ['Option 1', 'Option 2']) 
                    : undefined
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {questionnaireFieldTypes.map(type => (
                  <option key={type.type} value={type.type}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label *
              </label>
              <input
                type="text"
                value={editingField.label}
                onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter field label"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Placeholder Text
              </label>
              <input
                type="text"
                value={editingField.placeholder || ''}
                onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter placeholder text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Help Text
              </label>
              <textarea
                value={editingField.help_text || ''}
                onChange={(e) => setEditingField({ ...editingField, help_text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Provide additional guidance for this field"
              />
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingField.required}
                  onChange={(e) => setEditingField({ ...editingField, required: e.target.checked })}
                  className="mr-2"
                />
                Required Field
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eligibility Impact
                </label>
                <select
                  value={editingField.eligibility_impact || 'medium'}
                  onChange={(e) => setEditingField({ 
                    ...editingField, 
                    eligibility_impact: e.target.value as 'high' | 'medium' | 'low'
                  })}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low Impact</option>
                  <option value="medium">Medium Impact</option>
                  <option value="high">High Impact</option>
                </select>
              </div>
            </div>

            {['select', 'multiselect', 'radio', 'checkbox'].includes(editingField.type) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                <div className="space-y-2">
                  {(editingField.options || []).map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(editingField.options || [])];
                          newOptions[index] = e.target.value;
                          setEditingField({ ...editingField, options: newOptions });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Option ${index + 1}`}
                      />
                      <button
                        onClick={() => {
                          const newOptions = (editingField.options || []).filter((_, i) => i !== index);
                          setEditingField({ ...editingField, options: newOptions });
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newOptions = [...(editingField.options || []), `Option ${(editingField.options || []).length + 1}`];
                      setEditingField({ ...editingField, options: newOptions });
                    }}
                    className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Option
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => {
                  setEditingField(null);
                  setShowFieldEditor(false);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveField}
                disabled={!editingField.label.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Field
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderQuestionnaireSettings = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Questionnaire Settings
          </h3>
          <button
            onClick={() => setShowQuestionnaireSettings(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {selectedQuestionnaire && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Questionnaire Title *
              </label>
              <input
                type="text"
                value={selectedQuestionnaire.title}
                onChange={(e) => setSelectedQuestionnaire({
                  ...selectedQuestionnaire,
                  title: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter questionnaire title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={selectedQuestionnaire.description}
                onChange={(e) => setSelectedQuestionnaire({
                  ...selectedQuestionnaire,
                  description: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe the purpose of this questionnaire"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Immigration Category
              </label>
              <select
                value={selectedQuestionnaire.category}
                onChange={(e) => setSelectedQuestionnaire({
                  ...selectedQuestionnaire,
                  category: e.target.value as any
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {immigrationCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Display Settings</h4>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedQuestionnaire.settings.show_progress_bar}
                    onChange={(e) => setSelectedQuestionnaire({
                      ...selectedQuestionnaire,
                      settings: {
                        ...selectedQuestionnaire.settings,
                        show_progress_bar: e.target.checked
                      }
                    })}
                    className="mr-3"
                  />
                  Show Progress Bar
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedQuestionnaire.settings.allow_back_navigation}
                    onChange={(e) => setSelectedQuestionnaire({
                      ...selectedQuestionnaire,
                      settings: {
                        ...selectedQuestionnaire.settings,
                        allow_back_navigation: e.target.checked
                      }
                    })}
                    className="mr-3"
                  />
                  Allow Back Navigation
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedQuestionnaire.settings.auto_save}
                    onChange={(e) => setSelectedQuestionnaire({
                      ...selectedQuestionnaire,
                      settings: {
                        ...selectedQuestionnaire.settings,
                        auto_save: e.target.checked
                      }
                    })}
                    className="mr-3"
                  />
                  Auto-save Progress
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedQuestionnaire.settings.show_results}
                    onChange={(e) => setSelectedQuestionnaire({
                      ...selectedQuestionnaire,
                      settings: {
                        ...selectedQuestionnaire.settings,
                        show_results: e.target.checked
                      }
                    })}
                    className="mr-3"
                  />
                  Show Results After Completion
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select
                    value={selectedQuestionnaire.settings.theme}
                    onChange={(e) => setSelectedQuestionnaire({
                      ...selectedQuestionnaire,
                      settings: {
                        ...selectedQuestionnaire.settings,
                        theme: e.target.value as any
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="default">Default</option>
                    <option value="modern">Modern</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              {selectedQuestionnaire.id === 'new' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
                  <div className="font-medium mb-1">Creating a new questionnaire:</div>
                  <ol className="list-decimal list-inside space-y-1 pl-2">
                    <li>Save these basic settings first</li>
                    <li>Then add questions to your questionnaire</li>
                    <li>All changes will be saved to the database</li>
                  </ol>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowQuestionnaireSettings(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowQuestionnaireSettings(false);
                    saveQuestionnaire();
                  }}
                  disabled={!selectedQuestionnaire.title.trim() || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {selectedQuestionnaire.id === 'new' ? 'Create & Continue' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );



  // Helper function to check auth token


  if (!isSuperAdmin && !isAttorney) {
    return null;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Main Card Container for Header and Controls */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Immigration Form Builder</h2>
            <p className="text-gray-500 text-sm">Create, edit, and organize custom forms for all immigration categories.</p>
          </div>
          {/* Controls: search and filter on first row, buttons on second row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
            <input
              type="text"
              placeholder="Search questionnaires..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {immigrationCategories.map(category => (
                <option key={category.id} value={category.id}>{category.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
            <button
              onClick={createNewQuestionnaire}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center font-medium shadow-sm whitespace-nowrap"
              style={{ minWidth: 0 }}
            >
              <Plus size={18} className="mr-2" />
              New Questionnaire
            </button>
            <label className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 cursor-pointer flex items-center justify-center font-medium shadow-sm whitespace-nowrap" style={{ minWidth: 0 }}>
              <Upload size={18} className="mr-2" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={importQuestionnaire}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questionnaires List */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Questionnaires ({filteredQuestionnaires.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredQuestionnaires.map(questionnaire => (
              <div
                key={questionnaire.id}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  selectedQuestionnaire?.id === questionnaire.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedQuestionnaire(questionnaire)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{questionnaire.title}</h4>
                    <p className="text-sm text-gray-500">
                      {immigrationCategories.find(c => c.id === questionnaire.category)?.label}
                    </p>
                    <p className="text-xs text-gray-400">{questionnaire.fields?.length || 0} questions</p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportQuestionnaire(questionnaire);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateQuestionnaire(questionnaire);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteQuestionnaire(questionnaire.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredQuestionnaires.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <HelpCircle size={48} className="mx-auto mb-2 text-gray-300" />
                <p>No questionnaires found</p>
                <p className="text-sm">Create a new questionnaire to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Questionnaire Builder */}
        <div className="lg:col-span-2">
          {selectedQuestionnaire ? (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedQuestionnaire.title}</h3>
                    <p className="text-sm text-gray-500">{selectedQuestionnaire.fields?.length || 0} questions</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowQuestionnaireSettings(true)}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center"
                    >
                      <Settings size={16} className="mr-1" />
                      Settings
                    </button>
                    <button
                      onClick={saveQuestionnaire}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <Save size={16} className="mr-1" />
                      Save
                    </button>
                  </div>
                </div>
                
                {/* Guide banner that shows after creating a new questionnaire */}
                {showAddQuestionsGuide && (
                  <div className="mt-4 mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <Plus size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-green-800 font-medium mb-1">Ready to Add Questions!</h4>
                      <p className="text-green-700 text-sm mb-2">
                        Your questionnaire has been created. Now you can add questions by:
                      </p>
                      <ol className="list-decimal text-sm text-green-700 pl-5 space-y-1">
                        <li>Select a field type from the "Add Questions" section below</li>
                        <li>Configure your question details in the popup form</li>
                        <li>Click "Save Field" to add it to your questionnaire</li>
                      </ol>
                      <button 
                        onClick={() => setShowAddQuestionsGuide(false)}
                        className="text-sm text-green-700 hover:text-green-900 mt-2 underline"
                      >
                        Dismiss this message
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Question Types Palette */}
              <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Plus size={18} className="mr-2 text-blue-600" />
                  Add Questions to Questionnaire
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {questionnaireFieldTypes.map(fieldType => (
                    <button
                      key={fieldType.type}
                      onClick={() => addQuestionnaireField(fieldType.type)}
                      className="p-3 border border-gray-200 bg-white rounded-md hover:bg-blue-50 hover:border-blue-300 text-sm flex flex-col items-center transition-colors"
                    >
                      <fieldType.icon size={18} className="mb-2 text-gray-600" />
                      {fieldType.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Click on a field type above to add it to your questionnaire. You can reorder fields later by dragging.
                </p>
              </div>

              {/* Questions List */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Questions</h4>
                <div className="space-y-2">
                  {(selectedQuestionnaire.fields || [])
                    .sort((a, b) => a.order - b.order)
                    .map((question, index) => (
                      <div
                        key={question.id}
                        className="p-3 border border-gray-200 rounded-md bg-white hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <Move size={16} className="text-gray-400" />
                            <div>
                              <span className="font-medium text-gray-900">{question.label}</span>
                              <span className="text-sm text-gray-500 ml-2">({question.type})</span>
                              {question.required && (
                                <span className="text-xs text-red-500 ml-1">Required</span>
                              )}
                              {question.eligibility_impact === 'high' && (
                                <span className="text-xs text-orange-500 ml-1">High Impact</span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => editQuestionnaireField(question)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => deleteQuestionnaireField(question.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                  {(selectedQuestionnaire.fields || []).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <HelpCircle size={48} className="mx-auto mb-2 text-gray-300" />
                      <p>No questions added yet</p>
                      <p className="text-sm">Click on a question type above to get started</p>
                    </div>
                  )}
                </div>
              </div>

              {showAddQuestionsGuide && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
                  <div className="font-medium mb-2">Quick Start: Add Questions</div>
                  <p className="mb-2">Your new questionnaire is ready! Follow these steps to add questions:</p>
                  <ol className="list-decimal list-inside pl-5">
                    <li>Click on the question type buttons above to add fields.</li>
                    <li>Fill in the details for each question in the panel that appears.</li>
                    <li>Use the drag-and-drop feature to reorder questions as needed.</li>
                  </ol>
                  <p className="mt-2 font-medium">Tip:</p>
                  <p>Use the preview feature to see how your questionnaire looks to users.</p>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setShowAddQuestionsGuide(false)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    >
                      Got it, thanks!
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <HelpCircle size={48} className="mx-auto mb-2 text-gray-300" />
              <p>Select or create a questionnaire to start building</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      {showFieldEditor && renderFieldEditor()}
      {showQuestionnaireSettings && renderQuestionnaireSettings()}
    </div>
  );
};