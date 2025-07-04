# Questionnaire API Integration Example

## Complete Integration Guide

This document shows how to integrate the questionnaire API with your existing components by replacing localStorage calls with API service calls.

## 1. Environment Setup

First, add the API base URL to your environment variables:

```bash
# .env.local
REACT_APP_API_BASE_URL=https://api.immigration-simplified.com/v1
```

## 2. Service Integration Example

### Before (localStorage):
```typescript
// Old localStorage approach
const savedQuestionnaires = localStorage.getItem('immigration-questionnaires');
if (savedQuestionnaires) {
  setQuestionnaires(JSON.parse(savedQuestionnaires));
}

// Save questionnaire
localStorage.setItem('immigration-questionnaires', JSON.stringify(questionnaires));
```

### After (API service):
```typescript
// New API approach
import questionnaireService from '../services/questionnaireService';

// Load questionnaires
const loadQuestionnaires = async () => {
  try {
    setLoading(true);
    const response = await questionnaireService.getQuestionnaires({
      is_active: true,
      limit: 100
    });
    setQuestionnaires(response.questionnaires);
  } catch (error) {
    toast.error('Failed to load questionnaires');
  } finally {
    setLoading(false);
  }
};

// Save questionnaire
const saveQuestionnaire = async (questionnaire) => {
  try {
    if (questionnaire.id === 'new') {
      await questionnaireService.createQuestionnaire(questionnaire);
    } else {
      await questionnaireService.updateQuestionnaire(questionnaire.id, questionnaire);
    }
    toast.success('Questionnaire saved successfully');
    loadQuestionnaires(); // Reload to get updated data
  } catch (error) {
    toast.error('Failed to save questionnaire');
  }
};
```

## 3. QuestionnaireBuilder Component Integration

### Step 1: Replace localStorage logic

```typescript
// In src/components/settings/QuestionnaireBuilder.tsx

import questionnaireService from '../../services/questionnaireService';
import { ImmigrationQuestionnaire, QuestionnaireField } from '../../types/questionnaire';

export const QuestionnaireBuilder: React.FC<QuestionnaireBuilderProps> = ({
  userId,
  isSuperAdmin,
  isAttorney
}) => {
  const [questionnaires, setQuestionnaires] = useState<ImmigrationQuestionnaire[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Replace localStorage useEffect with API call
  useEffect(() => {
    loadQuestionnaires();
  }, []);

  const loadQuestionnaires = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await questionnaireService.getQuestionnaires({
        is_active: true
      });
      setQuestionnaires(response.questionnaires);
      
      // Keep global export for backward compatibility
      (window as any).getImmigrationQuestionnaires = () => response.questionnaires;
      (window as any).getQuestionnaireByCategory = (category: string) => 
        response.questionnaires.filter(q => q.category === category);
        
    } catch (error: any) {
      setError(error.message);
      toast.error('Failed to load questionnaires');
    } finally {
      setLoading(false);
    }
  };

  const saveQuestionnaire = async () => {
    if (!selectedQuestionnaire) return;

    try {
      setLoading(true);
      
      if (selectedQuestionnaire.id === 'new') {
        await questionnaireService.createQuestionnaire({
          title: selectedQuestionnaire.title,
          description: selectedQuestionnaire.description,
          category: selectedQuestionnaire.category,
          settings: selectedQuestionnaire.settings,
          fields: selectedQuestionnaire.fields,
          is_active: true
        });
        toast.success('Questionnaire created successfully');
      } else {
        await questionnaireService.updateQuestionnaire(selectedQuestionnaire.id, {
          title: selectedQuestionnaire.title,
          description: selectedQuestionnaire.description,
          category: selectedQuestionnaire.category,
          settings: selectedQuestionnaire.settings,
          fields: selectedQuestionnaire.fields,
          is_active: selectedQuestionnaire.is_active
        });
        toast.success('Questionnaire updated successfully');
      }
      
      await loadQuestionnaires(); // Reload to get updated data
      setSelectedQuestionnaire(null);
      
    } catch (error: any) {
      toast.error('Failed to save questionnaire: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestionnaire = async (questionnaireId: string) => {
    if (!confirm('Are you sure you want to delete this questionnaire?')) return;

    try {
      setLoading(true);
      await questionnaireService.deleteQuestionnaire(questionnaireId);
      toast.success('Questionnaire deleted successfully');
      
      // Remove from local state
      setQuestionnaires(prev => prev.filter(q => q.id !== questionnaireId));
      
      if (selectedQuestionnaire?.id === questionnaireId) {
        setSelectedQuestionnaire(null);
      }
    } catch (error: any) {
      toast.error('Failed to delete questionnaire: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add loading states to your render
  if (loading && questionnaires.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading questionnaires...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">Error loading questionnaires</div>
        <button 
          onClick={loadQuestionnaires}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Rest of your component render logic...
};
```

## 4. IndividualImmigrationProcess Integration

