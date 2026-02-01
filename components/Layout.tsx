
import React from 'react';
import { Role, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activeTab, setActiveTab }) => {
  if (!user) return <>{children}</>;

  const isAdmin = user.role === Role.ADMIN || user.role === Role.ADMIN_1 || user.role === Role.ADMIN_2;
  const isApprover = user.role === Role.HOD || user.role === Role.PRINCIPAL;
  const isPrincipal = user.role === Role.PRINCIPAL;

  const tabs = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'apply', name: 'Apply Leave' },
    { id: 'history', name: 'Leave History' },
  ];

  if (isApprover) tabs.push({ id: 'approvals', name: 'Approve Leaves' });
  if (isAdmin) tabs.push({ id: 'admin', name: 'Admin Panel' });
  if (isPrincipal) tabs.push({ id: 'settings', name: 'System Settings' });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/SCOELOGOSQR.jpeg" 
                alt="SCOE Logo" 
                className="h-14 w-14 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
              />
              <div>
                <h1 className="text-lg font-black text-blue-900 leading-tight tracking-tighter">SCOE</h1>
                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Leave Portal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-bold text-gray-900">{user.name}</span>
                <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">{user.role} • {user.department}</span>
              </div>
              <button
                onClick={onLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-bold rounded-xl shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto no-scrollbar" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-white/40 min-h-[60vh]">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-100 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">&copy; {new Date().getFullYear()} Saraswati College of Engineering. Institutional Portal.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
