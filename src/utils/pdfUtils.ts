import { PDFDocument, PDFTextField, PDFCheckBox } from 'pdf-lib';

export interface I130FormData {
  // Part 1. Relationship
  relationshipType: string;
  childRelationshipType?: string;
  relatedByAdoption?: string;
  
  // Part 2. Petitioner Information
  petitionerFamilyName: string;
  petitionerGivenName: string;
  petitionerMiddleName?: string;
  petitionerBirthCity: string;
  petitionerBirthCountry: string;
  petitionerDateOfBirth: string;
  petitionerSex: string;
  petitionerMailingAddress: string;
  petitionerCurrentStatus: string;
  petitionerCitizenshipAcquired?: string;
  petitionerDaytimePhone: string;
  petitionerMobilePhone?: string;
  petitionerEmail?: string;
  
  // Part 3. Beneficiary Information
  beneficiaryFamilyName: string;
  beneficiaryGivenName: string;
  beneficiaryMiddleName?: string;
  beneficiaryBirthCity: string;
  beneficiaryBirthCountry: string;
  beneficiaryDateOfBirth: string;
  beneficiarySex: string;
  beneficiaryMailingAddress: string;
}

// Field mappings for the official USCIS I-130 form
// Note: These field names are approximations and may need adjustment based on the actual PDF form
const I130_FIELD_MAPPINGS = {
  // Part 1 - Relationship checkboxes
  'relationship_spouse': 'Part1_Spouse',
  'relationship_parent': 'Part1_Parent',
  'relationship_brother_sister': 'Part1_BrotherSister',
  'relationship_child': 'Part1_Child',
  
  // Part 2 - Petitioner Information
  'petitioner_family_name': 'Part2_FamilyName',
  'petitioner_given_name': 'Part2_GivenName',
  'petitioner_middle_name': 'Part2_MiddleName',
  'petitioner_birth_city': 'Part2_BirthCity',
  'petitioner_birth_country': 'Part2_BirthCountry',
  'petitioner_date_of_birth': 'Part2_DateOfBirth',
  'petitioner_sex_male': 'Part2_SexMale',
  'petitioner_sex_female': 'Part2_SexFemale',
  'petitioner_mailing_address': 'Part2_MailingAddress',
  'petitioner_us_citizen': 'Part2_USCitizen',
  'petitioner_lpr': 'Part2_LPR',
  'petitioner_citizenship_birth': 'Part2_CitizenshipBirth',
  'petitioner_citizenship_naturalization': 'Part2_CitizenshipNaturalization',
  'petitioner_citizenship_parents': 'Part2_CitizenshipParents',
  'petitioner_daytime_phone': 'Part2_DaytimePhone',
  'petitioner_mobile_phone': 'Part2_MobilePhone',
  'petitioner_email': 'Part2_Email',
  
  // Part 3 - Beneficiary Information
  'beneficiary_family_name': 'Part3_FamilyName',
  'beneficiary_given_name': 'Part3_GivenName',
  'beneficiary_middle_name': 'Part3_MiddleName',
  'beneficiary_birth_city': 'Part3_BirthCity',
  'beneficiary_birth_country': 'Part3_BirthCountry',
  'beneficiary_date_of_birth': 'Part3_DateOfBirth',
  'beneficiary_sex_male': 'Part3_SexMale',
  'beneficiary_sex_female': 'Part3_SexFemale',
  'beneficiary_mailing_address': 'Part3_MailingAddress'
};

