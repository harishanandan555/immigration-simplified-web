// import React, { createContext, useContext, useState, useEffect } from 'react';
// import api from '../utils/api';
// import { CASE_END_POINTS } from '../utils/constants';

// export interface Case {
//   id: string;
//   title: string;
//   description: string;
//   status: 'open' | 'in_progress' | 'closed';
//   assignedTo: string;
//   createdAt: string;
//   updatedAt: string;
//   tasks?: CaseTask[];
// }

// export interface CaseTask {
//   id: string;
//   title: string;
//   description: string;
//   status: 'pending' | 'in_progress' | 'completed';
//   dueDate: string;
//   assignedTo: string;
// }

// interface CaseContextType {
//   cases: Case[];
//   currentCase: Case | null;
//   isLoading: boolean;
//   error: string | null;
//   getCases: () => Promise<void>;
//   getCaseById: (id: string) => Promise<void>;
//   createCase: (caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => Promise<void>;
//   updateCase: (id: string, caseData: Partial<Case>) => Promise<void>;
//   addCaseTask: (caseId: string, taskData: Omit<CaseTask, 'id'>) => Promise<void>;
//   updateCaseTask: (caseId: string, taskId: string, taskData: Partial<CaseTask>) => Promise<void>;
// }

// const CaseContext = createContext<CaseContextType | undefined>(undefined);

// export const CaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

//   const [cases, setCases] = useState<Case[]>([]);
//   const [currentCase, setCurrentCase] = useState<Case | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const getCases = async (): Promise<void> => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const response = await api.get(CASE_END_POINTS.GETCASES);
      

//       return new Promise((resolve, reject) => {
//         setTimeout(() => {
          
//           if (response.data) { // In a real app, use proper password verification
//             setCases(response.data);
//             setIsLoading(false);
//             resolve();
//           } else {
//             setIsLoading(false);
//             reject(new Error('Invalid email or password'));
//           }
//         }, 1000);
//       });

//     } catch (error: any) {
//       setError(error?.response?.data?.message || 'Failed to fetch cases');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const getCaseById = async (id: string): Promise<void> => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const endpoint = CASE_END_POINTS.GETCASEBYID.replace(':id', id);
//       const response = await api.get(endpoint);
//       setCurrentCase(response.data);
//     } catch (error: any) {
//       setError(error?.response?.data?.message || 'Failed to fetch case');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const createCase = async (caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>): Promise<void> => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const response = await api.post(CASE_END_POINTS.CREATECASE, caseData);
//       setCases(prev => [...prev, response.data]);
//     } catch (error: any) {
//       setError(error?.response?.data?.message || 'Failed to create case');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const updateCase = async (id: string, caseData: Partial<Case>): Promise<void> => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const endpoint = CASE_END_POINTS.UPDATECASE.replace(':id', id);
//       const response = await api.put(endpoint, caseData);
//       setCases(prev => prev.map(c => c.id === id ? response.data : c));
//       if (currentCase?.id === id) {
//         setCurrentCase(response.data);
//       }
//     } catch (error: any) {
//       setError(error?.response?.data?.message || 'Failed to update case');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const addCaseTask = async (caseId: string, taskData: Omit<CaseTask, 'id'>): Promise<void> => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const endpoint = CASE_END_POINTS.ADDCASETASK.replace(':id', caseId);
//       const response = await api.post(endpoint, taskData);
//       setCases(prev => prev.map(c => {
//         if (c.id === caseId) {
//           return {
//             ...c,
//             tasks: [...(c.tasks || []), response.data]
//           };
//         }
//         return c;
//       }));
//       if (currentCase?.id === caseId) {
//         setCurrentCase(prev => prev ? {
//           ...prev,
//           tasks: [...(prev.tasks || []), response.data]
//         } : null);
//       }
//     } catch (error: any) {
//       setError(error?.response?.data?.message || 'Failed to add task');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const updateCaseTask = async (caseId: string, taskId: string, taskData: Partial<CaseTask>): Promise<void> => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const endpoint = CASE_END_POINTS.UPDATECASETASK
//         .replace(':id', caseId)
//         .replace(':taskId', taskId);
//       const response = await api.put(endpoint, taskData);
//       setCases(prev => prev.map(c => {
//         if (c.id === caseId) {
//           return {
//             ...c,
//             tasks: c.tasks?.map(t => t.id === taskId ? response.data : t) || []
//           };
//         }
//         return c;
//       }));
//       if (currentCase?.id === caseId) {
//         setCurrentCase(prev => prev ? {
//           ...prev,
//           tasks: prev.tasks?.map(t => t.id === taskId ? response.data : t) || []
//         } : null);
//       }
//     } catch (error: any) {
//       setError(error?.response?.data?.message || 'Failed to update task');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <CaseContext.Provider value={{
//       cases,
//       currentCase,
//       isLoading,
//       error,
//       getCases,
//       getCaseById,
//       createCase,
//       updateCase,
//       addCaseTask,
//       updateCaseTask
//     }}>
//       {children}
//     </CaseContext.Provider>
//   );
// };

// export const useCase = (): CaseContextType => {
//   const context = useContext(CaseContext);
//   if (context === undefined) {
//     throw new Error('useCase must be used within a CaseProvider');
//   }
//   return context;
// };



import api from '../utils/api';
import { CASE_END_POINTS } from '../utils/constants';

interface Case {
  id?: string; // Optional for creation
  title: string;
  description: string;
  status?: string; // Optional with default value on backend
  // Add other case properties as needed
}

// Define the response type from your API
interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  // Add other standard axios response fields if needed
}

// Example in a React component or custom hook
export const getCases = async () => {
  try {
    const response = await api.get(CASE_END_POINTS.GETCASES);
    // Handle the response data
    console.log(response.data);
    return response.data;
  } catch (error) {
    // Handle errors
    console.error('Error fetching cases:', error);
    throw error;
  }
};

export const createCase = async (caseData: Omit<Case, 'id'>): Promise<ApiResponse<Case>> => {
  try {
    const response = await api.post<Case>(
      CASE_END_POINTS.CREATECASE,
      caseData
    );
    
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
    
  } catch (error) {
    // Handle different error types if needed
    if (error instanceof Error) {
      console.error('Error creating case:', error.message);
      throw new Error(`Failed to create case: ${error.message}`);
    }
    throw new Error('Failed to create case due to an unknown error');
  }
}