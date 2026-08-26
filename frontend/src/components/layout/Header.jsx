import React, { useEffect, useState } from 'react';
import { Menu, Sun, Moon, Globe, User } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useTranslation } from 'react-i18next';
import logoCompact from '../../assets/logo_compact.png';
import { getDairyProfile } from '../../services/dairyService';

export default function Header() {
  const { toggleSidebar, showToast } = useUI();
  const { i18n } = useTranslation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [dairyName, setDairyName] = useState('ANR Dairy');
  const [logoUrl, setLogoUrl] = useState('');

  // Fetch dairy profile for dynamic header branding on mount
  useEffect(() => {
    const fetchDairyBranding = async () => {
      try {
        const response = await getDairyProfile();
        if (response && response.success && response.data) {
          setDairyName(response.data.dairyName || 'ANR Dairy');
          if (response.data.logo) {
            // Append base server url for uploaded assets
            const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
            setLogoUrl(`${baseUrl}${response.data.logo}`);
          }
        }
      } catch (error) {
        console.error('Failed to load header dairy branding', error);
      }
    };
    fetchDairyBranding();
  }, []);

  // Theme Toggler
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    const root = window.document.documentElement;
    if (nextTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', nextTheme);
  };

  // Language Toggler
  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'te' : 'en';
    i18n.changeLanguage(nextLang);
    showToast(nextLang === 'en' ? 'Switched to English' : 'తెలుగు భాషకు మార్చబడింది', 'info');
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface px-6 flex items-center justify-between sticky top-0 z-20">
      
      {/* Left side: Toggles & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500 dark:text-slate-400"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Dynamic Dairy Branding */}
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Dairy Logo" 
              className="w-8 h-8 object-contain rounded border border-slate-200 dark:border-dark-border"
              onError={() => setLogoUrl('')} // fallback if image fails to load
            />
          ) : (
            <img 
              src={logoCompact} 
              alt="Dairy Logo" 
              className="w-8 h-8 object-contain rounded-lg border border-slate-250 dark:border-dark-border"
            />
          )}
          <span className="font-bold text-slate-800 dark:text-slate-100 hidden sm:inline-block">
            {dairyName}
          </span>
        </div>
      </div>

      {/* Right side: Global controls */}
      <div className="flex items-center gap-3">
        
        {/* Language Selection - Hidden for Version 1.0 */}
        {/* <button
          onClick={toggleLanguage}
          className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500 dark:text-slate-400 flex items-center gap-1.5"
          title="Switch Language"
        >
          <Globe className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase">
            {i18n.language}
          </span>
        </button> */}

        {/* Theme Switching */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500 dark:text-slate-400"
          title="Toggle Color Theme"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5 text-amber-400" />
          )}
        </button>

      </div>

    </header>
  );
}
