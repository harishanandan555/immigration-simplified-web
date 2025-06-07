import React, { useState } from 'react';
import '../../styles/FormTypeSelection.css';

interface FormType {
  id: string;
  name: string;
  description: string;
  subCategories: FormSubCategory[];
}

interface FormSubCategory {
  id: string;
  name: string;
  description: string;
  requiredDocuments: string[];
}

interface FormTypeSelectionProps {
  onSelect: (type: string, subCategory: string) => void;
  disabled?: boolean;
  error?: string | null;
}

const formTypes: FormType[] = [
  {
    id: 'family',
    name: 'Family Sponsorship',
    description: 'Sponsor your family members to come to Canada',
    subCategories: [
      {
        id: 'spouse',
        name: 'Spouse/Partner',
        description: 'Sponsor your spouse or common-law partner',
        requiredDocuments: ['Marriage Certificate', 'Proof of Relationship', 'Financial Documents']
      },
      {
        id: 'children',
        name: 'Children',
        description: 'Sponsor your dependent children',
        requiredDocuments: ['Birth Certificates', 'Proof of Custody', 'Financial Documents']
      }
    ]
  },
  {
    id: 'work',
    name: 'Work Permit',
    description: 'Apply for a work permit to work in Canada',
    subCategories: [
      {
        id: 'employer',
        name: 'Employer-Specific',
        description: 'Work permit for a specific employer',
        requiredDocuments: ['Job Offer Letter', 'LMIA', 'Qualifications']
      },
      {
        id: 'open',
        name: 'Open Work Permit',
        description: 'Work permit not tied to a specific employer',
        requiredDocuments: ['Passport', 'Qualifications', 'Financial Documents']
      }
    ]
  },
  {
    id: 'study',
    name: 'Study Permit',
    description: 'Study at a designated learning institution in Canada',
    subCategories: [
      {
        id: 'university',
        name: 'University',
        description: 'Study at a Canadian university',
        requiredDocuments: ['Letter of Acceptance', 'Proof of Funds', 'Academic Records']
      },
      {
        id: 'college',
        name: 'College',
        description: 'Study at a Canadian college',
        requiredDocuments: ['Letter of Acceptance', 'Proof of Funds', 'Academic Records']
      }
    ]
  },
  {
    id: 'permanent',
    name: 'Permanent Residence',
    description: 'Apply for permanent residence in Canada',
    subCategories: [
      {
        id: 'express',
        name: 'Express Entry',
        description: 'Apply through the Express Entry system',
        requiredDocuments: ['Language Test Results', 'Education Assessment', 'Work Experience']
      },
      {
        id: 'provincial',
        name: 'Provincial Nominee',
        description: 'Apply through a Provincial Nominee Program',
        requiredDocuments: ['Provincial Nomination', 'Work Experience', 'Language Test Results']
      }
    ]
  }
];

export const FormTypeSelection: React.FC<FormTypeSelectionProps> = ({ 
  onSelect,
  disabled = false,
  error = null
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    setSelectedSubCategory(null);
  };

  const handleSubCategorySelect = (subCategoryId: string) => {
    setSelectedSubCategory(subCategoryId);
    if (selectedType) {
      onSelect(selectedType, subCategoryId);
    }
  };

  return (
    <div className="form-type-selection">
      <div className="selection-header">
        <h2>Select Form Type</h2>
        <p>Choose the type of immigration form you need</p>
      </div>

      <div className="selection-content">
        <div className="form-types">
          {formTypes.map((type) => (
            <div
              key={type.id}
              className={`form-type-card ${selectedType === type.id ? 'selected' : ''}`}
              onClick={() => handleTypeSelect(type.id)}
            >
              <h3>{type.name}</h3>
              <p>{type.description}</p>
            </div>
          ))}
        </div>

        {selectedType && (
          <div className="sub-categories">
            <h3>Select Sub-Category</h3>
            <div className="sub-category-list">
              {formTypes
                .find((type) => type.id === selectedType)
                ?.subCategories.map((subCategory) => (
                  <div
                    key={subCategory.id}
                    className={`sub-category-card ${
                      selectedSubCategory === subCategory.id ? 'selected' : ''
                    }`}
                    onClick={() => handleSubCategorySelect(subCategory.id)}
                  >
                    <h4>{subCategory.name}</h4>
                    <p>{subCategory.description}</p>
                    <div className="required-documents">
                      <h5>Required Documents:</h5>
                      <ul>
                        {subCategory.requiredDocuments.map((doc, index) => (
                          <li key={index}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 