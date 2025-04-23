import React, { useState } from 'react';
import { Code, ChevronDown, ChevronUp } from 'lucide-react';

interface DebugViewProps {
  data: any;
  title?: string;
  expanded?: boolean;
  className?: string;
}

const DebugView: React.FC<DebugViewProps> = ({
  data,
  title = 'Debug Information',
  expanded = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const formatData = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return 'Error formatting data';
    }
  };

  return (
    <div className={`border rounded-md overflow-hidden ${className}`}>
      <div
        className="flex items-center justify-between p-3 bg-gray-100 border-b cursor-pointer"
        onClick={toggleExpanded}
      >
        <div className="flex items-center">
          <Code className="w-4 h-4 mr-2 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        </div>
        <button className="p-1 text-gray-500 hover:text-gray-700">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>
      {isExpanded && (
        <div className="p-3 bg-gray-50">
          <pre className="text-xs whitespace-pre-wrap text-gray-800 overflow-x-auto">
            {formatData(data)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugView;