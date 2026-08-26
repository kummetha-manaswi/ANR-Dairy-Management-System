import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useUI } from '../context/UIContext';
import api from '../services/api';
import { KeyRound, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForceChangePassword() {
  const { showToast } = useUI();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPasswordVal, setNewPasswordVal] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  // Watch new password to update strength meter live
  const newPassword = watch('newPassword', '');
  useEffect(() => {
    setNewPasswordVal(newPassword);
  }, [newPassword]);

  // If the user isn't logged in, redirect to login
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (!token || !user) {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Calculate live password strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { label: 'None', color: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-400', width: 'w-0', score: 0 };
    
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasDigit = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    
    const metCriteria = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
    
    if (pass.length < 8) {
      return { label: 'Weak (Too Short)', color: 'bg-red-500', text: 'text-red-500', width: 'w-1/3', score: 1 };
    }
    
    if (metCriteria === 4) {
      return { label: 'Strong', color: 'bg-green-500', text: 'text-green-500', width: 'w-full', score: 3 };
    } else if (metCriteria === 3) {
      return { label: 'Medium', color: 'bg-yellow-500', text: 'text-yellow-500', width: 'w-2/3', score: 2 };
    } else {
      return { label: 'Weak', color: 'bg-red-500', text: 'text-red-500', width: 'w-1/3', score: 1 };
    }
  };

  const strength = getPasswordStrength(newPasswordVal);

  const onSubmit = async (data) => {
    if (strength.score < 3) {
      showToast('Please create a Strong password satisfying all policy criteria.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });

      if (response.data && response.data.success) {
        // Update user payload in localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        user.mustChangePassword = false;
        localStorage.setItem('user', JSON.stringify(user));

        showToast('Password updated successfully! Welcome back.', 'success');

        // Redirect based on role
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/employee/dashboard');
        }
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || 'Password update failed. Check current password.';
      showToast(serverMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const criteriaChecklist = [
    { label: 'Minimum 8 characters', met: newPasswordVal.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(newPasswordVal) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(newPasswordVal) },
    { label: 'One numeric digit (0-9)', met: /[0-9]/.test(newPasswordVal) },
    { label: 'One special character (!@#$...)', met: /[!@#$%^&*(),.?":{}|<>]/.test(newPasswordVal) }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-main flex items-center justify-center p-4 transition-colors duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-xl p-8 space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="w-12 h-12 rounded bg-yellow-600 flex items-center justify-center text-white font-extrabold shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Password Change Required
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your password has been reset. Please set a new secure password to proceed.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Current Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Current (Temporary) Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('currentPassword', { required: 'Current password is required' })}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                placeholder="Enter current password"
              />
            </div>
            {errors.currentPassword && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              New Secure Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('newPassword', { required: 'New password is required' })}
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-655 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Strength meter */}
          {newPasswordVal && (
            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-dark-border rounded-md text-[11px] animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500">New Password Strength:</span>
                <span className={`font-bold ${strength.text}`}>{strength.label}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full ${strength.color} ${strength.width} transition-all duration-350`} />
              </div>
              
              {/* Strength Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 pt-1 text-[10px]">
                {criteriaChecklist.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-slate-500">
                    {c.met ? (
                      <Check className="w-3.5 h-3.5 text-green-500 stroke-[3]" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-red-400 stroke-[3]" />
                    )}
                    <span className={c.met ? 'text-green-600 dark:text-green-400 font-semibold' : ''}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm New Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('confirmNewPassword', { 
                  required: 'Please confirm your new password',
                  validate: (value) => value === newPasswordVal || 'Passwords do not match'
                })}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                placeholder="••••••"
              />
            </div>
            {errors.confirmNewPassword && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.confirmNewPassword.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md shadow-sm transition"
          >
            {loading ? 'Updating Password...' : 'Save Password & Continue'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
