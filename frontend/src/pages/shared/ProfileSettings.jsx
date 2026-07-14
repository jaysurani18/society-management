import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { Shield, Lock, Phone, User, ArrowLeft } from 'lucide-react';

export default function ProfileSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Profile Form States
  const [phone, setPhone] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [loading, setLoading] = useState(false);

  // Security Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [updatingSecurity, setUpdatingSecurity] = useState(false);

  // Fetch current user details on load
  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me');
      const u = res.data?.data?.user || res.data?.user || {};
      setPhone(u.phone || '');
    } catch (err) {
      console.error('Failed to load profile details:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleBackToDashboard = () => {
    if (user?.role === 'ADMIN') {
      navigate('/admin/dashboard');
    } else if (user?.role === 'COMMITTEE') {
      navigate('/committee/dashboard');
    } else {
      navigate('/resident/dashboard');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setLoading(true);
    try {
      const res = await api.put('/users/me', { phone: phone.trim() });
      if (res.status === 200 || res.data?.status === 'success') {
        setProfileSuccess('Profile phone number updated successfully!');
      }
    } catch (err) {
      console.error('Profile update failed:', err);
      setProfileError(err.response?.data?.message || 'Failed to update phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSecurity = async (e) => {
    e.preventDefault();
    setSecuritySuccess('');
    setSecurityError('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setSecurityError('All password fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setSecurityError('New password must be at least 8 characters long.');
      return;
    }

    setUpdatingSecurity(true);
    try {
      const res = await api.put('/auth/change-password', {
        oldPassword,
        newPassword,
      });

      if (res.status === 200 || res.data?.status === 'success') {
        setSecuritySuccess('Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Security update failed:', err);
      setSecurityError(err.response?.data?.message || 'Incorrect current password or update failed.');
    } finally {
      setUpdatingSecurity(false);
    }
  };

  const fullName = user ? `${user.firstName} ${user.lastName}` : 'N/A';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans p-6 max-w-5xl mx-auto w-full space-y-6">
      
      {/* Top Header Selector */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-200">
        <button
          onClick={handleBackToDashboard}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-950 font-medium text-sm focus:outline-none cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Personal settings</h2>
      </header>

      {/* Dual Column Stack Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Panel: Profile Information Form */}
        <section className="bg-white border border-slate-200 p-6 flex flex-col space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
              <User size={16} />
              <h3>Profile Information</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">Verify credentials and phone details.</p>
          </div>

          {profileError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 font-medium">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-3 font-medium">
              {profileSuccess}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Name</label>
              <div className="border border-slate-200 bg-slate-50 rounded-md p-2 text-sm text-slate-700 font-semibold">
                {fullName}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Registered Email</label>
              <div className="border border-slate-200 bg-slate-50 rounded-md p-2 text-sm text-slate-700 font-mono">
                {user?.email || 'N/A'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">User Role</label>
              <div className="border border-slate-200 bg-slate-50 rounded-md p-2 text-sm text-slate-700 font-bold uppercase">
                {user?.role || 'N/A'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  disabled={loading}
                  className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md py-2 pl-9 pr-3 text-sm w-full text-slate-950 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-4 rounded-md cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Update Phone Details'}
            </button>
          </form>
        </section>

        {/* Right Panel: Security & Password Update Form */}
        <section className="bg-white border border-slate-200 p-6 flex flex-col space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
              <Lock size={16} />
              <h3>Security & Password Settings</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">Reset password attributes for access security.</p>
          </div>

          {securityError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 font-medium">
              {securityError}
            </div>
          )}
          {securitySuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-3 font-medium">
              {securitySuccess}
            </div>
          )}

          <form onSubmit={handleUpdateSecurity} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={updatingSecurity}
                className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 text-sm w-full text-slate-950 bg-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                disabled={updatingSecurity}
                className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 text-sm w-full text-slate-950 bg-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                disabled={updatingSecurity}
                className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 text-sm w-full text-slate-950 bg-white font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={updatingSecurity}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-4 rounded-md cursor-pointer disabled:opacity-50"
            >
              {updatingSecurity ? 'Resetting...' : 'Change Password'}
            </button>
          </form>
        </section>

      </div>
    </div>
  );
}