```typescript
// In src/pages/immigrationSteps/IndividualImmigrationProcess.tsx

import questionnaireService from '../../services/questionnaireService';

const IndividualImmigrationProcess: React.FC = () => {
  const [customQuestionnaires, setCustomQuestionnaires] = useState<LoadedQuestionnaire[]>([]);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(false);

  // Load questionnaires on component mount
  useEffect(() => {
    loadCustomQuestionnaires();
  }, []);

  const loadCustomQuestionnaires = async () => {
    try {
      setLoadingQuestionnaires(true);
      const response = await questionnaireService.getQuestionnaires({
        is_active: true,
        limit: 50
      });
      
      // Convert API format to component format
      const convertedQuestionnaires: LoadedQuestionnaire[] = response.questionnaires.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description,
        category: q.category,
        fields: q.fields.map(field => ({
          id: field.id,
          type: field.type,
          label: field.label,
          required: field.required,
          options: field.options,
          help_text: field.help_text,
          eligibility_impact: field.eligibility_impact
        }))
      }));
      
      setCustomQuestionnaires(convertedQuestionnaires);
      
      // Make available globally for other components
      (window as any).getImmigrationQuestionnaires = () => convertedQuestionnaires;
      (window as any).getQuestionnaireByCategory = (category: string) => 
        convertedQuestionnaires.filter(q => q.category === category);
        
    } catch (error) {
      console.error('Error loading questionnaires:', error);
      setCustomQuestionnaires([]);
      toast.error('Failed to load custom questionnaires');
    } finally {
      setLoadingQuestionnaires(false);
    }
  };

  // Update questionnaire submission to use API
  const handleCustomQuestionnaireSubmit = async () => {
    if (!selectedCustomQuestionnaire) return;

    try {
      const response = await questionnaireService.submitQuestionnaireResponse(
        selectedCustomQuestionnaire.id,
        {
          responses: customQuestionnaireAnswers,
          auto_save: false
        }
      );

      console.log('Assessment results:', response.assessment_results);
      
      if (response.assessment_results) {
        // Show results to user
        toast.success(`Assessment completed! Eligibility score: ${response.assessment_results.eligibility_score}`);
        
        // You can store the results or navigate to a results page
        // setAssessmentResults(response.assessment_results);
      }

      setShowCustomQuestionnaire(false);
      setShowQuestionnaire(false);
    } catch (error: any) {
      toast.error('Failed to submit questionnaire: ' + error.message);
    }
  };

  // Add loading indicator in render
  const renderCustomQuestionnaires = () => {
    if (loadingQuestionnaires) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading custom questionnaires...</p>
        </div>
      );
    }

    if (customQuestionnaires.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">No custom questionnaires available.</p>
        </div>
      );
    }

    // Your existing questionnaire rendering logic...
  };
};
```

## 5. Error Handling Patterns

### Global Error Handler
```typescript
// src/utils/errorHandler.ts
export const handleAPIError = (error: any, defaultMessage: string = 'An error occurred') => {
  console.error('API Error:', error);
  
  if (error.response?.status === 401) {
    // Redirect to login
    window.location.href = '/login';
    return;
  }
  
  if (error.response?.status === 403) {
    toast.error('You do not have permission to perform this action');
    return;
  }
  
  const message = error.response?.data?.error?.message || error.message || defaultMessage;
  toast.error(message);
};

// Usage in components
try {
  await questionnaireService.createQuestionnaire(data);
} catch (error) {
  handleAPIError(error, 'Failed to create questionnaire');
}
```

## 6. Authentication Integration

### Add auth token management
```typescript
// src/services/authService.ts
export const authService = {
  getToken: () => localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'),
  setToken: (token: string, remember: boolean = false) => {
    if (remember) {
      localStorage.setItem('auth_token', token);
    } else {
      sessionStorage.setItem('auth_token', token);
    }
  },
  removeToken: () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  }
};

// Update questionnaireService to use auth token
private getAuthToken(): string | null {
  return authService.getToken();
}
```

## 7. Loading States & UI Feedback

### Add loading states throughout your components
```typescript
const [operations, setOperations] = useState({
  loading: false,
  saving: false,
  deleting: false,
  duplicating: false
});

// Update button states
<button
  onClick={saveQuestionnaire}
  disabled={operations.saving}
  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
>
  {operations.saving ? (
    <>
      <Spinner className="w-4 h-4 mr-2 animate-spin" />
      Saving...
    </>
  ) : (
    'Save Questionnaire'
  )}
</button>
```

## 8. Testing the Integration

### Test the API integration
1. **Load questionnaires**: Verify questionnaires load from API on component mount
2. **Create questionnaire**: Test creating new questionnaires saves to API
3. **Update questionnaire**: Test editing existing questionnaires updates via API
4. **Delete questionnaire**: Test deletion removes from API and updates UI
5. **Error handling**: Test with network disconnected to verify error states
6. **Loading states**: Verify loading indicators show during API calls

### Migration Checklist
- [ ] Replace all localStorage.getItem calls with API calls
- [ ] Replace all localStorage.setItem calls with API calls
- [ ] Add proper error handling for all API calls
- [ ] Add loading states for better UX
- [ ] Test with real API endpoints
- [ ] Update global window functions to use API data
- [ ] Add retry mechanisms for failed requests
- [ ] Implement proper authentication token management

This integration guide provides a complete pattern for replacing localStorage with API calls while maintaining the existing functionality of your components. 