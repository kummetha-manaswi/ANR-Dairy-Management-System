import React from 'react';
import { ServerCrash } from 'lucide-react';

export default function ServerError() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700/50 p-8">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500 mx-auto mb-6">
          <ServerCrash className="w-8 h-8" />
        </div>
        
        <h1 className="text-6xl font-black text-slate-800 dark:text-slate-100 mb-2">500</h1>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Internal Server Error</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          The server encountered an unexpected error and was unable to complete your request. This may be due to a brief database connection drop.
        </p>

        <button
          onClick={handleReload}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/20"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}
