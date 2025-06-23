import React, { useState } from 'react';

const steps = [
  { id: 'case-type', label: 'Case Type', icon: '📋' },
  { id: 'forms', label: 'Select Forms', icon: '📄' },
  { id: 'personal-info', label: 'Personal Info', icon: '👤' },
  { id: 'form-questions', label: 'Form Questions', icon: '❓' },
  { id: 'documents', label: 'Documents', icon: '📁' },
  { id: 'review', label: 'Review', icon: '✓' },
  { id: 'paralegal', label: 'Paralegal Review', icon: '👨‍⚖️' },
  { id: 'filing', label: 'Filing', icon: '📬' },
  { id: 'tracking', label: 'Tracking', icon: '📊' },
  { id: 'reminders', label: 'Reminders', icon: '🔔' },
];

const [currentStep, setCurrentStep] = useState('case-type');
const [selectedForms, setSelectedForms] = useState<string[]>([]);

const availableForms = [
  {
    id: 'i-130',
    name: 'I-130 Petition for Alien Relative',
    description: 'Used to establish a relationship between a U.S. citizen or permanent resident and their relative.',
    requirements: 'Proof of relationship, U.S. citizenship or permanent residency'
  },
  {
    id: 'i-485',
    name: 'I-485 Application to Register Permanent Residence',
    description: 'Application for adjustment of status to permanent resident.',
    requirements: 'Valid immigrant petition, medical examination, supporting documents'
  },
  {
    id: 'i-765',
    name: 'I-765 Application for Employment Authorization',
    description: 'Request for work permit while waiting for immigration benefits.',
    requirements: 'Pending immigration application, passport photos'
  },
  {
    id: 'i-131',
    name: 'I-131 Application for Travel Document',
    description: 'Request for advance parole or refugee travel document.',
    requirements: 'Pending immigration application, travel itinerary'
  },
  {
    id: 'i-751',
    name: 'I-751 Petition to Remove Conditions',
    description: 'Remove conditions on permanent residence based on marriage.',
    requirements: 'Joint filing with spouse, proof of bona fide marriage'
  },
  {
    id: 'n-400',
    name: 'N-400 Application for Naturalization',
    description: 'Application for U.S. citizenship.',
    requirements: 'Permanent resident for 5 years, good moral character'
  }
];

const renderStepContent = () => {
  switch (currentStep) {
    case 'case-type':
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Select Your Case Type</h2>
          <p className="text-gray-600">Choose the immigration category that best fits your situation.</p>
          {/* Case type selection content */}
        </div>
      );
    case 'forms':
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Select Required Forms</h2>
          <p className="text-gray-600">Choose all the forms that apply to your case. You can select multiple forms.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableForms.map((form) => (
              <div
                key={form.id}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedForms.includes(form.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => {
                  setSelectedForms(prev =>
                    prev.includes(form.id)
                      ? prev.filter(id => id !== form.id)
                      : [...prev, form.id]
                  );
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{form.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedForms.includes(form.id)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedForms.includes(form.id) && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                {form.requirements && (
                  <div className="mt-3 text-sm text-gray-500">
                    <span className="font-medium">Requirements:</span> {form.requirements}
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedForms.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-medium text-gray-900 mb-2">Selected Forms ({selectedForms.length})</h3>
              <div className="space-y-2">
                {selectedForms.map(formId => {
                  const form = availableForms.find(f => f.id === formId);
                  return form ? (
                    <div key={formId} className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <span className="text-gray-700">{form.name}</span>
                      <button
                        onClick={() => setSelectedForms(prev => prev.filter(id => id !== formId))}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      );
    // ... existing cases ...
  }
}; 