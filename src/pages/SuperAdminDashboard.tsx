import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  UserCheck, 
  UserCog, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Search,
  Download
} from 'lucide-react';
import { useAuth } from '../controllers/AuthControllers';
import { getAllCompaniesList, getCompanyUsers, Company } from '../controllers/CompanyControllers';
import { getCompanyClients } from '../controllers/ClientControllers';

interface CompanyWithStats extends Company {
  attorneys: any[];
  paralegals: any[];
  clients: any[];
  totalUsers: number;
  totalClients: number;
}

interface AttorneyWithClients {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: string;
  clients: any[];
  clientCount: number;
}

const SuperAdminDashboard = () => {
  const { user, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [expandedAttorneys, setExpandedAttorneys] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'attorney' | 'paralegal'>('all');
  
  // Statistics
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalAttorneys: 0,
    totalParalegals: 0,
    totalClients: 0,
    activeCompanies: 0
  });

  useEffect(() => {
    if (isSuperAdmin && user?._id) {
      loadDashboardData();
    }
  }, [isSuperAdmin, user]);

  const loadDashboardData = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    try {
      console.log('🔄 Loading superadmin dashboard data...');
      
      // Fetch all companies
      const companiesResponse = await getAllCompaniesList(user._id);
      const companiesList = companiesResponse.data || [];
      

      // For each company, fetch users and clients
      const companiesWithStats: CompanyWithStats[] = await Promise.all(
        companiesList.map(async (company: any) => {
          try {
            console.log(`🔍 Processing company: ${company.name}`, company);
            
            // Fetch company users (attorneys and paralegals)
            const usersResponse = await getCompanyUsers(company._id);
            console.log(`👥 Users response for ${company.name}:`, usersResponse);
            
            const users = usersResponse.data || [];
            
            // Separate attorneys and paralegals
            const attorneys = users.filter((u: any) => u.role === 'attorney');
            const paralegals = users.filter((u: any) => u.role === 'paralegal');
            
            console.log(`👨‍💼 Found ${attorneys.length} attorneys and ${paralegals.length} paralegals`);
            
            // Fetch company clients
            let clients: any[] = [];
            try {
              const clientsResponse = await getCompanyClients({ });
              console.log('📋 All clients response:', clientsResponse);
              
              // Filter clients by company - handle both string and object companyId
              clients = (clientsResponse.clients || []).filter((c: any) => {
                const clientCompanyId = typeof c.companyId === 'object' 
                  ? (c.companyId?._id || c.companyId?.id)
                  : c.companyId;
                
                return clientCompanyId === company._id || clientCompanyId === company.id;
              });
              
              console.log(`👥 Found ${clients.length} clients for company ${company.name}`);
            } catch (error) {
              console.warn(`Could not fetch clients for company ${company.name}:`, error);
            }

            // For each attorney, assign their clients
            const attorneysWithClients = attorneys.map((attorney: any) => {
              // Filter clients assigned to this attorney - handle both string array and object array
              const attorneyClients = clients.filter((client: any) => {
                if (!client.attorneyIds) return false;
                
                // Check if attorneyIds is an array of objects or strings
                return client.attorneyIds.some((attId: any) => {
                  const attorneyIdToMatch = typeof attId === 'object' 
                    ? (attId._id || attId.id) 
                    : attId;
                  return attorneyIdToMatch === attorney._id || attorneyIdToMatch === attorney.id;
                });
              });
              
              console.log(`👨‍💼 Attorney ${attorney.firstName} ${attorney.lastName} has ${attorneyClients.length} clients`);
              
              return {
                ...attorney,
                clients: attorneyClients,
                clientCount: attorneyClients.length
              };
            });

            // For each paralegal, assign their clients
            const paralegalsWithClients = paralegals.map((paralegal: any) => {
              // Filter clients assigned to this paralegal - handle both string array and object array
              const paralegalClients = clients.filter((client: any) => {
                if (!client.attorneyIds) return false;
                
                // Check if attorneyIds is an array of objects or strings
                return client.attorneyIds.some((attId: any) => {
                  const paralegalIdToMatch = typeof attId === 'object' 
                    ? (attId._id || attId.id) 
                    : attId;
                  return paralegalIdToMatch === paralegal._id || paralegalIdToMatch === paralegal.id;
                });
              });
              
              console.log(`👔 Paralegal ${paralegal.firstName} ${paralegal.lastName} has ${paralegalClients.length} clients`);
              
              return {
                ...paralegal,
                clients: paralegalClients,
                clientCount: paralegalClients.length
              };
            });

            return {
              ...company,
              attorneys: attorneysWithClients,
              paralegals: paralegalsWithClients,
              clients,
              totalUsers: company.userCount || users.length,
              // Calculate total clients from attorneys and paralegals
              totalClients: attorneysWithClients.reduce((sum: number, att: any) => sum + att.clientCount, 0) +
                           paralegalsWithClients.reduce((sum: number, para: any) => sum + para.clientCount, 0)
            };
          } catch (error) {
            console.error(`Error loading data for company ${company.name}:`, error);
            return {
              ...company,
              attorneys: [],
              paralegals: [],
              clients: [],
              totalUsers: 0,
              totalClients: 0
            };
          }
        })
      );

      setCompanies(companiesWithStats);

      // Calculate statistics - only count clients assigned to attorneys/paralegals
      const totalStats = companiesWithStats.reduce(
        (acc, company) => {
          // Count only clients that are assigned to attorneys or paralegals
          const assignedClientsCount = company.attorneys.reduce((sum: number, att: any) => sum + att.clientCount, 0) +
                                      company.paralegals.reduce((sum: number, para: any) => sum + para.clientCount, 0);
          
          return {
            totalCompanies: acc.totalCompanies + 1,
            totalAttorneys: acc.totalAttorneys + company.attorneys.length,
            totalParalegals: acc.totalParalegals + company.paralegals.length,
            totalClients: acc.totalClients + assignedClientsCount,
            activeCompanies: acc.activeCompanies + (company.status === 'Active' ? 1 : 0)
          };
        },
        {
          totalCompanies: 0,
          totalAttorneys: 0,
          totalParalegals: 0,
          totalClients: 0,
          activeCompanies: 0
        }
      );

      setStats(totalStats);
      console.log('✅ Dashboard data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompany = (companyId: string) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedCompanies(newExpanded);
  };

  const toggleAttorneyClients = (attorneyId: string) => {
    const newExpanded = new Set(expandedAttorneys);
    if (newExpanded.has(attorneyId)) {
      newExpanded.delete(attorneyId);
    } else {
      newExpanded.add(attorneyId);
    }
    setExpandedAttorneys(newExpanded);
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const exportData = () => {
    // Create CSV data
    const csvData = [];
    csvData.push(['Company Name', 'Company Email', 'Status', 'User Type', 'User Name', 'User Email', 'Client Count']);
    
    companies.forEach(company => {
      company.attorneys.forEach((attorney: AttorneyWithClients) => {
        csvData.push([
          company.name,
          company.email,
          company.status,
          'Attorney',
          `${attorney.firstName} ${attorney.lastName}`,
          attorney.email,
          attorney.clientCount.toString()
        ]);
      });
      
      company.paralegals.forEach((paralegal: AttorneyWithClients) => {
        csvData.push([
          company.name,
          company.email,
          company.status,
          'Paralegal',
          `${paralegal.firstName} ${paralegal.lastName}`,
          paralegal.email,
          paralegal.clientCount.toString()
        ]);
      });
    });

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `superadmin-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage and monitor all companies, attorneys, and clients</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Companies</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCompanies}</p>
                <p className="text-xs text-green-600 mt-1">{stats.activeCompanies} active</p>
              </div>
              <Building2 className="h-12 w-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Attorneys</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalAttorneys}</p>
              </div>
              <UserCheck className="h-12 w-12 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Paralegals</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalParalegals}</p>
              </div>
              <UserCog className="h-12 w-12 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
              </div>
              <Users className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Clients/Attorney</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalAttorneys > 0 ? Math.round(stats.totalClients / stats.totalAttorneys) : 0}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilterRole('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterRole === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterRole('attorney')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterRole === 'attorney'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Attorneys
              </button>
              <button
                onClick={() => setFilterRole('paralegal')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterRole === 'paralegal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Paralegals
              </button>
              
              <button
                onClick={exportData}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        )}

        {/* Companies List */}
        {!loading && (
          <div className="space-y-4">
            {filteredCompanies.map((company) => (
              <div key={company._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Company Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleCompany(company._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Building2 className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{company.name}</h3>
                        <p className="text-sm text-gray-600">{company.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-4 w-4 text-indigo-500" />
                            <span className="font-medium">{company.attorneys.length}</span>
                            <span className="text-gray-500">Attorneys</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <UserCog className="h-4 w-4 text-purple-500" />
                            <span className="font-medium">{company.paralegals.length}</span>
                            <span className="text-gray-500">Paralegals</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-green-500" />
                            <span className="font-medium">{company.totalClients}</span>
                            <span className="text-gray-500">Clients</span>
                          </div>
                        </div>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            company.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {company.status}
                          </span>
                        </div>
                      </div>
                      
                      {expandedCompanies.has(company._id) ? (
                        <ChevronUp className="h-6 w-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedCompanies.has(company._id) && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    {/* Attorneys Section */}
                    {(filterRole === 'all' || filterRole === 'attorney') && company.attorneys.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <UserCheck className="h-6 w-6 text-indigo-600" />
                          Attorneys ({company.attorneys.length})
                        </h4>
                        <div className="space-y-4">
                          {company.attorneys.map((attorney: AttorneyWithClients) => (
                            <div key={attorney._id} className="bg-gradient-to-r from-indigo-50 to-white rounded-xl p-5 border-2 border-indigo-100 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg flex-shrink-0">
                                    {attorney.firstName?.[0]}{attorney.lastName?.[0]}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <p className="font-bold text-gray-900 text-lg">
                                        {attorney.firstName} {attorney.lastName}
                                      </p>
                                      <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                                        Attorney
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 flex items-center gap-1 truncate">
                                      <span>📧</span> {attorney.email}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                  <div className="text-right bg-green-50 rounded-lg px-4 py-2 border border-green-200">
                                    <div className="flex items-center gap-2 text-green-700">
                                      <Users className="h-5 w-5" />
                                      <span className="font-bold text-2xl">{attorney.clientCount}</span>
                                    </div>
                                    <p className="text-xs text-green-600 font-medium">Clients</p>
                                  </div>
                                  
                                
                                </div>
                              </div>
                              
                            
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Paralegals Section */}
                    {(filterRole === 'all' || filterRole === 'paralegal') && company.paralegals.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <UserCog className="h-6 w-6 text-purple-600" />
                          Paralegals ({company.paralegals.length})
                        </h4>
                        <div className="space-y-4">
                          {company.paralegals.map((paralegal: AttorneyWithClients) => (
                            <div key={paralegal._id} className="bg-gradient-to-r from-purple-50 to-white rounded-xl p-5 border-2 border-purple-100 hover:border-purple-300 transition-all shadow-sm hover:shadow-md">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg flex-shrink-0">
                                    {paralegal.firstName?.[0]}{paralegal.lastName?.[0]}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <p className="font-bold text-gray-900 text-lg">
                                        {paralegal.firstName} {paralegal.lastName}
                                      </p>
                                      <span className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                                        Paralegal
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 flex items-center gap-1 truncate">
                                      <span>📧</span> {paralegal.email}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                  <div className="text-right bg-green-50 rounded-lg px-4 py-2 border border-green-200">
                                    <div className="flex items-center gap-2 text-green-700">
                                      <Users className="h-5 w-5" />
                                      <span className="font-bold text-2xl">{paralegal.clientCount}</span>
                                    </div>
                                    <p className="text-xs text-green-600 font-medium">Clients</p>
                                  </div>
                                  
                                  {paralegal.clientCount > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleAttorneyClients(`paralegal-${paralegal._id}`);
                                      }}
                                      className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                                    >
                                      {expandedAttorneys.has(`paralegal-${paralegal._id}`) ? (
                                        <ChevronUp className="h-5 w-5 text-purple-600" />
                                      ) : (
                                        <ChevronDown className="h-5 w-5 text-purple-600" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Collapsible Clients List */}
                              {paralegal.clientCount > 0 && expandedAttorneys.has(`paralegal-${paralegal._id}`) && (
                                <div className="mt-4 pt-4 border-t-2 border-purple-100">
                                  <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs">
                                        {paralegal.clientCount} Clients
                                      </span>
                                    </p>
                                  </div>
                                  
                                  {/* Scrollable client list for large numbers */}
                                  <div className={`${paralegal.clientCount > 6 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {paralegal.clients.map((client: any) => (
                                        <div key={client._id} className="bg-white rounded-lg p-3 border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all">
                                          <p className="font-semibold text-gray-900 mb-1 truncate">
                                            {client.firstName} {client.lastName}
                                          </p>
                                          <p className="text-xs text-gray-600 flex items-center gap-1 truncate">
                                            <span>✉️</span>
                                            <span className="truncate">{client.email}</span>
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {/* Show "View More" message if many clients */}
                                  {paralegal.clientCount > 6 && (
                                    <p className="text-xs text-gray-500 mt-2 text-center italic">
                                      Scroll to view all {paralegal.clientCount} clients
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {company.attorneys.length === 0 && company.paralegals.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No attorneys or paralegals in this company yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Empty State */}
            {filteredCompanies.length === 0 && !loading && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
                <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search terms.' : 'No companies have been created yet.'}
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default SuperAdminDashboard;
