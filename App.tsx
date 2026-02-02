
import React, { useState, useEffect } from 'react';
import { db } from './services/databaseService';
import { User, Role, Department, LeaveRequest, LeaveStatus, LeaveQuotas, ApproverRole } from './types';
import { DEFAULT_QUOTAS, ROLES, DEPARTMENTS } from './constants';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import LeaveForm from './components/LeaveForm';
import ApprovalPanel from './components/ApprovalPanel';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [adminAccessCode, setAdminAccessCode] = useState('SCOE2024');
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showSignup, setShowSignup] = useState(false);
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    role: Role.TEACHING_STAFF,
    department: Department.COMPS,
    dateOfJoining: '',
    approverRole: ApproverRole.HOD,
    approverId: '',
  });
  const [adminCodeInput, setAdminCodeInput] = useState('');

  // Initial Sync with Global Database
  useEffect(() => {
    const syncWithDB = async () => {
      setIsLoading(true);
      try {
        const [u, r, c] = await Promise.all([
          db.getUsers(),
          db.getLeaveRequests(),
          db.getAccessCode()
        ]);
        setUsers(u);
        setLeaveRequests(r);
        setAdminAccessCode(c);
      } catch (err) {
        console.error("DB Sync Failed", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only sync with Firebase if explicitly enabled
    if (import.meta.env.VITE_ENABLE_FIREBASE_SYNC === 'true') {
      syncWithDB();
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => 
      u.email.toLowerCase() === loginForm.email.toLowerCase() && 
      u.password === loginForm.password
    );
    
    if (user) {
      setCurrentUser(user);
      setLoginForm({ email: '', password: '' });
    } else {
      alert('Invalid credentials. Check email/password.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAdminRole = signupForm.role === Role.ADMIN_1 || signupForm.role === Role.ADMIN_2 || signupForm.role === Role.ADMIN;
    if (isAdminRole && adminCodeInput !== adminAccessCode) {
      alert('Invalid Admin Access Code.');
      return;
    }

    if (users.find(u => u.email.toLowerCase() === signupForm.email.toLowerCase())) {
      alert('Email already registered.');
      return;
    }

    const newUser: User = {
      ...signupForm,
      id: Math.random().toString(36).substr(2, 9),
      quotas: { ...DEFAULT_QUOTAS }
    };

    setIsLoading(true);
    await db.saveUser(newUser);
    const updatedUsers = await db.getUsers();
    setUsers(updatedUsers);
    setCurrentUser(newUser);
    setShowSignup(false);
    setAdminCodeInput('');
    setIsLoading(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleApplyLeave = async (request: Omit<LeaveRequest, 'id' | 'appliedDate' | 'status' | 'userName' | 'department'>) => {
    if (!currentUser) return;
    
    // Calculate number of days
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    const daysRequested = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Extract leave type key (e.g., "CL" from "Casual Leave (CL)")
    const typeKey = request.type.split(' ')[0] as keyof LeaveQuotas;
    
    // Check if user has enough quota
    if (currentUser.quotas[typeKey] < daysRequested) {
      alert(`Insufficient ${request.type} balance. You have ${currentUser.quotas[typeKey]} days available.`);
      return;
    }
    
    // Determine designated approver
    const principalUser = users.find(u => u.role === Role.PRINCIPAL);
    const isAdminRole = currentUser.role === Role.ADMIN || currentUser.role === Role.ADMIN_1 || currentUser.role === Role.ADMIN_2;
    const designatedApproverId = isAdminRole ? (principalUser?.id || '') : (currentUser.approverId || '');

    // Only Principal's own leaves are auto-approved
    const shouldAutoApprove = currentUser.role === Role.PRINCIPAL;

    const newRequest: LeaveRequest = {
      ...request,
      id: Math.random().toString(36).substr(2, 9),
      userName: currentUser.name,
      department: currentUser.department,
      status: shouldAutoApprove ? LeaveStatus.APPROVED : LeaveStatus.PENDING,
      appliedDate: new Date().toISOString().split('T')[0],
      approverId: designatedApproverId
    };

    setIsLoading(true);
    await db.applyLeave(newRequest);

    if (shouldAutoApprove) {
      // Deduct quotas immediately for Principal
      const updatedQuotas = {
        ...currentUser.quotas,
        [typeKey]: Math.max(0, currentUser.quotas[typeKey] - daysRequested)
      };
      await db.updateQuotas(currentUser.id, updatedQuotas);
      setCurrentUser({ ...currentUser, quotas: updatedQuotas });
      alert(`Leave approved! ${daysRequested} days deducted from your ${request.type} balance.`);
    } else {
      alert(`Leave submitted for approval. Pending until reviewed.`);
    }

    const [updatedRequests, updatedUsers] = await Promise.all([
      db.getLeaveRequests(),
      db.getUsers()
    ]);
    setLeaveRequests(updatedRequests);
    setUsers(updatedUsers);
    
    setIsLoading(false);
    setActiveTab('history');
  };

  const handleLeaveAction = async (requestId: string, status: LeaveStatus) => {
    setIsLoading(true);
    await db.updateLeaveStatus(requestId, status);
    const [u, r] = await Promise.all([db.getUsers(), db.getLeaveRequests()]);
    setUsers(u);
    setLeaveRequests(r);
    setIsLoading(false);
  };

  const handleAddStaff = async (userData: Omit<User, 'id'>) => {
    setIsLoading(true);
    const newUser: User = { ...userData, id: Math.random().toString(36).substr(2, 9) };
    await db.saveUser(newUser);
    const updatedUsers = await db.getUsers();
    setUsers(updatedUsers);
    setIsLoading(false);
  };

  const handleDeleteStaff = async (userId: string) => {
    if (confirm('Permanently delete this account?')) {
      setIsLoading(true);
      await db.deleteUser(userId);
      const [u, r] = await Promise.all([db.getUsers(), db.getLeaveRequests()]);
      setUsers(u);
      setLeaveRequests(r);
      setIsLoading(false);
    }
  };

  const handleUpdateQuotas = async (userId: string, newQuotas: LeaveQuotas) => {
    setIsLoading(true);
    await db.updateQuotas(userId, newQuotas);
    const updatedUsers = await db.getUsers();
    setUsers(updatedUsers);
    setIsLoading(false);
  };

  const handleUpdateAccessCode = async (newCode: string) => {
    setIsLoading(true);
    await db.setAccessCode(newCode);
    setAdminAccessCode(newCode);
    setIsLoading(false);
    alert('Admin Access Code updated successfully!');
  };

  if (!currentUser) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/SCOEBG.jpeg)',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* SCOE Logo */}
        <img 
          src="/SCOELOGOSQR.jpeg" 
          alt="SCOE Logo" 
          className="fixed top-4 left-4 w-auto h-auto max-w-xs object-contain rounded-lg shadow-xl z-30 hover:shadow-2xl transition-shadow"
        />
        
        {isLoading && (
          <div className="fixed inset-0 bg-blue-900/10 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-900 border-t-transparent"></div>
              <span className="text-xs font-black text-blue-900 uppercase tracking-widest">Accessing Global DB...</span>
            </div>
          </div>
        )}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-white/50">
          <div className="p-8 border-b border-gray-100 text-center relative overflow-hidden bg-blue-900">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <h1 className="text-2xl font-black text-white tracking-tight">SCOE PORTAL</h1>
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Saraswati College of Engineering</p>
          </div>

          <div className="p-8">
            {!showSignup ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <input
                  type="email" required
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 outline-none text-sm font-semibold"
                  placeholder="Official Email"
                  value={loginForm.email}
                  onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                />
                <input
                  type="password" required
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 outline-none text-sm font-semibold"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                />
                <button type="submit" className="w-full bg-blue-900 text-white font-black py-4 rounded-2xl hover:bg-blue-800 transition-all shadow-xl text-sm uppercase tracking-widest">
                  Secure Login
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => setShowSignup(true)} className="text-xs text-blue-900 font-bold hover:underline">Register New Staff Account</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <input
                  type="text" required
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none text-sm font-semibold"
                  placeholder="Full Name"
                  value={signupForm.name}
                  onChange={e => setSignupForm({...signupForm, name: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold"
                    value={signupForm.role}
                    onChange={e => setSignupForm({...signupForm, role: e.target.value as Role})}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold"
                    value={signupForm.department}
                    onChange={e => setSignupForm({...signupForm, department: e.target.value as Department})}
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                {signupForm.role !== Role.ADMIN && signupForm.role !== Role.ADMIN_1 && signupForm.role !== Role.ADMIN_2 && signupForm.role !== Role.PRINCIPAL && (
                  <>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-sm font-semibold"
                      value={signupForm.approverRole}
                      onChange={e => setSignupForm({...signupForm, approverRole: e.target.value as ApproverRole})}
                    >
                      <option value={ApproverRole.HOD}>{ApproverRole.HOD} - Your leaves will be approved by HOD</option>
                      <option value={ApproverRole.PRINCIPAL}>{ApproverRole.PRINCIPAL} - Your leaves will be approved by Principal</option>
                      <option value={ApproverRole.ADMIN}>{ApproverRole.ADMIN} - Your leaves will be approved by Admin</option>
                    </select>
                    
                  </>
                )}
                {(signupForm.role === Role.ADMIN_1 || signupForm.role === Role.ADMIN_2 || signupForm.role === Role.ADMIN) && (
                  <input
                    type="password" required
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 outline-none text-sm font-black text-amber-900"
                    placeholder="ADMIN ACCESS CODE"
                    value={adminCodeInput}
                    onChange={e => setAdminCodeInput(e.target.value)}
                  />
                )}
                <input
                  type="email" required
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none text-sm font-semibold"
                  placeholder="Official Email"
                  value={signupForm.email}
                  onChange={e => setSignupForm({...signupForm, email: e.target.value})}
                />
                <input
                  type="password" required
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none text-sm font-semibold"
                  placeholder="Choose Password"
                  value={signupForm.password}
                  onChange={e => setSignupForm({...signupForm, password: e.target.value})}
                />
                <button type="submit" className="w-full bg-blue-900 text-white font-black py-4 rounded-xl shadow-lg uppercase text-xs tracking-widest">
                  Join System
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => setShowSignup(false)} className="text-[10px] text-gray-400 font-bold uppercase hover:text-blue-900">Back to Login</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={currentUser} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab} onProfileUpdate={(u) => setCurrentUser(u)}>
      {isLoading && (
        <div className="fixed top-20 right-8 z-50 animate-in fade-in slide-in-from-right-4">
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-blue-100 flex items-center space-x-2">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-900 border-t-transparent"></div>
            <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">DB Sync</span>
          </div>
        </div>
      )}
      <div className="transition-all duration-300">
        {activeTab === 'dashboard' && <Dashboard user={currentUser} requests={leaveRequests} />}
        {activeTab === 'apply' && <LeaveForm user={currentUser} onSubmit={handleApplyLeave} />}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-blue-900 tracking-tight">Leave History</h2>
            <div className="bg-white/40 rounded-3xl overflow-hidden border border-white/60 shadow-inner">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Dates</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaveRequests.filter(r => r.userId === currentUser.id).length === 0 ? (
                    <tr><td colSpan={3} className="p-8 text-center text-gray-400 italic">No applications recorded.</td></tr>
                  ) : (
                    leaveRequests.filter(r => r.userId === currentUser.id).map(req => (
                      <tr key={req.id}>
                        <td className="px-6 py-4 text-sm font-black text-blue-900">{req.type}</td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-600">
                          {req.startDate} to {req.endDate}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${req.status === LeaveStatus.APPROVED ? 'bg-green-100 text-green-700' : req.status === LeaveStatus.REJECTED ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'approvals' && <ApprovalPanel user={currentUser} users={users} requests={leaveRequests} onAction={handleLeaveAction} />}
        {activeTab === 'admin' && <AdminPanel users={users} onAddUser={handleAddStaff} onDeleteUser={handleDeleteStaff} onUpdateQuotas={handleUpdateQuotas} />}
        {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto space-y-8">
            <h2 className="text-2xl font-black text-blue-900 text-center tracking-tight">System Controls</h2>
            <div className="bg-white/60 p-8 rounded-3xl shadow-xl border border-white/60">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Admin Access Code</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="newCode"
                  className="flex-1 px-5 py-4 rounded-2xl border bg-white outline-none font-black text-lg tracking-widest"
                  defaultValue={adminAccessCode}
                />
                <button
                  onClick={() => handleUpdateAccessCode((document.getElementById('newCode') as HTMLInputElement).value)}
                  className="px-6 py-4 bg-blue-900 text-white rounded-2xl font-black text-xs uppercase"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
