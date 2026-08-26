import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function AccessDenied() {
  const navigate = useNavigate();

  const handleReturn = () => {
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const role = user ? user.role : '';
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else if (role === 'employee') {
      navigate('/employee/dashboard');
    } else if (role === 'farmer') {
      navigate('/farmer/dashboard');
    } else {
      navigate('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700/50 p-8">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500 mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <h1 className="text-6xl font-black text-slate-800 dark:text-slate-100 mb-2">403</h1>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Access Denied</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          You do not have the required permissions to view this page. This portal is restricted to authorized administrative users only.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleReturn}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/20"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => {
              const userJson = localStorage.getItem('user');
              const user = userJson ? JSON.parse(userJson) : null;
              const isFarmer = user && user.role === 'farmer';
              localStorage.clear();
              navigate(isFarmer ? '/farmer/login' : '/admin/login');
            }}
            className="w-full py-3 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition"
          >
            Sign Out & Switch Accounts
          </button>
        </div>
      </div>
    </div>
  );
}
