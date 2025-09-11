/**
 * BACKEND FIX: Client Name Missing Issue
 * 
 * PROBLEM: QuestionnaireResponses.tsx shows "Client Name Not Available" 
 * because the backend API doesn't populate client data properly.
 * 
 * SOLUTION: Update the backend questionnaire assignment controller
 * to populate client information.
 */

// =============================================================================
// 1. BACKEND CONTROLLER FIX (Node.js/Express + MongoDB)
// =============================================================================

/**
 * Add this to your backend questionnaire assignment controller
 * File: controllers/questionnaireAssignmentController.js (or similar)
 */

const getClientResponses = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, clientId, ...filters } = req.query;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (clientId) query.clientId = clientId;
    
    // Add other filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'undefined') {
        query[key] = value;
      }
    });
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 🔧 KEY FIX: Add .populate() to get full client data
    const assignments = await QuestionnaireAssignment.find(query)
      .populate({
        path: 'clientId',
        select: 'firstName lastName email phone dateOfBirth nationality address'
      })
      .populate({
        path: 'questionnaireId',
        select: 'title description'
      })
      .populate({
        path: 'caseId', 
        select: 'title caseNumber status'
      })
      .populate({
        path: 'responseId',
        select: 'responses submittedAt'
      })
      .populate({
        path: 'assignedBy',
        select: 'firstName lastName email role'
      })
      .sort({ assignedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean() for better performance
    
    // 🔧 KEY FIX: Map the response to include actualClient field
    const formattedAssignments = assignments.map(assignment => ({
      ...assignment,
      // Move populated client data to actualClient field (expected by frontend)
      actualClient: assignment.clientId,
      // Keep clientUserId as backup (can be same as clientId or different if needed)
      clientUserId: assignment.clientId
    }));
    
    // Get total count for pagination
    const total = await QuestionnaireAssignment.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      data: {
        assignments: formattedAssignments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting client responses:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get client responses',
      details: error.message
    });
  }
};

// =============================================================================
// 2. ALTERNATIVE: UPDATE EXISTING ENDPOINT
// =============================================================================

/**
 * If you already have a getClientResponses function, modify it like this:
 */

// BEFORE (❌ Not working):
const assignmentsBefore = await QuestionnaireAssignment.find({ status: 'completed' });

// AFTER (✅ Working):
const assignmentsAfter = await QuestionnaireAssignment.find({ status: 'completed' })
  .populate('clientId', 'firstName lastName email phone')
  .populate('questionnaireId', 'title')
  .populate('caseId', 'title')
  .populate('responseId');

// Format the response
const formattedAssignments = assignmentsAfter.map(assignment => ({
  ...assignment.toObject(),
  actualClient: assignment.clientId, // This is what the frontend expects
  clientUserId: assignment.clientId  // Backup field
}));

// =============================================================================
// 3. DATABASE SCHEMA VERIFICATION
// =============================================================================

/**
 * Ensure your MongoDB collections have the correct structure:
 */

// QuestionnaireAssignment Schema
const questionnaireAssignmentSchema = {
  _id: "ObjectId",
  questionnaireId: "ObjectId", // References questionnaires collection
  clientId: "ObjectId",        // References clients/users collection  
  caseId: "ObjectId",          // References cases collection
  assignedBy: "ObjectId",      // References users collection
  responseId: "ObjectId",      // References questionnaire_responses collection
  status: "String",            // 'pending', 'in-progress', 'completed'
  assignedAt: "Date",
  completedAt: "Date"
};

// Client/User Schema (should have these fields)
const clientSchema = {
  _id: "ObjectId",
  firstName: "String",    // ← Required for client name display
  lastName: "String",     // ← Required for client name display
  email: "String",
  phone: "String",
  dateOfBirth: "Date",
  nationality: "String",
  address: {
    street: "String",
    city: "String", 
    state: "String",
    zipCode: "String",
    country: "String"
  }
};

// =============================================================================
// 4. TEST THE FIX
// =============================================================================

/**
 * Add this test endpoint to verify the fix works:
 */

const testClientResponsesAPI = async (req, res) => {
  try {
    console.log('🧪 Testing client responses API...');
    
    // Get one assignment to test
    const testAssignment = await QuestionnaireAssignment.findOne({ status: 'completed' })
      .populate('clientId', 'firstName lastName email')
      .populate('questionnaireId', 'title')
      .populate('caseId', 'title');
    
    if (!testAssignment) {
      return res.json({
        success: false,
        message: 'No completed assignments found for testing'
      });
    }
    
    const formatted = {
      ...testAssignment.toObject(),
      actualClient: testAssignment.clientId,
      clientUserId: testAssignment.clientId
    };
    
    console.log('✅ Test result:', {
      assignmentId: formatted._id,
      clientDataExists: !!formatted.actualClient,
      clientName: formatted.actualClient ? 
        `${formatted.actualClient.firstName} ${formatted.actualClient.lastName}` : 
        'NO NAME AVAILABLE'
    });
    
    return res.json({
      success: true,
      testData: formatted,
      clientName: formatted.actualClient ? 
        `${formatted.actualClient.firstName} ${formatted.actualClient.lastName}` : 
        'NO NAME AVAILABLE'
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// =============================================================================
// 5. ROUTE SETUP
// =============================================================================

/**
 * Add these routes to your backend router:
 */

// Main endpoint (fix this one)
router.get('/questionnaire-assignments/client-responses', authenticate, getClientResponses);

// Test endpoint (add this temporarily)
router.get('/questionnaire-assignments/test-client-data', authenticate, testClientResponsesAPI);

// =============================================================================
// 6. VALIDATION CHECKLIST
// =============================================================================

/**
 * After implementing the fix, verify:
 * 
 * ✅ 1. Backend API returns actualClient field with firstName/lastName
 * ✅ 2. Frontend QuestionnaireResponses.tsx displays client names
 * ✅ 3. Search functionality works with client names
 * ✅ 4. No "Client Name Not Available" messages
 * ✅ 5. Performance is acceptable (populate doesn't slow down queries too much)
 */

export { getClientResponses, testClientResponsesAPI };
