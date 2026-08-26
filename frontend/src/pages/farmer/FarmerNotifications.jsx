import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUI } from '../../context/UIContext';
import { MessageSquare, Bell, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function FarmerNotifications() {
  const { showToast } = useUI();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const response = await axios.get(`${baseUrl}/api/v1/farmers/portal/notifications?page=${page}&limit=10`, { headers });
      
      if (response.data && response.data.success) {
        setNotifications(response.data.data.notifications);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (err) {
      showToast('Failed to retrieve announcements and notifications log', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && page === 1) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{t('announcements')}</h1>
        <p className="text-xs text-slate-450 mt-1">{t('farmerNotificationsDesc')}</p>
      </div>

      {/* Main Container */}
      {notifications.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl">
          <Bell className="w-12 h-12 text-slate-350 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">{t('noNotificationsYet')}</h3>
          <p className="text-xs text-slate-450 mt-1">{t('noNotificationsSub')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(item => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-sm hover:shadow-md transition-all flex items-start gap-4"
            >
              <div className={`p-2.5 rounded-lg shrink-0 ${
                item.type === 'collection' 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-955/20 dark:text-blue-400' 
                  : item.type === 'bill' 
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-455' 
                    : item.type === 'payment'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-455'
                      : 'bg-slate-50 text-slate-600 dark:bg-slate-800/40 dark:text-slate-300'
              }`}>
                <MessageSquare className="w-5 h-5" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                    {item.type} {t('alertText')}
                  </span>
                  <span className="text-[10px] text-slate-450 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(item.createdAt)}</span>
                  </span>
                </div>
                
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  {item.message}
                </p>

                {item.medium && (
                  <span className="inline-block mt-2 text-[9px] font-bold text-slate-400 border border-slate-200 dark:border-dark-border rounded px-1.5 py-0.2 capitalize">
                    {t('dispatchedVia')}: {item.medium}
                  </span>
                )}
              </div>
            </motion.div>
          ))}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-dark-border px-4 py-3 bg-white dark:bg-dark-surface rounded-xl shadow-sm text-xs font-semibold text-slate-500">
              <div>Page {page} of {totalPages}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
