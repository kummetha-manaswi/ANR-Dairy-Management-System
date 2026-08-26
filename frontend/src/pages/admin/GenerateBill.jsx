import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { getFarmers } from '../../services/farmerService';
import { getCollections } from '../../services/collectionService';
import { generateInvoice } from '../../services/billingService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import EmptyState from '../../components/common/EmptyState';
import { Calendar, Users, HelpCircle, FileText, ArrowRight, IndianRupee, HelpCircle as Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GenerateBill() {
  const navigate = useNavigate();
  const { showToast } = useUI();

  // Master lists
  const [farmers, setFarmers] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Selector inputs
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Adjustments
  const [bonus, setBonus] = useState('');
  const [deductions, setDeductions] = useState('');

  // Unbilled collections preview
  const [collections, setCollections] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Accumulated totals
  const [totals, setTotals] = useState({ liters: 0, gross: 0, count: 0 });

  // Load active farmers on mount
  useEffect(() => {
    const loadFarmers = async () => {
      try {
        const res = await getFarmers({ limit: 1000, status: 'active' });
        if (res.success) {
          setFarmers(res.data.farmers);
        }
      } catch (err) {
        showToast('Failed to load farmers registry', 'error');
      } finally {
        setLoadingFarmers(false);
      }
    };
    loadFarmers();
  }, [showToast]);

  // Fetch unbilled deliveries when farmer or range updates
  useEffect(() => {
    if (!selectedFarmerId || !startDate || !endDate) {
      setCollections([]);
      setTotals({ liters: 0, gross: 0, count: 0 });
      return;
    }

    const loadUnbilled = async () => {
      setLoadingPreview(true);
      try {
        const res = await getCollections({
          farmerId: selectedFarmerId,
          startDate,
          endDate
        });
        if (res.success) {
          // Filter only UNLOCKED (unbilled) collections
          const unbilled = res.data.collections.filter(c => !c.isLocked);
          setCollections(unbilled);

          const liters = unbilled.reduce((sum, item) => sum + item.quantity, 0);
          const gross = unbilled.reduce((sum, item) => sum + item.totalAmount, 0);
          setTotals({
            liters,
            gross,
            count: unbilled.length
          });
        }
      } catch (err) {
        console.error('Failed to load unbilled collections', err);
      } finally {
        setLoadingPreview(false);
      }
    };
    loadUnbilled();
  }, [selectedFarmerId, startDate, endDate]);

  const isDateRangeInvalid = startDate && endDate && new Date(endDate) < new Date(startDate);

  const handleGenerateInvoice = async () => {
    if (isDateRangeInvalid) {
      showToast('End Date cannot be earlier than the Start Date', 'warning');
      return;
    }
    if (collections.length === 0) {
      showToast('Cannot generate bill. No unbilled collection entries found.', 'warning');
      return;
    }

    setGenerating(true);
    try {
      const response = await generateInvoice({
        farmerId: selectedFarmerId,
        startDate,
        endDate,
        bonus: parseFloat(bonus) || 0,
        deductions: parseFloat(deductions) || 0
      });

      if (response && response.success) {
        showToast(`Invoice ${response.data.invoiceNumber} generated successfully`, 'success');
        navigate(`/admin/collections`); // Redirect to bills list (or invoices list)
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || 'Invoice generation run failed';
      showToast(serverMessage, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const applyDateShortcut = (shortcut) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    // Helper to format date as YYYY-MM-DD
    const formatDateStr = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    switch (shortcut) {
      case 'today':
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'this_week': {
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(today.setDate(diff));
        end = new Date();
        break;
      }
      case 'last_7_days':
        start.setDate(today.getDate() - 6);
        end = new Date();
        break;
      case 'this_month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date();
        break;
      case 'prev_month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'billing_cycle': {
        const day = today.getDate();
        if (day <= 10) {
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          end = new Date(today.getFullYear(), today.getMonth(), 10);
        } else if (day <= 20) {
          start = new Date(today.getFullYear(), today.getMonth(), 11);
          end = new Date(today.getFullYear(), today.getMonth(), 20);
        } else {
          start = new Date(today.getFullYear(), today.getMonth(), 21);
          end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        }
        break;
      }
      case 'curr_15_day': {
        const day = today.getDate();
        if (day <= 15) {
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          end = new Date(today.getFullYear(), today.getMonth(), 15);
        } else {
          start = new Date(today.getFullYear(), today.getMonth(), 16);
          end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        }
        break;
      }
      case 'prev_15_day': {
        const day = today.getDate();
        if (day <= 15) {
          start = new Date(today.getFullYear(), today.getMonth() - 1, 16);
          end = new Date(today.getFullYear(), today.getMonth(), 0);
        } else {
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          end = new Date(today.getFullYear(), today.getMonth(), 15);
        }
        break;
      }
      default:
        return;
    }

    setStartDate(formatDateStr(start));
    setEndDate(formatDateStr(end));
  };

  const netAmount = Math.max(0, totals.gross + (parseFloat(bonus) || 0) - (parseFloat(deductions) || 0));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Breadcrumbs items={[{ label: 'Generate Farmer Invoice' }]} />
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Generate Farmer Bill Invoice
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Parameters Form */}
        <div className="space-y-6 lg:col-span-1">
          
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-2">
              Billing Period Parameters
            </h2>

            {/* Select Farmer */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Farmer</label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <select
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                >
                  <option value="">-- Select Active Farmer --</option>
                  {farmers.map(f => (
                    <option key={f._id} value={f._id}>{f.name} ({f.farmerCode})</option>
                  ))}
                </select>
              </div>
             </div>

            {/* Quick Shortcuts */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Date Shortcuts</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Today', value: 'today' },
                  { label: 'Yesterday', value: 'yesterday' },
                  { label: 'This Week', value: 'this_week' },
                  { label: 'Last 7 Days', value: 'last_7_days' },
                  { label: 'This Month', value: 'this_month' },
                  { label: 'Previous Month', value: 'prev_month' },
                  { label: '10-Day Cycle', value: 'billing_cycle' },
                  { label: 'Current 15-Day', value: 'curr_15_day' },
                  { label: 'Previous 15-Day', value: 'prev_15_day' }
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => applyDateShortcut(s.value)}
                    className="px-2 py-1 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-dark-border rounded-md transition"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  setEndDate(val);
                }}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
              />
              {isDateRangeInvalid && (
                <p className="text-[10px] text-red-500 font-semibold select-none mt-1">End Date cannot be earlier than Start Date</p>
              )}
            </div>
          </div>

          {/* Adjustments Form */}
          {totals.count > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4 shadow-sm"
            >
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-2">
                Payout Adjustments
              </h2>

              <div className="space-y-3 text-xs">
                {/* Bonus */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bonus / Incentives (₹)</label>
                  <input
                    type="number"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md font-semibold"
                    placeholder="0.00"
                  />
                </div>

                {/* Deductions */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deductions / Feed Cuts (₹)</label>
                  <input
                    type="number"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md font-semibold"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </motion.div>
          )}

        </div>

        {/* Right Side: Collections Preview List & Payout Totals */}
        <div className="space-y-6 lg:col-span-2">
          
          {loadingPreview ? (
            <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-12 text-center text-slate-400">
              Fetching unbilled milk collections...
            </div>
          ) : collections.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="No Unbilled Deliveries"
              description="Please select a farmer and billing range parameters on the left to preview deliveries before invoice compilation."
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Table ledger card */}
              <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-dark-border">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Deliveries Preview ({collections.length} Days)
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-dark-border text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="p-3">Date</th>
                        <th className="p-3">Shift</th>
                        <th className="p-3">Liters (L)</th>
                        <th className="p-3">FAT / SNF</th>
                        <th className="p-3">Rate / L</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                      {collections.map((col) => (
                        <tr key={col._id} className="hover:bg-slate-50/40">
                          <td className="p-3">{new Date(col.date).toLocaleDateString()}</td>
                          <td className="p-3 capitalize">{col.shift}</td>
                          <td className="p-3 font-semibold">{col.quantity.toFixed(2)} L</td>
                          <td className="p-3">{col.fat.toFixed(1)}% / {col.snf.toFixed(1)}%</td>
                          <td className="p-3">₹{col.ratePerLiter.toFixed(2)}</td>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200 text-right">₹{col.totalAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* pricing summary card */}
              <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-2">
                  Invoice Payout Breakdown
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center select-none">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">Total Liters</p>
                    <p className="text-sm font-extrabold text-slate-750 dark:text-white mt-0.5">{totals.liters.toFixed(2)} L</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">Gross Amount</p>
                    <p className="text-sm font-extrabold text-slate-750 dark:text-white mt-0.5">₹{totals.gross.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">Adjustments</p>
                    <p className="text-sm font-extrabold text-slate-750 dark:text-white mt-0.5">
                      +₹{parseFloat(bonus) || 0} / -₹{parseFloat(deductions) || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/35 border border-blue-150 dark:border-blue-800 rounded shadow-sm">
                    <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase">Net Pay Due</p>
                    <p className="text-sm font-black text-blue-650 dark:text-blue-300 mt-0.5 font-mono">₹{netAmount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-dark-border">
                  <button
                    type="button"
                    onClick={handleGenerateInvoice}
                    disabled={generating || isDateRangeInvalid}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-350 dark:disabled:bg-slate-700 disabled:text-slate-500 rounded-md shadow-sm transition"
                  >
                    <span>{generating ? 'Compiling Run...' : 'Confirm & Compile Bill'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </motion.div>
          )}

        </div>

      </div>

    </div>
  );
}