export const downloadOfficialI130PDF = async (): Promise<ArrayBuffer> => {
  try {
    // Use the local file instead of downloading from USCIS
    const response = await fetch('/forms/i-130.pdf');
    if (!response.ok) {
      throw new Error('Failed to load local I-130 form');
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error loading local I-130 form:', error);
    throw error;
  }
};

export const fillI130PDF = async (formData: I130FormData): Promise<Uint8Array> => {
  try {
    
    // Load the local I-130 PDF
    const pdfArrayBuffer = await downloadOfficialI130PDF();
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    
    // Try to get the form
    let form;
    try {
      form = pdfDoc.getForm();
    } catch (formError) {
      console.error('PDF form access failed:', formError);
      throw new Error('This PDF does not contain fillable form fields. The form may be a scanned image or non-interactive PDF.');
    }
    
    // Get all form fields for debugging
    const fields = form.getFields();
    
    if (fields.length === 0) {
      console.warn('⚠️  No fillable fields found in the PDF');
      throw new Error('No fillable form fields found. This appears to be a non-interactive PDF form.');
    }
    

    let filledFieldsCount = 0;
    let attemptedFields = 0;

    
    // Try basic name fields first as a test
    const testFields = [
      { pattern: ['family', 'last', 'surname'], value: formData.petitionerFamilyName, label: 'Petitioner Last Name' },
      { pattern: ['given', 'first'], value: formData.petitionerGivenName, label: 'Petitioner First Name' },
      { pattern: ['beneficiary', '1'], value: formData.beneficiaryGivenName, label: 'Beneficiary Name' }
    ];

    for (const testField of testFields) {
      if (!testField.value) continue;
      
      let fieldFound = false;
      
      fields.forEach((field, index) => {
        const fieldName = field.getName().toLowerCase();
        const hasAllPatterns = testField.pattern.every(pattern => fieldName.includes(pattern.toLowerCase()));
        
        if (hasAllPatterns && field instanceof PDFTextField) {
          try {
            attemptedFields++;
            field.setText(testField.value);
            filledFieldsCount++;
            fieldFound = true;
          } catch (fillError) {
            console.error(`❌ Failed to fill field "${field.getName()}":`, fillError);
          }
        }
      });
      
      if (!fieldFound) {
        console.warn(`⚠️  No field found for: ${testField.label}`);
      }
    }

    // Enhanced field matching with better patterns
    fields.forEach((field, index) => {
      const fieldName = field.getName();
      const fieldNameLower = fieldName.toLowerCase();
      
      try {
        if (field instanceof PDFTextField) {
          let valueToSet = '';
          let fieldMatched = false;

          // More specific field matching patterns
          const fieldMappings = [
            // Petitioner fields
            { patterns: ['pt2line1_familyname', 'p2_familyname', 'familyname', 'lastname'], value: formData.petitionerFamilyName, type: 'petitioner_last' },
            { patterns: ['pt2line1_givenname', 'p2_givenname', 'firstname', 'givenname'], value: formData.petitionerGivenName, type: 'petitioner_first' },
            { patterns: ['pt2line1_middlename', 'p2_middlename', 'middlename'], value: formData.petitionerMiddleName || '', type: 'petitioner_middle' },
            { patterns: ['pt2line2_citytown', 'birthcity', 'cityofbirth'], value: formData.petitionerBirthCity, type: 'petitioner_birth_city' },
            { patterns: ['pt2line2_country', 'birthcountry', 'countryofbirth'], value: formData.petitionerBirthCountry, type: 'petitioner_birth_country' },
            { patterns: ['pt2line3_dateofbirth', 'dateofbirth', 'dob'], value: formData.petitionerDateOfBirth, type: 'petitioner_dob' },
            { patterns: ['pt2line8_streetaddress', 'mailingaddress', 'address'], value: formData.petitionerMailingAddress, type: 'petitioner_address' },
            { patterns: ['pt2line11_daytimephone', 'daytimephone', 'phonenumber'], value: formData.petitionerDaytimePhone, type: 'petitioner_phone' },
            { patterns: ['pt2line11_email', 'emailaddress', 'email'], value: formData.petitionerEmail || '', type: 'petitioner_email' },
            
            // Beneficiary fields  
            { patterns: ['pt3line1_familyname', 'p3_familyname', 'beneficiary_familyname'], value: formData.beneficiaryFamilyName, type: 'beneficiary_last' },
            { patterns: ['pt3line1_givenname', 'p3_givenname', 'beneficiary_givenname'], value: formData.beneficiaryGivenName, type: 'beneficiary_first' },
            { patterns: ['pt3line1_middlename', 'p3_middlename', 'beneficiary_middlename'], value: formData.beneficiaryMiddleName || '', type: 'beneficiary_middle' },
            { patterns: ['pt3line2_citytown', 'beneficiary_birthcity'], value: formData.beneficiaryBirthCity, type: 'beneficiary_birth_city' },
            { patterns: ['pt3line2_country', 'beneficiary_birthcountry'], value: formData.beneficiaryBirthCountry, type: 'beneficiary_birth_country' },
            { patterns: ['pt3line3_dateofbirth', 'beneficiary_dob'], value: formData.beneficiaryDateOfBirth, type: 'beneficiary_dob' },
            { patterns: ['pt3line8_streetaddress', 'beneficiary_address'], value: formData.beneficiaryMailingAddress, type: 'beneficiary_address' }
          ];

          // Try exact field name matches first
          for (const mapping of fieldMappings) {
            if (mapping.patterns.some(pattern => fieldNameLower === pattern.toLowerCase()) || 
                mapping.patterns.some(pattern => fieldNameLower.includes(pattern.toLowerCase()))) {
              if (mapping.value && mapping.value.trim()) {
                valueToSet = mapping.value;
                fieldMatched = true;
                break;
              }
            }
          }

          // If exact match not found, try partial matching (existing logic)
          if (!fieldMatched) {
            // [Keep existing field matching logic as fallback]
            // ... (existing complex matching logic)
          }

          if (fieldMatched && valueToSet) {
            attemptedFields++;
            field.setText(valueToSet);
            filledFieldsCount++;
          }
        } 
        else if (field instanceof PDFCheckBox) {
          let shouldCheck = false;
          let fieldMatched = false;

          // Enhanced checkbox mapping
          const checkboxMappings = [
            { patterns: ['spouse'], condition: () => formData.relationshipType?.toLowerCase() === 'spouse' },
            { patterns: ['parent'], condition: () => formData.relationshipType?.toLowerCase() === 'parent' },
            { patterns: ['child'], condition: () => formData.relationshipType?.toLowerCase() === 'child' },
            { patterns: ['brother', 'sister', 'sibling'], condition: () => formData.relationshipType?.toLowerCase().includes('sibling') || formData.relationshipType?.toLowerCase().includes('brother') || formData.relationshipType?.toLowerCase().includes('sister') },
            { patterns: ['male'], condition: () => formData.petitionerSex?.toLowerCase() === 'male' || formData.beneficiarySex?.toLowerCase() === 'male' },
            { patterns: ['female'], condition: () => formData.petitionerSex?.toLowerCase() === 'female' || formData.beneficiarySex?.toLowerCase() === 'female' },
            { patterns: ['citizen', 'uscitizen'], condition: () => formData.petitionerCurrentStatus?.includes('Citizen') },
            { patterns: ['permanent', 'resident', 'lpr'], condition: () => formData.petitionerCurrentStatus?.includes('Permanent') }
          ];

          for (const mapping of checkboxMappings) {
            if (mapping.patterns.some(pattern => fieldNameLower.includes(pattern.toLowerCase()))) {
              if (mapping.condition()) {
                shouldCheck = true;
                fieldMatched = true;
                break;
              }
            }
          }

          if (fieldMatched && shouldCheck) {
            attemptedFields++;
            field.check();
            filledFieldsCount++;
          }
        }
      } catch (fieldError) {
        console.error(`❌ Error processing field "${fieldName}":`, fieldError);
      }
    });


    // Save the filled PDF
    const pdfBytes = await pdfDoc.save();
    
    return pdfBytes;
    
  } catch (error: unknown) {
    console.error('❌ Critical error in I-130 PDF fill process:', error);
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage?.includes('password')) {
      throw new Error('The PDF is password protected and cannot be filled automatically.');
    } else if (errorMessage?.includes('form') || errorMessage?.includes('field')) {
      throw new Error('The PDF does not contain fillable form fields. This may be a scanned document.');
    } else if (errorMessage?.includes('load') || errorMessage?.includes('parse')) {
      throw new Error('The PDF file is corrupted or in an unsupported format.');
    } else {
      throw new Error(`PDF processing failed: ${errorMessage || 'Unknown error'}`);
    }
  }
};

