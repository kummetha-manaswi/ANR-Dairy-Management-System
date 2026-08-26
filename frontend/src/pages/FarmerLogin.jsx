import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useUI } from '../context/UIContext';
import axios from 'axios';
import { User, Lock, Eye, EyeOff, LogIn, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import logoCompact from '../assets/logo_compact.png';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-amber-50/40 via-slate-50 to-emerald-50/30 dark:from-[#0b0f19] dark:via-[#111726] dark:to-[#0f1524] px-4 transition-colors duration-300 relative overflow-hidden select-none">
      
      {/* Decorative organic shapes in background */}
      <div className="absolute top-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-br from-amber-100/10 to-emerald-100/20 blur-3xl -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-tr from-emerald-100/20 to-teal-100/10 blur-3xl -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 rounded-3xl shadow-xl p-8 space-y-6 relative z-10"
      >
        {/* Branding header */}
        <div className="text-center space-y-2.5 select-none flex flex-col items-center">
          <img 
            src={logoCompact} 
            alt="ANR Logo" 
            className="w-14 h-14 object-contain rounded-2xl shadow-md border border-slate-200 dark:border-slate-800"
          />
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-none">
              {t('farmerPortal')} {t('loginButton')}
            </h2>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-450 mt-1.5">
              {t('farmerLoginSub')}
            </p>
          </div>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          
          {/* Login ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider">Farmer ID or Mobile Number</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                {...register('loginId', { required: 'Farmer ID or Mobile number is required' })}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 focus:border-amber-500 focus:ring-amber-500/20"
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
                className="text-[10px] font-bold text-amber-650 hover:text-amber-700 dark:text-amber-400 hover:underline transition"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', { required: 'Password is required' })}
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 focus:border-amber-500 focus:ring-amber-500/20"
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
          <div className="p-3 bg-amber-50/50 dark:bg-emerald-950/15 border border-amber-100/50 dark:border-emerald-900/20 rounded-xl flex gap-2 text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
            <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-emerald-500 shrink-0 mt-0.5" />
            <span>{t('farmerLoginWarning')}</span>
          </div>

          {/* Action triggers */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-700 hover:to-emerald-700 disabled:from-amber-400 disabled:to-emerald-400 rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 transition duration-300"
          >
            <span>{loading ? 'Logging in...' : t('loginButton')}</span>
          </button>
          
          <div className="flex flex-col gap-2.5 pt-2 text-center select-none">
            <Link
              to="/farmer/first-login"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-405 dark:hover:text-amber-300 transition hover:underline"
            >
              First Time Login? Activate Account
            </Link>

            <Link
              to="/portal-select"
              className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition hover:underline"
            >
              Back to Portal Selection
            </Link>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
