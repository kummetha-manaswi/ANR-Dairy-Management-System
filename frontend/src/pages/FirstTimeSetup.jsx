import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useUI } from '../context/UIContext';
import api from '../services/api';
import { ShieldCheck, User, Phone, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FirstTimeSetup() {
  const { showToast } = useUI();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  // Watch password field to update strength indicator live
  const password = watch('password', '');
  useEffect(() => {
    setPasswordValue(password);
  }, [password]);

  // Check if setup is actually required
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await api.get('/auth/setup-status');
        if (response.data) {
          if (response.data.data.setupRequired) {
            // Clean stale storage if setup is active
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('sessionTimeout');
          } else {
            // If setup completed, redirect to login
            navigate('/admin/login');
          }
        }
      } catch (err) {
        console.error('Error checking setup status:', err);
      }
    };
    checkSetup();
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

  const strength = getPasswordStrength(passwordValue);

  // Form submit handler
  const onSubmit = async (data) => {
    if (strength.score < 3) {
      showToast('Please create a Strong password satisfying all policy criteria.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/setup', {
        name: data.name,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
        recoveryQuestion: data.recoveryQuestion,
        recoveryAnswer: data.recoveryAnswer
      });

      if (response.data && response.data.success) {
        // Clear setup state to force user to login manually
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('sessionTimeout');

        showToast('System Setup Complete! Administrator created successfully. Please login.', 'success');
        navigate('/admin/login');
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || 'Setup registration failed. Try again.';
      showToast(serverMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Checklist helper
  const criteriaChecklist = [
    { label: 'Minimum 8 characters', met: passwordValue.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(passwordValue) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(passwordValue) },
    { label: 'One numeric digit (0-9)', met: /[0-9]/.test(passwordValue) },
    { label: 'One special character (!@#$...)', met: /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue) }
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
          <div className="w-12 h-12 rounded bg-blue-600 flex items-center justify-center text-white font-extrabold shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              First-Time System Setup
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Initialize ANR Dairy ERP by creating your primary Administrator account.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Administrator Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                {...register('name', { required: 'Full name is required' })}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                placeholder="E.g. A.N. Ramulu"
              />
            </div>
            {errors.name && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.name.message}</p>
            )}
          </div>

          {/* Mobile Number */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Contact Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                {...register('phone', { 
                  required: 'Mobile number is required',
                  pattern: { value: /^[6-9]\d{9}$/, message: 'Must be a valid 10-digit number starting with 6-9' }
                })}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                placeholder="Enter 10-digit mobile"
              />
            </div>
            {errors.phone && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.phone.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Master Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', { required: 'Password is required' })}
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
            {errors.password && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.password.message}</p>
            )}
          </div>

          {/* Live Password Strength Meter */}
          {passwordValue && (
            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-dark-border rounded-md text-[11px] animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500">Password Strength:</span>
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

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: (value) => value === passwordValue || 'Passwords do not match'
                })}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                placeholder="••••••"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Security Question */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Security Recovery Question
            </label>
            <select
              {...register('recoveryQuestion', { required: 'Recovery question is required' })}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
            >
              <option value="">-- Select a Question --</option>
              <option value="What is the name of your first pet?">What is the name of your first pet?</option>
              <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
              <option value="What town or city were you born in?">What town or city were you born in?</option>
              <option value="What was the name of your first school?">What was the name of your first school?</option>
              <option value="What was your first car model?">What was your first car model?</option>
            </select>
            {errors.recoveryQuestion && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.recoveryQuestion.message}</p>
            )}
          </div>

          {/* Security Answer */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Recovery Answer
            </label>
            <input
              type="text"
              {...register('recoveryAnswer', { required: 'Recovery answer is required' })}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
              placeholder="Enter answer (case-insensitive)"
            />
            {errors.recoveryAnswer && (
              <p className="text-[10px] text-red-500 font-semibold">{errors.recoveryAnswer.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md shadow-sm transition"
          >
            {loading ? 'Initializing ERP...' : 'Complete ERP Setup'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
