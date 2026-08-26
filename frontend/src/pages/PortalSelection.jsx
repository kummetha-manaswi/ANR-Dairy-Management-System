import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, UserCheck, ChevronLeft, ArrowRight, Droplet, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import logoCompact from '../assets/logo_compact.png';

export default function PortalSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-tr from-emerald-50/40 via-amber-50/10 to-teal-50/30 dark:from-[#0b0f19] dark:via-[#111726] dark:to-[#0f1524] text-slate-805 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300 relative overflow-hidden select-none">
      
      {/* Decorative organic shapes in background */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-emerald-100/30 to-teal-200/20 blur-3xl -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-amber-100/20 to-emerald-100/30 blur-3xl -z-10" />
      <div className="absolute top-[40%] left-[20%] w-72 h-72 rounded-full bg-emerald-50/10 dark:bg-emerald-950/5 blur-3xl -z-10" />

      {/* Floating Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <Link 
          to="/" 
          className="group inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-slate-650 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition hover:-translate-y-0.5 duration-200"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>

        {/* Dynamic Logo Branding */}
        <div className="flex items-center gap-2">
          <img 
            src={logoCompact} 
            alt="ANR Logo" 
            className="w-8 h-8 object-contain rounded-lg border border-slate-200 dark:border-slate-800"
          />
          <span className="font-black text-slate-800 dark:text-white text-sm tracking-tight">ANR Dairy</span>
        </div>
      </header>

      {/* Main Selection Area */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-12 z-10 max-w-4xl mx-auto w-full">
        
        {/* Intro */}
        <div className="text-center space-y-3 mb-12 max-w-lg">
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-150 dark:border-emerald-900/30 rounded-full text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-450 tracking-wider">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span>Unified Entry Gate</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Select Your Portal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Welcome to the ANR Dairy Management Platform. Please select the portal matching your role to sign in.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          
          {/* Admin Card */}
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-8 flex flex-col justify-between shadow-xl shadow-slate-100/50 dark:shadow-black/20 group relative overflow-hidden"
          >
            {/* Subtle light effect on hover */}
            <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />

            <div className="space-y-6">
              {/* Card Icon Header */}
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-405 flex items-center justify-center shadow-inner border border-emerald-100/50 dark:border-emerald-900/20">
                <Shield className="w-7 h-7" />
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  ADMIN PORTAL
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Manage farmers, milk collections, rates, billing, payments, reports and dairy operations.
                </p>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="mt-8">
              <button
                onClick={() => navigate('/admin/login')}
                className="w-full group/btn flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-2xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 transition duration-350 hover:-translate-y-0.5"
              >
                <span>Admin Login</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* Farmer Card */}
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-8 flex flex-col justify-between shadow-xl shadow-slate-100/50 dark:shadow-black/20 group relative overflow-hidden"
          >
            {/* Subtle light effect on hover */}
            <div className="absolute -inset-px bg-gradient-to-r from-amber-500/10 to-emerald-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />

            <div className="space-y-6">
              {/* Card Icon Header */}
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-405 flex items-center justify-center shadow-inner border border-amber-100/50 dark:border-amber-900/20">
                <UserCheck className="w-7 h-7" />
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  FARMER PORTAL
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  View milk collections, passbook, payments, profile and notifications.
                </p>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="mt-8">
              <button
                onClick={() => navigate('/farmer/login')}
                className="w-full group/btn flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-700 hover:to-emerald-700 rounded-2xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 transition duration-350 hover:-translate-y-0.5"
              >
                <span>Farmer Login</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

        </div>

      </main>

      {/* Subtle Footer */}
      <footer className="w-full py-6 text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium z-10 border-t border-slate-200/30 dark:border-slate-800/30">
        <p>© 2026 ANR Dairy Management System. All rights reserved.</p>
      </footer>

    </div>
  );
}
