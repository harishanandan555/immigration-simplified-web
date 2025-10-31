import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Briefcase,
  Users,
  FileText,
  Folder,
  CheckSquare,
  Calendar,
  Settings,
  X,
  BarChart,
  FileSearch,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../controllers/AuthControllers';
import Logo from './Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMobile }) => {
  const location = useLocation();
  const { user, isClient, isAttorney, isParalegal, isSuperAdmin } = useAuth();

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, visible: true },
    // { name: 'Immigration Process', href: '/immigration-process', icon: ClipboardList, visible: true },
    // { name: 'Enhanced Filing', href: '/enhanced-individual-filing', icon: Star, visible: isClient || isSuperAdmin },
    { name: 'Individual Process', href: '/immigration-process/individual', icon: UserCheck, visible: isClient && user?.userType === 'individualUser' },
    { name: 'My Questionnaires', href: '/my-questionnaires', icon: FileText, visible: isClient && user?.userType === 'companyClient' },
    { name: 'Legal Firm Workflow', href: '/legal-firm-workflow', icon: Briefcase, visible: isAttorney },
    { name: 'Questionnaire Responses', href: '/questionnaires/responses', icon: FileText, visible: isAttorney },
    // { name: 'Questionnaire Responses', href: '/questionnaires/responses', icon: FileText, visible: isAttorney || isParalegal || isSuperAdmin },
    { name: 'Cases', href: '/cases', icon: Briefcase, visible: isAttorney || (isClient && user?.userType === 'individualUser') || isSuperAdmin },
    { name: 'FOIA Cases', href: '/foia-cases', icon: FileSearch, visible: isAttorney || (isClient && user?.userType === 'individualUser') || isSuperAdmin },
    { name: 'Case Status Tracker', href: '/foia-tracker', icon: FileSearch, visible: isAttorney || (isClient && user?.userType === 'individualUser') || isSuperAdmin },
    { name: 'Clients', href: '/clients', icon: Users, visible: !isClient || isSuperAdmin },
    // { name: 'Forms', href: '/forms', icon: FileText, visible: true },
    { name: 'Documents', href: '/documents', icon: Folder, visible: true },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare, visible: !isClient || isSuperAdmin },
    { name: 'Calendar', href: '/calendar', icon: Calendar, visible: !(isClient && user?.userType === 'individualUser') },
    { name: 'Reports', href: '/reports', icon: BarChart, visible: isAttorney || isParalegal || isSuperAdmin },
    { name: 'Settings', href: '/settings', icon: Settings, visible: isAttorney || isParalegal || isSuperAdmin }
  ];

  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`${isMobile ? 'fixed inset-0 flex z-40 transition-all transform duration-300 ease-in-out' : 'hidden lg:flex lg:flex-shrink-0'} ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : ''
      }`}>
      <div className="flex h-full flex-col w-64 bg-white border-r border-gray-200">
        
        {isMobile && (
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Logo */}
        <div className="flex-shrink-0 px-4 py-4">
          <Link to="/" className="flex items-center">
            <Logo className="h-8 w-auto" />
            <span className="ml-2 text-lg font-semibold text-primary-800 whitespace-nowrap">Immigration-Simplified</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-4 space-y-1">
            {navigationItems
              .filter(item => item.visible)
              .map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${isActive(item.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  onClick={isMobile ? onClose : undefined}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive(item.href) ? 'text-primary-500' : 'text-gray-400'
                      }`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              ))}
          </nav>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="text-xs text-gray-500">
                <strong className="block font-medium text-gray-700">Immigration-Simplified v0.1.0</strong>
                <span>© 2025 Efile legal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;