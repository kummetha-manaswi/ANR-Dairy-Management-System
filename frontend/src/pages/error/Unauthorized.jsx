import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    if (user && user.role === 'farmer') {
      navigate('/farmer/login');
    } else {
      navigate('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700/50 p-8">
        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500 mx-auto mb-6">
          <Lock className="w-8 h-8" />
        </div>
        
        <h1 className="text-6xl font-black text-slate-800 dark:text-slate-100 mb-2">401</h1>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Unauthorized Access</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          Your credentials could not be verified, or your login session has expired. Please sign in again to access the portal.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleLoginRedirect}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/20"
          >
            Go to Login
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/40 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
