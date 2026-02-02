
import React, { useState } from 'react';
import { User, Role, Department, LeaveQuotas } from '../types';
import { ROLES, DEPARTMENTS, DEFAULT_QUOTAS } from '../constants';

interface AdminPanelProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateQuotas: (userId: string, quotas: LeaveQuotas) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, onAddUser, onDeleteUser, onUpdateQuotas }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [tempQuotas, setTempQuotas] = useState<LeaveQuotas | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<Role | 'ALL'>('ALL');
  const [filterDepartment, setFilterDepartment] = useState<Department | 'ALL'>('ALL');
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: Role.TEACHING_STAFF,
    department: Department.COMPS,
    dateOfJoining: '',
    
  });

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    const matchesDepartment = filterDepartment === 'ALL' || user.department === filterDepartment;
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser({
      ...newUser,
      quotas: { ...DEFAULT_QUOTAS }
    });
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: Role.TEACHING_STAFF,
      department: Department.COMPS,
      dateOfJoining: '',
    });
    setShowAddForm(false);
    alert('Staff account created successfully!');
  };

  const startEditingQuotas = (user: User) => {
    setEditingUserId(user.id);
    setTempQuotas({ ...user.quotas });
  };

  const saveQuotas = () => {
    if (editingUserId && tempQuotas) {
      onUpdateQuotas(editingUserId, tempQuotas);
      setEditingUserId(null);
      setTempQuotas(null);
      alert('Leave quotas updated successfully!');
    }
  };

  const incrementLeaves = (userId: string, type: keyof LeaveQuotas, amount: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      const newQuotas = { ...user.quotas, [type]: Math.max(0, user.quotas[type] + amount) };
      onUpdateQuotas(userId, newQuotas);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-blue-900 tracking-tight">Admin Management</h2>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mt-1 flex items-center">
            <svg className="w-4 h-4 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
            Complete Staff & Leave Management System
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-6 py-3 border border-transparent text-xs font-black uppercase tracking-[0.1em] rounded-2xl text-white bg-blue-900 hover:bg-blue-800 transition-all shadow-xl hover:shadow-blue-200 active:scale-95"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {showAddForm ? 'Close Form' : 'Add New Staff'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white/60 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white/60 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight">Create New Staff Account</h3>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Full Name *</label>
              <input
                type="text" required
                value={newUser.name}
                onChange={e => setNewUser({...newUser, name: e.target.value})}
                placeholder="Enter staff name"
                className="block w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-900 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Official Email *</label>
              <input
                type="email" required
                value={newUser.email}
                onChange={e => setNewUser({...newUser, email: e.target.value})}
                placeholder="staff@scoe.edu"
                className="block w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-900 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Password *</label>
              <input
                type="password" required
                value={newUser.password}
                onChange={e => setNewUser({...newUser, password: e.target.value})}
                placeholder="Temporary password"
                className="block w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-900 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Date of Joining *</label>
              <input
                type="date" required
                value={newUser.dateOfJoining}
                onChange={e => setNewUser({...newUser, dateOfJoining: e.target.value})}
                className="block w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-900 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Role *</label>
              <select
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                className="block w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-900 transition-all"
              >
                {ROLES.filter(r => r !== Role.ADMIN_1 && r !== Role.ADMIN_2).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Department *</label>
              <select
                value={newUser.department}
                onChange={e => setNewUser({...newUser, department: e.target.value as Department})}
                className="block w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-900 transition-all"
              >
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-400 text-white py-3 px-8 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-500 transition-all shadow-lg active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-900 text-white py-3 px-8 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg active:scale-95"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">🔍 Search Staff</label>
            <input
              type="text"
              placeholder="Name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Filter by Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as Role | 'ALL')}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Roles</option>
              {ROLES.filter(r => r !== Role.ADMIN_1 && r !== Role.ADMIN_2).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Filter by Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value as Department | 'ALL')}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Departments</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="bg-blue-100 text-blue-900 font-black px-4 py-2 rounded-lg w-full text-center">
              📊 {filteredUsers.length} Staff Found
            </div>
          </div>
        </div>
      </div>

      {/* Staff Directory and Leave Management Table */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 overflow-hidden">
        <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Staff Directory & Leave Management</h3>
          <span className="bg-blue-900 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">Admin Control</span>
        </div>
        
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 font-semibold">No staff found matching your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/30">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Staff</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Role & Department</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Leave Quotas (CL/CO/ML/VL/EL)</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-white/40 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-black text-blue-900">{user.name}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{user.email}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{user.department}</span>
                        <span className="text-[10px] font-bold text-gray-500">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {editingUserId === user.id ? (
                        <div className="flex items-center space-x-2 animate-in fade-in zoom-in-95 duration-200 flex-wrap gap-2">
                          {(Object.keys(user.quotas) as Array<keyof LeaveQuotas>).map((key) => (
                            <div key={key} className="flex flex-col items-center">
                              <span className="text-[8px] font-black text-gray-400 uppercase mb-1">{key}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => incrementLeaves(user.id, key, -1)}
                                  className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                  title="Decrease"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  className="w-12 text-center text-xs font-black border-2 border-blue-100 rounded-lg p-1 outline-none focus:border-blue-900"
                                  value={tempQuotas?.[key] ?? 0}
                                  onChange={(e) => setTempQuotas({
                                    ...tempQuotas!,
                                    [key]: Math.max(0, parseInt(e.target.value) || 0)
                                  })}
                                />
                                <button
                                  onClick={() => incrementLeaves(user.id, key, 1)}
                                  className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                                  title="Increase"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                          <div className="flex space-x-1 ml-2">
                            <button onClick={saveQuotas} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm" title="Save">
                              ✓
                            </button>
                            <button onClick={() => setEditingUserId(null)} className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors shadow-sm" title="Cancel">
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center space-x-2 cursor-pointer group/quota p-2 rounded-xl hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100 flex-wrap gap-2" 
                          onClick={() => startEditingQuotas(user)}
                          title="Click to edit leave quotas"
                        >
                          {(Object.keys(user.quotas) as Array<keyof LeaveQuotas>).map((key) => (
                            <span key={key} className="bg-white border border-gray-200 text-blue-900 text-[11px] font-black px-2 py-1 rounded-lg shadow-sm">
                              {key}: <span className="text-blue-600">{user.quotas[key]}</span>
                            </span>
                          ))}
                          <svg className="w-4 h-4 text-blue-300 opacity-0 group-hover/quota:opacity-100 transition-opacity ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${user.name}?`)) {
                            onDeleteUser(user.id);
                          }
                        }}
                        className="text-gray-300 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete account"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
