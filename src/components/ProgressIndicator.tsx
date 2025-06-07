import React from 'react';
import { Step } from './FormWizard';

interface ProgressIndicatorProps {
  steps: Step[];
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ steps }) => {
  return (
    <div className="relative">
      {/* Progress bar */}
      <div className="absolute top-4 left-0 w-full h-0.5 bg-neutral-200">
        <div
          className="h-full bg-primary-600 transition-all duration-300"
          style={{
            width: `${(steps.filter(step => step.isCompleted).length / (steps.length - 1)) * 100}%`
          }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            {/* Step circle */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                step.isCompleted
                  ? 'bg-primary-600 text-white'
                  : step.isCurrent
                  ? 'bg-primary-100 text-primary-600 border-2 border-primary-600'
                  : 'bg-neutral-200 text-neutral-800'
              }`}
            >
              {step.isCompleted ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>

            {/* Step label */}
            <div className="mt-2 text-center">
              <div
                className={`text-sm font-medium ${
                  step.isCurrent ? 'text-primary-600' : 'text-neutral-800'
                }`}
              >
                {step.title}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator; 