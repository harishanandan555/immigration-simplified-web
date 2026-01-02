import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useState, useEffect } from 'react';
import NotificationPanel from './NotificationPanel';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile && sidebarOpen) setSidebarOpen(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isMobile={isMobile} 
      />

      {/* Notifications panel */}
      <NotificationPanel 
        isOpen={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
      />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <Header 
          onSidebarOpen={() => setSidebarOpen(true)} 
          onNotificationsOpen={() => setNotificationsOpen(!notificationsOpen)} 
        />
        
        {/* Body */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none py-6">
          <div className="px-4 sm:px-6 lg:px-8 pb-24">
        {/* <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div> */}
            <Outlet />
          </div>
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Layout;