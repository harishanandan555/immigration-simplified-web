/**
 * Debug script for client responses API
 * This script will help diagnose the missing client name issue
 */

const debugClientResponses = async () => {
  console.log('🔍 DEBUGGING CLIENT RESPONSES API');
  console.log('='.repeat(50));
  
  // Simulate the API call that QuestionnaireResponses.tsx makes
  const testAPI = async () => {
    try {
      // Mock data structure that should be returned by /api/v1/questionnaire-assignments/client-responses
      const mockResponse = {
        success: true,
        data: {
          assignments: [
            {
              _id: "assignment123",
              status: "completed",
              questionnaireId: {
                _id: "questionnaire123",
                title: "Family Immigration Questionnaire"
              },
              caseId: {
                _id: "case123",
                title: "Spouse Visa Case"
              },
              
              // ❌ ISSUE: These fields are probably NOT being populated by the backend
              actualClient: null, // Should contain: { firstName: "John", lastName: "Doe" }
              clientUserId: null,  // Should contain: { firstName: "John", lastName: "Doe" }
              
              // Alternative fields that might exist
              clientId: "client123", // Just an ID, not the full client object
              
              responseId: {
                _id: "response123",
                responses: {
                  // questionnaire answers
                }
              },
              assignedBy: "attorney123",
              assignedAt: "2024-01-15T10:00:00Z",
              completedAt: "2024-01-16T15:30:00Z"
            }
          ],
          pagination: {
            page: 1,
            limit: 50,
            total: 1
          }
        }
      };
      
      console.log('📋 Expected API Response Structure:');
      console.log(JSON.stringify(mockResponse, null, 2));
      
      return mockResponse;
      
    } catch (error) {
      console.error('❌ API Error:', error);
      return null;
    }
  };
  
  // Analyze the data structure
  const analyzeResponse = (responseData) => {
    console.log('\n🔬 ANALYSIS RESULTS:');
    console.log('='.repeat(30));
    
    const assignments = responseData?.data?.assignments || [];
    
    if (assignments.length === 0) {
      console.log('❌ No assignments found');
      return;
    }
    
    assignments.forEach((assignment, index) => {
      console.log(`\n📝 Assignment ${index + 1}:`);
      console.log(`   ID: ${assignment._id}`);
      console.log(`   Status: ${assignment.status}`);
      
      // Check client data availability
      console.log('\n👤 Client Data Check:');
      
      if (assignment.actualClient?.firstName && assignment.actualClient?.lastName) {
        console.log(`   ✅ actualClient: ${assignment.actualClient.firstName} ${assignment.actualClient.lastName}`);
      } else {
        console.log(`   ❌ actualClient: Missing or incomplete`);
        console.log(`      Value: ${JSON.stringify(assignment.actualClient)}`);
      }
      
      if (assignment.clientUserId?.firstName && assignment.clientUserId?.lastName) {
        console.log(`   ✅ clientUserId: ${assignment.clientUserId.firstName} ${assignment.clientUserId.lastName}`);
      } else {
        console.log(`   ❌ clientUserId: Missing or incomplete`);
        console.log(`      Value: ${JSON.stringify(assignment.clientUserId)}`);
      }
      
      if (assignment.clientId) {
        console.log(`   ⚠️  clientId (just ID): ${assignment.clientId}`);
      } else {
        console.log(`   ❌ clientId: Missing`);
      }
    });
  };
  
  // Backend Fix Recommendations
  const recommendFixes = () => {
    console.log('\n🔧 BACKEND FIX RECOMMENDATIONS:');
    console.log('='.repeat(40));
    console.log('\n1. Update the /api/v1/questionnaire-assignments/client-responses endpoint to:');
    console.log('   - Populate the actualClient field with full client details');
    console.log('   - OR populate the clientUserId field with full client details');
    console.log('   - Use MongoDB .populate() or similar to get full client data');
    
    console.log('\n2. Example MongoDB query fix:');
    console.log(`
   // In your backend questionnaire assignment controller:
   const assignments = await QuestionnaireAssignment.find({ status: 'completed' })
     .populate('clientId', 'firstName lastName email phone') // Populate client data
     .populate('questionnaireId', 'title')
     .populate('caseId', 'title')
     .populate('responseId');
   
   // Then map the response to include actualClient:
   const formattedAssignments = assignments.map(assignment => ({
     ...assignment.toObject(),
     actualClient: assignment.clientId // Move populated client data to actualClient
   }));`);
   
    console.log('\n3. Alternative: Update the frontend to use clientId field');
    console.log('   - If backend populates clientId properly, update QuestionnaireResponses.tsx');
    console.log('   - Add clientId.firstName and clientId.lastName to the fallback logic');
    
    console.log('\n4. Database collection to check:');
    console.log('   - Collection: questionnaire_assignments');
    console.log('   - Look for documents with status: "completed"');
    console.log('   - Verify that clientId field exists and references the clients collection');
    console.log('   - Ensure the clients collection has firstName and lastName fields');
  };
  
  // Run the debug
  const responseData = await testAPI();
  analyzeResponse(responseData);
  recommendFixes();
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugClientResponses };
} else {
  // Run immediately if in browser
  debugClientResponses();
}

console.log('\n💡 To fix the "Client Name Not Available" issue:');
console.log('1. Run this debug script to understand the current API response');
console.log('2. Check your backend /api/v1/questionnaire-assignments/client-responses endpoint');
console.log('3. Ensure it populates client data using .populate() or similar');
console.log('4. Test with a real API call to see the actual response structure');
