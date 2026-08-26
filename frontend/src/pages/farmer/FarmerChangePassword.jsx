import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useUI } from '../../context/UIContext';
import { Lock, Eye, EyeOff, KeyRound, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FarmerChangePassword() {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Watch new password to calculate strength dynamically
  const newPasswordVal = watch('newPassword', '');

  const calculateStrength = (pass) => {
    if (!pass) return { text: '', color: 'text-slate-400 bg-slate-100', width: 'w-0' };
    if (pass.length < 6) return { text: 'Weak', color: 'text-red-500 bg-red-100 dark:bg-red-950/20', width: 'w-1/3' };
    
    let score = 0;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (pass.length >= 8) score++;

    if (score <= 1) return { text: 'Weak', color: 'text-red-500 bg-red-100 dark:bg-red-950/20', width: 'w-1/3' };
    if (score === 2) return { text: 'Medium', color: 'text-amber-500 bg-amber-100 dark:bg-amber-950/20', width: 'w-2/3' };
    return { text: 'Strong', color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950/20', width: 'w-full' };
  };

  const strength = calculateStrength(newPasswordVal);

  const onSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      showToast('New password and confirm password do not match', 'warning');
      return;
    }

    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      const response = await axios.put(`${baseUrl}/api/v1/auth/farmer/change-password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        showToast('Password changed successfully! Please log in with your new credentials.', 'success');
        
        // Clear session and log out
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/farmer/login');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update credentials password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-xl p-8 space-y-6">
      
      {/* Header info */}
      <div className="text-center space-y-2 select-none">
        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/20 flex items-center justify-center mx-auto">
          <KeyRound className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Update Account Password</h2>
        <p className="text-xs text-slate-450">Set a strong portal password to keep your milk ledgers and payments data secure.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Current Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Current Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              {...register('currentPassword', { required: 'Current password is required' })}
              className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-800/40 border border-slate-205 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-blue-500"
              placeholder="••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-3 text-slate-450 hover:text-slate-700 focus:outline-none"
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-[10px] text-red-500 font-semibold">{errors.currentPassword.message}</p>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider">New Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type={showNewPassword ? 'text' : 'password'}
              {...register('newPassword', {
                required: 'New password is required',
                minLength: { value: 6, message: 'New password must be at least 6 characters' }
              })}
              className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-800/40 border border-slate-205 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-blue-500"
              placeholder="Minimum 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-3 text-slate-450 hover:text-slate-700 focus:outline-none"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-[10px] text-red-500 font-semibold">{errors.newPassword.message}</p>
          )}

          {/* Strength Bar */}
          {newPasswordVal && (
            <div className="space-y-1 pt-1.5 animate-fadeIn select-none">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-400 uppercase tracking-wider">Password Strength:</span>
                <span className={`uppercase tracking-wider ${strength.color.split(' ')[0]}`}>{strength.text}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 rounded-full ${
                  strength.text === 'Weak' ? 'bg-red-500' : strength.text === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                } ${strength.width}`}></div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider">Confirm New Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="password"
              {...register('confirmPassword', { required: 'Please confirm your new password' })}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-800/40 border border-slate-205 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-blue-500"
              placeholder="Re-enter new password"
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-[10px] text-red-500 font-semibold">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Warn message */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg flex gap-2 text-[10px] text-amber-700 dark:text-amber-400 leading-normal">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>Note: Changing your password will immediately end your current portal session and log you out. Please sign in again using your new password.</span>
        </div>

        {/* Action triggers */}
        <div className="flex gap-3 select-none pt-2">
          <button
            type="button"
            onClick={() => navigate('/farmer/dashboard')}
            className="w-1/2 py-2.5 text-xs font-bold text-slate-655 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-1/2 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md shadow-sm transition"
          >
            <span>{loading ? 'Changing...' : 'Change Password'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
