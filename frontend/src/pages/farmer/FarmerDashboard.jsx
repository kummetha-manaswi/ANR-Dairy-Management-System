import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUI } from '../../context/UIContext';
import { 
  Droplets, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  MessageSquare, 
  CheckCircle, 
  TrendingUp, 
  ShieldAlert 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function FarmerDashboard() {
  const { showToast } = useUI();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    todayMilk: 0,
    todayAmount: 0,
    currentBillingAmount: 0,
    pendingPayment: 0,
    lastPayment: 0
  });
  const [recentCollections, setRecentCollections] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
        const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

        // Fetch stats
        const statsRes = await axios.get(`${baseUrl}/api/v1/farmers/portal/dashboard`, { headers });
        if (statsRes.data && statsRes.data.success) {
          setStats(statsRes.data.data);
        }

        // Fetch collections (limit 5)
        const collectionsRes = await axios.get(`${baseUrl}/api/v1/farmers/portal/collections?limit=5`, { headers });
        if (collectionsRes.data && collectionsRes.data.success) {
          setRecentCollections(collectionsRes.data.data.collections);
        }

        // Fetch notifications (limit 3)
        const alertsRes = await axios.get(`${baseUrl}/api/v1/farmers/portal/notifications?limit=3`, { headers });
        if (alertsRes.data && alertsRes.data.success) {
          setRecentAlerts(alertsRes.data.data.notifications);
        }

      } catch (error) {
        showToast('Failed to retrieve dashboard portal statistics', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showToast]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded md:col-span-2" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{t('portalDashboard')}</h1>
        <p className="text-xs text-slate-450 mt-1">{t('farmerLoginSub')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Today's Milk */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-slate-200 dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('todaysMilk')}</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-4">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.todayMilk.toFixed(2)}</span>
            <span className="text-[10px] font-bold text-slate-400">Liters</span>
          </div>
        </div>

        {/* Today's Amount */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-slate-200 dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('todaysPay')}</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-455">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-4">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-455">₹{stats.todayAmount.toFixed(2)}</span>
            <span className="text-[10px] font-bold text-slate-400">Today</span>
          </div>
        </div>

        {/* Current Billing */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-slate-200 dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('billingCycle')}</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-455">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-4">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">₹{stats.currentBillingAmount.toFixed(2)}</span>
            <span className="text-[10px] font-bold text-slate-400">Cycle</span>
          </div>
        </div>

        {/* Outstanding Payment */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-slate-200 dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('pendingDue')}</span>
            <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-955/20 text-red-655 dark:text-red-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-4">
            <span className="text-2xl font-bold text-red-655 dark:text-red-400">₹{stats.pendingPayment.toFixed(2)}</span>
            <span className="text-[10px] font-bold text-slate-400">Due</span>
          </div>
        </div>

        {/* Last Payment */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-slate-200 dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('lastDisbursed')}</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-4">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">₹{stats.lastPayment.toFixed(2)}</span>
            <span className="text-[10px] font-bold text-slate-400">Received</span>
          </div>
        </div>

      </div>

      {/* Main Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Recent Milk collections (Lg: col-span-2) */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-150 dark:border-dark-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-450" />
              <span>{t('recentDeliveries')}</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Last 5 Deliveries</span>
          </div>

          <div className="flex-1 overflow-x-auto">
            {recentCollections.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-450">No milk collection entries found.</div>
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850/45 border-b border-slate-200 dark:border-dark-border text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-4">{t('dateShiftCol')}</th>
                    <th className="p-4">{t('milkTypeCol')}</th>
                    <th className="p-4">{t('litersCol')}</th>
                    <th className="p-4">{t('fatSnfCol')}</th>
                    <th className="p-4">{t('rateLCol')}</th>
                    <th className="p-4">{t('totalAmountCol')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                  {recentCollections.map(col => (
                    <tr key={col._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="p-4 font-semibold">
                        <p>{formatDate(col.date)}</p>
                        <span className="text-[9px] font-bold text-slate-400 capitalize">{col.shift}</span>
                      </td>
                      <td className="p-4 font-bold capitalize text-slate-700 dark:text-slate-300">{col.milkType}</td>
                      <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{col.quantity.toFixed(2)} L</td>
                      <td className="p-4 font-medium text-slate-500">{col.fat.toFixed(1)}% / {col.snf.toFixed(1)}%</td>
                      <td className="p-4 font-semibold text-slate-655 dark:text-slate-350">₹{col.ratePerLiter.toFixed(2)}</td>
                      <td className="p-4 font-bold text-emerald-600 dark:text-emerald-455">₹{col.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Announcements / Notifications (Col-span-1) */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-150 dark:border-dark-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span>{t('announcementsFeed')}</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Feed</span>
          </div>

          <div className="p-5 space-y-4 flex-1 overflow-y-auto">
            {recentAlerts.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-450">{t('noNotifications')}</div>
            ) : (
              recentAlerts.map(alert => (
                <div key={alert._id} className="p-3 border border-slate-100 dark:border-dark-border bg-slate-50/60 dark:bg-slate-800/10 rounded-lg text-xs space-y-1.5 animate-fadeIn">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-455">
                    <span className="uppercase text-emerald-650 dark:text-emerald-450 font-bold">{alert.type} Alert</span>
                    <span>{formatDate(alert.createdAt)}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-normal font-medium">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
