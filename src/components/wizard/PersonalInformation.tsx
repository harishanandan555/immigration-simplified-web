import React, { useState } from 'react';

interface PersonalInformationProps {
  onNext: (data: any) => void;
}

const PersonalInformation: React.FC<PersonalInformationProps> = ({ onNext }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    countryOfBirth: '',
    currentStatus: '',
    aNumber: '',
    ssn: '',
    passportNumber: '',
    passportExpiry: '',
    dependents: []
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
        <p className="mt-2 text-gray-600">
          Please provide your personal details. This information will be used to fill out your
          immigration forms.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            />
          </div>

          {/* Country of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Country of Birth</label>
            <input
              type="text"
              name="countryOfBirth"
              value={formData.countryOfBirth}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            />
          </div>

          {/* Current Immigration Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Immigration Status</label>
            <select
              name="currentStatus"
              value={formData.currentStatus}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            >
              <option value="">Select Status</option>
              <option value="citizen">U.S. Citizen</option>
              <option value="lpr">Lawful Permanent Resident</option>
              <option value="nonimmigrant">Non-Immigrant Visa Holder</option>
              <option value="undocumented">Undocumented</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* A-Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">A-Number (if any)</label>
            <input
              type="text"
              name="aNumber"
              value={formData.aNumber}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          {/* SSN */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Social Security Number</label>
            <input
              type="text"
              name="ssn"
              value={formData.ssn}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          {/* Passport Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Passport Number</label>
            <input
              type="text"
              name="passportNumber"
              value={formData.passportNumber}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Passport Expiry Date</label>
            <input
              type="date"
              name="passportExpiry"
              value={formData.passportExpiry}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
        </div>

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

export default PersonalInformation; 