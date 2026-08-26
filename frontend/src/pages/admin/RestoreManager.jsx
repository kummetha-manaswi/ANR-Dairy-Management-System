import React, { useState } from 'react';
import { useUI } from '../../context/UIContext';
import { parseBackupMetadata, restoreDatabase } from '../../services/backupService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { 
  DatabaseBackup, Upload, FileJson, AlertTriangle, ShieldCheck, 
  RefreshCw, CheckCircle2, ChevronRight, FileText 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RestoreManager() {
  const { showToast, showConfirm } = useUI();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [confirmedOverWrite, setConfirmedOverWrite] = useState(false);
  
  // Restore Result display state
  const [restoreResult, setRestoreResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      showToast('Invalid file format. Please select a .json database backup file.', 'error');
      return;
    }

    setSelectedFile(file);
    setMetadata(null);
    setRestoreResult(null);
    setConfirmedOverWrite(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      setFileContent(text);
      
      // Parse file on upload to fetch metadata details
      setParsing(true);
      try {
        const res = await parseBackupMetadata(text);
        if (res && res.success) {
          setMetadata(res.data);
          showToast('Backup file parsed successfully. Verify details below.', 'success');
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to parse backup metadata. Ensure it is a valid ANR backup file.', 'error');
        setSelectedFile(null);
        setFileContent('');
      } finally {
        setParsing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!metadata) return;
    if (!confirmedOverWrite) {
      showToast('Please check the confirmation box acknowledging data overwrite', 'warning');
      return;
    }

    // Refinement 6: Display confirmation dialog warning of overwrite
    showConfirm({
      title: 'CRITICAL: Confirm Database Overwrite?',
      message: 'WARNING: Proceeding will completely erase your current database tables (farmers, collections, payments, etc.) and replace them with this backup. An automatic safety backup will be created first. Do you want to proceed?',
      onConfirm: async () => {
        setRestoring(true);
        try {
          // Send content and confirmation flag
          const res = await restoreDatabase(fileContent, true);
          if (res && res.success) {
            showToast('Database restored successfully', 'success');
            setRestoreResult(res.data);
            // Clear inputs
            setSelectedFile(null);
            setFileContent('');
            setMetadata(null);
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Database restore failed', 'error');
        } finally {
          setRestoring(false);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Breadcrumbs items={[{ label: 'System Settings' }, { label: 'Restore Manager' }]} />
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <DatabaseBackup className="w-6 h-6 text-blue-600" />
          <span>Database Restore Portal</span>
        </h1>
      </div>

      <div className="max-w-3xl mx-auto space-y-6 text-xs text-slate-700 dark:text-slate-350">
        
        {/* Upload Container Card */}
        <div className="border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface p-8 rounded-lg shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600 dark:text-brand-400">
            <Upload className="w-8 h-8" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Upload Backup File
            </h3>
            <p className="text-slate-400">
              Select a previously exported JSON backup file from your local storage to restore.
            </p>
          </div>

          <label className="flex items-center gap-2 py-2.5 px-6 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer transition shadow-sm select-none">
            <FileJson className="w-4 h-4" />
            <span>{parsing ? 'Reading File...' : 'Select JSON File'}</span>
            <input 
              type="file" 
              accept=".json,application/json" 
              className="hidden" 
              onChange={handleFileChange}
              disabled={parsing || restoring}
            />
          </label>
        </div>

        {/* Restore Result Card (on success) */}
        <AnimatePresence>
          {restoreResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="border border-emerald-200 bg-emerald-50/25 p-6 rounded-lg space-y-4"
            >
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1.5 border-b border-emerald-100 pb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Database Successfully Restored!</span>
              </h3>
              
              <div className="space-y-2">
                {/* Refinement 1: Inform safety backup created */}
                <p>
                  Current database was safely stored in a temporary backup archive:
                  <strong className="block font-mono text-[10px] text-slate-800 bg-white p-2 border border-slate-200 rounded mt-1">{restoreResult.safetyBackupCreated}</strong>
                </p>
                
                <h4 className="font-bold text-emerald-900 pt-1">Imported Records Summary:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.keys(restoreResult.restoredRecords || {}).map(key => (
                    <div key={key} className="bg-white border border-slate-100 p-2.5 rounded text-center">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{key}</p>
                      <p className="text-sm font-black text-slate-800">{restoreResult.restoredRecords[key]} docs</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metadata Details panel */}
        <AnimatePresence>
          {metadata && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm space-y-6"
            >
              <div className="border-b border-slate-100 dark:border-dark-border pb-3.5 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center gap-1">
                  <FileText className="w-4.5 h-4.5 text-blue-500" />
                  <span>Backup File Properties</span>
                </h3>
                <span className="text-[10px] bg-slate-105 border border-slate-200 px-2 py-0.5 rounded font-mono text-slate-500">
                  {selectedFile?.name}
                </span>
              </div>

              {/* Version & Compatibility Details (Refinement 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100 dark:border-dark-border pb-4">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Backup Timestamp</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{new Date(metadata.backupDate).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Application Compatibility</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">v{metadata.appVersion || '1.0.0'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Backup Version Schema</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">v{metadata.backupVersion || '1.0.0'}</p>
                </div>
              </div>

              {/* Records distribution */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Table Documents Breakdown:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  {Object.keys(metadata.recordCounts || {}).map((colName) => (
                    <div key={colName} className="p-2 border border-slate-200 dark:border-dark-border rounded bg-slate-50/45 dark:bg-slate-900/10">
                      <p className="text-[9px] font-bold text-slate-450 uppercase">{colName}</p>
                      <p className="text-base font-black text-slate-700 dark:text-slate-300 mt-0.5">
                        {metadata.recordCounts[colName]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refinement 6: Overwrite Warning Box */}
              <div className="border border-amber-300 bg-amber-50/30 dark:bg-amber-950/15 rounded-lg p-4 flex gap-3.5">
                <AlertTriangle className="w-10 h-10 text-amber-600 shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-bold text-amber-800 dark:text-amber-400">Confirmation Required to Overwrite</h4>
                  <p className="leading-relaxed">
                    Executing this restore operation will completely delete and replace your current database tables (all collections will be cleared and replaced by the lists inside the selected file).
                  </p>
                  
                  <label className="flex items-center gap-2 select-none cursor-pointer pt-1">
                    <input 
                      type="checkbox"
                      checked={confirmedOverWrite}
                      onChange={(e) => setConfirmedOverWrite(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      I acknowledge that current database data will be overwritten.
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-dark-border">
                <button
                  onClick={handleExecuteRestore}
                  disabled={restoring || !confirmedOverWrite}
                  className="flex items-center justify-center gap-2 py-3 px-6 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition shadow-md w-full sm:w-auto select-none"
                >
                  <RefreshCw className={`w-4 h-4 ${restoring ? 'animate-spin' : ''}`} />
                  <span>{restoring ? 'Restoring Database...' : 'Launch Database Restore'}</span>
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
