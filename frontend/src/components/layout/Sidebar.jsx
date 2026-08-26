import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Activity, 
  PlusSquare, 
  History, 
  FolderLock,
  FileText,
  CreditCard,
  FileSpreadsheet,
  BookOpen,
  TrendingUp,
  MessageSquare,
  Shield,
  Database,
  RotateCcw,
  Info,
  UserCheck
} from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useTranslation } from 'react-i18next';
import logoCompact from '../../assets/logo_compact.png';

export default function Sidebar() {
  const { sidebarOpen } = useUI();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Get user profile details from localStorage
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User', role: 'employee' };
  const isAdmin = user.role === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition duration-150 ${
      isActive
        ? 'bg-blue-50 dark:bg-blue-955/30 text-blue-600 dark:text-brand-400 border border-blue-100 dark:border-blue-900/30'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
    }`;

  if (!sidebarOpen) return null;

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface flex flex-col h-screen fixed left-0 top-0 z-30 transition-all duration-200">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-dark-border gap-2.5">
        <img 
          src={logoCompact} 
          alt="ANR Dairy Logo" 
          className="w-8 h-8 object-contain rounded-lg border border-slate-200 dark:border-slate-700/30"
        />
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200 leading-none">
            ANR Dairy
          </h2>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            SaaS ERP v1.0.0
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {isAdmin ? (
          /* Admin Specific Links */
          <>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 select-none">
              {t('adminPortal')}
            </div>
            <NavLink to="/admin/dashboard" className={navItemClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('dashboard')}</span>
            </NavLink>
            <NavLink to="/admin/farmers" className={navItemClass}>
              <Users className="w-4 h-4" />
              <span>{t('farmers')}</span>
            </NavLink>
            <NavLink to="/admin/rates" className={navItemClass}>
              <FolderLock className="w-4 h-4" />
              <span>{t('rateManagement')}</span>
            </NavLink>
            <NavLink to="/admin/collections" className={navItemClass}>
              <Activity className="w-4 h-4" />
              <span>{t('milkCollections')}</span>
            </NavLink>
            <NavLink to="/admin/invoices" className={navItemClass}>
              <FileText className="w-4 h-4" />
              <span>{t('billingInvoices')}</span>
            </NavLink>
            <NavLink to="/admin/payments" className={navItemClass}>
              <CreditCard className="w-4 h-4" />
              <span>{t('paymentsLedger')}</span>
            </NavLink>
            <NavLink to="/admin/reports" className={navItemClass}>
              <FileSpreadsheet className="w-4 h-4" />
              <span>{t('systemReports')}</span>
            </NavLink>
            <NavLink to="/admin/passbook" className={navItemClass}>
              <BookOpen className="w-4 h-4" />
              <span>{t('farmerPassbook')}</span>
            </NavLink>
            <NavLink to="/admin/analytics" className={navItemClass}>
              <TrendingUp className="w-4 h-4" />
              <span>{t('operationsAnalytics')}</span>
            </NavLink>
            <NavLink to="/admin/communication" className={navItemClass}>
              <MessageSquare className="w-4 h-4" />
              <span>{t('communicationCenter')}</span>
            </NavLink>
            <NavLink to="/admin/users" className={navItemClass}>
              <UserCheck className="w-4 h-4" />
              <span>{t('userDirectory')}</span>
            </NavLink>
            <NavLink to="/admin/backup" className={navItemClass}>
              <Database className="w-4 h-4" />
              <span>{t('backupManager')}</span>
            </NavLink>
            <NavLink to="/admin/restore" className={navItemClass}>
              <RotateCcw className="w-4 h-4" />
              <span>{t('restoreManager')}</span>
            </NavLink>
            <NavLink to="/admin/security" className={navItemClass}>
              <Shield className="w-4 h-4" />
              <span>{t('securitySettings')}</span>
            </NavLink>
            <NavLink to="/admin/about" className={navItemClass}>
              <Info className="w-4 h-4" />
              <span>{t('aboutSystem')}</span>
            </NavLink>
            <NavLink to="/admin/settings" className={navItemClass}>
              <Settings className="w-4 h-4" />
              <span>{t('settingsProfile')}</span>
            </NavLink>
          </>
        ) : (
          /* Employee Specific Links */
          <>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 select-none">
              {t('agentPortal')}
            </div>
            <NavLink to="/employee/dashboard" className={navItemClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('dashboard')}</span>
            </NavLink>
            <NavLink to="/employee/collection-entry" className={navItemClass}>
              <PlusSquare className="w-4 h-4" />
              <span>{t('dailyCollection')}</span>
            </NavLink>
            <NavLink to="/employee/history" className={navItemClass}>
              <History className="w-4 h-4" />
              <span>{t('shiftHistory')}</span>
            </NavLink>
            <NavLink to="/employee/farmers" className={navItemClass}>
              <Users className="w-4 h-4" />
              <span>{t('farmersDirectory')}</span>
            </NavLink>
            <NavLink to="/admin/security" className={navItemClass}>
              <Shield className="w-4 h-4" />
              <span>{t('securitySettings')}</span>
            </NavLink>
            <NavLink to="/admin/about" className={navItemClass}>
              <Info className="w-4 h-4" />
              <span>{t('aboutSystem')}</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-slate-800/10 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
            {user.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate leading-none mb-0.5">
              {user.name}
            </p>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {user.role}
            </span>
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent rounded-md transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('logout')}</span>
        </button>
        <div className="text-[9px] text-slate-400 text-center select-none pt-2 border-t border-slate-200 dark:border-slate-800/80 leading-tight">
          ANR Dairy Management System<br />
          Version 1.0.0 (09-07-2026)
        </div>
      </div>

    </aside>
  );
}
