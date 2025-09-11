import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { createCase } from "../../controllers/CaseControllers";
import { getCompanyClients } from "../../controllers/ClientControllers";

interface CaseFormData {
  title: string;
  caseNumber: string;
  type: string;
  status: string;
  clientId: string;
  assignedTo: string;
  courtLocation: string;
  judge: string;
  description: string;
  openDate: string;
}

const initialFormData: CaseFormData = {
  title: '',
  caseNumber: '',
  type: '',
  status: 'Active',
  clientId: '',
  assignedTo: '',
  courtLocation: '',
  judge: '',
  description: '',
  openDate: new Date().toISOString().split('T')[0]
};

const CaseFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState<CaseFormData>(initialFormData);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isEditing) {
          // TODO: Replace with actual API call to fetch case data
          setLoading(true);
          // Simulate API call to fetch case data
          setTimeout(() => {
            setFormData({
              title: 'Johnson v. Smith',
              caseNumber: 'CV-2023-12345',
              type: 'Civil Litigation',
              status: 'Active',
              clientId: '1',
              assignedTo: 'Sarah Reynolds',
              courtLocation: 'Central District Court',
              judge: 'Hon. Marcus Williams',
              description: 'Personal injury case resulting from automobile accident.',
              openDate: '2023-08-15'
            });
            setLoading(false);
          }, 500);
        }

        // Fetch clients
        const clientData = await getCompanyClients();
        setClients(clientData.clients);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isEditing) {
        // Update existing case
        // await updateCase(id!, formData);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      } else {
        // Create new case
        const caseData = {
          ...formData,
          timeline: [],
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        const response: any = await createCase(caseData);
        
      }
      
      navigate('/cases');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save case. Please try again.');
      setSaving(false);
    }
  };


  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      navigate('/cases');
    } catch (err) {
      setError('Failed to delete case. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link to="/cases" className="mr-4 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Edit Case' : 'New Case'}
          </h1>
        </div>
        {isEditing && (
          <button
            onClick={handleDelete}
            className="flex items-center px-4 py-2 text-red-600 hover:text-red-700 font-medium"
          >
            <Trash2 size={18} className="mr-2" />
            Delete Case
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Case Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter case title"
              />
            </div>

            <div>
              <label htmlFor="caseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Case Number
              </label>
              <input
                type="text"
                id="caseNumber"
                name="caseNumber"
                required
                value={formData.caseNumber}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter case number"
              />
            </div>

            <div>
              <label htmlFor="caseType" className="block text-sm font-medium text-gray-700 mb-1">
                Case Type
              </label>
              <select
                id="caseType"
                name="type"
                required
                value={formData.type}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select case type</option>
                <option value="Civil Litigation">Civil Litigation</option>
                <option value="Criminal Defense">Criminal Defense</option>
                <option value="Family Law">Family Law</option>
                <option value="Immigration">Immigration</option>
                <option value="Corporate">Corporate</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Estate Planning">Estate Planning</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                required
                value={formData.status}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="On Hold">On Hold</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <select
                id="clientId"
                name="clientId"
                required
                value={formData.clientId}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Attorney
              </label>
              <select
                id="assignedTo"
                name="assignedTo"
                required
                value={formData.assignedTo}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select attorney</option>
                <option value="680b5175ecbc650c02d32a22">Sarah Reynolds</option>
                <option value="680b5175ecbc650c02d32a22">Michael Chen</option>
                <option value="680b5175ecbc650c02d32a22">Emily Wilson</option>
              </select>
            </div>

            <div>
              <label htmlFor="courtLocation" className="block text-sm font-medium text-gray-700 mb-1">
                Court Location
              </label>
              <input
                type="text"
                id="courtLocation"
                name="courtLocation"
                value={formData.courtLocation}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter court location"
              />
            </div>

            <div>
              <label htmlFor="judge" className="block text-sm font-medium text-gray-700 mb-1">
                Judge
              </label>
              <input
                type="text"
                id="judge"
                name="judge"
                value={formData.judge}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter judge name"
              />
            </div>

            <div>
              <label htmlFor="openDate" className="block text-sm font-medium text-gray-700 mb-1">
                Open Date
              </label>
              <input
                type="date"
                id="openDate"
                name="openDate"
                required
                value={formData.openDate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter case description"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              to="/cases"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={18} className="mr-2" />
              {saving ? 'Saving...' : 'Save Case'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CaseFormPage;