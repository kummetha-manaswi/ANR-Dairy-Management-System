import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';
import { useTranslation } from 'react-i18next';
import { getUsers, createUser, updateUser, toggleUserStatus, resetPassword } from '../../services/userService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { 
  Users, UserPlus, Edit2, Lock, Unlock, Key, Trash2, Search, 
  ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, XCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Password validator helper (matches backend Refinement 5)
const isStrongPassword = (password) => {
  if (!password) return false;
  if (password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return hasUpper && hasLower && hasDigit && hasSpecial;
};

export default function UserManagement() {
  const { showToast, showConfirm } = useUI();
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [userModal, setUserModal] = useState({ open: false, mode: 'create', data: null });
  const [passwordModal, setPasswordModal] = useState({ open: false, userId: null, userName: '' });

  // Form states
  const [formData, setFormData] = useState({ name: '', phone: '', password: '', role: 'employee' });
  const [newPassword, setNewPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      if (response && response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      showToast('Failed to fetch user accounts directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setFormData({ name: '', phone: '', password: '', role: 'employee' });
    setFormErrors({});
    setUserModal({ open: true, mode: 'create', data: null });
  };

  const handleOpenEdit = (user) => {
    setFormData({ name: user.name, phone: user.phone, password: '', role: user.role });
    setFormErrors({});
    setUserModal({ open: true, mode: 'edit', data: user });
  };

  const handleOpenResetPassword = (user) => {
    setNewPassword('');
    setFormErrors({});
    setPasswordModal({ open: true, userId: user._id, userName: user.name });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      errors.phone = 'Please provide a valid 10-digit number';
    }

    if (userModal.mode === 'create') {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (!isStrongPassword(formData.password)) {
        errors.password = 'Must be 8+ chars and contain uppercase, lowercase, number, and special character';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (userModal.mode === 'create') {
        const res = await createUser(formData);
        if (res && res.success) {
          showToast('User account successfully registered', 'success');
          setUserModal({ open: false, mode: 'create', data: null });
          fetchUsers();
        }
      } else {
        const { name, phone, role } = formData;
        const res = await updateUser(userModal.data._id, { name, phone, role });
        if (res && res.success) {
          showToast('User account successfully updated', 'success');
          setUserModal({ open: false, mode: 'edit', data: null });
          fetchUsers();
        }
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Error occurred while saving user data', 'error');
    }
  };

  const handleToggleStatus = (user, currentStatus) => {
    // Determine target next statuses
    const targetStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    showConfirm({
      title: `${targetStatus === 'active' ? 'Reactivate' : 'Deactivate'} User Account?`,
      message: `Are you sure you want to change ${user.name}'s account status from ${currentStatus} to ${targetStatus}?`,
      onConfirm: async () => {
        try {
          const res = await toggleUserStatus(user._id, targetStatus);
          if (res && res.success) {
            showToast(`User successfully ${targetStatus === 'active' ? 'reactivated' : 'deactivated'}`, 'success');
            fetchUsers();
          }
        } catch (error) {
          showToast(error.response?.data?.message || 'Failed to toggle status', 'error');
        }
      }
    });
  };

  // Refinement 3: Toggle Suspended status option
  const handleSuspendUser = (user, currentStatus) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    showConfirm({
      title: `${nextStatus === 'suspended' ? 'Suspend' : 'Unsuspend'} User Account?`,
      message: `Are you sure you want to mark ${user.name} as ${nextStatus}? Suspended users are locked out of all devices immediately.`,
      onConfirm: async () => {
        try {
          const res = await toggleUserStatus(user._id, nextStatus);
          if (res && res.success) {
            showToast(`User account status updated to ${nextStatus}`, 'success');
            fetchUsers();
          }
        } catch (error) {
          showToast(error.response?.data?.message || 'Failed to suspend user', 'error');
        }
      }
    });
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setFormErrors({ newPassword: 'Password is required' });
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setFormErrors({ newPassword: 'Password must be 8+ characters and contain uppercase, lowercase, number, and special character.' });
      return;
    }

    try {
      const res = await resetPassword(passwordModal.userId, newPassword);
      if (res && res.success) {
        showToast(`Password for ${passwordModal.userName} reset successfully`, 'success');
        setPasswordModal({ open: false, userId: null, userName: '' });
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to reset password', 'error');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex flex-col gap-2">
          <Breadcrumbs items={[{ label: 'System Administration' }, { label: 'User Directory' }]} />
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            User Account Management
          </h1>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 py-2 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full max-w-xs text-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-250 dark:border-dark-border rounded-md text-slate-700 dark:text-slate-200"
            placeholder="Search users by name, phone..."
          />
        </div>
        <span className="text-[10px] text-slate-400 font-bold uppercase select-none">
          Total Users: {users.length}
        </span>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="h-64 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg flex items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
          <p className="font-semibold">Loading user accounts...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="h-64 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg flex flex-col items-center justify-center text-slate-400">
          <Users className="w-12 h-12 text-slate-300 mb-2" />
          <p className="font-bold">No user accounts found</p>
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-dark-border text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">User Details</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4">Security Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-350">
                {filteredUsers.map((user) => {
                  const roleColors = {
                    admin: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30',
                    employee: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30'
                  };
                  const statusColors = {
                    active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400',
                    inactive: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400',
                    suspended: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400'
                  };
                  return (
                    <tr key={user._id} className="hover:bg-slate-55/40 dark:hover:bg-slate-800/10">
                      <td className="p-4 font-bold text-slate-850 dark:text-slate-200">
                        {user.name}
                      </td>
                      <td className="p-4 font-semibold font-mono">{user.phone}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 border rounded-full font-bold uppercase text-[9px] ${roleColors[user.role]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 border rounded-full font-bold uppercase text-[9px] ${statusColors[user.status]}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2.5">
                        {/* Edit details */}
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 rounded"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* Reset Password */}
                        <button
                          onClick={() => handleOpenResetPassword(user)}
                          className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 rounded"
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5 text-blue-500" />
                        </button>

                        {/* Suspend Toggle (Refinement 3) */}
                        <button
                          onClick={() => handleSuspendUser(user, user.status)}
                          className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 rounded"
                          title={user.status === 'suspended' ? 'Unsuspend Account' : 'Suspend Account'}
                        >
                          <ShieldAlert className={`w-3.5 h-3.5 ${user.status === 'suspended' ? 'text-emerald-500' : 'text-amber-500'}`} />
                        </button>

                        {/* Deactivate/Reactivate */}
                        <button
                          onClick={() => handleToggleStatus(user, user.status)}
                          disabled={user.status === 'suspended'}
                          className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 rounded disabled:opacity-40"
                          title={user.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {user.status === 'active' ? (
                            <Lock className="w-3.5 h-3.5 text-red-500" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Add / Edit User */}
      <AnimatePresence>
        {userModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUserModal({ open: false, mode: 'create', data: null })}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4 z-10 text-xs"
            >
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-150 pb-2 border-b border-slate-100 dark:border-dark-border">
                {userModal.mode === 'create' ? 'Register New User' : 'Modify User Details'}
              </h3>

              <form onSubmit={handleSaveUser} className="space-y-3.5">
                
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">User Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                    placeholder="E.g., Ramu"
                  />
                  {formErrors.name && <p className="text-[10px] text-red-500 font-bold">{formErrors.name}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Mobile Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                    placeholder="10 digit number"
                  />
                  {formErrors.phone && <p className="text-[10px] text-red-500 font-bold">{formErrors.phone}</p>}
                </div>

                {userModal.mode === 'create' && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase tracking-wider">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                      placeholder="Strong password"
                    />
                    {formErrors.password && <p className="text-[10px] text-red-500 font-bold leading-normal">{formErrors.password}</p>}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Security Access Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                  >
                    <option value="employee">Employee (Milk entry, Reports)</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-dark-border pt-4">
                  <button
                    type="button"
                    onClick={() => setUserModal({ open: false, mode: 'create', data: null })}
                    className="px-3.5 py-2 font-semibold border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-650 hover:bg-slate-50 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm"
                  >
                    Save User
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Reset Password */}
      <AnimatePresence>
        {passwordModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPasswordModal({ open: false, userId: null, userName: '' })}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-2xl max-w-sm w-full p-6 space-y-4 z-10 text-xs"
            >
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-150 pb-2 border-b border-slate-100 dark:border-dark-border">
                Reset Password for {passwordModal.userName}
              </h3>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                    placeholder="Enter new strong password"
                  />
                  {formErrors.newPassword && <p className="text-[10px] text-red-500 font-bold leading-normal">{formErrors.newPassword}</p>}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded p-3 text-[10px] text-slate-500 leading-normal">
                  <p className="font-bold mb-1">Strong Password Requirements:</p>
                  <ul className="list-disc pl-3.5 space-y-0.5">
                    <li>Minimum 8 characters length</li>
                    <li>At least 1 uppercase letter (A-Z)</li>
                    <li>At least 1 lowercase letter (a-z)</li>
                    <li>At least 1 numerical digit (0-9)</li>
                    <li>At least 1 special character (e.g. !@#$)</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-dark-border pt-4">
                  <button
                    type="button"
                    onClick={() => setPasswordModal({ open: false, userId: null, userName: '' })}
                    className="px-3.5 py-2 font-semibold border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-655 hover:bg-slate-50 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm"
                  >
                    Confirm Reset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
