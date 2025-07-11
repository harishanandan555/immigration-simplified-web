/**
 * Utility functions for debugging purposes
 * These can be helpful during development and troubleshooting
 */

/**
 * Safely logs an object with circular references handled
 * @param label Description of what is being logged
 * @param obj The object to log
 * @param level Detail level (1 = basic, 2 = detailed, 3 = full)
 */
export const debugLog = (label: string, obj: any, level: number = 1): void => {
  // Only log in development environment
  if (import.meta.env.PROD) return;

  try {
    const seen = new WeakSet();
    const safeObj = JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    }, 2);
    
    console.group(`DEBUG: ${label}`);
    console.log(safeObj);
    
    if (level >= 2) {
      console.log('Object keys:', Object.keys(obj));
    }
    
    if (level >= 3 && typeof obj === 'object' && obj !== null) {
      console.log('Full object inspection:');
      console.dir(obj, { depth: null });
    }
    
    console.groupEnd();
  } catch (error) {
    console.warn(`Error logging debug info for ${label}:`, error);
  }
};

/**
 * Examine questionnaire structure to help debug issues
 * @param questionnaire The questionnaire object to analyze
 */
export const debugQuestionnaireStructure = (questionnaire: any): void => {
  if (!questionnaire) {
    console.warn('DEBUG: No questionnaire provided to debug');
    return;
  }
  
  console.group(`DEBUG: Questionnaire Structure Analysis for "${questionnaire.title || questionnaire.name || 'Unknown'}"`);
  
  // Basic properties
  console.log('ID:', questionnaire._id || questionnaire.id || 'Missing ID');
  console.log('Title:', questionnaire.title || questionnaire.name || 'Missing title');
  
  // Check for fields
  const fields = questionnaire.fields || questionnaire.questions || [];
  console.log('Fields found:', fields.length);
  
  if (fields.length === 0) {
    console.warn('No fields or questions found in this questionnaire');
    console.log('Available properties:', Object.keys(questionnaire));
  } else {
    // Sample the first field
    const sampleField = fields[0];
    console.log('Sample field structure:', JSON.stringify(sampleField, null, 2));
    
    // Check field property naming pattern
    const hasLabel = 'label' in sampleField;
    const hasQuestion = 'question' in sampleField;
    console.log(`Field naming pattern: ${hasLabel ? 'Using label' : ''}${hasLabel && hasQuestion ? ' and ' : ''}${hasQuestion ? 'Using question' : ''}`);
  }
  
  console.groupEnd();
};

/**
 * Analyzes an array of questionnaires and reports any issues
 * @param questionnaires Array of questionnaires to analyze
 */
export const analyzeQuestionnaires = (questionnaires: any[]): void => {
  if (!questionnaires || !Array.isArray(questionnaires)) {
    console.warn('DEBUG: No valid questionnaire array provided');
    return;
  }
  
  console.group(`DEBUG: Analyzing ${questionnaires.length} questionnaires`);
  
  const issues: string[] = [];
  
  questionnaires.forEach((q, index) => {
    // Use title and ID for logging only if needed
    const title = q.title || q.name || `Untitled Questionnaire ${index}`;
    
    // Check for ID issues
    if (!q._id && !q.id) {
      issues.push(`Questionnaire ${index}: Missing ID property`);
    } else if ((q._id && !/^[0-9a-fA-F]{24}$/.test(q._id)) || 
               (q.id && !/^[0-9a-fA-F]{24}$/.test(q.id))) {
      issues.push(`Questionnaire "${title}": Invalid MongoDB ObjectId format ${q._id || q.id}`);
    }
    
    // Check for fields/questions
    const fields = q.fields || q.questions || [];
    if (fields.length === 0) {
      issues.push(`Questionnaire "${title}": No fields or questions found`);
    }
    
    // Check field structure consistency
    fields.forEach((field: any, fieldIndex: number) => {
      if (!field.id && !field._id) {
        issues.push(`Questionnaire "${title}", field ${fieldIndex}: Missing field ID`);
      }
      
      if (!field.label && !field.question) {
        issues.push(`Questionnaire "${title}", field ${fieldIndex}: Missing field label/question`);
      }
      
      if (!field.type) {
        issues.push(`Questionnaire "${title}", field ${fieldIndex}: Missing field type`);
      }
    });
  });
  
  if (issues.length === 0) {
    console.log('✅ No issues found in questionnaires');
  } else {
    console.warn('❌ Issues found in questionnaires:', issues.length);
    issues.forEach((issue, i) => console.warn(`${i+1}. ${issue}`));
  }
  
  console.groupEnd();
};
