
import React from 'react';
import { User, LeaveRequest, LeaveStatus } from '../types';

interface DashboardProps {
  user: User;
  requests: LeaveRequest[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, requests }) => {
  const userRequests = requests.filter(r => r.userId === user.id);
  const pendingCount = userRequests.filter(r => r.status === LeaveStatus.PENDING).length;
  const approvedCount = userRequests.filter(r => r.status === LeaveStatus.APPROVED).length;

  const totalRemaining = (Object.values(user.quotas) as number[]).reduce((a, b) => a + b, 0);

  const leaveTypes = [
    { label: 'Casual Leave (CL)', value: user.quotas.CL, color: 'border-blue-500 text-blue-700' },
    { label: 'Compensatory Off (CO)', value: user.quotas.CO, color: 'border-indigo-500 text-indigo-700' },
    { label: 'Medical Leave (ML)', value: user.quotas.ML, color: 'border-emerald-500 text-emerald-700' },
    { label: 'Vacation Leave (VL)', value: user.quotas.VL, color: 'border-amber-500 text-amber-700' },
    { label: 'Earned Leave (EL)', value: user.quotas.EL, color: 'border-rose-500 text-rose-700' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-900 rounded-3xl p-6 shadow-xl border border-blue-800 text-white relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z"/></svg>
          </div>
          <p className="text-blue-200 text-xs font-black uppercase tracking-widest mb-1">Total Available Credits</p>
          <h3 className="text-4xl font-black">{totalRemaining} Days</h3>
        </div>
        
        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-lg border border-white/40 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Pending Approval</p>
            <h3 className="text-3xl font-black text-amber-600">{pendingCount}</h3>
          </div>
          <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-lg border border-white/40 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Approved This Year</p>
            <h3 className="text-3xl font-black text-emerald-600">{approvedCount}</h3>
          </div>
          <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
          </div>
        </div>
      </div>

      {/* Numerical Leave Balances */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-black text-blue-900 tracking-tight">Current Leave Balances</h2>
          <p className="text-sm text-gray-500 font-medium">Detailed numeric count of your remaining leave quotas.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {leaveTypes.map((leave) => (
            <div 
              key={leave.label} 
              className={`bg-white/80 backdrop-blur-sm rounded-2xl p-5 border-l-4 shadow-md transition-all hover:translate-y-[-2px] hover:shadow-lg ${leave.color}`}
            >
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2 truncate" title={leave.label}>
                {leave.label.split(' ')[0]}
              </p>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-black">{leave.value}</span>
                <span className="text-[10px] font-bold uppercase tracking-tight opacity-50">Days</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Mini-List */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-inner">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {userRequests.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No recent leave activity found.</p>
          ) : (
            userRequests.slice(0, 3).map((req) => (
              <div key={req.id} className="flex items-center justify-between bg-white/40 p-3 rounded-xl border border-white/40">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${req.status === LeaveStatus.APPROVED ? 'bg-emerald-500' : req.status === LeaveStatus.REJECTED ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                  <div>
                    <p className="text-xs font-black text-blue-900 uppercase">{req.type}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{new Date(req.startDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${req.status === LeaveStatus.APPROVED ? 'text-emerald-700 bg-emerald-50' : req.status === LeaveStatus.REJECTED ? 'text-rose-700 bg-rose-50' : 'text-amber-700 bg-amber-50'}`}>
                  {req.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
