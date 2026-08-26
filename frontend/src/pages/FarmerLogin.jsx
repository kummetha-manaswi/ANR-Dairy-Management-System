import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useUI } from '../context/UIContext';
import axios from 'axios';
import { User, Lock, Eye, EyeOff, LogIn, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function FarmerLogin() {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const response = await axios.post(`${baseUrl}/api/v1/auth/farmer/login`, {
        loginId: data.loginId,
        password: data.password
      });

      if (response && response.data && response.data.success) {
        const { token, user } = response.data.data;
        
        // Store session keys
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        showToast('Login successful! Welcome to Farmer Portal.', 'success');
        navigate('/farmer/dashboard');
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || 'Login failed. Please check credentials.';
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
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center mx-auto">
            <LogIn className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('farmerPortal')} {t('loginButton')}</h2>
          <p className="text-xs text-slate-450">{t('farmerLoginSub')}</p>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Login ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider">Farmer ID or Mobile Number</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                {...register('loginId', { required: 'Farmer ID or Mobile number is required' })}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50/55 dark:bg-slate-800/40 border border-slate-205 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Farmer ID (ANRF0001) or 10-digit Phone"
              />
            </div>
            {errors.loginId && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.loginId.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider">{t('passwordLabel')}</label>
              <Link
                to="/farmer/forgot-password"
                className="text-[10px] font-semibold text-blue-600 hover:text-blue-750 dark:text-blue-400 hover:underline transition"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', { required: 'Password is required' })}
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
            {errors.password && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.password.message}</p>
            )}
          </div>

          {/* Warning disclaimer */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg flex gap-2 text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
            <ShieldAlert className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span>{t('farmerLoginWarning')}</span>
          </div>

          {/* Action triggers */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md shadow-sm transition"
          >
            <span>{loading ? 'Logging in...' : t('loginButton')}</span>
          </button>
          
          <div className="flex flex-col gap-2 pt-2 text-center select-none">
            <Link
              to="/farmer/first-login"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              First Time Login? Activate Account
            </Link>

            <Link
              to="/admin/login"
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 hover:underline"
            >
              {t('adminSignIn')}
            </Link>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
