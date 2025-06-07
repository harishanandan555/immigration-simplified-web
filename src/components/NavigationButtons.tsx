import React from 'react';

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  isNextDisabled: boolean;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  isNextDisabled
}) => {
  return (
    <div className="flex justify-between mt-8 pt-6 border-t border-neutral-200">
      <button
        type="button"
        onClick={onBack}
        disabled={currentStep === 0}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
          currentStep === 0
            ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            : 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'
        }`}
      >
        Back
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={isNextDisabled || currentStep === totalSteps - 1}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
          isNextDisabled || currentStep === totalSteps - 1
            ? 'bg-primary-100 text-primary-400 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
      >
        {currentStep === totalSteps - 2 ? 'Complete' : 'Next'}
      </button>
    </div>
  );
};

export default NavigationButtons; 