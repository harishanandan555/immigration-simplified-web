import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../controllers/AuthControllers';
import { immigrationApi } from '../services/api/immigrationProcess';
import '../styles/ClientListPage.css';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  immigrationStatus: string;
  createdAt: string;
}

const ClientListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      console.log('Fetching clients...');
      const response = await immigrationApi.getClients();
      console.log('Fetched clients:', response);
      setClients(response);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching clients:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          headers: error.config?.headers
        }
      });
      setError('Failed to load clients. Please try again.');
      setLoading(false);
    }
  };

  const handleCreateClient = () => {
    console.log('Navigating to create client page...');
    navigate('/clients/create', { replace: false });
  };

  const handleViewClient = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  if (loading) {
    return (
      <div className="client-list-page">
        <div className="loading-spinner">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="client-list-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Clients</h1>
          <button
            className="create-button"
            onClick={handleCreateClient}
          >
            Create New Client
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="clients-grid">
        {clients.length === 0 ? (
          <div className="no-clients">
            <p>No clients found. Create your first client to get started.</p>
          </div>
        ) : (
          clients.map((client) => (
            <div
              key={client.id}
              className="client-card"
              onClick={() => handleViewClient(client.id)}
            >
              <div className="client-header">
                <h3>{`${client.firstName} ${client.lastName}`}</h3>
                <span className={`status-badge ${client.immigrationStatus}`}>
                  {client.immigrationStatus}
                </span>
              </div>
              <div className="client-details">
                <div className="detail-item">
                  <span className="label">Email:</span>
                  <span className="value">{client.email}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Phone:</span>
                  <span className="value">{client.phone}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Nationality:</span>
                  <span className="value">{client.nationality}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Created:</span>
                  <span className="value">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientListPage; 