import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';
import { getBackupLogs, createManualBackup, getDownloadUrl } from '../../services/backupService';
import { getDairyProfile, updateDairyProfile } from '../../services/dairyService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { 
  Database, RefreshCw, HardDrive, Download, AlertCircle, 
  Settings, Clock, ShieldCheck, CheckCircle2, XCircle, Sparkles 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function BackupManager() {
  const { showToast } = useUI();
  const [logs, setLogs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Form settings states
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [backupRetentionDays, setBackupRetentionDays] = useState(30);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, profRes] = await Promise.all([
        getBackupLogs(),
        getDairyProfile()
      ]);
      if (logsRes && logsRes.success) setLogs(logsRes.data);
      if (profRes && profRes.success && profRes.data) {
        setProfile(profRes.data);
        setBackupFrequency(profRes.data.backupFrequency || 'daily');
        setBackupRetentionDays(profRes.data.backupRetentionDays || 30);
      }
    } catch (error) {
      showToast('Failed to load backup manager data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await createManualBackup();
      if (res && res.success) {
        showToast('Database backup archive created successfully', 'success');
        fetchData();
      }
    } catch (error) {
      showToast('Failed to create manual backup file', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await updateDairyProfile({
        backupFrequency,
        backupRetentionDays,
        reason: 'Modified database auto backup policies and retention days settings'
      });
      if (res && res.success) {
        showToast('Backup configurations saved successfully', 'success');
        setProfile(res.data);
      }
    } catch (error) {
      showToast('Failed to update backup scheduler settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex flex-col gap-2">
          <Breadcrumbs items={[{ label: 'System Settings' }, { label: 'Backup Manager' }]} />
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            <span>Database Backup Manager</span>
          </h1>
        </div>
        
        <button
          onClick={handleCreateBackup}
          disabled={creating || loading}
          className="flex items-center gap-2 py-2 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition shadow-sm"
        >
          <HardDrive className="w-4 h-4" />
          <span>{creating ? 'Creating Backup...' : 'Backup Current Database'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings Block (Left side) */}
        <div className="lg:col-span-1 space-y-6">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm space-y-4 text-xs"
          >
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 pb-2.5 border-b border-slate-100 dark:border-dark-border flex items-center gap-1.5">
              <Settings className="w-4.5 h-4.5 text-blue-500" />
              <span>Auto Backup Preferences</span>
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider">Scheduled Frequency</label>
                <select
                  value={backupFrequency}
                  onChange={(e) => setBackupFrequency(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-700 dark:text-slate-202"
                >
                  <option value="disabled">Disabled (No Auto Backups)</option>
                  <option value="manual-only">Manual Only (Refinement 8)</option>
                  <option value="daily">Daily Auto Backup</option>
                  <option value="weekly">Weekly Auto Backup</option>
                  <option value="monthly">Monthly Auto Backup</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider">Retention Days (Cleanup Policy)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={backupRetentionDays}
                  onChange={(e) => setBackupRetentionDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-700 dark:text-slate-202 font-semibold"
                />
                <span className="text-[9px] text-slate-400">Backups older than this count of days are automatically deleted.</span>
              </div>

              <button
                type="submit"
                disabled={savingSettings || loading}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-brand-400 dark:hover:bg-blue-900/30 rounded-md font-bold transition text-xs"
              >
                <span>{savingSettings ? 'Saving...' : 'Save Backup Schedule'}</span>
              </button>
            </form>
          </motion.div>

          <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-dark-border rounded-lg p-5 text-xs text-slate-500 leading-relaxed space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>JSON Backup Archive</span>
            </h4>
            <p>
              Backups are exported in standard JSON files. This file contains complete tables of Users, Farmers, Invoices, Collection Records, Payments, and Audit Logs.
            </p>
            <p className="font-bold text-blue-600">
              Note: You can download and save these files safely off-site. Only authenticated Administrators can restore backups onto the server database.
            </p>
          </div>

        </div>

        {/* Backup History list (Right side) */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg shadow-sm"
          >
            <div className="p-4 border-b border-slate-100 dark:border-dark-border flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4.5 h-4.5 text-blue-500" />
                <span>Backup History Logs</span>
              </h3>
              <button
                onClick={fetchData}
                className="p-1.5 text-slate-450 hover:bg-slate-55 rounded dark:hover:bg-slate-800"
                title="Refresh logs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p>Loading database backup history...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold">No backups recorded yet</p>
                <p className="text-xs text-slate-400">Trigger a manual backup or wait for the automatic scheduler to run.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-dark-border text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Backup Date</th>
                      <th className="p-4">File Name</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">File Size</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-350">
                    {logs.map((log) => {
                      const typeColors = {
                        Manual: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400',
                        Scheduled: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400',
                        Safety: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400'
                      };
                      return (
                        <tr key={log._id} className="hover:bg-slate-55/30">
                          <td className="p-4 font-semibold">
                            {new Date(log.backupDate).toLocaleString()}
                          </td>
                          <td className="p-4 font-mono text-[10px] text-slate-450 truncate max-w-[200px]" title={log.filename}>
                            {log.filename}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 border rounded-full font-bold text-[8px] uppercase ${typeColors[log.backupType] || ''}`}>
                              {log.backupType}
                            </span>
                          </td>
                          <td className="p-4 font-semibold font-mono">
                            {log.status === 'Success' ? formatBytes(log.fileSize) : '-'}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 font-bold text-[9px]">
                              {log.status === 'Success' ? (
                                <span className="text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Success</span>
                                </span>
                              ) : (
                                <span className="text-red-500 flex items-center gap-1" title={log.errorMessage}>
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Failed</span>
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {log.status === 'Success' && (
                              <a
                                href={getDownloadUrl(log.filename)}
                                download
                                className="inline-flex items-center gap-1.5 py-1 px-3 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-brand-400 dark:hover:bg-blue-900/30 rounded font-bold"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download</span>
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>

      </div>

    </div>
  );
}
