import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  Clock, 
  Activity, 
  Smartphone, 
  Check, 
  ArrowRight,
  TrendingUp,
  Droplet,
  Users,
  UserCheck,
  ClipboardList,
  Scale,
  Receipt,
  Wallet,
  Globe,
  Menu,
  X,
  FileSpreadsheet,
  Zap,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import local premium assets
import premiumCowHero from '../assets/premium_cow_hero.png';
import premiumFarmer from '../assets/premium_farmer.png';
import logoCompact from '../assets/logo_compact.png';

export default function Landing() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  // States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('cow');
  const [stats, setStats] = useState({
    totalFarmers: 120,
    activeFarmers: 104,
    totalLiters: 18450.60,
    totalCollections: 1540
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Check setup status and load real statistics
  useEffect(() => {
    const checkSetupAndLoadStats = async () => {
      try {
        // Setup status check
        const setupRes = await api.get('/auth/setup-status');
        if (setupRes.data && setupRes.data.data.setupRequired) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('sessionTimeout');
          navigate('/setup');
          return;
        }

        // Stats fetch
        const statsRes = await api.get('/auth/public-stats');
        if (statsRes.data && statsRes.data.success) {
          setStats(statsRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching landing page data:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    checkSetupAndLoadStats();
  }, [navigate]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  // Smooth scroll helper
  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300 selection:bg-emerald-600 selection:text-white">
      
      {/* Premium Sticky Navigation */}
      <header className="fixed top-0 inset-x-0 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 z-50 px-6 md:px-12 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3 select-none cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img 
            src={logoCompact} 
            alt="ANR Dairy Logo" 
            className="w-10 h-10 object-contain rounded-xl shadow-md border border-slate-200 dark:border-slate-800"
          />
          <div className="flex flex-col">
            <span className="font-black text-slate-900 dark:text-white shadow-sm text-lg leading-none tracking-tight">
              ANR Dairy
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-0.5">
              ERP portal
            </span>
          </div>
        </div>

        {/* Desktop Links */}
        <nav className="hidden lg:flex items-center gap-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-sm font-bold text-slate-600 dark:text-slate-350 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
            {t('landingNavbarHome')}
          </button>
          <button onClick={() => scrollToSection('about')} className="text-sm font-bold text-slate-600 dark:text-slate-350 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
            {t('landingNavbarAbout')}
          </button>
          <button onClick={() => scrollToSection('quality')} className="text-sm font-bold text-slate-600 dark:text-slate-350 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
            {t('landingNavbarOurDairy')}
          </button>
          <button onClick={() => scrollToSection('farmers')} className="text-sm font-bold text-slate-600 dark:text-slate-350 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
            {t('landingNavbarFarmers')}
          </button>
          <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-bold text-slate-600 dark:text-slate-350 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
            {t('landingNavbarHowItWorks')}
          </button>
        </nav>

        {/* Portal Controls + Language Switcher */}
        <div className="hidden lg:flex items-center gap-4">
          
          {/* i18n Language selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50 mr-2">
            <button
              onClick={() => changeLanguage('en')}
              className={`px-2.5 py-1 text-xs font-bold rounded transition ${
                i18n.language === 'en'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => changeLanguage('te')}
              className={`px-2.5 py-1 text-xs font-bold rounded transition ${
                i18n.language === 'te'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              తెలుగు
            </button>
          </div>

          <Link
            to="/farmer/login"
            className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
          >
            {t('landingFarmerPortal')}
          </Link>
          <Link
            to="/admin/login"
            className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg shadow-md shadow-emerald-500/10 transition duration-300 hover:-translate-y-0.5"
          >
            {t('landingAdminPortal')}
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 inset-x-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 p-6 flex flex-col gap-4 lg:hidden shadow-xl"
          >
            <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }} className="text-left text-sm font-bold text-slate-750 dark:text-slate-200 py-1 hover:text-emerald-600">
              {t('landingNavbarHome')}
            </button>
            <button onClick={() => scrollToSection('about')} className="text-left text-sm font-bold text-slate-750 dark:text-slate-200 py-1 hover:text-emerald-600">
              {t('landingNavbarAbout')}
            </button>
            <button onClick={() => scrollToSection('quality')} className="text-left text-sm font-bold text-slate-750 dark:text-slate-200 py-1 hover:text-emerald-600">
              {t('landingNavbarOurDairy')}
            </button>
            <button onClick={() => scrollToSection('farmers')} className="text-left text-sm font-bold text-slate-750 dark:text-slate-200 py-1 hover:text-emerald-600">
              {t('landingNavbarFarmers')}
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-left text-sm font-bold text-slate-750 dark:text-slate-200 py-1 hover:text-emerald-600">
              {t('landingNavbarHowItWorks')}
            </button>
            
            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Language Selector */}
            <div className="flex items-center gap-4 py-1">
              <span className="text-xs font-bold text-slate-400">Language:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { changeLanguage('en'); setMobileMenuOpen(false); }}
                  className={`px-3 py-1 text-xs font-bold rounded ${i18n.language === 'en' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                >
                  English
                </button>
                <button
                  onClick={() => { changeLanguage('te'); setMobileMenuOpen(false); }}
                  className={`px-3 py-1 text-xs font-bold rounded ${i18n.language === 'te' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                >
                  తెలుగు
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Link
                to="/farmer/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-850 rounded-lg hover:bg-slate-200 transition"
              >
                {t('landingFarmerPortal')}
              </Link>
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
              >
                {t('landingAdminPortal')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1 overflow-hidden select-none">
        
        {/* Background decorative elements */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gradient-to-tr from-emerald-200/20 to-teal-300/20 rounded-full blur-3xl -z-10" />
        
        {/* Left Side: Brand presentation (Lg: col-span-7) */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 lg:col-span-7"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-750 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-900/30 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-spin" style={{ animationDuration: '6s' }} />
            <span>{t('landingHeroText')}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.05]">
            {t('landingHeroTitle')}
          </h1>

          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            {t('landingHeroSubtitle')}
          </p>

          {/* Discover ANR Dairy Button */}
          <div className="flex pt-3">
            <button
              onClick={() => scrollToSection('about')}
              className="group flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 transition duration-300 hover:-translate-y-0.5"
            >
              <span>Discover ANR Dairy</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* Right Side: High-quality illustration / picture frame (Lg: col-span-5) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="lg:col-span-5 relative flex items-center justify-center"
        >
          
          {/* Organic shape background frame */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[1.3] bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-750 rounded-[2.5rem] p-3 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-800/5 group-hover:bg-emerald-800/0 transition duration-300 z-10" />
            <img
              src={premiumCowHero}
              alt="Premium Cow Hero Asset"
              className="w-full h-full object-cover rounded-[2rem] transition-transform duration-700 group-hover:scale-105"
            />
          </div>

          {/* Floater overlay quality tag */}
          <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xl flex items-center gap-3 max-w-[200px] select-none hover:scale-105 transition-transform">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 shrink-0">
              <Droplet className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">100% Organic</p>
              <p className="text-xs font-extrabold text-slate-850 dark:text-slate-200">Pure Grade Milk</p>
            </div>
          </div>

        </motion.div>

      </section>

      {/* Real-time Statistics Ribbon */}
      <section className="bg-white dark:bg-slate-900 border-y border-slate-200/60 dark:border-slate-800/60 py-10 px-6 md:px-12 w-full transition-colors duration-300 select-none">
        <div className="max-w-7xl mx-auto">
          
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
              
              {/* Stat 1 */}
              <div className="flex flex-col items-center md:items-start md:px-6 pt-4 md:pt-0">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {stats.totalFarmers}
                </span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider text-center md:text-left">
                  {t('landingStatFarmers')}
                </span>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col items-center md:items-start md:px-6 pt-4 md:pt-0">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {stats.totalLiters.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider text-center md:text-left">
                  {t('landingStatMilkCollected')}
                </span>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col items-center md:items-start md:px-6 pt-4 md:pt-0">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {stats.activeFarmers}
                </span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider text-center md:text-left">
                  {t('landingStatActiveFarmers')}
                </span>
              </div>

              {/* Stat 4 */}
              <div className="flex flex-col items-center md:items-start md:px-6 pt-4 md:pt-0">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {stats.totalCollections}
                </span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider text-center md:text-left">
                  {t('landingStatCollections')}
                </span>
              </div>

            </div>
          )}

        </div>
      </section>

      {/* About Section - Visual Storytelling */}
      <section id="about" className="py-24 px-6 md:px-12 w-full select-none">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t('landingAboutTitle')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-normal">
              {t('landingAboutSub')}
            </p>
          </div>

          {/* Process Flow Cards Chain */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            
            {/* Stage 1 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-5 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-sm hover:border-emerald-500/50 hover:shadow-lg transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-extrabold uppercase text-slate-400">{t('landingAboutFlowFarmers')}</h3>
              <p className="text-[10px] text-slate-500 leading-relaxed">Onboard dairy farmers securely with credentials.</p>
            </div>

            {/* Stage 2 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-5 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-sm hover:border-emerald-500/50 hover:shadow-lg transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600">
                <Droplet className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-extrabold uppercase text-slate-400">{t('landingAboutFlowCollection')}</h3>
              <p className="text-[10px] text-slate-500 leading-relaxed">Record volume quantity at dispatch counters.</p>
            </div>

            {/* Stage 3 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-5 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-sm hover:border-emerald-500/50 hover:shadow-lg transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center text-purple-600">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-extrabold uppercase text-slate-400">{t('landingAboutFlowTesting')}</h3>
              <p className="text-[10px] text-slate-500 leading-relaxed">Verify FAT & SNF metrics for quality audits.</p>
            </div>

            {/* Stage 4 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-5 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-sm hover:border-emerald-500/50 hover:shadow-lg transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-extrabold uppercase text-slate-400">{t('landingAboutFlowRate')}</h3>
              <p className="text-[10px] text-slate-500 leading-relaxed">Apply SNF rule-based rate chart calculations.</p>
            </div>

            {/* Stage 5 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-5 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-sm hover:border-emerald-500/50 hover:shadow-lg transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/20 flex items-center justify-center text-teal-600">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-extrabold uppercase text-slate-400">{t('landingAboutFlowBilling')}</h3>
              <p className="text-[10px] text-slate-500 leading-relaxed">Auto-generate invoices for the billing cycle.</p>
            </div>

            {/* Stage 6 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-5 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-sm hover:border-emerald-500/50 hover:shadow-lg transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-600">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-extrabold uppercase text-slate-400">{t('landingAboutFlowPayments')}</h3>
              <p className="text-[10px] text-slate-500 leading-relaxed">Disburse payouts to registered bank accounts.</p>
            </div>

          </div>

        </div>
      </section>

      {/* Pricing Quality Section */}
      <section id="quality" className="py-24 px-6 md:px-12 w-full bg-slate-100 dark:bg-slate-850 transition-colors duration-300 select-none">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t('landingQualityTitle')}
            </h2>
            <p className="text-sm text-slate-550 dark:text-slate-450 leading-relaxed">
              {t('landingQualitySub')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Buffalo Card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 rounded-2xl p-6 md:p-8 space-y-6 shadow-md">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🐃</span>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none">{t('landingQualityBuffaloTitle')}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 inline-block">Heavy Grade Milk</span>
                </div>
              </div>

              <div className="space-y-3 border-y border-dashed border-slate-100 dark:border-slate-700/60 py-4 text-sm font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-450">{t('landingQualityBuffaloBase').split(':')[0]}</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">{t('landingQualityBuffaloBase').split(':')[1]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">{t('landingQualityBuffaloThreshold').split(':')[0]}</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">{t('landingQualityBuffaloThreshold').split(':')[1]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">{t('landingQualityBuffaloDeduction').split(':')[0]}</span>
                  <span className="font-extrabold text-red-500">{t('landingQualityBuffaloDeduction').split(':')[1]}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-2 text-xs font-semibold leading-relaxed">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{t('landingQualityBuffaloRule1')}</span>
                </div>
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{t('landingQualityBuffaloRule2')}</span>
                </div>
              </div>
            </div>

            {/* Cow Card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 rounded-2xl p-6 md:p-8 space-y-6 shadow-md">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🐄</span>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none">{t('landingQualityCowTitle')}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 inline-block">Premium Grade Milk</span>
                </div>
              </div>

              <div className="space-y-3 border-y border-dashed border-slate-100 dark:border-slate-700/60 py-4 text-sm font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-450">{t('landingQualityCowBase').split(':')[0]}</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">{t('landingQualityCowBase').split(':')[1]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">{t('landingQualityCowThreshold').split(':')[0]}</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">{t('landingQualityCowThreshold').split(':')[1]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">{t('landingQualityCowDeduction').split(':')[0]}</span>
                  <span className="font-extrabold text-red-500">{t('landingQualityCowDeduction').split(':')[1]}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-2 text-xs font-semibold leading-relaxed">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{t('landingQualityCowRule1')}</span>
                </div>
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{t('landingQualityCowRule2')}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 px-6 md:px-12 w-full bg-white dark:bg-slate-900 transition-colors duration-300 select-none">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t('landingHowItWorksTitle')}
            </h2>
            <p className="text-sm text-slate-550 dark:text-slate-450">
              {t('landingHowItWorksSub')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <div className="border border-slate-200/50 dark:border-slate-800/80 p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-850/30 space-y-3 hover:shadow-md transition">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">Step 01</span>
              <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">{t('landingStep1Title')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('landingStep1Desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="border border-slate-200/50 dark:border-slate-800/80 p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-850/30 space-y-3 hover:shadow-md transition">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">Step 02</span>
              <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">{t('landingStep2Title')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('landingStep2Desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="border border-slate-200/50 dark:border-slate-800/80 p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-850/30 space-y-3 hover:shadow-md transition">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">Step 03</span>
              <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">{t('landingStep3Title')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('landingStep3Desc')}
              </p>
            </div>

            {/* Step 4 */}
            <div className="border border-slate-200/50 dark:border-slate-800/80 p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-850/30 space-y-3 hover:shadow-md transition">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">Step 04</span>
              <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">{t('landingStep4Title')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('landingStep4Desc')}
              </p>
            </div>

            {/* Step 5 */}
            <div className="border border-slate-200/50 dark:border-slate-800/80 p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-850/30 space-y-3 hover:shadow-md transition">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">Step 05</span>
              <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">{t('landingStep5Title')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('landingStep5Desc')}
              </p>
            </div>

            {/* Step 6 */}
            <div className="border border-slate-200/50 dark:border-slate-800/80 p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-850/30 space-y-3 hover:shadow-md transition">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">Step 06</span>
              <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">{t('landingStep6Title')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('landingStep6Desc')}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Farmers Feature Section */}
      <section id="farmers" className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center select-none">
        
        {/* Left Side: Farmer Image */}
        <div className="lg:col-span-5 relative flex items-center justify-center order-2 lg:order-1">
          <div className="relative w-full aspect-[4/3] bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-750 rounded-[2.5rem] p-3 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-800/5 group-hover:bg-emerald-800/0 transition duration-300 z-10" />
            <img
              src={premiumFarmer}
              alt="Premium Farmer Portrait"
              className="w-full h-full object-cover rounded-[2rem] transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Right Side: Features List (Lg: col-span-7) */}
        <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t('landingFarmersSectionTitle')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('landingFarmersSectionSub')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Feature 1 */}
            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold text-slate-750 dark:text-slate-300">{t('landingFarmersFeature1')}</span>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold text-slate-750 dark:text-slate-300">{t('landingFarmersFeature2')}</span>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold text-slate-750 dark:text-slate-300">{t('landingFarmersFeature3')}</span>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold text-slate-750 dark:text-slate-300">{t('landingFarmersFeature4')}</span>
            </div>

            {/* Feature 5 */}
            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold text-slate-750 dark:text-slate-300">{t('landingFarmersFeature5')}</span>
            </div>

            {/* Feature 6 */}
            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold text-slate-750 dark:text-slate-300">{t('landingFarmersFeature6')}</span>
            </div>

          </div>


        </div>

      </section>

      {/* Transparency section */}
      <section className="py-20 px-6 md:px-12 w-full bg-slate-100 dark:bg-slate-850 border-y border-slate-200/50 dark:border-slate-800/80 transition-colors duration-300 select-none">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t('landingTransparencyTitle')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-450">
              {t('landingTransparencySub')}
            </p>
          </div>

          {/* Connected pipeline graphic */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-2 max-w-4xl mx-auto">
            
            {/* Step 1 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-6 py-4 rounded-xl flex items-center gap-3 w-full lg:w-auto shadow-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center text-xs font-bold font-mono">1</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('landingTransStep1')}</span>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-400 rotate-90 lg:rotate-0" />

            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-6 py-4 rounded-xl flex items-center gap-3 w-full lg:w-auto shadow-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center text-xs font-bold font-mono">2</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('landingTransStep2')}</span>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-400 rotate-90 lg:rotate-0" />

            {/* Step 3 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-6 py-4 rounded-xl flex items-center gap-3 w-full lg:w-auto shadow-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center text-xs font-bold font-mono">3</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('landingTransStep3')}</span>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-400 rotate-90 lg:rotate-0" />

            {/* Step 4 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-6 py-4 rounded-xl flex items-center gap-3 w-full lg:w-auto shadow-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center text-xs font-bold font-mono">4</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('landingTransStep4')}</span>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-400 rotate-90 lg:rotate-0" />

            {/* Step 5 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-6 py-4 rounded-xl flex items-center gap-3 w-full lg:w-auto shadow-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center text-xs font-bold font-mono">5</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('landingTransStep5')}</span>
            </div>

          </div>

        </div>
      </section>

      {/* Why ANR Dairy Section */}
      <section className="py-24 px-6 md:px-12 w-full select-none">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t('landingWhyTitle')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('landingWhySub')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Why 1 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">{t('landingWhy1Title')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{t('landingWhy1Desc')}</p>
            </div>

            {/* Why 2 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">{t('landingWhy2Title')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{t('landingWhy2Desc')}</p>
            </div>

            {/* Why 3 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">{t('landingWhy3Title')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{t('landingWhy3Desc')}</p>
            </div>

            {/* Why 4 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">{t('landingWhy4Title')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{t('landingWhy4Desc')}</p>
            </div>

            {/* Why 5 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">{t('landingWhy5Title')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{t('landingWhy5Desc')}</p>
            </div>

            {/* Why 6 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">{t('landingWhy6Title')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{t('landingWhy6Desc')}</p>
            </div>

          </div>

        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6 md:px-12 w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white select-none relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">{t('landingCtaTitle')}</h2>
          <p className="text-base sm:text-lg text-emerald-100 max-w-xl mx-auto leading-relaxed">
            {t('landingCtaSub')}
          </p>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => scrollToSection('about')}
              className="px-8 py-3.5 text-sm font-extrabold text-emerald-700 bg-white hover:bg-slate-50 rounded-xl shadow-lg shadow-black/10 hover:shadow-black/20 hover:-translate-y-0.5 transition"
            >
              Discover ANR Dairy
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-500 text-xs py-16 px-6 md:px-12 border-t border-slate-800 w-full transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 select-none">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img 
                src={logoCompact} 
                alt="ANR Logo" 
                className="w-7 h-7 object-contain rounded"
              />
              <span className="font-extrabold text-slate-200 tracking-tight">ANR Dairy</span>
            </div>
            <p className="text-slate-550 leading-relaxed text-[11px]">
              {t('landingFooterText')}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">Quick Links</h4>
            <div className="flex flex-col gap-2 font-medium">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white text-left transition">Home</button>
              <button onClick={() => scrollToSection('about')} className="hover:text-white text-left transition">About</button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white text-left transition">How It Works</button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">Access Portals</h4>
            <div className="flex flex-col gap-2 font-medium">
              <Link to="/admin/login" className="hover:text-white transition">Admin Login</Link>
              <Link to="/farmer/login" className="hover:text-white transition">Farmer Login</Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">Language</h4>
            <div className="flex gap-2">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1.5 rounded font-extrabold border text-[10px] ${i18n.language === 'en' ? 'bg-slate-800 border-slate-700 text-white' : 'border-slate-800 hover:text-white'}`}
              >
                ENGLISH
              </button>
              <button
                onClick={() => changeLanguage('te')}
                className={`px-3 py-1.5 rounded font-extrabold border text-[10px] ${i18n.language === 'te' ? 'bg-slate-800 border-slate-700 text-white' : 'border-slate-800 hover:text-white'}`}
              >
                తెలుగు
              </button>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-850 mt-12 pt-6 text-center text-[10px] text-slate-600 select-none">
          <p>© 2026 ANR Dairy Management System. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
