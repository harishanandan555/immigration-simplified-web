import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Eye, Copy, Download, Upload, Save, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { FormTemplate, FormTemplateField } from '../../controllers/SettingsControllers';
import { FORM_FIELD_TYPES } from '../../utils/constants';

interface QuestionnaireQuestion {
  id: string;
  question: string;
  type: keyof typeof FORM_FIELD_TYPES;
  required: boolean;
  helpText?: string;
  placeholder?: string;
  options?: string[];
  order: number;
  conditional?: {
    questionId: string;
    value: any;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  };
}

interface Questionnaire {
  _id?: string;
  name: string;
  description: string;
  category: string;
  formTemplateId?: string;
  questions: QuestionnaireQuestion[];
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface QuestionnaireBuilderProps {
  userId: string;
  isSuperAdmin: boolean;
  isAttorney: boolean;
  formTemplates: FormTemplate[];
}

export const QuestionnaireBuilder: React.FC<QuestionnaireBuilderProps> = ({
  userId,
  isSuperAdmin,
  isAttorney,
  formTemplates
}) => {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [showAddQuestionnaire, setShowAddQuestionnaire] = useState(false);
  const [showEditQuestionnaire, setShowEditQuestionnaire] = useState(false);
  const [showDeleteQuestionnaire, setShowDeleteQuestionnaire] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionnaireQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(-1);

  const categories = [
    'Family-Based Immigration',
    'Employment-Based Immigration',
    'Naturalization',
    'Asylum',
    'Temporary Visas',
    'Business Immigration',
    'General Assessment'
  ];

  const filteredQuestionnaires = questionnaires.filter(q => {
    const matchesSearch = q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         q.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || q.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleQuestionnaireChange = (field: string, value: any) => {
    if (!selectedQuestionnaire) return;
    
    setSelectedQuestionnaire(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  const handleQuestionChange = (field: string, value: any) => {
    if (!editingQuestion) return;
    
    setEditingQuestion(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  const addQuestion = () => {
    const newQuestion: QuestionnaireQuestion = {
      id: Date.now().toString(),
      question: '',
      type: 'TEXT',
      required: false,
      helpText: '',
      placeholder: '',
      options: [],
      order: selectedQuestionnaire?.questions.length || 0
    };
    
    setEditingQuestion(newQuestion);
    setQuestionIndex(-1);
    setShowQuestionEditor(true);
  };

  const editQuestion = (question: QuestionnaireQuestion, index: number) => {
    setEditingQuestion({ ...question });
    setQuestionIndex(index);
    setShowQuestionEditor(true);
  };

  const saveQuestion = () => {
    if (!editingQuestion || !selectedQuestionnaire) return;

    const updatedQuestions = [...selectedQuestionnaire.questions];
    
    if (questionIndex >= 0) {
      // Edit existing question
      updatedQuestions[questionIndex] = editingQuestion;
    } else {
      // Add new question
      updatedQuestions.push(editingQuestion);
    }

    setSelectedQuestionnaire(prev => ({
      ...prev!,
      questions: updatedQuestions
    }));

    setShowQuestionEditor(false);
    setEditingQuestion(null);
    setQuestionIndex(-1);
  };

  const deleteQuestion = (index: number) => {
    if (!selectedQuestionnaire) return;

    const updatedQuestions = selectedQuestionnaire.questions.filter((_, i) => i !== index);
    setSelectedQuestionnaire(prev => ({
      ...prev!,
      questions: updatedQuestions
    }));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (!selectedQuestionnaire) return;

    const updatedQuestions = [...selectedQuestionnaire.questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < updatedQuestions.length) {
      [updatedQuestions[index], updatedQuestions[newIndex]] = [updatedQuestions[newIndex], updatedQuestions[index]];
      
      // Update order numbers
      updatedQuestions.forEach((q, i) => {
        q.order = i;
      });

      setSelectedQuestionnaire(prev => ({
        ...prev!,
        questions: updatedQuestions
      }));
    }
  };

  const generateFromTemplate = (template: FormTemplate) => {
    const questions: QuestionnaireQuestion[] = template.fields.map((field, index) => ({
      id: field.id,
      question: field.label,
      type: field.type,
      required: field.required,
      helpText: field.helpText,
      placeholder: field.placeholder,
      options: field.options,
      order: index
    }));

    setSelectedQuestionnaire(prev => ({
      ...prev!,
      formTemplateId: template._id,
      questions
    }));
  };

  const handleAddQuestionnaire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestionnaire) return;

    try {
      // Here you would call your API to save the questionnaire
      const newQuestionnaire = {
        ...selectedQuestionnaire,
        _id: Date.now().toString(),
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setQuestionnaires(prev => [...prev, newQuestionnaire]);
      setShowAddQuestionnaire(false);
      setSelectedQuestionnaire(null);
      toast.success('Questionnaire created successfully');
    } catch (error) {
      toast.error('Failed to create questionnaire');
    }
  };

  const handleEditQuestionnaire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestionnaire) return;

    try {
      // Here you would call your API to update the questionnaire
      const updatedQuestionnaire = {
        ...selectedQuestionnaire,
        updatedBy: userId,
        updatedAt: new Date().toISOString()
      };

      setQuestionnaires(prev => 
        prev.map(q => q._id === selectedQuestionnaire._id ? updatedQuestionnaire : q)
      );
      setShowEditQuestionnaire(false);
      setSelectedQuestionnaire(null);
      toast.success('Questionnaire updated successfully');
    } catch (error) {
      toast.error('Failed to update questionnaire');
    }
  };

  const handleDeleteQuestionnaire = async () => {
    if (!selectedQuestionnaire) return;

    try {
      // Here you would call your API to delete the questionnaire
      setQuestionnaires(prev => prev.filter(q => q._id !== selectedQuestionnaire._id));
      setShowDeleteQuestionnaire(false);
      setSelectedQuestionnaire(null);
      toast.success('Questionnaire deleted successfully');
    } catch (error) {
      toast.error('Failed to delete questionnaire');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Questionnaire Builder</h2>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search questionnaires..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input w-64"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-select"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedQuestionnaire({
                name: '',
                description: '',
                category: 'General Assessment',
                questions: [],
                isActive: true,
                createdBy: userId,
                updatedBy: userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              setShowAddQuestionnaire(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Questionnaire
          </button>
        </div>
      </div>

      {/* Questionnaire List */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredQuestionnaires.map(questionnaire => (
          <div key={questionnaire._id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{questionnaire.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{questionnaire.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => {
                    setSelectedQuestionnaire(questionnaire);
                    setShowEditQuestionnaire(true);
                  }}
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => {
                    setSelectedQuestionnaire(questionnaire);
                    setShowDeleteQuestionnaire(true);
                  }}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  questionnaire.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {questionnaire.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-sm text-gray-500">
                  {questionnaire.category}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <p>Questions: {questionnaire.questions.length}</p>
                <p>Last updated: {new Date(questionnaire.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Questionnaire Modal */}
      {(showAddQuestionnaire || showEditQuestionnaire) && selectedQuestionnaire && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {showAddQuestionnaire ? 'Add New Questionnaire' : 'Edit Questionnaire'}
            </h3>
            <form onSubmit={showAddQuestionnaire ? handleAddQuestionnaire : handleEditQuestionnaire}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Questionnaire Name</label>
                  <input
                    type="text"
                    value={selectedQuestionnaire.name}
                    onChange={(e) => handleQuestionnaireChange('name', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={selectedQuestionnaire.description}
                    onChange={(e) => handleQuestionnaireChange('description', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={selectedQuestionnaire.category}
                    onChange={(e) => handleQuestionnaireChange('category', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Form Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Generate from Form Template (Optional)</label>
                  <select
                    value={selectedQuestionnaire.formTemplateId || ''}
                    onChange={(e) => {
                      const template = formTemplates.find(t => t._id === e.target.value);
                      if (template) {
                        generateFromTemplate(template);
                      }
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a template</option>
                    {formTemplates.map(template => (
                      <option key={template._id} value={template._id}>{template.name}</option>
                    ))}
                  </select>
                </div>

                {/* Questions Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium text-gray-900">Questions</h4>
                    <button
                      type="button"
                      className="btn btn-outline text-sm"
                      onClick={addQuestion}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedQuestionnaire.questions.map((question, index) => (
                      <div key={question.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{question.question || 'Untitled Question'}</p>
                          <p className="text-xs text-gray-500">
                            Type: {question.type} • Required: {question.required ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500"
                            onClick={() => moveQuestion(index, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500"
                            onClick={() => moveQuestion(index, 'down')}
                            disabled={index === selectedQuestionnaire.questions.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500"
                            onClick={() => editQuestion(question, index)}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500"
                            onClick={() => deleteQuestion(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowAddQuestionnaire(false);
                    setShowEditQuestionnaire(false);
                    setSelectedQuestionnaire(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {showAddQuestionnaire ? 'Create Questionnaire' : 'Update Questionnaire'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Editor Modal */}
      {showQuestionEditor && editingQuestion && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {questionIndex >= 0 ? 'Edit Question' : 'Add Question'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Question</label>
                <input
                  type="text"
                  value={editingQuestion.question}
                  onChange={(e) => handleQuestionChange('question', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={editingQuestion.type}
                  onChange={(e) => handleQuestionChange('type', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  {Object.entries(FORM_FIELD_TYPES).map(([key, value]) => (
                    <option key={key} value={value}>{key.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Help Text</label>
                <textarea
                  value={editingQuestion.helpText || ''}
                  onChange={(e) => handleQuestionChange('helpText', e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Placeholder</label>
                <input
                  type="text"
                  value={editingQuestion.placeholder || ''}
                  onChange={(e) => handleQuestionChange('placeholder', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              {(editingQuestion.type === 'SELECT' || editingQuestion.type === 'MULTI_SELECT' || editingQuestion.type === 'RADIO') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Options</label>
                  <div className="space-y-2">
                    {(editingQuestion.options || []).map((option, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(editingQuestion.options || [])];
                            newOptions[index] = e.target.value;
                            handleQuestionChange('options', newOptions);
                          }}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = editingQuestion.options?.filter((_, i) => i !== index) || [];
                            handleQuestionChange('options', newOptions);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions = [...(editingQuestion.options || []), ''];
                        handleQuestionChange('options', newOptions);
                      }}
                      className="btn btn-outline text-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={editingQuestion.required}
                  onChange={(e) => handleQuestionChange('required', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="required" className="ml-2 block text-sm text-gray-700">
                  Required question
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowQuestionEditor(false);
                  setEditingQuestion(null);
                  setQuestionIndex(-1);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={saveQuestion}
              >
                {questionIndex >= 0 ? 'Update Question' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Questionnaire Confirmation Modal */}
      {showDeleteQuestionnaire && selectedQuestionnaire && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Questionnaire</h3>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete the questionnaire "{selectedQuestionnaire.name}"? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowDeleteQuestionnaire(false);
                  setSelectedQuestionnaire(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteQuestionnaire}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 