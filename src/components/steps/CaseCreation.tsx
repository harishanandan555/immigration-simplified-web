import React, { useState } from 'react';

interface CaseCreationProps {
  onUpdate: (data: {
    caseNumber: string;
    priorityDate: string;
    assignedStaff: string;
    caseNotes: string;
  }) => void;
  data: {
    caseNumber: string;
    priorityDate: string;
    assignedStaff: string;
    caseNotes: string;
  };
}

const CaseCreation: React.FC<CaseCreationProps> = ({ onUpdate, data }) => {
  const [caseNumber, setCaseNumber] = useState<string>(data.caseNumber);
  const [priorityDate, setPriorityDate] = useState<string>(data.priorityDate);
  const [assignedStaff, setAssignedStaff] = useState<string>(data.assignedStaff);
  const [caseNotes, setCaseNotes] = useState<string>(data.caseNotes);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      caseNumber,
      priorityDate,
      assignedStaff,
      caseNotes
    });
  };

  const generateCaseNumber = () => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    const newCaseNumber = `CASE-${timestamp}-${random}`;
    setCaseNumber(newCaseNumber);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-neutral-800 mb-6">
        Create New Case
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Case Number
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                className="flex-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="CASE-XXXXX"
                required
              />
              <button
                type="button"
                onClick={generateCaseNumber}
                className="ml-3 inline-flex items-center px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Priority Date
            </label>
            <input
              type="date"
              value={priorityDate}
              onChange={(e) => setPriorityDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Assigned Staff
          </label>
          <select
            value={assignedStaff}
            onChange={(e) => setAssignedStaff(e.target.value)}
            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
          >
            <option value="">Select staff member</option>
            <option value="john.doe">John Doe</option>
            <option value="jane.smith">Jane Smith</option>
            <option value="michael.johnson">Michael Johnson</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Case Notes
          </label>
          <textarea
            value={caseNotes}
            onChange={(e) => setCaseNotes(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="Enter any additional notes or comments about the case..."
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>

          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Create Case
          </button>
        </div>

        {showPreview && (
          <div className="mt-6 bg-neutral-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-neutral-800 mb-4">
              Case Preview
            </h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-neutral-500">
                  Case Number
                </dt>
                <dd className="mt-1 text-sm text-neutral-900">
                  {caseNumber}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">
                  Priority Date
                </dt>
                <dd className="mt-1 text-sm text-neutral-900">
                  {priorityDate}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">
                  Assigned Staff
                </dt>
                <dd className="mt-1 text-sm text-neutral-900">
                  {assignedStaff}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">
                  Case Notes
                </dt>
                <dd className="mt-1 text-sm text-neutral-900">
                  {caseNotes || 'No notes provided'}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </form>
    </div>
  );
};

export default CaseCreation; 