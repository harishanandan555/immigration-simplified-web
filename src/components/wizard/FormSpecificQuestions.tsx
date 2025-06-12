import React, { useState } from 'react';

interface FormSpecificQuestionsProps {
  onNext: (data: any) => void;
  caseType: string;
  forms: string[];
}

const FormSpecificQuestions: React.FC<FormSpecificQuestionsProps> = ({ onNext, caseType, forms }) => {
  const [formData, setFormData] = useState({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  const renderI130Questions = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">I-130: Petition for Alien Relative</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Relationship to Petitioner
        </label>
        <select
          name="relationship"
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">Select Relationship</option>
          <option value="spouse">Spouse</option>
          <option value="parent">Parent</option>
          <option value="child">Child</option>
          <option value="sibling">Sibling</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Date of Marriage (if applicable)
        </label>
        <input
          type="date"
          name="marriageDate"
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>
    </div>
  );

  const renderI485Questions = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">I-485: Application to Register Permanent Residence</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Current Address
        </label>
        <textarea
          name="currentAddress"
          onChange={handleInputChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Employment History (Last 5 Years)
        </label>
        <textarea
          name="employmentHistory"
          onChange={handleInputChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Have you ever been arrested or convicted of a crime?
        </label>
        <select
          name="criminalHistory"
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">Select</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
    </div>
  );

  const renderI765Questions = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">I-765: Application for Employment Authorization</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Eligibility Category
        </label>
        <select
          name="eligibilityCategory"
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">Select Category</option>
          <option value="c8">(c)(8) - Asylum Applicant</option>
          <option value="c9">(c)(9) - Adjustment Applicant</option>
          <option value="a3">(a)(3) - F-1 Student</option>
          <option value="c26">(c)(26) - J-2 Spouse/Child</option>
        </select>
      </div>
    </div>
  );

  const renderI131Questions = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">I-131: Application for Travel Document</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Purpose of Travel
        </label>
        <textarea
          name="travelPurpose"
          onChange={handleInputChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Expected Travel Dates
        </label>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="date"
            name="travelStartDate"
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <input
            type="date"
            name="travelEndDate"
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Form-Specific Questions</h2>
        <p className="mt-2 text-gray-600">
          Please answer the following questions specific to your case type and required forms.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {forms.includes('I-130') && renderI130Questions()}
        {forms.includes('I-485') && renderI485Questions()}
        {forms.includes('I-765') && renderI765Questions()}
        {forms.includes('I-131') && renderI131Questions()}

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Next Step
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormSpecificQuestions; 