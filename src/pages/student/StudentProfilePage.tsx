import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { Alert } from '../../components/common/Alert';
import { User, Mail, Phone, Lock } from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setAlertInfo({ type: 'error', message: 'Name cannot be empty.' });
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        setAlertInfo({ type: 'error', message: 'Current password is required to set a new password.' });
        return;
      }
      if (newPassword.length < 6) {
        setAlertInfo({ type: 'error', message: 'New password must be at least 6 characters long.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setAlertInfo({ type: 'error', message: 'New passwords do not match.' });
        return;
      }
    }

    try {
      setSaving(true);
      setAlertInfo(null);
      const res = await authService.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      if (res.success) {
        setAlertInfo({ type: 'success', message: 'Profile updated successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        await refreshUser();
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
      
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-bold tracking-tight text-[#F1F5F9]">
          Account Profile & Security
        </h1>
        <p className="text-[13px] text-[#7C8BA8] mt-1">
          Manage your personal details, contact preferences, and password credentials.
        </p>
      </div>

      {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} />}

      {/* Profile Form Card */}
      <div className="academic-card p-6 sm:p-7 space-y-6">
        
        {/* Read-only account overview */}
        <div className="p-4 bg-[#16223B] rounded-[10px] border border-[#1F2D4A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6] font-bold text-sm flex items-center justify-center">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold text-[#F1F5F9]">{user?.name}</div>
              <div className="text-xs text-[#7C8BA8]">{user?.email}</div>
            </div>
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] bg-[#3B82F6]/15 border border-[#3B82F6]/30 px-2.5 py-1 rounded-[6px]">
            {user?.role}
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-[#7C8BA8]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#0F1829] border border-[#1F2D4A] rounded-[10px] text-[#F1F5F9] placeholder:text-[#7C8BA8] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/25 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-[#7C8BA8]" />
                <input
                  type="tel"
                  placeholder="+1 (555) 0123"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#0F1829] border border-[#1F2D4A] rounded-[10px] text-[#F1F5F9] placeholder:text-[#7C8BA8] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/25 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
              College Email (Fixed)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-[#7C8BA8]" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#0B1220] border border-[#1F2D4A] rounded-[10px] text-[#7C8BA8] cursor-not-allowed"
              />
            </div>
          </div>

          {/* Change Password Sub-section */}
          <div className="pt-4 border-t border-[#1F2D4A] space-y-3.5">
            <h3 className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider">
              Change Password (Optional)
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-[#7C8BA8]" />
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[#0F1829] border border-[#1F2D4A] rounded-[10px] text-[#F1F5F9] placeholder:text-[#7C8BA8] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/25 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#0F1829] border border-[#1F2D4A] rounded-[10px] text-[#F1F5F9] placeholder:text-[#7C8BA8] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/25 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#0F1829] border border-[#1F2D4A] rounded-[10px] text-[#F1F5F9] placeholder:text-[#7C8BA8] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/25 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1F2D4A] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
