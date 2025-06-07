import React, { useState, useEffect } from 'react';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface ClientCreationProps {
  onUpdate: (data: { clientId: string }) => void;
  data: {
    clientId: string;
  };
}

const ClientCreation: React.FC<ClientCreationProps> = ({ onUpdate, data }) => {
  const [selectedClient, setSelectedClient] = useState<string>(data.clientId);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      // TODO: Replace with actual API call
      const mockClients: Client[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1 (555) 123-4567',
          dateOfBirth: '1990-01-01',
          nationality: 'Canadian',
          address: {
            street: '123 Main St',
            city: 'Toronto',
            state: 'ON',
            zipCode: 'M5V 2H1',
            country: 'Canada'
          }
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+1 (555) 987-6543',
          dateOfBirth: '1985-05-15',
          nationality: 'British',
          address: {
            street: '456 Oak Ave',
            city: 'London',
            state: 'Greater London',
            zipCode: 'SW1A 1AA',
            country: 'United Kingdom'
          }
        }
      ];
      setClients(mockClients);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to load clients. Please try again.');
      setLoading(false);
    }
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId);
    onUpdate({ clientId });
  };

  const handleNewClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Replace with actual API call
      const newClientId = '3'; // Mock response
      setClients([...clients, { ...newClient, id: newClientId } as Client]);
      setSelectedClient(newClientId);
      onUpdate({ clientId: newClientId });
      setShowNewClientForm(false);
      setNewClient({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        nationality: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      });
    } catch (error) {
      console.error('Error creating client:', error);
      setError('Failed to create client. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setNewClient(prev => ({
        ...prev,
        address: {
          ...prev.address!,
          [addressField]: value
        }
      }));
    } else {
      setNewClient(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-neutral-800 mb-6">
        Select or Create Client
      </h2>

      {!showNewClientForm ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-neutral-700">
              Existing Clients
            </h3>
            <button
              onClick={() => setShowNewClientForm(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Create New Client
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map(client => (
              <div
                key={client.id}
                className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                  selectedClient === client.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-neutral-200 hover:border-primary-400'
                }`}
                onClick={() => handleClientSelect(client.id)}
              >
                <h4 className="text-sm font-medium text-neutral-800">
                  {client.firstName} {client.lastName}
                </h4>
                <p className="mt-1 text-sm text-neutral-500">
                  {client.email}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {client.phone}
                </p>
                <div className="mt-2 text-xs text-neutral-600">
                  <p>{client.address.street}</p>
                  <p>
                    {client.address.city}, {client.address.state} {client.address.zipCode}
                  </p>
                  <p>{client.address.country}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-neutral-700">
              Create New Client
            </h3>
            <button
              onClick={() => setShowNewClientForm(false)}
              className="text-neutral-600 hover:text-neutral-800"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleNewClientSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={newClient.firstName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={newClient.lastName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={newClient.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={newClient.phone}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={newClient.dateOfBirth}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Nationality
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={newClient.nationality}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-4">
              <h4 className="text-sm font-medium text-neutral-700 mb-4">
                Address Information
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address.street"
                    value={newClient.address?.street}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">
                      City
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={newClient.address?.city}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">
                      State/Province
                    </label>
                    <input
                      type="text"
                      name="address.state"
                      value={newClient.address?.state}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">
                      ZIP/Postal Code
                    </label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={newClient.address?.zipCode}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">
                    Country
                  </label>
                  <input
                    type="text"
                    name="address.country"
                    value={newClient.address?.country}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Create Client
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ClientCreation; 