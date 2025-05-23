import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, AlertCircle, Clock, CheckCircle, FileText, Calendar, ArrowRight } from 'lucide-react';

import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import DebugView from '../../components/common/DebugView';

import { getCaseByNumber } from '../../controllers/CaseControllers';
import { CaseStatus } from '../../types';

const CaseStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const { caseNumber: urlCaseNumber } = useParams<{ caseNumber: string }>();

  // State
  const [caseNumber, setCaseNumber] = useState(urlCaseNumber || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseStatus, setCaseStatus] = useState<CaseStatus | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Handle case number change
  const handleCaseNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaseNumber(e.target.value);
    setError(null);
  };

  // Handle case lookup
  const handleCaseLookup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!caseNumber.trim()) {
      setError('Please enter a case number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getCaseByNumber(caseNumber);

      if (response.data) {
        // Transform Case type to CaseStatus type
        const caseStatus: CaseStatus = {
          caseNumber: response.data.caseNumber || caseNumber,
          status: response.data.status || 'Unknown',
          lastUpdated: response.data.updatedAt || new Date().toISOString(),
          history: response.data.timeline?.map(item => ({
            date: item.date,
            status: item.action,
            description: item.notes
          })) || []
        };

        setCaseStatus(caseStatus);

        // Update URL with case number
        if (caseNumber !== urlCaseNumber) {
          navigate(`/case/${caseNumber}`, { replace: true });
        }
      } else {
        setError('Failed to retrieve case status. Please check the case number and try again.');
        setCaseStatus(null);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      setCaseStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Get status color based on status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'text-green-600';
      case 'denied':
        return 'text-red-600';
      case 'in process':
        return 'text-blue-600';
      case 'received':
        return 'text-teal-600';
      default:
        return 'text-gray-600';
    }
  };

  // Get status icon based on status
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'denied':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'in process':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'received':
        return <FileText className="w-5 h-5 text-teal-500" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-500" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };

  // Render case lookup form
  const renderCaseLookupForm = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleCaseLookup}>
          <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-grow">
              <Input
                id="caseNumber"
                label="Case Number"
                value={caseNumber}
                onChange={handleCaseNumberChange}
                placeholder="Enter your case number (e.g., ABC1234567)"
                error={error || undefined}
                required
              />
            </div>
            <div>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                <Search className="w-4 h-4 mr-2" />
                Check Status
              </Button>
            </div>
          </div>
        </form>

        {error && (
          <Alert
            type="error"
            message={error}
            className="mt-4"
          />
        )}
      </div>
    );
  };

  // Render case status card
  const renderCaseStatusCard = () => {
    if (!caseStatus) return null;

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="bg-blue-900 p-4">
          <h2 className="text-white text-lg font-semibold">Case Status Summary</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Case Number</p>
              <p className="font-medium text-blue-900">{caseStatus.caseNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Status</p>
              <p className={`font-medium ${getStatusColor(caseStatus.status)}`}>
                {caseStatus.status}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium">
                {formatDate(caseStatus.lastUpdated)}
              </p>
            </div>
          </div>

          {showDebug && (
            <DebugView
              data={caseStatus}
              title="Case Status Data"
              expanded
              className="mb-6"
            />
          )}

          <div className="text-right mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? 'Hide' : 'Show'} Debug Data
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render case history timeline
  const renderCaseTimeline = () => {
    if (!caseStatus || !caseStatus.history || caseStatus.history.length === 0) return null;

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-900 p-4">
          <h2 className="text-white text-lg font-semibold">Case History Timeline</h2>
        </div>

        <div className="p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {caseStatus.history.map((item: any, index: any) => (
                <li key={index}>
                  <div className="relative pb-8">
                    {index !== caseStatus.history.length - 1 ? (
                      <span
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                          {getStatusIcon(item.status)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 py-1.5">
                        <div className="text-sm text-gray-500">
                          <span className={`font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>{' '}
                          <span className="whitespace-nowrap">
                            {formatDate(item.date)} at {formatTime(item.date)}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          <p>{item.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Load case status on initial render if case number is provided in URL
  React.useEffect(() => {
    if (urlCaseNumber && !caseStatus) {
      setCaseNumber(urlCaseNumber);
      handleCaseLookup({ preventDefault: () => { } } as any);
    }
  }, [urlCaseNumber]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-blue-900 mb-6">USCIS Case Status Tracker</h1>

      {renderCaseLookupForm()}

      {caseStatus && (
        <>
          {renderCaseStatusCard()}
          {renderCaseTimeline()}

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Need to submit a new application?</p>
            <Button
              variant="primary"
              onClick={() => navigate('/apply')}
            >
              Start New Application <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default CaseStatusPage;