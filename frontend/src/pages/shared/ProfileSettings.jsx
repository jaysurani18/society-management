import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { Shield, Lock, Phone, User, ArrowLeft } from 'lucide-react';
import DashboardLayout from '../../components/design-system/DashboardLayout.jsx';
import Card from '../../components/design-system/Card.jsx';
import Button from '../../components/design-system/Button.jsx';
import Badge from '../../components/design-system/Badge.jsx';

export default function ProfileSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Profile Form States
  const [phone, setPhone] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [loading, setLoading] = useState(false);

  // Custom Profile Attributes
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  // Flat details read-only display
  const [flatDetails, setFlatDetails] = useState(null);
  const [residentStatus, setResidentStatus] = useState('');

  // Password reset States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [updatingSecurity, setUpdatingSecurity] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me');
      const userData = res.data?.data?.user || res.data?.user || null;
      if (userData) {
        setFirstName(userData.firstName || '');
        setLastName(userData.lastName || '');
        setPhone(userData.phone || '');
        
        if (userData.role === 'RESIDENT' && userData.residentProfile) {
          setEmergencyName(userData.residentProfile.emergencyName || '');
          setEmergencyPhone(userData.residentProfile.emergencyPhone || '');
          setVehicleNumber(userData.residentProfile.vehicleNumber || '');
          setResidentStatus(userData.residentProfile.status || 'RESIDENT');
          if (userData.residentProfile.flat) {
            setFlatDetails(userData.residentProfile.flat);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
      setProfileError('Failed to retrieve profile details.');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setLoading(true);

    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      };

      if (user?.role === 'RESIDENT') {
        payload.emergencyName = emergencyName.trim();
        payload.emergencyPhone = emergencyPhone.trim();
        payload.vehicleNumber = vehicleNumber.trim().toUpperCase();
      }

      const res = await api.put('/users/me', payload);
      if (res.data?.status === 'success' || res.status === 200) {
        setProfileSuccess('Profile details saved successfully!');
        await fetchProfile();
      }
    } catch (err) {
      console.error('Profile update failed:', err);
      setProfileError(err.response?.data?.message || 'Failed to save profile modifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSecurity = async (e) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setSecurityError('Please fill in all security credential inputs.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError('New password and password confirmation entries do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setSecurityError('New password length must be at least 8 characters.');
      return;
    }

    setUpdatingSecurity(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.data?.status === 'success' || res.status === 200) {
        setSecuritySuccess('Security credentials updated successfully.');
        setCurrentPassword('');
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

  const location = useLocation();

  return (
    <DashboardLayout
      activePath="/profile"
      role={user?.role}
      currentSectionName="My Profile"
    >
      <div className="max-w-4xl mx-auto space-y-12 text-left">
        
        {/* Row 1: Profile Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Row metadata */}
          <div className="space-y-1.5 md:col-span-1">
            <h3 className="text-sm font-semibold text-slate-900">Profile Details</h3>
            <p className="text-xs text-slate-550 leading-relaxed">
              Your personal information, registered email address, and active role status inside the society registry.
            </p>
          </div>

          {/* Right Column: Card form */}
          <div className="md:col-span-2">
            <Card
              title="Edit Profile Details"
              subtitle="Personal Info"
              className="border border-slate-200"
            >
              <form onSubmit={handleUpdateProfile} className="space-y-4 p-2">
                
                {/* Flat Allotment Info banner */}
                {flatDetails && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-brand-md flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Allotted Flat Unit</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        Block {flatDetails.block} - {flatDetails.number} ({flatDetails.floor} Floor)
                      </p>
                    </div>
                    <Badge status="approved" label={residentStatus} />
                  </div>
                )}

                {/* Alerts */}
                {profileError && (
                  <div className="bg-rose-50 border border-rose-100 text-brand-brick text-xs px-4 py-3 rounded-brand-md">
                    <span className="font-bold text-rose-955 block mb-0.5 font-bold">Operation Failed</span>
                    <span>{profileError}</span>
                  </div>
                )}
                {profileSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs px-4 py-3 rounded-brand-md">
                    <span className="font-bold block mb-0.5 font-bold">Success</span>
                    <span>{profileSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      disabled={loading}
                      className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-brand-md text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-250"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      disabled={loading}
                      className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-brand-md text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-250"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">Registered Email</label>
                  <input
                    type="text"
                    value={user?.email || 'N/A'}
                    disabled
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-brand-md text-xs bg-slate-50 text-slate-405 font-mono select-none cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">User Role</label>
                    <input
                      type="text"
                      value={user?.role || 'N/A'}
                      disabled
                      className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-brand-md text-xs bg-slate-50 text-slate-500 font-bold uppercase tracking-wider select-none cursor-not-allowed font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      disabled={loading}
                      className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-brand-md text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-250"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="px-4 py-2"
                  >
                    {loading ? 'Saving...' : 'Save Profile Details'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>

        {/* Divider line */}
        <hr className="border-slate-200" />

        {/* Row 2: Emergency & Parking (Only visible if resident) */}
        {user?.role === 'RESIDENT' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="space-y-1.5 md:col-span-1">
                <h3 className="text-sm font-semibold text-slate-900">Emergency & Property Log</h3>
                <p className="text-xs text-slate-550 leading-relaxed">
                  Provide primary contact configurations for emergencies and verify vehicle license plates on file.
                </p>
              </div>

              {/* Right Column */}
              <div className="md:col-span-2">
                <Card
                  title="Emergency & Parking Log"
                  subtitle="Vehicle & Contacts"
                  className="border border-slate-200"
                >
                  <form onSubmit={handleUpdateProfile} className="space-y-4 p-2">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">Emergency Contact Name</label>
                      <input
                        type="text"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        placeholder="e.g. Spouse / Parent"
                        disabled={loading}
                        className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-brand-md text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-250"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">Emergency Contact Phone</label>
                      <input
                        type="text"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="e.g. +91 99999 88888"
                        disabled={loading}
                        className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-brand-md text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-250"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">Vehicle License Plate Number</label>
                      <input
                        type="text"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        placeholder="e.g. MH-12-AB-1234"
                        disabled={loading}
                        className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-brand-md text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-250 font-mono"
                      />
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                        className="px-4 py-2"
                      >
                        {loading ? 'Saving...' : 'Save Emergency Settings'}
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            </div>

            {/* Divider line */}
            <hr className="border-slate-200" />
          </>
        )}

        {/* Row 3: Security & Password reset */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="space-y-1.5 md:col-span-1">
            <h3 className="text-sm font-semibold text-slate-900">Security Credentials</h3>
            <p className="text-xs text-slate-550 leading-relaxed">
              Change your password credentials periodically to safeguard access to your ledger.
            </p>
          </div>

          {/* Right Column */}
          <div className="md:col-span-2">
            <Card
              title="Change Access Password"
              subtitle="Security Guard"
              className="border border-slate-200"
            >
              <form onSubmit={handleUpdateSecurity} className="space-y-4 p-2">
                
                {securityError && (
                  <div className="bg-rose-50 border border-rose-100 text-brand-brick text-xs px-4 py-3 rounded-brand-md">
                    <span className="font-bold text-rose-955 block mb-0.5 font-bold">Operation Failed</span>
                    <span>{securityError}</span>
                  </div>
                )}
                {securitySuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs px-4 py-3 rounded-brand-md">
                    <span className="font-bold block mb-0.5 font-bold">Success</span>
                    <span>{securitySuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={updatingSecurity}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-brand-md text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-250 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={updatingSecurity}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-brand-md text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-250 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={updatingSecurity}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-brand-md text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-250 font-mono"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={updatingSecurity}
                    className="px-4 py-2"
                  >
                    {updatingSecurity ? 'Resetting...' : 'Change Password'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
