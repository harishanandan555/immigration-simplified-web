import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title?: string;
  message: string;
  className?: string;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  className = '',
  onClose,
}) => {
  const alertConfig = {
    success: {
      icon: <CheckCircle className="w-5 h-5" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-400',
      textColor: 'text-green-800',
      iconColor: 'text-green-500',
    },
    error: {
      icon: <XCircle className="w-5 h-5" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-400',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
    },
    warning: {
      icon: <AlertCircle className="w-5 h-5" />,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-400',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-500',
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-400',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500',
    },
  };

  const { icon, bgColor, borderColor, textColor, iconColor } = alertConfig[type];

  return (
    <div className={`rounded-md border-l-4 p-4 ${bgColor} ${borderColor} ${className}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${iconColor}`}>{icon}</div>
        <div className="ml-3">
          {title && <h3 className={`text-sm font-medium ${textColor}`}>{title}</h3>}
          <div className={`text-sm ${textColor} ${title ? 'mt-2' : ''}`}>{message}</div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 ${iconColor} hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50`}
            >
              <span className="sr-only">Dismiss</span>
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;