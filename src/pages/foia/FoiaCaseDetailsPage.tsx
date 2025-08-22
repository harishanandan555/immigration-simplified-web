import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Download, Edit, Trash2 } from 'lucide-react';
import { getFoiaCaseByCaseId, getFoiaCaseStatus, deleteFoiaCase, FoiaCase } from '../../controllers/FoiaCaseControllers';
import { toast } from 'react-hot-toast';

const FoiaCaseDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<FoiaCase | null>(null);
  const [caseStatus, setCaseStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError('Failed to load FOIA case');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseStatus = async () => {
    if (!caseData?.requestNumber) {
      toast.error('No request number available for this case');
      return;
    }

    try {
      setStatusLoading(true);
      const response = await getFoiaCaseStatus(caseData.requestNumber);
      setCaseStatus(response.data);
      toast.success('Case status updated');
    } catch (err) {
      toast.error('Failed to fetch case status');
      console.error(err);
    } finally {
      setStatusLoading(false);
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
              <button
                onClick={fetchCaseStatus}
                disabled={statusLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${statusLoading ? 'animate-spin' : ''}`} />
                Check Status
              </button>
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
                  <dd className="text-sm text-gray-900">{caseData.subject.emailAddress}</dd>
                </div>
              </dl>
            </div>
          </div>

          {caseStatus && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">USCIS Status</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-blue-800">Status</dt>
                    <dd className="text-sm text-blue-900">{caseStatus.status}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-blue-800">Queue Position</dt>
                    <dd className="text-sm text-blue-900">
                      {caseStatus.placeInQueue} of {caseStatus.queueLength}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-blue-800">Estimated Completion</dt>
                    <dd className="text-sm text-blue-900">
                      {caseStatus.estCompletionDate ? 
                        new Date(caseStatus.estCompletionDate).toLocaleDateString() : 
                        'Not available'
                      }
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoiaCaseDetailsPage;
