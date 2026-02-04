
import React, { useState } from 'react';
import { User, LeaveType, LeaveRequest, LeaveStatus } from '../types';

interface LeaveFormProps {
  user: User;
  onSubmit: (request: Omit<LeaveRequest, 'id' | 'appliedDate' | 'status' | 'userName' | 'department'>) => void;
}

const LeaveForm: React.FC<LeaveFormProps> = ({ user, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: LeaveType.CL,
    startDate: '',
    endDate: '',
    manualDays: '',
    reason: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const manualDays = parseInt(formData.manualDays, 10);
    onSubmit({
      ...formData,
      manualDays: Number.isFinite(manualDays) && manualDays > 0 ? manualDays : undefined,
      userId: user.id
    });
    setFormData({ type: LeaveType.CL, startDate: '', endDate: '', manualDays: '', reason: '' });
    alert('Leave request submitted successfully!');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">New Leave Application</h2>
        <p className="text-sm text-gray-500">Fill in the details for your leave request.</p>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as LeaveType })}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {Object.values(LeaveType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Working Days on leaves</label>
          <input
            type="number"
            required
            value={formData.manualDays}
            onChange={(e) => setFormData({ ...formData, manualDays: e.target.value })}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter working days"
          />
          <p className="text-xs text-gray-500 mt-1"> Add the number of days you are taking leaves </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leave</label>
          <textarea
            required
            rows={4}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Please provide a brief reason..."
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
          >
            Submit Application
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveForm;
