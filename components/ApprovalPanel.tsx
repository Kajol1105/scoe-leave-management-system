
import React, { useState } from 'react';
import { User, LeaveRequest, LeaveStatus, Role, ApproverRole } from '../types';

interface ApprovalPanelProps {
  user: User;
  users: User[];
  requests: LeaveRequest[];
  onAction: (requestId: string, status: LeaveStatus) => void;
}

const ApprovalPanel: React.FC<ApprovalPanelProps> = ({ user, users, requests, onAction }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeaveStatus | 'ALL'>('ALL');

  const filteredRequests = requests.filter(req => {
    // Filter by status
    if (filterStatus !== 'ALL' && req.status !== filterStatus) return false;

    const applicant = users.find(u => u.id === req.userId);
    if (!applicant) return false;

    // Filter by search
    if (searchQuery && !applicant.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Check based on approverRole field
    if (applicant.approverRole === ApproverRole.HOD) {
      // HOD approves this person: HOD of their department
      if (user.role === Role.HOD && req.department === user.department) {
        return true;
      }
    } else if (applicant.approverRole === ApproverRole.PRINCIPAL) {
      // Principal approves this person
      if (user.role === Role.PRINCIPAL) {
        return true;
      }
    } else if (applicant.approverRole === ApproverRole.HEAD) {
      // Department Head (treated as HOD) approves this person: Head of their department
      if (user.role === Role.HOD && req.department === user.department) {
        return true;
      }
    }

    // Principal approves all HODs
    if (applicant.role === Role.HOD && user.role === Role.PRINCIPAL) {
      return true;
    }

    return false;
  });

  const pendingRequests = filteredRequests.filter(r => r.status === LeaveStatus.PENDING);
  const approvedRequests = filteredRequests.filter(r => r.status === LeaveStatus.APPROVED);
  const rejectedRequests = filteredRequests.filter(r => r.status === LeaveStatus.REJECTED);

  const handleApproveAll = () => {
    if (confirm(`Approve all ${pendingRequests.length} pending leave requests?`)) {
      pendingRequests.forEach(req => {
        onAction(req.id, LeaveStatus.APPROVED);
      });
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-blue-900">Leave Approvals</h2>
          <p className="text-sm text-gray-500">
            {user.role === Role.PRINCIPAL 
              ? "📋 Reviewing HOD applications and designated leaves" 
              : user.role === Role.HOD 
              ? `📋 Reviewing ${user.department} department leaves` 
              : "📋 Reviewing assigned leave requests"}
          </p>
        </div>
        {pendingRequests.length > 0 && (
          <button
            onClick={handleApproveAll}
            className="px-6 py-3 bg-green-600 text-white font-black rounded-lg hover:bg-green-700 transition-all shadow-lg"
          >
            ✓ Approve All ({pendingRequests.length})
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/60 flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="🔍 Search by staff name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as LeaveStatus | 'ALL')}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value={LeaveStatus.PENDING}>Pending</option>
            <option value={LeaveStatus.APPROVED}>Approved</option>
            <option value={LeaveStatus.REJECTED}>Rejected</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-black text-amber-600">{pendingRequests.length}</div>
          <div className="text-xs font-bold text-amber-700 uppercase tracking-widest">Pending</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-black text-green-600">{approvedRequests.length}</div>
          <div className="text-xs font-bold text-green-700 uppercase tracking-widest">Approved</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-black text-red-600">{rejectedRequests.length}</div>
          <div className="text-xs font-bold text-red-700 uppercase tracking-widest">Rejected</div>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-dashed border-gray-200 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests found</h3>
          <p className="mt-1 text-sm text-gray-500">All leave requests have been processed or no matches found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map(req => {
            const applicant = users.find(u => u.id === req.userId);
            const isPending = req.status === LeaveStatus.PENDING;
            
            return (
              <div 
                key={req.id} 
                className={`rounded-xl shadow-md border-t-4 overflow-hidden flex flex-col transition-all ${
                  req.status === LeaveStatus.APPROVED 
                    ? 'bg-green-50 border-t-green-500' 
                    : req.status === LeaveStatus.REJECTED 
                    ? 'bg-red-50 border-t-red-500' 
                    : 'bg-white border-t-blue-900 hover:shadow-lg'
                }`}
              >
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-base font-bold text-gray-900">{applicant?.name}</h4>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{req.department}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest ${
                      req.status === LeaveStatus.APPROVED
                        ? 'bg-green-200 text-green-800'
                        : req.status === LeaveStatus.REJECTED
                        ? 'bg-red-200 text-red-800'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {req.type.split(' ')[0]}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600 font-medium">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(req.startDate).toLocaleDateString()} → {new Date(req.endDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-100 italic line-clamp-3">
                      "{req.reason}"
                    </div>
                  </div>

                  {req.status === LeaveStatus.APPROVED && (
                    <div className="bg-green-100 border border-green-300 rounded px-3 py-2 text-xs font-bold text-green-800">
                      ✓ APPROVED
                    </div>
                  )}
                  {req.status === LeaveStatus.REJECTED && (
                    <div className="bg-red-100 border border-red-300 rounded px-3 py-2 text-xs font-bold text-red-800">
                      ✗ REJECTED
                    </div>
                  )}
                </div>
                
                {isPending && (
                  <div className="bg-gray-100 px-5 py-4 flex space-x-3 border-t border-gray-200">
                    <button
                      onClick={() => onAction(req.id, LeaveStatus.APPROVED)}
                      className="flex-1 inline-flex justify-center items-center py-2 px-4 border border-transparent text-xs font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm active:scale-95"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => onAction(req.id, LeaveStatus.REJECTED)}
                      className="flex-1 inline-flex justify-center items-center py-2 px-4 border border-gray-300 text-xs font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-100 transition-colors shadow-sm active:scale-95"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApprovalPanel;
