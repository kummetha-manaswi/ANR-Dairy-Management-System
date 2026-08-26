import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  MessageSquare, 
  User, 
  LogOut 
} from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useTranslation } from 'react-i18next';
import logoCompact from '../../assets/logo_compact.png';

export default function FarmerSidebar() {
  const { sidebarOpen } = useUI();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Farmer', role: 'farmer' };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/farmer/login');
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition duration-150 ${
      isActive
        ? 'bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/20'
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
            {t('farmerPortal')}
          </h2>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            {t('appName')}
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 select-none">
          {t('farmerPortalMenu')}
        </div>
        <NavLink to="/farmer/dashboard" className={navItemClass}>
          <LayoutDashboard className="w-4 h-4" />
          <span>{t('portalDashboard')}</span>
        </NavLink>
        <NavLink to="/farmer/passbook" className={navItemClass}>
          <BookOpen className="w-4 h-4" />
          <span>{t('myPassbook')}</span>
        </NavLink>
        <NavLink to="/farmer/notifications" className={navItemClass}>
          <MessageSquare className="w-4 h-4" />
          <span>{t('announcements')}</span>
        </NavLink>
        <NavLink to="/farmer/profile" className={navItemClass}>
          <User className="w-4 h-4" />
          <span>{t('myProfile')}</span>
        </NavLink>
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-slate-800/10 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            {user.name ? user.name[0].toUpperCase() : 'F'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate leading-none mb-0.5">
              {user.name}
            </p>
            <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider">
              {t('idLabel')}: {user.farmerCode || 'N/A'}
            </span>
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent rounded-md transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('signOut')}</span>
        </button>
        <div className="text-[9px] text-slate-400 text-center select-none pt-2 border-t border-slate-200 dark:border-slate-850/80 leading-tight">
          {t('appName')}<br />
          {t('farmerView')} v1.0.0 (2026)
        </div>
      </div>

    </aside>
  );
}
