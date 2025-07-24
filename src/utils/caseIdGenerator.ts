/**
 * Case ID Generator Utility for Web Frontend
 * Generates case IDs in the format CR-2025-0001 for each selected form
 */

/**
 * Generate a unique case ID for a specific form (client-side fallback)
 * @param {string} formType - The form type (e.g., 'I-130', 'I-485', 'N-400')
 * @returns {string} - Generated case ID in format CR-2025-0001
 */
export const generateCaseId = (formType: string = 'GENERAL'): string => {
  try {
    // Use CR prefix for Case Reference
    const prefix = 'CR';
    const year = new Date().getFullYear();
    
    // Generate a random sequence number (fallback for client-side)
    // In production, this should come from the API to ensure uniqueness
    const randomSequence = Math.floor(Math.random() * 9999) + 1;
    
    const caseId = `${prefix}-${year}-${randomSequence.toString().padStart(4, '0')}`;
    console.log(`Generated client-side case ID: ${caseId} for form type: ${formType}`);
    
    return caseId;
  } catch (error) {
    console.error('Error generating case ID:', error);
    // Fallback to timestamp-based ID
    const timestamp = Date.now().toString().slice(-4);
    const year = new Date().getFullYear();
    return `CR-${year}-${timestamp}`;
  }
};

/**
 * Generate multiple case IDs for multiple forms (client-side)
 * @param {string[]} formTypes - Array of form types
 * @returns {Object} - Object mapping form types to case IDs
 */
export const generateMultipleCaseIds = (formTypes: string[] = []): Record<string, string> => {
  const caseIds: Record<string, string> = {};
  
  for (const formType of formTypes) {
    caseIds[formType] = generateCaseId(formType);
  }
  
  return caseIds;
};

/**
 * API call to generate case ID from backend
 * @param {string} formType - The form type
 * @returns {Promise<string>} - Generated case ID from backend
 */
export const generateCaseIdFromAPI = async (formType: string = 'GENERAL'): Promise<string> => {
  try {
    const response = await fetch('/api/v1/cases/generate-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ formType })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate case ID: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.caseId;
  } catch (error) {
    console.error('Error generating case ID from API:', error);
    // Fallback to client-side generation
    return generateCaseId(formType);
  }
};

/**
 * API call to generate multiple case IDs from backend
 * @param {string[]} formTypes - Array of form types
 * @returns {Promise<Object>} - Object mapping form types to case IDs
 */
export const generateMultipleCaseIdsFromAPI = async (formTypes: string[] = []): Promise<Record<string, string>> => {
  try {
    const response = await fetch('/api/v1/cases/generate-multiple-ids', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ formTypes })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate case IDs: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.caseIds;
  } catch (error) {
    console.error('Error generating case IDs from API:', error);
    // Fallback to client-side generation
    return generateMultipleCaseIds(formTypes);
  }
};

/**
 * Format case ID for display
 * @param {string} caseId - Raw case ID
 * @returns {string} - Formatted case ID
 */
export const formatCaseId = (caseId: string): string => {
  if (!caseId) return 'N/A';
  
  // Ensure proper format CR-YYYY-NNNN
  if (caseId.match(/^CR-\d{4}-\d{4}$/)) {
    return caseId;
  }
  
  // Try to reformat if it's not in the right format
  const parts = caseId.split('-');
  if (parts.length === 3) {
    const [prefix, year, sequence] = parts;
    return `${prefix}-${year}-${sequence.padStart(4, '0')}`;
  }
  
  return caseId;
};

/**
 * Validate case ID format
 * @param {string} caseId - Case ID to validate
 * @returns {boolean} - True if valid format
 */
export const isValidCaseId = (caseId: string): boolean => {
  if (!caseId) return false;
  return /^CR-\d{4}-\d{4}$/.test(caseId);
};

export default {
  generateCaseId,
  generateMultipleCaseIds,
  generateCaseIdFromAPI,
  generateMultipleCaseIdsFromAPI,
  formatCaseId,
  isValidCaseId
};
