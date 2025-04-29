import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { createClient } from '../../controllers/ClientControllers';

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: Address;
  nationality: string;
  alienNumber: string;
  passportNumber: string;
  entryDate: string;
  visaCategory: string;
  notes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const initialFormData: ClientFormData = {
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  },
  nationality: '',
  alienNumber: '',
  passportNumber: '',
  entryDate: '',
  visaCategory: '',
  notes: '',
  status: 'Active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const ClientFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing) {
      // TODO: Replace with actual API call
      setLoading(false);
    }
  }, [id, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await createClient(formData);
      navigate('/clients');
    } catch (err) {
      setError('Failed to save client. Please try again.');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    try {
      // TODO: Implement delete functionality
      navigate('/clients');
    } catch (err) {
      setError('Failed to delete client. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link to="/clients" className="mr-4 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Edit Client' : 'New Client'}
          </h1>
        </div>
        {isEditing && (
          <button
            onClick={handleDelete}
            className="flex items-center px-4 py-2 text-red-600 hover:text-red-700 font-medium"
          >
            <Trash2 size={18} className="mr-2" />
            Delete Client
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter client's full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                required
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1">
                    Street
                  </label>
                  <input
                    type="text"
                    id="address.street"
                    name="address.street"
                    required
                    value={formData.address.street}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter street address"
                  />
                </div>

                <div>
                  <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="address.city"
                    name="address.city"
                    required
                    value={formData.address.city}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    id="address.state"
                    name="address.state"
                    required
                    value={formData.address.state}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter state"
                  />
                </div>

                <div>
                  <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="address.zipCode"
                    name="address.zipCode"
                    required
                    value={formData.address.zipCode}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter ZIP code"
                  />
                </div>

                <div>
                  <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    id="address.country"
                    name="address.country"
                    required
                    value={formData.address.country}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter country"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
                Nationality
              </label>
              <input
                type="text"
                id="nationality"
                name="nationality"
                required
                value={formData.nationality}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter nationality"
              />
            </div>

            <div>
              <label htmlFor="alienNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Alien Number
              </label>
              <input
                type="text"
                id="alienNumber"
                name="alienNumber"
                required
                value={formData.alienNumber}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter A-Number"
              />
            </div>

            <div>
              <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Passport Number
              </label>
              <input
                type="text"
                id="passportNumber"
                name="passportNumber"
                required
                value={formData.passportNumber}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter passport number"
              />
            </div>

            <div>
              <label htmlFor="entryDate" className="block text-sm font-medium text-gray-700 mb-1">
                Entry Date
              </label>
              <input
                type="date"
                id="entryDate"
                name="entryDate"
                required
                value={formData.entryDate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="visaCategory" className="block text-sm font-medium text-gray-700 mb-1">
                Visa Category
              </label>
              <input
                type="text"
                id="visaCategory"
                name="visaCategory"
                required
                value={formData.visaCategory}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter visa category"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter any additional notes"
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Link
              to="/clients"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <Save size={18} className="mr-2" />
              {saving ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientFormPage;