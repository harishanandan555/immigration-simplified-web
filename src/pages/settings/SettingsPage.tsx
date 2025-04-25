import { useState } from 'react';
import {
  Bell,
  Lock,
  User,
  Building,
  Mail,
  Globe,
  CreditCard,
  Save,
  ChevronRight,
  Users,
  Shield,
  Database,
  FileText,
  Settings,
  Activity,
  Plus,
  X,
  UserPlus,
  Trash2,
  Edit,
  BarChart,
  Briefcase,
  FileCheck,
  Key,
  Server,
  Zap,
  MessageSquare,
  HardDrive,
  Cloud,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../controllers/AuthControllers';

const SettingsPage = () => {
  const { isAdmin, isAttorney } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedItemToDelete, setSelectedItemToDelete] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const navigationItems = [
    { id: 'profile', name: 'Profile', icon: User, adminOnly: false },
    { id: 'organization', name: 'Organization', icon: Building, adminOnly: false },
    { id: 'notifications', name: 'Notifications', icon: Bell, adminOnly: false },
    { id: 'security', name: 'Security', icon: Lock, adminOnly: false },
    { id: 'email', name: 'Email', icon: Mail, adminOnly: false },
    { id: 'integrations', name: 'Integrations', icon: Globe, adminOnly: false },
    { id: 'billing', name: 'Billing', icon: CreditCard, adminOnly: false },
    { id: 'users', name: 'User Management', icon: Users, adminOnly: false, attorneyAllowed: true },
    { id: 'cases', name: 'Case Settings', icon: Briefcase, adminOnly: false, attorneyAllowed: true },
    { id: 'forms', name: 'Form Templates', icon: FileText, adminOnly: false, attorneyAllowed: true },
    { id: 'reports', name: 'Report Settings', icon: BarChart, adminOnly: false, attorneyAllowed: true },
    { id: 'roles', name: 'Roles & Permissions', icon: Shield, adminOnly: true },
    { id: 'database', name: 'Database Settings', icon: Database, adminOnly: true },
    { id: 'system', name: 'System Settings', icon: Settings, adminOnly: true },
    { id: 'audit', name: 'Audit Logs', icon: Activity, adminOnly: true },
    { id: 'backup', name: 'Backup & Recovery', icon: HardDrive, adminOnly: true },
    { id: 'api', name: 'API Settings', icon: Key, adminOnly: true },
    { id: 'performance', name: 'Performance', icon: Zap, adminOnly: true }
  ];

  const handleDeleteConfirmation = (itemId: string) => {
    setSelectedItemToDelete(itemId);
    setShowDeleteConfirmation(true);
  };

  const handleDelete = async () => {
    // Implement delete logic
    setShowDeleteConfirmation(false);
    setSelectedItemToDelete(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <nav className="space-y-1">
          {navigationItems
            .filter(item => {
              if (isAdmin) return true;
              if (isAttorney) return !item.adminOnly || item.attorneyAllowed;
              return !item.adminOnly && !item.attorneyAllowed;
            })
            .map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === item.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${activeTab === item.id ? 'text-primary-500' : 'text-gray-400'
                    }`}
                />
                <span>{item.name}</span>
                <ChevronRight
                  className={`ml-auto h-5 w-5 ${activeTab === item.id ? 'text-primary-500' : 'text-gray-400'
                    }`}
                />
              </button>
            ))}
        </nav>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow-md rounded-lg">
            {/* Database Settings */}
            {activeTab === 'database' && isAdmin && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Database Settings</h2>

                <div className="space-y-6">
                  {/* Connection Settings */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Connection Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Host</label>
                        <input
                          type="text"
                          className="mt-1 form-input"
                          placeholder="localhost"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Port</label>
                        <input
                          type="number"
                          className="mt-1 form-input"
                          placeholder="5432"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Database Name</label>
                        <input
                          type="text"
                          className="mt-1 form-input"
                          placeholder="immigration_db"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Schema</label>
                        <input
                          type="text"
                          className="mt-1 form-input"
                          placeholder="public"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Backup Settings */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Backup Configuration</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Backup Schedule</label>
                        <select className="mt-1 form-select">
                          <option>Daily</option>
                          <option>Weekly</option>
                          <option>Monthly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Retention Period (days)</label>
                        <input
                          type="number"
                          className="mt-1 form-input"
                          placeholder="30"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="form-checkbox"
                          id="compression"
                        />
                        <label htmlFor="compression" className="ml-2 block text-sm text-gray-700">
                          Enable backup compression
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Performance Settings */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Performance Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Connection Pool Size</label>
                        <input
                          type="number"
                          className="mt-1 form-input"
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Query Timeout (seconds)</label>
                        <input
                          type="number"
                          className="mt-1 form-input"
                          placeholder="30"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="form-checkbox"
                          id="queryCache"
                        />
                        <label htmlFor="queryCache" className="ml-2 block text-sm text-gray-700">
                          Enable query caching
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Maintenance */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Maintenance</h3>
                    <div className="space-y-4">
                      <button className="btn btn-outline flex items-center">
                        <Server className="h-4 w-4 mr-2" />
                        Run Database Vacuum
                      </button>
                      <button className="btn btn-outline flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        Analyze Tables
                      </button>
                      <button className="btn btn-outline flex items-center">
                        <Cloud className="h-4 w-4 mr-2" />
                        Export Schema
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API Settings */}
            {activeTab === 'api' && isAdmin && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">API Settings</h2>

                <div className="space-y-6">
                  {/* API Keys */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">API Keys</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Production Key</p>
                          <p className="text-xs text-gray-500">Last used: 2 hours ago</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="btn btn-outline text-xs py-1">
                            Regenerate
                          </button>
                          <button className="btn btn-outline text-xs py-1">
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Development Key</p>
                          <p className="text-xs text-gray-500">Last used: 5 minutes ago</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="btn btn-outline text-xs py-1">
                            Regenerate
                          </button>
                          <button className="btn btn-outline text-xs py-1">
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rate Limiting */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Rate Limiting</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Requests per minute (per IP)
                        </label>
                        <input
                          type="number"
                          className="mt-1 form-input"
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Burst limit
                        </label>
                        <input
                          type="number"
                          className="mt-1 form-input"
                          placeholder="200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Webhooks */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-medium text-gray-900">Webhooks</h3>
                      <button className="btn btn-outline text-xs py-1">
                        Add Webhook
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Case Updates</p>
                          <p className="text-xs text-gray-500">https://example.com/webhook/cases</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-gray-400 hover:text-gray-500">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Document Events</p>
                          <p className="text-xs text-gray-500">https://example.com/webhook/documents</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-gray-400 hover:text-gray-500">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CORS Settings */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">CORS Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Allowed Origins
                        </label>
                        <textarea
                          className="mt-1 form-input"
                          rows={3}
                          placeholder="https://example.com&#10;https://app.example.com"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          One origin per line
                        </p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="form-checkbox"
                          id="allowCredentials"
                        />
                        <label htmlFor="allowCredentials" className="ml-2 block text-sm text-gray-700">
                          Allow credentials
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Monitoring */}
            {activeTab === 'performance' && isAdmin && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Performance Monitoring</h2>

                <div className="space-y-6">
                  {/* System Resources */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">System Resources</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-500">CPU Usage</p>
                        <p className="text-2xl font-semibold text-gray-900">45%</p>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-primary-500 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Memory Usage</p>
                        <p className="text-2xl font-semibold text-gray-900">2.1 GB</p>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-primary-500 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Storage</p>
                        <p className="text-2xl font-semibold text-gray-900">45.3 GB</p>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-primary-500 rounded-full" style={{ width: '30%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Response Times */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">API Response Times</h3>
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">GET /cases</span>
                          <span className="text-sm text-gray-500">Avg: 120ms</span>
                        </div>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-green-500 rounded-full" style={{ width: '20%' }}></div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">POST /documents</span>
                          <span className="text-sm text-gray-500">Avg: 450ms</span>
                        </div>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-yellow-500 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">GET /forms</span>
                          <span className="text-sm text-gray-500">Avg: 80ms</span>
                        </div>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-green-500 rounded-full" style={{ width: '15%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Error Rates */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Error Rates (Last 24h)</h3>
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">4xx Errors</p>
                            <p className="text-xs text-gray-500">Client-side errors</p>
                          </div>
                          <span className="text-sm font-medium text-yellow-600">2.3%</span>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">5xx Errors</p>
                            <p className="text-xs text-gray-500">Server-side errors</p>
                          </div>
                          <span className="text-sm font-medium text-red-600">0.1%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cache Performance */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Cache Performance</h3>
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Cache Hit Rate</p>
                            <p className="text-xs text-gray-500">Last hour</p>
                          </div>
                          <span className="text-sm font-medium text-green-600">89.5%</span>
                        </div>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-green-500 rounded-full" style={{ width: '89.5%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Users */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Active Users</h3>
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-2xl font-semibold text-gray-900">127</p>
                            <p className="text-sm text-gray-500">Current active users</p>
                          </div>
                          <Users className="h-8 w-8 text-primary-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
              <button
                type="button"
                className="btn btn-primary flex items-center"
                onClick={handleSave}
                disabled={loading}
              >
                <Save size={18} className="mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Confirm Delete
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this item? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteConfirmation(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;