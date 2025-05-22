import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getFoiaCaseByCaseId, FoiaCase } from '../../controllers/FoiaCaseControllers';

const FoiaCasesDetailsPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<FoiaCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        const response: any = await getFoiaCaseByCaseId(caseId!);
        setCaseData(response);
      } catch (err) {
        setError('Failed to load FOIA case details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [caseId]);

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          Case not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        onClick={() => navigate('/foia-cases')}
        className="inline-flex items-center mb-6 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Cases
      </button>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">FOIA Case Details</h1>
          <p className="mt-1 text-sm text-gray-500">
            Case ID: {caseData._id}
          </p>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Subject Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Subject Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {caseData.subject.firstName} {caseData.subject.lastName}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Requester Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Requester Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {caseData.requester.firstName} {caseData.requester.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{caseData.requester.emailAddress}</dd>
                </div>
              </dl>
            </div>

            {/* Case Information */}
            <div className="sm:col-span-2">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Case Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {caseData.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(caseData.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Updated Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(caseData.updatedAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Requested Documents */}
            {caseData.recordsRequested && caseData.recordsRequested.length > 0 && (
              <div className="sm:col-span-2">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Requested Documents</h2>
                <div className="space-y-4">
                  {caseData.recordsRequested.map((record, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Document Type</dt>
                          <dd className="mt-1 text-sm text-gray-900">{record.requestedDocumentType}</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoiaCasesDetailsPage; 