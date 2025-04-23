import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4'
  };

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-t-primary-500 border-solid border-gray-200 rounded-full animate-spin`}
      ></div>
      <p className="mt-2 text-gray-600 font-medium text-sm">Loading...</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
        {spinnerContent}
      </div>
    );
  }

  return (
    <div className="flex justify-center py-8">
      {spinnerContent}
    </div>
  );
};

export default LoadingSpinner;