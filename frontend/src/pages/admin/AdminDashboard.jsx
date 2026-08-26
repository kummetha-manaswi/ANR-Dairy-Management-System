import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../../services/reportService';
import { 
  Users, 
  Droplet, 
  IndianRupee, 
  Settings, 
  Database,
  Calendar,
  FileText,
  Activity,
  CreditCard,
  PlusCircle,
  FileSpreadsheet,
  Sun,
  Moon,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await getDashboardStats();
      if (response && response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded w-full" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      
      {/* Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-100 dark:border-dark-border pb-4 select-none">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">
            ANR Dairy SaaS ERP Portal
          </span>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
            Admin Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border px-3.5 py-1.5 rounded-lg text-slate-500">
          <Database className="w-3.5 h-3.5 text-blue-500" />
          <span>Last Auto-Backup: </span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {formatDate(stats.lastBackupTime)} {formatTime(stats.lastBackupTime)}
          </span>
        </div>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Today's Intake */}
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-5 flex flex-col justify-between shadow-sm select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Intake</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 font-mono">
              {stats.todayCollections.total.toFixed(2)} <span className="text-sm font-bold text-slate-400">L</span>
            </h3>
            <div className="flex gap-4 text-[10px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-500" />
                <span>Morning: {stats.todayCollections.morning.toFixed(1)}L</span>
              </span>
              <span className="flex items-center gap-1">
                <Moon className="w-3 h-3 text-blue-400" />
                <span>Evening: {stats.todayCollections.evening.toFixed(1)}L</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Payouts Revenue */}
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-5 flex flex-col justify-between shadow-sm select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Cost / Value</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 font-mono">
              ₹{stats.todayCollections.value.toFixed(2)}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span>Month Revenue: ₹{stats.monthlyRevenue.toFixed(2)}</span>
            </p>
          </div>
        </div>

        {/* Card 3: Farmers Directory */}
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-5 flex flex-col justify-between shadow-sm select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Farmers</span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 font-mono">
              {stats.farmers.total}
            </h3>
            <div className="flex gap-4 text-[10px] text-slate-400 font-medium">
              <span>Active: <span className="text-emerald-600 font-bold">{stats.farmers.active}</span></span>
              <span>Inactive: <span className="text-red-500 font-bold">{stats.farmers.inactive}</span></span>
            </div>
          </div>
        </div>

        {/* Card 4: Outstanding Liability */}
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-5 flex flex-col justify-between shadow-sm select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding Dues</span>
            <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-955 flex items-center justify-center text-red-500">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <h3 className="text-3xl font-black text-red-600 dark:text-red-400 font-mono">
              ₹{stats.payments.outstandingAmount.toFixed(2)}
            </h3>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium leading-none">
              <span>Unpaid Bills: {stats.payments.pendingCount}</span>
              <span>Bills Today: {stats.billing.billsGeneratedToday}</span>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Quick Navigation & Actions */}
        <div className="space-y-6 lg:col-span-1">
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-2 select-none">
              Operations Center
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              <Link
                to="/admin/billing/generate"
                className="flex items-center gap-3 p-3 rounded-md border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-slate-800/10 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium text-xs transition"
              >
                <PlusCircle className="w-4 h-4 text-blue-500" />
                <span>Compile Invoicing Run</span>
              </Link>
              <Link
                to="/admin/invoices"
                className="flex items-center gap-3 p-3 rounded-md border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-slate-800/10 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium text-xs transition"
              >
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Manage Bill Invoices</span>
              </Link>
              <Link
                to="/admin/payments"
                className="flex items-center gap-3 p-3 rounded-md border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-slate-800/10 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium text-xs transition"
              >
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <span>Payments Ledger</span>
              </Link>
              <Link
                to="/admin/reports"
                className="flex items-center gap-3 p-3 rounded-md border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-slate-800/10 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium text-xs transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-purple-500" />
                <span>Excel & PDF Reports</span>
              </Link>
              <Link
                to="/admin/analytics"
                className="flex items-center gap-3 p-3 rounded-md border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-slate-800/10 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium text-xs transition"
              >
                <TrendingUp className="w-4 h-4 text-rose-500" />
                <span>Interactive Analytics Charts</span>
              </Link>
            </div>
          </div>

          {/* Today's Payments Summary */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-3.5 shadow-sm select-none">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-dark-border pb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-blue-500" />
              <span>Today's Payments Activity</span>
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Payments Received</p>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-205 mt-0.5">{stats.payments.countToday} Payouts</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Paid Out</p>
                <p className="text-sm font-extrabold text-emerald-600 mt-0.5">₹{stats.payments.valueToday.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Collections & Payments ledgers split */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Recent Intake entries table */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-dark-border flex justify-between items-center select-none">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Recent Milk Intake Logs
              </h3>
              <Link to="/admin/collections" className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-semibold">
                <span>View Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {stats.recentCollections.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-450 select-none">
                No recent collections logged.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-dark-border text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-3">Farmer</th>
                      <th className="p-3">Shift</th>
                      <th className="p-3">Milk Type</th>
                      <th className="p-3">Liters (L)</th>
                      <th className="p-3 text-right">Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                    {stats.recentCollections.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-50/40">
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-250">
                          {c.farmer?.name || 'Deleted'} ({c.farmer?.farmerCode || 'N/A'})
                        </td>
                        <td className="p-3 capitalize">{c.shift}</td>
                        <td className="p-3 uppercase text-[10px] font-bold text-slate-500">{c.milkType}</td>
                        <td className="p-3 font-semibold">{c.quantity.toFixed(2)} L</td>
                        <td className="p-3 font-extrabold text-slate-800 dark:text-slate-205 text-right">₹{c.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Payments registry logs */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-dark-border flex justify-between items-center select-none">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Recent Payout Transactions
              </h3>
              <Link to="/admin/payments" className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-semibold">
                <span>View Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {stats.recentPayments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-450 select-none">
                No recent payout transactions.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-dark-border text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-3">Payment No.</th>
                      <th className="p-3">Farmer</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Mode</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                    {stats.recentPayments.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/40">
                        <td className="p-3 font-mono font-bold text-slate-600">{p.paymentNumber}</td>
                        <td className="p-3 font-semibold text-slate-850 dark:text-slate-250">
                          {p.farmer?.name || 'Deleted'} ({p.farmer?.farmerCode || 'N/A'})
                        </td>
                        <td className="p-3 text-slate-500">{formatDate(p.paymentDate)}</td>
                        <td className="p-3">{p.paymentMode}</td>
                        <td className="p-3 font-extrabold text-emerald-600 text-right">₹{p.paidAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
