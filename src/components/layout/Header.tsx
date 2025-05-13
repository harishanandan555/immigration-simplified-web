import { Bell, Menu, Search, User, LogIn } from 'lucide-react';
import { useAuth } from '../../controllers/AuthControllers';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onSidebarOpen: () => void;
  onNotificationsOpen: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSidebarOpen, onNotificationsOpen }) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-10 bg-white shadow-sm lg:overflow-y-visible">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between h-16">
          <div className="flex items-center px-2 lg:px-0">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
              onClick={onSidebarOpen}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 flex justify-end items-center px-2 lg:ml-6">

            <div className="max-w-lg w-full lg:max-w-xs mr-4">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Search cases, clients, forms..."
                  type="search"
                />
              </div>
            </div>

            {user ? (
              <div className="flex items-center">
                <button
                  type="button"
                  className="flex-shrink-0 bg-white p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-4"
                  onClick={onNotificationsOpen}
                >
                  <span className="sr-only">View notifications</span>
                  <Bell className="h-6 w-6" aria-hidden="true" />
                </button>

                <div className="relative flex-shrink-0" ref={userMenuRef}>
                  <button
                    type="button"
                    className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    {user?.avatar ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium">
                        {user?.firstName?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                      </div>
                    )}
                  </button>

                  {userMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1 rounded-md bg-white shadow-xs">
                        <div className="block px-4 py-2 text-sm text-gray-700">
                          <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                          <p className="text-gray-500">{user?.email}</p>
                        </div>
                        <div className="border-t border-gray-100"></div>
                        <a
                          href="#profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Your Profile
                        </a>
                        <a
                          href="#settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Settings
                        </a>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Login
              </button>
            )}
            
          </div>

        </div>
      </div>
    </header>
  );
};

export { Header as default };