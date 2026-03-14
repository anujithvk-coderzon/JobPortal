'use client';

import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/Toast';

const SettingsPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const response = await api.changePassword(currentPassword, newPassword);
      if (response.success) {
        showToast('Password updated successfully', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(response.error || 'Failed to change password', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-lg mx-auto space-y-4">
        {/* Page header */}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Change Password</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Update your admin account password</p>
        </div>

        {/* Validation error alert */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-red-700">{error}</p>
          </div>
        )}

        {/* Form card */}
        <div className="rounded-lg border p-5">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Current Password */}
            <div className="space-y-1">
              <label htmlFor="currentPassword" className="block text-[13px] font-medium text-gray-700">
                Current Password
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full h-9 sm:h-10 px-3 pr-10 rounded-md border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label htmlFor="newPassword" className="block text-[13px] font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full h-9 sm:h-10 px-3 pr-10 rounded-md border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="block text-[13px] font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full h-9 sm:h-10 px-3 pr-10 rounded-md border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 sm:h-10 flex items-center justify-center gap-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13px] sm:text-[14px] font-semibold transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
