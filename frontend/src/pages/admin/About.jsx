import React, { useState, useEffect } from 'react';
import { getSystemInfo } from '../../services/dairyService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { 
  Info, Cpu, Terminal, Activity, Users, History, 
  Database, ShieldCheck, Heart, RefreshCw 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function About() {
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const res = await getSystemInfo();
      if (res && res.success) {
        setSystemInfo(res.data);
      }
    } catch (error) {
      console.error('Failed to load system details', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex flex-col gap-2">
          <Breadcrumbs items={[{ label: 'System Administration' }, { label: 'About System' }]} />
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-600" />
            <span>About & System Information</span>
          </h1>
        </div>

        <button
          onClick={fetchInfo}
          disabled={loading}
          className="p-2 border border-slate-205 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition text-slate-500"
          title="Refresh statistics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="h-64 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg flex items-center justify-center text-slate-400">
          <p className="font-semibold">Loading system metadata...</p>
        </div>
      ) : !systemInfo ? (
        <div className="h-64 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg flex items-center justify-center text-red-500 font-bold">
          Failed to fetch system operational data.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-650 dark:text-slate-350">
          
          {/* Left card: Software specifications */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="border border-slate-205 dark:border-dark-border bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm space-y-6"
          >
            <div className="border-b border-slate-100 dark:border-dark-border pb-3.5 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Application Parameters</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Application Name</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{systemInfo.appName}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Core Version</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">v{systemInfo.appVersion}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Build Release ID</p>
                <p className="font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">{systemInfo.buildVersion}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Software Architect</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">ANR Engineering Group</p>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-dark-border pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Backend Gateway Status</span>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] border ${
                  systemInfo.backendStatus === 'operational'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {systemInfo.backendStatus}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Database Connection</span>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] border ${
                  systemInfo.databaseStatus === 'connected'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {systemInfo.databaseStatus}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right card: Data Metrics & Backups */}
          <div className="space-y-6">
            
            {/* Database Metrics */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="border border-slate-205 dark:border-dark-border bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm space-y-4"
            >
              <div className="border-b border-slate-100 dark:border-dark-border pb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Database Record Metrics</h3>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 border border-slate-100 dark:border-dark-border rounded bg-slate-50/50 dark:bg-slate-900/10">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Farmers</p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">{systemInfo.totalRecords.farmers}</p>
                </div>
                <div className="p-2 border border-slate-100 dark:border-dark-border rounded bg-slate-50/50 dark:bg-slate-900/10">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Collections</p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">{systemInfo.totalRecords.collections}</p>
                </div>
                <div className="p-2 border border-slate-100 dark:border-dark-border rounded bg-slate-50/50 dark:bg-slate-900/10">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Invoices</p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">{systemInfo.totalRecords.invoices}</p>
                </div>
              </div>
            </motion.div>

            {/* Last Backup metadata */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-slate-205 dark:border-dark-border bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm space-y-4"
            >
              <div className="border-b border-slate-100 dark:border-dark-border pb-3 flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Last Backup Archive</h3>
              </div>

              {systemInfo.lastBackup ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-400">Backup Date:</span>
                    <span className="font-bold text-slate-850 dark:text-slate-200">
                      {new Date(systemInfo.lastBackup.date).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-400">Trigger Type:</span>
                    <span className="font-bold text-indigo-600 dark:text-brand-400 uppercase">
                      {systemInfo.lastBackup.type}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-100 dark:border-dark-border">
                    <span className="font-semibold text-slate-400 text-[10px] uppercase">Backup Filename:</span>
                    <span className="font-mono text-[10px] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/30 p-2 border border-slate-200 dark:border-dark-border rounded truncate">
                      {systemInfo.lastBackup.filename}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-4">No database backups recorded on the server yet.</p>
              )}
            </motion.div>

          </div>

          {/* Footer branding */}
          <div className="md:col-span-2 text-center text-slate-400 pt-4 flex items-center justify-center gap-1">
            <span>Powered by ANR SaaS ERP. Built with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
            <span>for dairy management excellence.</span>
          </div>

        </div>
      )}

    </div>
  );
}
