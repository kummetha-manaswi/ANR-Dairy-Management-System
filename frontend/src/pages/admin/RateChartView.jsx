import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { getRateChartById } from '../../services/rateService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { ArrowLeft, Edit3, Activity, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RateChartView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useUI();
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChart = async () => {
      try {
        const response = await getRateChartById(id);
        if (response && response.success) {
          setChart(response.data);
        }
      } catch (error) {
        showToast('Failed to load rate chart details', 'error');
        navigate('/admin/rates');
      } finally {
        setLoading(false);
      }
    };
    fetchChart();
  }, [id, navigate, showToast]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded w-full" />
      </div>
    );
  }

  if (!chart) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Controls */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/rates')}
            className="p-2 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div className="flex flex-col gap-1.5">
            <Breadcrumbs 
              items={[
                { label: 'Rate Management', path: '/admin/rates' }, 
                { label: chart.name }
              ]} 
            />
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
              Rate Chart details: {chart.name}
            </h1>
          </div>
        </div>

        {!chart.isActive && (
          <Link
            to={`/admin/rates/${chart._id}/edit`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-dark-surface hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-dark-border rounded-md shadow-sm transition"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit parameters</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 lg:col-span-1"
        >
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4 text-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-dark-border pb-2">
              Chart Overview
            </h2>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Milk Type</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{chart.milkType}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Effective From</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(chart.effectiveFrom)}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                  chart.isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {chart.isActive ? 'Active' : 'Archived'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Pricing parameters */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-6">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-2 flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-blue-500" />
              <span>Pricing Adjustments & Thresholds</span>
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-dark-border rounded-lg">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Base Rate</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200">₹{chart.baseRate.toFixed(2)}/L</p>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-dark-border rounded-lg">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SNF Threshold</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{chart.snfThreshold.toFixed(1)}%</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-dark-border rounded-lg sm:col-span-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Deduction (Below Threshold)</p>
                <p className="text-lg font-bold text-slate-850 dark:text-slate-200">₹{chart.deduction.toFixed(2)}/L</p>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
