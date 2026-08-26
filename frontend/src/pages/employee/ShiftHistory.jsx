import React, { useState, useEffect } from 'react';
import { getCollections } from '../../services/collectionService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { Clock, History, Droplet, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ShiftHistory() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shift, setShift] = useState(new Date().getHours() < 12 ? 'morning' : 'evening');
  
  // Totals stats
  const [totalLiters, setTotalLiters] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    const fetchShiftLogs = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const response = await getCollections({
          startDate: todayStr,
          endDate: todayStr,
          shift
        });

        if (response && response.success) {
          const logs = response.data.collections;
          setCollections(logs);
          
          // Accumulate shift stats
          const liters = logs.reduce((sum, item) => sum + item.quantity, 0);
          const val = logs.reduce((sum, item) => sum + item.totalAmount, 0);
          setTotalLiters(liters);
          setTotalValue(val);
        }
      } catch (error) {
        console.error('Failed to load shift history', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShiftLogs();
  }, [shift]);

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
      
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <Breadcrumbs items={[{ label: 'Shift Logs History' }]} />
        <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
          Active Shift Ledger
        </h1>
      </div>

      {/* Selector and Shift indicators */}
      <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
        
        {/* Toggle Shift */}
        <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200 dark:border-dark-border select-none">
          <button
            onClick={() => setShift('morning')}
            className={`py-1.5 px-4 text-xs font-semibold rounded-md transition ${
              shift === 'morning'
                ? 'bg-white dark:bg-dark-surface text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-dark-border'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
            }`}
          >
            Morning logs
          </button>
          <button
            onClick={() => setShift('evening')}
            className={`py-1.5 px-4 text-xs font-semibold rounded-md transition ${
              shift === 'evening'
                ? 'bg-white dark:bg-dark-surface text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-dark-border'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-355'
            }`}
          >
            Evening logs
          </button>
        </div>

        {/* Date string */}
        <div className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Date: {formatDate(new Date())}</span>
        </div>

      </div>

      {/* Shift Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 select-none">
        
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-955 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift Total Quantity</p>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 font-mono">{totalLiters.toFixed(2)} Liters</h3>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift Net Value</p>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 font-mono">₹{totalValue.toFixed(2)}</h3>
          </div>
        </div>

      </div>

      {/* Table grid */}
      {loading ? (
        <TableSkeleton />
      ) : collections.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Logs for This Shift"
          description="You haven't recorded any milk collections during this shift today."
        />
      ) : (
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Farmer</th>
                  <th className="p-3">Liters (L)</th>
                  <th className="p-3">FAT / SNF</th>
                  <th className="p-3">Rate / L</th>
                  <th className="p-3 font-bold text-right">Total Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {collections.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/40">
                    <td className="p-3 font-semibold">
                      {item.farmer?.name || 'Deleted'} ({item.farmer?.farmerCode})
                    </td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{item.quantity.toFixed(2)} L</td>
                    <td className="p-3 font-medium text-slate-500">{item.fat.toFixed(1)}% / {item.snf.toFixed(1)}%</td>
                    <td className="p-3 font-semibold">₹{item.ratePerLiter.toFixed(2)}</td>
                    <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400 text-right">₹{item.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
