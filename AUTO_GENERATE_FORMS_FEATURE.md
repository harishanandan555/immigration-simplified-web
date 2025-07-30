# Auto-Generate Forms Feature

## Overview

This feature adds advanced auto-generation functionality to the "Auto-fill Forms" step in the LegalFirmWorkflow component. It uses the `renderFormWithData` API to generate forms with all collected user data and provides download and preview options.

## Features Added

### 1. Auto-Generate Button
- New purple "Auto Generate Forms" button in the Auto-fill Forms step
- Uses `renderFormWithData` from FormAutoFillControllers
- Passes comprehensive user data to the API
- Shows loading state during generation

### 2. Data Collection
The function collects and passes the following data to `renderFormWithData`:

```typescript
{
  // Client information
  clientFirstName: string,
  clientLastName: string,
  clientEmail: string,
  clientPhone: string,
  clientDateOfBirth: string,
  clientNationality: string,
  
  // Client address
  clientStreet: string,
  clientCity: string,
  clientState: string,
  clientZipCode: string,
  clientCountry: string,
  
  // Case information
  caseCategory: string,
  caseSubcategory: string,
  visaType: string,
  priorityDate: string,
  caseNumber: string,
  
  // Client responses from questionnaire
  ...clientResponses,
  
  // Form details
  selectedForms: string[],
  questionnaireResponses: Record<string, any>,
  
  // Additional metadata
  workflowStep: number,
  timestamp: string,
  autoFillSource: 'LegalFirmWorkflow'
}
```

### 3. Form Generation Process
1. **Data Validation**: Uses `validateFormData` to ensure all required fields are present
2. **Data Preparation**: Uses `prepareFormData` to format data for the API
3. **Template Mapping**: Maps form names to template IDs (currently using simple string transformation)
4. **API Call**: Calls `renderFormWithData` for each selected form
5. **Status Tracking**: Tracks generation status (generating, success, error) for each form

### 4. Download and Preview Options
- **Download Button**: Downloads the generated PDF file
- **Preview Button**: Opens a modal with PDF preview using iframe
- **Status Indicators**: Shows loading, success, or error states for each form
- **Error Handling**: Displays specific error messages for failed generations

### 5. UI Components

#### Generated Forms Display
- Grid layout showing all generated forms
- Status indicators (loading spinner, checkmark, error icon)
- Download and preview buttons for successful generations
- Error messages for failed generations

#### PDF Preview Modal
- Full-screen modal with PDF preview
- Close button to dismiss modal
- Responsive design for different screen sizes

#### Button Layout
- "Auto Generate Forms" button (purple) - new functionality
- "Legacy Generate & Download" button (green) - original functionality
- Both buttons available in normal mode
- Only auto-generate button in view/edit mode

## Technical Implementation

### State Management
```typescript
// New state variables added
const [generatedForms, setGeneratedForms] = useState<Array<{
  formName: string;
  templateId: string;
  blob: Blob;
  downloadUrl: string;
  fileName: string;
  status: 'generating' | 'success' | 'error';
  error?: string;
}>>([]);
const [generatingForms, setGeneratingForms] = useState(false);
const [showPreview, setShowPreview] = useState<Record<string, boolean>>({});
```

### Key Functions
- `handleAutoGenerateForms()`: Main function for auto-generation
- `handleDownloadForm(formName)`: Downloads specific form
- `handlePreviewForm(formName)`: Opens preview modal
- `handleClosePreview(formName)`: Closes preview modal

### Cleanup
- Automatic cleanup of blob URLs when component unmounts
- Prevents memory leaks from generated PDF blobs

## Usage

### For Users:
1. Navigate to the "Auto-fill Forms" step (step 7)
2. Click "Auto Generate Forms" to start the generation process
3. Wait for forms to be generated (loading indicators will show)
4. Once generated, use "Download" or "Preview" buttons for each form
5. Preview opens in a modal, download saves the file locally

### For Developers:
1. The `handleAutoGenerateForms` function can be called programmatically
2. Data structure is logged to console for debugging
3. Error handling provides specific feedback for different failure scenarios
4. Template ID mapping can be customized for different form types

## Integration with Existing Code

- Maintains backward compatibility with existing `handleAutoFillForms` function
- Uses existing state management patterns
- Integrates with existing toast notifications
- Follows existing UI/UX patterns and styling

## Future Enhancements

1. **Template ID Mapping**: Implement proper mapping from form names to actual template IDs
2. **Batch Processing**: Add ability to generate all forms in a single API call
3. **Form Validation**: Add client-side validation before generation
4. **Progress Tracking**: Add progress bar for multiple form generation
5. **Error Recovery**: Add retry functionality for failed generations 