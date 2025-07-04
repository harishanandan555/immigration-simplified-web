import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, FileText, Users, Briefcase, Heart, Plane, Building, CheckCircle } from 'lucide-react';

const EnhancedImmigrationWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedForm, setSelectedForm] = useState<string>('');

  const availableForms = [
    {
      id: 'I-130',
      name: 'I-130 Petition for Alien Relative',
      description: 'Petition to establish a relationship between a U.S. citizen/permanent resident and an alien relative',
      category: 'Family-Based Immigration',
      icon: Users,
      requirements: 'Must have qualifying family relationship'
    },
    {
      id: 'I-485',
      name: 'I-485 Application to Register Permanent Residence',
      description: 'Application for adjustment of status to permanent resident',
      category: 'Adjustment of Status',
      icon: FileText,
      requirements: 'Must have approved immigrant petition and be eligible'
    },
    {
      id: 'N-400',
      name: 'N-400 Application for Naturalization',
      description: 'Application for U.S. citizenship',
      category: 'Naturalization',
      icon: Shield,
      requirements: 'Must meet residency and other requirements'
    },
    {
      id: 'I-765',
      name: 'I-765 Application for Employment Authorization',
      description: 'Application for employment authorization document (EAD)',
      category: 'Employment Authorization',
      icon: Briefcase,
      requirements: 'Must have pending application or eligible status'
    },
    {
      id: 'I-131',
      name: 'I-131 Application for Travel Document',
      description: 'Application for advance parole or refugee travel document',
      category: 'Travel Documents',
      icon: Plane,
      requirements: 'Must have pending application or refugee status'
    },
    {
      id: 'I-751',
      name: 'I-751 Petition to Remove Conditions on Residence',
      description: 'Petition to remove conditions on conditional permanent residence',
      category: 'Family-Based Immigration',
      icon: Heart,
      requirements: 'Must be filed within 90 days before conditional residence expires'
    },
    {
      id: 'I-140',
      name: 'I-140 Immigrant Petition for Alien Worker',
      description: 'Petition for employment-based immigrant visa',
      category: 'Employment-Based Immigration',
      icon: Building,
      requirements: 'Must have job offer and meet category requirements'
    }
  ];

  const handleFormSelect = (formId: string) => {
    setSelectedForm(formId);
  };

  const handleContinue = () => {
    if (selectedForm) {
      navigate(`/enhanced-immigration-wizard/${selectedForm}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Enhanced Immigration Wizard
                </h1>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Select Your Form</h2>
          <p className="text-lg text-gray-600">
            Choose the USCIS form you want to complete with our enhanced wizard.
          </p>
        </div>

        {/* Form Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {availableForms.map((form) => {
            const Icon = form.icon;
            return (
              <div
                key={form.id}
                className={`relative p-6 bg-white rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedForm === form.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleFormSelect(form.id)}
              >
                {selectedForm === form.id && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="w-6 h-6 text-blue-500" />
                  </div>
                )}
                
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                    selectedForm === form.id ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      selectedForm === form.id ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${
                      selectedForm === form.id ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {form.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{form.category}</p>
                    <p className="text-sm text-gray-600 mt-2">{form.description}</p>
                    <p className="text-xs text-gray-500 mt-2 font-medium">Requirements: {form.requirements}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedForm}
            className={`px-8 py-3 rounded-lg font-medium transition-colors duration-200 ${
              selectedForm
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue with Enhanced Wizard
          </button>
        </div>

        {/* Information Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <Shield className="w-6 h-6 text-blue-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-blue-800 mb-2">
                Enhanced Immigration Wizard Features
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Real-time eligibility assessment</li>
                <li>• Smart form guidance and validation</li>
                <li>• Security monitoring and data protection</li>
                <li>• Consistency checking across forms</li>
                <li>• Automatic form updates and versioning</li>
                <li>• Comprehensive error prevention</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedImmigrationWizardPage;
