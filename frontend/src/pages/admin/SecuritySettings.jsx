import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';
import { 
  changePassword, getActiveSessions, terminateSession, 
  logoutAllDevices, getLoginHistory, getAuditLogs 
} from '../../services/securityService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { 
  Lock, Shield, Key, History, Activity, AlertCircle, XCircle, 
  Smartphone, Monitor, Landmark, CheckCircle2, ShieldAlert, LogOut 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Strong password validator helper (matches Refinement 5)
const isStrongPassword = (password) => {
  if (!password) return false;
  if (password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return hasUpper && hasLower && hasDigit && hasSpecial;
};

export default function SecuritySettings() {
  const { showToast, showConfirm } = useUI();
  const [activeTab, setActiveTab] = useState('password');
  
  // Get current user profile details
  const user = JSON.parse(localStorage.getItem('user')) || { role: 'employee' };
  const isAdmin = user.role === 'admin';

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Sessions and History state
  const [sessions, setSessions] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [terminatingSessionId, setTerminatingSessionId] = useState(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const fetchSecurityData = async () => {
    setLoadingList(true);
    try {
      if (activeTab === 'sessions') {
        const res = await getActiveSessions();
        if (res && res.success) setSessions(res.data);
      } else if (activeTab === 'history') {
        const res = await getLoginHistory();
        if (res && res.success) setHistoryLogs(res.data);
      } else if (activeTab === 'audit' && isAdmin) {
        const res = await getAuditLogs();
        if (res && res.success) setAuditLogs(res.data);
      }
    } catch (error) {
      showToast('Failed to load security parameters', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [activeTab]);

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!currentPassword) errors.currentPassword = 'Current password is required';
    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (!isStrongPassword(newPassword)) {
      errors.newPassword = 'Password must be 8+ characters and contain uppercase, lowercase, number, and special character';
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors({});
    setUpdatingPassword(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res && res.success) {
        showToast('Password updated successfully. Other sessions terminated.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Current password check failed', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleTerminateSession = (sessionId, sessionName) => {
    // Refinement 10: Force logout individual session
    showConfirm({
      title: 'Force Logout Device?',
      message: `Are you sure you want to terminate session '${sessionName}'? The user on that device will be forced to log in again.`,
      onConfirm: async () => {
        setTerminatingSessionId(sessionId);
        try {
          const res = await terminateSession(sessionId);
          if (res && res.success) {
            showToast('Session terminated successfully', 'success');
            fetchSecurityData();
          }
        } catch (error) {
          showToast('Failed to terminate session', 'error');
        } finally {
          setTerminatingSessionId(null);
        }
      }
    });
  };

  const handleLogoutAllOther = () => {
    showConfirm({
      title: 'Logout All Other Devices?',
      message: 'Are you sure you want to terminate all active sessions except the current device? This forces re-login on all other browsers.',
      onConfirm: async () => {
        setLoggingOutAll(true);
        try {
          const res = await logoutAllDevices();
          if (res && res.success) {
            showToast('Successfully logged out of all other devices', 'success');
            fetchSecurityData();
          }
        } catch (error) {
          showToast('Logout all devices failed', 'error');
        } finally {
          setLoggingOutAll(false);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Breadcrumbs items={[{ label: 'System Settings' }, { label: 'Security & Access' }]} />
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <span>Security & Sessions Settings</span>
        </h1>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg overflow-hidden shadow-sm">
        <button
          onClick={() => setActiveTab('password')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'password'
              ? 'border-blue-600 text-blue-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
          }`}
        >
          <Key className="w-4.5 h-4.5" />
          <span>Update Password</span>
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'sessions'
              ? 'border-blue-600 text-blue-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
          }`}
        >
          <Activity className="w-4.5 h-4.5" />
          <span>Active Sessions</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
          }`}
        >
          <History className="w-4.5 h-4.5" />
          <span>Login History</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
            }`}
          >
            <ShieldAlert className="w-4.5 h-4.5" />
            <span>Audit Trail logs</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        
        {activeTab === 'password' && (
          /* TAB 1: Change password */
          <motion.div
            key="password-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-md mx-auto bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg p-6 shadow-sm space-y-6 text-xs"
          >
            <div className="border-b border-slate-100 dark:border-dark-border pb-3.5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Change Account Password</h3>
              <p className="text-slate-400">Regularly update your credentials to prevent unauthorized account access.</p>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                  placeholder="Enter current password"
                />
                {passwordErrors.currentPassword && <p className="text-[10px] text-red-500 font-bold">{passwordErrors.currentPassword}</p>}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                  placeholder="Enter strong new password"
                />
                {passwordErrors.newPassword && <p className="text-[10px] text-red-500 font-bold leading-normal">{passwordErrors.newPassword}</p>}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                  placeholder="Confirm new password"
                />
                {passwordErrors.confirmPassword && <p className="text-[10px] text-red-500 font-bold">{passwordErrors.confirmPassword}</p>}
              </div>

              <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded text-[10px] text-slate-500 leading-relaxed border border-slate-200 dark:border-dark-border">
                <p className="font-bold mb-1">Strong Password Validation Rules:</p>
                <ul className="list-disc pl-3.5 space-y-0.5">
                  <li>Minimum 8 characters length</li>
                  <li>At least 1 uppercase character (A-Z)</li>
                  <li>At least 1 lowercase character (a-z)</li>
                  <li>At least 1 numerical digit (0-9)</li>
                  <li>At least 1 symbol / special character</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-sm transition"
              >
                {updatingPassword ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          </motion.div>
        )}

        {activeTab === 'sessions' && (
          /* TAB 2: Active sessions list */
          <motion.div
            key="sessions-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 text-xs"
          >
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-4 rounded-lg shadow-sm flex justify-between items-center select-none">
              <div>
                <h3 className="font-bold text-slate-850 dark:text-slate-200">Manage Active Sessions</h3>
                <p className="text-slate-400 mt-0.5 text-[11px]">List of browsers currently logged into the ANR Dairy API.</p>
              </div>
              <button
                onClick={handleLogoutAllOther}
                disabled={loggingOutAll || loadingList}
                className="flex items-center gap-1.5 py-2 px-4 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 rounded-md transition select-none"
              >
                <LogOut className="w-4.5 h-4.5" />
                <span>Logout All Other Devices</span>
              </button>
            </div>

            {loadingList ? (
              <div className="h-44 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded flex items-center justify-center text-slate-400">
                Loading active sessions...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessions.map((sess) => {
                  const isDesktop = sess.deviceInfo === 'Desktop';
                  return (
                    <div 
                      key={sess._id} 
                      className="border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg p-5 flex items-start gap-4 shadow-sm"
                    >
                      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 shrink-0">
                        {isDesktop ? <Monitor className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {sess.browser} on {sess.deviceInfo}
                          </h4>
                          {sess.ipAddress === '127.0.0.1' ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-full text-[8px] font-bold uppercase border border-emerald-100 dark:border-transparent">Current</span>
                          ) : null}
                        </div>
                        <p className="text-slate-400 leading-relaxed font-semibold">IP Address: {sess.ipAddress}</p>
                        <p className="text-slate-450 leading-relaxed">Login Time: {new Date(sess.loginTime).toLocaleString()}</p>
                        <p className="text-slate-450 leading-relaxed">Last Activity: {new Date(sess.lastActivity).toLocaleTimeString()}</p>
                        {isAdmin && sess.user && (
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase pt-1">User: {sess.user.name} ({sess.user.role})</p>
                        )}
                        
                        {/* Refinement 10: Terminate individual session */}
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => handleTerminateSession(sess._id, `${sess.browser} (${sess.ipAddress})`)}
                            disabled={terminatingSessionId === sess._id}
                            className="px-2.5 py-1 text-[10px] font-bold border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/15 rounded transition flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{terminatingSessionId === sess._id ? 'Terminating...' : 'Force Logout'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          /* TAB 3: Login history */
          <motion.div
            key="history-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg shadow-sm text-xs"
          >
            <div className="p-4 border-b border-slate-100 dark:border-dark-border">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Device Login History</h3>
              <p className="text-slate-400 text-[10px] mt-0.5">Chronological record of recent logins and session statuses.</p>
            </div>

            {loadingList ? (
              <div className="p-12 text-center text-slate-400">Loading history...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-dark-border text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      {isAdmin && <th className="p-4">User</th>}
                      <th className="p-4">Browser & Device</th>
                      <th className="p-4">IP Address</th>
                      <th className="p-4">Login Time</th>
                      <th className="p-4">Logout / Terminated Time</th>
                      <th className="p-4">Session Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-350">
                    {historyLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-55/35">
                        {isAdmin && (
                          <td className="p-4 font-bold text-slate-850 dark:text-slate-200">
                            {log.user ? log.user.name : 'Deleted'}
                          </td>
                        )}
                        <td className="p-4 font-semibold">
                          {log.browser} ({log.deviceInfo})
                        </td>
                        <td className="p-4 font-mono font-semibold text-slate-500">{log.ipAddress}</td>
                        <td className="p-4 text-slate-500">{new Date(log.loginTime).toLocaleString()}</td>
                        <td className="p-4 text-slate-500">
                          {log.logoutTime ? new Date(log.logoutTime).toLocaleString() : log.isActive ? 'Active Session' : 'Ended'}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            log.isActive 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' 
                              : 'bg-slate-50 text-slate-500 dark:bg-slate-800/35'
                          }`}>
                            {log.isActive ? 'Active' : 'Offline'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'audit' && isAdmin && (
          /* TAB 4: Audit trails */
          <motion.div
            key="audit-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg shadow-sm text-xs"
          >
            <div className="p-4 border-b border-slate-100 dark:border-dark-border">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">System Security Audit Log</h3>
              <p className="text-slate-400 text-[10px] mt-0.5">Immutable audit trails of settings, user operations, and updates.</p>
            </div>

            {loadingList ? (
              <div className="p-12 text-center text-slate-400">Loading audit log...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-dark-border text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Initiated By</th>
                      <th className="p-4">Security Action</th>
                      <th className="p-4">Target Table</th>
                      <th className="p-4">Audit Description / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-350">
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-55/35">
                        <td className="p-4 font-semibold text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          {log.user ? (
                            <div>
                              <p className="font-bold text-slate-850 dark:text-slate-200 leading-none mb-0.5">{log.user.name}</p>
                              <span className="text-[9px] text-slate-400 font-bold uppercase">{log.user.role}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">System</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-450">{log.collectionTarget}</td>
                        <td className="p-4 font-medium text-slate-700 dark:text-slate-300 max-w-sm leading-relaxed whitespace-pre-wrap">
                          {log.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
