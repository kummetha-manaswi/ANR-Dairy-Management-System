import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useUI } from '../context/UIContext';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { Phone, Lock, Eye, EyeOff, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import logoCompact from '../assets/logo_compact.png';

export default function Login() {
  const { showToast } = useUI();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Forgot password recovery states
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotQuestion, setForgotQuestion] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [setupRequired, setSetupRequired] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const handleForgotPhoneSubmit = async (e) => {
    e.preventDefault();
    if (!forgotPhone || !/^[6-9]\d{9}$/.test(forgotPhone)) {
      setForgotError('Please enter a valid 10-digit phone number');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const response = await api.post('/auth/forgot-password/question', { phone: forgotPhone });
      if (response.data && response.data.success) {
        setForgotQuestion(response.data.data.question);
        setForgotStep(2);
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to retrieve recovery question');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResetSubmit = async (e) => {
    e.preventDefault();
    if (!forgotAnswer) {
      setForgotError('Security answer is required');
      return;
    }
    if (forgotNewPassword.length < 8) {
      setForgotError('Password must be at least 8 characters long');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const response = await api.post('/auth/forgot-password/reset', {
        phone: forgotPhone,
        recoveryAnswer: forgotAnswer,
        newPassword: forgotNewPassword
      });
      if (response.data && response.data.success) {
        showToast('Password reset successfully. Please log in.', 'success');
        handleCloseForgotModal();
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCloseForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotPhone('');
    setForgotQuestion('');
    setForgotAnswer('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
  };

  // Redirect to setup if no administrator exists in the database
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await api.get('/auth/setup-status');
        if (response.data && response.data.success) {
          const required = response.data.data.setupRequired;
          setSetupRequired(required);
          if (required) {
            // Clear stale storage so no middleware/session issues occur
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('sessionTimeout');
            navigate('/setup');
          }
        }
      } catch (err) {
        console.error('Error checking setup status:', err);
      }
    };
    checkSetupStatus();
  }, [navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        phone: data.phone,
        password: data.password,
      });

      if (response.data && response.data.success) {
        const { token, user, sessionTimeout } = response.data.data;
        
        // Save auth credentials in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('sessionTimeout', sessionTimeout || 30);

        showToast(t('success') + ': Logged in successfully', 'success');

        // Redirect based on user state
        if (user.mustChangePassword) {
          navigate('/change-password');
        } else if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/employee/dashboard');
        }
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || 'Invalid phone number or password';
      showToast(serverMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-emerald-50/40 via-slate-50 to-teal-50/30 dark:from-[#0b0f19] dark:via-[#111726] dark:to-[#0f1524] flex items-center justify-center p-4 transition-colors duration-200 relative overflow-hidden select-none">
      
      {/* Decorative organic shapes in background */}
      <div className="absolute top-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-br from-emerald-100/20 to-teal-200/10 blur-3xl -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-tr from-amber-100/10 to-emerald-100/20 blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 rounded-3xl shadow-xl p-8 space-y-6 relative z-10"
      >
        {/* Branding header */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <img 
            src={logoCompact} 
            alt="ANR Logo" 
            className="w-14 h-14 object-contain rounded-2xl shadow-md border border-slate-200 dark:border-slate-800"
          />
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              ANR Dairy Management System
            </h1>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-450 mt-0.5">
              Admin & Staff Portal Sign In
            </p>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          
          {/* Phone Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('phoneLabel')}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                {...register('phone', { 
                  required: 'Phone number is required',
                  pattern: { value: /^[6-9]\d{9}$/, message: 'Must be a valid 10-digit number' }
                })}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20"
                placeholder="Enter 10-digit mobile"
              />
            </div>
            {errors.phone && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.phone.message}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t('passwordLabel')}
              </label>
              {!setupRequired ? (
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline transition"
                >
                  {t('forgotPassword')}?
                </button>
              ) : null}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', { required: 'Password is required' })}
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20"
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-450 hover:text-slate-700 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {setupRequired && (
              <p className="text-[10px] text-red-500 font-semibold mt-1 leading-relaxed">
                Please complete First-Time Setup before using account recovery.
              </p>
            )}
            {errors.password && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Trigger */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-emerald-400 disabled:to-teal-400 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 transition duration-300"
          >
            {loading ? 'Authenticating...' : t('loginButton')}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/portal-select"
              className="text-xs font-bold text-emerald-650 hover:text-emerald-750 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline transition"
            >
              Back to Portal Selection
            </Link>
          </div>
        </form>
      </motion.div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-dark-surface border border-slate-205 dark:border-dark-border rounded-lg shadow-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Admin Account Recovery</span>
            </h3>
            
            {forgotError && (
              <p className="p-2.5 bg-red-50 dark:bg-red-950/20 text-[10px] text-red-500 border border-red-100 dark:border-red-900/30 rounded font-semibold">
                {forgotError}
              </p>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotPhoneSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Enter Admin Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                      placeholder="e.g. 9999999999"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCloseForgotModal}
                    className="flex-1 py-2 border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-805 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-md transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-xs transition disabled:bg-blue-400"
                  >
                    {forgotLoading ? 'Checking...' : 'Next'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotResetSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Security Question
                  </label>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded border border-slate-100 dark:border-dark-border">
                    {forgotQuestion}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider">
                    Your Answer
                  </label>
                  <input
                    type="text"
                    value={forgotAnswer}
                    onChange={(e) => setForgotAnswer(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                    placeholder="Enter security answer"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider">
                    New Strong Password
                  </label>
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setForgotStep(1); setForgotError(''); }}
                    className="flex-1 py-2 border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-805 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-md transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-xs transition disabled:bg-blue-400"
                  >
                    {forgotLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
