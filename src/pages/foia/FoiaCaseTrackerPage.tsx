import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, AlertCircle, Clock, CheckCircle, FileText, Calendar, ArrowRight } from 'lucide-react';

import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

import { getFoiaCaseStatus } from '../../controllers/FoiaCaseControllers';

interface FoiaCaseStatus {
  requestNumber: string;
  status: string;
  lastUpdated: string;
  history: Array<{
    date: string;
    status: string;
    description: string;
  }>;
}

const FoiaCaseTrackerPage: React.FC = () => {
  const navigate = useNavigate();
  const { requestNumber: urlRequestNumber } = useParams<{ requestNumber: string }>();

  // State
  const [requestNumber, setRequestNumber] = useState(urlRequestNumber || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseStatus, setCaseStatus] = useState<FoiaCaseStatus | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Handle request number change
  const handleRequestNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRequestNumber(e.target.value);
    setError(null);
  };

  // Handle case lookup
  const handleCaseLookup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!requestNumber.trim()) {
      setError('Please enter a request number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    try {
      const response = await getFoiaCaseStatus(requestNumber);

      if (response.success && response.data?.data) {
        // Transform FOIA case status to our local format
        const foiaCaseStatus: FoiaCaseStatus = {
          requestNumber: response.data.data.requestNumber || requestNumber,
          status: response.data.data.status?.display || 'Unknown',
          lastUpdated: new Date().toISOString(),
          history: [
            {
              date: new Date().toISOString(),
              status: response.data.data.status?.display || 'Unknown',
              description: `Current status: ${response.data.data.status?.display || 'Unknown'}${response.data.data.placeInQueue && response.data.data.queueLength ? `. Queue position: ${response.data.data.placeInQueue} of ${response.data.data.queueLength}` : ''}`
            }
          ]
        };

        // Add estimated completion date if available
        if (response.data.data.estCompletionDate) {
          foiaCaseStatus.history.push({
            date: response.data.data.estCompletionDate,
            status: 'Estimated Completion',
            description: `Estimated completion date: ${new Date(response.data.data.estCompletionDate).toLocaleDateString()}`
          });
        }

        setCaseStatus(foiaCaseStatus);

        // Update URL with request number
        if (requestNumber !== urlRequestNumber) {
          navigate(`/foia-tracker/${requestNumber}`, { replace: true });
        }
      } else {
        setError('Failed to retrieve FOIA case status. Please check the request number and try again.');
        setCaseStatus(null);
      }
    } catch (error: any) {
      // Handle specific USCIS system errors
      if (error.message && error.message.includes('USCIS system is currently unavailable')) {
        setError('USCIS system is temporarily unavailable. Please try again later or contact USCIS directly.');
      } else if (error.message && error.message.includes('Failed to fetch FOIA case status')) {
        setError('Failed to retrieve FOIA case status. Please check the request number and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setCaseStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Retry case lookup with exponential backoff
  const handleRetry = async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    setError(null);

    try {
      // Exponential backoff: 2^retryCount * 1000ms
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      const response = await getFoiaCaseStatus(requestNumber);

      if (response.success && response.data?.data) {
        // Transform FOIA case status to our local format
        const foiaCaseStatus: FoiaCaseStatus = {
          requestNumber: response.data.data.requestNumber || requestNumber,
          status: response.data.data.status?.display || 'Unknown',
          lastUpdated: new Date().toISOString(),
          history: [
            {
              date: new Date().toISOString(),
              status: response.data.data.status?.display || 'Unknown',
              description: `Current status: ${response.data.data.status?.display || 'Unknown'}${response.data.data.placeInQueue && response.data.data.queueLength ? `. Queue position: ${response.data.data.placeInQueue} of ${response.data.data.queueLength}` : ''}`
            }
          ]
        };

        // Add estimated completion date if available
        if (response.data.data.estCompletionDate) {
          foiaCaseStatus.history.push({
            date: response.data.data.estCompletionDate,
            status: 'Estimated Completion',
            description: `Estimated completion date: ${new Date(response.data.data.estCompletionDate).toLocaleDateString()}`
          });
        }

        setCaseStatus(foiaCaseStatus);
        setRetryCount(0);
      } else {
        setError('Failed to retrieve FOIA case status. Please check the request number and try again.');
        setCaseStatus(null);
      }
    } catch (error: any) {
      setRetryCount(prev => prev + 1);
      if (error.message && error.message.includes('USCIS system is currently unavailable')) {
        setError(`USCIS system is temporarily unavailable. Retry attempt ${retryCount + 1} failed. Please try again later.`);
      } else {
        setError('Failed to retrieve FOIA case status. Please try again.');
      }
    } finally {
      setIsRetrying(false);
    }
  };

  // Get status color based on status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'text-green-600';
      case 'denied':
      case 'rejected':
        return 'text-red-600';
      case 'in process':
      case 'pending':
        return 'text-primary-600';
      case 'received':
      case 'submitted':
        return 'text-teal-600';
      default:
        return 'text-gray-600';
    }
  };

  // Get status icon based on status
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'denied':
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'in process':
      case 'pending':
        return <Clock className="w-5 h-5 text-primary-500" />;
      case 'received':
      case 'submitted':
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900">Track FOIA Case Status</h2>
          <p className="text-sm text-gray-500 mt-1">Enter your FOIA request number to check the current status</p>
        </div>

        <form onSubmit={handleCaseLookup}>
          <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-grow">
              <Input
                id="requestNumber"
                label="FOIA Request Number"
                value={requestNumber}
                onChange={handleRequestNumberChange}
                placeholder="Enter your FOIA request number"
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
          <div className="mt-4">
            <Alert
              type="error"
              message={error}
              className="mb-3"
            />
            {error.includes('USCIS system is temporarily unavailable') && (
              <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="text-sm text-yellow-800">
                    USCIS system may be experiencing temporary issues
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="ml-3"
                >
                  {isRetrying ? 'Retrying...' : `Retry (${retryCount + 1})`}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render case status card
  const renderCaseStatusCard = () => {
    if (!caseStatus) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="bg-primary-900 p-4">
          <h2 className="text-white text-lg font-semibold">FOIA Case Status Summary</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Request Number</p>
              <p className="font-medium text-primary-900 text-lg">{caseStatus.requestNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Current Status</p>
              <div className="flex items-center space-x-2">
                {getStatusIcon(caseStatus.status)}
                <span className={`font-medium text-lg ${getStatusColor(caseStatus.status)}`}>
                  {caseStatus.status}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Last Updated</p>
              <p className="font-medium text-gray-900">
                {formatDate(caseStatus.lastUpdated)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? 'Hide' : 'Show'} Debug Data
            </Button>
          </div>

          {showDebug && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Raw API Response:</h4>
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(caseStatus, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render case history timeline
  const renderCaseTimeline = () => {
    if (!caseStatus || !caseStatus.history || caseStatus.history.length === 0) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-primary-900 p-4">
          <h2 className="text-white text-lg font-semibold">FOIA Case History Timeline</h2>
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

  // Load case status on initial render if request number is provided in URL
  React.useEffect(() => {
    if (urlRequestNumber && !caseStatus) {
      setRequestNumber(urlRequestNumber);
      handleCaseLookup({ preventDefault: () => { } } as any);
    }
  }, [urlRequestNumber]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">FOIA Case Status Tracker</h1>
        <p className="text-gray-500 mt-1">Track the status of your Freedom of Information Act requests</p>
      </div>

      {renderCaseLookupForm()}

      {caseStatus && (
        <>
          {renderCaseStatusCard()}
          {renderCaseTimeline()}

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Need to submit a new FOIA request?</p>
            <Button
              variant="primary"
              onClick={() => navigate('/foia-cases/new')}
            >
              Start New FOIA Request <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default FoiaCaseTrackerPage;