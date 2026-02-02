import React, { useState } from 'react';
import { Role, User } from '../types';
import { db } from '../services/databaseService';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onProfileUpdate?: (u: User) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  user,
  onLogout,
  activeTab,
  setActiveTab,
  onProfileUpdate,
}) => {

  /* ✅ Hooks MUST be before any return */
  const [menuOpen, setMenuOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  if (!user) return <>{children}</>;

  const isAdmin =
    user.role === Role.ADMIN ||
    user.role === Role.ADMIN_1 ||
    user.role === Role.ADMIN_2;

  const isApprover =
    user.role === Role.HOD || user.role === Role.PRINCIPAL;

  const isPrincipal = user.role === Role.PRINCIPAL;

  const tabs = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'apply', name: 'Apply Leave' },
    { id: 'history', name: 'Leave History' },
  ];

  if (isApprover) tabs.push({ id: 'approvals', name: 'Approve Leaves' });
  if (isAdmin) tabs.push({ id: 'admin', name: 'Admin Panel' });
  if (isPrincipal) tabs.push({ id: 'settings', name: 'System Settings' });

  const handleSaveProfile = async () => {
    let updated: User = { ...user };

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      updated.password = newPassword;
    }

    if (avatarFile) {
      const reader = new FileReader();
      reader.onload = async () => {
        updated.avatarUrl = reader.result as string;
        await db.saveUser(updated);
        onProfileUpdate?.(updated);
        setMenuOpen(false);
        alert('Profile updated');
      };
      reader.readAsDataURL(avatarFile);
      return;
    }

    await db.saveUser(updated);
    onProfileUpdate?.(updated);
    setMenuOpen(false);
    alert('Profile updated');
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* SCOE Logo */}
      <img
        src="/SCOELOGOSQR.jpeg"
        alt="SCOE Logo"
        className="fixed top-4 left-4 max-w-xs rounded-lg shadow-xl z-30"
      />

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Left */}
            <div className="flex items-center space-x-3">
              <div className="bg-blue-900 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-black text-blue-900">SCOE</h1>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  Leave Portal
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex flex-col items-end">
                <div className="flex items-center space-x-3">
                  <img
                    src={user.avatarUrl || '/SCOELOGOSQR.jpeg'}
                    alt="avatar"
                    className="h-10 w-10 rounded-full object-cover cursor-pointer"
                    onClick={() => setMenuOpen(!menuOpen)}
                  />
                  <div className="text-right">
                    <div className="text-sm font-bold">{user.name}</div>
                    <div className="text-[10px] text-blue-700 font-bold uppercase">
                      {user.role} • {user.department}
                    </div>
                  </div>
                </div>

                {menuOpen && (
                  <div className="mt-2 bg-white rounded-xl p-4 shadow-lg w-72">
                    <input type="file" accept="image/*"
                      onChange={e => setAvatarFile(e.target.files?.[0] || null)}
                    />
                    <input type="password" placeholder="New password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full mt-2 border px-2 py-1"
                    />
                    <input type="password" placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full mt-2 border px-2 py-1"
                    />
                    <div className="flex justify-end mt-2 space-x-2">
                      <button onClick={() => setMenuOpen(false)}>Cancel</button>
                      <button onClick={handleSaveProfile} className="bg-blue-900 text-white px-3 py-1 rounded">
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={onLogout}
                className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-red-600"
              >
                Logout
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b bg-white sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 text-xs font-bold uppercase ${
                  activeTab === tab.id ? 'text-blue-900 border-b-2 border-blue-900' : 'text-gray-400'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto p-6 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-6">
        © {new Date().getFullYear()} Saraswati College of Engineering
      </footer>
    </div>
  );
};

export default Layout;
