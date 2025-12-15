import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, Mail, Phone, Building2, Briefcase, CreditCard } from 'lucide-react';
import { getAllCompaniesList, Company } from '../../controllers/CompanyControllers';
import { useAuth } from '../../controllers/AuthControllers';
import { getCurrentSubscription, Subscription } from '../../controllers/BillingControllers';

interface CompanyWithSubscription extends Company {
  subscription?: Subscription;
}

const CompaniesPage = () => {
  const { user, isSuperAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<CompanyWithSubscription[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin || !user?._id) return;

    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await getAllCompaniesList(user._id);

        if (response.data) {
          // Fetch subscription for each company
          const companiesWithSubscriptions = await Promise.all(
            response.data.map(async (company: Company) => {
              try {
                const subscriptionResponse = await getCurrentSubscription(company._id);
                return {
                  ...company,
                  subscription: subscriptionResponse.data || undefined
                } as CompanyWithSubscription;
              } catch (error) {
                console.error(`Error fetching subscription for company ${company._id}:`, error);
                return {
                  ...company,
                  subscription: undefined
                } as CompanyWithSubscription;
              }
            })
          );
          
          setCompanies(companiesWithSubscriptions);
        } else {
          setCompanies([]);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [isSuperAdmin, user?._id]);

  const filteredCompanies = companies.filter(
    (company) =>
      (company.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.address?.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.address?.state || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.licenseNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const getCompanyTypeIcon = (type: string) => {
    switch (type) {
      case 'Law Firm':
        return <Briefcase className="h-4 w-4 text-blue-600" />;
      case 'Immigration Service':
        return <Building2 className="h-4 w-4 text-green-600" />;
      default:
        return <Building2 className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Companies
              </h1>
              <p className="text-sm text-gray-600">Manage and view all registered companies</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/20 p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Companies</p>
                <p className="text-xl font-bold text-gray-900">{companies.length}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/20 p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Law Firms</p>
                <p className="text-xl font-bold text-blue-600">
                  {companies.filter(company => company.type === 'Law Firm').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/20 p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Active Companies</p>
                <p className="text-xl font-bold text-green-600">
                  {companies.filter(company => company.status === 'Active').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/20 p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-xl font-bold text-purple-600">
                  {companies.filter(company => company.subscription?.status === 'active').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/20 p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Users</p>
                <p className="text-xl font-bold text-indigo-600">
                  {companies.reduce((total, company) => {
                    const attorneys = company.users?.attorneys?.length || 0;
                    const paralegals = company.users?.paralegals?.length || 0;
                    const clients = company.users?.clients?.length || 0;
                    return total + attorneys + paralegals + clients;
                  }, 0)}
                </p>
              </div>
              <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <Building2 className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-grow group">
              <input
                type="text"
                placeholder="Search by name, email, phone, type, city, state, or license number..."
                className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 focus:bg-white group-hover:border-gray-300 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" size={16} />
            </div>
            <button className="flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm">
              <Filter size={16} />
              <span className="text-sm font-medium">Filters</span>
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors duration-200">
                      <span>Company Name</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact Information
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors duration-200">
                      <span>Users</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors duration-200">
                      <span>Created</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500 text-sm font-medium">Loading companies...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCompanies.length > 0 ? (
                  filteredCompanies.map((company) => {
                    const totalUsers = (company.users?.attorneys?.length || 0) + 
                                      (company.users?.paralegals?.length || 0) + 
                                      (company.users?.clients?.length || 0);
                    return (
                      <tr key={company._id} className="hover:bg-blue-50/50 transition-all duration-200 group">
                        <td className="px-4 py-3">
                          <div className="flex items-center group-hover:scale-105 transition-transform duration-200">
                            <div className="relative">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                                {company.name?.charAt(0) || '?'}
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-400 border border-white rounded-full"></div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                                {company.name || 'N/A'}
                              </div>
                              {company.website && (
                                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                                  {company.website}
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getCompanyTypeIcon(company.type)}
                            <span className="text-xs font-medium text-gray-700">{company.type || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <div className="p-0.5 bg-blue-100 rounded">
                                <Mail size={10} className="text-blue-600" />
                              </div>
                              <a href={`mailto:${company.email}`} className="hover:text-blue-600 transition-colors duration-200 truncate">
                                {company.email || 'N/A'}
                              </a>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <div className="p-0.5 bg-green-100 rounded">
                                <Phone size={10} className="text-green-600" />
                              </div>
                              <a href={`tel:${company.phone}`} className="hover:text-green-600 transition-colors duration-200">
                                {company.phone || 'N/A'}
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-700">
                            {company.address ? (
                              <>
                                <div className="font-medium">{company.address.city || 'N/A'}</div>
                                <div className="text-gray-500">{company.address.state || ''}</div>
                              </>
                            ) : 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full shadow-sm ${
                            company.status === 'Active'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : company.status === 'Inactive'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {company.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-700">
                            <div className="font-medium">{totalUsers}</div>
                            <div className="text-gray-500 text-xs">
                              {company.users?.attorneys?.length || 0} attorneys, {company.users?.paralegals?.length || 0} paralegals, {company.users?.clients?.length || 0} clients
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {company.subscription ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3 text-blue-600" />
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                  company.subscription.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : company.subscription.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : company.subscription.status === 'expired'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {company.subscription.status?.toUpperCase() || 'N/A'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600">
                                ${company.subscription.amount}/{company.subscription.billingCycle === 'monthly' ? 'mo' : 'yr'}
                              </div>
                              {company.subscription.endDate && (
                                <div className="text-xs text-gray-500">
                                  Expires: {new Date(company.subscription.endDate as any).toLocaleDateString()}
                                </div>
                              )}
                              {company.subscription.autoRenew && (
                                <div className="text-xs text-green-600">Auto-renew</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No subscription</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-600">
                            <div className="font-medium">
                              {company.createdAt 
                                ? new Date(company.createdAt).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  }) 
                                : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {company.createdAt 
                                ? new Date(company.createdAt).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  }) 
                                : ''}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-md">
                          <Building2 className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="space-y-1 text-center">
                          <h3 className="text-lg font-semibold text-gray-900">No companies found</h3>
                          <p className="text-gray-500 text-sm max-w-md">
                            {searchTerm 
                              ? "Try adjusting your search criteria or clear the search to view all companies."
                              : "No companies have been registered yet."
                            }
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Section */}
          {filteredCompanies.length > 0 && (
            <div className="bg-gray-50/50 px-4 py-3 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="text-xs text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredCompanies.length}</span> of{" "}
                  <span className="font-semibold text-gray-900">{companies.length}</span> companies
                  {searchTerm && (
                    <span className="ml-2 text-blue-600">
                      • Filtered by "{searchTerm}"
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompaniesPage;




