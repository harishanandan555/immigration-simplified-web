import { useRef, useEffect } from 'react';
import { X, Bell, ArrowRight } from 'lucide-react';
import { mockNotifications } from '../../utils/mockData';
import { formatDistanceToNow } from 'date-fns';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 overflow-hidden z-50"
      aria-labelledby="notifications-panel"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-md">
            <div ref={panelRef} className="h-full flex flex-col bg-white shadow-xl">
              <div className="px-4 py-6 sm:px-6 bg-primary-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="h-6 w-6 text-white" />
                    <h2 id="slide-over-heading" className="ml-3 text-lg font-medium text-white">
                      Notifications
                    </h2>
                  </div>
                  <div className="ml-3 h-7 flex items-center">
                    <button
                      type="button"
                      className="bg-primary-700 rounded-md text-primary-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close panel</span>
                      <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Notification list */}
              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-200">
                  <div className="py-6 px-4 sm:px-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      New Notifications
                    </h3>
                    <ul className="mt-4 space-y-4">
                      {mockNotifications.filter(n => !n.read).map((notification) => (
                        <li key={notification.id} className="bg-primary-50 p-4 rounded-lg">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                notification.type === 'deadline' ? 'bg-error-100 text-error-600' :
                                notification.type === 'update' ? 'bg-primary-100 text-primary-600' :
                                'bg-secondary-100 text-secondary-600'
                              }`}>
                                {notification.icon}
                              </div>
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="mt-1 text-sm text-gray-500">
                                {notification.message}
                              </p>
                              <div className="mt-2 text-xs text-gray-400">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="py-6 px-4 sm:px-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Earlier
                    </h3>
                    <ul className="mt-4 space-y-4">
                      {mockNotifications.filter(n => n.read).map((notification) => (
                        <li key={notification.id} className="bg-white border border-gray-100 p-4 rounded-lg">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                notification.type === 'deadline' ? 'bg-error-50 text-error-600' :
                                notification.type === 'update' ? 'bg-primary-50 text-primary-600' :
                                'bg-secondary-50 text-secondary-600'
                              }`}>
                                {notification.icon}
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="mt-1 text-sm text-gray-500">
                                {notification.message}
                              </p>
                              <div className="mt-2 text-xs text-gray-400">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* View all button */}
              <div className="flex-shrink-0 border-t border-gray-200 p-4">
                <a
                  href="#view-all"
                  className="flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  View all notifications
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;