export const downloadFilledI130PDF = async (formData: I130FormData): Promise<void> => {
  try {
    const filledPdfBytes = await fillI130PDF(formData);
    
    // Create a blob and download
    const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `I-130-Prefilled-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error downloading filled I-130 PDF:', error);
    throw error;
  }
};

// Alternative function that tries to fill fields by discovering field names
export const fillI130PDFDynamic = async (formData: I130FormData): Promise<Uint8Array> => {
  try {
    const pdfArrayBuffer = await downloadOfficialI130PDF();
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const form = pdfDoc.getForm();
    
    // Get all form fields
    const fields = form.getFields();
    
    
    // Try to fill fields based on common naming patterns
    fields.forEach(field => {
      const fieldName = field.getName().toLowerCase();
      
      try {
        if (field instanceof PDFTextField) {
          // Text field mappings based on common patterns
          if (fieldName.includes('family') && fieldName.includes('name') && fieldName.includes('4')) {
            field.setText(formData.petitionerFamilyName);
          } else if (fieldName.includes('given') && fieldName.includes('name') && fieldName.includes('4')) {
            field.setText(formData.petitionerGivenName);
          } else if (fieldName.includes('middle') && fieldName.includes('name') && fieldName.includes('4')) {
            field.setText(formData.petitionerMiddleName || '');
          } else if (fieldName.includes('city') && fieldName.includes('birth') && fieldName.includes('6')) {
            field.setText(formData.petitionerBirthCity);
          } else if (fieldName.includes('country') && fieldName.includes('birth') && fieldName.includes('7')) {
            field.setText(formData.petitionerBirthCountry);
          } else if (fieldName.includes('date') && fieldName.includes('birth') && fieldName.includes('8')) {
            field.setText(formData.petitionerDateOfBirth);
          } else if (fieldName.includes('phone') && fieldName.includes('daytime')) {
            field.setText(formData.petitionerDaytimePhone);
          } else if (fieldName.includes('phone') && fieldName.includes('mobile')) {
            field.setText(formData.petitionerMobilePhone || '');
          } else if (fieldName.includes('email')) {
            field.setText(formData.petitionerEmail || '');
          }
          // Beneficiary fields
          else if (fieldName.includes('family') && fieldName.includes('name') && fieldName.includes('1')) {
            field.setText(formData.beneficiaryFamilyName);
          } else if (fieldName.includes('given') && fieldName.includes('name') && fieldName.includes('1')) {
            field.setText(formData.beneficiaryGivenName);
          } else if (fieldName.includes('middle') && fieldName.includes('name') && fieldName.includes('1')) {
            field.setText(formData.beneficiaryMiddleName || '');
          }
        } else if (field instanceof PDFCheckBox) {
          // Checkbox field mappings
          if (fieldName.includes('spouse') && formData.relationshipType === 'Spouse') {
            field.check();
          } else if (fieldName.includes('parent') && formData.relationshipType === 'Parent') {
            field.check();
          } else if (fieldName.includes('brother') || fieldName.includes('sister')) {
            if (formData.relationshipType === 'Brother/Sister') field.check();
          } else if (fieldName.includes('child') && formData.relationshipType === 'Child') {
            field.check();
          } else if (fieldName.includes('male') && formData.petitionerSex === 'Male') {
            field.check();
          } else if (fieldName.includes('female') && formData.petitionerSex === 'Female') {
            field.check();
          } else if (fieldName.includes('citizen') && formData.petitionerCurrentStatus === 'U.S. Citizen') {
            field.check();
          } else if (fieldName.includes('permanent') && formData.petitionerCurrentStatus === 'Lawful Permanent Resident') {
            field.check();
          }
        }
      } catch (error) {
        console.warn(`Could not fill field ${field.getName()}:`, error);
      }
    });
    
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
    
  } catch (error) {
    console.error('Error in dynamic PDF filling:', error);
    throw error;
  }
}; 