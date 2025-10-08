// Temporary fix: Add the questionnaire assignment to localStorage
// Run this in the browser console when logged in as the client

const assignment = {
  _id: "68ccf7317483b2232915f145",
  questionnaireId: "q_68b97ab7d42cbcf11ec06116",
  clientId: "68ccf7317483b2232915f145",
  status: "pending",
  assignedAt: "2025-09-19T06:24:54.476+00:00",
  dueDate: "2025-09-24T00:00:00.000+00:00",
  notes: "Please complete this questionnaire for your family-based case.",
  clientEmail: "floryyyyrosyyy456@gmail.com",
  accountCreated: false,
  notificationSent: false,
  formCaseIds: {},
  selectedForms: [],
  formNumber: "Form I-131",
  formCaseIdGenerated: "CR-2025-2590",
  createdAt: "2025-09-19T06:24:54.478+00:00",
  updatedAt: "2025-09-19T06:24:54.478+00:00",
  // Add questionnaire details
  questionnaireName: "Form I-131 Family Questionnaire",
  questionnaireId: {
    _id: "q_68b97ab7d42cbcf11ec06116",
    title: "Form I-131 Family Questionnaire",
    category: "family-based",
    description: "Family-based immigration questionnaire",
    questions: []
  }
};

// Get existing assignments from localStorage
const existingAssignments = JSON.parse(localStorage.getItem('questionnaire-assignments') || '[]');

// Check if this assignment already exists
const exists = existingAssignments.find(a => a._id === assignment._id);

if (!exists) {
  // Add the new assignment
  existingAssignments.push(assignment);
  
  // Save back to localStorage
  localStorage.setItem('questionnaire-assignments', JSON.stringify(existingAssignments));
  
  console.log('✅ Assignment added to localStorage');
  console.log('📝 Refresh the page to see the questionnaire');
} else {
  console.log('⚠️ Assignment already exists in localStorage');
}

console.log('📋 Current assignments in localStorage:', existingAssignments);