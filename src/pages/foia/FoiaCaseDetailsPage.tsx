import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Download, Edit, Trash2, Search, AlertCircle, Clock, CheckCircle, FileText, Calendar } from 'lucide-react';
import { getFoiaCaseByCaseId, getFoiaCaseStatus, deleteFoiaCase, FoiaCase } from '../../controllers/FoiaCaseControllers';
import { toast } from 'react-hot-toast';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

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

const FoiaCaseDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<FoiaCase | null>(null);

  const [trackedCaseStatus, setTrackedCaseStatus] = useState<FoiaCaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCaseData();
    }
  }, [id]);

  const fetchCaseData = async () => {
    try {
      setLoading(true);
      const response = await getFoiaCaseByCaseId(id!);
      setCaseData(response.data);
      // Automatically fetch case status when case data is loaded
      if (response.data?.requestNumber) {
        fetchCaseStatus(response.data.requestNumber);
      }
    } catch (err) {
      setError('Failed to load FOIA case');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseStatus = async (requestNumber: string) => {
    if (!requestNumber) {
      toast.error('No request number available for this case');
      return;
    }

    try {
      setStatusLoading(true);
      setTrackingError(null);
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

        setTrackedCaseStatus(foiaCaseStatus);
        toast.success('Case status updated');
      } else {
        setTrackingError('Failed to retrieve FOIA case status. Please check the request number and try again.');
        setTrackedCaseStatus(null);
      }
    } catch (err: any) {
      // Handle specific USCIS system errors
      if (err.message && err.message.includes('USCIS system is currently unavailable')) {
        setTrackingError('USCIS system is temporarily unavailable. Please try again later or contact USCIS directly.');
      } else if (err.message && err.message.includes('Failed to fetch FOIA case status')) {
        setTrackingError('Failed to retrieve FOIA case status. Please check the request number and try again.');
      } else {
        setTrackingError('An unexpected error occurred. Please try again.');
      }
      setTrackedCaseStatus(null);
      toast.error('Failed to fetch case status');
      console.error(err);
    } finally {
      setStatusLoading(false);
    }
  };

  // Retry case lookup with exponential backoff
  const handleRetry = async () => {
    if (isRetrying || !caseData?.requestNumber) return;

    setIsRetrying(true);
    setTrackingError(null);

    try {
      // Exponential backoff: 2^retryCount * 1000ms
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      const response = await getFoiaCaseStatus(caseData.requestNumber);

      if (response.success && response.data?.data) {
        // Transform FOIA case status to our local format
        const foiaCaseStatus: FoiaCaseStatus = {
          requestNumber: response.data.data.requestNumber || caseData.requestNumber,
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

        setTrackedCaseStatus(foiaCaseStatus);
        setRetryCount(0);
        toast.success('Case status updated');
      } else {
        setTrackingError('Failed to retrieve FOIA case status. Please check the request number and try again.');
        setTrackedCaseStatus(null);
      }
    } catch (error: any) {
      setRetryCount(prev => prev + 1);
      if (error.message && error.message.includes('USCIS system is currently unavailable')) {
        setTrackingError(`USCIS system is temporarily unavailable. Retry attempt ${retryCount + 1} failed. Please try again later.`);
      } else {
        setTrackingError('Failed to retrieve FOIA case status. Please try again.');
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDelete = async () => {
    if (!caseData || !window.confirm('Are you sure you want to delete this FOIA case?')) {
      return;
    }

    try {
      await deleteFoiaCase(caseData._id);
      toast.success('FOIA case deleted successfully');
      navigate('/foia-cases');
    } catch (err) {
      toast.error('Failed to delete FOIA case');
      console.error(err);
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Case not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/foia-cases')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to FOIA Cases
        </button>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate(`/foia-cases/${id}/edit`)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* FOIA Case Tracker Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Track FOIA Case Status</h2>
            <p className="text-sm text-gray-500 mt-1">Current status for request number: {caseData.requestNumber}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCaseStatus(caseData.requestNumber)}
            disabled={statusLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${statusLoading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
        </div>

        {trackingError && (
          <div className="mb-4">
            <Alert
              type="error"
              message={trackingError}
              className="mb-3"
            />
            {trackingError.includes('USCIS system is temporarily unavailable') && (
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

        {/* Case Status Display */}
        {trackedCaseStatus && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Request Number</p>
                <p className="font-medium text-primary-900 text-lg">{trackedCaseStatus.requestNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Current Status</p>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(trackedCaseStatus.status)}
                  <span className={`font-medium text-lg ${getStatusColor(trackedCaseStatus.status)}`}>
                    {trackedCaseStatus.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Case History Timeline */}
            {trackedCaseStatus.history && trackedCaseStatus.history.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Case History</h4>
                <div className="flow-root">
                  <ul className="-mb-4">
                    {trackedCaseStatus.history.map((item: any, index: any) => (
                      <li key={index}>
                        <div className="relative pb-4">
                          {index !== trackedCaseStatus.history.length - 1 ? (
                            <span
                              className="absolute top-3 left-3 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex items-start space-x-3">
                            <div className="relative">
                              <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-gray-50">
                                {getStatusIcon(item.status)}
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 py-0.5">
                              <div className="text-sm text-gray-500">
                                <span className={`font-medium ${getStatusColor(item.status)}`}>
                                  {item.status}
                                </span>{' '}
                                <span className="whitespace-nowrap">
                                  {formatDate(item.date)} at {formatTime(item.date)}
                                </span>
                              </div>
                              <div className="mt-1 text-sm text-gray-700">
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
            )}
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              FOIA Case: {caseData.subject.firstName} {caseData.subject.lastName}
            </h1>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                caseData.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                caseData.status === 'Completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {caseData.status}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Case Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Case ID</dt>
                  <dd className="text-sm text-gray-900">{caseData.caseId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Request Number</dt>
                  <dd className="text-sm text-gray-900">{caseData.requestNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Public Case ID</dt>
                  <dd className="text-sm text-gray-900">{caseData.publicCaseId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(caseData.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(caseData.updatedAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Subject Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900">
                    {caseData.subject.firstName} {caseData.subject.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{caseData.requester.emailAddress}</dd>
                </div>
              </dl>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default FoiaCaseDetailsPage;
