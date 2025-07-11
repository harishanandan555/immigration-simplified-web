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
  ChevronUp,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  List,
  FileText,
  Mail,
  Phone,
  MapPin,
  Clock,
  Star,
  Image,
  Paperclip,
  ToggleLeft,
  AlignLeft,
  HelpCircle,
  Settings,
  Users,
  Briefcase,
  Heart,
  Shield,
  Plane,
  Clipboard,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';

// Enhanced interfaces for questionnaire system
export interface QuestionnaireField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'time' | 'datetime' | 'textarea' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'file' | 'rating' | 'address' | 'switch' | 'slider' | 'yesno' | 'scale';
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  options?: string[];
  defaultValue?: any;
  conditional?: {
    field: string;
    value: any;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  };
  width?: 'full' | 'half' | 'third' | 'quarter';
  order: number;
  // Questionnaire-specific properties
  weight?: number; // For scoring/assessment
  category?: string; // For grouping questions
  subcategory?: string;
  eligibilityImpact?: 'high' | 'medium' | 'low'; // How much this affects eligibility
}

export interface ImmigrationQuestionnaire {
  id: string;
  name: string;
  description: string;
  category: 'family-based' | 'employment-based' | 'humanitarian' | 'citizenship' | 'temporary' | 'assessment' | 'general';
  subcategory?: string;
  questions: QuestionnaireField[];
  settings: {
    showProgressBar: boolean;
    allowBackNavigation: boolean;
    saveProgress: boolean;
    requireAllQuestions: boolean;
    showResults: boolean;
    resultsBased: 'score' | 'logic' | 'simple';
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ... existing FormField interface for backward compatibility
export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'time' | 'datetime' | 'textarea' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'file' | 'rating' | 'address' | 'switch' | 'slider';
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  options?: string[];
  defaultValue?: any;
  conditional?: {
    field: string;
    value: any;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  };
  width?: 'full' | 'half' | 'third' | 'quarter';
  order: number;
}

export interface CustomForm {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: FormField[];
  settings: {
    submitButtonText: string;
    successMessage: string;
    redirectUrl?: string;
    emailNotification: boolean;
    saveProgress: boolean;
    multiPage: boolean;
    theme: 'default' | 'modern' | 'minimal';
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormBuilderProps {
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
  { type: 'scale', label: 'Rating Scale', icon: Star },
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

export const FormBuilder: React.FC<FormBuilderProps> = ({
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
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Load saved questionnaires from localStorage on component mount
  useEffect(() => {
    const savedQuestionnaires = localStorage.getItem('immigration-questionnaires');
    if (savedQuestionnaires) {
      try {
        setQuestionnaires(JSON.parse(savedQuestionnaires));
      } catch (error) {
        console.error('Error loading questionnaires:', error);
      }
    }
  }, []);

  // Save questionnaires to localStorage whenever questionnaires change
  useEffect(() => {
    localStorage.setItem('immigration-questionnaires', JSON.stringify(questionnaires));
  }, [questionnaires]);

  // Export function to make questionnaires available globally
  useEffect(() => {
    (window as any).getImmigrationQuestionnaires = () => questionnaires;
  }, [questionnaires]);

  const createNewQuestionnaire = () => {
    const newQuestionnaire: ImmigrationQuestionnaire = {
      id: Date.now().toString(),
      name: 'New Immigration Questionnaire',
      description: '',
      category: 'assessment',
      questions: [],
      settings: {
        showProgressBar: true,
        allowBackNavigation: true,
        saveProgress: true,
        requireAllQuestions: false,
        showResults: true,
        resultsBased: 'logic',
        theme: 'default'
      },
      scoring: {
        maxScore: 100,
        passScore: 70,
        categories: []
      },
      results: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setQuestionnaires(prev => [...prev, newQuestionnaire]);
    setSelectedQuestionnaire(newQuestionnaire);
    setShowQuestionnaireSettings(true);
  };

  const addQuestionnaireField = (type: string) => {
    if (!selectedQuestionnaire) return;

    const newField: QuestionnaireField = {
      id: Date.now().toString(),
      type: type as QuestionnaireField['type'],
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Question`,
      placeholder: '',
      helpText: '',
      required: false,
      validation: {},
      options: type === 'select' || type === 'multiselect' || type === 'radio' || type === 'checkbox' ? ['Option 1', 'Option 2'] : 
               type === 'yesno' ? ['Yes', 'No'] :
               type === 'scale' ? ['1', '2', '3', '4', '5'] : undefined,
      width: 'full',
      order: selectedQuestionnaire.questions.length,
      weight: 1,
      category: selectedQuestionnaire.category,
      eligibilityImpact: 'medium'
    };

    setSelectedQuestionnaire(prev => ({
      ...prev!,
      questions: [...prev!.questions, newField]
    }));

    setEditingField(newField);
    setShowFieldEditor(true);
  };

  const editQuestionnaireField = (field: QuestionnaireField) => {
    setEditingField({ ...field });
    setShowFieldEditor(true);
  };

  const saveField = () => {
    if (!editingField || !selectedQuestionnaire) return;

    setSelectedQuestionnaire(prev => ({
      ...prev!,
      questions: prev!.questions.map(field => 
        field.id === editingField.id ? editingField : field
      ),
      updatedAt: new Date().toISOString()
    }));

    setShowFieldEditor(false);
    setEditingField(null);
  };

  const deleteQuestionnaireField = (fieldId: string) => {
    if (!selectedQuestionnaire) return;

    setSelectedQuestionnaire(prev => ({
      ...prev!,
      questions: prev!.questions.filter(field => field.id !== fieldId),
      updatedAt: new Date().toISOString()
    }));
  };

  const saveQuestionnaire = async () => {
    if (!selectedQuestionnaire) return;

    try {
      const updatedQuestionnaire = {
        ...selectedQuestionnaire,
        updatedAt: new Date().toISOString()
      };

      setQuestionnaires(prev => 
        prev.map(q => q.id === selectedQuestionnaire.id ? updatedQuestionnaire : q)
      );

      setSelectedQuestionnaire(updatedQuestionnaire);
      toast.success('Questionnaire saved successfully!');
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      toast.error('Failed to save questionnaire');
    }
  };

  const deleteQuestionnaire = (questionnaireId: string) => {
    setQuestionnaires(prev => prev.filter(q => q.id !== questionnaireId));
    if (selectedQuestionnaire?.id === questionnaireId) {
      setSelectedQuestionnaire(null);
    }
    toast.success('Questionnaire deleted');
  };

  const duplicateQuestionnaire = (questionnaire: ImmigrationQuestionnaire) => {
    const duplicated = {
      ...questionnaire,
      id: Date.now().toString(),
      name: `${questionnaire.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setQuestionnaires(prev => [...prev, duplicated]);
    toast.success('Questionnaire duplicated');
  };

  const exportQuestionnaire = (questionnaire: ImmigrationQuestionnaire) => {
    const dataStr = JSON.stringify(questionnaire, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `questionnaire-${questionnaire.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importQuestionnaire = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const questionnaire = JSON.parse(e.target?.result as string);
        questionnaire.id = Date.now().toString();
        questionnaire.createdAt = new Date().toISOString();
        questionnaire.updatedAt = new Date().toISOString();
        
        setQuestionnaires(prev => [...prev, questionnaire]);
        toast.success('Questionnaire imported successfully');
      } catch (error) {
        toast.error('Failed to import questionnaire');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && selectedQuestionnaire) {
      const draggedItem = selectedQuestionnaire.questions[dragItem.current];
      const remainingItems = selectedQuestionnaire.questions.filter((_, index) => index !== dragItem.current);
      
      const reorderedItems = [
        ...remainingItems.slice(0, dragOverItem.current),
        draggedItem,
        ...remainingItems.slice(dragOverItem.current)
      ];

      setSelectedQuestionnaire(prev => ({
        ...prev!,
        questions: reorderedItems.map((item, index) => ({ ...item, order: index }))
      }));
    }
    
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const filteredQuestionnaires = questionnaires.filter(questionnaire => {
    const matchesSearch = questionnaire.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        questionnaire.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || questionnaire.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderFieldEditor = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {editingField ? 'Edit Question' : 'Add Question'}
          </h3>
          <button
            onClick={() => setShowFieldEditor(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {editingField && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
              <input
                type="text"
                value={editingField.label}
                onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your question..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
              <select
                value={editingField.type}
                onChange={(e) => setEditingField({ ...editingField, type: e.target.value as QuestionnaireField['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {questionnaireFieldTypes.map(type => (
                  <option key={type.type} value={type.type}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Help Text</label>
              <textarea
                value={editingField.helpText || ''}
                onChange={(e) => setEditingField({ ...editingField, helpText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Additional instructions or help text..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Placeholder Text</label>
              <input
                type="text"
                value={editingField.placeholder || ''}
                onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Placeholder text..."
              />
            </div>

            {(editingField.type === 'select' || editingField.type === 'multiselect' || 
              editingField.type === 'radio' || editingField.type === 'checkbox') && 
              editingField.type !== 'yesno' && editingField.type !== 'scale' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                <div className="space-y-2">
                  {editingField.options?.map((option, index) => (
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
                      />
                      <button
                        onClick={() => {
                          const newOptions = editingField.options?.filter((_, i) => i !== index);
                          setEditingField({ ...editingField, options: newOptions });
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newOptions = [...(editingField.options || []), 'New Option'];
                      setEditingField({ ...editingField, options: newOptions });
                    }}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Option
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Required</label>
                <select
                  value={editingField.required ? 'true' : 'false'}
                  onChange={(e) => setEditingField({ ...editingField, required: e.target.value === 'true' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="false">Optional</option>
                  <option value="true">Required</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Eligibility Impact</label>
                <select
                  value={editingField.eligibilityImpact || 'medium'}
                  onChange={(e) => setEditingField({ ...editingField, eligibilityImpact: e.target.value as 'high' | 'medium' | 'low' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low Impact</option>
                  <option value="medium">Medium Impact</option>
                  <option value="high">High Impact</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                onClick={() => setShowFieldEditor(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveField}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Question
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Questionnaire Settings</h3>
          <button
            onClick={() => setShowQuestionnaireSettings(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {selectedQuestionnaire && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Questionnaire Name *</label>
              <input
                type="text"
                value={selectedQuestionnaire.name}
                onChange={(e) => setSelectedQuestionnaire({ ...selectedQuestionnaire, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={selectedQuestionnaire.description}
                onChange={(e) => setSelectedQuestionnaire({ ...selectedQuestionnaire, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Immigration Category</label>
              <select
                value={selectedQuestionnaire.category}
                onChange={(e) => setSelectedQuestionnaire({ 
                  ...selectedQuestionnaire, 
                  category: e.target.value as ImmigrationQuestionnaire['category']
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {immigrationCategories.map(category => (
                  <option key={category.id} value={category.id}>{category.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedQuestionnaire.settings.showProgressBar}
                    onChange={(e) => setSelectedQuestionnaire({
                      ...selectedQuestionnaire,
                      settings: { ...selectedQuestionnaire.settings, showProgressBar: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  Show Progress Bar
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedQuestionnaire.settings.allowBackNavigation}
                    onChange={(e) => setSelectedQuestionnaire({
                      ...selectedQuestionnaire,
                      settings: { ...selectedQuestionnaire.settings, allowBackNavigation: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  Allow Back Navigation
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedQuestionnaire.settings.saveProgress}
                    onChange={(e) => setSelectedQuestionnaire({
                      ...selectedQuestionnaire,
                      settings: { ...selectedQuestionnaire.settings, saveProgress: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  Save Progress
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedQuestionnaire.settings.showResults}
                    onChange={(e) => setSelectedQuestionnaire({
                      ...selectedQuestionnaire,
                      settings: { ...selectedQuestionnaire.settings, showResults: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  Show Results
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                onClick={() => setShowQuestionnaireSettings(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveQuestionnaire();
                  setShowQuestionnaireSettings(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!isSuperAdmin && !isAttorney) {
    return null;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Questionnaires List */}
        <div className="space-y-6 bg-white border border-gray-100 rounded-xl shadow-sm p-6 h-fit">
          <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-blue-500" />
            Questionnaires <span className="text-xs text-gray-400 font-normal">({filteredQuestionnaires.length})</span>
          </h3>
          <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
            {filteredQuestionnaires.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <HelpCircle size={40} className="mx-auto mb-2 text-gray-200" />
                <p>No questionnaires found</p>
              </div>
            ) : (
              filteredQuestionnaires.map(questionnaire => (
                <div
                  key={questionnaire.id}
                  className={`transition border rounded-lg cursor-pointer hover:shadow-md hover:border-blue-400 bg-gray-50 px-4 py-3 ${
                    selectedQuestionnaire?.id === questionnaire.id ? 'border-blue-500 bg-blue-50 shadow' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedQuestionnaire(questionnaire)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-base mb-1">{questionnaire.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <FileText className="w-4 h-4 text-blue-400" />
                        {immigrationCategories.find(c => c.id === questionnaire.category)?.label}
                        <span className="ml-2 text-gray-400">{questionnaire.questions.length} questions</span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{questionnaire.description}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportQuestionnaire(questionnaire);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Export"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateQuestionnaire(questionnaire);
                        }}
                        className="p-1 text-gray-400 hover:text-green-600"
                        title="Duplicate"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteQuestionnaire(questionnaire.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Questionnaire Builder */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-8 min-h-[32rem] flex flex-col">
          {selectedQuestionnaire ? (
            <div className="space-y-8 flex-1 flex flex-col">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b pb-4">
                <div>
                  <h3 className="font-bold text-xl text-gray-900 mb-1">{selectedQuestionnaire.name}</h3>
                  <p className="text-sm text-gray-500">{selectedQuestionnaire.questions.length} questions</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    onClick={() => setShowQuestionnaireSettings(true)}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center font-medium"
                  >
                    <Settings size={16} className="mr-1" />
                    Settings
                  </button>
                  <button
                    onClick={() => setPreviewMode(true)}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center font-medium"
                  >
                    <Eye size={16} className="mr-1" />
                    Preview
                  </button>
                  <button
                    onClick={saveQuestionnaire}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center font-medium shadow-sm"
                  >
                    <Save size={16} className="mr-1" />
                    Save
                  </button>
                </div>
              </div>

              {/* Question Types Palette */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Add Questions</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {questionnaireFieldTypes.map(fieldType => (
                    <button
                      key={fieldType.type}
                      onClick={() => addQuestionnaireField(fieldType.type)}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 text-xs flex flex-col items-center transition shadow-sm"
                    >
                      <fieldType.icon size={18} className="mb-1 text-blue-500" />
                      {fieldType.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions List */}
              <div className="flex-1 flex flex-col">
                <h4 className="font-semibold text-gray-900 mb-2">Questions</h4>
                <div className="space-y-3 flex-1">
                  {selectedQuestionnaire.questions
                    .sort((a, b) => a.order - b.order)
                    .map((question, index) => (
                      <div
                        key={question.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragEnd={handleDragEnd}
                        className="p-4 border border-gray-200 rounded-lg bg-white hover:bg-blue-50 cursor-move flex justify-between items-center shadow-sm transition"
                      >
                        <div className="flex items-center gap-3">
                          <Move size={18} className="text-gray-300" />
                          <div>
                            <span className="font-medium text-gray-900">{question.label}</span>
                            <span className="text-xs text-gray-500 ml-2">({question.type})</span>
                            {question.required && (
                              <span className="text-xs text-red-500 ml-2">Required</span>
                            )}
                            {question.eligibilityImpact === 'high' && (
                              <span className="text-xs text-orange-500 ml-2">High Impact</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => editQuestionnaireField(question)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => deleteQuestionnaireField(question.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}

                  {selectedQuestionnaire.questions.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <HelpCircle size={48} className="mx-auto mb-2 text-gray-200" />
                      <p className="font-medium">No questions added yet</p>
                      <p className="text-sm">Click on a question type above to get started</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[20rem] text-gray-400 text-center">
              <HelpCircle size={56} className="mx-auto mb-4 text-gray-200" />
              <p className="text-xl font-semibold">No questionnaire selected</p>
              <p className="text-base">Select a questionnaire from the list or create a new one to start building</p>
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