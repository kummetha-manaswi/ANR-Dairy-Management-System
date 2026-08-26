import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  const handleReturn = () => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const role = user ? user.role : '';
    if (!token) {
      navigate('/');
    } else if (role === 'admin') {
      navigate('/admin/dashboard');
    } else if (role === 'employee') {
      navigate('/employee/dashboard');
    } else if (role === 'farmer') {
      navigate('/farmer/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700/50 p-8">
        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500 mx-auto mb-6">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>
        
        <h1 className="text-6xl font-black text-slate-800 dark:text-slate-100 mb-2">404</h1>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Page Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          The link you followed may be broken, or the page has been moved. Let's get you back to safe territory.
        </p>

        <button
          onClick={handleReturn}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/20"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
