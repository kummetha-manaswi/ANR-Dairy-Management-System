import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusSquare, 
  History, 
  Users, 
  Calendar,
  Sun,
  Moon,
  Droplet,
  IndianRupee
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmployeeDashboard() {
  const [shift, setShift] = useState('Morning');
  const [dateTime, setDateTime] = useState(new Date());

  // Auto-detect shift and update clock on mount
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    
    const hour = new Date().getHours();
    if (hour >= 12) {
      setShift('Evening');
    } else {
      setShift('Morning');
    }

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Shift Greeting Header */}
      <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            {shift === 'Morning' ? (
              <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 text-blue-400" />
            )}
            <span>Active Shift: {shift}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Welcome, Shift Agent!
          </h1>
          <p className="text-xs text-slate-500">
            Select an action below to record daily milk intakes or query farmer profile registries.
          </p>
        </div>

        {/* Live Clock Card */}
        <div className="text-right bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-dark-border px-4 py-2 rounded-md">
          <p className="text-xs text-slate-400 font-semibold">{formatDate(dateTime)}</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono tracking-wide mt-0.5">
            {formatTime(dateTime)}
          </p>
        </div>
      </div>

      {/* Grid: Shift Quick metrics (Placeholders for Module 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Metric 1: Liters */}
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex items-center gap-4 opacity-85">
          <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Droplet className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shift Liters</p>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">0.0 L</h3>
          </div>
        </div>

        {/* Metric 2: Amount */}
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex items-center gap-4 opacity-85">
          <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <IndianRupee className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shift Value</p>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">₹0.00</h3>
          </div>
        </div>

        {/* Metric 3: Count */}
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex items-center gap-4 opacity-85">
          <div className="w-9 h-9 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Users className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deliveries</p>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">0</h3>
          </div>
        </div>

      </div>

      {/* Grid: Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Logger card */}
        <motion.div
          whileHover={{ y: -3 }}
          className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4 shadow-sm flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <PlusSquare className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Daily Milk Entry
            </h2>
            <p className="text-xs text-slate-500 leading-normal">
              Record daily farmer milk quantities, FAT, and SNF readings. Completely optimized for keyboard-only navigation.
            </p>
          </div>
          <Link
            to="/employee/collection-entry"
            className="inline-flex items-center justify-center w-full py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition"
          >
            Open Entry Sheet
          </Link>
        </motion.div>

        {/* History card */}
        <motion.div
          whileHover={{ y: -3 }}
          className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4 shadow-sm flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Shift Records History
            </h2>
            <p className="text-xs text-slate-500 leading-normal">
              Check all entries recorded during the current shift. Review and verify calculations before shift closing.
            </p>
          </div>
          <Link
            to="/employee/history"
            className="inline-flex items-center justify-center w-full py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-dark-border rounded-md transition"
          >
            Review Shift logs
          </Link>
        </motion.div>

        {/* Directory card */}
        <motion.div
          whileHover={{ y: -3 }}
          className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4 shadow-sm flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Farmers Directory
            </h2>
            <p className="text-xs text-slate-500 leading-normal">
              Look up active farmer accounts, IDs, contact numbers, shift preferences, and bank accounts.
            </p>
          </div>
          <Link
            to="/employee/farmers"
            className="inline-flex items-center justify-center w-full py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-dark-border rounded-md transition"
          >
            Open Directory
          </Link>
        </motion.div>

      </div>

    </div>
  );
}
