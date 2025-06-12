import React from 'react';

interface CaseType {
  id: string;
  title: string;
  description: string;
  forms: string[];
  icon: string;
}

const caseTypes: CaseType[] = [
  {
    id: 'greenCard',
    title: 'Green Card',
    description: 'Family or Employment based permanent residence',
    forms: ['I-130', 'I-485', 'I-864'],
    icon: '🏠'
  },
  {
    id: 'citizenship',
    title: 'Citizenship',
    description: 'Naturalization process',
    forms: ['N-400'],
    icon: '🇺🇸'
  },
  {
    id: 'workAuth',
    title: 'Work Authorization',
    description: 'Employment Authorization Document (EAD)',
    forms: ['I-765'],
    icon: '💼'
  },
  {
    id: 'statusChange',
    title: 'Change/Extension of Status',
    description: 'Modify or extend current immigration status',
    forms: ['I-539'],
    icon: '🔄'
  },
  {
    id: 'daca',
    title: 'DACA',
    description: 'Deferred Action for Childhood Arrivals',
    forms: ['I-821D', 'I-765'],
    icon: '📝'
  },
  {
    id: 'asylum',
    title: 'Asylum',
    description: 'Seeking protection in the United States',
    forms: ['I-589'],
    icon: '🛡️'
  },
  {
    id: 'student',
    title: 'Student Visa (F-1)',
    description: 'Study in the United States',
    forms: ['I-20', 'DS-160'],
    icon: '🎓'
  },
  {
    id: 'fiance',
    title: 'Fiancé Visa (K-1)',
    description: 'Bring your fiancé to the United States',
    forms: ['I-129F'],
    icon: '💍'
  }
];

interface CaseTypeSelectionProps {
  onNext: (data: { caseType: string; forms: string[] }) => void;
}

const CaseTypeSelection: React.FC<CaseTypeSelectionProps> = ({ onNext }) => {
  const handleCaseTypeSelect = (caseType: CaseType) => {
    onNext({
      caseType: caseType.id,
      forms: caseType.forms
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Select Your Immigration Case Type</h2>
        <p className="mt-2 text-gray-600">
          Choose the type of immigration benefit you are applying for. This will help us determine
          which forms and documents you need.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {caseTypes.map((caseType) => (
          <button
            key={caseType.id}
            onClick={() => handleCaseTypeSelect(caseType)}
            className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl mr-3">{caseType.icon}</span>
            <div className="text-left">
              <h3 className="font-bold text-gray-900">{caseType.title}</h3>
              <p className="text-sm text-gray-600">{caseType.description}</p>
              <div className="mt-2">
                <span className="text-xs text-gray-500">
                  Required Forms: {caseType.forms.join(', ')}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-blue-900">Need Help?</h3>
        <p className="text-sm text-blue-700">
          Not sure which case type applies to you? Contact our support team for guidance.
        </p>
      </div>
    </div>
  );
};

export default CaseTypeSelection; 