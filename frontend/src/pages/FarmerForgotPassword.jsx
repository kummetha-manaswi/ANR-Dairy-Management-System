import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useUI } from '../context/UIContext';
import axios from 'axios';
import { User, Phone, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FarmerForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const watchPassword = watch('newPassword');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const response = await axios.post(`${baseUrl}/api/v1/auth/farmer/forgot-password`, {
        farmerCode: data.farmerCode,
        phone: data.phone,
        newPassword: data.newPassword
      });

      if (response && response.data && response.data.success) {
        showToast('Password reset successfully! Please log in with your new password.', 'success');
        navigate('/farmer/login');
      }
    } catch (error) {
      // Always match backend's generic error message on mismatch to prevent enumeration
      const serverMessage = error.response?.data?.message || 'Invalid credentials.';
      showToast(serverMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-xl p-8 space-y-6"
      >
        {/* Branding header */}
        <div className="text-center space-y-2 select-none">
          <div className="w-12 h-12 rounded-full bg-red-150 dark:bg-red-950 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Farmer Password Recovery</h2>
          <p className="text-xs text-slate-500">Enter your Farmer ID and Registered Mobile Number to reset your portal password.</p>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Farmer ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Farmer ID</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                {...register('farmerCode', { required: 'Farmer ID is required' })}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50/55 dark:bg-slate-800/40 border border-slate-205 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. ANRF0001"
              />
            </div>
            {errors.farmerCode && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.farmerCode.message}</p>
            )}
          </div>

          {/* Registered Mobile Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Registered Mobile Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                {...register('phone', { 
                  required: 'Mobile number is required',
                  pattern: { value: /^[6-9]\d{9}$/, message: 'Please enter a valid 10-digit number' }
                })}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50/55 dark:bg-slate-800/40 border border-slate-205 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="10-digit number"
              />
            </div>
            {errors.phone && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.phone.message}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('newPassword', { 
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50/55 dark:bg-slate-800/40 border border-slate-205 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-455 hover:text-slate-700 rounded focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword', { 
                  required: 'Confirm password is required',
                  validate: value => value === watchPassword || 'Passwords do not match'
                })}
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50/55 dark:bg-slate-800/40 border border-slate-205 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-slate-455 hover:text-slate-700 rounded focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Action Trigger */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-sm shadow-md transition disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        {/* Back Link */}
        <div className="text-center pt-2 select-none">
          <Link to="/farmer/login" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
            Back to Portal Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
